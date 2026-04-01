# Running Map — Plan d'action

Application multi-utilisateurs connectée à Strava qui affiche sur une carte toutes les rues parcourues en courant (segments GPS bruts superposés).

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 / React / TypeScript / Tailwind / Leaflet.js |
| Backend | Spring Boot 3.5 / Java 21 |
| Base de données | PostgreSQL (+ PostGIS à terme) |
| Migration BDD | Flyway |
| Auth | OAuth2 Strava + JWT |
| HTTP client | WebFlux (WebClient) |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Next.js (frontend)                                  │
│  - Page de connexion Strava (OAuth redirect)         │
│  - Page carte (Leaflet + tous les tracés GPS)        │
│  - Barre de progression de l'import                  │
└───────────────────────┬──────────────────────────────┘
                        │ REST/JSON
┌───────────────────────▼──────────────────────────────┐
│  Spring Boot (backend)                               │
│  - Auth OAuth2 Strava + gestion des tokens           │
│  - File d'attente d'import par utilisateur           │
│  - Rate limiter Strava (100 req/15min)               │
│  - API REST pour le frontend                         │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│  PostgreSQL                                          │
│  users / activities / import_jobs                    │
└──────────────────────────────────────────────────────┘
```

---

## Schéma de base de données

**`users`** — un enregistrement par utilisateur Strava connecté
- `id` UUID PK
- `strava_id` BIGINT UNIQUE
- `firstname`, `lastname`, `profile_picture`
- `access_token`, `refresh_token`, `token_expires_at` — tokens Strava (chiffrés)
- `created_at`, `updated_at`

**`activities`** — une ligne par course importée
- `id` UUID PK
- `user_id` UUID FK → users
- `strava_activity_id` BIGINT (unique par user)
- `name`, `start_date`
- `latlng_stream` JSONB — liste de `[lat, lng]`
- `synced_at`

**`import_jobs`** — suivi de la progression de l'import
- `id` UUID PK
- `user_id` UUID FK → users
- `status` ENUM (`PENDING` / `RUNNING` / `DONE` / `ERROR`)
- `total_activities`, `processed_activities`
- `error_message`, `started_at`, `completed_at`, `created_at`

---

## API REST

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/strava` | Redirige vers Strava OAuth |
| `GET` | `/api/auth/callback` | Échange le code, crée la session JWT |
| `GET` | `/api/auth/me` | Infos de l'utilisateur connecté |
| `POST` | `/api/import/start` | Lance l'import en arrière-plan |
| `GET` | `/api/import/status` | Progression de l'import (polling toutes les 5s) |
| `GET` | `/api/tracks` | Retourne tous les latlng streams de l'utilisateur |

---

## Pipeline d'import (Spring @Async)

```
POST /api/import/start
        │
        ▼
 Crée un ImportJob (PENDING)
        │
        ▼  (thread séparé)
 1. GET /athlete/activities?per_page=200 (paginé)
        │   → filtre type = "Run"
        │   → stocke les IDs à traiter
        ▼
 2. Pour chaque activité (file FIFO) :
        │   → GET /activities/{id}/streams?keys=latlng
        │   → stocke le latlng_stream en base
        │   → incrémente ImportJob.processed_activities
        │   → attend si rate limit proche (sliding window 15min)
        ▼
 3. ImportJob → DONE
```

**Rate limiting Strava :** 100 req/15min, 1000 req/jour.
Seuil configuré à 95/15min et 950/jour pour garder une marge.
~300 activités ≈ 45–60 min d'import en tâche de fond.

---

## Phases de développement

### Phase 1 — Setup ✅
- [x] `docker-compose.yml` (PostgreSQL + PostGIS)
- [x] Projet Spring Boot (Web, JPA, Security, WebFlux, JWT, Flyway, Lombok)
- [x] `application.yml` + `.env.example`
- [x] Migration Flyway `V1__init.sql`
- [x] Projet Next.js (TypeScript, Tailwind, App Router, Leaflet)

### Phase 2 — Auth ✅
- [x] Spring Boot : endpoint `GET /api/auth/strava` (redirect OAuth)
- [x] Spring Boot : endpoint `GET /api/auth/callback` (échange du code, stockage token, émission JWT)
- [x] Spring Boot : filtre JWT (`OncePerRequestFilter`) + config Spring Security
- [x] Spring Boot : endpoint `GET /api/auth/me`
- [x] Spring Boot : refresh automatique du token Strava (expire après 6h)
- [x] Next.js : page de login avec bouton "Se connecter avec Strava"
- [x] Next.js : gestion du callback et stockage du JWT

### Phase 3 — Import ✅
- [x] Spring Boot : `StravaApiClient` (WebClient, rate limiter sliding window)
- [x] Spring Boot : `ImportService` avec `@Async` + file FIFO
- [x] Spring Boot : endpoints `/api/import/start` et `/api/import/status`
- [x] Spring Boot : refresh token automatique avant chaque appel Strava
- [x] Next.js : déclenchement de l'import + barre de progression (polling)

### Phase 4 — API tracks ✅
- [x] Spring Boot : endpoint `GET /api/tracks` (retourne les coordonnées compressées)
- [x] Optimisation : pagination ou streaming si > 1000 activités

### Phase 5 — Carte ✅
- [x] Next.js : intégration Leaflet (SSR disabled)
- [x] Next.js : affichage de tous les tracés GPS (polylines)
- [x] Next.js : UX (couleur, opacité, zoom automatique sur les tracks)

### Phase 6 — Polish
- [ ] Gestion des erreurs et retry sur l'import
- [ ] Re-sync partiel (nouvelles activités uniquement)
- [ ] Support multi-utilisateurs (isolation des données)

### Phase 7 — Feature "% de ville exploré" (futur)
- [ ] Installer PostGIS sur le serveur cible
- [ ] Migration `V2__postgis.sql`
- [ ] Import des données de rues via OpenStreetMap (Overpass API)
- [ ] Calcul d'intersection tracés GPS ↔ rues OSM

---

## Points de vigilance

- **Tokens Strava** expirent après 6h — refresh automatique obligatoire
- **Taille des données** : 300 activités × ~1000 points GPS = ~300k coordonnées — le JSON doit être compact
- **Multi-user** : les rate limits Strava sont par token (donc par utilisateur), pas globaux
- **PostGIS** : retiré de la migration initiale (non installé en dev), à réintégrer en Phase 7
