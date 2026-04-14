# Déploiement — initmyfolio

**Stack 100 % gratuite : Vercel (web) · Render (API) · Neon (base de données)**

Durée estimée : 45 à 60 minutes.

> **Sans nom de domaine** — ce guide fonctionne entièrement avec les URLs gratuites fournies par Vercel (`xxx.vercel.app`) et Render (`xxx.onrender.com`). Les portfolios sont accessibles par chemin : `https://votre-app.vercel.app/username`. Quand vous aurez un domaine, ajoutez-le dans Vercel + configurez le DNS pour passer en sous-domaines — aucun changement de code requis.

---

## Sommaire

1. [Comptes à créer](#1-comptes-à-créer)
2. [Cloner le projet](#2-cloner-le-projet)
3. [GitHub OAuth App](#3-github-oauth-app)
4. [Neon — base de données](#4-neon--base-de-données)
5. [Render — API](#5-render--api)
6. [Vercel — frontend](#6-vercel--frontend)
7. [Vérification finale](#7-vérification-finale)
8. [Déployer une mise à jour](#8-déployer-une-mise-à-jour)
9. [Développement local](#9-développement-local)
10. [Limites du tier gratuit](#10-limites-du-tier-gratuit)
11. [Plus tard — ajouter un nom de domaine](#11-plus-tard--ajouter-un-nom-de-domaine)

---

## 1. Comptes à créer

Créez ces quatre comptes avant de commencer (tous gratuits) :

| Service | URL        | Usage                           |
| ------- | ---------- | ------------------------------- |
| GitHub  | github.com | Hébergement du code + OAuth     |
| Neon    | neon.tech  | Base de données PostgreSQL      |
| Render  | render.com | Hébergement de l'API Node.js    |
| Vercel  | vercel.com | Hébergement du frontend Next.js |

> Connectez Render et Vercel avec votre compte GitHub — ça simplifie le déploiement.

---

## 2. Cloner le projet

Sur votre machine locale :

```bash
git clone https://github.com/<votre-username>/initmyfolio.git
cd initmyfolio
npm install
cp .env.example .env
```

---

## 3. GitHub OAuth App

### 3.1 Créer l'app OAuth

1. Sur GitHub, allez dans **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Remplissez le formulaire :

| Champ                      | Valeur                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Application name           | `initmyfolio`                                                                               |
| Homepage URL               | `https://votre-app.vercel.app` _(à compléter après l'étape 6)_                              |
| Authorization callback URL | `https://initmyfolio-api.onrender.com/auth/github/callback` _(à compléter après l'étape 5)_ |

> Pas de panique si vous ne connaissez pas encore les URLs : créez l'app avec des valeurs provisoires, vous pourrez les mettre à jour après les étapes 5 et 6.

3. Cliquez **Register application**

### 3.2 Récupérer les credentials

1. Copiez le **Client ID**
2. Cliquez **Generate a new client secret** — copiez-le immédiatement (affiché une seule fois)

---

## 4. Neon — base de données

### 4.1 Créer le projet

1. Connectez-vous sur **neon.tech** → **Create Project**
2. Configurez :
   - **Name** : `initmyfolio`
   - **PostgreSQL version** : 16
   - **Region** : même région que votre futur Render (ex. `EU Frankfurt`)
3. Cliquez **Create Project**

### 4.2 Récupérer les deux URLs de connexion

Dans le dashboard Neon → **Connection Details** :

**URL poolée (DATABASE_URL) :** sélectionnez **Pooled connection**

```
postgresql://neondb_owner:xxxx@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**URL directe (DIRECT_URL) :** sélectionnez **Direct connection**

```
postgresql://neondb_owner:xxxx@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> La différence : la poolée contient `-pooler` dans le hostname, la directe non.

### 4.3 Appliquer le schéma

Remplissez votre `.env` local avec les deux URLs Neon puis :

```bash
npm run db:push --workspace=@initmyfolio/db
```

Sortie attendue : `🚀  Your database is now in sync with your Prisma schema.`

> Si le port 5432 est bloqué : dans Neon → **SQL Editor**, collez le SQL généré par `npx prisma migrate diff --from-empty --to-schema-datamodel packages/db/prisma/schema.prisma --script`.

---

## 5. Render — API

### 5.1 Créer le service

1. **render.com** → **New +** → **Web Service**
2. Connectez votre repo `initmyfolio`

### 5.2 Configurer le service

| Champ             | Valeur                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**          | `initmyfolio-api`                                                                                                                     |
| **Region**        | Même région que Neon                                                                                                                  |
| **Branch**        | `main`                                                                                                                                |
| **Runtime**       | `Node`                                                                                                                                |
| **Build Command** | `npm ci --include=dev && npx prisma generate --schema=packages/db/prisma/schema.prisma && npm run build --workspace=@initmyfolio/api` |
| **Start Command** | `node apps/api/dist/index.js`                                                                                                         |
| **Instance Type** | `Free`                                                                                                                                |

### 5.3 Générer les secrets

```bash
openssl rand -hex 32   # → JWT_SECRET
openssl rand -hex 32   # → INTERNAL_SYNC_KEY
```

### 5.4 Ajouter les variables d'environnement

| Key                    | Value                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`             | `production`                                                         |
| `API_PORT`             | `3001`                                                               |
| `DATABASE_URL`         | _(URL poolée Neon)_                                                  |
| `DIRECT_URL`           | _(URL directe Neon)_                                                 |
| `GITHUB_CLIENT_ID`     | _(étape 3.2)_                                                        |
| `GITHUB_CLIENT_SECRET` | _(étape 3.2)_                                                        |
| `GITHUB_CALLBACK_URL`  | `https://initmyfolio-api.onrender.com/auth/github/callback`          |
| `CORS_ORIGIN`          | `https://votre-app.vercel.app` _(à mettre à jour après l'étape 6.4)_ |
| `JWT_SECRET`           | _(valeur générée)_                                                   |
| `INTERNAL_SYNC_KEY`    | _(valeur générée)_                                                   |
| `GITHUB_TOKEN`         | _(PAT GitHub — voir note ci-dessous)_                                |

> **`GITHUB_TOKEN`** — Sans ce token, les syncs GitHub utilisent l'API non-authentifiée (60 req/heure par IP, partagée entre tous les services Render). Avec des utilisateurs qui ont beaucoup de repos, ce quota s'épuise vite → erreur 500 au sync. Pour créer un PAT : GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token** → aucun scope nécessaire (les données de profil public sont accessibles sans scope). Cela monte la limite à 5 000 req/heure.
>
> **`CORS_ORIGIN`** doit être l'URL **exacte** de votre frontend Vercel, **sans slash final**. L'API la compare caractère par caractère avec l'en-tête `Origin` du navigateur — une erreur ici = CORS bloqué = l'app ne fonctionne pas.

### 5.5 Déployer et récupérer l'URL

Cliquez **Create Web Service**. Une fois déployé, notez l'URL :

```
https://initmyfolio-api.onrender.com
```

Retournez sur **GitHub OAuth App** et mettez à jour **Authorization callback URL** avec cette URL.

---

## 6. Vercel — frontend

### 6.1 Importer le projet

1. **vercel.com** → **Add New…** → **Project**
2. Importez votre repo `initmyfolio`
3. **Root Directory** → `apps/web`

### 6.2 Variables d'environnement

| Key                      | Value                                                          |
| ------------------------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`    | `https://initmyfolio-api.onrender.com` _(URL Render)_          |
| `NEXT_PUBLIC_APP_URL`    | `https://votre-app.vercel.app` _(voir note ci-dessous)_        |
| `NEXT_PUBLIC_APP_DOMAIN` | _(laisser vide — sans domaine custom, URLs en chemin)_         |
| `JWT_SECRET`             | _(même valeur que sur Render — **obligatoirement identique**)_ |

> **`NEXT_PUBLIC_APP_DOMAIN` vide** — c'est le signal qui fait que les URLs portfolio utilisent le format chemin (`https://votre-app.vercel.app/username`) au lieu du format sous-domaine. Ne mettez pas `vercel.app` ici.
>
> **URL Vercel inconnue avant le déploiement ?** Mettez une valeur temporaire (`https://localhost:3000`), déployez, puis récupérez la vraie URL dans **Settings → Domains** et revenez la mettre à jour.

### 6.3 Déployer et finaliser

Après le déploiement, notez votre URL `https://votre-app.vercel.app` et :

1. Mettez à jour `NEXT_PUBLIC_APP_URL` dans Vercel avec l'URL réelle
2. Mettez à jour `CORS_ORIGIN` dans Render avec cette même URL
3. Mettez à jour **Homepage URL** dans Github OAuth App
4. Redéployez Render et Vercel pour appliquer les nouvelles variables

---

## 7. Vérification finale

### 7.1 API health check

```bash
curl https://initmyfolio-api.onrender.com/health
# {"status":"ok","timestamp":"..."}
```

> Si ça prend 30-60 s : normal, le service Render gratuit dort après 15 min d'inactivité.

### 7.2 Headers CORS

```bash
curl -I -X OPTIONS https://initmyfolio-api.onrender.com/auth/exchange \
  -H "Origin: https://votre-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Réponse attendue :

```
HTTP/2 204
access-control-allow-origin: https://votre-app.vercel.app
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
```

> Si `access-control-allow-origin` est absent : vérifiez que `CORS_ORIGIN` sur Render correspond exactement à l'origine de la requête (même protocole, même domaine, pas de slash final).

### 7.3 Connexion GitHub OAuth

1. Ouvrez `https://votre-app.vercel.app` → **Sign in with GitHub**
2. Autorisez l'app sur GitHub
3. Vous arrivez sur `/dashboard` avec votre profil chargé

### 7.4 Portfolio

Dans le dashboard, votre URL portfolio est affichée : `https://votre-app.vercel.app/votre-username`. Cliquez dessus — la page portfolio doit s'afficher.

### 7.5 Sync GitHub

Cliquez **Sync GitHub data** dans le dashboard. Vos repos doivent apparaître.

---

## 8. Déployer une mise à jour

### Code (sans changement de schéma DB)

```bash
git add .
git commit -m "feat: ma modification"
git push origin main
```

Render et Vercel redéploient automatiquement.

### Changement de schéma Prisma

```bash
npm run db:generate --workspace=@initmyfolio/db
npm run db:push --workspace=@initmyfolio/db
git add .
git commit -m "db: ajouter colonne X"
git push origin main
```

### Rotation d'un secret

1. `openssl rand -hex 32`
2. Render → Environment → mettre à jour → Save Changes
3. Vercel → Settings → Environment Variables → mettre à jour → Redeploy

---

## 9. Développement local

```dotenv
# .env
GITHUB_CLIENT_ID=<client id app dev>
GITHUB_CLIENT_SECRET=<client secret app dev>
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
JWT_SECRET=<openssl rand -hex 32>
INTERNAL_SYNC_KEY=<openssl rand -hex 32>
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
```

```bash
npm run db:push --workspace=@initmyfolio/db
npm run dev
```

- API : `http://localhost:3001`
- Web : `http://localhost:3000`
- Portfolios : `http://localhost:3000/votre-username`

---

## 10. Limites du tier gratuit

### Render — mise en veille

Le service dort après 15 minutes sans requête (cold start : 30-60 s).

**Workaround :** [UptimeRobot](https://uptimerobot.com) gratuit — pinger `/health` toutes les 5 minutes :

- Monitor type : `HTTP(s)`
- URL : `https://initmyfolio-api.onrender.com/health`
- Interval : `5 minutes`

### Neon — stockage

0,5 GB gratuit. Largement suffisant (~50 KB/utilisateur).

### Vercel — bande passante

100 GB/mois gratuit (Hobby). Largement suffisant.

---

## 11. Plus tard — ajouter un nom de domaine

Quand vous aurez un domaine (ex. `initmyfolio.com`), 4 étapes pour passer en sous-domaines (`username.initmyfolio.com`) **sans changement de code** :

### 11.1 Mettre à jour les variables

**Render :**
| Variable | Nouvelle valeur |
|----------|-----------------|
| `CORS_ORIGIN` | `https://initmyfolio.com` |

**Vercel :**
| Variable | Nouvelle valeur |
|----------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://initmyfolio.com` |
| `NEXT_PUBLIC_APP_DOMAIN` | `initmyfolio.com` |

### 11.2 Associer le domaine dans Vercel

**Settings → Domains** :

1. Ajoutez `initmyfolio.com`
2. Ajoutez `*.initmyfolio.com` (wildcard pour les portfolios)

### 11.3 Configurer le DNS (Hostinger)

| Type    | Nom   | Pointe vers            |
| ------- | ----- | ---------------------- |
| `A`     | `@`   | `76.76.21.21`          |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `CNAME` | `*`   | `cname.vercel-dns.com` |

Le record `*` est essentiel — c'est lui qui dirige `arthur.initmyfolio.com` vers Vercel.

### 11.4 Redéployer

Déclenchez un redéploiement sur Render et Vercel. Les portfolios passent automatiquement en `username.initmyfolio.com`.

---

## Récapitulatif des variables d'environnement

| Variable                 | Où la définir                    | Valeur sans domaine custom                        |
| ------------------------ | -------------------------------- | ------------------------------------------------- |
| `GITHUB_CLIENT_ID`       | Render                           | _(OAuth App)_                                     |
| `GITHUB_CLIENT_SECRET`   | Render                           | _(OAuth App)_                                     |
| `GITHUB_CALLBACK_URL`    | Render                           | `https://<api>.onrender.com/auth/github/callback` |
| `JWT_SECRET`             | Render **ET** Vercel (identique) | `openssl rand -hex 32`                            |
| `DATABASE_URL`           | Render                           | Neon → Pooled connection                          |
| `DIRECT_URL`             | Render                           | Neon → Direct connection                          |
| `INTERNAL_SYNC_KEY`      | Render                           | `openssl rand -hex 32`                            |
| `GITHUB_TOKEN`           | Render                           | PAT GitHub (aucun scope requis)                   |
| `CORS_ORIGIN`            | Render                           | `https://votre-app.vercel.app`                    |
| `NEXT_PUBLIC_API_URL`    | Vercel                           | `https://<api>.onrender.com`                      |
| `NEXT_PUBLIC_APP_URL`    | Vercel                           | `https://votre-app.vercel.app`                    |
| `NEXT_PUBLIC_APP_DOMAIN` | Vercel                           | _(laisser vide)_                                  |
