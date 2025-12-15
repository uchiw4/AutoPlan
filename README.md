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
- Backend proxy Twilio : Node + Express + fetch, Twilio REST API, dotenv.

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
### Variables d’environnement (backend Twilio)
Créer un fichier `.env` à la racine pour le serveur Twilio :
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Variables d’environnement (front, optionnel pour le dev)
Pour injecter depuis Vite (fallback si non saisi dans l’écran Paramètres) :
```bash
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_PHONE_NUMBER=+1xxxxxxxxxx   # ou numéro WhatsApp activé
VITE_TWILIO_API_URL=http://localhost:4000/api/twilio/send-message
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
GOOGLE_CALENDAR_ID=primary   # ou l’ID d’un agenda partagé
```
Sinon, remplis directement ces champs dans l’écran “Paramètres” de l’application.

## Démarrage
### Front (Vite)
```bash
npm run dev
```
Lance l’app sur http://localhost:3000.

### Backend proxy Twilio
```bash
npm run twilio-server
```
Expose `POST /api/twilio/send-message` sur http://localhost:4000.

### Auth Google (dev)
- Visite http://localhost:4000/auth/google pour autoriser l’appli (scope calendar.events).  
- Le token est gardé en mémoire (dev). En prod il faut persister et sécuriser (DB/coffre).

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
- `App.tsx`, `components/Layout.tsx` : navigation par vue (sans router).
- `pages/Dashboard.tsx`, `pages/Planning.tsx`, `pages/Students.tsx`, `pages/Instructors.tsx`, `pages/Settings.tsx`.
- `components/ui/Button.tsx`, `components/ui/Modal.tsx`.
- `services/storage.ts` (localStorage), `services/notification.ts` (appel backend Twilio).
- `twilio-server.js` : proxy Node/Express vers l’API Twilio.
- `types.ts` : types partagés (élève, moniteur, cours, settings).

## Notes
- Les données sont persistées en localStorage (pas de base de données).
- Le backend Twilio n’expose qu’un endpoint de notification pour garder SID/Auth Token côté serveur. Assure-toi de ne pas commiter tes clés.***

