# Analyse de sécurité — OWASP Top 10 (2021) — SoundProof

> **Compétence visée : C2.2.3** — Ce document passe en revue les dix catégories de failles du [OWASP Top 10 2021](https://owasp.org/Top10/fr/). Pour chacune : description, risque concret dans SoundProof, mesures implémentées (avec référence aux fichiers de code) et limites résiduelles le cas échéant.
>
> **Principe directeur** : l'application mobile est un client **non fiable** — un APK se décompile en quelques minutes (le `projectId`, l'URL de l'API et tout le code JS sont lisibles). **Tous les contrôles de sécurité sont donc appliqués côté API** ; ce que fait l'app (masquer l'onglet admin, valider les formulaires) n'est que du confort d'usage, jamais une barrière de sécurité.

## A01 — Broken Access Control (contrôle d'accès défaillant)

**Description.** Un utilisateur accède à des données ou des actions qui ne lui sont pas destinées (élévation de privilèges, accès aux ressources d'autrui).

**Risque concret.** Un membre annule la réservation d'un autre musicien, lit le chat d'une salle où il n'a jamais réservé, ou s'octroie les écrans d'administration.

**Mesures implémentées.**

- **Protection par défaut** : le guard JWT est **global** — toute route est authentifiée sauf ouverture explicite par `@Public()` (impossible d'oublier de protéger une nouvelle route). [`backend/src/auth/guards/jwt-auth.guard.ts`](../backend/src/auth/guards/jwt-auth.guard.ts), enregistré dans [`backend/src/app.module.ts`](../backend/src/app.module.ts).
- **Rôles** : `RolesGuard` global + décorateur `@Roles(Role.ADMIN)` sur toutes les écritures salles/matériel et la liste complète des réservations. [`backend/src/auth/guards/roles.guard.ts`](../backend/src/auth/guards/roles.guard.ts), [`backend/src/rooms/rooms.controller.ts`](../backend/src/rooms/rooms.controller.ts), [`backend/src/equipment/equipment.controller.ts`](../backend/src/equipment/equipment.controller.ts).
- **Contrôle de propriété** : l'annulation vérifie `booking.userId === user.id || role === ADMIN` ([`backend/src/bookings/bookings.service.ts`](../backend/src/bookings/bookings.service.ts), règle 4).
- **Accès au chat** : REST **et** WebSocket vérifient la règle métier (réservation `CONFIRMED` sur la salle ou ADMIN) — [`backend/src/chat/chat.service.ts`](../backend/src/chat/chat.service.ts) (`assertCanAccessRoom`), appliquée dans [`messages.controller.ts`](../backend/src/chat/messages.controller.ts) et [`chat.gateway.ts`](../backend/src/chat/chat.gateway.ts).
- **Tests dédiés** : unitaires (annulation par autrui → 403, accès chat sans réservation → 403) et e2e ([`backend/test/parcours-critiques.e2e-spec.ts`](../backend/test/parcours-critiques.e2e-spec.ts) : route admin 403 pour un membre, annulation d'autrui 403).
- Côté mobile, l'onglet Admin est masqué pour les membres (`href: null`) — **confort uniquement**, le contrôle réel est dans l'API.

## A02 — Cryptographic Failures (défaillances cryptographiques)

**Description.** Données sensibles exposées faute de chiffrement ou avec une cryptographie faible.

**Risque concret.** Vol des mots de passe des musiciens (souvent réutilisés ailleurs), détournement de session par vol de refresh token.

**Mesures implémentées.**

- **Mots de passe hachés avec argon2id** (vainqueur du Password Hashing Competition, résistant aux GPU) — jamais stockés ni loggés en clair. [`backend/src/auth/auth.service.ts`](../backend/src/auth/auth.service.ts).
- **Refresh tokens hachés en BDD** (argon2) : une fuite de la base ne permet pas de rejouer les sessions. Invalidés au logout (hash effacé).
- Côté mobile : refresh token dans **expo-secure-store** (Keychain iOS / Keystore Android — stockage **chiffré par le matériel**, isolé par application) ; access token **en mémoire uniquement**, jamais persisté. [`mobile/src/api/client.ts`](../mobile/src/api/client.ts).
- **Secrets en variables d'environnement** (`.env` jamais committés, modèles `.env.example` factices) ; secrets JWT distincts pour access et refresh.
- Réponses API sans champ sensible : sélections Prisma explicites (`PUBLIC_USER_SELECT`, `PROFILE_SELECT`) — `passwordHash` et `refreshTokenHash` ne quittent jamais le serveur.
- **HTTPS en production** : documenté dans `docs/09-manuel-deploiement.md` (terminaison TLS par reverse proxy). En développement local, HTTP sur réseau privé.

**Limites résiduelles.** Le trafic de développement (Expo Go ↔ API locale) est en HTTP : acceptable sur réseau privé, à ne jamais reproduire en production.

## A03 — Injection

**Description.** Des données non fiables sont interprétées comme du code (SQL, NoSQL, commande…).

**Risque concret.** Injection SQL via le formulaire de connexion ou les champs de recherche ; injection de contenu via les messages de chat.

**Mesures implémentées.**

- **Prisma exclusivement** : requêtes paramétrées générées, **aucune requête SQL brute concaténée** dans tout le code (vérifié : aucun `$queryRaw`/`$executeRaw`).
- **`ValidationPipe` global** avec `whitelist: true` (propriétés inconnues supprimées), `forbidNonWhitelisted: true` (payload rejeté en 400) et `transform: true` — 100 % des entrées REST passent par des DTOs `class-validator` typés ([`backend/src/main.ts`](../backend/src/main.ts), dossiers `dto/` de chaque module). Vérifié en e2e (payload non whitelisté → 400).
- **Payloads WebSocket validés** dans le gateway : `roomId` et `content` contrôlés (présence, type, longueur 1-1000), contenu `trim()` avant persistance ([`backend/src/chat/chat.gateway.ts`](../backend/src/chat/chat.gateway.ts), [`chat.service.ts`](../backend/src/chat/chat.service.ts)).
- Identifiants d'URL contraints par `ParseUUIDPipe` (un id malformé → 400 avant toute requête).
- Côté affichage, React Native rend le texte **inerte** (composant `Text` — pas d'interprétation HTML/JS) : un message de chat contenant `<script>` s'affiche comme texte.

## A04 — Insecure Design (conception non sécurisée)

**Description.** Failles de logique métier impossibles à corriger par une simple ligne de code : elles doivent être prévenues dès la conception.

**Risque concret.** Deux réservations simultanées du même créneau (condition de course), suppression de données empêchant tout audit, matraquage de l'API.

**Mesures implémentées.**

- **Règles métier en transaction** : la vérification d'anti-chevauchement et l'insertion de la réservation sont atomiques (`prisma.$transaction`) — deux demandes concurrentes ne peuvent pas obtenir le même créneau ([`backend/src/bookings/bookings.service.ts`](../backend/src/bookings/bookings.service.ts)).
- **Annulation logique** (`status: CANCELLED`, jamais de `DELETE`) : traçabilité complète des réservations ; idem pour salles et matériel (`isActive: false`).
- **Rate limiting** : 100 req/min par IP en global, **5 req/min sur `/auth/login` et `/auth/register`** ([`backend/src/app.module.ts`](../backend/src/app.module.ts), [`auth.controller.ts`](../backend/src/auth/auth.controller.ts)).
- Règles de créneau strictes (futur, 30 min–8 h, pas de 30 min) validées côté serveur.

## A05 — Security Misconfiguration (mauvaise configuration)

**Description.** Options par défaut dangereuses, services exposés inutilement, messages d'erreur bavards.

**Risque concret.** Documentation d'API publique en production, BDD accessible depuis Internet, secrets lisibles dans l'APK.

**Mesures implémentées.**

- **Helmet** : en-têtes HTTP de sécurité ([`backend/src/main.ts`](../backend/src/main.ts)).
- **Swagger désactivé en production** (`NODE_ENV !== 'production'`) — [`backend/src/main.ts`](../backend/src/main.ts).
- **Conteneur non-root** : l'API tourne sous l'utilisateur `node` ([`backend/Dockerfile`](../backend/Dockerfile), image multi-stage minimale).
- **BDD non exposée** en production : aucun port publié, réseau Docker `internal: true` — seule l'API la joint ([`docker-compose.prod.yml`](../docker-compose.prod.yml)).
- **CORS non activé** : sans objet pour une app native (pas d'origine navigateur) — documenté dans `main.ts` ; Swagger (dev) est servi par la même origine.
- **Aucun secret dans le bundle mobile** : les variables `EXPO_PUBLIC_*` sont **lisibles dans l'APK** — seule l'URL de l'API y figure, jamais de clé ou secret ([`mobile/.env.example`](../mobile/.env.example) le documente).
- Variables obligatoires contrôlées au déploiement (`${VAR:?requis}` dans `docker-compose.prod.yml`).

## A06 — Vulnerable and Outdated Components (composants vulnérables)

**Description.** Dépendances embarquant des vulnérabilités connues.

**Risque concret.** Une CVE dans une dépendance transitive de l'API ou du bundle mobile.

**Mesures implémentées.**

- **`npm audit --audit-level=high` en CI** sur les deux applications : signal sur toutes les branches, **bloquant sur `main` et sur les tags de version** ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).
- **Dependabot activé** ([`.github/dependabot.yml`](../.github/dependabot.yml)) : PR hebdomadaires sur backend, mobile, outillage racine et actions GitHub. Les paquets Expo en sont exclus : ils doivent rester alignés sur la SDK (`npx expo install --fix`), cohérence vérifiée par **`npx expo-doctor` en CI**.
- Lockfiles committés + `npm ci` en CI (voir A08).

**Limites résiduelles.** Des vulnérabilités _moderate_ subsistent dans des dépendances transitives d'Expo (outillage de build, non embarqué dans l'APK) ; suivies à chaque montée de SDK.

## A07 — Identification and Authentication Failures (défaillances d'authentification)

**Description.** Mécanismes d'authentification contournables : mots de passe faibles, brute force possible, sessions éternelles.

**Risque concret.** Prise de contrôle d'un compte par force brute ou credential stuffing.

**Mesures implémentées.**

- **Politique de mot de passe** validée par DTO : ≥ 12 caractères, minuscule + majuscule + chiffre ([`backend/src/auth/dto/register.dto.ts`](../backend/src/auth/dto/register.dto.ts)) — même règle affichée et vérifiée côté mobile (zod).
- **Throttling renforcé** sur login/register : 5 req/min par IP → brute force impraticable (429).
- **Messages d'erreur génériques** : « Identifiants invalides. » que le compte existe ou non — pas d'énumération de comptes ([`backend/src/auth/auth.service.ts`](../backend/src/auth/auth.service.ts), vérifié par tests unitaires et e2e).
- **Access token court (15 min)** ; refresh token 7 j, haché en BDD, **rotation à chaque refresh** et **invalidation au logout** (vérifié en e2e : refresh après logout → 401).

## A08 — Software and Data Integrity Failures (défaillances d'intégrité)

**Description.** Code ou données modifiés sans vérification d'intégrité (chaîne d'approvisionnement, mises à jour non signées).

**Risque concret.** Dépendance compromise installée silencieusement ; APK falsifié.

**Mesures implémentées.**

- **Lockfiles committés** (`package-lock.json` × 3) et **`npm ci` en CI** : installation strictement reproductible, échec si le lockfile ne correspond pas.
- **Images Docker versionnées** : chaque release produit `ghcr.io/gagawan/soundproof-api:vX.Y.Z` (immuable) en plus de `latest` ([`.github/workflows/cd.yml`](../.github/workflows/cd.yml)).
- **Builds EAS signés** : keystore Android généré et conservé par EAS — chaque APK/AAB est signé de façon cohérente, Android refuse une mise à jour dont la signature diffère.
- Hooks locaux + CI sur toute PR : aucun code n'atteint `main` sans pipeline vert.

## A09 — Security Logging and Monitoring Failures (défaillances de journalisation)

**Description.** Incidents indétectables faute de journaux exploitables.

**Risque concret.** Brute force ou tentatives d'accès interdits passant inaperçus.

**Mesures implémentées.**

- **Logger structuré NestJS** avec contexte par classe.
- **Échecs d'authentification journalisés** sans donnée sensible : compte inconnu (email non journalisé), mot de passe erroné (id utilisateur seulement), refresh token invalide ([`backend/src/auth/auth.service.ts`](../backend/src/auth/auth.service.ts)).
- **Refus d'accès journalisés** : rôle insuffisant ([`roles.guard.ts`](../backend/src/auth/guards/roles.guard.ts)), accès chat refusé ([`chat.service.ts`](../backend/src/chat/chat.service.ts)), connexion WebSocket rejetée ([`chat.gateway.ts`](../backend/src/chat/chat.gateway.ts)).
- Jamais de mot de passe, hash ou token dans les logs.

**Limites résiduelles.** Pas d'agrégation centralisée ni d'alerting (hors périmètre d'un déploiement mono-machine) ; les logs sont accessibles via `docker logs` et documentés dans le manuel de déploiement.

## A10 — Server-Side Request Forgery (SSRF)

**Description.** Le serveur est amené à émettre des requêtes vers des cibles choisies par l'attaquant.

**Risque concret.** Théorique ici : il faudrait qu'une entrée utilisateur serve à construire une URL appelée par l'API.

**Mesures implémentées (vérification).** L'API SoundProof **n'émet aucune requête HTTP sortante** : ses seules communications sont PostgreSQL (URL fixée par variable d'environnement) et les WebSockets entrants. Aucune entrée utilisateur (champ, URL, id) n'est utilisée pour construire une requête réseau — vérifié sur l'ensemble du code (`fetch`/`axios`/`http` absents des dépendances runtime de l'API). Le risque SSRF est donc **structurellement absent** ; le point sera re-vérifié si une intégration sortante (webhooks, notifications push) est ajoutée.

---

## Synthèse des vérifications

| Faille | Mesure clé                                       | Vérifiée par                                          |
| ------ | ------------------------------------------------ | ----------------------------------------------------- |
| A01    | Guards globaux + propriété + règle chat          | Tests unitaires + e2e (403)                           |
| A02    | argon2, secure-store, hash des refresh           | Tests unitaires (hash appelé, pas de champ sensible)  |
| A03    | Prisma + ValidationPipe + validation WS          | e2e (400 payload non whitelisté), tests gateway       |
| A04    | Transactions + annulation logique + throttling   | Tests unitaires (transaction), e2e (409)              |
| A05    | Helmet, Swagger off prod, non-root, BDD isolée   | Revue de configuration + recette                      |
| A06    | npm audit CI + Dependabot + expo-doctor          | CI                                                    |
| A07    | Politique MDP + throttle + messages génériques   | Tests unitaires + e2e (401 générique) + recette (429) |
| A08    | Lockfiles + npm ci + images versionnées + EAS    | CI/CD                                                 |
| A09    | Journalisation échecs/refus sans donnée sensible | Revue de code                                         |
| A10    | Aucune requête sortante construite               | Revue de code                                         |

Les scénarios de tests de sécurité exécutables (TS-xxx) sont détaillés dans `docs/07-cahier-de-recettes.md`.
