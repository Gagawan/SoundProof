# SoundProof — API backend

API **NestJS** (TypeScript) de SoundProof : REST (`/api/v1`) + WebSocket Socket.IO pour le chat temps réel. Persistance **PostgreSQL** via **Prisma**.

## Démarrage

```bash
cp .env.example .env      # puis renseigner les secrets
docker compose up -d      # depuis la racine du dépôt : démarre PostgreSQL
npm install
npm run dev               # API en mode watch sur http://localhost:3000
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | API en mode watch (hot-reload) |
| `npm run build` | Compilation production (`dist/`) |
| `npm run lint` / `npm run lint:fix` | ESLint (vérification / correction) |
| `npm run format` | Formatage Prettier |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `npm test` / `npm run test:cov` | Tests unitaires Jest / avec couverture |
| `npm run test:e2e` | Tests e2e API (Supertest) |
