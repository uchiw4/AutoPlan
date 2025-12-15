import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { google } from 'googleapis';

// Ce petit serveur Express sert de proxy sécurisé entre ton front et l'API Twilio.
// Il lit ton SID et ton Auth Token dans les variables d'environnement :
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//
// (Ne les mets jamais en dur dans le code !)

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.warn(
    'ATTENTION: TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN non définis dans les variables d’environnement.'
  );
}

// Endpoint Twilio direct (équivalent au curl fourni)
const TWILIO_MESSAGES_URL = accountSid
  ? `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  : null;

// --- Google Calendar / OAuth ---
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI = 'http://localhost:4000/auth/google/callback',
  GOOGLE_CALENDAR_ID,
} = process.env;

const oauth2Client =
  GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
    ? new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
    : null;

let googleTokens = null; // In-memory for dev; à persister autrement en prod.

app.post('/api/twilio/send-message', async (req, res) => {
  const { to, from, body } = req.body || {};

  if (!to || !from || !body) {
    return res.status(400).json({ error: 'Champs requis: to, from, body' });
  }

  if (!accountSid || !authToken || !TWILIO_MESSAGES_URL) {
    console.error('Twilio credentials manquants côté serveur. Abandon.');
    return res.status(500).json({ error: 'Twilio credentials manquants' });
  }

  console.log('[Twilio] Reçu requête', { to, from, body });

  try {
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', from);
    params.append('Body', body);

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const twilioResp = await fetch(TWILIO_MESSAGES_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const text = await twilioResp.text();

    if (!twilioResp.ok) {
      console.error('[Twilio] Erreur', twilioResp.status, text);
      return res.status(500).json({ error: 'Erreur Twilio', status: twilioResp.status, body: text });
    }

    console.log('[Twilio] Message envoyé, réponse:', text);
    return res.status(200).json({ ok: true, twilio: text });
  } catch (err) {
    console.error('Erreur Twilio (network/fetch):', err);
    return res.status(500).json({ error: 'Erreur lors de l’envoi avec Twilio', details: err?.message });
  }
});

// --- Google OAuth routes ---
app.get('/auth/google', (req, res) => {
  if (!oauth2Client) {
    return res.status(500).send('Google OAuth non configuré (client id/secret manquants).');
  }
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  if (!oauth2Client) {
    return res.status(500).send('Google OAuth non configuré.');
  }
  const code = req.query.code;
  if (!code) return res.status(400).send('Code manquant.');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    googleTokens = tokens;
    oauth2Client.setCredentials(tokens);
    return res.send('Authentification Google réussie. Vous pouvez fermer cette fenêtre.');
  } catch (err) {
    console.error('Erreur OAuth Google:', err);
    return res.status(500).send('Erreur lors de la récupération du token Google.');
  }
});

app.get('/api/google/events', async (req, res) => {
  if (!oauth2Client || !googleTokens) {
    return res.status(401).json({ error: 'Non authentifié Google' });
  }
  if (!GOOGLE_CALENDAR_ID) {
    return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
  }

  const { timeMin, timeMax } = req.query;
  oauth2Client.setCredentials(googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const now = timeMin ? new Date(timeMin) : new Date();
    const max = timeMax ? new Date(timeMax) : (() => {
      const d = new Date(); d.setDate(d.getDate() + 7); return d;
    })();
    const resp = await calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: max.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.json(resp.data.items || []);
  } catch (err) {
    console.error('Erreur lecture Google Calendar:', err);
    return res.status(500).json({ error: 'Erreur lecture Google Calendar', details: err?.message });
  }
});

app.post('/api/google/events', async (req, res) => {
  if (!oauth2Client || !googleTokens) {
    return res.status(401).json({ error: 'Non authentifié Google' });
  }
  if (!GOOGLE_CALENDAR_ID) {
    return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
  }

  const { summary, description, start, end } = req.body || {};
  if (!summary || !start || !end) {
    return res.status(400).json({ error: 'Champs requis: summary, start, end' });
  }

  oauth2Client.setCredentials(googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const resp = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: {
        summary,
        description: description || '',
        start: { dateTime: start },
        end: { dateTime: end },
        extendedProperties: req.body?.extendedProperties,
      },
    });
    return res.json({ ok: true, id: resp.data.id });
  } catch (err) {
    console.error('Erreur création Google Calendar:', err);
    return res.status(500).json({ error: 'Erreur création Google Calendar', details: err?.message });
  }
});

app.patch('/api/google/events/:id', async (req, res) => {
  if (!oauth2Client || !googleTokens) {
    return res.status(401).json({ error: 'Non authentifié Google' });
  }
  if (!GOOGLE_CALENDAR_ID) {
    return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
  }
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id requis' });

  oauth2Client.setCredentials(googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { summary, description, start, end, confirmed } = req.body || {};

  try {
    // Récupérer l'event existant pour merger les extendedProperties
    const existing = await calendar.events.get({ calendarId: GOOGLE_CALENDAR_ID, eventId: id });
    const prev = existing.data.extendedProperties?.private || {};
    const updatedExtended = {
      ...prev,
      ...(confirmed !== undefined ? { confirmed: confirmed ? 'true' : 'false' } : {}),
    };

    const resp = await calendar.events.patch({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: id,
      requestBody: {
        summary,
        description,
        start: start ? { dateTime: start } : undefined,
        end: end ? { dateTime: end } : undefined,
        extendedProperties: { private: updatedExtended },
      },
    });
    return res.json({ ok: true, id: resp.data.id });
  } catch (err) {
    console.error('Erreur update Google Calendar:', err);
    return res.status(500).json({ error: 'Erreur update Google Calendar', details: err?.message });
  }
});

app.delete('/api/google/events/:id', async (req, res) => {
  if (!oauth2Client || !googleTokens) {
    return res.status(401).json({ error: 'Non authentifié Google' });
  }
  if (!GOOGLE_CALENDAR_ID) {
    return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
  }
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id requis' });

  oauth2Client.setCredentials(googleTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    await calendar.events.delete({ calendarId: GOOGLE_CALENDAR_ID, eventId: id });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erreur delete Google Calendar:', err);
    return res.status(500).json({ error: 'Erreur delete Google Calendar', details: err?.message });
  }
});

app.listen(port, () => {
  console.log(`Twilio proxy server listening on http://localhost:${port}`);
});


