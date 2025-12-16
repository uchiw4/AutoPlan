import { getTokensFromCookies } from '../lib/googleAuth.js';

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

  const TWILIO_MESSAGES_URL = accountSid
    ? `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    : null;

  const googleTokens = getTokensFromCookies(req);

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      twilio: {
        configured: !!(accountSid && authToken),
        ready: !!(accountSid && authToken && TWILIO_MESSAGES_URL),
      },
      google: {
        oauthConfigured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
        authenticated: !!googleTokens,
        calendarId: GOOGLE_CALENDAR_ID || null,
      },
    },
  };

  // Si tout est OK, retourner 200, sinon 503 (Service Unavailable)
  const allGood = health.services.twilio.configured && health.services.google.oauthConfigured;
  const statusCode = allGood ? 200 : 503;

  return res.status(statusCode).json(health);
}

