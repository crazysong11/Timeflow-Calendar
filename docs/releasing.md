# Windows 版本发布

## 版本与资源

版本号同步写入 `package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 和 `src-tauri/tauri.conf.json`。Git 标签使用 `v` 前缀，例如 `v1.0.0`。

1.0.0 提供 Windows x64 的 NSIS 安装包，安装到当前用户目录。安装向导支持简体中文和英文，内置 WebView2 引导程序，需要安装运行时时联网下载。

项目采用 GPL-3.0-only，完整正文在根目录 `LICENSE`。安装包内置 `LICENSE` 和 `THIRD_PARTY_NOTICES.txt`，托盘“关于”显示版本与对应源码地址。更新依赖后运行 `npm.cmd run notices` 重新生成第三方声明；补充许可证的来源见 [licenses](../licenses/README.md)。

## 构建与验证

按照 [Windows 开发指南](development.md) 准备环境，在项目根目录运行：

```powershell
npm.cmd ci
npm.cmd test
cargo test --manifest-path src-tauri/Cargo.toml --locked --lib
cargo clippy --manifest-path src-tauri/Cargo.toml --locked -- -D warnings
npm.cmd run notices
npm.cmd run desktop:build -- -- --locked
```

`notices` 使用本地 Cargo 缓存；首次搭建时先执行一次 Cargo 检查以下载 Windows 目标依赖。前端检查与生产构建由桌面构建自动执行。

构建结果位于 `src-tauri/target/release/bundle/nsis/`。发布前完成安装、启动、单实例运行、卸载及日程数据保留检查。单实例检查使用：

```powershell
powershell -NoProfile -ExecutionPolicy RemoteSigned -File scripts/test-single-instance.ps1 -Executable "$env:LOCALAPPDATA\Timeflow Calendar\timeflow-calendar.exe"
```

运行检查前从托盘退出已有日历。检查脚本启动并清理自己的测试进程。

## 发布到 GitHub

1. 同步双语 README 的版本、下载入口和当前状态，在 `docs/releases/` 编写对应版本的中英文发布说明。
2. 完成适用检查，检查远程更新，提交并推送发布代码。
3. 在已验证提交上创建版本标签并推送。保留发布所用的构建产物。
4. 将安装包命名为 `Timeflow-Calendar_<版本>_x64-setup.exe`，计算 SHA-256，写入 `SHA256SUMS.txt`。
5. 创建 GitHub Release 草稿，关联对应标签，上传安装包和校验文件，核对大小与摘要后发布为正式版本。
6. 验证公开下载与标签源码可访问，并核对下载文件摘要。GitHub 提供该标签对应的源码压缩包。

安装包与校验文件存放在 Release 附件中；Git 仓库跟踪源代码、配置、文档和许可证。1.0.0 使用未签名安装包，发布说明中标明签名状态。
