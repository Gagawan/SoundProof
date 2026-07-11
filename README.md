# SoundProof 🎸

**SoundProof** est une application mobile (Android et iOS) de gestion de salles de musique (studios de répétition). Elle permet à des musiciens de :

- **Réserver des salles de répétition** : consulter les salles disponibles, réserver un créneau horaire, modifier ou annuler ses réservations, sans conflit de créneaux.
- **Réserver du matériel** (amplis, batteries, micros, tables de mixage…) dans le cadre d'une réservation de salle existante.
- **Discuter en temps réel** via un chat intégré par salle, entre utilisateurs ayant une réservation sur cette salle (échange de créneaux, partage de matériel…).

Deux rôles existent : `ADMIN` (gère les salles, le matériel et toutes les réservations) et `MEMBER` (réserve, chatte, gère ses propres réservations).

> Projet réalisé dans le cadre de la validation du **Bloc 2 du titre RNCP 39583 « Expert en Développement Logiciel »** : _Concevoir et développer des applications logicielles_.

## Stack technique

| Couche                   | Technologie                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Application mobile       | React Native avec **Expo** (TypeScript) + **Expo Router**                                      |
| Data-fetching mobile     | TanStack Query (React Query) v5 + Axios                                                        |
| Stockage sécurisé mobile | expo-secure-store (tokens)                                                                     |
| Backend                  | **NestJS** (TypeScript)                                                                        |
| Base de données          | **PostgreSQL 16** (Docker)                                                                     |
| ORM                      | **Prisma**                                                                                     |
| Temps réel               | **Socket.IO** (`@nestjs/websockets` côté serveur, `socket.io-client` côté mobile)              |
| Authentification         | JWT (access + refresh tokens), hachage **argon2**                                              |
| Tests                    | Jest + Supertest (backend), Jest + React Native Testing Library (mobile), Maestro (E2E mobile) |
| Qualité                  | ESLint, Prettier, Husky + lint-staged, commitlint                                              |
| CI/CD                    | GitHub Actions + EAS Build (Expo Application Services)                                         |
| Conteneurisation         | Docker + Docker Compose                                                                        |

## Structure du dépôt

```
SoundProof/
├── backend/    # API NestJS (REST + WebSocket)
├── mobile/     # Application Expo (React Native)
├── docs/       # Documentation du projet (11 livrables)
└── .github/    # Workflows CI/CD et templates d'issues
```

## Démarrage rapide (développement)

### Prérequis

- Node.js ≥ 20 LTS et npm
- Docker Desktop (pour la base de données PostgreSQL)
- L'application **Expo Go** sur un téléphone, ou un émulateur Android (Android Studio)

### Lancement

```bash
# 1. Cloner le dépôt
git clone <url-du-depot> && cd SoundProof

# 2. Installer l'outillage racine (hooks git Husky + commitlint)
npm install

# 3. Configurer les environnements (puis éditer les valeurs)
cp backend/.env.example backend/.env
cp mobile/.env.example mobile/.env

# 4. Démarrer la base de données
docker compose up -d

# 5. Démarrer l'API
cd backend && npm install && npx prisma migrate dev && npm run dev

# 6. Démarrer l'application mobile (dans un autre terminal)
cd mobile && npm install && npm run dev
```

Scannez ensuite le QR code avec **Expo Go** (téléphone) ou lancez l'app sur l'émulateur Android.

### ⚠️ Configuration de l'URL de l'API côté mobile

L'application mobile tourne sur un téléphone ou un émulateur : elle ne peut **pas** joindre l'API via `localhost`. Dans `mobile/.env`, configurez `EXPO_PUBLIC_API_URL` selon votre cas :

| Cas                                                   | Valeur de `EXPO_PUBLIC_API_URL`                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Téléphone physique (Expo Go) sur le même réseau Wi-Fi | `http://<IP-locale-de-votre-machine>:3000` (ex. `http://192.168.1.42:3000`, obtenue via `ipconfig` / `ifconfig`) |
| Émulateur Android                                     | `http://10.0.2.2:3000` (alias de la machine hôte vu depuis l'émulateur)                                          |

## Stratégie de branches (Git Flow simplifié)

- **`main`** : versions stables uniquement, chacune taguée en [SemVer](https://semver.org/lang/fr/) (`v1.0.0`, `v1.1.0`…).
- **`develop`** : branche d'intégration des fonctionnalités.
- **`feat/<nom>`**, **`fix/<nom>`**, **`docs/<nom>`**, **`chore/<nom>`** : branches de travail, créées depuis `develop` et fusionnées dans `develop` via merge commit ou squash.

## Conventions de commits et versionnage

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/fr/) — préfixes `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `ci:`. Chaque commit est atomique et son message décrit le « pourquoi ».
- **Versionnage** : [SemVer](https://semver.org/lang/fr/) (`MAJOR.MINOR.PATCH`). Chaque version taguée sur `main` correspond à une entrée dans [CHANGELOG.md](CHANGELOG.md) (format [Keep a Changelog](https://keepachangelog.com/fr/)). La version de l'app mobile (`version` dans `mobile/app.json`) est alignée sur le tag.

## Documentation

L'ensemble des livrables documentaires (protocoles CI/CD, architecture, sécurité OWASP, accessibilité, cahier de recettes, manuels…) se trouve dans le dossier [`docs/`](docs/).
