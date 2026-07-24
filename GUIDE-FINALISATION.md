# Guide de finalisation — SoundProof (Bloc 2)

Ce guide détaille **les trois seules choses qu'il reste à faire** pour compléter le rendu du Bloc 2. Le code et le dossier sont terminés ; il s'agit ici de **preuves d'exécution** exigées par la grille d'évaluation.

| #   | Tâche                                            | Compétence                | Priorité      | Durée   |
| --- | ------------------------------------------------ | ------------------------- | ------------- | ------- |
| 1   | Exécuter la recette fonctionnelle (24 scénarios) | **C2.3.1 — éliminatoire** | 🔴 Critique   | ~45 min |
| 2   | Réaliser et consigner l'audit d'accessibilité    | **C2.2.3 — éliminatoire** | 🟠 Important  | ~30 min |
| 3   | Produire les captures d'écran                    | C2.2.1 (renfort)          | 🟡 Recommandé | ~15 min |

---

## 0. Préparation commune : lancer l'application

Les trois tâches se font sur l'application qui tourne. Préparez l'environnement **une seule fois**.

### 0.1 Démarrer la base et l'API (Terminal 1)

```bash
cd C:\Users\gagaw\Documents\Travail\SoundProof

# Base PostgreSQL (Docker Desktop doit être lancé)
docker compose up -d

# API : (re)charger les données de démo puis démarrer
cd backend
npx prisma db seed
npm run dev
```

Laissez ce terminal ouvert. L'API tourne sur le port 3000.

### 0.2 Vérifier l'adresse IP et configurer `mobile/.env`

⚠️ **Votre IP change selon le réseau.** Vérifiez-la à chaque session :

```bash
ipconfig
```

Repérez la ligne **« Adresse IPv4 »** de votre carte **Wi-Fi** (ex. `192.168.1.42`). Dans `mobile/.env`, mettez :

```
EXPO_PUBLIC_API_URL=http://VOTRE-IP:3000
```

> **Rappels réseau** (problèmes déjà rencontrés) :
>
> - Téléphone et PC sur **le même Wi-Fi**.
> - Le profil réseau Windows doit être **« Privé »** (Paramètres → Réseau → votre Wi-Fi → Privé), sinon le pare-feu bloque.
> - Si vous changez `.env`, **relancez** Expo (`Ctrl+C` puis `npm run dev`).

### 0.3 Démarrer l'application (Terminal 2)

```bash
cd C:\Users\gagaw\Documents\Travail\SoundProof\mobile
npm run dev
```

Scannez le QR code avec **Expo Go**. Si le réseau pose problème, utilisez un **émulateur Android** (touche `a`) avec `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`.

### 0.4 Comptes de test (données de démo)

Mot de passe commun : **`SoundProof2026!`**

| Rôle   | Email                 | Usage                                           |
| ------ | --------------------- | ----------------------------------------------- |
| Admin  | `admin@soundproof.fr` | tests d'administration (TF-019, TF-020, TF-021) |
| Membre | `marie@soundproof.fr` | réservation Studio A + accès chat               |
| Membre | `karim@soundproof.fr` | second compte pour le chat temps réel (TF-017)  |

> **Idéalement**, la recette se fait sur l'**APK preview** (celui de la GitHub Release). Mais l'exécution via **Expo Go** est acceptable et documentée. Notez dans le préambule du cahier ce que vous avez utilisé.

---

## 1. 🔴 Recette fonctionnelle — les 24 scénarios (C2.3.1, éliminatoire)

### 1.1 Ce qu'il faut faire

Pour **chaque scénario ci-dessous** : dérouler les étapes dans l'app, comparer au résultat attendu, puis **écrire le résultat réel et le statut** dans `docs/07-cahier-de-recettes.md`.

Dans le fichier, pour chaque scénario, remplacez :

- `| **Résultat obtenu** | _à remplir_ |` → ce que vous avez réellement observé
- `| **Statut** | _OK / KO_ |` → **OK** (conforme) ou **KO** (non conforme)

> **Règle d'or (exigée par le référentiel)** : ne rien inventer. Si un test échoue, écrivez **KO** et notez ce qui s'est passé — un KO se traite ensuite dans le plan de correction (`docs/08`). En pratique, l'app ayant déjà été testée, la plupart seront OK.

Complétez aussi le préambule `§1.1` : **modèle de l'appareil et version d'Android** utilisés.

### 1.2 Déroulé des 24 scénarios

**Authentification (US1-US2)**

- **TF-001 — Inscription réussie** : écran Connexion → « S'inscrire » → saisir prénom, nom, un **email neuf** (ex. `test1@demo.fr`), mot de passe `MotDePasseFort1` (× 2) → « Créer mon compte ». _Attendu : compte créé, arrivée sur la liste des salles._
- **TF-002 — Mot de passe trop faible** : inscription avec le mot de passe `court`. _Attendu : erreur sous le champ, pas de création._
- **TF-003 — Email déjà utilisé** : inscription avec `marie@soundproof.fr`. _Attendu : « Un compte existe déjà avec cette adresse email. »_
- **TF-004 — Connexion réussie** : `marie@soundproof.fr` / `SoundProof2026!`. _Attendu : liste des salles._
- **TF-005 — Mauvais identifiants** : `marie@soundproof.fr` / `MauvaisMotDePasse1`. _Attendu : « Identifiants invalides. »_
- **TF-006 — Session persistante** : fermer **complètement** l'app, la rouvrir. _Attendu : reconnexion automatique, pas de ressaisie._
- **TF-007 — Déconnexion** : onglet Profil → « Se déconnecter » → confirmer, puis rouvrir l'app. _Attendu : écran de connexion ; session non restaurée._

**Salles et disponibilités (US3-US4)**

- **TF-008 — Liste des salles** : onglet Salles. _Attendu : 3 salles avec nom, capacité, équipements ; pull-to-refresh fonctionne._
- **TF-009 — Disponibilités** : ouvrir Studio A, naviguer entre les semaines. _Attendu : grille 30 min, créneaux occupés grisés/non sélectionnables._

**Réservations (US5-US6)**

- **TF-010 — Réservation d'un créneau libre** : Studio A → un jour futur → début 14:00, fin 15:30 → Confirmer. _Attendu : toast de confirmation, réservation dans « Mes réservations », créneau grisé._
- **TF-011 — Créneau en conflit** : tenter un créneau qui chevauche une réservation existante. _Attendu : « Ce créneau est déjà réservé », aucune création._
- **TF-012 — Réservation avec matériel** : réserver un créneau libre en cochant un équipement. _Attendu : réservation créée avec le matériel visible._
- **TF-013 — Matériel indisponible** : réserver un créneau chevauchant, en demandant un matériel déjà pris (utilisez un 2ᵉ compte pour créer le conflit au préalable). _Attendu : refus mentionnant le matériel._

**Gestion des réservations (US7)**

- **TF-014 — Mes réservations** : onglet Réservations, basculer À venir / Passées. _Attendu : classement correct ; une annulée porte « Annulée »._
- **TF-015 — Annulation** : sur une réservation future → « Annuler » → confirmer le dialogue natif. _Attendu : toast, réservation « Annulée », créneau redevenu libre._

**Chat (US8)**

- **TF-016 — Accès au chat avec réservation** : Studio A → « Chat de la salle » → envoyer « Bonjour ». _Attendu : historique affiché, message visible, indicateur « En ligne »._
- **TF-017 — Chat temps réel entre deux utilisateurs** : ouvrir le chat du Studio A avec `marie` (un appareil) **et** `karim` (autre appareil/émulateur) → `karim` envoie un message. _Attendu : le message apparaît chez `marie` en < 1 s, sans rafraîchir._
- **TF-018 — Chat interdit sans réservation** : avec `marie`, ouvrir le Studio B (où elle n'a pas réservé) → tenter le chat. _Attendu : écran « Accès réservé »._

**Administration (US9-US10)**

- **TF-019 — Admin salles/matériel** : se connecter en `admin` → onglet Admin → créer une salle, lui ajouter un matériel, la désactiver. _Attendu : salle créée puis désactivée, matériel ajouté, toasts._
- **TF-020 — Admin annule une réservation** : Admin → Réservations → annuler une réservation future d'un membre. _Attendu : réservation annulée, visible « Annulée »._
- **TF-021 — Onglet Admin absent pour un membre** : se connecter en `marie`. _Attendu : aucun onglet « Admin »._

**Spécifiques mobile**

- **TF-022 — Hors connexion** : activer le mode avion → rafraîchir les salles / tenter une réservation. _Attendu : message d'erreur exploitable, **aucun crash** ; reprise au retour du réseau._
- **TF-023 — Reprise après arrière-plan (chat)** : ouvrir le chat du Studio A → mettre l'app en arrière-plan ~30 s (faire envoyer un message par l'autre compte) → revenir. _Attendu : reconnexion (« En ligne »), messages manqués récupérés._
- **TF-024 — Clavier et rotation** : sur l'inscription, remplir des champs, ouvrir le clavier. _Attendu : le champ actif reste visible, saisie conservée. (Portrait verrouillé : documenté.)_

### 1.3 Après l'exécution

1. Complétez le **tableau de synthèse §6.1** de `docs/07` : nombre de OK / KO par catégorie.
2. Pour tout **KO** : ajoutez une ligne dans `docs/08-plan-correction-bogues.md` §4 (scénario, cause, correction) — et corrigez si le temps le permet.
3. Committez :
   ```bash
   git add docs/07-cahier-de-recettes.md docs/08-plan-correction-bogues.md
   git commit -m "docs: résultats d'exécution de la recette fonctionnelle"
   ```

---

## 2. 🟠 Audit d'accessibilité (C2.2.3, éliminatoire)

Objectif : **prouver que le prototype répond au référentiel WCAG 2.1 AA / EN 301 549** en le parcourant avec un lecteur d'écran et un analyseur, puis consigner les résultats dans `docs/06-accessibilite.md §3.2`.

### 2.1 Activer TalkBack (lecteur d'écran Android)

_Paramètres → Accessibilité → TalkBack → Activer._

Navigation TalkBack :

- **Balayer vers la droite/gauche** : élément suivant / précédent (il est lu à voix haute).
- **Double-taper** : activer l'élément sélectionné.
- **Désactiver** : même menu, ou maintenir les **deux boutons de volume**.

### 2.2 Parcourir les 6 écrans

Pour chaque écran, vérifiez que TalkBack **annonce correctement** nom + rôle + état, et notez toute anomalie :

| #   | Écran                | Points à vérifier                                                                                                                                                    |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Connexion            | Titre annoncé « en-tête » ; champs annoncés avec leur libellé ; à la soumission vide, les erreurs sont lues ; le bouton dit « occupé » pendant le chargement         |
| 2   | Inscription          | Les instructions de mot de passe sont lues ; l'erreur de confirmation est rattachée au bon champ                                                                     |
| 3   | Liste des salles     | Chaque carte annonce nom + capacité + nb d'équipements ; le pull-to-refresh est accessible                                                                           |
| 4   | Détail + réservation | Flèches de semaine nommées ; jour « sélectionné » ; créneau occupé annoncé « désactivé » ; case matériel « cochée / décochée » ; après confirmation, le toast est lu |
| 5   | Mes réservations     | Onglets « À venir / Passées » annoncés « onglet, sélectionné » ; « Annuler » → le dialogue est lu ; le résultat est annoncé                                          |
| 6   | Chat                 | L'indicateur de connexion est lu ; chaque message lu avec auteur + heure + contenu ; **un nouveau message entrant est annoncé** ; champ et bouton d'envoi nommés     |

### 2.3 Accessibility Scanner (Google)

1. Installez **Accessibility Scanner** depuis le Play Store, activez-le (Paramètres → Accessibilité → Accessibility Scanner).
2. Sur chaque écran, appuyez sur le bouton **coche** de Scanner pour lancer une analyse.
3. Notez les suggestions éventuelles (contraste, taille tactile, libellé manquant).

### 2.4 Taille de police à 200 %

_Paramètres → Affichage → Taille de police → maximum._ Reparcourez les écrans : cherchez du **texte tronqué** ou des boutons devenus inutilisables.

### 2.5 Consigner les résultats

Dans `docs/06-accessibilite.md`, remplissez le tableau **§3.2** :

| Écran           | Outil    | Anomalie constatée | Gravité | Correction | Statut |
| --------------- | -------- | ------------------ | ------- | ---------- | ------ |
| _ex. Connexion_ | TalkBack | RAS                | —       | —          | OK     |
| …               | …        | …                  | …       | …          | …      |

Et complétez l'**environnement d'audit** (appareil, version d'Android, version de TalkBack). Écrivez **RAS** là où tout va bien — « aucune anomalie » est un résultat d'audit valide. Pour toute anomalie corrigeable rapidement, corrigez puis notez « corrigée ».

Committez :

```bash
git add docs/06-accessibilite.md
git commit -m "docs: résultats de l'audit d'accessibilité (TalkBack, Scanner)"
```

---

## 3. 🟡 Captures d'écran (renfort C2.2.1 + manuel d'utilisation)

Prenez 10 captures sur l'app (base seedée), pour illustrer le manuel d'utilisation et le prototype.

**Capturer** : _Volume bas + Marche/Arrêt_ simultanément (téléphone), ou l'icône appareil photo de l'émulateur.

Nommez et déposez les fichiers dans `docs/assets/` :

| Fichier                     | Écran                                                | Compte |
| --------------------------- | ---------------------------------------------------- | ------ |
| `01-installation.png`       | Écran de connexion au 1ᵉʳ lancement                  | —      |
| `02-inscription.png`        | Formulaire d'inscription rempli                      | —      |
| `03-connexion.png`          | Écran de connexion rempli                            | —      |
| `04-liste-salles.png`       | Onglet Salles, les 3 studios                         | marie  |
| `05-calendrier.png`         | Détail Studio A, grille de créneaux                  | marie  |
| `06-materiel.png`           | Section « Matériel supplémentaire », une case cochée | marie  |
| `07-mes-reservations.png`   | Onglet Réservations, « À venir »                     | marie  |
| `08-chat.png`               | Chat du Studio A avec messages                       | marie  |
| `09-admin-salles.png`       | Admin, « Salles & matériel »                         | admin  |
| `10-admin-reservations.png` | Admin, « Réservations »                              | admin  |

> ⚠️ N'utilisez **que les comptes de démonstration** (aucune donnée personnelle réelle).

Committez :

```bash
git add docs/assets
git commit -m "docs: captures d'écran de l'application"
```

---

## Récapitulatif — ordre conseillé

1. **Lancez l'app une fois** (section 0) — vous y restez pour tout le reste.
2. **Recette fonctionnelle** (section 1) + **captures** (section 3) en même temps : c'est le même passage dans l'app.
3. **Audit TalkBack** (section 2) — activez-le à la fin, une fois les captures prises (TalkBack change la navigation).
4. Committez au fur et à mesure, puis fusionnez dans `develop` et poussez.

Une fois ces trois points faits, **les 4 compétences éliminatoires du Bloc 2 sont pleinement démontrées** et le rendu est complet.
