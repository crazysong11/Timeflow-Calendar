# 第三方许可证补充文本

`npm run notices` 从已锁定的 npm 与 Cargo 依赖包收集许可证，生成根目录的 `THIRD_PARTY_NOTICES.txt`。此目录补充少数依赖包中缺少的正文，文件名对应依赖名称与版本。

- `alloc-stdlib-0.3.0.txt`：[上游 LICENSE](https://github.com/dropbox/rust-alloc-no-stdlib/blob/0a81fd6928ea3b33c8cd484aa4575d50ffb98012/LICENSE)。
- `webview2-com-0.39.1.txt` 与 `webview2-com-sys-0.39.1.txt`：[上游 LICENSE](https://github.com/wravery/webview2-rs/blob/edc2caf886175ccaebe86078c9cfe1ae2a187328/LICENSE)。
- `webview2-com-macros-0.8.1.txt`：[上游 LICENSE](https://github.com/wravery/webview2-rs/blob/dffa41a8a46d3f5565eefbff2de57d38d399f158/LICENSE)。
- `selectors-0.38.0.txt`：Mozilla Public License 2.0 正文，来自同依赖树中的 `cssparser 0.37.0/LICENSE`；[selectors 源文件声明](https://github.com/servo/stylo/blob/572ecba2d1600e7c3d490586692a209faf703baa/selectors/lib.rs)采用该许可证。

更新依赖后重新生成声明，补充新增依赖的许可证文本。安装包同时携带项目自身的 GPL-3.0 许可证与第三方声明。
