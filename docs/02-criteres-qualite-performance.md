# Critères de qualité et de performance — SoundProof

> **Compétence visée : C2.1.1** — Ce document définit les critères de qualité et de performance du logiciel SoundProof, chacun étant **mesurable**, associé à un **outil de mesure** et à un **moment de vérification**. Il décrit également en détail l'environnement de développement mis en place.

## 1. Critères mesurables

| Catégorie      | Critère                                                                  | Cible                                                         | Outil de mesure                                         | Vérifié quand                 |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------- |
| Qualité code   | Erreurs de lint                                                          | 0 erreur, 0 warning                                           | ESLint (flat config, backend et mobile)                 | pre-commit (lint-staged) + CI |
| Qualité code   | Formatage uniforme                                                       | 100 % des fichiers conformes                                  | Prettier (config partagée racine)                       | pre-commit (lint-staged) + CI |
| Qualité code   | Typage strict                                                            | `strict: true` dans les deux tsconfig, 0 `any` non justifié   | `tsc --noEmit` (script `typecheck`)                     | CI                            |
| Qualité code   | Messages de commit conventionnels                                        | 100 % des commits conformes                                   | commitlint (config conventional)                        | hook commit-msg               |
| Qualité mobile | Projet Expo sain                                                         | 0 erreur (« checks passed »)                                  | `npx expo-doctor`                                       | CI                            |
| Tests          | Couverture unitaire de la logique métier                                 | ≥ 80 % lignes et branches (services backend + logique mobile) | Jest (`test:cov`, seuils `coverageThreshold` bloquants) | CI                            |
| Tests          | Tests e2e API sur les parcours critiques                                 | 100 % passants                                                | Jest + Supertest (BDD PostgreSQL de service)            | CI                            |
| Performance    | Temps de réponse API (p95, endpoints CRUD)                               | < 200 ms en local                                             | test dédié / logs de l'API                              | recette                       |
| Performance    | Démarrage à froid de l'app (splash → écran utilisable)                   | < 3 s sur émulateur                                           | chronométrage documenté                                 | recette                       |
| Performance    | Navigation entre écrans                                                  | < 300 ms, aucun gel d'interface                               | observation + React DevTools                            | recette                       |
| Performance    | Latence d'un message de chat (émission → réception)                      | < 500 ms en local                                             | test manuel chronométré                                 | recette                       |
| Accessibilité  | Conformité WCAG 2.1 AA (via EN 301 549, voir `docs/06-accessibilite.md`) | 100 % des écrans audités, 0 anomalie bloquante                | audit manuel TalkBack + Accessibility Scanner (Android) | recette                       |
| Sécurité       | Vulnérabilités des dépendances                                           | 0 critique / haute                                            | `npm audit --audit-level=high`                          | CI                            |

### Lecture du tableau

- **pre-commit / commit-msg** : hooks git locaux (Husky), première ligne de défense — un commit non conforme est refusé avant même d'atteindre le dépôt distant.
- **CI** : pipeline GitHub Actions (`.github/workflows/ci.yml`), exécuté à chaque push et pull request — voir `docs/03-protocole-integration-continue.md`.
- **recette** : campagne de tests fonctionnels documentée dans `docs/07-cahier-de-recettes.md`, exécutée sur l'APK de build `preview` avant chaque version taguée.

## 2. Environnement de développement détaillé

### 2.1 Poste de travail

| Élément            | Choix                  | Détail                                                                                 |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------- |
| Éditeur recommandé | **Visual Studio Code** | Extensions : ESLint, Prettier, Prisma, Expo Tools                                      |
| Runtime            | **Node.js ≥ 20 LTS**   | Gestionnaire de paquets : **npm** (lockfiles committés)                                |
| Conteneurisation   | **Docker Desktop**     | PostgreSQL 16 en développement (`docker-compose.yml`), API conteneurisée en production |

### 2.2 Compilation et exécution

| Élément                   | Backend (NestJS)                                                                                                    | Mobile (Expo / React Native)                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compilateur               | **tsc** (TypeScript), piloté par la CLI NestJS (`nest build` / `nest start --watch`)                                | **Metro** (bundler JavaScript) + moteur **Hermes** (compilation du bundle en bytecode) ; transformation TypeScript via Babel, vérification des types par `tsc --noEmit` |
| Serveur d'application     | **NestJS/Express** en mode watch (hot-reload) en développement ; **Node.js dans un conteneur Docker** en production | **Serveur de développement Expo** (`npx expo start`) servant le bundle à l'app                                                                                          |
| Environnement d'exécution | Node.js 20 (local puis conteneur)                                                                                   | **Expo Go** en développement (téléphone physique ou émulateur) ; **build natif EAS** (APK/AAB) en préversion et production                                              |
| Émulateur / appareil      | —                                                                                                                   | Émulateur **Android** (Android Studio) et/ou appareil physique Android via Expo Go                                                                                      |

### 2.3 Gestion des sources et des données

| Élément                   | Choix             | Détail                                                                                                                                      |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Gestion de sources        | **git + GitHub**  | Branches `main` / `develop` / branches de travail (`feat/…`, `fix/…`, `docs/…`, `chore/…`), Conventional Commits, tags SemVer (voir README) |
| Base de données           | **PostgreSQL 16** | Dockerisée en développement (port 5432, volume nommé, healthcheck `pg_isready`)                                                             |
| ORM / gestionnaire de BDD | **Prisma**        | Migrations versionnées (`prisma/migrations/`), interface graphique **Prisma Studio** (`npx prisma studio`)                                  |

### 2.4 Outillage qualité intégré au poste de développeur

- **ESLint** (flat config) : `eslint.config.mjs` côté backend (typescript-eslint + règles NestJS), `eslint.config.js` côté mobile (`eslint-config-expo`), tous deux intégrant Prettier en règle (`eslint-plugin-prettier`).
- **Prettier** : configuration **partagée à la racine** (`.prettierrc` : `singleQuote: true`, `semi: true`, `printWidth: 100`) pour un formatage identique dans les deux applications.
- **Husky + lint-staged** : hook `pre-commit` exécutant ESLint `--fix` puis Prettier sur les seuls fichiers stagés (configurations `.lintstagedrc.json` par application).
- **commitlint** : hook `commit-msg` refusant tout message non conforme aux Conventional Commits.
- **Scripts npm normalisés** dans les deux applications : `dev`, `lint`, `format`, `test`, `test:cov`, `typecheck`.

## 3. Environnements d'exécution du projet

| Environnement | Contenu                                                                                 | Usage                                            |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `development` | API locale (watch) + PostgreSQL Docker + app dans Expo Go                               | Développement quotidien, rechargement instantané |
| `test`        | CI GitHub Actions, PostgreSQL éphémère (service), builds de vérification                | Validation automatique de chaque push/PR         |
| `preview`     | APK Android (profil EAS `preview`) pointant vers l'API de démo                          | Recette et démonstration au jury                 |
| `production`  | API en conteneurs (`docker-compose.prod.yml`) + build AAB/IPA (profil EAS `production`) | Cible de déploiement final                       |

Le détail des séquences de déploiement de ces environnements est décrit dans `docs/01-protocole-deploiement-continu.md`.
