# Migrations

Forward-only SQL files, numbered `NNN_*.sql`. Applied in lexical order by `scripts/migrate.ts`. A `schema_migrations` tracking table records which files have run. No migration framework in v1 — revisit if we pass ~10 files.

**Rules:**
- Never edit a migration after it has been applied anywhere.
- Never add a down-migration.
- One logical change per file.
