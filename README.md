# AutoPlanning

Application web React/TypeScript pour gérer les élèves, moniteurs et planning de cours (auto-école). Les données sont stockées dans le localStorage du navigateur, avec un petit serveur Node pour proxy Twilio et envoyer des notifications SMS/WhatsApp.

## Fonctionnalités principales
- Tableau de bord avec stats (élèves, moniteurs, cours de la semaine) et prochains cours.
- Planning hebdo et vue par moniteur (créneaux cliquables, création de cours via modale).
- Gestion des élèves : création, recherche, édition, suppression.
- Gestion des moniteurs : création, couleur de planning, suppression.
- Paramètres Twilio : configuration SID/Auth Token/numéro expéditeur, choix SMS ou WhatsApp.
- Notification de confirmation de cours (appel backend Twilio) lors du bouton “Confirmer le cours (Notifier)”.

## Stack technique
- Front : React 19, TypeScript, Vite.
- UI : Tailwind utility classes + composants internes (Button, Modal).
- Date/format : date-fns.
- Icônes : lucide-react.
- Backend : API Routes Vercel (serverless functions) pour Twilio et Google Calendar.
- APIs externes : Twilio REST API, Google Calendar API.

## Prérequis
- Node.js (version 18+ recommandée).
- Compte Twilio avec un numéro (SMS ou WhatsApp).

## Installation
1. Cloner le dépôt.
2. Installer les dépendances :
   ```bash
   npm install
   ```

## Configuration

### Variables d'environnement (développement local)

Créer un fichier `.env.local` à la racine pour le développement local :

```bash
# Twilio (optionnel, peut être configuré dans l'écran Paramètres)
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
VITE_TWILIO_API_URL=http://localhost:4000/api/twilio/send-message

# Google Calendar (pour le backend local)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
GOOGLE_CALENDAR_ID=primary
```

### Variables d'environnement (déploiement Vercel)

Dans le dashboard Vercel, ajouter les variables d'environnement suivantes :

**Variables système (automatiques)** :
- `VERCEL_URL` : défini automatiquement par Vercel

**Variables à configurer** :
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://ton-app.vercel.app/api/auth/google/callback
GOOGLE_CALENDAR_ID=primary   # ou l'ID d'un agenda partagé
```

**Important** : Remplace `https://ton-app.vercel.app` par l'URL réelle de ton déploiement Vercel, et configure le même URI dans la Google Cloud Console.

## Démarrage

### Développement local

**Option 1 : Avec le serveur Express (recommandé pour le dev local)**
```bash
# Terminal 1 : Frontend
npm run dev
# Lance l'app sur http://localhost:3000

# Terminal 2 : Backend Express
npm run twilio-server
# Expose les API sur http://localhost:4000
```

Le frontend détecte automatiquement qu'il est en localhost et utilise `http://localhost:4000/api` pour les appels backend.

**Option 2 : Avec Vercel CLI (pour tester les API Routes Vercel)**
```bash
# Installer Vercel CLI globalement
npm i -g vercel

# Lancer en mode dev
vercel dev
# Lance l'app avec les API Routes sur http://localhost:3000
```

**Note** : En développement local, l'Option 1 est recommandée car elle ne nécessite pas Vercel CLI et fonctionne immédiatement.

### Authentification Google

1. **En développement local** :
   - Visite `http://localhost:4000/api/auth/google` (si serveur Express)
   - Ou `http://localhost:3000/api/auth/google` (si Vercel dev)

2. **En production (Vercel)** :
   - Visite `https://ton-app.vercel.app/api/auth/google`
   - Autorise l'application (scope calendar.events)
   - Le token est stocké dans les cookies du navigateur

### Déploiement sur Vercel

1. **Connecter le dépôt GitHub à Vercel** :
   - Va sur [vercel.com](https://vercel.com)
   - Importe ton dépôt GitHub
   - Vercel détecte automatiquement Vite

2. **Configurer les variables d'environnement** :
   - Dans le dashboard Vercel → Settings → Environment Variables
   - Ajoute toutes les variables listées ci-dessus

3. **Configurer Google OAuth** :
   - Dans Google Cloud Console, ajoute l'URI de redirection :
     `https://ton-app.vercel.app/api/auth/google/callback`
   - Remplace `ton-app.vercel.app` par ton domaine Vercel

4. **Déployer** :
   - Push sur la branche `main` → déploiement automatique
   - Ou déclenche un déploiement manuel depuis le dashboard

## Utilisation (notification)
1. Dans l’app, onglet Paramètres :
   - Renseigner Account SID, Auth Token, Numéro d’expédition Twilio, Méthode (SMS/WhatsApp).
   - Enregistrer.
2. Créer un élève avec un numéro au format E.164 (ex : `+337...`).
3. Planifier un cours dans le planning.
4. Cliquer “Confirmer le cours (Notifier)” : le front appelle le backend, qui envoie le message via Twilio.

## Scripts npm utiles
- `npm run dev` : front Vite.
- `npm run build` : build front.
- `npm run preview` : preview Vite.
- `npm run twilio-server` : serveur proxy Twilio.

## Structure (principaux fichiers)

**Frontend** :
- `App.tsx`, `components/Layout.tsx` : navigation par vue (sans router).
- `pages/Dashboard.tsx`, `pages/Planning.tsx`, `pages/Students.tsx`, `pages/Instructors.tsx`, `pages/Settings.tsx`.
- `components/ui/Button.tsx`, `components/ui/Modal.tsx`.
- `services/storage.ts` (localStorage), `services/notification.ts`, `services/googleCalendar.ts`.
- `types.ts` : types partagés (élève, moniteur, cours, settings).

**Backend (API Routes Vercel)** :
- `api/twilio/send-message.js` : endpoint pour envoyer des SMS/WhatsApp via Twilio.
- `api/auth/google.js` : redirection vers Google OAuth.
- `api/auth/google/callback.js` : callback OAuth, stocke les tokens dans les cookies.
- `api/google/events.js` : GET (liste) et POST (création) d'événements Google Calendar.
- `api/google/events/[id].js` : PATCH (mise à jour) et DELETE (suppression) d'événements.
- `api/health.js` : endpoint de vérification de l'état du backend.
- `lib/googleAuth.js` : utilitaires pour gérer OAuth et tokens Google.

**Ancien backend (optionnel, pour dev local)** :
- `twilio-server.js` : serveur Express pour développement local (port 4000).

## Notes

- **Stockage** : Les données élèves/moniteurs/paramètres sont persistées en localStorage. Les cours sont stockés dans Google Calendar.
- **Sécurité** : Les clés API (Twilio, Google) sont stockées dans les variables d'environnement Vercel, jamais dans le code.
- **Tokens Google** : En production, les tokens OAuth sont stockés dans les cookies du navigateur. Pour une sécurité renforcée, considère utiliser un stockage externe (Vercel KV, base de données).
- **Health Check** : Visite `/api/health` pour vérifier l'état du backend et des services configurés.

