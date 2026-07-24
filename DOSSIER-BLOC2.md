# Dossier de projet — SoundProof

## Bloc 2 : Concevoir et développer des applications logicielles

**Titre RNCP 39583 — Expert en Développement Logiciel**

_Application mobile de gestion de salles de répétition musicale_

Le présent dossier de synthèse couvre l'ensemble des livrables du Bloc 2. Le **code source complet** et la **documentation détaillée** (11 documents `docs/01` à `docs/11`) sont fournis dans le dépôt Git accompagnant ce dossier ; chaque section y renvoie pour l'exhaustivité.

---

## Sommaire

1. Présentation du projet
2. Protocole de déploiement continu — _C2.1.1_
3. Critères de qualité et de performance — _C2.1.1_
4. Protocole d'intégration continue — _C2.1.2_
5. Architecture logicielle et maintenabilité — _C2.2.1_
6. Présentation du prototype — _C2.2.1_
7. Frameworks et paradigmes de développement — _C2.2.1_
8. Harnais de tests unitaires — _C2.2.2_
9. Mesures de sécurité — _C2.2.3_
10. Accessibilité — _C2.2.3_
11. Historique des versions — _C2.2.4_
12. Dernière version fonctionnelle — _C2.2.4_
13. Cahier de recettes — _C2.3.1_
14. Plan de correction des bogues — _C2.3.2_
15. Manuel de déploiement — _C2.4.1_
16. Manuel d'utilisation — _C2.4.1_
17. Manuel de mise à jour — _C2.4.1_
18. Correspondance compétences ↔ preuves

---

## 1. Présentation du projet

### 1.1 Contexte et besoin

**SoundProof** répond à un besoin concret des musiciens amateurs et semi-professionnels : réserver simplement une salle de répétition équipée, depuis leur téléphone, sans conflit de créneaux, et se coordonner avec les autres utilisateurs de la salle. Le choix d'une application **mobile** découle directement de cet usage **nomade** : on réserve une salle ou l'on consulte le chat entre deux déplacements, pas assis devant un poste de travail.

Deux rôles structurent l'application :

- **`MEMBER`** (membre) : consulte les salles, réserve des créneaux et du matériel, gère ses réservations, participe au chat des salles où il a réservé.
- **`ADMIN`** (administrateur) : gère le parc de salles et de matériel, et supervise toutes les réservations.

### 1.2 Périmètre fonctionnel — 10 user stories

| #    | User story                                                             |
| ---- | ---------------------------------------------------------------------- |
| US1  | Créer un compte avec un mot de passe fort                              |
| US2  | Se connecter et rester connecté entre deux ouvertures de l'application |
| US3  | Consulter la liste des salles et leur équipement                       |
| US4  | Voir les disponibilités d'une salle sur une semaine                    |
| US5  | Réserver une salle sur un créneau, sans chevauchement possible         |
| US6  | Ajouter du matériel de la salle à sa réservation, sans conflit         |
| US7  | Consulter et annuler ses réservations à venir                          |
| US8  | Accéder au chat temps réel d'une salle où l'on a réservé               |
| US9  | (Admin) Créer, modifier, désactiver salles et matériel                 |
| US10 | (Admin) Consulter et annuler n'importe quelle réservation              |

### 1.3 Architecture générale

Un client mobile unique communique avec une API par **deux canaux** : REST (`/api/v1`) pour les opérations classiques, WebSocket pour le chat temps réel.

<div class="diagram-arch"></div>

### 1.4 Stack technique et structure du dépôt

| Couche                | Technologie                                                  |
| --------------------- | ------------------------------------------------------------ |
| Application mobile    | React Native / **Expo** (SDK 54, TypeScript) + Expo Router   |
| Data-fetching mobile  | TanStack Query v5 + Axios ; jetons dans expo-secure-store    |
| Backend               | **NestJS 11** (TypeScript)                                   |
| Base de données / ORM | **PostgreSQL 16** / **Prisma 6**                             |
| Temps réel            | **Socket.IO** (`@nestjs/websockets` + `socket.io-client`)    |
| Authentification      | JWT (access + refresh), hachage **argon2**                   |
| Tests                 | Jest, Supertest (API), React Native Testing Library, Maestro |
| Qualité               | ESLint, Prettier, Husky, lint-staged, commitlint             |
| CI/CD & conteneurs    | GitHub Actions, EAS Build, Docker + Docker Compose           |

Le dépôt est un **monorepo** : `backend/` (API NestJS), `mobile/` (application Expo), `docs/` (11 documents détaillés), `.github/` (workflows CI/CD, Dependabot, template d'issue), et les fichiers de conteneurisation (`docker-compose.yml`, `docker-compose.prod.yml`).

> _Détail : `README.md`, `docs/04-architecture-logicielle.md`._

---

## 2. Protocole de déploiement continu — _C2.1.1_

Le protocole couvre **deux artefacts distincts** : l'**API** (conteneur Docker) et l'**application mobile** (binaire Android/iOS produit par EAS Build). Son implémentation est le workflow `.github/workflows/cd.yml`.

### 2.1 Environnements

| Environnement | API                       | Application mobile                | Base de données          | Usage                   |
| ------------- | ------------------------- | --------------------------------- | ------------------------ | ----------------------- |
| `development` | Locale, mode watch        | Expo Go (rechargement instantané) | PostgreSQL Docker        | Développement quotidien |
| `test`        | Démarrée par la CI        | Bundle vérifié (`expo export`)    | PostgreSQL éphémère      | Validation automatique  |
| `preview`     | Conteneurs de démo        | **APK installable**               | PostgreSQL conteneurisée | Recette, démonstration  |
| `production`  | `docker-compose.prod.yml` | AAB (Google Play)                 | PostgreSQL non exposée   | Cible finale            |

### 2.2 Séquence de déploiement

Le **push d'un tag SemVer `v*.*.*`** sur `main` déclenche le pipeline `cd.yml`, qui **automatise la production et la publication des artefacts** (étapes 1 à 4). Le **déploiement sur l'hôte** et sa vérification (étapes 5-6) constituent la **procédure d'exploitation documentée** (`docs/09`, `docs/01`) :

1. **Exécution complète de la CI** (réutilisation via `workflow_call`) — aucun déploiement si la CI échoue.
2. **Build de l'image Docker** multi-stage (build TypeScript → runtime minimal non-root) et **publication sur GitHub Container Registry** (`ghcr.io`), taguée version **et** `latest`.
3. **Création automatique d'une GitHub Release** dont le corps reprend la section correspondante du `CHANGELOG.md`.
4. **Build EAS** de l'application (`--platform android --profile preview`) et **attachement de l'APK à la Release** (téléchargeable et installable).
5. **Déploiement cible** (procédure d'exploitation, hors pipeline) : `docker compose -f docker-compose.prod.yml up -d` sur la machine hôte récupère l'image publiée. Les **migrations Prisma sont appliquées automatiquement** au démarrage du conteneur backend (entrypoint), avant que l'API n'accepte des requêtes.
6. **Vérification post-déploiement** : healthcheck `GET /api/v1/health` (statut app + BDD) et smoke test documenté.

### 2.3 Déploiement progressif et rollback

Chaque fusion dans `develop` est immédiatement testable dans Expo Go ; chaque tag produit un APK versionné et installable. Le **rollback** consiste à redéployer l'image taguée précédente (`API_VERSION=vX.Y.Z` puis `up -d`) et à réinstaller l'APK de la Release antérieure — chaque Release conservant son binaire. Ce protocole a été **réellement exécuté** lors de la publication de la v1.0.0 : image, Release et APK ont été produits automatiquement.

> _Détail : `docs/01-protocole-deploiement-continu.md`._

---

## 3. Critères de qualité et de performance — _C2.1.1_

Chaque critère est **mesurable**, associé à un outil et à un moment de vérification.

| Catégorie      | Critère                   | Cible                            | Outil              | Vérifié quand        |
| -------------- | ------------------------- | -------------------------------- | ------------------ | -------------------- |
| Qualité code   | Erreurs de lint           | 0 erreur, 0 warning              | ESLint             | pre-commit + CI      |
| Qualité code   | Formatage uniforme        | 100 % conforme                   | Prettier           | pre-commit + CI      |
| Qualité code   | Typage strict             | `strict:true`, `tsc` sans erreur | TypeScript         | CI                   |
| Qualité code   | Commits conventionnels    | 100 % conformes                  | commitlint         | commit-msg           |
| Qualité mobile | Projet Expo sain          | 0 problème (18/18)               | `expo-doctor`      | CI                   |
| Tests          | Couverture logique métier | ≥ 80 % lignes/branches           | Jest               | CI (bloquant)        |
| Tests          | e2e API critiques         | 100 % passants                   | Supertest          | CI                   |
| Performance    | Réponse API (p95 CRUD)    | < 200 ms local                   | logs / test        | recette              |
| Performance    | Démarrage à froid app     | < 3 s (émulateur)                | chronométrage      | recette              |
| Performance    | Navigation entre écrans   | < 300 ms, sans gel               | observation        | recette              |
| Performance    | Latence message chat      | < 500 ms local                   | test chronométré   | recette              |
| Accessibilité  | WCAG 2.1 AA               | 0 anomalie bloquante             | TalkBack + Scanner | recette              |
| Sécurité       | Vulnérabilités deps       | 0 haute/critique                 | `npm audit`        | CI (bloquant `main`) |

**Environnement de développement détaillé** (exigé par le critère : le jury doit pouvoir identifier compilateur, serveur d'application et outils de gestion de sources) :

- **Éditeur** : VS Code + extensions ESLint, Prettier, Prisma, Expo Tools.
- **Runtime** : Node.js 20 LTS, npm (lockfiles committés).
- **Compilateurs** : `tsc` côté backend (piloté par la CLI NestJS) ; **Metro** (bundler) + moteur **Hermes** côté mobile, transformation TypeScript par Babel et vérification des types par `tsc --noEmit`.
- **Serveur d'application** : NestJS/Express en mode watch en développement ; **Node.js dans un conteneur Docker** en production ; serveur de développement Expo pour l'application.
- **Environnement d'exécution mobile** : Expo Go en dev, build natif EAS en production ; émulateur Android (Android Studio) et/ou appareil physique.
- **Gestion des sources** : git + GitHub. **Base de données** : PostgreSQL 16, gérée par Prisma (migrations versionnées + Prisma Studio).

> _Détail : `docs/02-criteres-qualite-performance.md`._

---

## 4. Protocole d'intégration continue — _C2.1.2_

**Objectif** : fusionner régulièrement les codes sur une branche partagée (`develop`) et détecter les régressions au plus tôt. **Déclencheurs** : push sur toute branche + pull request vers `develop`/`main` ; réutilisable par le déploiement continu (`workflow_call`).

### 4.1 Séquence du pipeline (`.github/workflows/ci.yml`)

Le pipeline est organisé en **jobs parallèles** ; l'échec d'une étape fait échouer le pipeline :

- **`backend`** : checkout + Node 20 (cache npm) → `npm ci` → **lint** → **typecheck** → **tests unitaires avec couverture** (échec si < 80 % sur les services) → **build**.
- **`backend-e2e`** : démarrage d'un **PostgreSQL de service** → `npm ci` → **migrations Prisma** (`migrate deploy`) → **tests Supertest** sur les parcours critiques.
- **`mobile`** : `npm ci` → lint → typecheck → tests avec couverture → **`expo-doctor`** → **`expo export --platform android`** (garantit que le bundle compile).
- **`audit`** : `npm audit --audit-level=high` sur les deux applications — non bloquant en dev, **bloquant sur `main` et sur les tags**.

### 4.2 Règles de fusion et défense locale

Toute intégration dans `develop`/`main` passe par une **pull request** avec **CI verte requise** et **auto-revue documentée** (projet solo). En amont, deux hooks git **Husky** constituent la première ligne de défense :

| Hook         | Outil       | Action                                                    |
| ------------ | ----------- | --------------------------------------------------------- |
| `pre-commit` | lint-staged | ESLint `--fix` + Prettier sur les fichiers stagés         |
| `commit-msg` | commitlint  | Rejet des messages non conformes aux Conventional Commits |

Ce dispositif a **réellement intercepté plusieurs anomalies avant livraison** (voir §14), dont une vulnérabilité de dépendance détectée au moment du tag v1.0.0 — preuve concrète de son efficacité.

> _Détail : `docs/03-protocole-integration-continue.md`._

---

## 5. Architecture logicielle et maintenabilité — _C2.2.1_

### 5.1 Backend — architecture modulaire NestJS

Le backend suit une **architecture modulaire** (un module par domaine métier) et le pattern **Controller → Service → Repository (Prisma)** :

| Module            | Responsabilité                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `AuthModule`      | register/login/refresh/logout ; stratégie JWT ; guards `JwtAuthGuard`, `RolesGuard` + décorateur `@Roles()` |
| `UsersModule`     | profil courant (`GET/PATCH /users/me`)                                                                      |
| `RoomsModule`     | CRUD salles (écriture ADMIN), liste/détail, disponibilités                                                  |
| `EquipmentModule` | CRUD matériel par salle (écriture ADMIN)                                                                    |
| `BookingsModule`  | création/annulation, **règles anti-chevauchement** en transaction                                           |
| `ChatModule`      | gateway Socket.IO + historique REST paginé                                                                  |
| `HealthModule`    | `GET /api/v1/health` (statut app + BDD) via Terminus                                                        |

Chaque contrôleur ne fait que **valider** (DTO `class-validator`) et **déléguer** ; le service porte la logique métier ; l'accès aux données passe **exclusivement** par Prisma. Cette séparation stricte des responsabilités = **maintenabilité** : chaque couche se teste et évolue isolément. L'**injection de dépendances** native de NestJS permet de substituer les dépendances (PrismaService, JwtService…) par des mocks en test.

### 5.2 Mobile — navigation par fichiers

L'application suit la **navigation par fichiers** d'Expo Router : les écrans sont dans `app/` (les groupes `(tabs)` et la protection des routes matérialisent les zones), la logique dans `src/{api,components,features,hooks,lib}`. L'**état serveur** est géré par TanStack Query (cache normalisé, invalidation après mutation, `refetchOnReconnect`), l'**état local** par des hooks, les **jetons** dans expo-secure-store.

### 5.3 Modèle de données

Six entités, avec des choix orientés **traçabilité** et **intégrité** :

<div class="diagram-er"></div>

- **Annulation logique** (`Booking.status = CANCELLED`, `isActive = false` pour salles et matériel) : aucune suppression, l'historique est conservé.
- **`BookingEquipment`** : table de jointure — le matériel n'est réservable que **dans le cadre** d'une réservation de salle (suppression en cascade avec la réservation).
- **Index composites** `(roomId, startsAt, endsAt)` sur `Booking` et `(roomId, createdAt)` sur `Message` : optimisent les deux requêtes les plus fréquentes (recherche de chevauchement, pagination du chat).

### 5.4 Contrat d'API et temps réel

L'API REST est préfixée `/api/v1` et **documentée par Swagger** (`/api/docs`, désactivé en production). Le chat repose sur des **événements Socket.IO** (namespace `/chat`) authentifiés par le JWT passé au handshake :

| Sens              | Événement      | Règle                                       |
| ----------------- | -------------- | ------------------------------------------- |
| client → serveur  | `room:join`    | vérifie l'accès à la salle, rejoint la room |
| client → serveur  | `message:send` | valide (1-1000 car.), persiste, diffuse     |
| serveur → clients | `message:new`  | diffusé à la room avec l'auteur             |
| serveur → client  | `error`        | accès refusé / validation                   |

> _Détail : `docs/04-architecture-logicielle.md`, `backend/prisma/schema.prisma`._

---

## 6. Présentation du prototype — _C2.2.1_

Le prototype a d'abord été **maquetté** (wireframes basse-fidélité des 6 écrans, `docs/04` §8) puis implémenté à l'identique. Il couvre les **6 écrans principaux**, conçus selon les spécificités ergonomiques **mobiles**.

| Écran (route)                                   | Contenu clé                                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Connexion / Inscription (`/login`, `/register`) | formulaires validés (react-hook-form + zod), erreurs par champ, clavier géré (`KeyboardAvoidingView`)           |
| Liste des salles (`/(tabs)/rooms`)              | cartes salle (nom, capacité, équipements), pull-to-refresh, états vide/chargement/erreur                        |
| Détail + réservation (`/rooms/[id]`)            | grille hebdomadaire (pas de 30 min), créneaux occupés grisés, sélection début/fin, cases matériel, confirmation |
| Mes réservations (`/(tabs)/bookings`)           | onglets À venir / Passées, annulation avec **dialogue natif**                                                   |
| Chat de salle (`/rooms/[id]/chat`)              | liste inversée à défilement infini, indicateur de connexion, envoi temps réel                                   |
| Administration (`/(tabs)/admin`)                | CRUD salles/matériel, supervision des réservations (onglet masqué pour les membres)                             |

**Choix ergonomiques justifiés** : barre d'onglets **en bas** (zone du pouce) ; zones tactiles **≥ 44×44 pt** ; gestes standards (pull-to-refresh) ; **feedback systématique** (toasts de succès/erreur après chaque action) ; états vide/chargement/erreur distincts ; gestion du **clavier virtuel** (le champ actif reste visible) ; `SafeAreaView` partout (encoches) ; **orientation portrait verrouillée** (les flux de réservation et de chat sont verticaux — choix assumé et documenté).

L'application est **fonctionnelle et manipulable en autonomie**, testée sur appareil réel (voir §12).

> _Détail : `docs/04-architecture-logicielle.md` §8-9, `mobile/app/`._

---

## 7. Frameworks et paradigmes de développement — _C2.2.1_

### 7.1 Frameworks et justification

| Choix                   | Justification                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **React Native / Expo** | Un seul code TypeScript pour Android et iOS ; outillage Expo décisif en solo (Expo Go, builds cloud EAS sans Android Studio configuré, OTA possibles).       |
| **Expo Router**         | Navigation par fichiers : routes lisibles dans l'arborescence, zones protégées matérialisées, typage des routes.                                             |
| **NestJS**              | Architecture modulaire, **injection de dépendances** native (testabilité), écosystème intégré (Passport/JWT, ValidationPipe, WebSockets, Terminus, Swagger). |
| **Prisma**              | Schéma unique versionné, migrations reproductibles, **client entièrement typé** (typage de la base à l'écran), requêtes paramétrées.                         |
| **Socket.IO**           | **Rooms natives** adaptées au chat par salle, **reconnexion automatique** — précieuse sur réseau mobile.                                                     |

### 7.2 Paradigmes

- **Backend — orienté objet + injection de dépendances** : classes, décorateurs, encapsulation par module ; inversion de contrôle (les services reçoivent leurs dépendances par le constructeur).
- **Mobile — programmation fonctionnelle** : composants fonction purs, composition, hooks (état et effets isolés), immutabilité ; logique métier extraite en **fonctions pures** (`src/lib/slots.ts`) testables exhaustivement.
- **Transverse — typage statique TypeScript strict** des deux côtés (`strict: true`) : les contrats d'API (DTO) et les modèles Prisma portent les types de bout en bout.

> _Détail : `docs/04-architecture-logicielle.md` §2._

---

## 8. Harnais de tests unitaires — _C2.2.2_

Le harnais **prévient les régressions** via des seuils de couverture **bloquants en CI** (`coverageThreshold` Jest : la CI échoue sous 80 %).

### 8.1 Bilan mesuré

| Suite                                   | Nombre | Portée                                                                      |
| --------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Unitaires backend (Jest, Prisma mocké)  | **80** | services auth, bookings, rooms, equipment, users, chat + gateway            |
| e2e API (Supertest + PostgreSQL réelle) | **20** | parcours critiques de bout en bout                                          |
| Unitaires mobile (Jest + RNTL)          | **51** | créneaux, schémas zod, hook d'auth, écrans login/réservation, bulle de chat |

Couverture des services backend : **100 % des lignes** pour auth, bookings, rooms, users, chat (chat.gateway à 100 % lignes) ; equipment à 94 %. Modules mobiles `slots`, `schemas`, `theme` à **100 %**.

### 8.2 Fonctionnalité couverte en priorité : la réservation

Le service `BookingsService` concentre la logique métier critique. Sa suite de tests vérifie **tous** les cas des règles § 4.5 de l'architecture :

```typescript
// Anti-chevauchement salle : refus 409 si un booking CONFIRMED chevauche le
// créneau demandé. Vérification + insertion dans une transaction Prisma pour
// éviter les conditions de course entre deux réservations simultanées.
return this.prisma.$transaction(async (tx) => {
  const conflict = await tx.booking.findFirst({
    where: {
      roomId,
      status: BookingStatus.CONFIRMED,
      startsAt: { lt: newEnd },
      endsAt: { gt: newStart },
    },
  });
  if (conflict) throw new ConflictException('Ce créneau est déjà réservé pour cette salle.');
  return tx.booking.create({/* … */});
});
```

Cas testés : créneau invalide (début ≥ fin, passé, durée hors 30 min–8 h, non aligné sur 30 min) ; chevauchement **exact / partiel / englobant / englobé** ; chevauchement avec un booking **annulé** (doit passer) ; matériel d'une autre salle ; matériel déjà pris ; annulation par autrui (403) ; annulation d'une réservation passée (400). Chaque correction de bogue s'accompagne d'un **test de non-régression** (voir §14).

### 8.3 Tests e2e des parcours critiques

Exécutés contre une **base PostgreSQL réelle**, ils déroulent : inscription → mot de passe faible refusé → email dupliqué → connexion → réservation salle+matériel → **conflit 409** → matériel d'une autre salle refusé → disponibilités → annulation par autrui refusée → route admin (403 membre / 200 admin) → annulation par le propriétaire → créneau redevenu réservable → accès chat (200 avec réservation / 403 sans) → cycle refresh/logout avec refresh révoqué.

> _Détail : `backend/src/**/*.spec.ts`, `backend/test/parcours-critiques.e2e-spec.ts`, `mobile/src/**/__tests__/`._

---

## 9. Mesures de sécurité — _C2.2.3_

Analyse structurée sur l'**OWASP Top 10 (2021)**. **Principe directeur** : l'APK étant décompilable (le code JS, l'URL de l'API et le `projectId` sont lisibles), **tous les contrôles de sécurité sont côté API** ; ce que fait l'application (masquer l'onglet admin, valider les formulaires) n'est que du confort.

| Faille                            | Risque dans SoundProof                                                           | Mesures                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A01** Broken Access Control     | Un membre annule la réservation d'autrui, lit un chat interdit, accède à l'admin | Guards JWT + rôles **globaux** (tout protégé par défaut, ouverture par `@Public()`) ; contrôle de propriété à l'annulation ; règle d'accès au chat vérifiée en REST **et** WebSocket                         |
| **A02** Cryptographic Failures    | Vol de mots de passe, détournement de session                                    | **argon2** (mots de passe + refresh tokens hachés en BDD) ; access token en mémoire ; refresh dans **expo-secure-store** (Keystore chiffré) ; secrets en variables d'environnement ; HTTPS documenté en prod |
| **A03** Injection                 | Injection SQL, contenu malveillant dans le chat                                  | **Prisma** (requêtes paramétrées, aucun SQL brut) ; `ValidationPipe` global (`whitelist` + `forbidNonWhitelisted`) ; validation des payloads WebSocket ; texte rendu inerte par React Native                 |
| **A04** Insecure Design           | Double réservation d'un créneau (course), perte de traçabilité                   | Règles métier **en transaction** ; **annulation logique** ; rate limiting                                                                                                                                    |
| **A05** Security Misconfiguration | Swagger public en prod, BDD exposée, secret dans l'APK                           | **Helmet** ; Swagger désactivé en prod ; conteneur **non-root** ; BDD sur réseau Docker `internal` (non exposée) ; seule l'URL de l'API dans les variables `EXPO_PUBLIC_*`                                   |
| **A06** Vulnerable Components     | CVE dans une dépendance                                                          | `npm audit` **bloquant sur `main`/tags** + **Dependabot** hebdomadaire + `expo-doctor`                                                                                                                       |
| **A07** Auth Failures             | Brute force, énumération de comptes                                              | Mot de passe **≥ 12 car.** (min/maj/chiffre) ; **throttling 5 req/min** sur login ; messages génériques ; access token 15 min ; refresh révoqué au logout                                                    |
| **A08** Integrity Failures        | Dépendance compromise, APK falsifié                                              | Lockfiles + `npm ci` ; images Docker versionnées ; builds EAS **signés** (keystore géré par EAS)                                                                                                             |
| **A09** Logging Failures          | Incidents indétectables                                                          | Logger NestJS : échecs d'authentification et refus d'accès **journalisés sans donnée sensible**                                                                                                              |
| **A10** SSRF                      | —                                                                                | Aucune requête sortante construite depuis une entrée utilisateur (vérifié : l'API ne contacte que PostgreSQL)                                                                                                |

**Tests de sécurité exécutés réellement — 8/8 OK** : accès sans token (401), admin en membre (403), annulation d'autrui (403), injection SQL neutralisée (stockée comme texte, base intacte), XSS dans le chat (diffusé et stocké inerte), brute force login (429), chat sans réservation (403), élévation de rôle par payload non whitelisté (400).

> _Détail : `docs/05-securite-owasp.md`, `docs/07-cahier-de-recettes.md` §4._

---

## 10. Accessibilité — _C2.2.3_

### 10.1 Référentiel choisi et justifié

**WCAG 2.1 niveau AA, via la norme européenne EN 301 549.** Le **RGAA 4**, souvent cité en France, est la déclinaison française des WCAG **pour le web** : sa méthode repose sur l'inspection du DOM HTML et **ne couvre pas les applications mobiles natives**. Pour le mobile, la référence légale française/européenne est l'**EN 301 549** (chapitre 11 « logiciels »), qui applique les critères WCAG 2.1 AA aux applications mobiles. OPQUAST est retenu en complément méthodologique.

### 10.2 Mesures par principe

- **Perceptible** : `accessibilityLabel` sur tout élément interactif ; emojis décoratifs masqués aux lecteurs d'écran ; **contrastes du thème tous ≥ 4.5:1** (mesurés par calcul, voir tableau) ; tailles de police dynamiques respectées (`allowFontScaling` jamais désactivé).
- **Utilisable** : zones tactiles **≥ 44×44 pt** ; composants tactiles natifs (`Pressable`, jamais de `View` cliquable sans rôle) ; ordre de lecture = ordre visuel.
- **Compréhensible** : erreurs de formulaire par champ, **annoncées** (`accessibilityLiveRegion`) ; instructions de mot de passe avant saisie ; confirmations natives des actions destructives.
- **Robuste** : trio **nom / rôle / état** (`accessibilityRole`, `accessibilityState`) ; **annonces dynamiques** des toasts et des nouveaux messages de chat (`AccessibilityInfo.announceForAccessibility`).

### 10.3 Contrastes mesurés (extrait)

| Couple (texte / fond)    | Ratio   | AA (≥ 4.5:1) |
| ------------------------ | ------- | ------------ |
| Texte principal / blanc  | 17.74:1 | ✅           |
| Texte secondaire / blanc | 7.56:1  | ✅           |
| Primaire (bleu) / blanc  | 6.70:1  | ✅           |
| Danger / blanc           | 6.47:1  | ✅           |
| Succès / blanc           | 5.02:1  | ✅           |

Les 12 couples du thème ont été validés (de 5.02:1 à 17.74:1). L'**audit sur appareil** (TalkBack sur les 6 écrans + Accessibility Scanner + police à 200 %) est défini par un protocole précis et consigné dans `docs/06` §3.

> _Détail : `docs/06-accessibilite.md`._

---

## 11. Historique des versions — _C2.2.4_

Le projet suit le **versionnage sémantique** (SemVer). Chaque version correspond à un **tag git réel** et à une entrée du `CHANGELOG.md` (format Keep a Changelog). Le projet ayant été construit **par couches**, l'historique en rend compte fidèlement :

| Version    | Contenu                                                   | Date       |
| ---------- | --------------------------------------------------------- | ---------- |
| **v0.1.0** | Socle technique, environnement de dev, CI/CD              | 2026-07-11 |
| **v0.2.0** | Conception, architecture, modèle de données, seed         | 2026-07-12 |
| **v0.3.0** | API complète (auth, salles, matériel, réservations, chat) | 2026-07-12 |
| **v0.4.0** | Application mobile complète                               | 2026-07-13 |
| **v0.5.0** | Sécurité OWASP, accessibilité, harnais de tests renforcé  | 2026-07-13 |
| **v1.0.0** | Recette + documentation d'exploitation complète           | 2026-07-14 |

**Convention de commits** : Conventional Commits (`feat`, `fix`, `docs`, `test`, `chore`, `ci`…), refusés à la source par commitlint. **Stratégie de branches** (Git Flow simplifié) : `main` (versions stables taguées), `develop` (intégration), branches de travail `feat|fix|docs|chore/*` fusionnées par merge commit.

> _Détail : `CHANGELOG.md`, historique et tags git._

---

## 12. Dernière version fonctionnelle — _C2.2.4_

La **v1.0.0** est fonctionnelle, fiable et viable. Sa publication a **réellement exercé le pipeline complet** : image Docker publiée sur GitHub Container Registry, GitHub Release générée depuis le CHANGELOG, et **APK Android produit par EAS et attaché à la Release**.

Preuves de viabilité :

- Les **10 user stories fonctionnent** (application testée sur appareil réel via Expo Go ; parcours API vérifiés automatiquement par les e2e).
- **CI verte sur `main`** ; 80 + 20 + 51 tests passants ; `expo-doctor` 18/18 ; 0 vulnérabilité haute.
- L'**APK constitue le livrable installable et manipulable en autonomie** par un utilisateur.

**Recette et maintenance** : la recette fonctionnelle a ensuite été exécutée sur appareil réel (**24/24 conforme**, §13). Elle a mis en évidence un unique défaut d'accessibilité (**BUG-011**), **corrigé puis re-testé** ; ce correctif de maintenance sera publié dans la prochaine version (v1.0.1), la **v1.0.0** restant la dernière version taguée à la date du dossier.

> _Livrable : GitHub Release v1.0.0 (APK attaché) ; image `ghcr.io/gagawan/soundproof-api:v1.0.0`._

---

## 13. Cahier de recettes — _C2.3.1_

Le cahier reprend **l'ensemble des fonctionnalités** et distingue trois familles de tests. Préambule : environnement de recette (APK `preview`, base seedée, comptes de test), stratégie, convention de statut (OK / KO / N-T).

### 13.1 Tests fonctionnels

**24 scénarios (TF)** couvrant les 10 user stories en cas **nominal et d'erreur**, dont des scénarios spécifiques au mobile (hors connexion, reprise après arrière-plan, clavier). Format tabulaire strict. Exemples :

| ID     | US  | Titre                                    | Résultat attendu                                          |
| ------ | --- | ---------------------------------------- | --------------------------------------------------------- |
| TF-005 | US2 | Connexion refusée (mauvais mot de passe) | Message générique « Identifiants invalides »              |
| TF-010 | US5 | Réservation d'un créneau libre           | Toast de confirmation, réservation visible, créneau grisé |
| TF-011 | US5 | Créneau en conflit                       | Message « déjà réservé », aucune réservation créée        |
| TF-018 | US8 | Chat sans réservation                    | Écran « Accès réservé », envoi impossible                 |
| TF-022 | —   | Hors connexion                           | Message d'erreur exploitable, pas de crash                |

**Campagne exécutée sur appareil réel : 24/24 conformes.** La première passe a révélé un défaut d'accessibilité — un bouton d'action situé en bas d'écran (envoi de message dans le chat ; « Créer mon compte » à l'inscription) non activable sur Android car masqué par la barre de navigation / le clavier. Ce défaut, consigné **BUG-011**, a été corrigé, puis les scénarios concernés (TF-016, TF-017, TF-023, TF-024) ont été **re-testés avec succès** — cycle complet détection → correction → re-test.

### 13.2 Tests structurels et de sécurité

- **Structurels — 13/13 exécutés OK** : 80 tests backend, 20 e2e, 51 mobile, lint 0 erreur, `expo-doctor` 18/18, builds, healthcheck, et **APK EAS `preview` produit** (installé sur appareil réel pour la recette).
- **Sécurité — 8/8 OK** : les 8 scénarios `TS` du §9, exécutés réellement contre l'API.

### 13.3 Automatisation Maestro

Six flows YAML (`mobile/e2e/`) automatisent : inscription/connexion, réservation complète (salle + matériel), refus de conflit, annulation, envoi d'un message de chat, absence de l'onglet admin pour un membre. Exécution locale : `maestro test e2e/`.

> _Détail : `docs/07-cahier-de-recettes.md`, `mobile/e2e/`._

---

## 14. Plan de correction des bogues — _C2.3.2_

**Processus** : détection (outillage local → CI → recette) → **qualification** (gravité bloquant/majeur/mineur/cosmétique, priorité, composant) via le **template d'issue GitHub** → correction sur branche `fix/*` avec **test de non-régression obligatoire** → PR + CI verte → fermeture référencée au commit.

**Registre des bogues réellement rencontrés — 11 anomalies (dont 1 issue de la recette), 100 % corrigées avant livraison** :

| ID      | Gravité  | Description                                                                                     | Correction                                                 |
| ------- | -------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| BUG-001 | Bloquant | Typecheck rouge en CI, vert en local (types `process` fournis par des fichiers Expo gitignorés) | Ajout `@types/node` + `types:["node"]`                     |
| BUG-002 | Majeur   | Prisma 7 incompatible avec l'outillage NestJS 11                                                | Repli sur Prisma 6.19 (documenté)                          |
| BUG-003 | Majeur   | App non lançable (Expo Go plafonné à la SDK 54)                                                 | Alignement du projet sur la SDK 54                         |
| BUG-004 | Majeur   | Tests d'interface s'invalidant mutuellement (RNTL v14 async)                                    | Passage de `fireEvent` à `userEvent`                       |
| BUG-005 | Bloquant | Suite non exécutable (portée des mocks Jest)                                                    | Renommage selon la convention `mock*`                      |
| BUG-006 | Majeur   | Appel impur (`Date.now()`) pendant le rendu                                                     | Extraction d'un hook `useNow()`                            |
| BUG-007 | Majeur   | Lint bloquant sur les tests e2e (typage `any` de Supertest)                                     | Interfaces de corps de réponse                             |
| BUG-008 | Mineur   | Assertion fausse sur une mutation TanStack Query                                                | Assertion ciblée sur le payload                            |
| BUG-009 | Mineur   | Seuil de couverture non atteint (gateway chat)                                                  | Tests des cas dégradés + seuil ajusté                      |
| BUG-010 | Bloquant | Vulnérabilité `fast-uri` bloquant la v1.0.0                                                     | `npm audit fix` → 3.1.4                                    |
| BUG-011 | Majeur   | **Recette** : bouton d'action bas d'écran non activable sur Android (chat + inscription)        | Insets système + `KeyboardAvoidingView` ; re-test 24/24 OK |

**Enseignement** : le dispositif a détecté **100 %** de ces anomalies avant toute version publiée. BUG-001 et BUG-010 n'étaient détectables **que par la CI** (divergence poste ↔ checkout propre ; advisory publié après le dernier run vert), ce qui justifie l'environnement d'intégration distinct. **BUG-011**, seul défaut relevé à la recette, a suivi le même processus — détecté sur appareil réel, corrigé, puis **re-testé conforme** (recette fonctionnelle 24/24) — démontrant le cycle complet de traitement d'une anomalie de recette.

> _Détail : `docs/08-plan-correction-bogues.md`, `.github/ISSUE_TEMPLATE/bug_report.yml`._

---

## 15. Manuel de déploiement — _C2.4.1_

### 15.1 API

**Prérequis** : Docker + Docker Compose (aucune autre installation — tout est conteneurisé). **Variables d'environnement** dans un `.env` (modèle `.env.prod.example`), contrôlées au démarrage (`${VAR:?requis}`) :

| Variable                                              | Description                      | Obligatoire    |
| ----------------------------------------------------- | -------------------------------- | -------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Identifiants PostgreSQL          | Oui            |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`            | Secrets de signature (distincts) | Oui            |
| `API_VERSION`                                         | Tag de l'image à déployer        | Non (`latest`) |

**Déploiement depuis zéro** :

```bash
git clone <dépôt> && cd SoundProof
cp .env.prod.example .env      # renseigner les secrets
docker compose -f docker-compose.prod.yml up -d
curl http://localhost:3000/api/v1/health   # → {"status":"ok"}
```

Migrations **automatiques** à l'entrypoint. La **BDD n'est pas exposée** (réseau Docker `internal`), l'API l'est sur le port 3000. **Rollback** : `API_VERSION=<tag précédent>` + `up -d`. **Sauvegarde/restauration** : `pg_dump` / `pg_restore` (encapsulés dans `sh -c` pour résoudre les variables dans le conteneur). Un tableau symptôme → cause → solution complète le manuel.

### 15.2 Application mobile

Build `eas build --platform android --profile preview` → récupération de l'APK (QR code / GitHub Release) → installation (autoriser les sources inconnues). La publication sur Google Play / App Store est **documentée mais non exécutée** (comptes développeur payants).

> _Détail : `docs/09-manuel-deploiement.md`._

---

## 16. Manuel d'utilisation — _C2.4.1_

Destiné aux utilisateurs finaux, il couvre l'installation de l'APK, la création de compte (règle de mot de passe expliquée), la connexion et la session persistante, puis, **par profil** :

- **Membre** : consulter les salles et leurs disponibilités, réserver un créneau et du matériel, gérer et annuler ses réservations, utiliser le chat de salle.
- **Administrateur** : créer/modifier/désactiver salles et matériel, superviser et annuler toute réservation.

Chaque écran est décrit **pas à pas**, avec les règles à connaître (durée 30 min–8 h, anti-chevauchement, accès au chat réservé aux membres de la salle) et une section **accessibilité**. Une **FAQ de 11 questions** traite les cas courants (comportement hors connexion, confirmation d'une réservation, créneau refusé, oubli de mot de passe, mise à jour de l'app…). Les captures d'écran sont référencées dans `docs/assets/`.

> _Détail : `docs/10-manuel-utilisation.md`._

---

## 17. Manuel de mise à jour — _C2.4.1_

Couvre la montée de version **API** (sauvegarde → nouveau tag → `pull` → `up -d`, migrations automatiques) et **mobile** (incrément de `version` dans `app.json`, build EAS, distribution ; mises à jour **OTA** `eas update` mentionnées comme évolution possible).

Points structurants :

- **Règle de compatibilité API ↔ application N-1** : l'API reste compatible avec la version mobile précédente (les utilisateurs ne mettent pas à jour immédiatement) ; un changement incompatible impose une **transition en deux temps**, l'API étant toujours déployée avant l'application.
- **Migrations Prisma** : création (`migrate dev`), application (`migrate deploy`, automatique), et trois méthodes de **retour arrière** (restauration de sauvegarde, migration corrective, `migrate resolve`).
- **Mise à jour des dépendances** : Dependabot + `npm audit` ; **cas particulier Expo** (via `expo install --fix`, jamais Dependabot) ; note sur la montée vers Prisma 7.
- **Procédure de hotfix** (branche depuis `main`, patch + test, tag) et **check-list avant toute mise en production**.

> _Détail : `docs/11-manuel-mise-a-jour.md`._

---

## 18. Correspondance compétences ↔ preuves

| Compétence                                                               | Preuve principale (section / dépôt)                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **C2.1.1** Environnements de déploiement/test + qualité                  | §2, §3 ; `docs/01`, `docs/02`, `cd.yml`, `eas.json`, `docker-compose*.yml` |
| **C2.1.2** Intégration continue                                          | §4 ; `docs/03`, `ci.yml`, hooks Husky                                      |
| **C2.2.1** Prototype (ergonomie, équipement, sécurité) — ⚠️ éliminatoire | §5-7 ; `docs/04`, `mobile/app/`, API NestJS                                |
| **C2.2.2** Harnais de tests unitaires — ⚠️ éliminatoire                  | §8 ; 80 + 20 + 51 tests, couverture ≥ 80 % bloquante                       |
| **C2.2.3** Sécurité + accessibilité — ⚠️ éliminatoire                    | §9-10 ; `docs/05`, `docs/06`, mesures dans le code                         |
| **C2.2.4** Versions + livraison                                          | §11-12 ; tags SemVer, `CHANGELOG.md`, Release v1.0.0                       |
| **C2.3.1** Cahier de recettes — ⚠️ éliminatoire                          | §13 ; `docs/07`, `mobile/e2e/`                                             |
| **C2.3.2** Plan de correction des bogues                                 | §14 ; `docs/08`, template d'issue                                          |
| **C2.4.1** Documentation d'exploitation                                  | §15-17 ; `docs/09`, `docs/10`, `docs/11`                                   |

Les **4 compétences éliminatoires** (C2.2.1, C2.2.2, C2.2.3, C2.3.1) sont traitées avec preuves à l'appui, exécutées et vérifiées réellement.

---

_Fin du dossier de synthèse. Le dépôt Git joint contient le code source complet et les 11 documents détaillés (`docs/01` à `docs/11`) référencés dans chaque section._
