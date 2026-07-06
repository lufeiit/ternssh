> [← README](../../README.en.md) · [Wiki](../README.md) · [中文](../zh/Home.md)
>
> [Overview](../en/Home.md) · [Features](../en/Features.md) · [Tech Stack](../en/Tech-Stack.md) · [Quick Start](../en/Getting-Started.md) · [Deployment](../en/Deployment.md) · [Project Structure](../en/Project-Structure.md) · [Architecture](../en/Architecture.md) · [Widgets](../en/Widgets.md) · [API](../en/API.md) · [Database](../en/Database.md) · [Settings](../en/Settings.md) · **Security** · [Configuration](../en/Configuration.md) · [Roadmap](../en/Roadmap.md) · [License](../en/License.md)

## Security

- **Open mode** has no application-layer authentication—do not expose sensitive environments on the public internet
- Access mode is a login gate only; all verified requests use the built-in `default` user data
- SSH passwords/keys are stored in D1 `credentials` (per server); vault entries in `saved_passwords` / `saved_private_keys`
- Full-site HTTPS / WSS; DO instances isolated per session

## Authentication

ternssh supports three access modes, switched via environment variables:

| Mode | Description | Best for |
|------|-------------|----------|
| **Open mode** | No auth variables configured | Local dev, private networks |
| **Cloudflare Access** | Zero Trust JWT verification | Cloudflare Workers production |
| **HTTP Basic Auth** | Username + password | Docker, self-hosted, Workers |

Access and Basic Auth can be **enabled together** (Basic Auth first, then Access). Configure variables in the Workers Dashboard or Docker env—**not** in `wrangler.production.jsonc`.

### Open mode

Leave all variables below unset. Anyone can reach the app; all users share the same servers and layout.

### Configure Cloudflare Access

For instances deployed to **Cloudflare Workers**. Access intercepts unauthenticated requests at the edge; after login Cloudflare injects a `Cf-Access-Jwt-Assertion` header that ternssh validates.

#### 1. Create an Access application

1. Open [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Access** → **Applications**
2. Click **Add an application** → choose **Self-hosted**
3. Set an application name (e.g. `ternssh`)
4. Set **Session Duration** as needed
5. Under **Application domain**, enter the exact URL users visit, for example:
   - `ternssh.your-subdomain.workers.dev` (`workers.dev` subdomain)
   - `ssh.example.com` (custom domain)
6. Add a **Policy** (e.g. Allow → Emails ending in `@yourcompany.com`, or One-time PIN)
7. Save the application

> `workers.dev` and custom domains are **separate Application domains**—create one Access app per URL and use matching AUD tags.

#### 2. Get AUD and Team Domain

| Item | Where to find it |
|------|------------------|
| **AUD** | Application details → **Application Audience (AUD) Tag** (64-char hex) |
| **Team Domain** | Zero Trust → **Settings** → **Custom pages** → **Team domain**, e.g. `your-team.cloudflareaccess.com` (**no** `https://`) |

#### 3. Set Worker variables

Cloudflare Dashboard → **Workers & Pages** → your ternssh Worker → **Settings** → **Variables and Secrets**:

| Name | Type | Value |
|------|------|-------|
| `ACCESS_TEAM_DOMAIN` | Variable (plain text) | `your-team.cloudflareaccess.com` |
| `ACCESS_AUD` | Secret (recommended) or Variable | AUD Tag from step 2 |

Changes take effect immediately—no redeploy required.

#### 4. Verify

1. Visit your Worker URL in a browser
2. You should be redirected to the Cloudflare Access login page first
3. After passing the policy, the ternssh dashboard loads

A 401 with `Missing Cf-Access-Jwt-Assertion` usually means the Application domain does not match the URL you visit, or variables are misconfigured.

#### Local development (optional)

Copy `.dev.vars.example` to `.dev.vars`:

```bash
ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
ACCESS_AUD=your-64-char-aud-tag
```

Local `wrangler dev` does not go through the Access login page; you need a valid JWT to test Access mode locally—mainly useful for checking variable format.

### Configure HTTP Basic Auth

Both username and password **must** be set to enable Basic Auth. Browsers show a login prompt on access.

#### Cloudflare Workers

Cloudflare Dashboard → **Workers & Pages** → ternssh → **Settings** → **Variables and Secrets**:

| Name | Type | Value |
|------|------|-------|
| `BASICAUTH_USERNAME` | Variable (plain text) | Your username |
| `BASICAUTH_PASSWORD` | Secret (recommended) | Strong password |

#### Docker

**docker compose** (recommended)—create a `.env` file in the project directory:

```bash
BASICAUTH_USERNAME=admin
BASICAUTH_PASSWORD=your-secure-password
```

```bash
docker compose -f docker-compose.ghcr.yml up -d
# or from source: docker compose up -d --build
```

**docker run**:

```bash
docker run -d \
  --name ternssh \
  -p 8787:8787 \
  -e BASICAUTH_USERNAME=admin \
  -e BASICAUTH_PASSWORD=your-secure-password \
  -v ternssh-data:/app/.wrangler \
  ghcr.io/haradakashiwa/ternssh:latest
```

#### Local development

Copy `.dev.vars.example` to `.dev.vars`:

```bash
BASICAUTH_USERNAME=admin
BASICAUTH_PASSWORD=change-me
```

Run `npm run dev:server`, then visit `http://localhost:8787`—the browser will prompt for credentials.

#### Lockout

**3** failed password attempts from the same IP lock access for **1 hour** (via `CF-Connecting-IP`; cleared on successful login).

### Enable Access + Basic Auth together

Set both variable groups on the Worker. Requests must pass **Basic Auth first, then Access JWT** (browser prompt, then Cloudflare Access login).

Typical use: Basic Auth as an extra layer, Access for identity and policy management.
