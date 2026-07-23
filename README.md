# SoundProof 🎸

[![CI](https://github.com/Gagawan/SoundProof/actions/workflows/ci.yml/badge.svg)](https://github.com/Gagawan/SoundProof/actions/workflows/ci.yml)
[![Conventional Commits](https://img.shields.io/badge/Commits-Conventional-blue.svg)](https://www.conventionalcommits.org/fr/)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-brightgreen.svg)](https://semver.org/lang/fr/)

**SoundProof** est une application mobile (Android et iOS) de gestion de salles de musique (studios de répétition). Elle permet à des musiciens de :

- **Réserver des salles de répétition** : consulter les salles disponibles, réserver un créneau horaire, modifier ou annuler ses réservations, sans conflit de créneaux.
- **Réserver du matériel** (amplis, batteries, micros, tables de mixage…) dans le cadre d'une réservation de salle existante.
- **Discuter en temps réel** via un chat intégré par salle, entre utilisateurs ayant une réservation sur cette salle (échange de créneaux, partage de matériel…).

Deux rôles existent : `ADMIN` (gère les salles, le matériel et toutes les réservations) et `MEMBER` (réserve, chatte, gère ses propres réservations).

> Projet réalisé dans le cadre de la validation du **Bloc 2 du titre RNCP 39583 « Expert en Développement Logiciel »** : _Concevoir et développer des applications logicielles_.

## Aperçu

> _Captures d'écran de l'application (à générer dans `docs/assets/` — voir [le guide](docs/assets/README.md))._

|              Liste des salles              |                  Réservation                  |          Chat de salle           |
| :----------------------------------------: | :-------------------------------------------: | :------------------------------: |
| ![Salles](docs/assets/04-liste-salles.png) | ![Réservation](docs/assets/05-calendrier.png) | ![Chat](docs/assets/08-chat.png) |

## Stack technique

| Couche                   | Technologie                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Application mobile       | React Native avec **Expo** (SDK 54, TypeScript) + **Expo Router**                              |
| Data-fetching mobile     | TanStack Query (React Query) v5 + Axios                                                        |
| Stockage sécurisé mobile | expo-secure-store (tokens)                                                                     |
| Backend                  | **NestJS** 11 (TypeScript)                                                                     |
| Base de données          | **PostgreSQL 16** (Docker)                                                                     |
| ORM                      | **Prisma** 6                                                                                   |
| Temps réel               | **Socket.IO** (`@nestjs/websockets` côté serveur, `socket.io-client` côté mobile)              |
| Authentification         | JWT (access + refresh tokens), hachage **argon2**                                              |
| Tests                    | Jest + Supertest (backend), Jest + React Native Testing Library (mobile), Maestro (E2E mobile) |
| Qualité                  | ESLint, Prettier, Husky + lint-staged, commitlint                                              |
| CI/CD                    | GitHub Actions + EAS Build (Expo Application Services)                                         |
| Conteneurisation         | Docker + Docker Compose                                                                        |

## Structure du dépôt

```
SoundProof/
├── backend/    # API NestJS (REST /api/v1 + WebSocket Socket.IO)
├── mobile/     # Application Expo (React Native) — écrans dans app/, logique dans src/, flows Maestro dans e2e/
├── docs/       # Documentation du projet (11 livrables + captures)
└── .github/    # Workflows CI/CD, Dependabot, template d'issue
```

## Démarrage rapide (développement)

### Prérequis

- Node.js ≥ 20 LTS et npm
- Docker Desktop (pour la base de données PostgreSQL)
- L'application **Expo Go** (SDK 54) sur un téléphone, ou un émulateur Android (Android Studio)

### Lancement

```bash
# 1. Cloner le dépôt et installer l'outillage racine (hooks Husky + commitlint)
git clone https://github.com/Gagawan/SoundProof.git && cd SoundProof && npm install

# 2. Configurer les environnements (puis éditer les valeurs)
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env

# 3. Démarrer la base de données
docker compose up -d

# 4. Démarrer l'API (migrations + seed de démonstration + serveur)
cd backend && npm install && npx prisma migrate dev && npx prisma db seed && npm run dev

# 5. Démarrer l'application mobile (dans un autre terminal)
cd mobile && npm install && npm run dev
```

Scannez ensuite le QR code avec **Expo Go** (téléphone) ou appuyez sur `a` pour l'émulateur Android.

**Comptes de démonstration** (mot de passe commun `SoundProof2026!`) : `admin@soundproof.fr` (administrateur), `marie@soundproof.fr` / `karim@soundproof.fr` / `lea@soundproof.fr` (membres).

### ⚠️ Configuration de l'URL de l'API côté mobile

L'application mobile tourne sur un téléphone ou un émulateur : elle ne peut **pas** joindre l'API via `localhost`. Dans `mobile/.env`, configurez `EXPO_PUBLIC_API_URL` selon votre cas :

| Cas                                                   | Valeur de `EXPO_PUBLIC_API_URL`                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Téléphone physique (Expo Go) sur le même réseau Wi-Fi | `http://<IP-locale-de-votre-machine>:3000` (ex. `http://192.168.1.42:3000`, obtenue via `ipconfig` / `ifconfig`) |
| Émulateur Android                                     | `http://10.0.2.2:3000` (alias de la machine hôte vu depuis l'émulateur)                                          |

## Scripts utiles

| Commande                        | Emplacement      | Effet                                                       |
| ------------------------------- | ---------------- | ----------------------------------------------------------- |
| `npm run dev`                   | backend / mobile | Serveur en mode watch                                       |
| `npm run lint`                  | backend / mobile | Analyse ESLint                                              |
| `npm run typecheck`             | backend / mobile | Vérification TypeScript                                     |
| `npm test` / `npm run test:cov` | backend / mobile | Tests unitaires / avec couverture                           |
| `npm run test:e2e`              | backend          | Tests e2e API (Supertest)                                   |
| `maestro test e2e/`             | mobile           | Flows E2E Maestro (voir [mobile/e2e](mobile/e2e/README.md)) |

## Stratégie de branches (Git Flow simplifié)

- **`main`** : versions stables uniquement, chacune taguée en [SemVer](https://semver.org/lang/fr/) (`v1.0.0`, `v1.1.0`…).
- **`develop`** : branche d'intégration des fonctionnalités.
- **`feat/<nom>`**, **`fix/<nom>`**, **`docs/<nom>`**, **`chore/<nom>`** : branches de travail, créées depuis `develop` et fusionnées dans `develop` via merge commit.

Un tag `vX.Y.Z` sur `main` déclenche le déploiement continu : image Docker de l'API publiée sur ghcr.io, GitHub Release créée à partir du CHANGELOG, et APK Android (build EAS `preview`) attaché à la Release.

## Conventions de commits et versionnage

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) — préfixes `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `ci:`. Chaque commit est atomique et son message décrit le « pourquoi ».
- **Versionnage** : [SemVer](https://semver.org/lang/fr/) (`MAJOR.MINOR.PATCH`). Chaque version taguée sur `main` correspond à une entrée dans [CHANGELOG.md](CHANGELOG.md) (format [Keep a Changelog](https://keepachangelog.com/fr/)). La version de l'app mobile (`version` dans `mobile/app.json`) est alignée sur le tag.

## Documentation

L'ensemble des livrables documentaires se trouve dans [`docs/`](docs/) :

| Document                                                                              | Sujet                                                        |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [01 — Protocole de déploiement continu](docs/01-protocole-deploiement-continu.md)     | Environnements et séquences de déploiement (API + mobile)    |
| [02 — Critères de qualité et de performance](docs/02-criteres-qualite-performance.md) | Critères mesurables, environnement de développement          |
| [03 — Protocole d'intégration continue](docs/03-protocole-integration-continue.md)    | Séquences du pipeline, règles de fusion                      |
| [04 — Architecture logicielle](docs/04-architecture-logicielle.md)                    | Choix techniques, modèle de données, user stories, maquettes |
| [05 — Sécurité OWASP Top 10](docs/05-securite-owasp.md)                               | Analyse des 10 failles et mesures                            |
| [06 — Accessibilité](docs/06-accessibilite.md)                                        | Référentiel WCAG 2.1 AA / EN 301 549, audit                  |
| [07 — Cahier de recettes](docs/07-cahier-de-recettes.md)                              | Tests fonctionnels, structurels et de sécurité               |
| [08 — Plan de correction des bogues](docs/08-plan-correction-bogues.md)               | Processus et registre des anomalies                          |
| [09 — Manuel de déploiement](docs/09-manuel-deploiement.md)                           | Mise en production API + mobile                              |
| [10 — Manuel d'utilisation](docs/10-manuel-utilisation.md)                            | Guide membre et administrateur                               |
| [11 — Manuel de mise à jour](docs/11-manuel-mise-a-jour.md)                           | Montées de version, migrations, hotfix                       |

## Correspondance compétences RNCP ↔ livrables

| Compétence | Intitulé résumé                                    | Livrables                                                                                                                                                  |
| ---------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C2.1.1** | Environnements de déploiement/test + suivi qualité | [docs/01](docs/01-protocole-deploiement-continu.md), [docs/02](docs/02-criteres-qualite-performance.md), `docker-compose.yml`, `mobile/eas.json`, `cd.yml` |
| **C2.1.2** | Intégration continue                               | [docs/03](docs/03-protocole-integration-continue.md), `ci.yml`, hooks Husky                                                                                |
| **C2.2.1** | Prototype (architecture, ergonomie, sécurité)      | [docs/04](docs/04-architecture-logicielle.md), application mobile + API fonctionnelles                                                                     |
| **C2.2.2** | Harnais de tests unitaires                         | Suites Jest backend (80 tests) + mobile (51 tests), couverture ≥ 80 % sur la logique métier                                                                |
| **C2.2.3** | Sécurité (OWASP) + accessibilité                   | [docs/05](docs/05-securite-owasp.md), [docs/06](docs/06-accessibilite.md), mesures dans le code                                                            |
| **C2.2.4** | Déploiement progressif + versionnage               | Historique git conventionnel, tags SemVer, [CHANGELOG.md](CHANGELOG.md), `cd.yml`, builds EAS versionnés                                                   |
| **C2.3.1** | Cahier de recettes                                 | [docs/07](docs/07-cahier-de-recettes.md), flows Maestro ([mobile/e2e](mobile/e2e/))                                                                        |
| **C2.3.2** | Plan de correction des bogues                      | [docs/08](docs/08-plan-correction-bogues.md), [template d'issue](.github/ISSUE_TEMPLATE/bug_report.yml)                                                    |
| **C2.4.1** | Documentation technique d'exploitation             | [docs/09](docs/09-manuel-deploiement.md), [docs/10](docs/10-manuel-utilisation.md), [docs/11](docs/11-manuel-mise-a-jour.md)                               |

## Licence

Projet réalisé à des fins pédagogiques (titre RNCP 39583).
