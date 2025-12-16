import { requireAuth } from '../../lib/googleAuth.js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

  // GET /api/google/events
  if (req.method === 'GET') {
    const authResult = requireAuth(req, res);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    if (!GOOGLE_CALENDAR_ID) {
      return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
    }

    const { timeMin, timeMax } = req.query;
    const { oauth2Client } = authResult;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const now = timeMin ? new Date(timeMin) : new Date();
      const max = timeMax
        ? new Date(timeMax)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
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
  }

  // POST /api/google/events
  if (req.method === 'POST') {
    const authResult = requireAuth(req, res);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    if (!GOOGLE_CALENDAR_ID) {
      return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
    }

    const { summary, description, start, end } = req.body || {};
    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Champs requis: summary, start, end' });
    }

    const { oauth2Client } = authResult;
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

