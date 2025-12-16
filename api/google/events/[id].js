import { requireAuth } from '../../../lib/googleAuth.js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id requis' });
  }

  const authResult = requireAuth(req, res);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  if (!GOOGLE_CALENDAR_ID) {
    return res.status(400).json({ error: 'GOOGLE_CALENDAR_ID manquant' });
  }

  const { oauth2Client } = authResult;
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // PATCH /api/google/events/:id
  if (req.method === 'PATCH') {
    const { summary, description, start, end, confirmed } = req.body || {};

    try {
      // Récupérer l'event existant pour merger les extendedProperties
      const existing = await calendar.events.get({
        calendarId: GOOGLE_CALENDAR_ID,
        eventId: id,
      });
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
  }

  // DELETE /api/google/events/:id
  if (req.method === 'DELETE') {
    try {
      await calendar.events.delete({
        calendarId: GOOGLE_CALENDAR_ID,
        eventId: id,
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error('Erreur delete Google Calendar:', err);
      return res.status(500).json({ error: 'Erreur delete Google Calendar', details: err?.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

