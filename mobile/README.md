# SoundProof — Application mobile

Application **React Native / Expo** (TypeScript) de SoundProof : réservation de salles de répétition, réservation de matériel et chat temps réel par salle.

## Structure

```
mobile/
├── app/     # Écrans (Expo Router, navigation par fichiers)
├── src/
│   ├── api/         # Client HTTP (Axios) et appels API
│   ├── components/  # Composants d'interface réutilisables
│   ├── features/    # Logique par fonctionnalité (auth, réservations, chat…)
│   ├── hooks/       # Hooks React partagés
│   └── lib/         # Utilitaires purs (créneaux, thème…)
├── e2e/     # Flows Maestro (tests E2E)
└── assets/  # Icônes, splash screen
```

## Démarrage

```bash
cp .env.example .env   # puis renseigner EXPO_PUBLIC_API_URL (voir README racine)
npm install
npm run dev            # démarre le serveur de développement Expo
```

Scanner le QR code avec **Expo Go**, ou appuyer sur `a` pour lancer l'émulateur Android.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Serveur de développement Expo |
| `npm run lint` | ESLint (`eslint-config-expo` + Prettier) |
| `npm run format` | Formatage Prettier |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `npm test` / `npm run test:cov` | Tests Jest (preset `jest-expo`) / avec couverture |
