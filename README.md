# SunuGestion — Frontend

Application web de SunuGestion, pour la gestion des groupements (GIE, associations) : espace du groupement (membres, cotisations, prêts, activités, rapports, assistant financier), espace administrateur, inscription et site vitrine.

**Stack :** Angular 22 (composants autonomes, signals) · PrimeNG 21 · Tailwind CSS 4 · Chart.js · TypeScript 6.

L'API est le projet Django `sunugestion-backend`. Pour lancer l'ensemble avec Docker, voir `SunuGestion-Docker/README.md`.

---

## Installation (développement)

Prérequis : Node.js 22, et le backend lancé sur `http://localhost:8000`.

```bash
npm install --legacy-peer-deps   # PrimeNG 21 déclare Angular 21 en dépendance
npm start                        # ng serve → http://localhost:4200
```

`ng serve` transmet `/api`, `/ocr` et `/media` au backend grâce à `proxy.conf.json`. Les appels restent donc relatifs, et l'application fonctionne aussi à travers ngrok. Après une modification de `proxy.conf.json`, relancer `ng serve`.

## Construction et tests

```bash
npm run build    # production → dist/sunugestion/browser
npm test         # tests unitaires (Vitest) ; aucun test n'est encore écrit
```

---

## Configuration

`src/environments/environment.ts` (production) et `environment.development.ts` :

| Clé | Rôle |
|---|---|
| `API_URL` | `'/api/'` : relatif, transmis au backend par le proxy (développement) ou par nginx (Docker) |
| `URL_PUBLIQUE` | Adresse publique utilisée dans les **liens d'activation** envoyés aux membres par WhatsApp. En développement, l'adresse ngrok fixe ; au déploiement, le vrai domaine |

---

## Structure

```
src/app/
├── core/
│   ├── services/      appels à l'API (un service par domaine)
│   ├── models/        interfaces TypeScript des données
│   ├── interceptors/  auth.interceptor : ajoute le jeton JWT aux requêtes
│   └── guards/        auth, role, admin : accès selon la connexion et le rôle
├── features/
│   ├── landing-page/  site vitrine
│   ├── auth/          connexion
│   ├── inscription/   création d'un groupement (GIE, compte, OTP)
│   ├── espace-gie/    espace du groupement (/mon-espace/...)
│   └── espace-admin/  espace administrateur de la plateforme
├── shared/            composants d'interface (navbar, sidebar…) et pipes
├── layout/            mises en page (auth, principale, mobile)
└── theme/             thème PrimeNG (sunugestion-preset)
```

**Points à connaître :**

- La session (jetons JWT et utilisateur) est gardée dans le `localStorage`.
- Les clés JSON de l'API sont en camelCase (conversion faite par le backend).
- Les pages ont deux affichages, ordinateur et mobile, dans le même gabarit HTML : une modification d'interface se fait souvent aux deux endroits.

---

## Docker

Fichiers propres à Docker dans ce dossier :

- `Dockerfile` : construction Angular (Node 22) puis service par nginx 1.27 ;
- `nginx.conf` :
  - sert l'application, avec un retour sur `index.html` qui permet d'actualiser n'importe quelle page ;
  - transmet `/api`, `/ocr`, `/admin` et `/static` au backend, et sert les logos (`/media`) depuis le volume partagé ;
  - envois limités à 6 Mo, en-têtes de sécurité, version de nginx masquée ;
  - `/admin/` fermé à travers ngrok.

Utilisation : voir `SunuGestion-Docker/README.md`.
