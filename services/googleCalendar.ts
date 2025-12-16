import { Lesson } from '../types';

// Endpoint backend pour Google Calendar
// En production Vercel, utilise automatiquement /api/google/events
// En dev local, utilise le serveur Express sur http://localhost:4000/api
const getBackendUrl = () => {
  // Si VITE_BACKEND_URL est défini, l'utiliser
  if ((import.meta as any).env?.VITE_BACKEND_URL) {
    return (import.meta as any).env.VITE_BACKEND_URL;
  }
  
  // En développement local (localhost), utiliser le serveur Express
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000/api';
  }
  
  // En production Vercel, utiliser les routes relatives
  return '';
};

const BACKEND_URL = getBackendUrl();
const GOOGLE_EVENTS_URL = BACKEND_URL 
  ? `${BACKEND_URL}/google/events`
  : '/api/google/events';

export const GoogleCalendarService = {
  async listRange(timeMin: string, timeMax: string): Promise<any[]> {
    try {
      const url = `${GOOGLE_EVENTS_URL}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('GoogleCalendarService.listRange error', err);
      return [];
    }
  },

  async createEventFromLesson(lesson: Lesson, summary: string, description: string) {
    try {
      const res = await fetch(GOOGLE_EVENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          description,
          start: lesson.start,
          end: lesson.end,
          extendedProperties: {
            private: {
              studentId: lesson.studentId,
              instructorId: lesson.instructorId,
              confirmed: lesson.confirmed ? 'true' : 'false',
            },
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn('GoogleCalendarService.createEventFromLesson backend error', res.status, text);
      }
    } catch (err) {
      console.warn('GoogleCalendarService.createEventFromLesson error', err);
    }
  },

  async updateEvent(id: string, payload: Partial<{ summary: string; description: string; start: string; end: string; confirmed: boolean }>) {
    try {
      const res = await fetch(`${GOOGLE_EVENTS_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn('GoogleCalendarService.updateEvent backend error', res.status, text);
      }
    } catch (err) {
      console.warn('GoogleCalendarService.updateEvent error', err);
    }
  },

  async deleteEvent(id: string) {
    try {
      const res = await fetch(`${GOOGLE_EVENTS_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        console.warn('GoogleCalendarService.deleteEvent backend error', res.status, text);
      }
    } catch (err) {
      console.warn('GoogleCalendarService.deleteEvent error', err);
    }
  },
};

