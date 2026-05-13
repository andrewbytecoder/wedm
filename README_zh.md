# WEDM - Wails ETCD 桌面管理器

[English](README.md) | [简体中文](README_zh.md)

![Alt text](/screenshots/etcd-manager.gif?raw=true "ETCD manager")

**WEDM** 是一个免费、跨平台的 [ETCD](http://www.etcd.io) v3 客户端和图形界面工具，基于 **Wails v2**、**Go** 和 **Vue 3** 构建。

本项目的目标是为 Windows、Linux 和 macOS 提供一个高效、现代化的桌面应用程序，覆盖 ETCD 的所有功能。凡是你能够使用 `etcdctl` 完成的操作，都应该能够通过本工具轻松实现。

> **注意：** 本应用目前仅支持 **ETCD V3 API**，不支持 V2 API。

## 🚀 功能特性

- **键值管理**：以树形或列表视图浏览、创建、编辑和删除键。支持实时更新和版本历史记录。
- **租约管理**：列出、查看详细信息以及撤销租约。
- **认证与安全**：
  - 基础认证（用户名/密码）。
  - HTTPS 客户端证书认证 (mTLS)。
  - 支持 HTTP 和安全的 HTTPS 连接。
- **用户与角色管理**：管理用户、角色及细粒度的权限分配。
- **监听器 (Watchers)**：监控键值变化并触发动作（如系统通知、控制台日志）。
- **集群健康检查**：查看成员列表并执行基本的健康状态检查。
- **多配置支持**：保存多个连接配置并轻松切换。
- **跨平台**：得益于 Wails，在 Windows、macOS 和 Linux 上均能提供原生性能体验。

## 🛠️ 技术栈

- **后端**: Go 1.22+
- **前端框架**: Wails v2
- **UI 库**: Vue 3 + TypeScript + Vuetify 3
- **构建工具**: Vite

## 📦 安装说明

### 普通用户
我们为以下平台提供了预编译的二进制文件：
- **Windows**: `.exe` 安装包或便携版。
- **macOS**: `.dmg` 或 `.app`。
- **Linux**: `.deb`, `.rpm` 或 AppImage。

请访问 [Releases](https://github.com/andrewbytecoder/wedm/releases) 页面下载最新稳定版本。

### 开发者 / 贡献者
若要在本地运行本项目，你需要配置 Wails 开发环境。

#### 前置条件
1. **Go**: 版本 1.22 或更高 ([下载 Go](https://go.dev/dl/))。
2. **Node.js**: 推荐使用 LTS 版本 ([下载 Node](https://nodejs.org/))。
3. **Wails CLI**: 通过 Go 安装：
   
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```
4. **系统依赖**: 请参考 [Wails 前置条件指南](https://wails.io/docs/gettingstarted/prerequisites) 安装你操作系统所需的依赖项。

## 💻 运行开发版本

1. **克隆仓库**:
```bash
git clone https://github.com/andrewbytecoder/wedm.git cd wedm
```
2. **安装前端依赖**:

```bash
npm run frontend:install
```   
3. **启动开发模式**:
```bash 
wails dev
```

该命令会同时启动 Go 后端和带有热重载功能的 Vite 前端。

4. **生产环境构建**:
```bash
wails build  
```
编译后的可执行文件将位于 `build/bin` 目录下。

## 📖 使用说明

1. **初始设置**: 首次启动时，请进入 **设置 (Settings)** 页面。
2. **连接配置**: 输入你的 ETCD 集群的 **主机地址 (Host)** 和 **端口 (Port)**。
3. **认证信息**: 如果集群需要认证，请在 **认证 (Auth)** 选项卡下配置用户名/密码或 SSL 证书。
4. **快速帮助**: 在应用中任意位置按下 `Ctrl + H` (Mac 为 `Cmd + H`) 即可打开帮助面板，查看文档和键盘快捷键。

## 🤝 参与贡献

我们欢迎任何形式的贡献！无论是修复 Bug、增加新功能还是翻译，我们都感激你的帮助。

- 在提交 PR 之前，请阅读我们的 [贡献指南](./CONTRIBUTING.md)。
- 如果你想帮助翻译，只需在 `frontend/src/i18n/locales/` 目录下添加新的语言文件即可。

## 🐛 问题反馈与功能建议

- 发现 Bug？请通过 [Issue Tracker](https://github.com/andrewbytecoder/wedm/issues) 报告。
- 有新功能想法？请创建一个 Issue 并标记为 `enhancement`。

## 📄 许可证

本项目遵循 [LICENSE](./LICENSE) 文件中规定的条款进行许可。
