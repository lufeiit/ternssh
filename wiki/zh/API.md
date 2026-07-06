> [← README](../../README.md) · [Wiki](../README.md) · [English](../en/Home.md)
>
> [简介](../zh/Home.md) · [功能特性](../zh/Features.md) · [技术栈](../zh/Tech-Stack.md) · [快速开始](../zh/Getting-Started.md) · [部署](../zh/Deployment.md) · [项目结构](../zh/Project-Structure.md) · [系统架构](../zh/Architecture.md) · [小部件](../zh/Widgets.md) · **API** · [数据库](../zh/Database.md) · [设置](../zh/Settings.md) · [安全](../zh/Security.md) · [配置](../zh/Configuration.md) · [路线](../zh/Roadmap.md) · [License](../zh/License.md)

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/me` | 当前用户与认证模式 |
| POST | `/api/v1/me/reset` | 清空用户数据并重置布局 |
| GET/PUT | `/api/v1/dashboards` | 仪表盘与组件布局 |
| POST | `/api/v1/dashboards/reset` | 同 `/me/reset` 的数据库重置 |
| GET | `/api/v1/servers/tree` | 服务器分组树 |
| CRUD | `/api/v1/servers` | 服务器管理 |
| CRUD | `/api/v1/servers/groups` | 分组管理 |
| PUT | `/api/v1/servers/move` | 拖拽排序 |
| GET/POST/DELETE | `/api/v1/saved-passwords` | 已保存密码 vault |
| GET/POST/DELETE | `/api/v1/saved-private-keys` | 已保存私钥 vault |
| POST | `/api/v1/sessions` | 创建 SSH 会话 |
| WS | `/api/v1/sessions/:id/ws` | 终端 WebSocket |
| WS | `/api/v1/sessions/:id/sftp/ws` | SFTP WebSocket |
| GET | `/api/v1/sessions/:id/status` | 远程主机指标采集 |
