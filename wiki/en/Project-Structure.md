> [← README](../../README.en.md) · [Wiki](../README.md) · [中文](../zh/Home.md)
>
> [Overview](../en/Home.md) · [Features](../en/Features.md) · [Tech Stack](../en/Tech-Stack.md) · [Quick Start](../en/Getting-Started.md) · [Deployment](../en/Deployment.md) · **Project Structure** · [Architecture](../en/Architecture.md) · [Widgets](../en/Widgets.md) · [API](../en/API.md) · [Database](../en/Database.md) · [Settings](../en/Settings.md) · [Security](../en/Security.md) · [Configuration](../en/Configuration.md) · [Roadmap](../en/Roadmap.md) · [License](../en/License.md)

## Project Structure

```
ternssh/
├── web/                    # Frontend (React + Vite)
│   ├── public/logo-light.png     # Logo (light)
│   ├── public/logo-dark.png      # Logo (dark)
│   ├── public/logo.png           # Logo source
│   ├── public/favicon-light.png  # Favicon (light)
│   ├── public/favicon-dark.png   # Favicon (dark)
│   └── src/
│       ├── components/     # UI, settings, credential fields, CodeEditor
│       ├── dashboard/      # Grid layout, dialogs
│       ├── widgets/        # Terminal, file manager, monitoring widgets
│       ├── i18n/           # Chinese / English
│       ├── lib/            # API client, sessions, SFTP
│       └── theme/          # Theme and personalization
├── server/                 # Cloudflare Workers backend
│   ├── src/
│   │   ├── routes/         # HTTP routes
│   │   ├── do/             # Durable Objects (SSH sessions)
│   │   ├── db/             # D1 queries
│   │   ├── ssh/            # SSH / SFTP protocol implementation
│   │   └── auth/           # Access JWT / default user
│   └── migrations/         # D1 database migrations
└── wrangler.jsonc          # Workers / D1 / DO config
```
