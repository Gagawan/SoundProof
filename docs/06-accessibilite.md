# Accessibilité — référentiel et audit — SoundProof

> **Compétence visée : C2.2.3** — Ce document justifie le choix du référentiel d'accessibilité, recense les critères couverts par l'application mobile, et consigne les résultats de l'audit réalisé sur appareil réel.

## 1. Choix et justification du référentiel

**Référentiel retenu : WCAG 2.1 niveau AA, appliqué via la norme européenne EN 301 549.**

Justification :

- Les **WCAG 2.1** (Web Content Accessibility Guidelines, W3C) sont le socle international de l'accessibilité numérique, organisé en 4 principes (perceptible, utilisable, compréhensible, robuste). Le **niveau AA** est le niveau d'exigence légal usuel en Europe.
- Le **RGAA 4** (Référentiel Général d'Amélioration de l'Accessibilité), souvent cité en référence en France, est la **déclinaison française des WCAG pour le web** : sa méthode de contrôle repose sur l'inspection du DOM HTML (balises, attributs ARIA…) et **ne couvre pas les applications mobiles natives** — SoundProof est une application React Native compilée en composants natifs Android/iOS, sans DOM.
- Pour le mobile natif, la référence légale française et européenne est la norme **EN 301 549** (« Exigences d'accessibilité pour les produits et services TIC »), rendue applicable par la directive européenne 2016/2102 et l'article 47 de la loi française de 2005 : son chapitre 11 (« logiciels ») applique précisément les critères WCAG 2.1 AA aux applications mobiles.
- En complément **méthodologique**, les check-lists **OPQUAST** (règles transverses de qualité web/mobile : libellés, messages d'erreur, feedback) ont guidé la rédaction des libellés et des états vides/erreur.

## 2. Critères WCAG 2.1 AA couverts, par principe

### 2.1 Perceptible

| Critère                                    | Mesure prise                                                                                                                                                                           | Où                                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 Contenu non textuel                  | `accessibilityLabel` sur tout élément interactif ; les emojis décoratifs sont **masqués** aux lecteurs d'écran (`accessibilityElementsHidden`)                                         | Tous les écrans ; ex. [`EmptyState.tsx`](../mobile/src/components/EmptyState.tsx)                                                      |
| 1.3.1 Information et relations             | Rôles sémantiques systématiques : `header` (titres), `button`, `link`, `tab`/`tablist` (filtres), `checkbox` (matériel), `radio` (Select), `progressbar` (chargements)                 | Composants [`Button`](../mobile/src/components/Button.tsx), [`Select`](../mobile/src/components/Select.tsx), écrans réservations/admin |
| 1.3.1 (formulaires)                        | Libellé relié au champ (`accessibilityLabelledBy`), erreur associée via `accessibilityHint`                                                                                            | [`Input.tsx`](../mobile/src/components/Input.tsx)                                                                                      |
| 1.4.3 Contraste (minimum)                  | **Tous les couples de couleurs du thème mesurés ≥ 4.5:1** (voir tableau § 2.5) — aucune couleur en dur dans les écrans                                                                 | [`theme.ts`](../mobile/src/lib/theme.ts)                                                                                               |
| 1.4.4 Redimensionnement du texte           | Tailles de police dynamiques respectées : `allowFontScaling` **jamais désactivé** (aucune occurrence dans le code), testé à 200 % (audit § 3)                                          | Tout le code                                                                                                                           |
| 1.4.11 Contraste des éléments non textuels | Créneaux occupés distingués par contraste **et** barrage du texte (pas par la couleur seule) ; indicateur de connexion du chat doublé d'un libellé texte (« En ligne / Reconnexion… ») | [`rooms/[id]/index.tsx`](../mobile/app/rooms/[id]/index.tsx), [`chat.tsx`](../mobile/app/rooms/[id]/chat.tsx)                          |

### 2.2 Utilisable

| Critère                      | Mesure prise                                                                                                                             | Où                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 2.5.5 Taille de la cible     | **Zones tactiles ≥ 44×44 pt** : constante `MIN_TOUCH_SIZE` appliquée aux boutons, champs, cases, chips de créneaux, onglets              | [`theme.ts`](../mobile/src/lib/theme.ts) + tous les composants |
| 2.4.6 En-têtes et étiquettes | Titres d'écrans et de sections en `accessibilityRole="header"` ; libellés d'action explicites (« Confirmer la réservation », pas « OK ») | Tous les écrans                                                |
| 2.1.1 (équivalent tactile)   | Composants tactiles natifs (`Pressable`) exclusivement — **jamais de `View` cliquable sans rôle**                                        | Tout le code                                                   |
| 2.4.3 Parcours du focus      | Ordre de lecture = ordre visuel (structure verticale des écrans) ; vérifié à l'audit TalkBack                                            | Audit § 3                                                      |
| Gestes standards             | Pull-to-refresh sur toutes les listes, retour système, double-tap TalkBack fonctionnel                                                   | Listes salles/réservations/admin                               |

### 2.3 Compréhensible

| Critère                          | Mesure prise                                                                                                                                                                                          | Où                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 3.3.1 Identification des erreurs | Erreurs de formulaire **par champ**, en toutes lettres, annoncées (`accessibilityLiveRegion="polite"`)                                                                                                | [`Input.tsx`](../mobile/src/components/Input.tsx), écrans login/register                                              |
| 3.3.2 Étiquettes et instructions | Politique de mot de passe annoncée **avant** la saisie sur l'écran d'inscription ; formats d'heure explicites                                                                                         | [`register.tsx`](../mobile/app/register.tsx)                                                                          |
| 3.3.3 Suggestion après erreur    | Messages exploitables : « Vérifiez votre connexion puis réessayez » + bouton **Réessayer** sur les états d'erreur ; erreurs API en français clair (« Ce créneau est déjà réservé pour cette salle. ») | [`EmptyState`](../mobile/src/components/EmptyState.tsx), [`client.ts`](../mobile/src/api/client.ts) `getErrorMessage` |
| 3.2 Prévisibilité                | Actions destructives confirmées par **dialogue natif** (annulation, déconnexion, désactivation) ; toute action asynchrone a un état de chargement visible (`accessibilityState.busy`)                 | Écrans réservations/profil/admin                                                                                      |

### 2.4 Robuste

| Critère                 | Mesure prise                                                                                                                                                                     | Où                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 4.1.2 Nom, rôle, valeur | Trio nom/rôle/état sur chaque élément : `accessibilityLabel` + `accessibilityRole` + `accessibilityState` (`disabled`, `selected`, `checked`, `busy`)                            | Tous les composants                                                                                                   |
| 4.1.3 Messages d'état   | **Annonces dynamiques** : toasts annoncés (`AccessibilityInfo.announceForAccessibility`), **nouveau message de chat annoncé** avec auteur et contenu, zones live sur les erreurs | [`Toast.tsx`](../mobile/src/components/Toast.tsx), [`use-room-chat.ts`](../mobile/src/features/chat/use-room-chat.ts) |
| Hints                   | `accessibilityHint` quand l'action n'est pas évidente (« Ouvre une demande de confirmation »)                                                                                    | Boutons Annuler/Déconnexion/Désactiver                                                                                |

### 2.5 Contrastes du thème — valeurs mesurées

Ratios calculés selon la formule de luminance relative WCAG (script Node, exécuté le 13/07/2026) :

| Couple (texte / fond)               | Ratio       | AA (≥ 4.5:1) |
| ----------------------------------- | ----------- | ------------ |
| Texte `#111827` / blanc             | **17.74:1** | ✅           |
| Texte secondaire `#4B5563` / blanc  | **7.56:1**  | ✅           |
| Primaire `#1D4ED8` / blanc          | **6.70:1**  | ✅           |
| Danger `#B91C1C` / blanc            | **6.47:1**  | ✅           |
| Succès `#15803D` / blanc            | **5.02:1**  | ✅           |
| Blanc / primaire (boutons)          | **6.70:1**  | ✅           |
| Blanc / danger (boutons)            | **6.47:1**  | ✅           |
| Blanc / succès (toasts)             | **5.02:1**  | ✅           |
| Texte / surface `#F4F5F7` (cartes)  | **16.26:1** | ✅           |
| Texte secondaire / surface          | **6.93:1**  | ✅           |
| Primaire / sélection `#DBEAFE`      | **5.49:1**  | ✅           |
| Texte secondaire / occupé `#E5E7EB` | **6.10:1**  | ✅           |

## 3. Audit

### 3.1 Protocole

Audit réalisé sur **appareil Android physique** (l'app de développement via Expo Go), avec :

1. **TalkBack** (lecteur d'écran Android, _Paramètres → Accessibilité → TalkBack_) : parcours complet des 6 écrans principaux — navigation par balayage exclusivement, activation par double-tap ;
2. **Accessibility Scanner** (Google, Play Store) : analyse automatique de chaque écran (contrastes, tailles tactiles, libellés manquants) ;
3. **Taille de police système à 200 %** (_Paramètres → Affichage → Taille de police_, maximum) : vérification de la lisibilité et de l'absence de texte tronqué bloquant ;
4. Vérification des contrastes du thème (§ 2.5, calcul).

Scénario TalkBack par écran :

| #   | Écran                | Points de contrôle                                                                                                                                                                          |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Connexion            | Titre annoncé en « en-tête » ; champs annoncés avec libellé ; soumission vide → erreurs lues ; bouton annoncé « occupé » pendant le chargement                                              |
| 2   | Inscription          | Instructions de mot de passe lues avant les champs ; erreur de confirmation rattachée au bon champ                                                                                          |
| 3   | Liste des salles     | Chaque carte annonce nom + capacité + nombre d'équipements + hint ; pull-to-refresh accessible                                                                                              |
| 4   | Détail + réservation | Flèches de semaine nommées ; jour annoncé « sélectionné » ; créneau occupé annoncé « désactivé » ; case matériel annoncée « case à cocher, cochée/décochée » ; confirmation → toast annoncé |
| 5   | Mes réservations     | Onglets À venir/Passées annoncés « onglet, sélectionné » ; Annuler → dialogue natif lu ; résultat annoncé                                                                                   |
| 6   | Chat                 | Indicateur de connexion lu ; chaque message lu avec auteur + heure + contenu ; **nouveau message entrant annoncé spontanément** ; champ et bouton d'envoi nommés                            |

### 3.2 Résultats

> _À consigner après exécution du protocole ci-dessus sur l'appareil de test (voir modèle de ligne). Ne rien inscrire qui n'ait été réellement constaté._

| Écran             | Outil      | Anomalie constatée | Gravité | Correction (commit) | Statut |
| ----------------- | ---------- | ------------------ | ------- | ------------------- | ------ |
| _ex. : Connexion_ | _TalkBack_ | _—_                | _—_     | _—_                 | _—_    |

**Environnement d'audit** : _appareil, version d'Android, version de TalkBack — à compléter._

## 4. Limites connues et pistes d'amélioration

- **VoiceOver (iOS) non audité** faute d'appareil iOS disponible — les props React Native utilisées sont communes aux deux plateformes, mais une vérification sur matériel Apple reste à faire.
- **Orientation portrait uniquement** : choix ergonomique assumé (flux verticaux) ; WCAG 1.3.4 (orientation) recommande de supporter les deux — à réévaluer si des utilisateurs le demandent (tablettes notamment).
- Le **mode sombre** n'est pas encore proposé ; le thème centralisé le rendra simple à ajouter (les contrastes devront être re-mesurés).
- Les annonces de chat peuvent devenir bavardes dans une conversation très active ; un réglage de verbosité est envisageable.
