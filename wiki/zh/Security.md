> [← README](../../README.md) · [Wiki](../README.md) · [English](../en/Home.md)
>
> [简介](../zh/Home.md) · [功能特性](../zh/Features.md) · [技术栈](../zh/Tech-Stack.md) · [快速开始](../zh/Getting-Started.md) · [部署](../zh/Deployment.md) · [项目结构](../zh/Project-Structure.md) · [系统架构](../zh/Architecture.md) · [小部件](../zh/Widgets.md) · [API](../zh/API.md) · [数据库](../zh/Database.md) · [设置](../zh/Settings.md) · **安全** · [配置](../zh/Configuration.md) · [路线](../zh/Roadmap.md) · [License](../zh/License.md)

## 安全说明

- **开放模式**无应用层认证，请勿在公网暴露敏感环境
- Access 模式仅作登录门禁，所有通过校验的请求使用内置用户 `default` 的数据
- SSH 密码/私钥存于 D1 `credentials` 表（按服务器引用）；vault 条目存于 `saved_passwords` / `saved_private_keys`
- 全站 HTTPS / WSS；DO 实例按 session 隔离

## 鉴权

ternssh 提供三种访问模式，通过环境变量切换：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **开放模式** | 不配置任何认证变量 | 本地开发、内网部署 |
| **Cloudflare Access** | Zero Trust JWT 校验 | Cloudflare Workers 生产部署 |
| **HTTP Basic Auth** | 用户名 + 密码 | Docker、自托管、Workers |

Access 与 Basic Auth **可同时启用**（需先通过 Basic Auth，再通过 Access）。变量**不要**写进 `wrangler.production.jsonc`，在 Workers Dashboard 或 Docker 环境变量中配置。

### 开放模式

不设置下方任何变量即可。任何人可访问应用，所有用户共享同一套服务器与布局数据。

### 配置 Cloudflare Access

适用于已部署到 **Cloudflare Workers** 的实例。Access 在 Cloudflare 边缘拦截未登录请求，登录成功后 Cloudflare 会向 Worker 注入 `Cf-Access-Jwt-Assertion` 头，ternssh 据此校验 JWT。

#### 1. 创建 Access 应用

1. 打开 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Access** → **Applications**
2. 点击 **Add an application** → 选择 **Self-hosted**
3. 填写应用名称（如 `ternssh`）
4. **Session Duration** 按需设置
5. 在 **Application domain** 中填写实际访问域名，必须与用户浏览器地址栏一致，例如：
   - `ternssh.your-subdomain.workers.dev`（`workers.dev` 子域）
   - `ssh.example.com`（自定义域名）
6. 添加 **Policy**（如 Allow → Emails ending in `@yourcompany.com`，或 One-time PIN）
7. 保存应用

> `workers.dev` 与自定义域名是**不同的 Application domain**，需分别创建 Access 应用并分别配置 AUD。

#### 2. 获取 AUD 与 Team Domain

| 项 | 获取方式 |
|----|----------|
| **AUD** | Access 应用详情页 → **Application Audience (AUD) Tag**（64 位 hex） |
| **Team Domain** | Zero Trust → **Settings** → **Custom pages** → **Team domain**，形如 `your-team.cloudflareaccess.com`（**不要**加 `https://`） |

#### 3. 配置 Worker 变量

Cloudflare Dashboard → **Workers & Pages** → 选择 ternssh Worker → **Settings** → **Variables and Secrets**：

| 名称 | 类型 | 值 |
|------|------|-----|
| `ACCESS_TEAM_DOMAIN` | Variable（明文） | `your-team.cloudflareaccess.com` |
| `ACCESS_AUD` | Secret（推荐）或 Variable | 上一步复制的 AUD Tag |

保存后立即生效，无需重新部署。

#### 4. 验证

1. 在浏览器访问 Worker 地址
2. 应先跳转到 Cloudflare Access 登录页
3. 通过策略校验后进入 ternssh 仪表盘

若返回 401 且提示 `Missing Cf-Access-Jwt-Assertion`，通常是 Application domain 与访问 URL 不匹配，或变量未正确设置。

#### 本地开发（可选）

复制 `.dev.vars.example` 为 `.dev.vars` 并填入：

```bash
ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
ACCESS_AUD=your-64-char-aud-tag
```

本地 `wrangler dev` 不会自动经过 Access 登录页；需自行携带有效 JWT 才能测试 Access 模式，一般仅用于验证变量格式。

### 配置 HTTP Basic Auth

用户名与密码**必须同时设置**才会启用。浏览器访问时会弹出登录框。

#### Cloudflare Workers

Cloudflare Dashboard → **Workers & Pages** → ternssh → **Settings** → **Variables and Secrets**：

| 名称 | 类型 | 值 |
|------|------|-----|
| `BASICAUTH_USERNAME` | Variable（明文） | 自定义用户名 |
| `BASICAUTH_PASSWORD` | Secret（推荐） | 强密码 |

#### Docker

**docker compose**（推荐）—— 在项目目录创建 `.env`：

```bash
BASICAUTH_USERNAME=admin
BASICAUTH_PASSWORD=your-secure-password
```

```bash
docker compose -f docker-compose.ghcr.yml up -d
# 或从源码：docker compose up -d --build
```

**docker run**：

```bash
docker run -d \
  --name ternssh \
  -p 8787:8787 \
  -e BASICAUTH_USERNAME=admin \
  -e BASICAUTH_PASSWORD=your-secure-password \
  -v ternssh-data:/app/.wrangler \
  ghcr.io/haradakashiwa/ternssh:latest
```

#### 本地开发

复制 `.dev.vars.example` 为 `.dev.vars`：

```bash
BASICAUTH_USERNAME=admin
BASICAUTH_PASSWORD=change-me
```

运行 `npm run dev:server` 后，访问 `http://localhost:8787` 会提示输入用户名和密码。

#### 失败锁定

同一 IP 密码错误 **3 次**将锁定 **1 小时**（按 `CF-Connecting-IP` 识别；登录成功后清零）。

### 同时启用 Access + Basic Auth

在 Workers 上同时配置上述两组变量。请求需**先通过 Basic Auth，再通过 Access JWT**（先浏览器弹窗，再 Cloudflare Access 登录页）。

典型场景：Basic Auth 作为额外防护层，Access 提供身份与策略管理。
