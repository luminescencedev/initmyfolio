# Déploiement VPS — initmyfolio

**Stack : Hetzner VPS · Docker Compose · Nginx · Let's Encrypt · PostgreSQL (self-hosted)**

Coût : **~4–6 €/mois** (Hetzner CX22 ou CAX11) avec zéro dépendance à Vercel/Render.  
Scalable : montez en gamme en un clic dans l'interface Hetzner sans rien reconfigurer.

Durée estimée : 60–90 minutes.

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Créer le VPS Hetzner](#2-créer-le-vps-hetzner)
3. [Sécuriser le serveur](#3-sécuriser-le-serveur)
4. [Installer Docker](#4-installer-docker)
5. [GitHub OAuth App](#5-github-oauth-app)
6. [Configurer le projet sur le VPS](#6-configurer-le-projet-sur-le-vps)
7. [Variables d'environnement et CORS](#7-variables-denvironnement-et-cors)
8. [Nginx — reverse proxy + SSL](#8-nginx--reverse-proxy--ssl)
9. [Lancer l'application](#9-lancer-lapplication)
10. [Appliquer le schéma de base de données](#10-appliquer-le-schéma-de-base-de-données)
11. [DNS — sous-domaines portfolios](#11-dns--sous-domaines-portfolios)
12. [Vérification finale](#12-vérification-finale)
13. [Déployer une mise à jour](#13-déployer-une-mise-à-jour)
14. [Scalabilité — changer de plan Hetzner](#14-scalabilité--changer-de-plan-hetzner)
15. [Sauvegardes](#15-sauvegardes)

---

## 1. Prérequis

- Un domaine enregistré (ex. `initmyfolio.com`) — le DNS doit être gérable par vous
- Un compte [Hetzner Cloud](https://console.hetzner.cloud) (gratuit, facturation à l'usage)
- Git + SSH configurés sur votre machine locale

---

## 2. Créer le VPS Hetzner

### 2.1 Choisir le plan

| Plan      | CPU   | RAM  | Disque | Prix/mois | Usage recommandé    |
| --------- | ----- | ---- | ------ | --------- | ------------------- |
| **CAX11** | 2 ARM | 4 GB | 40 GB  | ~3.90 €   | Démarrage / perso   |
| **CX22**  | 2 x86 | 4 GB | 40 GB  | ~4.15 €   | Alternative x86     |
| **CAX21** | 4 ARM | 8 GB | 80 GB  | ~7.60 €   | Si trafic croissant |

> Commencez par **CAX11**. Si vous saturez la RAM, un resize prend 2 minutes (voir §14).

### 2.2 Créer le serveur

1. Connectez-vous sur [console.hetzner.cloud](https://console.hetzner.cloud)
2. Cliquez **+ Create Server**
3. Configurez :
   - **Location** : Falkenstein (EU) ou Nuremberg — choisir le plus proche de vos utilisateurs
   - **Image** : `Ubuntu 24.04`
   - **Type** : `CAX11` (ou `CX22`)
   - **SSH keys** : ajoutez votre clé publique (`~/.ssh/id_ed25519.pub`). Si vous n'en avez pas : `ssh-keygen -t ed25519`
   - **Firewall** : laisser vide pour l'instant (on configure manuellement ci-dessous)
   - **Name** : `initmyfolio-prod`
4. Cliquez **Create & Buy Now**

Notez l'**adresse IP** du serveur affichée après création (ex. `65.21.x.x`).

---

## 3. Sécuriser le serveur

Connectez-vous au VPS :

```bash
ssh root@<IP_DU_VPS>
```

### 3.1 Mettre à jour le système

```bash
apt update && apt upgrade -y
```

### 3.2 Créer un utilisateur non-root

```bash
adduser deploy
usermod -aG sudo deploy
# Copier la clé SSH autorisée
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3.3 Configurer SSH (désactiver root + mot de passe)

```bash
nano /etc/ssh/sshd_config
```

Modifiez / ajoutez ces lignes :

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
systemctl restart sshd
```

> **Testez depuis un autre terminal** que `ssh deploy@<IP>` fonctionne avant de fermer la session root.

### 3.4 Configurer le pare-feu (UFW)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

Seuls les ports 22 (SSH), 80 (HTTP) et 443 (HTTPS) sont ouverts. Les ports 3000 et 3001 de Docker **ne sont pas exposés directement** — Nginx sert de seul point d'entrée.

Reconnectez-vous en tant que `deploy` pour la suite :

```bash
ssh deploy@<IP_DU_VPS>
```

---

## 4. Installer Docker

```bash
# Installer Docker Engine
curl -fsSL https://get.docker.com | sudo sh

# Ajouter l'utilisateur deploy au groupe docker (évite de taper sudo à chaque fois)
sudo usermod -aG docker deploy

# Appliquer sans se déconnecter
newgrp docker

# Vérifier
docker --version
docker compose version
```

---

## 5. GitHub OAuth App

Créez une OAuth App dédiée à la production.

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Remplissez :

| Champ                      | Valeur                                             |
| -------------------------- | -------------------------------------------------- |
| Application name           | `initmyfolio`                                      |
| Homepage URL               | `https://initmyfolio.com`                          |
| Authorization callback URL | `https://api.initmyfolio.com/auth/github/callback` |

3. Cliquez **Register application**
4. Copiez le **Client ID**
5. Cliquez **Generate a new client secret** — copiez-le immédiatement

> Si vous n'avez pas encore de domaine, vous pouvez mettre l'IP temporairement et mettre à jour après.

---

## 6. Configurer le projet sur le VPS

### 6.1 Cloner le dépôt

```bash
cd /home/deploy
git clone https://github.com/luminescencedev/initmyfolio.git
cd initmyfolio
```

### 6.2 Créer le fichier `.env`

```bash
cp .env.example .env
nano .env
```

Voir §7 pour le contenu exact.

---

## 7. Variables d'environnement et CORS

### 7.1 Contenu complet du `.env`

```dotenv
# === GitHub OAuth ===
GITHUB_CLIENT_ID=<client_id_de_letape_5>
GITHUB_CLIENT_SECRET=<client_secret_de_letape_5>
GITHUB_CALLBACK_URL=https://api.initmyfolio.com/auth/github/callback

# === JWT ===
# Générer : openssl rand -hex 32
JWT_SECRET=<votre_secret_32_chars_minimum>

# === Base de données ===
# Docker Compose crée automatiquement le conteneur PostgreSQL.
# Ces deux variables pointent vers le même conteneur (pas de pooler sur self-hosted).
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@postgres:5432/initmyfolio
DIRECT_URL=postgresql://postgres:<DB_PASSWORD>@postgres:5432/initmyfolio

# === API ===
API_PORT=3001
INTERNAL_SYNC_KEY=<openssl rand -hex 32>

# === CORS — CRITIQUE ===
# Doit être l'URL EXACTE du frontend, sans slash final.
# L'API Hono autorise uniquement cette origine pour les requêtes cross-origin.
# Si vous utilisez un sous-domaine pour l'API (api.initmyfolio.com) et
# le domaine racine pour le frontend (initmyfolio.com), mettez :
CORS_ORIGIN=https://initmyfolio.com

# === Frontend (Next.js) ===
# NEXT_PUBLIC_* sont baked-in au build — doivent être corrects AVANT docker build.
NEXT_PUBLIC_API_URL=https://api.initmyfolio.com
NEXT_PUBLIC_APP_URL=https://initmyfolio.com
NEXT_PUBLIC_APP_DOMAIN=initmyfolio.com

# === Divers ===
NODE_ENV=production
```

Générez les secrets :

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # INTERNAL_SYNC_KEY
openssl rand -hex 32   # DB_PASSWORD (à utiliser dans DATABASE_URL / DIRECT_URL)
```

### 7.2 Comment CORS fonctionne dans ce projet

L'API Hono lit `CORS_ORIGIN` et l'utilise comme filtre dans le middleware :

```
CORS_ORIGIN=https://initmyfolio.com
              ↓
L'API répond aux requêtes cross-origin venant de https://initmyfolio.com
avec Access-Control-Allow-Origin: https://initmyfolio.com
```

**Règles importantes :**

| ✅ Correct                    | ❌ Incorrect                                                     |
| ----------------------------- | ---------------------------------------------------------------- |
| `https://initmyfolio.com`     | `https://initmyfolio.com/` _(slash final)_                       |
| `https://www.initmyfolio.com` | `https://initmyfolio.com, https://www.initmyfolio.com` _(liste)_ |

Si vous voulez autoriser **plusieurs origines** (ex. `www.` et domaine nu), le code dans `apps/api/src/index.ts` accepte une seule valeur dans `CORS_ORIGIN`. Pour en ajouter une seconde, mettez à jour la variable `allowedOrigins` :

```typescript
// apps/api/src/index.ts — si besoin de www + domaine nu
const configuredOrigin = process.env["CORS_ORIGIN"] ?? "http://localhost:3000";
const allowedOrigins = new Set<string>([configuredOrigin]);
if (process.env["NODE_ENV"] !== "production") {
  allowedOrigins.add("http://localhost:3000");
  allowedOrigins.add("http://127.0.0.1:3000");
}
// Ajout optionnel pour accepter www en plus :
const wwwVariant = configuredOrigin.replace("://", "://www.");
allowedOrigins.add(wwwVariant);
```

### 7.3 Adapter le `docker-compose.yml` pour la production

Le `docker-compose.yml` existant expose les ports 3000 et 3001 sur l'hôte. En production, **seul Nginx doit être exposé**. Créez un fichier override :

```bash
nano docker-compose.prod.yml
```

```yaml
version: "3.9"

services:
  postgres:
    ports: [] # Ne plus exposer 5432 sur l'hôte
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  api:
    ports: [] # Nginx atteint l'API via le réseau Docker interne
    environment:
      - CORS_ORIGIN=${CORS_ORIGIN}
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SYNC_KEY=${INTERNAL_SYNC_KEY}

  web:
    ports: [] # Nginx atteint le frontend via le réseau Docker interne
    build:
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
        - NEXT_PUBLIC_APP_DOMAIN=${NEXT_PUBLIC_APP_DOMAIN}

  redis:
    ports: [] # Ne pas exposer Redis sur l'hôte
```

---

## 8. Nginx — reverse proxy + SSL

### 8.1 Installer Nginx et Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 8.2 Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/initmyfolio
```

Collez la configuration suivante (remplacez `initmyfolio.com` par votre domaine) :

```nginx
# -------------------------------------------------------------------
# API  →  api.initmyfolio.com  →  conteneur Docker :3001
# -------------------------------------------------------------------
server {
    listen 80;
    server_name api.initmyfolio.com;
    # Certbot remplira ce bloc après l'étape 8.4
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name api.initmyfolio.com;

    # Certificats Let's Encrypt (créés à l'étape 8.4)
    ssl_certificate     /etc/letsencrypt/live/api.initmyfolio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.initmyfolio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Passe toutes les requêtes vers le conteneur api (réseau Docker)
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

# -------------------------------------------------------------------
# Frontend  →  initmyfolio.com + *.initmyfolio.com  →  conteneur :3000
# -------------------------------------------------------------------
server {
    listen 80;
    server_name initmyfolio.com www.initmyfolio.com *.initmyfolio.com;
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    # Le certificat wildcard couvre *.initmyfolio.com ET initmyfolio.com
    server_name initmyfolio.com www.initmyfolio.com *.initmyfolio.com;

    ssl_certificate     /etc/letsencrypt/live/initmyfolio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/initmyfolio.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

> **Pourquoi `proxy_set_header Host $host` ?**  
> Le middleware `src/proxy.ts` de Next.js lit l'en-tête `Host` pour détecter les sous-domaines (`username.initmyfolio.com`). Sans ce header, tous les sous-domaines arriveraient comme `localhost` et la réécriture `/[username]` ne fonctionnerait pas.

### 8.3 Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/initmyfolio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t   # Doit afficher "syntax is ok"
sudo systemctl reload nginx
```

### 8.4 Obtenir les certificats Let's Encrypt

**Avant de lancer Certbot**, assurez-vous que vos DNS pointent déjà vers l'IP du VPS (voir §11).

```bash
# Certificat pour le domaine principal + www
sudo certbot --nginx -d initmyfolio.com -d www.initmyfolio.com

# Certificat pour l'API
sudo certbot --nginx -d api.initmyfolio.com
```

> Le certificat wildcard (`*.initmyfolio.com`) requiert une validation DNS-01 avec Certbot. Pour simplifier, le frontend Next.js gère les sous-domaines via un `server_name *.initmyfolio.com` dans Nginx avec un certificat **par domaine racine + wildcard** :

```bash
# Pour le certificat wildcard (nécessite plugin DNS, ex. Cloudflare ou challenge manuel)
sudo certbot certonly --manual --preferred-challenges dns \
  -d initmyfolio.com -d "*.initmyfolio.com"
```

Certbot vous demandera d'ajouter un enregistrement TXT `_acme-challenge.initmyfolio.com` dans votre DNS. Suivez les instructions à l'écran, ajoutez la valeur dans Hostinger, attendez ~1 minute et confirmez.

**Renouvellement automatique** (Certbot l'installe par défaut via un timer systemd) :

```bash
sudo certbot renew --dry-run   # Vérifier que l'auto-renouvellement fonctionne
```

### 8.5 Exposer les ports Docker sur l'hôte uniquement en local

Dans le `docker-compose.prod.yml` on retire les ports, mais Nginx doit joindre les conteneurs via `127.0.0.1`. Pour ça, **remettez les ports en écoute localhost seulement** en éditant le `docker-compose.prod.yml` :

```yaml
services:
  api:
    ports:
      - "127.0.0.1:3001:3001" # Accessible uniquement depuis l'hôte, pas Internet
  web:
    ports:
      - "127.0.0.1:3000:3000"
```

Mettez à jour le fichier :

```bash
nano docker-compose.prod.yml
```

Contenu final du `docker-compose.prod.yml` :

```yaml
version: "3.9"

services:
  postgres:
    ports: []
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  redis:
    ports: []

  api:
    ports:
      - "127.0.0.1:3001:3001"
    environment:
      - CORS_ORIGIN=${CORS_ORIGIN}
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_SYNC_KEY=${INTERNAL_SYNC_KEY}

  web:
    ports:
      - "127.0.0.1:3000:3000"
    build:
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
        - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
        - NEXT_PUBLIC_APP_DOMAIN=${NEXT_PUBLIC_APP_DOMAIN}
```

---

## 9. Lancer l'application

### 9.1 Builder et démarrer

```bash
cd /home/deploy/initmyfolio

# Build les images Docker (passe les NEXT_PUBLIC_* au build de Next.js)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Démarrer en arrière-plan
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérifier que tout tourne
docker compose ps
```

Sortie attendue :

```
NAME                   STATUS          PORTS
initmyfolio-db         Up (healthy)
initmyfolio-redis      Up (healthy)
initmyfolio-api        Up              127.0.0.1:3001->3001/tcp
initmyfolio-web        Up              127.0.0.1:3000->3000/tcp
```

### 9.2 Consulter les logs

```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f api
docker compose logs -f web
```

---

## 10. Appliquer le schéma de base de données

Le conteneur PostgreSQL démarre vide. Appliquez le schéma Prisma depuis l'intérieur du conteneur API :

```bash
docker compose exec api node -e "
const { execSync } = require('child_process');
execSync('npx prisma db push --schema=packages/db/prisma/schema.prisma', { stdio: 'inherit' });
"
```

Ou plus simplement, lancez la commande depuis votre machine locale en pointant sur la DB via SSH tunnel :

```bash
# Sur votre machine locale : ouvrir un tunnel SSH vers PostgreSQL
ssh -L 5432:localhost:5432 deploy@<IP_DU_VPS> -N &

# Puis dans un autre terminal, depuis la racine du projet local :
npm run db:push --workspace=@initmyfolio/db
```

Sortie attendue :

```
🚀  Your database is now in sync with your Prisma schema.
```

---

## 11. DNS — sous-domaines portfolios

Configurez ces enregistrements DNS chez votre registrar (Hostinger, etc.) :

| Type | Nom   | Pointe vers   | TTL  |
| ---- | ----- | ------------- | ---- |
| `A`  | `@`   | `<IP_DU_VPS>` | 3600 |
| `A`  | `www` | `<IP_DU_VPS>` | 3600 |
| `A`  | `api` | `<IP_DU_VPS>` | 3600 |
| `A`  | `*`   | `<IP_DU_VPS>` | 3600 |

> Le record `*` (wildcard) est indispensable : il fait que `arthur.initmyfolio.com`, `alice.initmyfolio.com`, etc. arrivent tous sur le VPS. Nginx les transmet au frontend Next.js qui détecte le sous-domaine via `proxy.ts` et affiche la bonne page portfolio.

**Sur Hostinger :**

1. hpanel.hostinger.com → **Domains** → votre domaine → **DNS / Nameservers**
2. Supprimez les éventuels `A` et `CNAME` existants pour `@`, `www`, `*`
3. Ajoutez les quatre enregistrements du tableau ci-dessus
4. Attendez la propagation (5 min à 2h)

**Vérifier la propagation :**

```bash
dig initmyfolio.com A +short        # → votre IP
dig api.initmyfolio.com A +short    # → votre IP
dig test.initmyfolio.com A +short   # → votre IP (wildcard)
```

---

## 12. Vérification finale

### 12.1 Health check API

```bash
curl https://api.initmyfolio.com/health
# {"status":"ok","timestamp":"..."}
```

### 12.2 Headers CORS

```bash
curl -I -X OPTIONS https://api.initmyfolio.com/auth/exchange \
  -H "Origin: https://initmyfolio.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Réponse attendue — les headers suivants doivent être présents :

```
HTTP/2 204
access-control-allow-origin: https://initmyfolio.com
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization
access-control-allow-credentials: true
```

> Si `access-control-allow-origin` est absent : vérifiez que `CORS_ORIGIN` dans `.env` correspond **exactement** à l'origine de la requête (protocole + domaine + pas de slash).

### 12.3 Connexion OAuth

1. Ouvrez `https://initmyfolio.com` → **Sign in with GitHub**
2. GitHub redirige vers `https://api.initmyfolio.com/auth/github/callback`
3. L'API émet un code one-time et redirige vers `https://initmyfolio.com/dashboard?code=...`
4. Le frontend échange le code via `POST https://api.initmyfolio.com/auth/exchange`
5. Vous arrivez sur `/dashboard` avec votre profil chargé

### 12.4 Portfolio en sous-domaine

```
https://votre-github-username.initmyfolio.com
```

La page portfolio doit s'afficher.

---

## 13. Déployer une mise à jour

### 13.1 Sans changement de schéma

```bash
# Sur votre machine locale
git add .
git commit -m "feat: ma modification"
git push origin main

# Sur le VPS
ssh deploy@<IP_DU_VPS>
cd /home/deploy/initmyfolio
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 13.2 Avec changement de schéma Prisma

```bash
# 1. Modifier packages/db/prisma/schema.prisma localement
# 2. Régénérer le client
npm run db:generate --workspace=@initmyfolio/db

# 3. Pousser les changements
git add .
git commit -m "db: ajouter colonne X"
git push origin main

# 4. Sur le VPS
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Appliquer le nouveau schéma sur la DB
ssh -L 5432:localhost:5432 deploy@<IP_DU_VPS> -N &
npm run db:push --workspace=@initmyfolio/db
kill %1   # Fermer le tunnel SSH
```

### 13.3 Script de déploiement (optionnel)

Créez `/home/deploy/deploy.sh` sur le VPS :

```bash
#!/bin/bash
set -e
cd /home/deploy/initmyfolio
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker image prune -f
echo "Déploiement terminé : $(date)"
```

```bash
chmod +x /home/deploy/deploy.sh
```

Depuis votre machine locale :

```bash
ssh deploy@<IP_DU_VPS> /home/deploy/deploy.sh
```

---

## 14. Scalabilité — changer de plan Hetzner

Si votre VPS devient trop petit (CPU à 90 %, swap utilisé) :

1. Hetzner Console → votre serveur → **Actions** → **Resize**
2. Choisissez le plan supérieur (ex. CAX21 → 4 CPU / 8 GB)
3. Confirmez — le serveur redémarre en ~2 minutes, **sans perte de données ni changement d'IP**
4. Reconnectez-vous, relancez Docker Compose si nécessaire

> Aucune reconfiguration DNS ou Nginx n'est nécessaire car l'IP ne change pas.

---

## 15. Sauvegardes

### 15.1 Sauvegardes automatiques Hetzner (recommandé)

Dans la console Hetzner → votre serveur → **Backups** → activer.  
Coût : 20 % du prix du serveur/mois (~0.80 €/mois). Conserve 7 snapshots quotidiens.

### 15.2 Dump PostgreSQL manuel

```bash
# Depuis le VPS
docker compose exec postgres pg_dump -U postgres initmyfolio > backup_$(date +%Y%m%d).sql

# Télécharger sur votre machine locale
scp deploy@<IP_DU_VPS>:/home/deploy/initmyfolio/backup_*.sql ./
```

### 15.3 Dump automatique quotidien (cron)

```bash
crontab -e
```

Ajoutez :

```
0 3 * * * cd /home/deploy/initmyfolio && docker compose exec -T postgres pg_dump -U postgres initmyfolio > /home/deploy/backups/backup_$(date +\%Y\%m\%d).sql && find /home/deploy/backups -name "*.sql" -mtime +7 -delete
```

```bash
mkdir -p /home/deploy/backups
```

---

## Récapitulatif des variables d'environnement

| Variable                 | Valeur sur VPS                                         | Notes                                                      |
| ------------------------ | ------------------------------------------------------ | ---------------------------------------------------------- |
| `GITHUB_CLIENT_ID`       | _(OAuth App)_                                          |                                                            |
| `GITHUB_CLIENT_SECRET`   | _(OAuth App)_                                          |                                                            |
| `GITHUB_CALLBACK_URL`    | `https://api.initmyfolio.com/auth/github/callback`     |                                                            |
| `JWT_SECRET`             | `openssl rand -hex 32`                                 | Même valeur partout                                        |
| `DATABASE_URL`           | `postgresql://postgres:<pw>@postgres:5432/initmyfolio` | Hostname = nom du service Docker                           |
| `DIRECT_URL`             | identique à `DATABASE_URL`                             | Inutile d'avoir un pooler en self-hosted                   |
| `CORS_ORIGIN`            | `https://initmyfolio.com`                              | **Doit correspondre exactement à l'origine du navigateur** |
| `INTERNAL_SYNC_KEY`      | `openssl rand -hex 32`                                 |                                                            |
| `NEXT_PUBLIC_API_URL`    | `https://api.initmyfolio.com`                          | Baked-in au build Docker                                   |
| `NEXT_PUBLIC_APP_URL`    | `https://initmyfolio.com`                              | Baked-in au build Docker                                   |
| `NEXT_PUBLIC_APP_DOMAIN` | `initmyfolio.com`                                      | Baked-in au build Docker                                   |
| `POSTGRES_PASSWORD`      | `openssl rand -hex 16`                                 | Utilisé dans `DATABASE_URL`                                |
