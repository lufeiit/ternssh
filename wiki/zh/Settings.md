> [← README](../../README.md) · [Wiki](../README.md) · [English](../en/Home.md)
>
> [简介](../zh/Home.md) · [功能特性](../zh/Features.md) · [技术栈](../zh/Tech-Stack.md) · [快速开始](../zh/Getting-Started.md) · [部署](../zh/Deployment.md) · [项目结构](../zh/Project-Structure.md) · [系统架构](../zh/Architecture.md) · [小部件](../zh/Widgets.md) · [API](../zh/API.md) · [数据库](../zh/Database.md) · **设置** · [安全](../zh/Security.md) · [配置](../zh/Configuration.md) · [路线](../zh/Roadmap.md) · [License](../zh/License.md)

## 设置与个性化

在顶栏 **设置** 中可配置：

- **通用**：站点名称、语言、还原所有设置（双重确认）
- **个性化**：外观主题、背景图、组件透明度、布局间距、终端配色

还原所有设置会清除 localStorage 偏好，并调用 `POST /api/v1/me/reset` 清空该用户在 D1 中的服务器、凭据、会话与布局，恢复为初始状态。
