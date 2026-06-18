## 2026-06-18 - [SQL] Redundant geometry calculation in UPDATE
**Learning:** Performing multiple expensive PostGIS operations (like `ST_MakeLine` from JSONB arrays) within the same `UPDATE` statement for different columns causes redundant processing. PostgreSQL executes the value expressions for each column separately.
**Action:** Use an `UPDATE ... FROM (SELECT ...)` pattern to pre-calculate expensive geometries once in the subquery and then reference them by name in the `SET` clause.
