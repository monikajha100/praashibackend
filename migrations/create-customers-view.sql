-- ------------------------------------------------------------------
-- Legacy compatibility view for systems that expect `customers`
-- ------------------------------------------------------------------
-- Several external scripts/tools that were bundled with the project
-- (invoice exporters, CSV generators, etc.) still issue queries
-- against a table named `customers`. Our API, however, only maintains
-- a `users` table. To keep everything in sync and to avoid runtime
-- SQL 1146 errors (table doesn't exist) in production, we expose the
-- same data via a view.
--
-- Run this migration once on every environment (including live) after
-- deploying. It is idempotent and safe to re-run.
-- ------------------------------------------------------------------

CREATE OR REPLACE VIEW `customers` AS
SELECT
  u.id,
  u.name,
  u.email,
  u.phone,
  u.address,
  u.city,
  u.state,
  u.pincode,
  u.role,
  u.is_active,
  u.created_at,
  u.updated_at
FROM users u;


