export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, from, body } = req.body || {};

  if (!to || !from || !body) {
    return res.status(400).json({ error: 'Champs requis: to, from, body' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Twilio credentials manquants côté serveur. Abandon.');
    return res.status(500).json({ error: 'Twilio credentials manquants' });
  }

  const TWILIO_MESSAGES_URL = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

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
    return res.status(500).json({ error: 'Erreur lors de l\'envoi avec Twilio', details: err?.message });
  }
}

