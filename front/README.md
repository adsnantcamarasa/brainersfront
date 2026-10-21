# Brainers — front Angular

Le front de Brainers : rechercher une note par son titre, créer une note, afficher une note.
Angular 22 + Spartan UI (Tailwind v4), branché sur le back Spring du dossier `demo/`.

👉 **Le guide complet, qui explique chaque fichier et chaque choix : [GUIDE.md](GUIDE.md).**

## Prérequis

- **Node.js 24** (ou 22.22.3 minimum) : `node -v` pour vérifier. Avec nvm : `nvm install && nvm use` (lit `.nvmrc`).
- Le back Spring démarré sur le port **8080**.

## Lancer

```bash
# Terminal 1 — le back
cd demo
./mvnw spring-boot:run

# Terminal 2 — le front
cd front
npm install      # la première fois seulement
npm start        # = ng serve → http://localhost:4200
```

Le front appelle `/api/...`. Le proxy de développement (`proxy.conf.json`) transmet ces appels
à `http://localhost:8080` en retirant `/api`. Pas de CORS à configurer côté Spring.

## Scripts

| Commande | Rôle |
| :--- | :--- |
| `npm start` | Serveur de développement (rechargement automatique) |
| `npm run build` | Build de production dans `dist/` |
| `npm test` | Tests unitaires en continu (Vitest) |
| `npm run test:ci` | Tests unitaires une seule fois |
| `npm run test:coverage` | Tests + rapport de couverture dans `coverage/` (seuil : 80 %) |

## Structure

```text
src/app/
├── app.ts / app.html        la coquille (en-tête + <router-outlet>)
├── app.config.ts            ce qui est branché au démarrage (routeur, HttpClient, langue)
├── app.routes.ts            quelle URL affiche quelle page
├── notes/
│   ├── data/                le contrat avec le back + le service HTTP
│   ├── pages/               les écrans liés à une URL
│   └── components/          les morceaux d'écran
└── shared/validators/       validateurs de formulaire réutilisables
libs/ui/                     composants Spartan UI (copiés dans le projet, modifiables)
```
