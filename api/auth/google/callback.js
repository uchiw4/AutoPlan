import { getOAuth2Client, setTokensInCookies } from '../../../lib/googleAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return res.status(500).send('Google OAuth non configuré.');
  }

  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Code manquant.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    setTokensInCookies(res, tokens);

    return res.send('Authentification Google réussie. Vous pouvez fermer cette fenêtre.');
  } catch (err) {
    console.error('Erreur OAuth Google:', err);
    return res.status(500).send('Erreur lors de la récupération du token Google.');
  }
}

