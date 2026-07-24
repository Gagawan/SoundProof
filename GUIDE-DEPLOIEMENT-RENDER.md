# Guide de déploiement de l'API sur Render + rebuild de l'APK

Objectif : rendre l'API **joignable depuis Internet en HTTPS** pour que le jury puisse installer l'APK et l'utiliser **en autonomie**, puis reconstruire l'APK avec cette adresse.

Durée : ~30-45 min. Coût : **gratuit**.

> **Principe** : on héberge la base PostgreSQL et l'API sur Render (qui construit l'image à partir de votre dépôt GitHub et fournit HTTPS automatiquement), on charge les données de démo, puis on rebâtit l'APK pointant vers l'URL Render.

---

## Prérequis

- Votre code est poussé sur GitHub (c'est le cas).
- Vous avez un compte Expo et la CLI EAS fonctionne (déjà utilisée pour la v1.0.0).
- Node.js installé sur votre machine (pour lancer le seed).

---

## Étape 0 — Créer un compte Render

1. Aller sur **https://render.com** → **Get Started**.
2. Choisir **Sign in with GitHub** (le plus simple : Render pourra lire votre dépôt).
3. Autoriser Render à accéder à votre compte GitHub (vous pourrez limiter au seul dépôt `SoundProof`).

---

## Étape 1 — Créer la base de données PostgreSQL

1. Dans le dashboard Render : bouton **New +** → **PostgreSQL**.
2. Renseigner :
   - **Name** : `soundproof-db`
   - **Database** : `soundproof`
   - **User** : `soundproof` (ou laisser par défaut)
   - **Region** : choisir **Frankfurt** (proche de vous — et à **réutiliser à l'identique** pour l'API à l'étape 2).
   - **Plan** : **Free**.
3. Cliquer **Create Database**. Attendre que le statut passe à **Available** (~1 min).
4. Sur la page de la base, repérer la section **Connections**. Vous y trouverez :
   - **Internal Database URL** : à utiliser par l'API (même région) — **pas de SSL à gérer**.
   - **External Database URL** : à utiliser depuis **votre machine** pour le seed (étape 5).

   Gardez ces deux URL sous la main (bouton copier). Elles ressemblent à :
   `postgresql://soundproof:MOTDEPASSE@dpg-xxxx/soundproof`

---

## Étape 2 — Créer le service web (l'API)

1. Dashboard Render : **New +** → **Web Service**.
2. **Connecter le dépôt** : sélectionner votre dépôt **`Gagawan/SoundProof`** (si absent, cliquer « Configure account » pour donner accès au dépôt).
3. Configurer :
   - **Name** : `soundproof-api`
   - **Region** : **la même que la base** (Frankfurt).
   - **Branch** : `main`
   - **Root Directory** : **`backend`** ⚠️ (important : le Dockerfile est dans `backend/`)
   - **Runtime / Language** : Render détecte automatiquement le **Dockerfile** → laisser **Docker**.
   - **Instance Type** : **Free**.
4. **Ne pas encore cliquer Create** — d'abord les variables d'environnement (étape 3, sur la même page, section **Environment Variables**).

---

## Étape 3 — Variables d'environnement

Dans la section **Environment Variables** du service, ajouter ces 4 variables :

| Clé                  | Valeur                                           |
| -------------------- | ------------------------------------------------ |
| `DATABASE_URL`       | L'**Internal Database URL** copiée à l'étape 1.4 |
| `NODE_ENV`           | `production`                                     |
| `JWT_ACCESS_SECRET`  | une longue chaîne aléatoire (voir ci-dessous)    |
| `JWT_REFRESH_SECRET` | une **autre** longue chaîne aléatoire            |

> ⚠️ Ne **pas** définir `PORT` : Render le fournit automatiquement, et l'API le lit déjà (`process.env.PORT`).

**Générer les deux secrets** — dans un terminal sur votre machine :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Lancez-le **deux fois**, copiez chaque résultat dans `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET`.

**(Optionnel) Health check** : dans les réglages avancés, mettre **Health Check Path** = `/api/v1/health`.

Cliquer enfin **Create Web Service**.

---

## Étape 4 — Premier déploiement et vérification

1. Render construit l'image Docker à partir de votre `backend/Dockerfile` (plusieurs minutes la première fois — la compilation d'argon2 prend un peu de temps). Suivez les **Logs**.
2. Au démarrage, l'entrypoint applique **automatiquement les migrations Prisma** (`prisma migrate deploy`). Vous devez voir dans les logs : _« Application des migrations Prisma… »_ puis le démarrage de Nest.
3. Quand le statut passe à **Live**, Render affiche l'URL publique en haut de la page, du type :
   **`https://soundproof-api.onrender.com`**
4. **Tester** depuis votre navigateur ou un terminal :
   ```bash
   curl https://soundproof-api.onrender.com/api/v1/health
   ```
   Attendu : `{"status":"ok",...,"database":{"status":"up"}}`.

> Si `database` est `down` : vérifiez que `DATABASE_URL` est bien l'**Internal URL** et que la base est dans la **même région**.

---

## Étape 5 — Charger les données de démo (seed)

La base est vide : il faut créer les comptes de démonstration (`admin@…`, `marie@…`). On lance le seed **depuis votre machine**, en pointant sur l'**External Database URL**.

> ⚠️ Le seed **efface** puis remplit les tables : à ne faire **qu'une fois**, sur cette base de démo.

Dans un terminal :

```bash
cd C:\Users\gagaw\Documents\Travail\SoundProof\backend

# Remplacez par votre EXTERNAL Database URL (étape 1.4).
# Ajoutez ?sslmode=require à la fin si l'URL ne le contient pas déjà.
DATABASE_URL="postgresql://soundproof:MOTDEPASSE@dpg-xxxx.frankfurt-postgres.render.com/soundproof?sslmode=require" npx prisma db seed
```

Attendu : le message « Seed terminé : 4 utilisateurs… 3 salles… ».

Vérifiez ensuite que l'API renvoie bien les salles (après connexion) — ou simplement que `/api/v1/health` répond toujours.

---

## Étape 6 — Reconstruire l'APK avec l'URL Render

1. Modifier `mobile/eas.json` : dans le profil **`preview`**, remplacer l'URL fictive par votre URL Render.

   Cherchez :

   ```json
   "preview": {
     "distribution": "internal",
     "android": { "buildType": "apk" },
     "env": { "EXPO_PUBLIC_API_URL": "https://api-demo.soundproof.example" }
   }
   ```

   Remplacez la valeur par :

   ```json
       "env": { "EXPO_PUBLIC_API_URL": "https://soundproof-api.onrender.com" }
   ```

2. Lancer le build :

   ```bash
   cd C:\Users\gagaw\Documents\Travail\SoundProof\mobile
   eas build --platform android --profile preview
   ```

   (~10-20 min sur les serveurs Expo.)

3. À la fin, EAS affiche un **lien de téléchargement** + un **QR code**. Téléchargez l'APK, installez-le sur votre téléphone et **testez** : connexion avec `marie@soundproof.fr` / `SoundProof2026!` → la liste des salles doit s'afficher (données venant de Render).

> 💡 Le **premier** appel après une période d'inactivité peut mettre **~1 minute** : sur l'offre gratuite, Render met l'API en veille après 15 min sans trafic, puis la redémarre à la première requête. C'est normal.

---

## Étape 7 — Fournir l'APK au jury

- **Committez** la mise à jour de `eas.json** :
  ```bash
  cd C:\Users\gagaw\Documents\Travail\SoundProof
  git switch develop && git switch -c chore/api-demo-url
  git add mobile/eas.json
  git commit -m "chore(mobile): pointe l'APK preview vers l'API de démonstration Render"
  git switch develop && git merge --no-ff chore/api-demo-url && git push origin develop
  ```
- **Distribuez l'APK** : soit le lien de build EAS, soit attachez le `.apk` à la **GitHub Release**, soit joignez-le au dossier remis.
- **Indiquez au jury** dans le dossier / la remise :
  > « Application installable (APK). Elle se connecte à une API de démonstration hébergée. Comptes de test : `admin@soundproof.fr` (administrateur) ou `marie@soundproof.fr` (membre), mot de passe `SoundProof2026!`. Le premier écran peut mettre ~1 minute à charger (réveil du serveur). »

---

## Dépannage

| Symptôme                                                      | Cause probable                                      | Solution                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Build Render échoue sur `npm ci` / argon2                     | Compilation native longue                           | Relancer le déploiement ; vérifier que **Root Directory** = `backend`        |
| `/health` → `database: down`                                  | Mauvaise `DATABASE_URL` ou région différente        | Utiliser l'**Internal URL** ; base et API dans la **même région**            |
| Seed : erreur SSL                                             | URL externe sans SSL                                | Ajouter `?sslmode=require` à la fin de l'External URL                        |
| L'app affiche « Connexion impossible »                        | APK pas encore rebâti, ou URL erronée dans eas.json | Vérifier `eas.json` puis **rebuild** ; tester `curl https://…/api/v1/health` |
| Connexion « Identifiants invalides » avec un bon mot de passe | Base pas seedée                                     | Relancer l'étape 5 (seed)                                                    |
| Premier chargement très lent (~1 min)                         | Réveil de l'instance gratuite                       | Normal ; le signaler au jury                                                 |
| « Identifiants invalides » après un moment                    | Le seed a été relancé et a purgé les données        | Ne pas relancer le seed ; recréer un compte via l'app si besoin              |

---

## Récapitulatif express

1. Render → **New PostgreSQL** (Free, région Frankfurt) → copier Internal + External URL.
2. Render → **New Web Service** → dépôt SoundProof, Root Directory `backend`, Docker, Free.
3. Variables : `DATABASE_URL` (internal), `NODE_ENV=production`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
4. Déployer → vérifier `curl https://…/api/v1/health`.
5. Seed depuis votre machine avec l'External URL (une seule fois).
6. `eas.json` → mettre l'URL Render dans le profil `preview` → `eas build`.
7. Distribuer l'APK + comptes de test + note sur le démarrage à froid.
