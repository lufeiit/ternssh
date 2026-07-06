> [← README](../../README.en.md) · [Wiki](../README.md) · [中文](../zh/Home.md)
>
> [Overview](../en/Home.md) · [Features](../en/Features.md) · [Tech Stack](../en/Tech-Stack.md) · [Quick Start](../en/Getting-Started.md) · [Deployment](../en/Deployment.md) · [Project Structure](../en/Project-Structure.md) · [Architecture](../en/Architecture.md) · [Widgets](../en/Widgets.md) · [API](../en/API.md) · [Database](../en/Database.md) · [Settings](../en/Settings.md) · [Security](../en/Security.md) · **Configuration** · [Roadmap](../en/Roadmap.md) · [License](../en/License.md)

## Configuration Reference

- **`wrangler.jsonc`** — local development (`wrangler dev`); **no `vars`** — configure Access only in the dashboard
- **`wrangler.production.jsonc.example`** — production config template
- **`wrangler.production.jsonc`** — your production config (gitignored; copy from template or generate via script); **no `vars`/secrets** so deploys do not overwrite dashboard settings

Example root `wrangler.jsonc`:

```jsonc
{
  "name": "ternssh",
  "main": "server/src/index.ts",
  "assets": {
    "directory": "./server/public",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "ternssh",
    "database_id": "local-ternssh-db",
    "migrations_dir": "server/migrations"
  }],
  "durable_objects": {
    "bindings": [{ "name": "SSH_SESSION", "class_name": "SshSession" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["SshSession"] }]
}
```

Frontend build output goes to `server/public/` (`build.outDir` in `web/vite.config.ts`).
