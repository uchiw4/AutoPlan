# Guide de déploiement Vercel

## ✅ Conversion terminée

L'application a été convertie en API Routes Vercel. Tous les endpoints sont maintenant disponibles sous `/api/...`.

## 📁 Structure créée

```
api/
  ├── twilio/
  │   └── send-message.js          # POST /api/twilio/send-message
  ├── auth/
  │   └── google/
  │       ├── google.js            # GET /api/auth/google
  │       └── callback.js          # GET /api/auth/google/callback
  ├── google/
  │   └── events/
  │       ├── events.js            # GET, POST /api/google/events
  │       └── [id].js              # PATCH, DELETE /api/google/events/:id
  └── health.js                    # GET /api/health

lib/
  └── googleAuth.js                # Utilitaires OAuth Google
```

## 🚀 Étapes de déploiement

### 1. Préparer le dépôt

```bash
git add .
git commit -m "Convert to Vercel API Routes"
git push
```

### 2. Connecter à Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Clique sur "Add New Project"
3. Importe ton dépôt GitHub
4. Vercel détecte automatiquement Vite

### 3. Configurer les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables, ajoute :

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=https://ton-app.vercel.app/api/auth/google/callback
GOOGLE_CALENDAR_ID=primary
```

**Important** : Remplace `ton-app.vercel.app` par l'URL réelle de ton déploiement.

### 4. Configurer Google OAuth

1. Va dans [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionne ton projet OAuth
3. Va dans "APIs & Services" → "Credentials"
4. Édite ton OAuth 2.0 Client ID
5. Ajoute dans "Authorized redirect URIs" :
   ```
   https://ton-app.vercel.app/api/auth/google/callback
   ```
6. Sauvegarde

### 5. Déployer

- Push sur `main` → déploiement automatique
- Ou déclenche un déploiement manuel depuis le dashboard

### 6. Authentifier Google

1. Visite `https://ton-app.vercel.app/api/auth/google`
2. Autorise l'application
3. Le token est stocké dans les cookies

### 7. Vérifier le déploiement

Visite `https://ton-app.vercel.app/api/health` pour vérifier l'état :
```json
{
  "status": "ok",
  "services": {
    "twilio": { "configured": true, "ready": true },
    "google": { "oauthConfigured": true, "authenticated": true }
  }
}
```

## 🔧 Développement local avec Vercel

Pour tester les API Routes localement :

```bash
# Installer Vercel CLI
npm i -g vercel

# Lancer en mode dev
vercel dev
```

L'app sera disponible sur `http://localhost:3000` avec les API Routes fonctionnelles.

## 📝 Notes importantes

- **Cookies** : Les tokens Google sont stockés dans les cookies du navigateur. Pour une sécurité renforcée en production, considère utiliser Vercel KV ou une base de données.
- **CORS** : Les headers CORS sont configurés dans `vercel.json` pour permettre les requêtes depuis le frontend.
- **Ancien backend** : Le fichier `twilio-server.js` reste disponible pour le développement local si besoin, mais n'est plus nécessaire en production.

## 🐛 Dépannage

### Erreur "Non authentifié Google"
- Vérifie que tu as visité `/api/auth/google` et autorisé l'application
- Vérifie que les cookies sont activés dans ton navigateur
- Vérifie que `GOOGLE_REDIRECT_URI` correspond exactement à l'URI configuré dans Google Cloud Console

### Erreur CORS
- Vérifie que `vercel.json` est présent à la racine
- Les headers CORS sont déjà configurés, mais tu peux les ajuster si nécessaire

### Erreur 404 sur les API Routes
- Vérifie que le dossier `api/` est bien à la racine du projet
- Vérifie que les fichiers ont l'extension `.js` (pas `.ts`)
- Vérifie que chaque fichier exporte une fonction `handler` par défaut

