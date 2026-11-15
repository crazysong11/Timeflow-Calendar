# Windows 版本发布

## 版本与资源

版本号同步写入 `package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 和 `src-tauri/tauri.conf.json`。Git 标签使用 `v` 前缀，例如 `v1.0.1`。

1.0.1 提供 Windows x64 的 NSIS 安装包，安装到当前用户目录。安装向导支持简体中文和英文，内置 WebView2 引导程序，需要安装运行时时联网下载。

项目采用 GPL-3.0-only，完整正文在根目录 `LICENSE`。安装包内置 `LICENSE` 和 `THIRD_PARTY_NOTICES.txt`，托盘“关于”显示版本与对应源码地址。更新依赖后运行 `npm.cmd run notices` 重新生成第三方声明；补充许可证的来源见 [licenses](../licenses/README.md)。

## 构建与验证

按照 [Windows 开发指南](development.md) 准备环境，在项目根目录运行：

```powershell
npm.cmd ci
npm.cmd test
cargo test --manifest-path src-tauri/Cargo.toml --locked --lib
cargo clippy --manifest-path src-tauri/Cargo.toml --locked -- -D warnings
npm.cmd run notices
powershell -NoProfile -ExecutionPolicy RemoteSigned -File scripts/build-release.ps1
node scripts/prepare-update.mjs
```

`notices` 使用本地 Cargo 缓存；首次搭建时先执行一次 Cargo 检查以下载 Windows 目标依赖。前端检查与生产构建由桌面构建自动执行。

构建结果位于 `src-tauri/target/release/bundle/nsis/`。发布前完成安装、启动、单实例运行、卸载及日程数据保留检查。单实例检查使用：

```powershell
powershell -NoProfile -ExecutionPolicy RemoteSigned -File scripts/test-single-instance.ps1 -Executable "$env:LOCALAPPDATA\Timeflow Calendar\timeflow-calendar.exe"
```

运行检查前从托盘退出已有日历。检查脚本启动并清理自己的测试进程。

## 发布到 GitHub

1. 同步双语 README 的版本、下载入口和当前状态，在 `docs/releases/` 编写对应版本的中英文发布说明。后续版本只描述相较上一版的新增功能、改进和升级事项，附版本对比链接。
2. 完成适用检查，检查远程更新，提交并推送发布代码。
3. 在已验证提交上创建版本标签并推送。保留发布所用的构建产物。
4. 将安装包命名为 `Timeflow-Calendar_<版本>_x64-setup.exe`，计算 SHA-256，写入 `SHA256SUMS.txt`。
5. 创建 GitHub Release 草稿，关联对应标签，上传安装包、同名 `.sig` 签名、`latest.json` 更新清单和校验文件，核对大小与摘要后发布为正式版本。
6. 验证公开下载与标签源码可访问，并核对下载文件摘要。GitHub 提供该标签对应的源码压缩包。

安装包与更新资源存放在 Release 附件中；Git 仓库跟踪源代码、配置、文档和许可证。Windows 安装包的 Authenticode 代码签名与 Tauri 更新签名相互独立：当前具有更新签名，尚无 Authenticode 签名。

## 自动更新发布约定

应用通过 Tauri 官方 updater 插件读取 `https://github.com/crazysong11/Timeflow-Calendar/releases/latest/download/latest.json`。清单包含版本、增量说明、Windows x64 安装包 URL 与签名。使用正式且设为 latest 的 Release；未来更新递增版本号，由插件比较版本。

`scripts/build-release.ps1` 从 `TAURI_SIGNING_PRIVATE_KEY` 指定路径读取签名私钥；本机默认路径为 Git 忽略目录 `.tools/updater/timeflow.key`。公钥已写入 Tauri 配置。私钥应另作安全备份，后续发布继续使用同一密钥；有密码时通过 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 提供。普通开发使用 `npm.cmd run desktop:dev`；仅检查构建可使用 `npm.cmd run desktop:build -- --no-bundle`。

`scripts/prepare-update.mjs` 根据版本、发布说明和构建签名生成四个附件，默认放入 `work/release-<版本>/`。下载采用 HTTPS，更新插件在启动安装程序前验证签名。NSIS 使用 passive 模式显示进度，覆盖已安装目录并重新启动应用。

按用户要求，1.0.1 的首次安装包被含自动更新的修订包替换，并同步源码标签、签名和校验文件。原包用户需要手动覆盖一次；修订包从后续更高版本开始接收程序内更新。修订前的发布记录与产物保留在本机 `work/release-1.0.1/`，修订后的产物单独保存于 `work/release-1.0.1-updater/`。
