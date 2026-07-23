# Manuel d'utilisation — SoundProof

> **Compétence visée : C2.4.1** — Guide destiné aux **utilisateurs** de l'application : musiciens (profil _Membre_) et gestionnaires du parc de salles (profil _Administrateur_).

## Sommaire

1. [Installation](#1-installation)
2. [Premiers pas](#2-premiers-pas--créer-son-compte-et-se-connecter)
3. [Guide du membre](#3-guide-du-membre)
4. [Guide de l'administrateur](#4-guide-de-ladministrateur)
5. [Accessibilité](#5-accessibilité)
6. [FAQ](#6-questions-fréquentes)

---

## 1. Installation

SoundProof est distribuée sous forme de fichier **APK** (Android), disponible sur la page des versions du projet.

1. Depuis votre téléphone Android, ouvrir la page **Releases** du dépôt et télécharger le fichier `soundproof-vX.Y.Z.apk` de la dernière version.
2. À l'ouverture du fichier, Android demande l'autorisation d'installer une application provenant d'une source inconnue : accepter en suivant le lien proposé (_Paramètres → Installer des applications inconnues → autoriser le navigateur_).
3. Confirmer l'installation, puis ouvrir **SoundProof**.

> **Prérequis** : Android 7 ou supérieur, et une connexion (Wi-Fi ou données mobiles) permettant de joindre le serveur SoundProof.

![Écran d'accueil de l'application](assets/01-installation.png)

---

## 2. Premiers pas : créer son compte et se connecter

### Créer un compte

Au premier lancement, l'écran de connexion s'affiche. Toucher **« Pas de compte ? S'inscrire »**.

Renseigner : prénom, nom, adresse email et mot de passe (à confirmer).

> 🔒 **Le mot de passe doit contenir au moins 12 caractères, dont une minuscule, une majuscule et un chiffre.** Cette règle protège votre compte ; l'application vous indique précisément ce qui manque si le mot de passe est trop faible.

Toucher **« Créer mon compte »** : vous êtes immédiatement connecté et arrivez sur la liste des salles.

![Écran d'inscription](assets/02-inscription.png)

### Se connecter

Saisir votre email et votre mot de passe, puis **« Se connecter »**.

Si les identifiants sont incorrects, le message « Identifiants invalides » s'affiche — sans préciser lequel des deux est en cause, par sécurité.

![Écran de connexion](assets/03-connexion.png)

### Rester connecté

Vous n'avez **pas besoin de vous reconnecter** à chaque ouverture : votre session est conservée de façon sécurisée sur l'appareil (stockage chiffré du système Android). Elle prend fin lorsque vous vous déconnectez volontairement, ou après une longue période d'inactivité.

### Se repérer dans l'application

Une barre d'onglets en bas d'écran donne accès aux différentes sections :

| Onglet              | Contenu                                                        |
| ------------------- | -------------------------------------------------------------- |
| 🎵 **Salles**       | Liste des salles disponibles et réservation                    |
| 📅 **Réservations** | Vos réservations à venir et passées                            |
| ⚙️ **Admin**        | Gestion du parc — _visible uniquement par les administrateurs_ |
| 👤 **Profil**       | Vos informations et déconnexion                                |

---

## 3. Guide du membre

### 3.1 Consulter les salles

L'onglet **Salles** liste toutes les salles disponibles. Chaque carte indique :

- le **nom** de la salle ;
- sa **capacité** (nombre de musiciens) ;
- son **équipement** (batterie, amplis, micros, table de mixage…).

Tirer la liste vers le bas pour la rafraîchir. Toucher une salle pour en voir le détail et réserver.

![Liste des salles](assets/04-liste-salles.png)

### 3.2 Consulter les disponibilités

L'écran de détail affiche la description de la salle puis un **calendrier hebdomadaire** :

- les flèches **◀ ▶** font défiler les semaines ;
- la bande de jours permet de choisir la journée ;
- la grille présente les créneaux **par tranches de 30 minutes**.

Les créneaux **déjà réservés apparaissent grisés et barrés** : ils ne peuvent pas être sélectionnés. Les créneaux passés le sont également.

![Calendrier des créneaux](assets/05-calendrier.png)

### 3.3 Réserver une salle

1. Choisir la **journée** souhaitée.
2. Toucher l'heure de **début** dans la grille (elle passe en surbrillance).
3. Une section « Fin du créneau » apparaît : choisir l'heure de **fin** parmi les propositions.
4. Vérifier le récapitulatif, puis toucher **« Confirmer la réservation »**.

Un message de confirmation s'affiche et vous êtes redirigé vers vos réservations.

> **Règles à connaître** — une réservation dure **entre 30 minutes et 8 heures**, commence et se termine sur une demi-heure pleine (10:00, 10:30…), et doit se situer dans le futur. Les fins proposées s'arrêtent automatiquement au créneau réservé suivant : impossible de « chevaucher » une réservation existante.

### 3.4 Réserver du matériel

Une fois le créneau choisi, la section **« Matériel supplémentaire »** liste l'équipement de la salle. Cocher les éléments souhaités avant de confirmer.

Le matériel est réservé **pour la durée de votre créneau**. Si un équipement est déjà pris par quelqu'un d'autre sur une période qui recoupe la vôtre, la réservation est refusée avec un message indiquant le matériel concerné : il suffit alors de le décocher ou de choisir un autre créneau.

![Sélection du matériel](assets/06-materiel.png)

### 3.5 Gérer ses réservations

L'onglet **Réservations** présente vos réservations, réparties en deux vues : **À venir** et **Passées**.

Chaque réservation affiche la salle, la date, les horaires et le matériel réservé. Une réservation annulée porte la mention **« Annulée »** — elle reste visible dans l'historique.

![Mes réservations](assets/07-mes-reservations.png)

### 3.6 Annuler une réservation

Sur une réservation **à venir**, toucher **« Annuler »**. Une demande de confirmation s'affiche, rappelant la salle et le créneau : confirmer pour valider.

Le créneau redevient immédiatement disponible pour les autres musiciens.

> Une réservation **déjà commencée ou passée** ne peut plus être annulée : le bouton n'apparaît pas.

### 3.7 Utiliser le chat de la salle

Chaque salle dispose d'une **messagerie instantanée** permettant de se coordonner entre musiciens : échanger un créneau, se prêter du matériel, signaler un problème.

Depuis le détail d'une salle, toucher **« 💬 Chat de la salle »**.

- Les messages arrivent **en temps réel**, sans rafraîchissement.
- Un voyant indique l'état de la connexion : **« En ligne »** ou **« Reconnexion… »**.
- Faire défiler vers le haut charge les messages plus anciens.
- Saisir votre message en bas de l'écran et toucher **➤** pour l'envoyer.

> 🔒 **L'accès au chat d'une salle est réservé aux personnes y ayant une réservation** (passée ou à venir). Sans réservation, un message « Accès réservé » s'affiche.

![Chat de la salle](assets/08-chat.png)

### 3.8 Profil et déconnexion

L'onglet **Profil** affiche votre nom, votre email et votre rôle. Le bouton **« Se déconnecter »** met fin à votre session (avec confirmation) et vous ramène à l'écran de connexion.

---

## 4. Guide de l'administrateur

Les administrateurs disposent d'un onglet supplémentaire, **Admin**, comportant deux sections.

### 4.1 Gérer les salles

Section **« Salles & matériel »** :

| Action                   | Comment                                                                |
| ------------------------ | ---------------------------------------------------------------------- |
| **Créer une salle**      | Bouton « ＋ Nouvelle salle » : renseigner nom, description et capacité |
| **Modifier une salle**   | Bouton « Modifier » sur la carte de la salle                           |
| **Désactiver une salle** | Bouton « Désactiver » puis confirmation                                |

> ℹ️ **La désactivation n'est pas une suppression.** La salle disparaît de la liste consultée par les membres et n'est plus réservable, mais l'historique des réservations et des messages est **intégralement conservé** — indispensable pour la traçabilité.

![Administration des salles](assets/09-admin-salles.png)

### 4.2 Gérer le matériel

Sur la carte d'une salle, toucher **« Matériel »** : la fenêtre liste l'équipement présent.

- **Ajouter** : saisir le nom, choisir une catégorie (amplificateur, batterie, micro, table de mixage, clavier, guitare, basse, autre), puis « Ajouter le matériel ».
- **Désactiver** : bouton « Désactiver » en regard de l'équipement — là encore, l'historique est conservé.

### 4.3 Superviser les réservations

Section **« Réservations »** : la liste de **toutes** les réservations, tous membres confondus, avec le nom du réservant, la salle et le créneau.

Un administrateur peut **annuler n'importe quelle réservation à venir** (bouton « Annuler » + confirmation), par exemple en cas de maintenance imprévue d'une salle.

![Administration des réservations](assets/10-admin-reservations.png)

### 4.4 Accès aux chats

Les administrateurs ont accès au chat de **toutes** les salles, sans avoir besoin d'y réserver — utile pour diffuser une information de gestion.

---

## 5. Accessibilité

SoundProof est conçue pour être utilisable par tous :

- **Lecteurs d'écran** (TalkBack) : tous les éléments interactifs sont nommés, avec leur rôle et leur état (bouton, case cochée, créneau désactivé…) ; les nouveaux messages de chat et les confirmations sont annoncés vocalement.
- **Taille de police** : l'application suit le réglage système, y compris en très grande taille.
- **Contrastes** : les couleurs respectent le niveau AA des recommandations WCAG 2.1.
- **Zones tactiles** généreuses (au moins 44 × 44 points) et **confirmation systématique** avant toute action irréversible.

Le détail figure dans `docs/06-accessibilite.md`.

---

## 6. Questions fréquentes

**Que se passe-t-il si je n'ai pas de connexion Internet ?**
L'application a besoin du réseau pour consulter les salles, réserver et discuter. Sans connexion, un message explicite s'affiche (« Connexion impossible. Vérifiez votre réseau et réessayez ») — l'application ne se ferme pas. Dès le retour du réseau, tirez la liste vers le bas pour actualiser.

**Comment savoir si ma réservation est bien confirmée ?**
Trois signes : un message de confirmation apparaît juste après la validation, la réservation figure dans l'onglet **Réservations → À venir**, et le créneau apparaît désormais grisé dans le calendrier de la salle. En l'absence de ces éléments, la réservation n'a pas abouti.

**Pourquoi mon créneau est-il refusé alors qu'il semblait libre ?**
Deux causes possibles : quelqu'un a réservé ce créneau entre l'affichage de la grille et votre validation (le message précise que le créneau est déjà réservé), ou un **matériel** que vous avez coché est déjà pris sur une période qui recoupe la vôtre (le message nomme l'équipement). Rafraîchissez le calendrier, puis choisissez un autre créneau ou décochez le matériel concerné.

**Puis-je modifier une réservation existante ?**
Pas directement. Annulez la réservation, puis créez-en une nouvelle sur le créneau souhaité. L'annulation libère immédiatement le créneau.

**Jusqu'à quand puis-je annuler ?**
Jusqu'au **début** de la réservation. Une fois le créneau commencé, l'annulation n'est plus possible.

**Pourquoi n'ai-je pas accès au chat d'une salle ?**
Le chat est réservé aux musiciens ayant une réservation dans cette salle — passée ou à venir. Réservez un créneau pour y accéder.

**Mes messages sont-ils visibles par tout le monde ?**
Ils sont visibles par les personnes ayant une réservation dans **cette salle**, ainsi que par les administrateurs. Chaque salle a sa propre conversation, indépendante des autres.

**Je ne vois pas l'onglet Admin, est-ce normal ?**
Oui : il n'apparaît que pour les comptes administrateur. Les comptes créés depuis l'application sont des comptes membres ; seul un administrateur existant peut octroyer ce rôle.

**J'ai oublié mon mot de passe, que faire ?**
La réinitialisation autonome n'est pas encore disponible dans cette version. Contactez un administrateur, qui pourra réinitialiser votre accès.

**Comment mettre à jour l'application ?**
Téléchargez le nouvel APK depuis la page des versions et installez-le par-dessus : vos données et votre session sont conservées. Pensez à vérifier régulièrement la disponibilité d'une nouvelle version.

**Puis-je utiliser SoundProof sur iPhone ?**
L'application est développée pour fonctionner sur Android et iOS, mais seule la version Android est distribuée à ce jour (la publication sur l'App Store nécessite un compte développeur Apple payant).

---

> 📸 **Note sur les captures d'écran** — les images référencées se trouvent dans `docs/assets/`. Elles sont à réaliser depuis l'application installée (APK `preview`) ou l'émulateur, en respectant les noms de fichiers indiqués ci-dessus.
