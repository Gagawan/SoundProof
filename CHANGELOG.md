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
