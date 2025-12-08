import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';

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

app.listen(port, () => {
  console.log(`Twilio proxy server listening on http://localhost:${port}`);
});


