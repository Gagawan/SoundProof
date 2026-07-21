# Tests E2E Maestro — SoundProof

Flows d'automatisation des parcours du cahier de recettes (`docs/07-cahier-de-recettes.md`), exécutés en local sur un émulateur ou un appareil Android.

## Prérequis

1. **API + base de données** démarrées et **seedées** :
   ```bash
   docker compose up -d
   cd backend && npx prisma db seed && npm run dev
   ```
2. **Application lancée** : Expo Go en développement (`cd mobile && npm run dev`) ou APK `preview` installé.
3. **Maestro installé** : voir https://maestro.mobile.dev (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
4. Émulateur Android démarré (Android Studio) ou appareil physique connecté.

## Exécution

```bash
cd mobile
maestro test e2e/                          # tous les flows, dans l'ordre
maestro test e2e/03-conflit-creneau.yaml   # un flow précis
```

## Convention

- `appId: host.exp.Exponent` cible **Expo Go** (développement).
  Pour l'APK `preview`, remplacer par `com.soundproof.app` dans chaque flow.
- Les flows supposent une base **fraîchement seedée** et un compte de départ non connecté.
- Certains flows créent des données (réservations) : réinitialiser le seed entre deux campagnes complètes.

## Correspondance flows ↔ scénarios de recette

| Flow | Scénarios |
| --- | --- |
| `01-inscription-connexion.yaml` | TF-001, TF-004 |
| `02-reservation-complete.yaml` | TF-010, TF-012 |
| `03-conflit-creneau.yaml` | TF-011 |
| `04-annulation.yaml` | TF-015 |
| `05-chat.yaml` | TF-016 |
| `06-admin-absent-membre.yaml` | TF-021 |
