# Changelog

Toutes les évolutions notables de ce projet sont documentées dans ce fichier.

Le format s'appuie sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

> **Note sur l'historique des versions** — le projet a été construit **par couches** (environnement et CI/CD, puis conception, puis API complète, puis application mobile, puis durcissement et recette) plutôt que par tranches verticales. Les versions ci-dessous reflètent cet historique réel ; chaque version correspond à un **tag git** posé sur le commit d'intégration correspondant.

## [1.0.1] — 2026-07-24

Correctif issu de la recette fonctionnelle exécutée sur appareil réel.

### Corrigé

- **BUG-011** : les boutons d'action situés en bas d'écran (envoi de message dans le chat, « Créer mon compte » à l'inscription) n'étaient pas activables sur Android, masqués par la barre de navigation système / le clavier. Prise en compte des insets système sur la barre de composition du chat et ajustement du `KeyboardAvoidingView` sur Android (`chat.tsx`, `login.tsx`, `register.tsx`).

### Modifié

- **Cahier de recettes** (`docs/07`) : campagne fonctionnelle ré-exécutée après correction — **24/24 scénarios conformes** (TF-016, TF-017, TF-023, TF-024 repassent OK) ; illustration du cycle détection → correction → re-test.
- **Plan de correction des bogues** (`docs/08`) : BUG-011 consigné et vérifié.

## [1.0.0] — 2026-07-14

Première version stable : application complète, recette exécutée et documentation d'exploitation livrée.

### Ajouté

- **Cahier de recettes** (`docs/07`) : 24 scénarios fonctionnels, 13 tests structurels, 8 tests de sécurité (exécutés : 8/8 OK) ; flows **Maestro** automatisant 6 parcours clés (`mobile/e2e/`).
- **Plan de correction des bogues** (`docs/08`) : processus de qualification et de traitement, registre des 10 anomalies rencontrées avec analyse de cause racine ; **template GitHub** de rapport de bogue.
- **Documentation d'exploitation** : manuel de déploiement (`docs/09`), manuel d'utilisation (`docs/10`), manuel de mise à jour (`docs/11`).
- README final (badges, correspondance compétences ↔ livrables, liens vers les 11 documents).

## [0.5.0] — 2026-07-13

Durcissement sécurité, accessibilité et renforcement du harnais de tests.

### Ajouté

- **Analyse de sécurité OWASP Top 10** (`docs/05`) et mesures associées ; surveillance des dépendances par **Dependabot**.
- **Document d'accessibilité** WCAG 2.1 AA / EN 301 549 (`docs/06`) avec contrastes du thème mesurés.
- **Tests e2e API** des parcours critiques (Supertest + PostgreSQL réelle) et **tests unitaires mobile** (schémas de validation, hook d'authentification, écrans de connexion et de réservation, messages de chat).
- Seuils de couverture bloquants dans les deux applications.

## [0.4.0] — 2026-07-13

Application mobile complète.

### Ajouté

- Authentification persistante (expo-secure-store), navigation par onglets, client API avec rafraîchissement automatique des jetons.
- Liste et détail des salles, **grille hebdomadaire de créneaux**, réservation de salle et de matériel.
- Gestion de ses réservations (annulation avec confirmation native).
- **Chat temps réel** par salle (Socket.IO, reconnexion automatique, historique paginé).
- Écran d'**administration** (salles, matériel, réservations).
- Accessibilité native sur tous les écrans ; thème centralisé.
- Alignement sur **Expo SDK 54** (compatibilité avec l'appareil de test).

## [0.3.0] — 2026-07-12

API complète.

### Ajouté

- **Module d'authentification** : inscription, connexion, refresh, logout ; JWT (access + refresh), hachage **argon2**, refresh tokens hachés en base ; guards JWT et rôles globaux.
- **Modules Users, Rooms, Equipment** : CRUD avec DTOs stricts, écritures réservées aux administrateurs, désactivation logique.
- **Module Bookings** : règles métier d'anti-chevauchement (salle et matériel) en transaction Prisma, erreurs HTTP explicites.
- **Module Chat** : passerelle Socket.IO (authentification au handshake) + historique REST paginé.
- **Healthcheck**, durcissement (Helmet, rate limiting global et renforcé sur l'authentification, validation stricte des entrées).
- Harnais de tests unitaires backend (80 tests, seuils de couverture bloquants sur les services).

## [0.2.0] — 2026-07-12

Conception et fondations des données.

### Ajouté

- **Document d'architecture logicielle** (`docs/04`) : choix techniques, paradigmes, modèle de données, 10 user stories, maquettes.
- **Schéma Prisma** complet (utilisateurs, salles, matériel, réservations, messages), migration initiale et **seed** de démonstration.

## [0.1.0] — 2026-07-11

Socle technique du projet.

### Ajouté

- Initialisation du monorepo (backend NestJS, application mobile Expo), conventions git et fichiers d'environnement.
- Environnement de développement : PostgreSQL 16 dockerisée, ESLint, Prettier partagé, Husky (pre-commit lint-staged, commit-msg commitlint).
- **Protocoles d'intégration et de déploiement continus** (`docs/01`, `docs/03`) et **critères de qualité/performance** (`docs/02`).
- Pipelines GitHub Actions (`ci.yml`, `cd.yml`), Dockerfile multi-stage de l'API, configuration EAS Build et Docker Compose de production.

[1.0.1]: https://github.com/Gagawan/SoundProof/releases/tag/v1.0.1
[1.0.0]: https://github.com/Gagawan/SoundProof/releases/tag/v1.0.0
[0.5.0]: https://github.com/Gagawan/SoundProof/releases/tag/v0.5.0
[0.4.0]: https://github.com/Gagawan/SoundProof/releases/tag/v0.4.0
[0.3.0]: https://github.com/Gagawan/SoundProof/releases/tag/v0.3.0
[0.2.0]: https://github.com/Gagawan/SoundProof/releases/tag/v0.2.0
[0.1.0]: https://github.com/Gagawan/SoundProof/releases/tag/v0.1.0
