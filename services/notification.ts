import { Lesson, Student, Instructor, AppSettings } from '../types';

// Endpoint backend qui enverra réellement le SMS via Twilio.
// Tu peux le surcharger avec VITE_TWILIO_API_URL dans un .env.local si besoin.
const TWILIO_API_URL =
  (import.meta as any).env?.VITE_TWILIO_API_URL || 'http://localhost:4000/api/twilio/send-message';

export const NotificationService = {
  sendConfirmation: async (
    lesson: Lesson,
    student: Student,
    instructor: Instructor,
    settings: AppSettings
  ): Promise<boolean> => {
    // On tolère un fallback via variables d'env Vite (VITE_*) pour aider en dev,
    // mais en prod il faut renseigner les paramètres via l'écran Paramètres.
    const env = (import.meta as any).env || {};
    const accountSid = settings.twilioAccountSid || env.VITE_TWILIO_ACCOUNT_SID || '';
    const authToken = settings.twilioAuthToken || env.VITE_TWILIO_AUTH_TOKEN || '';
    const phoneNumber =
      settings.twilioPhoneNumber || env.VITE_TWILIO_PHONE_NUMBER || '';

    const dateStr = new Date(lesson.start).toLocaleDateString('fr-FR');
    const timeStr = new Date(lesson.start).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const message = `Bonjour ${student.firstName}, votre prochain cours sera le ${dateStr} à ${timeStr} avec ${instructor.firstName} ${instructor.lastName}.`;

    // Si les identifiants Twilio ne sont pas remplis dans les paramètres, on ne tente pas l’envoi.
    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('Identifiants Twilio manquants dans les paramètres ou les variables VITE_*, envoi réel annulé.');
      return false;
    }

    const to =
      (settings.notificationMethod === 'WHATSAPP' ? 'whatsapp:' : '') + student.phone;
    const from =
      (settings.notificationMethod === 'WHATSAPP' ? 'whatsapp:' : '') +
      phoneNumber;

    try {
      const res = await fetch(TWILIO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          from,
          body: message,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Erreur lors de l’envoi Twilio côté backend :', res.status, text);
        alert('Échec de l’envoi de la notification (voir console).');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Erreur réseau lors de l’appel au backend Twilio :', err);
      alert('Échec réseau lors de l’envoi de la notification (voir console).');
      return false;
    }
  },
};
