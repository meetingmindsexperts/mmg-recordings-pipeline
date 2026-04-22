# infra/

Terraform modules will live here when we move from local-only to a real deployment. Current state: deferred per the scaffold decision (2026-04-22) — local Postgres via `docker-compose.yml` is the only environment for now.

When this directory is populated, the **Decision log** in `CLAUDE.md` §18 must gain an entry naming the IaC tool (Terraform vs CloudFormation) and the choice of DB hosting (Supabase vs RDS). Do not add infra files without that entry.

Expected future layout:

```
infra/
  terraform/
    providers.tf
    s3.tf             # mmg-recordings-bahrain + lifecycle rules (CLAUDE.md §8)
    ec2.tf            # webhook + ffmpeg worker instances
    rds.tf            # or documented Supabase project ID
    iam.tf
    variables.tf
    outputs.tf
```
