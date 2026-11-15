# Timeflow Calendar

点击语言标题展开内容。 / Select a language to read.

<details name="readme-language">
<summary><strong>English</strong></summary>

A continuous timeline calendar for Windows. Start planning from this moment.

## About

Timeflow Calendar places your schedule on a timeline you can drag left and right. Hours provide a scale, dates provide context, and 11 PM today sits naturally next to midnight tomorrow.

The idea comes from an everyday experience: once half the morning has passed, the remaining time can feel less worth using because the whole block is no longer intact. Timeflow Calendar aims to make the time ahead clearly visible through a continuous view, helping you start whenever you are ready.

## Core design

The following features will take shape through the development roadmap:

- **Continuous timeline**: drag through time with a consistent scale and layout across midnight.
- **Hourly markers**: use hours as a visual reference while scheduling within or across them.
- **Date headers**: see which date each part of the timeline belongs to, including when browsing across days.
- **Flexible scheduling**: start at any time and keep events that cross midnight together.
- **Focus on now**: locate the current moment with a time marker and a “Back to now” action.
- **Local storage**: keep your schedule on your computer for everyday use.

## Project status

The technology stack and desktop foundation are in place, and the app currently opens a welcome screen. The next milestone is an interactive timeline prototype to explore continuous navigation, date transitions, and event layouts.

## Technology stack

- **Desktop application**: Tauri 2 + Rust
- **Interface and interactions**: React + TypeScript + CSS
- **Development and builds**: Vite + npm
- **Local storage**: SQLite + the Tauri SQL plugin

## Local development

Install Node.js 24 LTS, the Rust MSVC toolchain, Microsoft C++ Build Tools, and WebView2. See the [Windows development guide](docs/development.md) (Chinese) for setup details. From the project root, run:

```powershell
npm.cmd ci
npm.cmd run doctor
npm.cmd run desktop:dev
```

Common commands:

| Command | Purpose |
| --- | --- |
| `npm.cmd run dev` | Preview the frontend in a browser |
| `npm.cmd run desktop:dev` | Start Windows desktop development mode |
| `npm.cmd run build` | Check TypeScript and build the frontend |
| `npm.cmd run desktop:build` | Build the Windows application and installer |

For system proxy configuration, see the dependency management section of the development guide.

## Roadmap

- [x] Define the basic requirements and use cases
- [ ] Design the main interface and timeline interactions
- [x] Choose the technology stack
- [x] Set up the development environment and desktop project
- [ ] Build an interactive prototype
- [ ] Implement the continuous timeline, hourly markers, and date headers
- [ ] Add event creation, editing, deletion, and display across midnight
- [ ] Add current-time navigation and local persistence
- [ ] Validate everyday use and publish the first Windows release

## Documentation

The project documentation is currently available in Chinese:

- [Requirements and acceptance scenarios](docs/requirements.md)
- [Technical design](docs/technical-design.md)
- [Windows development guide](docs/development.md)

## Contributing

Ideas about timeline interactions, use cases, and feature design are welcome. Use [Issues](https://github.com/crazysong11/Timeflow-Calendar/issues) to report problems or discuss ideas, and [Pull Requests](https://github.com/crazysong11/Timeflow-Calendar/pulls) to contribute improvements.

For bug reports, include reproduction steps, expected behavior, and actual behavior. For feature suggestions, describe the use case and the problem you want to solve.

## License

An open-source license will be selected before the first release and published in the repository's root `LICENSE` file.

</details>

<details name="readme-language" open>
<summary><strong>简体中文</strong></summary>

面向 Windows 的流式日历，让时间连续呈现，让安排从此刻开始。

## 关于项目

Timeflow Calendar 将日程放在一条可以左右浏览的时间轴上。小时提供刻度，日期帮助定位，今天的 23:00 与明天的 00:00 自然相邻。

这个项目源于一种日常体验：当上午已经过去一半时，人容易觉得这段时间已经失去完整性，从而放弃剩余的时间。Timeflow Calendar 希望通过连续的时间视图，让接下来的每一段时间都清晰可见，帮助用户随时开始安排。

## 核心设计

以下设计将随开发路线逐步实现：

- **连续时间轴**：左右拖动浏览时间，跨越午夜时保持相同的时间比例与连续布局。
- **小时刻度**：以小时为视觉参考，支持在小时内和跨小时安排事项。
- **日期头部**：在时间轴上方标明日期，让跨天浏览保持清晰。
- **灵活安排**：支持从任意时刻开始，完整呈现跨午夜的事项。
- **聚焦此刻**：通过当前时刻标线和“回到现在”入口，快速定位接下来的时间。
- **本地保存**：在电脑上保存日程，方便日常使用。

## 项目进度

项目已完成技术选型和基础桌面工程，当前可以启动欢迎界面。下一里程碑是可操作的时间轴原型，重点验证连续浏览、跨天显示和事项布局。

## 技术栈

- **桌面应用**：Tauri 2 + Rust
- **界面与交互**：React + TypeScript + CSS
- **开发与构建**：Vite + npm
- **本地存储**：SQLite + Tauri SQL 插件

## 本地开发

准备 Node.js 24 LTS、Rust MSVC 工具链、Microsoft C++ Build Tools 和 WebView2，具体配置见 [Windows 开发指南](docs/development.md)。在项目根目录运行：

```powershell
npm.cmd ci
npm.cmd run doctor
npm.cmd run desktop:dev
```

常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm.cmd run dev` | 浏览器预览前端 |
| `npm.cmd run desktop:dev` | 启动 Windows 桌面开发模式 |
| `npm.cmd run build` | 检查 TypeScript 并构建前端 |
| `npm.cmd run desktop:build` | 构建 Windows 应用与安装包 |

系统代理的使用方法见开发指南中的依赖管理说明。

## 开发路线

- [x] 整理基本需求与使用场景
- [ ] 设计主界面与时间轴交互
- [x] 确定技术方案
- [x] 搭建开发环境与桌面工程
- [ ] 制作交互原型
- [ ] 实现连续时间轴、小时刻度与日期头部
- [ ] 实现事项创建、编辑、删除与跨天显示
- [ ] 加入当前时刻定位与本地保存
- [ ] 完成使用验证并发布 Windows 首个版本

## 文档

- [基本需求与验收场景](docs/requirements.md)
- [技术方案](docs/technical-design.md)
- [Windows 开发指南](docs/development.md)

## 参与贡献

欢迎围绕时间轴交互、使用场景和功能设计提出建议。通过 [Issues](https://github.com/crazysong11/Timeflow-Calendar/issues) 反馈问题、讨论想法，通过 [Pull Requests](https://github.com/crazysong11/Timeflow-Calendar/pulls) 贡献改进。

问题反馈请附上复现步骤、预期表现和实际表现；功能建议请说明使用场景及希望解决的问题。

## 许可证

开源许可证将在首次发布前确定，并在仓库根目录的 `LICENSE` 文件中公布。

</details>
