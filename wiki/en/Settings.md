> [← README](../../README.en.md) · [Wiki](../README.md) · [中文](../zh/Home.md)
>
> [Overview](../en/Home.md) · [Features](../en/Features.md) · [Tech Stack](../en/Tech-Stack.md) · [Quick Start](../en/Getting-Started.md) · [Deployment](../en/Deployment.md) · [Project Structure](../en/Project-Structure.md) · [Architecture](../en/Architecture.md) · [Widgets](../en/Widgets.md) · [API](../en/API.md) · [Database](../en/Database.md) · **Settings** · [Security](../en/Security.md) · [Configuration](../en/Configuration.md) · [Roadmap](../en/Roadmap.md) · [License](../en/License.md)

## Settings & Personalization

Configure in the header **Settings**:

- **General**: Site name, language, reset all settings (double confirmation)
- **Personalization**: Theme, background image, widget opacity, layout spacing, terminal colors

Reset all clears localStorage preferences and calls `POST /api/v1/me/reset` to wipe the user's servers, credentials, sessions, and layout in D1, restoring the initial state.
