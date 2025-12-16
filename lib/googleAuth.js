import { google } from 'googleapis';

// Helper pour créer le client OAuth2
export function getOAuth2Client() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/google/callback`
  );
}

// Helper pour récupérer les tokens depuis les cookies
export function getTokensFromCookies(req) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {});

    const tokensStr = cookies['google_tokens'];
    if (!tokensStr) return null;

    return JSON.parse(tokensStr);
  } catch (err) {
    console.error('Erreur lecture tokens depuis cookies:', err);
    return null;
  }
}

// Helper pour sauvegarder les tokens dans les cookies
export function setTokensInCookies(res, tokens) {
  const tokensStr = JSON.stringify(tokens);
  // Cookie avec httpOnly pour la sécurité (mais Vercel serverless ne supporte pas httpOnly directement)
  // On utilise Secure et SameSite pour la sécurité
  const cookieOptions = [
    `google_tokens=${encodeURIComponent(tokensStr)}`,
    'Path=/',
    'SameSite=Lax',
    process.env.VERCEL_URL ? 'Secure' : '', // Secure seulement en HTTPS
    'Max-Age=31536000', // 1 an
  ].filter(Boolean).join('; ');

  res.setHeader('Set-Cookie', cookieOptions);
}

// Helper pour vérifier l'authentification
export function requireAuth(req, res) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return { error: 'Google OAuth non configuré', status: 500 };
  }

  const tokens = getTokensFromCookies(req);
  if (!tokens) {
    return { error: 'Non authentifié Google', status: 401 };
  }

  oauth2Client.setCredentials(tokens);
  return { oauth2Client, tokens };
}

