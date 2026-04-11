# Backend — Running Map

Spring Boot 3.5 / Java 21 / PostgreSQL + PostGIS

## Démarrage

```bash
# Lancer la base de données
docker compose up -d

# Démarrer le backend (charge les variables depuis .env)
export $(grep -v '^#' .env | xargs) && ./mvnw spring-boot:run
```

## Import de rues OSM

Les rues sont importées depuis [OpenStreetMap](https://www.openstreetmap.org/) via l'API Overpass et stockées dans la table `osm_streets`. Elles servent à calculer le pourcentage de rues couvertes par zone.

### Importer une zone

L'endpoint est protégé par JWT. Récupère d'abord ton token depuis le cookie `auth_token` (visible dans les DevTools après connexion), puis :

```bash
curl -X POST "http://localhost:8080/api/osm/import?zone=NOM_DE_LA_ZONE" \
  -H "Authorization: Bearer <TOKEN>"
```

Exemples :

```bash
# Une ville
curl -X POST "http://localhost:8080/api/osm/import?zone=Annecy" \
  -H "Authorization: Bearer <TOKEN>"

# Un arrondissement parisien
curl -X POST "http://localhost:8080/api/osm/import?zone=Paris%208e%20Arrondissement" \
  -H "Authorization: Bearer <TOKEN>"
```

Réponse :

```json
{
  "zone": "Annecy",
  "importedStreets": 842
}
```

### Comment ça marche

1. L'endpoint interroge l'API Overpass avec une requête ciblant `admin_level=8` (communes/arrondissements).
2. Les types de voies récupérés : `residential`, `living_street`, `pedestrian`, `footway`, `path`, `cycleway`, `service`, `unclassified`, `tertiary`, `secondary`, `primary`.
3. Chaque way est converti en `LINESTRING` PostGIS (WGS84) et inséré dans `osm_streets`.
4. Les doublons sont ignorés (`ON CONFLICT DO NOTHING`), l'import est donc idempotent.

### Trouver le bon nom de zone

Le nom doit correspondre exactement à celui d'OSM. Pour le vérifier :

1. Ouvrir [Nominatim](https://nominatim.openstreetmap.org/)
2. Chercher la commune souhaitée
3. Utiliser le nom affiché dans le champ **Name** de la relation OSM (niveau admin 8)

### Après l'import

Une fois les rues importées, le calcul de couverture se déclenche automatiquement lors du prochain import Strava. Il est aussi possible de consulter la couverture par zone via :

```bash
# Couverture globale par zone
curl "http://localhost:8080/api/streets/zones" \
  -H "Authorization: Bearer <TOKEN>"

# Détail d'une zone
curl "http://localhost:8080/api/streets/coverage?zone=Annecy" \
  -H "Authorization: Bearer <TOKEN>"
```
