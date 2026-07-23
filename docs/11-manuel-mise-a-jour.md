# Manuel de mise à jour — SoundProof

> **Compétence visée : C2.4.1** — Ce manuel décrit comment faire évoluer la solution en production : montée de version de l'API et de l'application mobile, gestion des migrations de base de données, compatibilité entre versions, mise à jour des dépendances et procédure de correctif urgent.

## 1. Politique de versionnage

Le projet suit le **versionnage sémantique** (SemVer) : `MAJEUR.MINEUR.CORRECTIF`.

| Incrément               | Quand                                                                                                                       | Exemple                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **MAJEUR** (`2.0.0`)    | Rupture de compatibilité de l'API : suppression ou modification incompatible d'un endpoint, changement de format de réponse | Retrait de `GET /rooms/:id/availability`  |
| **MINEUR** (`1.1.0`)    | Ajout de fonctionnalité **rétrocompatible**                                                                                 | Ajout d'un filtre optionnel, nouvel écran |
| **CORRECTIF** (`1.0.1`) | Correction de bogue sans changement d'interface                                                                             | Correctif d'un calcul de créneau          |

Règles associées :

- Chaque version livrée correspond à un **tag git `vX.Y.Z`** sur `main` et à une entrée du [`CHANGELOG.md`](../CHANGELOG.md) (format _Keep a Changelog_).
- La version de l'application mobile (`version` dans [`mobile/app.json`](../mobile/app.json)) est **alignée sur le tag**.
- Le tag déclenche automatiquement le pipeline de déploiement continu : image Docker publiée, GitHub Release créée, APK produit et attaché.

## 2. Règle de compatibilité API ↔ application mobile

> **L'API doit rester compatible avec la version N-1 de l'application mobile.**

Justification : les utilisateurs **ne mettent pas à jour immédiatement** leur application. Un APK installé continue d'appeler l'API telle qu'il la connaît. Rompre le contrat sans transition rend l'application inutilisable pour tous ceux qui n'ont pas encore mis à jour.

En pratique :

| Changement d'API                                    | Compatible ? | Conduite à tenir                      |
| --------------------------------------------------- | ------------ | ------------------------------------- |
| Ajouter un champ dans une réponse                   | ✅           | Déploiement direct                    |
| Ajouter un paramètre **optionnel**                  | ✅           | Déploiement direct                    |
| Ajouter un endpoint                                 | ✅           | Déploiement direct                    |
| Rendre obligatoire un paramètre jusqu'ici optionnel | ❌           | Transition en deux temps (ci-dessous) |
| Supprimer ou renommer un champ / endpoint           | ❌           | Transition en deux temps              |
| Modifier le type d'un champ                         | ❌           | Transition en deux temps              |

**Transition en deux temps** pour un changement incompatible :

1. **Version N** — introduire la nouvelle forme **en parallèle** de l'ancienne (nouveau champ ou nouvel endpoint), marquer l'ancienne comme dépréciée, publier une version mobile qui utilise la nouvelle forme.
2. **Version N+1** — une fois le parc majoritairement à jour, retirer l'ancienne forme et incrémenter la **version majeure**.

L'ordre de déploiement est toujours : **API d'abord, application ensuite**.

## 3. Mise à jour de l'API

### 3.1 Procédure standard

```bash
# 0. SAUVEGARDE PRÉALABLE — impérative avant toute mise à jour
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c' \
  > sauvegarde-avant-maj-$(date +%Y%m%d-%H%M).dump

# 1. Récupérer le code de la nouvelle version
git fetch --tags
git checkout v1.1.0

# 2. Pointer le déploiement sur la nouvelle image
nano .env        # API_VERSION=v1.1.0

# 3. Récupérer l'image et redémarrer
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 4. Vérifier — les migrations sont appliquées automatiquement au démarrage
docker compose -f docker-compose.prod.yml logs backend | head -20
curl http://localhost:3000/api/v1/health
```

L'interruption de service se limite au redémarrage du conteneur (quelques secondes).

### 3.2 Contrôles après mise à jour

| Contrôle                                               | Attendu                      |
| ------------------------------------------------------ | ---------------------------- |
| `curl .../api/v1/health`                               | `status: ok`, `database: up` |
| Migrations dans les logs                               | Aucune erreur Prisma         |
| Connexion depuis l'application                         | Fonctionnelle                |
| Consultation des salles et d'une réservation existante | Données intactes             |

En cas d'anomalie : appliquer le **rollback** (`docs/09-manuel-deploiement.md` § A.7).

## 4. Migrations de base de données (Prisma)

### 4.1 Créer une migration (développement)

Après modification de `backend/prisma/schema.prisma` :

```bash
cd backend
npx prisma migrate dev --name description_du_changement
```

Cette commande génère un fichier SQL versionné dans `prisma/migrations/`, l'applique à la base locale et régénère le client Prisma. **Le dossier de migration est committé** : c'est lui qui sera rejoué en production.

### 4.2 Application en production

**Automatique** : l'entrypoint du conteneur backend exécute `prisma migrate deploy` avant de démarrer l'API. Cette commande applique uniquement les migrations non encore jouées, sans jamais réinitialiser la base.

Application manuelle si nécessaire :

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 4.3 Écrire des migrations sûres

| Type de changement                  | Risque                   | Bonne pratique                                                                                                              |
| ----------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Ajouter une colonne **nullable**    | Faible                   | Direct                                                                                                                      |
| Ajouter une colonne **obligatoire** | Élevé sur table non vide | Ajouter d'abord en nullable + valeur par défaut, remplir les données, puis rendre obligatoire dans une migration ultérieure |
| Renommer une colonne                | Élevé                    | Ajouter la nouvelle, migrer les données, supprimer l'ancienne après la transition (§ 2)                                     |
| Supprimer une colonne               | Élevé                    | Ne supprimer qu'après avoir vérifié qu'aucune version d'application supportée ne l'utilise                                  |
| Ajouter un index                    | Faible                   | Direct (attention à la durée sur de grosses tables)                                                                         |

### 4.4 Retour arrière d'une migration

Prisma ne génère pas de migration inverse automatique. Trois approches, par ordre de préférence :

1. **Restauration de la sauvegarde** prise avant la mise à jour — la voie la plus sûre :
   ```bash
   docker compose -f docker-compose.prod.yml stop backend
   docker compose -f docker-compose.prod.yml exec -T db \
     sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' \
     < sauvegarde-avant-maj-20260714-1000.dump
   docker compose -f docker-compose.prod.yml start backend
   ```
2. **Migration corrective** : écrire une nouvelle migration qui annule le changement (préférable quand des données ont été créées depuis la mise à jour, car la restauration les perdrait).
3. **Marquage manuel** (`prisma migrate resolve --rolled-back <migration>`) : réservé aux cas de migration partiellement appliquée, à utiliser en connaissance de cause.

> Une migration **échouée** laisse la base dans un état marqué : le conteneur backend refusera de démarrer tant que la situation n'est pas résolue. Consulter les logs, corriger, puis relancer.

## 5. Mise à jour de l'application mobile

### 5.1 Procédure

```bash
cd mobile

# 1. Incrémenter la version dans app.json (aligner sur le tag git)
#    "version": "1.1.0"

# 2. Vérifier le harnais avant build
npm run lint -- --max-warnings 0
npm run typecheck
npm test
npx expo-doctor

# 3. Produire l'APK
npx eas build --platform android --profile preview
```

### 5.2 Distribution

Le pipeline de déploiement continu attache automatiquement l'APK à la **GitHub Release** créée lors du tag. Les utilisateurs :

1. téléchargent le nouvel APK depuis la page des versions ;
2. l'installent **par-dessus** l'application existante — données locales et session conservées, car la signature du keystore EAS est identique.

> ⚠️ Ne jamais produire un build avec un autre projet EAS : la signature changerait et Android refuserait la mise à jour (« Application non installée »).

### 5.3 Mises à jour OTA (évolution possible)

Expo propose `eas update` : la diffusion de correctifs **JavaScript uniquement**, sans passer par un nouveau binaire ni par une réinstallation.

- **Adapté à** : correctifs d'interface, de logique métier mobile, de libellés.
- **Inadapté à** : tout changement de code natif ou d'une dépendance native (nouveau module Expo, changement de SDK) — un nouveau build est alors indispensable.
- Mise en place : `npx eas update:configure`, puis `npx eas update --branch production --message "correctif …"`.

Cette évolution n'est pas activée à ce jour ; la distribution se fait par APK versionné.

## 6. Mise à jour des dépendances

### 6.1 Dépendances applicatives (Dependabot)

[Dependabot](../.github/dependabot.yml) ouvre chaque semaine des pull requests de mise à jour (backend, mobile, outillage, actions GitHub). Traitement :

1. La CI s'exécute automatiquement sur la PR.
2. **CI verte** → relire le changelog de la dépendance, puis fusionner.
3. **CI rouge** → analyser : soit adapter le code, soit refuser la montée en documentant la raison.

Vérification de sécurité manuelle à tout moment :

```bash
cd backend && npm audit --audit-level=high
cd ../mobile && npm audit --audit-level=high
```

Rappel : `npm audit` est **bloquant en CI sur `main` et sur les tags** — aucune vulnérabilité haute ou critique ne peut atteindre une version livrée.

### 6.2 Dépendances Expo — cas particulier

Les paquets Expo (`expo`, `expo-*`, `react-native`, `react`, `jest-expo`…) sont **exclus de Dependabot** : leurs versions doivent rester **cohérentes avec la SDK Expo**, sous peine d'incompatibilités difficiles à diagnostiquer.

Procédure dédiée :

```bash
cd mobile
npx expo install --check      # signale les paquets désalignés
npx expo install --fix        # réaligne sur la SDK installée
npx expo-doctor               # vérifie la cohérence globale
```

### 6.3 Montée de version de la SDK Expo

Opération structurante, à réaliser sur une branche dédiée :

```bash
cd mobile
npx expo install expo@^<nouvelle-version>
npx expo install --fix
npm run lint -- --max-warnings 0 && npm run typecheck && npm test
npx expo-doctor
npx expo export --platform android    # vérifie que le bundle compile
```

Puis tester l'application sur appareil réel avant de produire un build.

> **Contexte projet** : l'application est actuellement alignée sur la **SDK 54**, choix imposé par la version d'Expo Go disponible sur l'appareil de test (voir `docs/04-architecture-logicielle.md` et `docs/08-plan-correction-bogues.md` BUG-003). La montée vers une SDK plus récente est une évolution prévue ; elle nécessite un appareil ou un émulateur compatible, ou l'usage d'un _development build_.

### 6.4 Montée de version de Prisma

Le projet utilise **Prisma 6.19** (branche 6). Le passage à Prisma 7 est une évolution identifiée mais non réalisée : cette version majeure introduit des changements structurels (client ESM-first généré hors de `node_modules`, `prisma.config.ts` obligatoire, adaptateurs de driver, fin du chargement automatique du `.env`) nécessitant une adaptation de l'intégration NestJS. Voir `docs/08-plan-correction-bogues.md` BUG-002.

Procédure envisagée : branche dédiée, suivi du guide officiel de migration, exécution complète des tests unitaires **et** e2e (qui couvrent l'accès réel à la base), puis recette.

## 7. Procédure de correctif urgent (hotfix)

Pour un bogue **bloquant** en production, sans attendre le cycle normal via `develop` :

```bash
# 1. Partir de la version en production
git checkout main
git pull

# 2. Branche de correctif
git switch -c fix/description-du-probleme

# 3. Corriger + AJOUTER LE TEST DE NON-RÉGRESSION (obligatoire)
#    voir docs/08-plan-correction-bogues.md § 1.4

# 4. Vérifier localement
cd backend && npm run lint && npm run typecheck && npm test && npm run test:e2e

# 5. Pull request vers main, CI verte obligatoire, puis fusion

# 6. Incrémenter le CORRECTIF, taguer, publier
#    (CHANGELOG.md + version dans mobile/app.json si l'app est concernée)
git checkout main && git pull
git tag v1.0.1
git push origin v1.0.1        # déclenche le déploiement continu

# 7. Reporter le correctif sur develop pour éviter toute régression
git checkout develop
git merge main
git push origin develop
```

> L'étape 7 est **indispensable** : sans elle, la prochaine livraison depuis `develop` réintroduirait le bogue.

## 8. Contrôles avant toute mise en production

Liste à dérouler intégralement avant de pousser un tag de version :

- [ ] **Sauvegarde de la base** effectuée et vérifiée (fichier non vide, restaurable)
- [ ] `CHANGELOG.md` complété pour la version, au format _Keep a Changelog_
- [ ] Version alignée dans `mobile/app.json`
- [ ] **CI verte** sur `main` : lint, typecheck, tests unitaires (seuils de couverture), tests e2e, `expo-doctor`, `npm audit`
- [ ] **Cahier de recettes** exécuté sur l'APK `preview` — scénarios fonctionnels, structurels et de sécurité (`docs/07`)
- [ ] Aucun test en échec non tracé dans `docs/08-plan-correction-bogues.md`
- [ ] Migrations de base relues (§ 4.3) et compatibilité API ↔ application N-1 vérifiée (§ 2)
- [ ] Procédure de rollback connue et applicable (image précédente disponible, sauvegarde à portée)
- [ ] Après déploiement : `/health` OK, connexion et parcours de réservation vérifiés en conditions réelles
