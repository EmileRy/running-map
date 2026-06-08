## 2026-06-08 - [SQL] Consolidated GIS backfill computations
**Learning:** PostGIS operations like `ST_MakeLine` from JSONB arrays can be expensive if executed multiple times in the same `UPDATE` statement. PostgreSQL allows using a `FROM` clause in `UPDATE` to pre-calculate values once.
**Action:** Always check if multiple geometric transformations are being performed on the same source data in a single query; consolidate them using CTEs or `FROM` subqueries.
