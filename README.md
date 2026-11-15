# Timeflow Calendar

点击语言标题展开内容。 / Select a language to read.

<details name="readme-language">
<summary><strong>English</strong></summary>

A continuous timeline calendar for Windows. Start planning from this moment.

## The idea

Timeflow Calendar explores a continuous view of your schedule: 23:00 today sits naturally next to 00:00 tomorrow. Even when part of the morning has passed, the time ahead is still yours to use.

The design centers on three ideas:

- **Browse time continuously.** Drag or scroll left and right, with evenly spaced hourly markers across midnight.
- **Schedule at any time.** Place events within an hour or across several hours, keeping events that span midnight together.
- **Keep dates in view.** Date headers show which day each part of the timeline belongs to.

## Current status

Timeflow Calendar is in early development. The Windows app currently opens a welcome screen; the timeline and scheduling features described above are planned. The next step is an interactive prototype to explore navigation, date headers, and event layouts.

## Run from source

Set up the prerequisites using the [Windows development guide](docs/development.md) (Chinese), then run these commands in PowerShell:

```powershell
git clone https://github.com/crazysong11/Timeflow-Calendar.git
cd Timeflow-Calendar
npm.cmd ci
npm.cmd run doctor
npm.cmd run desktop:dev
```

The development guide also covers frontend previews, builds, and dependency setup.

## Documentation and contributing

Project documentation is currently available in Chinese:

- [Requirements and use cases](docs/requirements.md)
- [Technical design](docs/technical-design.md)
- [Windows development guide](docs/development.md)

Share use cases, interaction ideas, and bug reports through [Issues](https://github.com/crazysong11/Timeflow-Calendar/issues). Contributions to code, documentation, and translations are welcome through [Pull Requests](https://github.com/crazysong11/Timeflow-Calendar/pulls).

For bug reports, include reproduction steps and the expected and actual behavior. For feature suggestions, describe the situation in which you would use them.

## License

License selection is pending. The chosen license will be published in the repository's root `LICENSE` file before the first release.

</details>

<details name="readme-language" open>
<summary><strong>简体中文</strong></summary>

面向 Windows 的流式日历，让时间连续呈现，让安排从此刻开始。

## 产品理念

Timeflow Calendar 希望用连续的时间轴呈现日程：今天的 23:00 与明天的 00:00 自然相邻。即使上午已经过去一半，接下来的时间依然可以充分利用。

设计围绕三个方向展开：

- **连续浏览时间**：左右拖动或滑动，以均匀的小时刻度浏览过去与未来，跨越午夜时自然衔接。
- **随时安排事项**：在一小时内或跨多个小时安排事项，让跨午夜的安排保持完整。
- **清晰识别日期**：通过时间轴上方的日期头部，了解每段时间属于哪一天。

## 当前状态

项目处于早期开发阶段，目前的 Windows 应用可以启动欢迎界面，上述时间轴与日程功能正在规划。下一步将制作交互原型，验证连续浏览、日期头部与事项布局。

## 从源码运行

按 [Windows 开发指南](docs/development.md) 准备环境后，在 PowerShell 中运行：

```powershell
git clone https://github.com/crazysong11/Timeflow-Calendar.git
cd Timeflow-Calendar
npm.cmd ci
npm.cmd run doctor
npm.cmd run desktop:dev
```

前端预览、应用构建与依赖配置详见开发指南。

## 文档与贡献

- [基本需求与使用场景](docs/requirements.md)
- [技术方案](docs/technical-design.md)
- [Windows 开发指南](docs/development.md)

欢迎通过 [Issues](https://github.com/crazysong11/Timeflow-Calendar/issues) 分享使用场景、讨论交互设计或反馈问题，也欢迎通过 [Pull Requests](https://github.com/crazysong11/Timeflow-Calendar/pulls) 改进代码、文档与翻译。

反馈问题时，请附上复现步骤、预期表现和实际表现；提出功能建议时，请说明具体的使用场景。

## 许可证

许可证待选定，确定后将在首次发布前公布于仓库根目录的 `LICENSE` 文件中。

</details>
