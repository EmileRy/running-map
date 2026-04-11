# Running Map

Application web connectée à Strava qui affiche toutes tes courses GPS sous forme de polylines sur une carte.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- Un compte Strava avec une application API ([créer ici](https://www.strava.com/settings/api))

## Lancement rapide (local)

### 1. Variables d'environnement

Copie le fichier d'exemple et remplis les valeurs :

```bash
cp .env.example .env
```

Variables obligatoires dans `.env` :

```env
STRAVA_CLIENT_ID=ton_client_id
STRAVA_CLIENT_SECRET=ton_client_secret
JWT_SECRET=une_clé_secrète_longue_et_aléatoire
```

> Génère un JWT secret avec : `openssl rand -base64 64`

### 2. Démarrer le stack

```bash
docker compose up --build
```

- Frontend : http://localhost:3000
- Backend  : http://localhost:8080

Au premier lancement, le build Maven télécharge les dépendances — prévoir quelques minutes.

### 3. Arrêter

```bash
docker compose down
```

Les données PostgreSQL sont persistées dans un volume Docker (`postgres_data`). Pour tout effacer :

```bash
docker compose down -v
```

---

## Déploiement sur un serveur distant

Ajoute ces variables supplémentaires dans ton `.env` avant de builder :

```env
NEXT_PUBLIC_API_URL=https://api.tondomaine.com
STRAVA_REDIRECT_URI=https://tondomaine.com/auth/callback
CORS_ALLOWED_ORIGINS=https://tondomaine.com
```

> `NEXT_PUBLIC_API_URL` est intégrée au build du frontend — il faut rebuilder l'image si elle change.

Puis :

```bash
docker compose up --build -d
```

---

## Architecture

```
docker compose up
├── postgres   (port 5432) — PostgreSQL 16 + PostGIS
├── backend    (port 8080) — Spring Boot 3.5 / Java 21
└── frontend   (port 3000) — Next.js 15
```

Le backend applique les migrations Flyway automatiquement au démarrage.
Le frontend attend que le backend soit démarré avant de lancer son conteneur.
