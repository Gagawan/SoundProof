# Changelog

Toutes les évolutions notables de ce projet sont documentées dans ce fichier.

Le format s'appuie sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté

- Initialisation du monorepo (backend NestJS, application mobile Expo), conventions git et fichiers d'environnement.
- Environnement de développement : PostgreSQL 16 dockerisée, ESLint, Prettier partagé, Husky (pre-commit lint-staged, commit-msg commitlint).
- Protocoles d'intégration et de déploiement continus (`docs/01`, `docs/03`) et critères de qualité/performance (`docs/02`).
- Pipelines GitHub Actions (`ci.yml`, `cd.yml`), Dockerfile multi-stage de l'API, configuration EAS Build et Docker Compose de production.
- Document d'architecture logicielle (`docs/04`) : choix techniques, modèle de données, user stories, maquettes.
- Schéma Prisma complet (utilisateurs, salles, matériel, réservations, messages), migration initiale et seed de démonstration.
- API complète : authentification JWT (argon2, refresh tokens hachés), gestion des salles et du matériel (CRUD admin, désactivation logique), réservations avec règles anti-chevauchement en transaction, chat temps réel Socket.IO avec historique paginé, healthcheck.
- Durcissement sécurité : Helmet, rate limiting global et renforcé sur l'authentification, validation stricte des entrées, guards JWT/rôles globaux.
- Harnais de tests unitaires backend (80 tests, seuils de couverture bloquants sur les services).
- Application mobile complète : authentification persistante (secure-store), liste et détail des salles avec grille hebdomadaire de créneaux, réservation avec matériel, gestion de ses réservations (annulation confirmée), chat temps réel par salle, administration (salles, matériel, réservations), accessibilité native sur tous les écrans.
- Harnais de tests complet : 20 tests e2e API des parcours critiques (Supertest + PostgreSQL réelle) et 51 tests unitaires mobile (créneaux, schémas de validation, hook d'authentification, écrans de connexion et de réservation, messages de chat), seuils de couverture bloquants dans les deux applications.
