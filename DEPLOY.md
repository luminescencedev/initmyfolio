# Déploiement — initmyfolio

**Stack 100 % gratuite : Vercel (web) · Render (API) · Neon (base de données)**

Durée estimée : 45 à 60 minutes.

---

## Sommaire

1. [Comptes à créer](#1-comptes-à-créer)
2. [Cloner le projet](#2-cloner-le-projet)
3. [GitHub OAuth App](#3-github-oauth-app)
4. [Neon — base de données](#4-neon--base-de-données)
5. [Render — API](#5-render--api)
6. [Vercel — frontend](#6-vercel--frontend)
7. [DNS — sous-domaines portfolios](#7-dns--sous-domaines-portfolios)
8. [Vérification finale](#8-vérification-finale)
9. [Déployer une mise à jour](#9-déployer-une-mise-à-jour)
10. [Développement local](#10-développement-local)
11. [Limites du tier gratuit](#11-limites-du-tier-gratuit)

---

## 1. Comptes à créer

Créez ces quatre comptes avant de commencer (tous gratuits) :

| Service | URL | Usage |
|---------|-----|-------|
| GitHub | github.com | Hébergement du code + OAuth |
| Neon | neon.tech | Base de données PostgreSQL |
| Render | render.com | Hébergement de l'API Node.js |
| Vercel | vercel.com | Hébergement du frontend Next.js |

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

Cette app OAuth permet aux utilisateurs de se connecter avec GitHub.

### 3.1 Créer l'app OAuth

1. Sur GitHub, allez dans **Settings** (icône de profil en haut à droite)
2. Dans la colonne gauche, tout en bas → **Developer settings**
3. **OAuth Apps** → **New OAuth App**
4. Remplissez le formulaire :

| Champ | Valeur |
|-------|--------|
| Application name | `initmyfolio` |
| Homepage URL | `https://initmyfolio.com` *(votre domaine)* |
| Authorization callback URL | `https://initmyfolio-api.onrender.com/auth/github/callback` |

> L'URL de callback correspond à l'URL Render de l'API. Vous la mettrez à jour à l'étape 5 si elle diffère.

5. Cliquez **Register application**

### 3.2 Récupérer les credentials

Sur la page de votre OAuth App :
1. Copiez le **Client ID** → notez-le, vous en aurez besoin plusieurs fois
2. Cliquez **Generate a new client secret**
3. Copiez le **Client Secret** immédiatement (il n'est affiché qu'une seule fois)

---

## 4. Neon — base de données

### 4.1 Créer le projet

1. Connectez-vous sur **neon.tech**
2. Cliquez **Create Project**
3. Configurez :
   - **Name** : `initmyfolio`
   - **PostgreSQL version** : 16
   - **Region** : choisissez la région la plus proche de votre serveur Render (ex. `EU Frankfurt` si Render EU)
4. Cliquez **Create Project**

### 4.2 Récupérer les deux URLs de connexion

Neon exige **deux URLs** : une URL poolée pour l'API au runtime, une URL directe pour les migrations.

Dans le dashboard Neon, cliquez **Connection Details** :

**URL poolée (DATABASE_URL) :**
1. Dans le menu déroulant **Connection type**, sélectionnez **Pooled connection**
2. Copiez la connection string → c'est votre `DATABASE_URL`

```
postgresql://neondb_owner:xxxx@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**URL directe (DIRECT_URL) :**
1. Dans le menu déroulant **Connection type**, sélectionnez **Direct connection**
2. Copiez la connection string → c'est votre `DIRECT_URL`

```
postgresql://neondb_owner:xxxx@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

> La différence : la poolée contient `-pooler` dans le hostname, la directe non.

### 4.3 Appliquer le schéma de base de données

Remplissez d'abord votre `.env` local avec les deux URLs Neon :

```dotenv
DATABASE_URL="postgresql://neondb_owner:xxxx@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:xxxx@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

Ensuite, depuis la racine du projet :

```bash
npm run db:push --workspace=@initmyfolio/db
```

Sortie attendue :
```
🚀  Your database is now in sync with your Prisma schema.
```

> Si le port 5432 est bloqué par votre réseau : dans le dashboard Neon, allez dans **SQL Editor**, cliquez **New query** et collez le SQL généré par `npx prisma migrate diff --from-empty --to-schema-datamodel packages/db/prisma/schema.prisma --script`.

---

## 5. Render — API

### 5.1 Créer le service

1. Connectez-vous sur **render.com**
2. Cliquez **New +** → **Web Service**
3. Sélectionnez **Build and deploy from a Git repository**
4. Cliquez **Connect** à côté de votre repo `initmyfolio`

### 5.2 Configurer le service

Sur la page de configuration, remplissez :

| Champ | Valeur |
|-------|--------|
| **Name** | `initmyfolio-api` |
| **Region** | Choisissez la même région que Neon |
| **Branch** | `main` |
| **Root Directory** | *(laisser vide)* |
| **Runtime** | `Node` |
| **Build Command** | `npm ci && npm run db:generate --workspace=@initmyfolio/db && npm run build --workspace=@initmyfolio/api` |
| **Start Command** | `node apps/api/dist/index.js` |
| **Instance Type** | `Free` |

### 5.3 Générer les secrets

Ouvrez un terminal et générez deux secrets aléatoires :

```bash
# JWT_SECRET
openssl rand -hex 32

# INTERNAL_SYNC_KEY
openssl rand -hex 32
```

Copiez les deux valeurs.

### 5.4 Ajouter les variables d'environnement

Descendez jusqu'à la section **Environment Variables** et ajoutez une par une :

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `API_PORT` | `3001` |
| `DATABASE_URL` | *(URL poolée Neon de l'étape 4.2)* |
| `DIRECT_URL` | *(URL directe Neon de l'étape 4.2)* |
| `GITHUB_CLIENT_ID` | *(Client ID de l'étape 3.2)* |
| `GITHUB_CLIENT_SECRET` | *(Client Secret de l'étape 3.2)* |
| `GITHUB_CALLBACK_URL` | `https://initmyfolio-api.onrender.com/auth/github/callback` |
| `CORS_ORIGIN` | `https://initmyfolio.com` *(votre domaine Vercel)* |
| `JWT_SECRET` | *(valeur générée ci-dessus)* |
| `INTERNAL_SYNC_KEY` | *(valeur générée ci-dessus)* |

> `CORS_ORIGIN` doit être l'URL exacte de votre frontend Vercel, sans slash final.

### 5.5 Déployer

Cliquez **Create Web Service**. Render va :
1. Cloner le repo
2. Exécuter le build command (~2-3 minutes)
3. Démarrer le serveur

### 5.6 Récupérer l'URL de l'API

Une fois le déploiement terminé, Render affiche l'URL du service en haut de la page :

```
https://initmyfolio-api.onrender.com
```

Copiez cette URL — vous en aurez besoin pour Vercel.

### 5.7 Mettre à jour la callback URL GitHub

Si l'URL Render diffère de ce que vous avez saisi à l'étape 3 :

1. Retournez sur votre **GitHub OAuth App**
2. Mettez à jour **Authorization callback URL** avec l'URL réelle :
   ```
   https://initmyfolio-api.onrender.com/auth/github/callback
   ```
3. Cliquez **Update application**

Faites la même chose dans les variables d'environnement Render pour `GITHUB_CALLBACK_URL`.

---

## 6. Vercel — frontend

### 6.1 Importer le projet

1. Connectez-vous sur **vercel.com**
2. Cliquez **Add New…** → **Project**
3. Sélectionnez votre repo `initmyfolio` et cliquez **Import**

### 6.2 Configurer le projet

Sur la page de configuration :

1. **Framework Preset** → détecté automatiquement comme `Next.js` ✓
2. Dépliez **Root Directory** → saisissez `apps/web`
3. **Build and Output Settings** → laisser les valeurs par défaut

### 6.3 Ajouter les variables d'environnement

Dépliez la section **Environment Variables** et ajoutez :

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://initmyfolio-api.onrender.com` *(URL Render de l'étape 5.6)* |
| `NEXT_PUBLIC_APP_URL` | `https://initmyfolio.com` *(votre domaine)* |
| `NEXT_PUBLIC_APP_DOMAIN` | `initmyfolio.com` |
| `JWT_SECRET` | *(même valeur que sur Render — identique obligatoire)* |

> `JWT_SECRET` doit être **exactement le même** que sur Render. Les tokens JWT signés par l'API doivent être vérifiables par le endpoint `/api/revalidate` du frontend.

### 6.4 Déployer

Cliquez **Deploy**. Le build prend 1-2 minutes.

### 6.5 Associer votre domaine

1. Dans le projet Vercel, allez dans **Settings** → **Domains**
2. Ajoutez votre domaine : `initmyfolio.com`
3. Ajoutez le wildcard : `*.initmyfolio.com` (pour les portfolios en sous-domaines)
4. Vercel vous indique les enregistrements DNS à créer → passez à l'étape 7

---

## 7. DNS — configuration sur Hostinger

Les portfolios sont accessibles via `username.initmyfolio.com`. Cela nécessite un enregistrement DNS **wildcard** dans le panneau Hostinger.

### 7.1 Ouvrir le gestionnaire DNS

1. Connectez-vous sur **hpanel.hostinger.com**
2. Dans la colonne gauche, cliquez **Domains**
3. Cliquez sur votre domaine (ex. `initmyfolio.com`)
4. Dans le menu du domaine, cliquez sur l'onglet **DNS / Nameservers**
5. Descendez jusqu'à la section **DNS Records**

### 7.2 Supprimer les enregistrements existants qui pourraient conflictuels

Avant d'ajouter les nouveaux records, vérifiez s'il existe déjà des enregistrements `A` ou `CNAME` pour `@`, `www` ou `*`. Si oui, supprimez-les en cliquant l'icône corbeille à droite.

### 7.3 Ajouter les enregistrements Vercel

Cliquez **Add Record** pour chaque ligne du tableau ci-dessous :

**Record 1 — domaine principal**

| Champ | Valeur |
|-------|--------|
| Type | `A` |
| Name | `@` |
| Points to | `76.76.21.21` |
| TTL | `3600` |

**Record 2 — www**

| Champ | Valeur |
|-------|--------|
| Type | `CNAME` |
| Name | `www` |
| Points to | `cname.vercel-dns.com` |
| TTL | `3600` |

**Record 3 — wildcard portfolios** *(le plus important)*

| Champ | Valeur |
|-------|--------|
| Type | `CNAME` |
| Name | `*` |
| Points to | `cname.vercel-dns.com` |
| TTL | `3600` |

> Ce record `*` est ce qui permet à `arthur.initmyfolio.com`, `alice.initmyfolio.com`, etc. de fonctionner. Sans lui, les portfolios en sous-domaines ne répondent pas.

Après chaque record, cliquez **Save** ou **Add**.

### 7.4 Résultat attendu dans Hostinger

La liste DNS doit ressembler à :

```
A       @      →  76.76.21.21
CNAME   www    →  cname.vercel-dns.com
CNAME   *      →  cname.vercel-dns.com
```

### 7.5 Valider dans Vercel

1. Retournez dans votre projet Vercel → **Settings** → **Domains**
2. Vérifiez que `initmyfolio.com` et `*.initmyfolio.com` sont bien listés
3. Attendez la propagation DNS (5 min à 2h en général avec Hostinger)
4. Quand tout est bon, chaque domaine affiche un badge **Valid Configuration** en vert

### 7.6 Vérifier la propagation depuis votre terminal

```bash
# Domaine principal
dig initmyfolio.com A +short
# Doit retourner : 76.76.21.21

# Wildcard — tester avec un faux sous-domaine
dig test.initmyfolio.com CNAME +short
# Doit retourner : cname.vercel-dns.com.
```

Si les commandes `dig` ne sont pas disponibles sur Windows, utilisez [dnschecker.org](https://dnschecker.org) et testez `*.initmyfolio.com`.

---

## 8. Vérification finale

Testez chaque point dans l'ordre.

### 8.1 API health check

```bash
curl https://initmyfolio-api.onrender.com/health
```

Réponse attendue :
```json
{"status":"ok","timestamp":"2026-04-14T..."}
```

> Si la réponse met 30-60 secondes, c'est normal : le service Render gratuit dort après 15 min d'inactivité.

### 8.2 Page d'accueil

Ouvrez `https://initmyfolio.com` dans votre navigateur. La page doit s'afficher.

### 8.3 Connexion GitHub OAuth

1. Cliquez **Sign in with GitHub**
2. Vous êtes redirigé vers GitHub → autorisez l'app
3. Vous revenez sur `/dashboard` avec votre profil chargé
4. Vérifiez que l'URL ne contient **aucun token** (juste `/dashboard`, sans `?token=`)

### 8.4 Portfolio en sous-domaine

Après connexion, ouvrez :
```
https://votre-github-username.initmyfolio.com
```

La page portfolio doit s'afficher.

### 8.5 Sync GitHub

Dans le dashboard, cliquez **Sync GitHub data**. Attendez quelques secondes. Vos repos doivent apparaître.

---

## 9. Déployer une mise à jour

### Code (sans changement de schéma DB)

```bash
git add .
git commit -m "feat: ma modification"
git push origin main
```

Render et Vercel détectent automatiquement le push et redéploient. Pas d'action manuelle.

### Changement de schéma Prisma

```bash
# 1. Modifier packages/db/prisma/schema.prisma

# 2. Régénérer le client Prisma localement
npm run db:generate --workspace=@initmyfolio/db

# 3. Appliquer le schéma sur Neon
npm run db:push --workspace=@initmyfolio/db

# 4. Commiter et pousser
git add .
git commit -m "db: ajouter colonne X"
git push origin main
# → Render et Vercel redéploient automatiquement
```

### Rotation d'un secret

1. Générez une nouvelle valeur : `openssl rand -hex 32`
2. Dans **Render → Environment** : mettez à jour la variable → **Save Changes** → Render redéploie
3. Dans **Vercel → Settings → Environment Variables** : mettez à jour → **Redeploy** depuis l'onglet Deployments

---

## 10. Développement local

### Setup

```bash
# Dépendances
npm install

# Variables d'environnement (remplir avec les valeurs dev)
cp .env.example .env
```

Contenu `.env` pour le dev local :

```dotenv
# GitHub OAuth — créer une 2e OAuth App GitHub avec callback http://localhost:3001/...
GITHUB_CLIENT_ID=<client id de votre app dev>
GITHUB_CLIENT_SECRET=<client secret de votre app dev>
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

JWT_SECRET=<openssl rand -hex 32>
INTERNAL_SYNC_KEY=<openssl rand -hex 32>

# Neon (même base qu'en prod, ou créer une branche Neon dédiée au dev)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

API_PORT=3001
CORS_ORIGIN=http://localhost:3000

NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
```

```bash
# Appliquer le schéma (si pas encore fait)
npm run db:push --workspace=@initmyfolio/db

# Lancer API + Web en parallèle
npm run dev
```

- API : `http://localhost:3001`
- Web : `http://localhost:3000`

### Tester les sous-domaines en local

Ajoutez dans votre fichier `hosts` :

**Linux / Mac** : `/etc/hosts`
**Windows** : `C:\Windows\System32\drivers\etc\hosts`

```
127.0.0.1 votre-username.localhost
```

Ouvrez ensuite `http://votre-username.localhost:3000`.

### Commandes utiles

```bash
# Type-check tout le monorepo
npm run type-check

# Tests API
npm test --workspace=@initmyfolio/api

# Inspecter la base de données
npm run db:studio --workspace=@initmyfolio/db
# → http://localhost:5555

# Formatter le code
npm run format
```

---

## 11. Limites du tier gratuit

### Render — mise en veille automatique

Le service Render gratuit **dort après 15 minutes sans requête**. Le premier appel après une période d'inactivité prend 30 à 60 secondes (cold start).

**Impact sur l'app :**
- La connexion OAuth peut être lente si personne n'a utilisé l'API récemment
- Le cron interne (sync toutes les 8h) ne tourne pas si le service dort

**Workaround gratuit :** Utilisez [UptimeRobot](https://uptimerobot.com) (gratuit, 50 monitors) pour pinger `/health` toutes les 5 minutes :

1. Créez un compte sur uptimerobot.com
2. **Add New Monitor** → type `HTTP(s)`
3. URL : `https://initmyfolio-api.onrender.com/health`
4. Interval : `5 minutes`

Cela maintient le service éveillé en permanence.

### Neon — stockage

Le tier gratuit inclut **0,5 GB de stockage**. Pour une app de portfolio, c'est largement suffisant (chaque utilisateur stocke ~50 KB de données JSON).

### Vercel — bande passante

100 GB/mois sur le tier gratuit (Hobby). Très largement suffisant pour un projet personnel.

---

## Récapitulatif des URLs et variables

| Variable | Où la définir | Source |
|----------|--------------|--------|
| `GITHUB_CLIENT_ID` | Render + Vercel | GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | Render uniquement | GitHub OAuth App |
| `GITHUB_CALLBACK_URL` | Render uniquement | `https://<api-render-url>/auth/github/callback` |
| `JWT_SECRET` | Render **ET** Vercel (même valeur) | `openssl rand -hex 32` |
| `DATABASE_URL` | Render uniquement | Neon → Pooled connection |
| `DIRECT_URL` | Render uniquement | Neon → Direct connection |
| `INTERNAL_SYNC_KEY` | Render uniquement | `openssl rand -hex 32` |
| `CORS_ORIGIN` | Render uniquement | URL de votre app Vercel |
| `NEXT_PUBLIC_API_URL` | Vercel uniquement | URL de votre service Render |
| `NEXT_PUBLIC_APP_URL` | Vercel uniquement | `https://votre-domaine.com` |
| `NEXT_PUBLIC_APP_DOMAIN` | Vercel uniquement | `votre-domaine.com` |
