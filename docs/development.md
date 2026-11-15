# Windows 开发指南

Timeflow Calendar 使用 Node.js、Rust 与 Microsoft C++ 编译工具构建。开发环境安装完成后，在项目根目录运行前端与桌面开发命令。

## 环境准备

| 工具 | 版本或配置 |
| --- | --- |
| Node.js | 24 LTS，包含 npm |
| Rust | stable，x86_64-pc-windows-msvc 工具链 |
| Microsoft C++ Build Tools | Visual Studio 2022，使用 C++ 的桌面开发工作负载及推荐组件 |
| WebView2 Runtime | Evergreen 运行时 |
| Git | Git for Windows |

rust-toolchain.toml 声明 stable 工具链以及 rustfmt、clippy 组件。

安装途径与组件说明见 [Tauri 官方环境指南](https://v2.tauri.app/start/prerequisites/)。Node.js 可从[官方网站](https://nodejs.org/en/download)安装，Rust 通过 [rustup](https://rustup.rs/)安装。

完成安装后重新打开终端，使 PATH 更新生效。进入项目目录：

```powershell
cd 'C:\Timeflow Calendar'
```

若将项目克隆到其他位置，使用对应的目录。

## 环境检查

项目提供统一的检查命令：

```powershell
npm.cmd run doctor
```

也可以分别查看工具版本：

```powershell
node --version
npm.cmd --version
rustc --version
cargo --version
git --version
```

PowerShell 示例使用 npm.cmd，可直接调用 npm 的 Windows 命令入口。

## 依赖管理

使用 Windows 系统代理连接依赖仓库时，可以先打开一个允许本地开发脚本的 PowerShell 会话：

```powershell
powershell -NoProfile -ExecutionPolicy RemoteSigned
```

该设置只作用于新会话。在项目根目录执行：

```powershell
. .\scripts\use-system-proxy.ps1
```

脚本将现有系统代理应用到当前终端的 npm、Cargo 和 rustup 下载，保留已有的工具代理设置，并让 localhost 连接直接访问。关闭终端后，这些临时设置随会话结束。

首次克隆项目后安装前端依赖：

```powershell
npm.cmd ci
```

前端依赖由 npm 安装，Rust 依赖由 Cargo 在桌面构建时下载。Git 跟踪 package-lock.json 和 Cargo.lock，以便不同电脑使用一致的依赖版本。

更新依赖时同时提交对应的锁文件。node_modules、编译产物和 work 中的临时记录由 .gitignore 排除。

## 开发流程

启动桌面开发模式：

```powershell
npm.cmd run desktop:dev
```

Tauri 会先启动 Vite，再编译 Rust 并打开桌面窗口。修改前端文件后，Vite 会更新界面。

只预览前端时使用：

```powershell
npm.cmd run dev
```

浏览器访问终端显示的本地地址，默认是 http://127.0.0.1:1420。SQLite 等桌面功能在 Tauri 窗口中验证。

## 构建与检查

```powershell
# TypeScript 检查和前端生产构建
npm.cmd run build

# Rust 类型与依赖检查
cargo check --manifest-path src-tauri/Cargo.toml --locked

# 生成 Windows 应用和 NSIS 安装包
npm.cmd run desktop:build
```

安装包输出在 src-tauri/target/release/bundle/nsis 中。首次构建需要下载 Rust 依赖和打包工具，后续构建会复用缓存。

只生成用于验证的调试版应用：

```powershell
npm.cmd run tauri -- build --debug --no-bundle -- --locked
```

该命令将前端资源嵌入 src-tauri/target/debug/timeflow-calendar.exe，可用于验证独立启动。Tauri 的构建选项写在第二个 `--` 之前，Cargo 的 `--locked` 参数写在其后。

## 当前开发阶段

基础工程提供欢迎界面，已配置 SQL 插件。接下来实现连续时间轴，再加入事项管理、数据库结构与读写流程。

## 已验证的环境

2026 年 11 月 15 日，在 Windows x64 环境验证了以下组合：

| 工具 | 版本 |
| --- | --- |
| Node.js | 24.22.1 |
| npm | 11.19.1 |
| Rust / Cargo | 1.100.0 |
| Visual Studio Build Tools | 2022 17.14.45 |
| Windows SDK | 10.0.26100.0 |
| WebView2 Runtime | 157.0.4341.60 |

环境检查、TypeScript 检查、前端生产构建和 Windows 调试版构建均通过。调试版启动时成功创建 Timeflow Calendar 窗口和 WebView2 子进程。desktop:dev 已验证可以启动 Vite 与桌面窗口，首页和 React 模块请求均返回 HTTP 200。

Vite 的监听范围排除了 src-tauri 与 work 目录，让前端热更新专注于界面文件。Rust 代码由 Tauri 的开发监听器处理。
