# mmg-recording-pipeline

Automated post-production pipeline for MM Group Zoom cloud recordings. Ingests a raw `recording.completed` webhook, transcribes via AssemblyAI, removes silences and filler words deterministically, and delivers the edited MP4 to Dropbox.

**See [CLAUDE.md](./CLAUDE.md) for the authoritative architecture, non-goals, data residency rules, and coding conventions.** Read it before modifying anything.

## Local development

Prereqs: Node 20+, Docker, `ngrok` or `cloudflared`.

```bash
cp .env.example .env           # fill in dev values
docker compose up -d db        # local Postgres
npm install
npm run migrate                # apply SQL migrations
npm run dev                    # Express webhook receiver on :3000
```

In a separate terminal:

```bash
ngrok http 3000                # or cloudflared tunnel
# Update the DEV Zoom app's webhook URL to the ngrok URL.
```

Two Zoom apps exist: one for dev (ngrok) and one for prod (`recordings.meetingmindsgroup.com`). Never swap webhook URLs on a single app — it breaks the other environment.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Webhook receiver (tsx watch) |
| `npm run dev:worker` | FFmpeg worker (local) |
| `npm run build` | TypeScript → `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (one-shot) |
| `npm run migrate` | Apply forward-only SQL migrations in `src/db/migrations/` |
| `npm run reconcile` | Pull missed recordings from Zoom (stub, v1.5) |
| `npm run replay` | Manually re-run a failed job (stub) |

## Layout

See `CLAUDE.md` §5. Do not add `apps/` or `packages/` subdirectories — this is a single-service repo.
