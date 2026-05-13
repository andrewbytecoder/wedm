# WEDM - Wails ETCD Desktop Manager

[English](README.md) | [简体中文](README_zh.md)

![Alt text](/screenshots/etcd-manager.gif?raw=true "ETCD manager")

**WEDM** is a free, cross-platform [ETCD](http://www.etcd.io) v3 client and GUI built with **Wails v2**, **Go**, and **Vue 3**. 

The goal of the project is to provide an efficient, modern desktop application for Windows, Linux, and macOS that covers all ETCD functionality. Anything you can do with `etcdctl`, you should be able to do with this tool as well.

> **Note:** This application currently supports **ETCD V3 API only**. V2 API is not supported.

## 🚀 Features

- **Key Management**: Browse, create, edit, delete keys with tree or list views. Supports live updates and revision history.
- **Lease Management**: List, view details, and revoke leases.
- **Authentication & Security**: 
  - Basic Auth (Username/Password).
  - HTTPS Client Certificate Authentication (mTLS).
  - Support for HTTP and secure HTTPS connections.
- **User & Role Management**: Manage users, roles, and granular permissions.
- **Watchers**: Monitor key changes and trigger actions (Notifications, Console logs).
- **Cluster Health**: View member lists and perform basic health checks.
- **Multi-Profile Support**: Save multiple connection configurations and switch between them easily.
- **Cross-Platform**: Native performance on Windows, macOS, and Linux thanks to Wails.

## 🛠️ Tech Stack

- **Backend**: Go 1.22+
- **Frontend Framework**: Wails v2
- **UI Library**: Vue 3 + TypeScript + Vuetify 3
- **Build Tool**: Vite

## 📦 Installation

### End Users
Pre-built binaries are available for:
- **Windows**: `.exe` installer or portable version.
- **macOS**: `.dmg` or `.app`.
- **Linux**: `.deb`, `.rpm`, or AppImage.

Please check the [Releases](https://github.com/andrewbytecoder/wedm/releases) page for the latest stable version.

### Contributors / Developers
To run the project locally, you need to set up the Wails development environment.

#### Prerequisites
1. **Go**: Version 1.22 or higher ([Download Go](https://go.dev/dl/)).
2. **Node.js**: LTS version recommended ([Download Node](https://nodejs.org/)).
3. **Wails CLI**: Install via Go:
   
```
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

#### Running the Dev Build

1. **Clone the Repository**:

```
git clone https://github.com/andrewbytecoder/wedm.git
cd wedm
```

2. **Install Frontend Dependencies**:

```
cd frontend
npm install
```

3. **Start the Development Server**:

```
wails dev
```

This will launch the application with hot-reloading for the frontend.

## 📖 Usage and Support

First, configure the application with the ETCD server details:
- **Host** and **Port**: Enter the ETCD server's address.
- **Authentication**: If required, provide credentials or certificates.

For more information, use the **Quick Help** feature (Ctrl/Cmd + H) to access documentation and keyboard shortcuts.

## 🔄 Upgrading

- **Windows/Mac/Linux**: Restart the application to check for updates.
- **Dev Build**: Pull the latest changes from the repository and rebuild.

## 🐞 Bugs and Feature Requests

Report issues and request features using the [GitHub Issue Tracker](https://github.com/andrewbytecoder/wedm/issues).

