# Timeflow Calendar

**简体中文** | [English](README.en.md)

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
