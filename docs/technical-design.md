# Timeflow Calendar 技术方案

Timeflow Calendar 采用 Tauri 2、React、TypeScript 和 Vite 构建 Windows 桌面应用，通过 Tauri SQL 插件使用 SQLite 保存本地数据。开发从可运行的桌面工程开始，逐步实现连续时间轴和事项管理。

## 技术栈

| 部分 | 选择 | 职责 |
| --- | --- | --- |
| 桌面框架 | Tauri 2 | 窗口、前后端通信、系统能力和应用打包 |
| 界面 | React + TypeScript | 日期头部、时间轴、事项卡片与编辑表单 |
| 样式 | CSS | 布局、主题和交互状态 |
| 构建 | Vite + npm | 开发预览、依赖管理和前端资源构建 |
| 桌面层语言 | Rust | 注册插件、初始化应用与数据库迁移 |
| 存储 | SQLite + Tauri SQL 插件 | 保存事项，按可见时间范围查询 |
| 版本管理 | Git + GitHub | 记录变更、协作和发布 |

React 适合将交互界面拆成独立组件，网页布局便于迭代时间轴设计。Tauri 在 Windows 上使用 WebView2，Rust 层优先承担桌面集成职责。SQLite 将日程保存在本机，支持离线使用。

## 分层与数据流

1. 界面组件接收拖动、点击和表单输入。
2. TypeScript 业务逻辑处理时间换算、事项校验和布局。
3. 数据访问模块通过 Tauri SQL 插件读取或更新 SQLite。
4. 界面根据操作结果更新显示；保存失败时保留编辑内容并提供重试入口。

数据访问集中在独立模块，便于维护查询、替换原型数据和测试。

## 时间轴模型

使用时间戳描述时间位置，用统一比例将时长换算为像素：

```text
横向位置 = (时刻 - 视图起始时刻) × 每毫秒像素数
事项宽度 = (结束时刻 - 开始时刻) × 每毫秒像素数
```

日期头部、小时刻度和事项共享同一坐标系。拖动改变视图起始时刻；缩放改变比例，并保持指针所在时刻或指定锚点稳定。只渲染可见范围及附近缓冲区域。

事项起止时间以 UTC 时间戳保存，按本地时区显示。日期边界通过本地日历规则计算，以适应跨月、跨年和夏令时变化。时间跨度按真实经过的毫秒数换算，保持时间轴均匀。

## 数据存储

事项的初始字段包括唯一编号、标题、开始时间、结束时间、备注，以及创建和更新时间。开始时间必须早于结束时间，允许事项之间重叠。

查询可见范围时，筛选“开始时间早于视图结束，且结束时间晚于视图开始”的事项，从而包含横跨整个视图的安排。

数据库存放在 Tauri 为应用解析的数据目录中，数据库结构通过版本化迁移维护。写入使用参数化 SQL；需要同时完成的多步修改使用事务。

## 工程组织

```text
src/                    React 界面与 TypeScript 逻辑
src-tauri/              Rust 桌面工程、Tauri 配置和权限
docs/                   需求、技术方案和开发指南
scripts/                开发辅助脚本
work/                   本地验证记录和临时文件
```

随功能增长，在 src 内按时间轴、事项和存储职责组织模块。

## 依赖与版本

- 使用 Node.js 24 LTS 和 npm 管理前端依赖。
- 使用 Rust MSVC 工具链编译 Windows x64 目标。
- 使用 package-lock.json 与 Cargo.lock 记录可复现的依赖版本。
- 基础工程注册 SQL 插件，后续随事项管理加入数据库结构与读写模块；测试工具按验证需求引入。
- 首个安装包优先采用 Tauri 支持的 NSIS 安装程序。

## 验证顺序

1. 环境验证：前端构建、Rust 编译和桌面窗口启动。
2. 时间逻辑：跨午夜、跨月、跨年、时区变化和坐标换算。
3. 事项操作：创建、编辑、重叠显示及起止时间校验。
4. 数据保存：写入、重启恢复和数据库迁移。
5. 发布验证：Windows 安装、启动与升级后的数据保留。

## 官方参考

- [Tauri 开发环境](https://v2.tauri.app/start/prerequisites/)
- [Tauri 项目创建](https://v2.tauri.app/start/create-project/)
- [Tauri SQL 插件](https://v2.tauri.app/plugin/sql/)
- [Tauri Windows 打包](https://v2.tauri.app/distribute/windows-installer/)
- [React](https://react.dev/learn)
- [Vite](https://vite.dev/guide/)
- [Node.js](https://nodejs.org/en/download)
