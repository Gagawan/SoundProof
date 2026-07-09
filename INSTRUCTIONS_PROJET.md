# SoundProof — Instructions complètes de réalisation du projet

> **Document d'instructions destiné à une IA de développement.**
> Ce fichier décrit de manière exhaustive et ordonnée toutes les étapes pour réaliser l'application **SoundProof**, une **application mobile** de gestion de salles de musique (studios de répétition), dans le cadre de la validation du **Bloc 2 du titre RNCP 39583 « Expert en Développement Logiciel » : CONCEVOIR ET DÉVELOPPER DES APPLICATIONS LOGICIELLES**.
> Chaque phase indique explicitement la ou les compétences du référentiel qu'elle valide. **Aucune phase ne doit être sautée. Tous les livrables listés doivent exister à la fin du projet.**

---

## 0. Vue d'ensemble

### 0.1 Description fonctionnelle de l'application

**SoundProof** est une application mobile (Android et iOS) qui permet à des musiciens de réserver des salles de répétition équipées :

1. **Gestion des réservations de salles** : consulter les salles disponibles, réserver un créneau horaire, modifier/annuler ses réservations, éviter les conflits de créneaux.
2. **Gestion des réservations de matériel** : chaque salle contient du matériel (amplis, batteries, micros, tables de mixage…) ; un utilisateur peut réserver du matériel supplémentaire **uniquement dans le cadre d'une réservation de salle** existante.
3. **Chat intégré par salle** : messagerie temps réel entre les utilisateurs ayant une réservation (passée, en cours ou à venir) sur une même salle, pour se coordonner (échange de créneaux, partage de matériel, etc.).
4. **Rôles** : `ADMIN` (gère les salles, le matériel, toutes les réservations) et `MEMBER` (réserve, chatte, gère ses propres réservations).

### 0.2 Stack technique imposée (ne pas dévier)

| Couche | Technologie | Version cible |
|---|---|---|
| Application mobile | **React Native avec Expo** (TypeScript), dernière SDK Expo stable | dernière stable |
| Navigation | **Expo Router** (navigation par fichiers) | intégré à Expo |
| Data-fetching mobile | TanStack Query (React Query) v5 + Axios | dernière stable |
| Stockage sécurisé mobile | **expo-secure-store** (tokens) | intégré à Expo |
| Backend | **NestJS** 10+ avec TypeScript | dernière stable |
| Base de données | **PostgreSQL** 16 | via Docker |
| ORM | **Prisma** | dernière stable |
| Temps réel | **Socket.IO** : `@nestjs/websockets` + `@nestjs/platform-socket.io` côté serveur, `socket.io-client` côté mobile | dernière stable |
| Auth | JWT (access + refresh tokens), hachage **argon2** | — |
| Tests backend | **Jest** + Supertest (e2e API) | intégré NestJS |
| Tests mobile | **Jest** (preset `jest-expo`) + **React Native Testing Library** | dernière stable |
| Tests E2E mobile | **Maestro** (flows YAML sur émulateur Android) | dernière stable |
| Qualité | ESLint (flat config), Prettier, Husky + lint-staged, commitlint | — |
| CI/CD | **GitHub Actions** ; builds mobiles via **EAS Build** (Expo Application Services, plan gratuit) | — |
| Conteneurisation backend | **Docker** + Docker Compose | — |

> **Prérequis côté utilisateur** : un compte Expo gratuit (pour EAS Build) et, pour le développement local, l'application **Expo Go** sur un téléphone ou un émulateur Android (Android Studio). Le signaler à l'utilisateur au moment d'en avoir besoin.

### 0.3 Structure du monorepo (à respecter exactement)

```
SoundProof/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # Intégration continue
│   │   └── cd.yml                  # Déploiement continu (API + build mobile EAS)
│   └── ISSUE_TEMPLATE/
│       └── bug_report.yml          # Template de qualification des bogues
├── backend/                        # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   ├── test/                       # Tests e2e (Supertest)
│   ├── Dockerfile
│   └── package.json
├── mobile/                         # Application Expo (React Native)
│   ├── app/                        # Écrans (Expo Router, navigation par fichiers)
│   ├── src/                        # api, components, features, hooks, lib
│   ├── e2e/                        # Flows Maestro (.yaml)
│   ├── app.json                    # Config Expo
│   ├── eas.json                    # Profils de build EAS
│   └── package.json
├── docs/
│   ├── 01-protocole-deploiement-continu.md    # C2.1.1
│   ├── 02-criteres-qualite-performance.md     # C2.1.1
│   ├── 03-protocole-integration-continue.md   # C2.1.2
│   ├── 04-architecture-logicielle.md          # C2.2.1
│   ├── 05-securite-owasp.md                   # C2.2.3
│   ├── 06-accessibilite.md                    # C2.2.3
│   ├── 07-cahier-de-recettes.md               # C2.3.1
│   ├── 08-plan-correction-bogues.md           # C2.3.2
│   ├── 09-manuel-deploiement.md               # C2.4.1
│   ├── 10-manuel-utilisation.md               # C2.4.1
│   └── 11-manuel-mise-a-jour.md               # C2.4.1
├── docker-compose.yml              # Environnement de dev (PostgreSQL)
├── docker-compose.prod.yml         # Déploiement production de l'API
├── CHANGELOG.md                    # Historique des versions (C2.2.4)
├── README.md
└── INSTRUCTIONS_PROJET.md          # Ce fichier
```

### 0.4 Correspondance compétences RNCP ↔ livrables

| Compétence | Intitulé résumé | Livrables produits dans ce projet |
|---|---|---|
| **C2.1.1** | Environnements de déploiement et de test + outils de suivi qualité/performance | `docs/01-protocole-deploiement-continu.md`, `docs/02-criteres-qualite-performance.md`, `docker-compose.yml`, `eas.json`, `cd.yml` |
| **C2.1.2** | Intégration continue | `docs/03-protocole-integration-continue.md`, `ci.yml`, Husky hooks |
| **C2.2.1** | Prototype (architecture, ergonomie, équipements ciblés, frameworks, sécurité) | `docs/04-architecture-logicielle.md`, application mobile Expo + API NestJS fonctionnelles |
| **C2.2.2** | Harnais de tests unitaires | Suites Jest backend + mobile, couverture ≥ 80 % sur la logique métier |
| **C2.2.3** | Sécurité (OWASP Top 10) + accessibilité | `docs/05-securite-owasp.md`, `docs/06-accessibilite.md`, mesures implémentées dans le code |
| **C2.2.4** | Déploiement progressif + gestion de versions | Historique git conventionnel, tags semver, `CHANGELOG.md`, `cd.yml`, builds EAS versionnés |
| **C2.3.1** | Cahier de recettes | `docs/07-cahier-de-recettes.md`, flows Maestro |
| **C2.3.2** | Plan de correction des bogues | `docs/08-plan-correction-bogues.md`, template d'issue GitHub |
| **C2.4.1** | Documentation technique d'exploitation | `docs/09-manuel-deploiement.md`, `docs/10-manuel-utilisation.md`, `docs/11-manuel-mise-a-jour.md` |

> **Atout pour la soutenance** : le critère C2.2.1 mentionne explicitement la prise en compte « des équipements ciblés (ex : web, mobile…) ». Le choix du mobile devra être justifié dans le document d'architecture (usage nomade : on réserve une salle ou on chatte depuis son téléphone, entre deux répétitions).

---

## PHASE 1 — Initialisation du dépôt et conventions (C2.2.4)

### 1.1 Initialisation

1. Vérifier que le dépôt git est initialisé (branche par défaut `main`).
2. Créer la branche `develop` à partir de `main`.
3. **Stratégie de branches (Git Flow simplifié)** — à documenter dans le README :
   - `main` : versions stables uniquement, taguées (v1.0.0, v1.1.0…).
   - `develop` : intégration des fonctionnalités.
   - `feat/<nom>`, `fix/<nom>`, `docs/<nom>`, `chore/<nom>` : branches de travail, fusionnées dans `develop` via merge commit ou squash.
4. **Convention de commits : Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `ci:`). Chaque commit doit être atomique et son message décrire le « pourquoi ».
5. **Versionnage : SemVer** (`MAJOR.MINOR.PATCH`). Chaque version taguée sur `main` correspond à une entrée dans `CHANGELOG.md` (format [Keep a Changelog](https://keepachangelog.com/fr/)). La version de l'app mobile (`version` dans `app.json`) est alignée sur le tag.
6. Créer à la racine : `.gitignore` (node_modules, dist, .env, coverage, .expo, android/, ios/, *.apk, *.aab), `.editorconfig`, `README.md` (présentation, stack, démarrage rapide, stratégie de branches).

### 1.2 Fichiers d'environnement

- Créer `backend/.env.example` et `mobile/.env.example` **committés**, avec toutes les variables et des valeurs factices.
- Les vrais `.env` ne sont **jamais** committés.
- Variables backend minimales : `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`, `PORT=3000`.
- Variable mobile : `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000` (⚠️ **adresse IP locale de la machine de dev, pas `localhost`** : l'app tourne sur un téléphone/émulateur qui doit joindre l'API à travers le réseau ; pour l'émulateur Android, `http://10.0.2.2:3000` fonctionne aussi. Documenter ces deux cas dans le README).

### 1.3 Commits attendus pour cette phase

À la fin de chaque phase, committer avec des messages conventionnels. Exemple ici : `chore: initialise le monorepo, conventions git et fichiers d'environnement`.

---

## PHASE 2 — Environnement de développement et outillage qualité (C2.1.1, C2.1.2)

### 2.1 Docker Compose de développement

Créer `docker-compose.yml` à la racine avec :
- Service `db` : image `postgres:16-alpine`, port 5432, volume nommé, healthcheck `pg_isready`, variables via `.env`.
- (L'API tourne en local avec hot-reload, l'app mobile via `npx expo start` ; seule la BDD est dockerisée en dev.)

### 2.2 Scaffolding des deux applications

1. **Backend** : `nest new backend` (package manager : npm), TypeScript strict activé (`strict: true` dans tsconfig).
2. **Mobile** : `npx create-expo-app@latest mobile` (template par défaut avec Expo Router et TypeScript), puis nettoyer les écrans d'exemple. Activer `strict: true`.
3. Installer et configurer dans **chaque** app :
   - ESLint (flat config ; côté mobile utiliser `eslint-config-expo`) + Prettier (config partagée : `singleQuote: true`, `semi: true`, `printWidth: 100`).
   - Scripts npm normalisés dans les deux `package.json` : `dev` (`start:dev` Nest / `expo start`), `lint`, `format`, `test`, `test:cov`, `typecheck` (`tsc --noEmit`).
4. À la racine : Husky + lint-staged + commitlint :
   - Hook `pre-commit` : lint-staged (ESLint --fix + Prettier sur les fichiers stagés).
   - Hook `commit-msg` : commitlint (config conventional).
5. Vérifier que l'app Expo de base se lance dans **Expo Go** (téléphone ou émulateur Android) et affiche un écran d'accueil.

### 2.3 Livrable C2.1.1 — `docs/02-criteres-qualite-performance.md`

Rédiger ce document. Il doit contenir des **critères mesurables**, chacun avec sa cible, son outil de mesure et son moment de vérification :

| Catégorie | Critère | Cible | Outil | Vérifié quand |
|---|---|---|---|---|
| Qualité code | 0 erreur ESLint | 0 erreur, 0 warning | ESLint | pre-commit + CI |
| Qualité code | Formatage uniforme | 100 % conforme | Prettier | pre-commit + CI |
| Qualité code | Typage strict | 0 `any` non justifié, `strict: true` | tsc | CI |
| Qualité mobile | Projet Expo sain | 0 erreur | `npx expo-doctor` | CI |
| Tests | Couverture unitaire logique métier | ≥ 80 % lignes/branches | Jest (backend + mobile) | CI |
| Tests | Tests e2e API sur parcours critiques | 100 % passants | Supertest | CI |
| Performance | Réponse API (p95, endpoints CRUD) | < 200 ms en local | test dédié / logs | recette |
| Performance | Démarrage à froid de l'app (splash → écran utilisable) | < 3 s sur émulateur | chronométrage documenté | recette |
| Performance | Navigation entre écrans | < 300 ms, aucun gel d'interface | observation + React DevTools | recette |
| Performance | Latence message chat (émission → réception) | < 500 ms en local | test manuel chronométré | recette |
| Accessibilité | Conformité au référentiel choisi (WCAG 2.1 AA, voir Phase 8) | 100 % des écrans audités, 0 anomalie bloquante | audit manuel TalkBack + Accessibility Scanner (Android) | recette |
| Sécurité | Vulnérabilités dépendances | 0 critique/haute | `npm audit` | CI |

Ajouter une section « Environnement de développement détaillé » listant : éditeur recommandé (VS Code + extensions ESLint/Prettier/Prisma/Expo Tools), Node.js ≥ 20 LTS, npm, compilateur TypeScript (tsc via Nest CLI ; bundler **Metro** + compilation **Hermes** côté Expo), serveur d'application (NestJS/Express en dev avec watch mode, Node.js dans un conteneur Docker en prod ; serveur de développement Expo pour l'app), environnement d'exécution mobile (Expo Go en dev, build natif EAS en production), émulateur Android (Android Studio) et/ou appareil physique, gestion de sources (git + GitHub), gestionnaire de BDD (Prisma Studio).
**Ce niveau de détail est exigé par le critère d'évaluation : le jury doit pouvoir identifier compilateur, serveur d'application et outils de gestion de sources.**

### 2.4 Commits

`chore: environnement de dev (docker compose bdd, expo, eslint, prettier, husky, commitlint)` puis `docs: critères de qualité et de performance`.

---

## PHASE 3 — Protocoles CI et CD (C2.1.1, C2.1.2)

> **Important : les protocoles sont rédigés AVANT le développement des fonctionnalités**, car le référentiel exige qu'ils encadrent « le bon déroulement de la phase de développement ».

### 3.1 Livrable C2.1.2 — `docs/03-protocole-integration-continue.md`

Rédiger le protocole d'intégration continue. Contenu obligatoire :

1. **Objectif** : fusion régulière des codes sources, détection précoce des régressions.
2. **Déclencheurs** : push sur toute branche + pull request vers `develop` et `main`.
3. **Séquences d'intégration** (ordre exact du pipeline, à reproduire dans `ci.yml`) :
   1. Checkout + installation Node 20 + cache npm.
   2. `npm ci` (backend et mobile, jobs parallèles).
   3. Lint : `npm run lint` sur les deux apps.
   4. Typecheck : `tsc --noEmit` sur les deux apps.
   5. Tests unitaires backend : `npm run test:cov` (Jest) — échec si couverture < 80 % sur `src/**/*.service.ts`.
   6. Tests unitaires mobile : `npm run test:cov` (Jest + jest-expo).
   7. Tests e2e API : démarrage d'un PostgreSQL de service (services GitHub Actions), migrations Prisma, puis Supertest.
   8. Build backend (`nest build`) + vérification export mobile (`npx expo export --platform android`, garantit que le bundle JS compile) + `npx expo-doctor`.
   9. `npm audit --audit-level=high` (non bloquant en dev, bloquant sur `main`).
4. **Règles de fusion** : PR obligatoire vers `develop`/`main`, CI verte requise, revue de code (ou auto-revue documentée en solo).
5. **Hooks locaux** (première ligne de défense) : pre-commit lint-staged, commit-msg commitlint.

### 3.2 Livrable C2.1.1 — `docs/01-protocole-deploiement-continu.md`

Rédiger le protocole de déploiement continu. Il couvre **deux artefacts distincts** : l'API (conteneur Docker) et l'application mobile (binaire Android/iOS via EAS Build). Contenu obligatoire :

1. **Environnements** :
   - `development` : API locale + BDD Docker + app dans Expo Go (rechargement instantané).
   - `test` : CI, BDD éphémère.
   - `preview` : build APK Android installable (profil EAS `preview`) pointant vers l'API de démo — c'est le binaire remis au jury.
   - `production` : API en conteneurs (`docker-compose.prod.yml`) + build de production (AAB Android / IPA iOS, profil EAS `production`).
2. **Séquences de déploiement de l'API** (à reproduire dans `cd.yml`) :
   1. Déclencheur : push d'un tag `v*.*.*` sur `main`.
   2. Exécution complète de la CI (réutilisation du workflow via `workflow_call`).
   3. Build de l'image Docker backend (multi-stage).
   4. Push de l'image sur GitHub Container Registry (ghcr.io) taguée `latest` + version.
   5. Création automatique d'une GitHub Release avec le contenu du CHANGELOG.
   6. Déploiement : pull de l'image + `docker compose -f docker-compose.prod.yml up -d` (documenter la commande ; l'exécution cible une machine locale ou un VPS).
   7. Migration BDD : `prisma migrate deploy` exécuté au démarrage du conteneur backend (entrypoint).
   8. Vérification post-déploiement : endpoint `GET /health` (healthcheck Docker) + smoke test manuel documenté.
3. **Séquences de déploiement de l'app mobile** (même workflow `cd.yml`, job dédié) :
   1. Même déclencheur (tag `v*.*.*`).
   2. `eas build --platform android --profile preview --non-interactive` via un secret `EXPO_TOKEN` (GitHub Actions).
   3. Récupération de l'APK produit et attachement à la GitHub Release (artefact téléchargeable et installable).
   4. Distribution : lien de la Release + QR code EAS ; la publication sur les stores (Google Play/App Store) est **documentée comme étape ultérieure** mais non exécutée (comptes payants).
4. **Stratégie de déploiement progressif** : chaque fusion dans `develop` est testable immédiatement dans Expo Go ; les tags sur `main` produisent un APK versionné installable ; rollback = redéploiement du tag précédent (API) + réinstallation de l'APK précédent attaché à la Release antérieure (mobile).

### 3.3 Implémentation des workflows

1. Créer `.github/workflows/ci.yml` reproduisant exactement les séquences du § 3.1.
2. Créer `.github/workflows/cd.yml` reproduisant exactement les séquences du § 3.2 (jobs API + mobile).
3. Créer `backend/Dockerfile` **multi-stage** (stage build → stage runtime minimal, utilisateur non-root).
4. Créer `mobile/eas.json` avec les profils `preview` (APK, `distribution: internal`) et `production` (AAB). Configurer `app.json` : nom, slug, icône, splash screen, `android.package` (ex. `com.soundproof.app`).
5. Créer `docker-compose.prod.yml` : db + backend, réseaux isolés, la BDD n'expose pas son port sur l'hôte ; l'API expose son port (elle doit être joignable par les téléphones).
6. Vérifier que la CI passe (pousser et consulter les runs GitHub Actions). Demander à l'utilisateur de créer le compte Expo et le secret `EXPO_TOKEN` avant le premier run du CD.

### 3.4 Commits

`docs: protocoles d'intégration et de déploiement continus` puis `ci: pipelines github actions ci/cd, dockerfile api et config eas`.

---

## PHASE 4 — Conception et architecture (C2.2.1)

### 4.1 Livrable — `docs/04-architecture-logicielle.md`

Rédiger ce document AVANT de coder les modules. Contenu obligatoire :

1. **Diagramme d'architecture globale** (Mermaid) : app mobile Expo (Android/iOS) → API REST NestJS + WebSocket Socket.IO → Prisma → PostgreSQL.
2. **Justification des choix** — dont la **cible mobile** (exigence C2.2.1 « équipements ciblés ») : usage nomade (réserver/chatter depuis son téléphone), notifications naturelles à terme ; pourquoi React Native + Expo (un seul code TypeScript pour Android et iOS, écosystème React, outillage Expo : builds EAS, Expo Go, OTA possibles), pourquoi NestJS (architecture modulaire imposée, injection de dépendances, testabilité), pourquoi Prisma, pourquoi Socket.IO (rooms natives adaptées au chat par salle, reconnexion automatique — précieux sur réseau mobile).
3. **Paradigmes de développement utilisés** (exigé par le critère) : programmation orientée objet et injection de dépendances côté NestJS, programmation fonctionnelle et composition de composants côté React Native, typage statique TypeScript partagé.
4. **Architecture backend** : modules NestJS (voir § 4.3), pattern Controller → Service → Repository (Prisma), DTOs validés par `class-validator`, séparation stricte des responsabilités = **maintenabilité** (exigence du livrable).
5. **Architecture mobile** : navigation par fichiers Expo Router (`app/`), logique dans `src/{api,components,features,hooks,lib}`, état serveur via TanStack Query, état local via hooks, tokens dans expo-secure-store.
6. **Modèle de données** : diagramme entité-relation Mermaid (`erDiagram`) reprenant le schéma § 4.2.
7. **Les 10 user stories** du § 4.4, avec critères d'acceptation.
8. **Maquettes basse fidélité** : wireframes des 6 écrans principaux (descriptions textuelles structurées ou ASCII, suffisant) : connexion/inscription, liste des salles, détail salle + calendrier de réservation, formulaire réservation (salle + matériel), mes réservations, chat de salle. Justifier les choix ergonomiques **mobiles** : barre d'onglets en bas (pouce), zones tactiles ≥ 44 pt, gestes standards (pull-to-refresh sur les listes), feedback utilisateur, états vides/chargement/erreur, gestion du clavier virtuel (le formulaire ne doit pas être masqué), support des orientations portrait (principal).

### 4.2 Schéma Prisma (`backend/prisma/schema.prisma`)

Modéliser exactement :

```prisma
enum Role          { ADMIN MEMBER }
enum BookingStatus { CONFIRMED CANCELLED }
enum EquipmentCategory { AMPLIFIER DRUMS MICROPHONE MIXER KEYBOARD GUITAR BASS OTHER }

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  firstName    String
  lastName     String
  role         Role     @default(MEMBER)
  refreshTokenHash String?
  createdAt    DateTime @default(now())
  bookings     Booking[]
  messages     Message[]
}

model Room {
  id          String  @id @default(uuid())
  name        String  @unique
  description String
  capacity    Int
  isActive    Boolean @default(true)
  equipments  Equipment[]
  bookings    Booking[]
  messages    Message[]
}

model Equipment {
  id        String  @id @default(uuid())
  name      String
  category  EquipmentCategory
  roomId    String
  room      Room    @relation(fields: [roomId], references: [id])
  isActive  Boolean @default(true)
  bookingEquipments BookingEquipment[]
}

model Booking {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id])
  startsAt  DateTime
  endsAt    DateTime
  status    BookingStatus @default(CONFIRMED)
  createdAt DateTime @default(now())
  equipments BookingEquipment[]
  @@index([roomId, startsAt, endsAt])
}

model BookingEquipment {
  bookingId   String
  booking     Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  equipmentId String
  equipment   Equipment @relation(fields: [equipmentId], references: [id])
  @@id([bookingId, equipmentId])
}

model Message {
  id        String   @id @default(uuid())
  content   String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id])
  createdAt DateTime @default(now())
  @@index([roomId, createdAt])
}
```

Créer la migration initiale (`prisma migrate dev`) et un `seed.ts` : 1 admin, 3 membres, 3 salles avec 4-6 équipements chacune, quelques réservations et messages de démonstration.

### 4.3 Modules backend à créer

| Module | Responsabilité |
|---|---|
| `AuthModule` | register, login, refresh, logout ; stratégie JWT (Passport) ; guards `JwtAuthGuard`, `RolesGuard` + décorateur `@Roles()` |
| `UsersModule` | profil courant (`GET/PATCH /users/me`) |
| `RoomsModule` | CRUD salles (écriture ADMIN), liste + détail publics authentifiés |
| `EquipmentModule` | CRUD matériel par salle (écriture ADMIN) |
| `BookingsModule` | création/annulation de réservations, **règles métier critiques** (voir § 4.5), disponibilité |
| `ChatModule` | gateway Socket.IO + historique REST des messages |
| `HealthModule` | `GET /health` (statut app + BDD) via `@nestjs/terminus` |

### 4.4 User stories (les implémenter toutes)

1. **US1** — En tant que visiteur, je peux créer un compte avec email + mot de passe fort, afin d'accéder à l'application.
2. **US2** — En tant qu'utilisateur, je peux me connecter et rester connecté entre deux ouvertures de l'app (refresh token en stockage sécurisé), afin de ne pas ressaisir mes identifiants.
3. **US3** — En tant que membre, je peux consulter la liste des salles avec leur équipement, afin de choisir une salle adaptée.
4. **US4** — En tant que membre, je peux voir les disponibilités d'une salle sur une semaine, afin de choisir un créneau libre.
5. **US5** — En tant que membre, je peux réserver une salle sur un créneau (début/fin), et le système refuse tout chevauchement, afin de garantir l'exclusivité du créneau.
6. **US6** — En tant que membre, je peux ajouter du matériel de la salle à ma réservation, et le système refuse un matériel déjà réservé sur un créneau chevauchant, afin d'éviter les conflits de matériel.
7. **US7** — En tant que membre, je peux consulter et annuler mes réservations à venir, afin de gérer mon planning.
8. **US8** — En tant que membre ayant une réservation dans une salle, je peux accéder au chat de cette salle et échanger en temps réel avec les autres utilisateurs de la salle, afin de me coordonner.
9. **US9** — En tant qu'admin, je peux créer/modifier/désactiver des salles et leur matériel, afin de gérer le parc.
10. **US10** — En tant qu'admin, je peux consulter et annuler n'importe quelle réservation, afin de gérer les imprévus.

### 4.5 Règles métier critiques (à implémenter dans `BookingsService` et à tester unitairement en priorité)

1. `startsAt < endsAt`, créneau dans le futur, durée entre 30 min et 8 h, alignement sur des pas de 30 min.
2. **Anti-chevauchement salle** : refus (HTTP 409) si un booking `CONFIRMED` existe sur la même salle avec `startsAt < newEnd AND endsAt > newStart`. Contrôle effectué dans une **transaction Prisma** (`$transaction` avec vérification + insertion) pour éviter les conditions de course.
3. **Anti-chevauchement matériel** : même règle pour chaque équipement demandé ; l'équipement doit appartenir à la salle réservée.
4. Annulation : possible uniquement par le propriétaire ou un ADMIN, uniquement si `startsAt` est dans le futur ; statut → `CANCELLED` (pas de suppression, pour la traçabilité).
5. **Accès au chat** : autorisé si l'utilisateur possède au moins un booking `CONFIRMED` (passé ou futur) sur la salle, ou s'il est ADMIN.

### 4.6 Contrat d'API REST (préfixe global `/api/v1`)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/register` | public | inscription |
| POST | `/auth/login` | public | connexion → access + refresh tokens |
| POST | `/auth/refresh` | refresh token | renouvellement |
| POST | `/auth/logout` | authentifié | invalidation du refresh token |
| GET/PATCH | `/users/me` | authentifié | profil |
| GET | `/rooms` | authentifié | liste salles actives + équipements |
| GET | `/rooms/:id` | authentifié | détail salle |
| GET | `/rooms/:id/availability?from&to` | authentifié | créneaux occupés sur la période |
| POST/PATCH/DELETE | `/rooms…` | ADMIN | gestion salles (DELETE = désactivation logique) |
| POST/PATCH/DELETE | `/rooms/:id/equipment…` | ADMIN | gestion matériel |
| POST | `/bookings` | authentifié | créer réservation `{roomId, startsAt, endsAt, equipmentIds[]}` |
| GET | `/bookings/me` | authentifié | mes réservations |
| GET | `/bookings` | ADMIN | toutes les réservations (filtres salle/date) |
| DELETE | `/bookings/:id` | propriétaire ou ADMIN | annulation |
| GET | `/rooms/:id/messages?cursor` | membre de la salle | historique paginé du chat |
| GET | `/health` | public | healthcheck |

Documenter l'API avec `@nestjs/swagger` exposé sur `/api/docs` (hors production).

### 4.7 Événements Socket.IO (namespace `/chat`)

| Sens | Événement | Payload | Règle |
|---|---|---|---|
| client → serveur | `room:join` | `{ roomId }` | vérifie la règle d'accès § 4.5.5, rejoint la room Socket.IO `room:<id>` |
| client → serveur | `room:leave` | `{ roomId }` | quitte la room |
| client → serveur | `message:send` | `{ roomId, content }` | valide (1-1000 caractères), persiste en BDD, diffuse |
| serveur → clients | `message:new` | message complet avec auteur | diffusé à la room |
| serveur → client | `error` | `{ code, message }` | accès refusé / validation |

L'authentification WebSocket se fait via le JWT passé dans `auth` du handshake Socket.IO, vérifié dans un guard/middleware du gateway. Côté mobile, gérer explicitement la **reconnexion** (passage en arrière-plan, perte de réseau) : re-join automatique de la room et rafraîchissement de l'historique au retour au premier plan.

### 4.8 Commits

`docs: architecture logicielle, modèle de données et user stories` puis `feat(backend): schéma prisma, migration initiale et seed`.

---

## PHASE 5 — Développement backend (C2.2.1, C2.2.3)

Développer les modules dans cet ordre, **avec les tests unitaires écrits en même temps que chaque service** (voir Phase 7 pour les exigences de couverture) :

1. `HealthModule`, configuration globale : `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true, transform: true`), préfixe `/api/v1`, **Helmet**, rate limiting global via `@nestjs/throttler` (ex. 100 req/min, et 5 req/min sur `/auth/login` et `/auth/register`). CORS : sans objet pour l'app native (pas d'origine navigateur), le documenter ; le restreindre néanmoins pour Swagger en dev.
2. `AuthModule` : argon2 pour les mots de passe, politique de mot de passe (≥ 12 caractères, minuscule + majuscule + chiffre) validée par DTO, access token 15 min, refresh token 7 j **haché en BDD** et invalidé au logout. Messages d'erreur de connexion génériques (« identifiants invalides ») pour ne pas révéler l'existence d'un compte.
3. `UsersModule`, `RoomsModule`, `EquipmentModule` : CRUD avec DTOs stricts, `RolesGuard` sur les écritures.
4. `BookingsModule` : implémentation exhaustive des règles § 4.5, erreurs HTTP explicites (400 validation, 403 interdit, 404 introuvable, 409 conflit).
5. `ChatModule` : gateway + persistance + endpoint d'historique paginé (cursor sur `createdAt`).

**Interdictions** (liées à OWASP, voir Phase 8) : aucune requête SQL brute concaténée (Prisma uniquement), aucun secret en dur dans le code, aucune donnée sensible (hash, refresh token) dans les réponses API — utiliser des DTOs de sortie ou `select` Prisma explicites.

Commits par module : `feat(backend): module auth avec jwt et argon2`, `feat(backend): module bookings avec règles anti-chevauchement`, etc.

---

## PHASE 6 — Développement de l'application mobile (C2.2.1, C2.2.3)

### 6.1 Fondations

1. Structure : écrans dans `app/` (Expo Router), logique dans `src/{api,components,features,hooks,lib}`.
2. Client HTTP : instance Axios avec `baseURL = EXPO_PUBLIC_API_URL`, intercepteur qui rafraîchit automatiquement l'access token sur 401 (une seule tentative, puis déconnexion).
3. Stockage des tokens : access token en mémoire (state), **refresh token dans expo-secure-store** (Keychain iOS / Keystore Android — stockage chiffré natif, argument sécurité à valoriser dans `docs/05-securite-owasp.md`).
4. `AuthProvider` (contexte) + protection des routes : layouts Expo Router avec redirection vers `/login` si non authentifié ; groupe de routes `(admin)` réservé au rôle ADMIN.
5. TanStack Query pour tout appel API (clés de cache normalisées, invalidation après mutation, `refetchOnReconnect` activé — pertinent sur réseau mobile).

### 6.2 Écrans à implémenter (routes Expo Router)

| Route | Écran | Contenu clé |
|---|---|---|
| `/login`, `/register` | Auth | formulaires validés (react-hook-form + zod), erreurs annoncées, clavier géré (`KeyboardAvoidingView`) |
| `/(tabs)/rooms` | Liste des salles | cartes salle (nom, capacité, équipements), pull-to-refresh, états vide/chargement/erreur |
| `/rooms/[id]` | Détail + réservation | grille hebdomadaire des créneaux (pas de 30 min), créneaux occupés grisés, sélection début/fin, cases à cocher matériel disponible, confirmation |
| `/(tabs)/bookings` | Mes réservations | à venir / passées, bouton annuler avec **dialogue de confirmation natif** (`Alert`) |
| `/rooms/[id]/chat` | Chat de salle | historique (scroll infini par cursor via `FlatList` inversée), envoi temps réel, indicateur de connexion, auteurs + horodatage |
| `/(tabs)/admin` | Administration | CRUD salles et matériel, liste de toutes les réservations (onglet visible ADMIN uniquement) |

Navigation principale : **barre d'onglets en bas** (Salles / Mes réservations / Admin si ADMIN / Profil avec déconnexion).

### 6.3 Ergonomie et composants d'interface (critère C2.2.1 : « fenêtres, boutons, menus présents et fonctionnels »)

- Composants réutilisables dans `src/components/` : `Button`, `Input`, `Select`, `Modal`, `Toast` (notifications de succès/erreur après chaque mutation), `Spinner`, `EmptyState`, `Card`.
- Style : `StyleSheet` React Native avec un thème centralisé (`src/lib/theme.ts` : couleurs, espacements, tailles de police) — pas de valeurs en dur dans les écrans.
- Toute action asynchrone a un état de chargement visible et un feedback (toast succès ou message d'erreur exploitable).
- Zones tactiles ≥ 44×44 pt, gestion du clavier sur tous les formulaires, `SafeAreaView` partout (encoches), pull-to-refresh sur toutes les listes.
- Tester sur au moins deux tailles d'écran (petit ~5" et grand ~6,7" via émulateurs) ; orientation portrait verrouillée (documenter ce choix).

### 6.4 Accessibilité dès le développement (voir Phase 8 pour le référentiel)

Utiliser systématiquement les props d'accessibilité React Native : `accessibilityLabel` sur tout élément interactif, `accessibilityRole` (`button`, `header`, `link`…), `accessibilityState` (désactivé, sélectionné), `accessibilityHint` quand l'action n'est pas évidente. Composants tactiles natifs (`Pressable`) et jamais de `View` cliquable sans rôle. Annonce des changements dynamiques (`AccessibilityInfo.announceForAccessibility` à l'arrivée d'un message de chat, erreurs de formulaire associées aux champs). Contrastes ≥ 4.5:1 dans le thème. Tailles de police dynamiques respectées (`allowFontScaling` non désactivé). Navigation complète possible avec TalkBack (Android) et VoiceOver (iOS si accessible).

### 6.5 Commits

`feat(mobile): auth, navigation et client api`, `feat(mobile): réservation de salles et matériel`, `feat(mobile): chat temps réel`, `feat(mobile): administration`.

---

## PHASE 7 — Harnais de tests unitaires (C2.2.2)

> Critère du jury : « Les tests unitaires couvrent la majorité du code développé. » Cible : **≥ 80 % de couverture (lignes et branches) sur les services backend et les modules de logique mobile**, mesurée et affichée en CI.

### 7.1 Backend (Jest)

Tests unitaires avec Prisma **mocké** (pattern `useValue` + `jest.fn()`), au minimum :
- `AuthService` : inscription (hachage appelé, email dupliqué → erreur), login (succès, mauvais mot de passe, compte inexistant → même erreur générique), refresh (token valide/invalide/révoqué).
- `BookingsService` (**suite la plus complète du projet**) : tous les cas du § 4.5 — créneau invalide, passé, trop court/long, non aligné, chevauchement salle exact/partiel/englobant, chevauchement avec booking `CANCELLED` (doit passer), matériel d'une autre salle, matériel déjà pris, annulation par autrui, annulation d'une réservation passée.
- `RoomsService`, `EquipmentService` : CRUD + désactivation logique.
- `ChatGateway` : accès refusé sans réservation, message vide/trop long rejeté.

Tests e2e API (Supertest + BDD PostgreSQL réelle, `backend/test/`) sur les parcours critiques : register → login → créer réservation → conflit 409 → annulation → accès chat.

### 7.2 Mobile (Jest + jest-expo + React Native Testing Library)

Au minimum : logique de calcul des créneaux disponibles (fonction pure, à extraire dans `src/lib/` — la tester exhaustivement), schémas de validation zod des formulaires, hook d'authentification (mock de secure-store et de l'API), composants formulaires de connexion/réservation (validation, soumission, affichage des erreurs, via React Native Testing Library), composant liste de messages (rendu, labels d'accessibilité présents).

### 7.3 Intégration CI

Les seuils de couverture sont **bloquants** dans la config Jest des deux apps (`coverageThreshold`) : la CI échoue sous 80 %. Publier le résumé de couverture dans le job summary GitHub Actions.

### 7.4 Commits

`test(backend): harnais de tests unitaires services auth et bookings`, `test(mobile): tests unitaires logique de créneaux, hooks et composants`, `test(backend): tests e2e api parcours critiques`.

---

## PHASE 8 — Sécurité OWASP et accessibilité (C2.2.3)

### 8.1 Livrable — `docs/05-securite-owasp.md`

Document structuré en **10 sections, une par faille de l'OWASP Top 10 (2021)**. Pour chacune : description de la faille, risque concret dans SoundProof, mesures implémentées (avec référence aux fichiers de code), et le cas échéant limites résiduelles. Correspondances à couvrir :

| OWASP | Mesures dans SoundProof |
|---|---|
| A01 Broken Access Control | Guards JWT + rôles sur chaque route d'écriture, vérification de propriété (annulation), contrôle d'accès au chat, tests dédiés ; **contrôles toujours côté API** (jamais uniquement dans l'app : un APK se décompile) |
| A02 Cryptographic Failures | argon2, secrets en variables d'environnement, refresh tokens hachés en BDD et stockés côté mobile dans **expo-secure-store** (Keychain/Keystore chiffrés), HTTPS documenté pour la prod |
| A03 Injection | Prisma (requêtes paramétrées), `ValidationPipe` + `class-validator` sur 100 % des entrées, validation des payloads WebSocket |
| A04 Insecure Design | règles métier en transaction, annulation logique (traçabilité), rate limiting |
| A05 Security Misconfiguration | Helmet, `whitelist: true`, Swagger désactivé en prod, conteneur non-root, BDD non exposée, aucun secret dans le bundle mobile (les variables `EXPO_PUBLIC_*` sont lisibles dans l'APK — n'y mettre que l'URL de l'API, le documenter) |
| A06 Vulnerable Components | `npm audit` en CI, Dependabot activé sur le repo, `npx expo-doctor` (versions Expo cohérentes) |
| A07 Auth Failures | politique de mot de passe, throttling sur login, messages génériques, expiration courte des access tokens, invalidation au logout |
| A08 Integrity Failures | lockfiles committés, `npm ci` en CI, images Docker versionnées, builds EAS signés (keystore Android géré par EAS) |
| A09 Logging Failures | logger NestJS structuré : échecs d'authentification et refus d'accès journalisés (sans données sensibles) |
| A10 SSRF | aucune requête sortante construite depuis une entrée utilisateur (le vérifier et l'affirmer) |

Implémenter dans le code tout ce qui est listé ci-dessus et n'existe pas encore, y compris l'activation de Dependabot (`.github/dependabot.yml`).

### 8.2 Livrable — `docs/06-accessibilite.md`

1. **Choix et justification du référentiel** (exigé par le critère) : **WCAG 2.1 niveau AA**, via la norme européenne **EN 301 549** qui l'applique aux applications mobiles natives. Justifier ce choix par rapport au RGAA cité en exemple dans la grille : le RGAA 4 est la déclinaison française des WCAG **pour le web** et ne couvre pas les applications mobiles natives ; pour le mobile, la référence légale française/européenne est l'EN 301 549 (elle-même fondée sur les WCAG). Mentionner OPQUAST en complément méthodologique.
2. Liste des critères WCAG 2.1 AA couverts, organisée par principe (perceptible, utilisable, compréhensible, robuste) avec, pour chaque critère traité : la mesure prise (props d'accessibilité React Native, contrastes du thème, tailles tactiles, annonces dynamiques…) et l'écran/composant concerné.
3. **Audit** : passage complet de l'application avec **TalkBack** (lecteur d'écran Android) sur les 6 écrans principaux + analyse avec **Accessibility Scanner** (Google, Android) + vérification des contrastes du thème + test avec taille de police système agrandie (200 %). Consigner les résultats (tableau écran → outil → anomalies → correction).
4. Limites connues et pistes d'amélioration (ex. audit VoiceOver iOS si matériel disponible).

### 8.3 Commits

`feat: durcissement sécurité (helmet, throttler, dependabot)`, `docs: analyse owasp top 10`, `docs: référentiel accessibilité wcag/en 301 549 et audit`.

---

## PHASE 9 — Cahier de recettes et tests E2E (C2.3.1)

### 9.1 Livrable — `docs/07-cahier-de-recettes.md`

> Critère du jury : le cahier « reprend l'ensemble des fonctionnalités attendues » avec « tests fonctionnels, structurels et de sécurité ».

Structure obligatoire :

1. **Préambule** : environnement de recette (versions, appareil/émulateur utilisé — modèle et version d'Android —, APK de build `preview`, données de seed, comptes de test), stratégie.
2. **Scénarios de tests fonctionnels** : au minimum 20 scénarios couvrant les 10 user stories (cas nominal + cas d'erreur pour chacune). Format tabulaire strict par scénario :

| Champ | Contenu |
|---|---|
| ID | `TF-001` |
| User story | US5 |
| Titre | Réservation d'un créneau libre |
| Préconditions | membre connecté, salle A sans réservation le 2026-09-01 10:00-12:00 |
| Étapes | numérotées, précises, reproductibles |
| Résultat attendu | réservation visible dans « Mes réservations », toast de confirmation, créneau grisé |
| Résultat obtenu | à remplir lors de l'exécution |
| Statut | OK / KO |

   Inclure des scénarios **spécifiques au mobile** : comportement hors connexion (message d'erreur exploitable, pas de crash), reprise après passage en arrière-plan (le chat se reconnecte et récupère les messages manqués), rotation/retour clavier sans perte de saisie.
3. **Tests structurels** : exécution du harnais complet (couverture ≥ 80 %), lint 0 erreur, `expo-doctor` 0 erreur, build EAS `preview` réussi, healthcheck API OK — avec résultats consignés.
4. **Tests de sécurité** : au minimum 8 scénarios `TS-xxx` : accès API sans token (401, via requête directe curl/Postman), accès admin avec compte membre (403), annulation de la réservation d'autrui (403), tentative d'injection dans les champs texte (contenu neutralisé), XSS dans un message de chat (affiché comme texte inerte), brute force sur login (429 après 5 essais), accès au chat d'une salle sans réservation (refus), payload non whitelisté rejeté (400).
5. **Synthèse** : tableau récapitulatif nombre de tests OK/KO par catégorie. **Les tests KO alimentent le plan de correction (Phase 10).**

### 9.2 Automatisation Maestro (`mobile/e2e/`)

Écrire des flows Maestro (YAML) automatisant au minimum 6 scénarios du cahier : inscription + connexion, réservation complète salle + matériel, refus de créneau en conflit (message d'erreur affiché), annulation d'une réservation, envoi d'un message de chat et vérification de son affichage, absence de l'onglet admin pour un compte membre. Les flows s'exécutent en local sur l'émulateur Android contre l'app de dev (`maestro test e2e/`). Documenter la procédure d'exécution dans le cahier de recettes ; l'intégration en CI est **optionnelle** (émulateur en CI = lourd), l'exécution locale documentée avec résultats consignés suffit.

### 9.3 Exécution réelle

**Exécuter le cahier de recettes intégralement sur l'APK de build `preview`** (pas seulement dans Expo Go) et remplir les colonnes « Résultat obtenu / Statut ». Ne pas falsifier : si un test est KO, il le reste dans le document et passe en Phase 10.

### 9.4 Commits

`docs: cahier de recettes`, `test(e2e): flows maestro du cahier de recettes`, `docs: résultats d'exécution de la recette`.

---

## PHASE 10 — Plan de correction des bogues (C2.3.2)

### 10.1 Livrable — `docs/08-plan-correction-bogues.md`

> Critère du jury : bogues « détectés, qualifiés et traités », analyse des points d'amélioration « pour chaque test en échec ».

1. **Processus de gestion des bogues** (workflow) : détection (recette, CI, usage) → qualification (gravité : bloquant / majeur / mineur / cosmétique ; priorité ; composant : API / mobile / infra) → création d'une issue GitHub via le template → correction sur branche `fix/…` avec **test de non-régression obligatoire** → PR + CI verte → fermeture avec référence au commit.
2. **Template d'issue** : créer `.github/ISSUE_TEMPLATE/bug_report.yml` (champs : description, étapes de reproduction, comportement attendu/observé, gravité, environnement — appareil, version d'Android, version de l'app —, captures).
3. **Registre des bogues réels** : tableau de tous les bogues rencontrés pendant le développement et la recette : ID, origine (ID du test de recette le cas échéant), description, gravité, **analyse de cause racine**, correction apportée (lien commit), test de non-régression ajouté, statut. **Documenter au minimum les bogues réellement rencontrés — il y en aura ; ne rien inventer, mais tracer systématiquement dès la Phase 5.**
4. Pour chaque test de recette KO : analyse du point d'amélioration, correction, re-exécution du test, mise à jour du cahier de recettes.

### 10.2 Commits

`docs: plan de correction des bogues et registre`, commits `fix:` individuels référencés dans le registre.

---

## PHASE 11 — Documentation d'exploitation (C2.4.1)

> Critère du jury : manuels « rédigés avec clarté », documentation décrivant « les choix opérés en termes de technologies, de langages, etc. ». Rédiger les trois manuels pour un lecteur qui **ne connaît pas le projet**.

### 11.1 `docs/09-manuel-deploiement.md`

Deux parties :
1. **API** : prérequis (Docker, versions), variables d'environnement (tableau exhaustif : nom, description, exemple, obligatoire ou non), déploiement pas à pas de zéro (`git clone` → `.env` → `docker compose -f docker-compose.prod.yml up -d` → vérification `/health`), initialisation BDD (migrations automatiques + seed optionnel), architecture déployée (schéma des conteneurs), procédure de rollback, sauvegardes/restauration PostgreSQL (`pg_dump`/`pg_restore`), dépannage (tableau symptôme → cause → solution).
2. **Application mobile** : prérequis (compte Expo, `EXPO_TOKEN`), configuration de l'URL d'API dans le build, lancement d'un build (`eas build --platform android --profile preview`), récupération et installation de l'APK (activation des sources inconnues), distribution via GitHub Release/QR code, procédure documentée (non exécutée) de publication sur Google Play, dépannage (app ne joint pas l'API : vérifier URL/HTTPS/réseau).

### 11.2 `docs/10-manuel-utilisation.md`

Commencer par l'installation de l'app (téléchargement de l'APK depuis la Release, installation). Puis, par profil (membre puis admin), toutes les fonctionnalités écran par écran : inscription, connexion, recherche de salle, lecture du calendrier, réservation avec matériel, annulation, utilisation du chat, administration des salles/matériel/réservations. Illustrer par des captures d'écran de l'émulateur (stockées dans `docs/assets/`). Ajouter une FAQ (8-10 questions, dont : « que se passe-t-il sans connexion ? », « comment savoir si ma réservation est confirmée ? »).

### 11.3 `docs/11-manuel-mise-a-jour.md`

Procédure de montée de version côté API (pull du nouveau tag → migrations → redémarrage) et côté mobile (incrément de `version` dans `app.json`, nouveau build EAS, distribution de la nouvelle APK, mention des mises à jour OTA `eas update` comme évolution possible pour le JS pur), gestion des migrations Prisma (création, application, retour arrière), **compatibilité API/app** (règle : l'API doit rester rétrocompatible avec la version mobile N-1, car les utilisateurs ne mettent pas à jour immédiatement), mise à jour des dépendances (processus Dependabot + `npm audit` + montées de version du SDK Expo via `npx expo install --fix`), politique de versionnage (rappel SemVer + CHANGELOG), procédure de hotfix (branche depuis `main`, patch, tag), tests à exécuter avant toute mise en production.

### 11.4 Commits

`docs: manuels de déploiement, d'utilisation et de mise à jour`.

---

## PHASE 12 — Finalisation et livraison (C2.2.4)

1. **README.md final** : présentation, captures d'écran de l'app, badges CI, stack, démarrage rapide dev (< 10 commandes, incluant le lancement Expo Go), liens vers les 11 documents de `docs/`, correspondance compétences ↔ livrables (reprendre le tableau § 0.4).
2. **CHANGELOG.md** complété : au minimum `v0.1.0` (socle + auth), `v0.2.0` (réservations salles), `v0.3.0` (matériel), `v0.4.0` (chat), `v0.5.0` (admin), `v1.0.0` (recette validée + documentation complète). **Chaque version doit correspondre à un tag git réel poussé** — c'est l'« historique des différentes versions » exigé par le livrable C2.2.4.
3. Fusionner `develop` dans `main`, taguer `v1.0.0`, vérifier que le workflow CD s'exécute intégralement (image API sur ghcr.io, build EAS, APK attaché à la GitHub Release).
4. **Vérification finale de conformité** — contrôler chaque ligne :
   - [ ] Les 11 documents de `docs/` existent et sont complets.
   - [ ] CI verte sur `main` ; couvertures ≥ 80 % ; lint 0 erreur ; `expo-doctor` 0 erreur.
   - [ ] Les 10 user stories fonctionnent en manipulation autonome sur l'APK installé (critère C2.2.4 : « logiciel fonctionnel et manipulable en autonomie par un utilisateur »).
   - [ ] Cahier de recettes exécuté sur l'APK `preview`, résultats consignés, bogues KO tracés et corrigés.
   - [ ] Historique git : commits conventionnels, branches, tags semver, CHANGELOG cohérent.
   - [ ] Aucun secret committé ; `.env.example` à jour ; seed fonctionnel ; aucun secret dans le bundle mobile.
   - [ ] Sur une machine vierge : l'API démarre avec `docker compose -f docker-compose.prod.yml up -d` et l'APK de la Release s'installe et fonctionne, en suivant uniquement le manuel de déploiement.

---

## Règles transverses pour l'IA exécutante

1. **Ordre strict** : réaliser les phases dans l'ordre. Les documents des phases 2-4 se rédigent AVANT le code qu'ils encadrent ; ceux des phases 9-11 se finalisent APRÈS exécution réelle.
2. **Traçabilité permanente** : committer fréquemment (grain : une fonctionnalité ou un document par commit), messages Conventional Commits en français, pousser régulièrement pour matérialiser l'historique.
3. **Ne jamais simuler** : les résultats de tests, couvertures, audits d'accessibilité et résultats de recette consignés dans les documents doivent provenir d'exécutions réelles.
4. **Tout en français** : documents, messages de commit, interface utilisateur, messages d'erreur. Le code (identifiants, noms de variables) reste en anglais, conventions du métier.
5. **Dépendances de l'utilisateur** : certaines étapes requièrent une action humaine — création du compte Expo, secret `EXPO_TOKEN` sur GitHub, installation d'Expo Go ou d'un émulateur Android, exécution des builds EAS et des tests Maestro sur émulateur. Préparer tout ce qui peut l'être, puis lister précisément à l'utilisateur les actions attendues de sa part, au moment où elles bloquent.
6. **En cas de blocage technique** (dépendance cassée, incompatibilité de versions — fréquent dans l'écosystème React Native : toujours utiliser `npx expo install` plutôt que `npm install` pour les paquets liés à Expo), choisir l'alternative la plus proche, documenter le choix dans `docs/04-architecture-logicielle.md` et le signaler à l'utilisateur.
7. **Qualité avant quantité** : si un arbitrage est nécessaire, privilégier la robustesse des règles métier de réservation, la couverture de tests et la complétude des livrables documentaires — ce sont les critères notés.
