# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Running Map is a multi-user web app connected to Strava that displays all GPS-tracked runs as polylines on a Leaflet map. Users authenticate via Strava OAuth2, trigger a background import of their activities, and view the result on a dark map.

## Commands

### Backend (Spring Boot — `backend/`)

```bash
# Démarrer (charge les variables depuis .env)
export $(grep -v '^#' .env | xargs) && ./mvnw spring-boot:run

# Compiler sans lancer
./mvnw compile

# Tests
./mvnw test

# Test unique
./mvnw test -Dtest=MyTestClass#myMethod
```

### Frontend (Next.js — `frontend/`)

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

### Base de données

```bash
docker compose up -d   # Lance PostgreSQL sur le port 5432
```

Le backend applique les migrations Flyway automatiquement au démarrage.

## Architecture

```
running-map/
├── backend/    Spring Boot 3.5 / Java 21
├── frontend/   Next.js 15 / React / TypeScript / Tailwind
└── docker-compose.yml   PostgreSQL 16 + PostGIS
```

### Backend — packages

| Package | Rôle |
|---|---|
| `auth/` | `User` entity, `UserRepository`, `JwtService`, `AuthService` (OAuth flow + token refresh), `AuthController` |
| `config/` | `SecurityConfig` (Spring Security stateless + CORS), `JwtAuthFilter` (OncePerRequestFilter), `StravaProperties`, `JwtProperties`, `AppProperties`, `WebClientConfig` |
| `strava/` | `StravaApiClient` (WebClient + retry 3x), `StravaRateLimiter` (sliding window par user), DTOs |
| `importjob/` | `ImportJob` entity, `ImportService` (@Async), `ImportController` |
| `activity/` | `Activity` entity (latlng_stream JSONB), `ActivityRepository` |
| `tracks/` | `TracksController` — `GET /api/tracks?page=&size=` |

**Flux d'import :**
`POST /api/import/start` → crée un `ImportJob` (PENDING) → `@Async runImportAsync` → fetche les activités Strava (`after=` pour re-sync partiel) → stream GPS par activité → sauvegarde en base → `DONE`.

**Authentification :** JWT dans le header `Authorization: Bearer`. Le filtre `JwtAuthFilter` injecte un `UsernamePasswordAuthenticationToken` avec l'`UUID` utilisateur comme principal. Tous les controllers extraient `(UUID) authentication.getPrincipal()`.

**Rate limiting Strava :** `StravaRateLimiter` maintient une sliding window par utilisateur (95 req/15min, 950 req/jour). Il est thread-safe (synchronized) et bloque (`Thread.sleep`) quand la limite est atteinte.

### Frontend — structure

| Fichier / dossier | Rôle |
|---|---|
| `app/page.tsx` | Login page (redirige vers `/map` si connecté) |
| `app/map/page.tsx` | Server Component : fetch toutes les pages de tracks, rend `MapLayout` |
| `app/auth/callback/route.ts` | Route Handler OAuth : échange le code, pose le cookie `auth_token` httpOnly, redirige vers `/map` |
| `app/api/auth/logout/route.ts` | Supprime le cookie et redirige vers `/` |
| `app/api/import/start/route.ts` | Proxy POST → backend (ajoute le JWT depuis le cookie) |
| `app/api/import/status/route.ts` | Proxy GET → backend |
| `components/MapLayout.tsx` | Client Component : header + menu déroulant (import / logout) + modale import + `MapView` |
| `components/MapView.tsx` | Client Component : `dynamic(LeafletMap, { ssr: false })` |
| `components/LeafletMap.tsx` | Leaflet pur — polylines `#FC4C02`, `fitBounds` automatique, tuiles CartoDB Dark |
| `components/ImportPanel.tsx` | Client Component — bouton import + polling `/api/import/status` toutes les 5s |
| `lib/auth.ts` | `getCurrentUser()` — lit le cookie httpOnly + appelle `/api/auth/me` (Server Components uniquement) |

**Pattern cookie httpOnly :** Le JWT est stocké dans un cookie httpOnly (inaccessible au JavaScript client). Les composants client qui ont besoin d'appeler le backend passent par les proxy routes Next.js (`app/api/import/*/route.ts`) qui lisent le cookie côté serveur et ajoutent le header `Authorization`.

## Configuration notable

- **`strava.max-activities-per-import: 10`** dans `application.yml` — limite de dev, mettre à `0` pour illimité en prod.
- **`jwt.expiration-ms: 86400000`** — JWT valable 24h.
- **`strava.rate-limit`** — seuils configurés à 95/15min et 950/jour (marge sur les 100/1000 de Strava).
- Le `latlng_stream` est stocké en JSONB dans PostgreSQL. Hibernate 6 nécessite `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` sur le champ `ImportJob.status` (type enum PostgreSQL custom).
- `WebClientConfig` fixe le buffer WebClient à 10MB (la réponse Strava pour 200 activités dépasse la limite par défaut de 256KB).

## Gotchas

- **Leaflet + SSR** : Leaflet utilise `window`, il doit être chargé uniquement côté client. Toujours utiliser `dynamic(() => import('./LeafletMap'), { ssr: false })` depuis un Client Component (pas un Server Component).
- **`ssr: false` avec `next/dynamic`** : ne fonctionne que dans des Client Components (`'use client'`).
- **Lombok + `annotationProcessorPaths`** : quand `annotationProcessorPaths` est défini dans le `maven-compiler-plugin`, Lombok doit y être explicitement listé (sinon les getters/setters ne sont pas générés).
- **Re-sync partiel** : `ImportService` récupère la `MAX(startDate)` des activités existantes et passe `after=<epoch>` à l'API Strava pour ne fetcher que les nouvelles courses.
