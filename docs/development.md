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
# 时间逻辑、SQLite 持久化与浏览器预览存储测试
npm.cmd test

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

该命令将前端资源嵌入 src-tauri/target/debug/timeflow-calendar.exe，可用于验证独立启动。Windows 下调试版与 Release 版均使用 GUI 子系统，直接运行 exe 时显示应用界面和托盘。开发命令在终端中执行，构建信息由开发终端输出。Tauri 的构建选项写在第二个 `--` 之前，Cargo 的 `--locked` 参数写在其后。

## 当前开发阶段

1.0.0 已实现连续时间轴、日期头部、视野切换、事项创建/编辑/删除、重叠分行与 SQLite 本地保存，并提供 Windows x64 安装包。浏览器预览使用独立 localStorage；日常操作见[使用指南](usage.md)。后续根据试用反馈完善交互。

## 开发任务

开发进度在此维护，需求范围和验收场景见[基本需求](requirements.md)，实现方案见[技术方案](technical-design.md)。

- [x] 整理基本需求与使用场景
- [x] 确定技术方案
- [x] 搭建开发环境与桌面工程
- [x] 完成第一版主界面与时间轴交互
- [x] 制作交互原型
- [x] 实现连续时间轴、小时刻度与日期头部
- [x] 实现事项创建、编辑、删除与跨天显示
- [x] 加入当前时刻定位与本地保存
- [x] 完成 Windows 1.0.0 安装包与使用验证

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

## 第一版验证记录

2026 年 11 月 15 日完成以下检查：

- 6 组自动化测试：跨午夜/月/年等距与坐标逆变换；分钟输入与范围校验；重叠分行；夏令时 23/25 小时日期；SQLite 实际迁移与重新打开后的增改删；浏览器预览读写失败处理。
- TypeScript 检查、前端生产构建、Rust 格式检查、Clippy 静态检查（警告视为错误）与 Windows 调试版构建。
- 浏览器界面检查：跨午夜事项、重叠显示、分钟级起止、编辑、非法时间提示、刷新恢复、日期跳转、视野切换、方向键、拖动与双击创建。
- 640 × 480 窄视口检查：页面无横向溢出，24 小时视野的文字标签自动减密，编辑窗口可以纵向滚动。
- Windows 应用检查：通过界面新增事项并保存到 SQLite，关闭后重启恢复，通过删除确认移除验证事项。

截图 `images/timeline.jpg` 来自运行中的浏览器预览，使用人工输入的示例事项。Windows 应用共享前端界面，使用独立 SQLite 数据库。

## 窗口适配验证记录

2026 年 11 月 15 日完成字号、控件和自动视野改进：

- 8 组自动化测试通过；新增自动视野小时宽度、窗口变化时的浏览锚点，以及固定视野时长检查。
- TypeScript 检查、前端生产构建与 Windows 调试版构建通过。
- 浏览器分别检查 640 × 480、1100 × 720、1920 × 1080、2560 × 1440 和 3840 × 2160 CSS 像素视口，页面均无横向溢出。
- 自动模式在 3840 × 2160 视口显示约 26.6 小时；2560 × 1440 约 17.5 小时；1920 × 1080 约 12.8 小时。每小时保持约 140 CSS 像素。
- 4K 屏幕的 150% 和 200% 缩放分别对应约 2560 × 1440 和 1920 × 1080 的逻辑尺寸，实际可用高度还包含标题栏和任务栏的影响。上述浏览器检查验证对应布局；系统 DPI 切换与跨显示器移动另行验证。
- 固定 8 小时模式从大窗口缩至 640 × 480 后保持相同起止范围；自动模式保留已浏览的四分之一锚点；大窗口的固定 24 小时模式保持选定时长。
- 窄窗口编辑表单采用单列并可纵向滚动。实际 Windows 应用最大化后自动视野从约 7.3 小时增至 17.5 小时；拖动 140 逻辑像素浏览一小时。
- 更新示例截图为 2560 × 1440 浏览器预览，保留人工输入的示例事项。

## 桌面模式验证记录

2026 年 11 月 15 日完成桌面固定与布局调整：

- TypeScript 检查、前端生产构建、Rust Clippy 和 Windows 调试版构建通过。
- 原有 8 项前端与存储测试通过；新增 3 项 Rust 测试，覆盖 DPI 位移换算、最小逻辑尺寸、负坐标显示器与工作区约束。
- 用户在本机确认 Win+D 后日历可见，直接移动和缩放正常；经托盘退出并重新启动后，位置和大小恢复。
- 模式与布局写入独立的 `desktop.json`；SQLite 日程结构保持现有迁移版本。
- 双语 README 内容与文档链接检查通过。桌面宿主与后续兼容性验证范围见[桌面模式设计](desktop-mode.md)。

运行桌面布局单元测试：

```powershell
cargo test --manifest-path src-tauri/Cargo.toml --locked --lib
```

## 日期跳转与独立启动修正

2026 年 11 月 15 日：

- “前往”改为将选定日期的 00:00 对齐到时间轴左侧；浏览器界面验证零点刻度的位置为 `0px`。
- Windows 入口统一使用 GUI 子系统，调试版与 Release 版独立启动均采用图形界面方式。
- 8 项现有前端与存储测试、TypeScript 检查、前端生产构建和 Windows 调试版构建通过。
- 读取生成 exe 的 PE 头，确认子系统为 `IMAGE_SUBSYSTEM_WINDOWS_GUI`（值 2），并启动新版应用。
- 双语 README 与文档链接检查通过；安装包继续使用现有 NSIS 构建配置。

## 单实例启动验证

2026 年 11 月 15 日修复重复运行 exe 会出现多个日历的问题。

- 接入 Tauri 官方 Single Instance 插件，并在插件列表首位注册。
- Rust Clippy、3 项 Rust 单元测试、TypeScript 检查、前端生产构建与 Windows 调试版构建通过。
- 进程级验证：连续重复打开 3 次、同时启动 5 次，均只保留一个日历进程；退出后正常重新启动。
- 普通窗口最小化后再次打开 exe，原窗口恢复，原进程编号保持不变，第二个进程以状态码 0 退出。
- 桌面模式的固定状态、位置与大小在重复启动后保持不变；正常关闭普通窗口后也可以再次启动。
- 验证完成后恢复原桌面偏好，启动新版日历。

复现进程级检查前，从托盘退出正在使用的日历，再运行：

```powershell
powershell -NoProfile -ExecutionPolicy RemoteSigned -File scripts/test-single-instance.ps1
```

脚本启动自己的测试进程并在结束时清理它们；已有日历运行时会提示先退出。浏览器预览继续按各浏览器标签页运行。

## 两种窗口布局独立记忆

2026 年 11 月 15 日：

- 普通窗口和桌面面板分别保存位置、尺寸，切换时恢复目标模式的布局；普通窗口额外保存最大化状态。
- 5 项 Rust 测试通过，包含旧配置迁移、两套布局在两种模式下的保存与读取，以及原有 DPI 和工作区约束检查。
- Rust Clippy、TypeScript 检查、前端生产构建和 Windows 调试版构建通过。
- 本机普通窗口调整宽度后保存，最大化并关闭、重新启动后恢复最大化；还原窗口时，位置和外框尺寸与重启前的记录一致。
- 切换到桌面模式后，原有桌面布局恢复，两套位置与尺寸同时保存在配置中。
- 用户确认普通窗口与桌面模式往返切换后，都能恢复各自的位置和大小。
- 双语 README 一致性与文档链接检查通过。

## Windows 1.0.0 发布验证

2026 年 11 月 15 日：

- 版本号统一为 1.0.0，采用 GPL-3.0-only，生成 Windows x64 NSIS 安装包。
- 8 项前端与存储测试、5 项 Rust 测试、Rust 格式检查、Clippy、TypeScript 和 Release 构建通过。
- 安装向导显示中文与英文选项，中文向导的目录选择、安装完成与启动流程验证通过。
- 当前用户安装成功，版本记录为 1.0.0；程序使用 x64 GUI 子系统，安装目录包含完整许可证与第三方声明。
- 安装版连续重复启动 3 次、同时启动 5 次及退出后重新启动，均维持单实例。
- 卸载移除程序和安装记录，日程数据库与窗口布局文件摘要保持一致；重新安装后正常读取现有日程。
- 验证完成后恢复原桌面模式与布局，启动已安装的正式版。
- 发布附件提供 NSIS 安装包与 SHA-256 校验文件；构建和发布步骤见[版本发布指南](releasing.md)。

## 窗口尺寸缩放验证

2026 年 11 月 15 日，针对 1920 × 1080 笔记本的字号反馈，开发分支加入统一尺寸缩放。已发布的 1.0.0 安装包保持原版，此项改进随下一版安装包提供。

| 浏览器内容视口（CSS 像素） | 布局比例 | 主要按钮字号 | 事项卡片高度 |
| --- | --- | --- | --- |
| 640 × 480、900 × 600、1100 × 720 | 75% | 12px | 58.5px |
| 1280 × 640 | 76% | 12px | 约 59.3px |
| 1536 × 780 | 约 82% | 12px | 约 63.7px |
| 1920 × 990 | 约 90% | 约 12.6px | 约 70.4px |
| 1920 × 1080 | 92% | 约 12.9px | 约 71.8px |
| 2560 × 1340、3840 × 2160 | 100% | 14px | 78px |

- 1920 × 1080 屏幕在系统缩放 125%／150% 下，对应的逻辑屏幕尺寸约为 1536 × 864／1280 × 720；表中使用更小的内容高度覆盖标题栏与任务栏占用。上述检查为浏览器视口验证。
- 各视口均无页面横向溢出；另检查 624 × 430 的最小窗口内容区，字号保持下限且可打开、关闭编辑表单。
- 640 × 480 编辑表单为单列，正文 12px，可纵向滚动，表单无横向溢出。
- 自动视野的实际小时宽度随比例在 105–140 CSS 像素之间变化，显示的覆盖时长与实际时间轴一致。固定 8 小时视野在窗口变化后仍为 8 小时；浏览锚点保持稳定。
- 9 项前端与存储测试、TypeScript 检查、前端生产构建和 Windows 调试版构建通过；新增测试覆盖界面缩放与时间坐标换算。浏览器控制台无错误。
