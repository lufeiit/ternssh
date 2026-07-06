> [← README](../../README.en.md) · [Wiki](../README.md) · [中文](../zh/Home.md)
>
> [Overview](../en/Home.md) · [Features](../en/Features.md) · [Tech Stack](../en/Tech-Stack.md) · **Quick Start** · [Deployment](../en/Deployment.md) · [Project Structure](../en/Project-Structure.md) · [Architecture](../en/Architecture.md) · [Widgets](../en/Widgets.md) · [API](../en/API.md) · [Database](../en/Database.md) · [Settings](../en/Settings.md) · [Security](../en/Security.md) · [Configuration](../en/Configuration.md) · [Roadmap](../en/Roadmap.md) · [License](../en/License.md)

## Quick Start

### Requirements

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Local development

```bash
git clone https://github.com/HaradaKashiwa/ternssh.git
cd ternssh
npm install

# Apply D1 migrations (required on first run)
npm run db:migrate:local

# Option A: Split frontend/backend (hot reload)
npm run dev:server   # Workers + static assets, default http://localhost:8787
npm run dev:web      # Vite dev server, proxies /api

# Option B: Integrated preview closer to production
npm run build
npm run dev:server
```
