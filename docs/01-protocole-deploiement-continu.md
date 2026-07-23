# Protocole de déploiement continu — SoundProof

> **Compétence visée : C2.1.1** — Ce protocole définit les environnements de déploiement et de test du projet ainsi que les séquences de déploiement automatisées. Il couvre **deux artefacts distincts** : l'**API** (conteneur Docker) et l'**application mobile** (binaire Android/iOS produit par EAS Build). Son implémentation technique est le workflow [`.github/workflows/cd.yml`](../.github/workflows/cd.yml).

## 1. Environnements

| Environnement | API                                                                             | Application mobile                                                                                        | Base de données                                  | Usage                                      |
| ------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------ |
| `development` | Locale, mode watch (hot-reload)                                                 | **Expo Go** (rechargement instantané sur téléphone ou émulateur)                                          | PostgreSQL 16 Docker (`docker-compose.yml`)      | Développement quotidien                    |
| `test`        | Démarrée par la CI                                                              | Bundle vérifié par `expo export`                                                                          | PostgreSQL **éphémère** (service GitHub Actions) | Validation automatique de chaque push / PR |
| `preview`     | API de démonstration (conteneurs)                                               | **APK Android installable** (profil EAS `preview`, distribution interne) — c'est le binaire remis au jury | PostgreSQL conteneurisée                         | Recette, démonstration                     |
| `production`  | Conteneurs (`docker-compose.prod.yml`) : image `ghcr.io/gagawan/soundproof-api` | Build de production (**AAB** Android / IPA iOS, profil EAS `production`)                                  | PostgreSQL conteneurisée, non exposée sur l'hôte | Cible de mise en production                |

## 2. Séquences de déploiement de l'API

Reproduites à l'identique dans le job `deploy-api` de `cd.yml` :

1. **Déclencheur** : push d'un tag `v*.*.*` (SemVer) sur `main`.
2. **Exécution complète de la CI** : le workflow CD appelle le workflow CI (`workflow_call`) — aucun déploiement si la CI échoue.
3. **Build de l'image Docker** backend : `backend/Dockerfile` **multi-stage** (stage de build TypeScript → stage runtime minimal, utilisateur non-root).
4. **Push de l'image** sur **GitHub Container Registry** : `ghcr.io/gagawan/soundproof-api`, taguée `latest` **et** avec la version (ex. `v1.0.0`).
5. **Création automatique d'une GitHub Release** avec le contenu de la section correspondante du `CHANGELOG.md`.
6. **Déploiement** sur la machine cible (machine locale ou VPS) :
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```
   (commande documentée ; l'exécution cible une machine locale ou un VPS — voir `docs/09-manuel-deploiement.md`).
7. **Migration de la base de données** : `prisma migrate deploy` est exécuté **au démarrage du conteneur backend** (entrypoint) — les migrations sont donc appliquées automatiquement à chaque mise en production, avant le lancement de l'API.
8. **Vérification post-déploiement** :
   - healthcheck Docker sur `GET /health` (statut de l'API et de la connexion BDD) ;
   - smoke test manuel documenté : connexion avec un compte de test, consultation de la liste des salles.

## 3. Séquences de déploiement de l'application mobile

Job `build-mobile` du même workflow `cd.yml` :

1. **Déclencheur** : le même tag `v*.*.*` (un tag = une version cohérente API + mobile).
2. **Build EAS** : `eas build --platform android --profile preview --non-interactive`, authentifié par le secret GitHub Actions `EXPO_TOKEN`.
3. **Récupération de l'APK** produit par EAS et **attachement à la GitHub Release** : l'APK est téléchargeable et installable directement depuis la page de la Release.
4. **Distribution** : lien de la GitHub Release + QR code fourni par EAS. La publication sur les stores (Google Play / App Store) est **documentée comme étape ultérieure** dans `docs/09-manuel-deploiement.md` mais non exécutée (comptes développeur payants).

## 4. Stratégie de déploiement progressif

Le déploiement suit une progression par paliers, chaque palier élargissant l'exposition :

| Palier               | Déclencheur                                                                                    | Exposition                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1. Intégration       | Fusion d'une branche de travail dans `develop`                                                 | Testable **immédiatement** dans Expo Go par le développeur (rechargement instantané, API locale)       |
| 2. Version candidate | Tag `v*.*.*` sur `main`                                                                        | APK versionné installable produit automatiquement, API packagée sur ghcr.io — recette sur binaire réel |
| 3. Production        | `docker compose -f docker-compose.prod.yml up -d` sur la machine cible + distribution de l'APK | Utilisateurs finaux                                                                                    |

### Rollback

- **API** : redéploiement du tag précédent — `docker compose pull` de l'image `ghcr.io/gagawan/soundproof-api:vX.Y.Z` antérieure puis `up -d`. Les migrations Prisma étant additives, le retour arrière de schéma suit la procédure décrite dans `docs/11-manuel-mise-a-jour.md`.
- **Mobile** : réinstallation de l'APK précédent, attaché à la Release antérieure (chaque Release conserve son binaire).

## 5. Versionnage des artefacts

- Un tag git `vX.Y.Z` (SemVer) produit : une image Docker `ghcr.io/gagawan/soundproof-api:vX.Y.Z` + `latest`, une GitHub Release avec le CHANGELOG, et un APK `preview` attaché.
- La version de l'application mobile (`version` dans `mobile/app.json`) est **alignée sur le tag** avant chaque release.
- Chaque version est décrite dans `CHANGELOG.md` (format Keep a Changelog).

## 6. Secrets et prérequis

| Élément                      | Où                                         | Usage                                                                                                            |
| ---------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `EXPO_TOKEN`                 | Secret GitHub Actions                      | Authentification de `eas build` en CI (à créer depuis un compte Expo gratuit : https://expo.dev → Access tokens) |
| `GITHUB_TOKEN`               | Fourni automatiquement par GitHub Actions  | Push de l'image sur ghcr.io, création de la Release                                                              |
| Fichier `.env` de production | Machine cible uniquement (jamais committé) | Secrets JWT, mot de passe PostgreSQL — modèle : `.env.prod.example`                                              |
