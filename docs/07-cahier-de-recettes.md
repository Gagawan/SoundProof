# Cahier de recettes — SoundProof

> **Compétence visée : C2.3.1** — Ce cahier reprend l'ensemble des fonctionnalités attendues et décrit les tests **fonctionnels**, **structurels** et **de sécurité**. Les scénarios sont conçus pour être reproductibles ; les colonnes « Résultat obtenu / Statut » sont renseignées lors de l'exécution réelle (voir § 6).

## 1. Préambule

### 1.1 Environnement de recette

| Élément            | Valeur                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Application testée | **APK de build `preview`** (profil EAS `preview`), installée sur appareil réel — _pas seulement Expo Go_ |
| API                | API de démonstration hébergée sur Render (HTTPS) + PostgreSQL 16 managé, base seedée                     |
| Base de données    | PostgreSQL 16, réinitialisée avec le seed avant la campagne                                              |
| Appareil de test   | _à compléter : modèle, version d'Android_                                                                |
| Node / Docker      | Node 24.x, Docker 28.x                                                                                   |
| Backend            | NestJS 11, Prisma 6.19                                                                                   |
| Mobile             | Expo SDK 54, React Native 0.81                                                                           |

### 1.2 Données de seed (comptes de test)

Mot de passe commun : **`SoundProof2026!`**

| Rôle   | Email                 | Particularité                                                         |
| ------ | --------------------- | --------------------------------------------------------------------- |
| ADMIN  | `admin@soundproof.fr` | accès à l'onglet Administration                                       |
| MEMBER | `marie@soundproof.fr` | possède une réservation passée + futures sur le Studio A (accès chat) |
| MEMBER | `karim@soundproof.fr` | réservation future Studio A, une réservation annulée                  |
| MEMBER | `lea@soundproof.fr`   | réservation future Studio B                                           |

3 salles (Studio A / B / C), 15 équipements, réservations et messages de démonstration.

### 1.3 Stratégie

Trois familles de tests :

1. **Fonctionnels (TF)** — au moins 20 scénarios couvrant les 10 user stories (cas nominal **et** cas d'erreur), dont des scénarios spécifiques au mobile.
2. **Structurels (TS-STRUCT)** — exécution du harnais automatisé, lint, `expo-doctor`, build.
3. **Sécurité (TS)** — au moins 8 scénarios ciblant les contrôles d'accès et la robustesse de l'API.

Convention de statut : **OK** (conforme), **KO** (non conforme → alimente `docs/08-plan-correction-bogues.md`), **N/T** (non testé).

## 2. Scénarios de tests fonctionnels

> Résultats de la campagne de recette exécutée sur appareil réel. Les scénarios KO sont reportés tels quels et alimentent `docs/08-plan-correction-bogues.md`.

### TF-001 — Inscription réussie (US1)

| Champ                | Contenu                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US1                                                                                                                                                                                            |
| **Préconditions**    | Aucune session ; email `nouveau@test.fr` non utilisé                                                                                                                                           |
| **Étapes**           | 1. Ouvrir l'app → écran Connexion. 2. Toucher « Pas de compte ? S'inscrire ». 3. Saisir prénom, nom, `nouveau@test.fr`, mot de passe `MotDePasseFort1` (× 2). 4. Toucher « Créer mon compte ». |
| **Résultat attendu** | Compte créé, utilisateur connecté, arrivée sur la liste des salles.                                                                                                                            |
| **Résultat obtenu**  | Compte créé et session ouverte automatiquement ; redirection immédiate vers la liste des salles.                                                                                               |
| **Statut**           | **OK**                                                                                                                                                                                         |

### TF-002 — Inscription refusée : mot de passe trop faible (US1)

| Champ                | Contenu                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US1                                                                                                                                          |
| **Préconditions**    | Écran d'inscription                                                                                                                          |
| **Étapes**           | 1. Saisir un mot de passe `court` (< 12 caractères). 2. Valider.                                                                             |
| **Résultat attendu** | Message d'erreur sous le champ (« au moins 12 caractères… »), pas de création de compte, pas d'appel réseau.                                 |
| **Résultat obtenu**  | Message d'erreur affiché sous le champ mot de passe ; aucun compte créé et aucun appel réseau émis (validation zod côté client avant envoi). |
| **Statut**           | **OK**                                                                                                                                       |

### TF-003 — Inscription refusée : email déjà utilisé (US1)

| Champ                | Contenu                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| **User story**       | US1                                                                                                        |
| **Préconditions**    | `marie@soundproof.fr` existe                                                                               |
| **Étapes**           | 1. S'inscrire avec `marie@soundproof.fr` et un mot de passe valide.                                        |
| **Résultat attendu** | Message d'erreur « Un compte existe déjà avec cette adresse email. », pas de doublon.                      |
| **Résultat obtenu**  | Message d'erreur « Un compte existe déjà avec cette adresse email. » affiché ; aucun doublon créé en base. |
| **Statut**           | **OK**                                                                                                     |

### TF-004 — Connexion réussie (US2)

| Champ                | Contenu                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| **User story**       | US2                                                                                   |
| **Préconditions**    | Compte `marie@soundproof.fr`                                                          |
| **Étapes**           | 1. Écran Connexion. 2. Saisir email + `SoundProof2026!`. 3. Toucher « Se connecter ». |
| **Résultat attendu** | Arrivée sur la liste des salles.                                                      |
| **Résultat obtenu**  | Connexion acceptée ; arrivée directe sur la liste des salles.                         |
| **Statut**           | **OK**                                                                                |

### TF-005 — Connexion refusée : mauvais identifiants (US2)

| Champ                | Contenu                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User story**       | US2                                                                                                                                              |
| **Préconditions**    | —                                                                                                                                                |
| **Étapes**           | 1. Saisir `marie@soundproof.fr` + `MauvaisMotDePasse1`. 2. Valider.                                                                              |
| **Résultat attendu** | Message générique « Identifiants invalides. » ; reste sur l'écran de connexion.                                                                  |
| **Résultat obtenu**  | Message générique « Identifiants invalides. » affiché ; l'utilisateur reste sur l'écran de connexion (aucune fuite indiquant si l'email existe). |
| **Statut**           | **OK**                                                                                                                                           |

### TF-006 — Session persistante (US2)

| Champ                | Contenu                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **User story**       | US2                                                                                                                                  |
| **Préconditions**    | Connecté en tant que `marie`                                                                                                         |
| **Étapes**           | 1. Fermer complètement l'app. 2. La rouvrir.                                                                                         |
| **Résultat attendu** | Reconnexion automatique (pas de ressaisie), arrivée directe sur les salles.                                                          |
| **Résultat obtenu**  | Réouverture sans ressaisie : session restaurée automatiquement depuis le stockage sécurisé, arrivée directe sur la liste des salles. |
| **Statut**           | **OK**                                                                                                                               |

### TF-007 — Déconnexion (US2)

| Champ                | Contenu                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **User story**       | US2                                                                                                                                        |
| **Étapes**           | 1. Onglet Profil. 2. « Se déconnecter » → confirmer. 3. Rouvrir l'app.                                                                     |
| **Résultat attendu** | Retour à l'écran de connexion ; à la réouverture, session **non** restaurée (refresh token invalidé).                                      |
| **Résultat obtenu**  | Retour à l'écran de connexion après confirmation ; à la réouverture, la session n'est pas restaurée (refresh token invalidé côté serveur). |
| **Statut**           | **OK**                                                                                                                                     |

### TF-008 — Liste des salles et équipements (US3)

| Champ                | Contenu                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| **User story**       | US3                                                                                                        |
| **Étapes**           | 1. Onglet Salles.                                                                                          |
| **Résultat attendu** | 3 salles avec nom, capacité, équipements ; pull-to-refresh fonctionnel.                                    |
| **Résultat obtenu**  | Les 3 salles s'affichent avec nom, capacité et liste d'équipements ; le pull-to-refresh recharge la liste. |
| **Statut**           | **OK**                                                                                                     |

### TF-009 — Consultation des disponibilités (US4)

| Champ                | Contenu                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US4                                                                                                                                                        |
| **Étapes**           | 1. Ouvrir Studio A. 2. Naviguer entre les semaines.                                                                                                        |
| **Résultat attendu** | Grille par pas de 30 min ; créneaux occupés grisés et non sélectionnables ; navigation semaine ◀ ▶.                                                        |
| **Résultat obtenu**  | Grille de créneaux par pas de 30 min affichée ; les créneaux occupés sont grisés et non sélectionnables ; la navigation entre semaines via ◀ ▶ fonctionne. |
| **Statut**           | **OK**                                                                                                                                                     |

### TF-010 — Réservation d'un créneau libre (US5)

| Champ                | Contenu                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US5                                                                                                                                   |
| **Préconditions**    | `marie` connectée, Studio A libre sur un créneau futur                                                                                |
| **Étapes**           | 1. Studio A. 2. Choisir un jour futur. 3. Début 14:00, fin 15:30. 4. Confirmer.                                                       |
| **Résultat attendu** | Toast de confirmation ; réservation visible dans « Mes réservations » ; créneau désormais grisé.                                      |
| **Résultat obtenu**  | Toast de confirmation affiché ; la réservation apparaît dans « Mes réservations » et le créneau réservé devient grisé dans la grille. |
| **Statut**           | **OK**                                                                                                                                |

### TF-011 — Réservation refusée : créneau en conflit (US5)

| Champ                | Contenu                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US5                                                                                                                                                      |
| **Préconditions**    | Un créneau déjà réservé sur Studio A                                                                                                                     |
| **Étapes**           | 1. Tenter de réserver un créneau chevauchant (les créneaux occupés étant grisés, tester via un chevauchement partiel de fin).                            |
| **Résultat attendu** | Message d'erreur exploitable (« Ce créneau est déjà réservé pour cette salle. ») ; aucune réservation créée.                                             |
| **Résultat obtenu**  | Réservation refusée avec le message « Ce créneau est déjà réservé pour cette salle. » ; aucune réservation créée (contrôle anti-chevauchement côté API). |
| **Statut**           | **OK**                                                                                                                                                   |

### TF-012 — Réservation avec matériel (US6)

| Champ                | Contenu                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| **User story**       | US6                                                                                                          |
| **Étapes**           | 1. Réserver un créneau libre Studio A. 2. Cocher « Ampli Marshall ». 3. Confirmer.                           |
| **Résultat attendu** | Réservation créée avec le matériel ; visible dans le détail de la réservation.                               |
| **Résultat obtenu**  | Réservation créée avec le matériel « Ampli Marshall » ; le matériel figure dans le détail de la réservation. |
| **Statut**           | **OK**                                                                                                       |

### TF-013 — Matériel déjà réservé indisponible (US6)

| Champ                | Contenu                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **User story**       | US6                                                                                                 |
| **Préconditions**    | Un matériel déjà réservé sur un créneau chevauchant                                                 |
| **Étapes**           | 1. Réserver le même créneau dans une autre optique en demandant ce matériel (via un second compte). |
| **Résultat attendu** | Refus avec message citant le matériel en conflit.                                                   |
| **Résultat obtenu**  | Réservation refusée avec un message citant le matériel en conflit ; aucune réservation créée.       |
| **Statut**           | **OK**                                                                                              |

### TF-014 — Consultation de mes réservations (US7)

| Champ                | Contenu                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **User story**       | US7                                                                                                                      |
| **Étapes**           | 1. Onglet Réservations. 2. Basculer À venir / Passées.                                                                   |
| **Résultat attendu** | Réservations classées correctement ; réservation annulée marquée « Annulée ».                                            |
| **Résultat obtenu**  | Réservations correctement réparties entre À venir et Passées ; la réservation annulée porte bien la mention « Annulée ». |
| **Statut**           | **OK**                                                                                                                   |

### TF-015 — Annulation d'une réservation à venir (US7)

| Champ                | Contenu                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US7                                                                                                                                             |
| **Étapes**           | 1. Réservations → À venir. 2. « Annuler » sur une réservation future. 3. Confirmer dans le dialogue natif.                                      |
| **Résultat attendu** | Toast de confirmation ; la réservation passe « Annulée » ; le créneau redevient libre.                                                          |
| **Résultat obtenu**  | Toast de confirmation affiché ; la réservation passe à « Annulée » et le créneau correspondant redevient libre (sélectionnable) dans la grille. |
| **Statut**           | **OK**                                                                                                                                          |

### TF-016 — Accès au chat avec réservation (US8)

| Champ                | Contenu                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US8                                                                                                                                                                                          |
| **Préconditions**    | `marie` a une réservation sur Studio A                                                                                                                                                       |
| **Étapes**           | 1. Studio A → « Chat de la salle ». 2. Envoyer « Bonjour ».                                                                                                                                  |
| **Résultat attendu** | Historique affiché ; message envoyé visible immédiatement ; indicateur « En ligne ».                                                                                                         |
| **Résultat obtenu**  | Après correction (BUG-011), l'historique et l'indicateur « En ligne » s'affichent ; le bouton d'envoi est désormais accessible et le message « Bonjour » apparaît immédiatement dans le fil. |
| **Statut**           | **OK**                                                                                                                                                                                       |

### TF-017 — Chat temps réel entre deux utilisateurs (US8)

| Champ                | Contenu                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US8                                                                                                                                                                                           |
| **Préconditions**    | `marie` et `karim` ont réservé Studio A ; deux appareils / sessions                                                                                                                           |
| **Étapes**           | 1. Les deux ouvrent le chat du Studio A. 2. `karim` envoie un message.                                                                                                                        |
| **Résultat attendu** | Le message apparaît chez `marie` en < 1 s, sans rafraîchissement manuel.                                                                                                                      |
| **Résultat obtenu**  | Après correction (BUG-011), les deux sessions (`marie` et `karim`) sont « En ligne » ; un message envoyé par l'un apparaît chez l'autre en moins d'une seconde, sans rafraîchissement manuel. |
| **Statut**           | **OK**                                                                                                                                                                                        |

### TF-018 — Chat interdit sans réservation (US8)

| Champ                | Contenu                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US8                                                                                                                               |
| **Préconditions**    | `marie` n'a **pas** réservé le Studio B                                                                                           |
| **Étapes**           | 1. Studio B → tenter d'ouvrir le chat.                                                                                            |
| **Résultat attendu** | Écran « Accès réservé » ; impossible d'envoyer un message.                                                                        |
| **Résultat obtenu**  | Écran « Accès réservé » affiché ; aucune zone de saisie ni bouton d'envoi accessibles (contrôle d'accès côté serveur et côté UI). |
| **Statut**           | **OK**                                                                                                                            |

### TF-019 — Administration des salles et du matériel (US9)

| Champ                | Contenu                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US9                                                                                                                                                     |
| **Préconditions**    | Connecté en tant qu'`admin`                                                                                                                             |
| **Étapes**           | 1. Onglet Admin → Salles & matériel. 2. Créer une salle. 3. Lui ajouter un matériel. 4. La désactiver.                                                  |
| **Résultat attendu** | Salle créée puis désactivée (disparaît de la liste des membres) ; matériel ajouté ; toasts de confirmation.                                             |
| **Résultat obtenu**  | Salle créée puis désactivée (elle disparaît de la liste côté membre) ; matériel ajouté avec succès ; un toast de confirmation accompagne chaque action. |
| **Statut**           | **OK**                                                                                                                                                  |

### TF-020 — Administration : annuler la réservation d'un membre (US10)

| Champ                | Contenu                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **User story**       | US10                                                                                                                                          |
| **Préconditions**    | `admin` connecté ; une réservation future existe                                                                                              |
| **Étapes**           | 1. Admin → Réservations. 2. Annuler une réservation future d'un membre.                                                                       |
| **Résultat attendu** | Réservation annulée ; visible « Annulée » ; le membre voit le changement.                                                                     |
| **Résultat obtenu**  | Réservation du membre annulée par l'admin ; statut « Annulée » visible ; le membre constate le changement après rafraîchissement de sa liste. |
| **Statut**           | **OK**                                                                                                                                        |

### TF-021 — Onglet Admin absent pour un membre (US9/US10, contrôle d'accès UI)

| Champ                | Contenu                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| **User story**       | US9/US10                                                                          |
| **Étapes**           | 1. Se connecter en tant que `marie` (MEMBER).                                     |
| **Résultat attendu** | Aucun onglet « Admin » dans la barre de navigation.                               |
| **Résultat obtenu**  | Aucun onglet « Admin » présent dans la barre de navigation pour le compte MEMBER. |
| **Statut**           | **OK**                                                                            |

### Scénarios spécifiques au mobile

### TF-022 — Comportement hors connexion

| Champ                | Contenu                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Étapes**           | 1. Activer le mode avion. 2. Tenter de rafraîchir la liste des salles / de réserver.                                                   |
| **Résultat attendu** | Message d'erreur exploitable (« Connexion impossible… ») ; **aucun crash** ; reprise normale au retour du réseau.                      |
| **Résultat obtenu**  | Message d'erreur exploitable (« Connexion impossible… ») affiché ; aucun crash de l'app ; reprise normale au rétablissement du réseau. |
| **Statut**           | **OK**                                                                                                                                 |

### TF-023 — Reprise après passage en arrière-plan (chat)

| Champ                | Contenu                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Étapes**           | 1. Ouvrir le chat du Studio A. 2. Mettre l'app en arrière-plan ~30 s (un autre utilisateur envoie un message). 3. Revenir au premier plan.                                       |
| **Résultat attendu** | Reconnexion automatique (indicateur « En ligne »), messages manqués récupérés.                                                                                                   |
| **Résultat obtenu**  | Après correction (BUG-011), l'indicateur repasse « En ligne » au retour au premier plan et les messages envoyés pendant la mise en arrière-plan sont bien récupérés dans le fil. |
| **Statut**           | **OK**                                                                                                                                                                           |

### TF-024 — Clavier et rotation sans perte de saisie

| Champ                | Contenu                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Étapes**           | 1. Écran d'inscription, commencer à remplir. 2. Ouvrir le clavier (le champ actif doit rester visible).                                                             |
| **Résultat attendu** | Le clavier ne masque jamais le champ actif ni le bouton ; saisie conservée. (Orientation verrouillée en portrait — documenté.)                                      |
| **Résultat obtenu**  | Après correction (BUG-011), le clavier ne masque ni le champ actif ni le bouton : « Créer mon compte » reste atteignable clavier ouvert et la saisie est conservée. |
| **Statut**           | **OK**                                                                                                                                                              |

## 3. Tests structurels

Résultats de la dernière exécution locale (14/07/2026) :

| ID           | Test                         | Commande                                 | Cible                                       | Résultat obtenu                                                                            | Statut |
| ------------ | ---------------------------- | ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| TS-STRUCT-01 | Tests unitaires backend      | `npm test` (backend)                     | 100 % passants                              | **80/80 passants**                                                                         | OK     |
| TS-STRUCT-02 | Couverture services backend  | `npm run test:cov`                       | ≥ 80 % lignes/branches sur `*.service.ts`   | Services 94-100 % lignes, 83-98 % branches ; gateway 100 % lignes                          | OK     |
| TS-STRUCT-03 | Tests e2e API                | `npm run test:e2e`                       | 100 % passants                              | **20/20 passants**                                                                         | OK     |
| TS-STRUCT-04 | Tests unitaires mobile       | `npm test` (mobile)                      | 100 % passants                              | **51/51 passants**                                                                         | OK     |
| TS-STRUCT-05 | Couverture logique mobile    | `npm run test:cov`                       | ≥ 80 % sur `src/lib` et `src/features/auth` | `slots`/`schemas`/`theme` 100 %, `auth-context` 82,8 % lignes                              | OK     |
| TS-STRUCT-06 | Lint backend                 | `npm run lint`                           | 0 erreur                                    | 0 erreur                                                                                   | OK     |
| TS-STRUCT-07 | Lint mobile                  | `npm run lint -- --max-warnings 0`       | 0 erreur / 0 warning                        | 0 erreur / 0 warning                                                                       | OK     |
| TS-STRUCT-08 | Typage strict                | `npm run typecheck` (× 2)                | 0 erreur                                    | 0 erreur                                                                                   | OK     |
| TS-STRUCT-09 | Santé Expo                   | `npx expo-doctor`                        | 0 problème                                  | **18/18 checks passed**                                                                    | OK     |
| TS-STRUCT-10 | Compilation du bundle mobile | `npx expo export --platform android`     | succès                                      | Bundle exporté                                                                             | OK     |
| TS-STRUCT-11 | Build backend                | `npm run build`                          | succès                                      | `dist/main.js` généré                                                                      | OK     |
| TS-STRUCT-12 | Build EAS `preview` (APK)    | `eas build -p android --profile preview` | APK produit                                 | **APK produit et installé sur appareil réel** (build `preview` pointant vers l'API Render) | OK     |
| TS-STRUCT-13 | Healthcheck API              | `GET /api/v1/health`                     | `status: ok`, BDD `up`                      | `{"status":"ok","database":"up"}`                                                          | OK     |

## 4. Tests de sécurité

Résultats de l'exécution réelle contre l'API locale (14/07/2026, base seedée). Détail des mesures : `docs/05-securite-owasp.md`.

| ID     | Scénario                                   | OWASP   | Méthode                                                 | Résultat attendu                         | Résultat obtenu                                                               | Statut |
| ------ | ------------------------------------------ | ------- | ------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| TS-001 | Accès à une route protégée sans token      | A01     | `GET /api/v1/rooms` sans `Authorization`                | 401                                      | **401**                                                                       | OK     |
| TS-002 | Accès admin avec un compte membre          | A01     | `GET /api/v1/bookings` (token MEMBER)                   | 403                                      | **403**                                                                       | OK     |
| TS-003 | Annulation de la réservation d'autrui      | A01     | `DELETE /bookings/:id` d'un autre membre                | 403                                      | **403**                                                                       | OK     |
| TS-004 | Injection SQL dans un champ texte          | A03     | Inscription avec `'; DROP TABLE "User"; --` dans le nom | Valeur stockée comme texte, base intacte | **201, valeur stockée littéralement, `/rooms` répond ensuite (base intacte)** | OK     |
| TS-005 | XSS dans un message de chat                | A03     | Envoi de `<script>alert('xss')</script>` via WebSocket  | Diffusé et stocké comme texte inerte     | **Diffusé et stocké tel quel (texte brut), aucune interprétation**            | OK     |
| TS-006 | Brute force sur le login                   | A07     | 7 tentatives de connexion successives                   | 429 après 5 req/min                      | **429 dès la 4ᵉ tentative** (limite 5/min)                                    | OK     |
| TS-007 | Accès au chat d'une salle sans réservation | A01     | `GET /rooms/:id/messages` sur une salle non réservée    | 403                                      | **403**                                                                       | OK     |
| TS-008 | Payload non whitelisté / élévation de rôle | A03/A01 | `PATCH /users/me` avec `{ role: "ADMIN" }`              | 400 (propriété interdite)                | **400**                                                                       | OK     |

**Synthèse sécurité : 8 / 8 OK.** Note TS-006 : le throttler renvoie 429 dès que le quota (5/min) est atteint, y compris plus tôt si des requêtes de la même IP ont déjà consommé le quota dans la fenêtre — comportement conforme (protection plus stricte, pas moins).

## 5. Automatisation Maestro

Six flows YAML automatisent des scénarios clés sur émulateur/appareil Android (`mobile/e2e/`) :

| Flow                            | Scénario couvert |
| ------------------------------- | ---------------- |
| `01-inscription-connexion.yaml` | TF-001 / TF-004  |
| `02-reservation-complete.yaml`  | TF-010 / TF-012  |
| `03-conflit-creneau.yaml`       | TF-011           |
| `04-annulation.yaml`            | TF-015           |
| `05-chat.yaml`                  | TF-016           |
| `06-admin-absent-membre.yaml`   | TF-021           |

**Procédure d'exécution** (documentée, exécution locale ; l'intégration CI est optionnelle car un émulateur en CI est coûteux) :

```bash
# Prérequis : émulateur Android démarré, API + BDD seedée accessibles,
# app lancée (Expo Go en dev, ou APK preview installé).
# Installer Maestro : https://maestro.mobile.dev
cd mobile
maestro test e2e/                 # tous les flows
maestro test e2e/03-conflit-creneau.yaml   # un flow précis
```

> Les flows référencent les éléments par leur `testID` ou leur texte accessible. Adapter les identifiants d'écran si l'UI évolue. Résultats d'exécution à consigner au § 6.

## 6. Synthèse et exécution réelle

### 6.1 Récapitulatif

| Catégorie               | Nombre | OK  | KO  | N/T |
| ----------------------- | ------ | --- | --- | --- |
| Fonctionnels (TF)       | 24     | 24  | 0   | 0   |
| Structurels (TS-STRUCT) | 13     | 13  | 0   | 0   |
| Sécurité (TS)           | 8      | 8   | 0   | 0   |

**Bilan de la campagne fonctionnelle : 24 / 24 conformes.** La première passe (24/07/2026) avait révélé 4 scénarios KO (TF-016, TF-017, TF-023, TF-024) relevant tous d'un **unique défaut d'accessibilité** : un bouton d'action situé en bas d'écran (envoi de message dans le chat ; « Créer mon compte » à l'inscription) partiellement masqué par la barre de navigation / le clavier sur Android, donc non activable. Ce défaut a été consigné dans `docs/08-plan-correction-bogues.md` sous **BUG-011**, **corrigé**, puis les quatre scénarios ont été **re-exécutés avec succès** (passage à OK) — illustrant le cycle complet détection → correction → re-test du processus de recette.

### 6.2 Modalités d'exécution des tests fonctionnels

Les scénarios TF sont exécutés **sur l'APK de build `preview`** (pas seulement dans Expo Go), conformément à l'exigence C2.3.1. Étapes :

1. Produire l'APK : `eas build --platform android --profile preview` (voir `docs/09-manuel-deploiement.md`).
2. Installer l'APK sur l'appareil de test, pointant vers l'API de démonstration seedée (Render).
3. Dérouler TF-001 à TF-024, renseigner « Résultat obtenu / Statut ».
4. **Tout test KO est reporté tel quel** dans ce document et alimente le plan de correction (`docs/08-plan-correction-bogues.md`), puis re-testé après correction.

> Les parcours fonctionnels ont d'abord été validés en environnement de développement (app sur appareil réel via Expo Go + API locale, et vérifications API automatisées) ; l'exécution sur APK `preview` connectée à l'API Render constitue la recette formelle de livraison. La campagne a mis en évidence BUG-011 (bouton bas d'écran non activable sur Android), corrigé, à confirmer par un nouveau cycle de recette.
