> [← README](../../README.en.md) · [Wiki](../README.md) · [中文](../zh/Home.md)
>
> [Overview](../en/Home.md) · [Features](../en/Features.md) · [Tech Stack](../en/Tech-Stack.md) · [Quick Start](../en/Getting-Started.md) · [Deployment](../en/Deployment.md) · [Project Structure](../en/Project-Structure.md) · [Architecture](../en/Architecture.md) · [Widgets](../en/Widgets.md) · **API** · [Database](../en/Database.md) · [Settings](../en/Settings.md) · [Security](../en/Security.md) · [Configuration](../en/Configuration.md) · [Roadmap](../en/Roadmap.md) · [License](../en/License.md)

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/me` | Current user and auth mode |
| POST | `/api/v1/me/reset` | Clear user data and reset layout |
| GET/PUT | `/api/v1/dashboards` | Dashboard and widget layout |
| POST | `/api/v1/dashboards/reset` | Same database reset as `/me/reset` |
| GET | `/api/v1/servers/tree` | Server group tree |
| CRUD | `/api/v1/servers` | Server management |
| CRUD | `/api/v1/servers/groups` | Group management |
| PUT | `/api/v1/servers/move` | Drag-and-drop ordering |
| GET/POST/DELETE | `/api/v1/saved-passwords` | Saved password vault |
| GET/POST/DELETE | `/api/v1/saved-private-keys` | Saved private-key vault |
| POST | `/api/v1/sessions` | Create SSH session |
| WS | `/api/v1/sessions/:id/ws` | Terminal WebSocket |
| WS | `/api/v1/sessions/:id/sftp/ws` | SFTP WebSocket |
| GET | `/api/v1/sessions/:id/status` | Remote host metrics collection |
