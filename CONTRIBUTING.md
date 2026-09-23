# 参与贡献

感谢你有兴趣改进 Novel Writing 插件。请先花 30 秒读下面这段——它能避免你的改动被覆盖。

## ⚠️ 先读这个：本仓库是发布镜像

| 仓库 | 角色 |
| --- | --- |
| [bbaz123/novel-studio](https://github.com/bbaz123/novel-studio) | **规范源**：插件源码在 `harness-plugins/novel-writing/` |
| bbaz123/novel-writing-plugin（本仓库） | **发布镜像**：与规范源 1:1 同步 |

**因此：**

- 本仓库不接受功能性 Pull Request。即使合并，下次同步也会被规范源内容覆盖。
- 请把 **Bug 报告、功能建议与 Pull Request 提到 [novel-studio](https://github.com/bbaz123/novel-studio)**，
  这样修复能同时覆盖规范源与镜像。
- 本仓库适合提交**展示层问题**（README 表述、链接失效、文档错别字等）。

## 报告 Bug

请到 [novel-studio issues](https://github.com/bbaz123/novel-studio/issues/new) 提交，并尽量附上：

1. **环境**：操作系统、`node -v`、novel-studio 版本（或镜像同步版本）、dsh 版本
2. **复现步骤**：从哪一步开始出错（安装 / 启动工坊 / 点「AI 写作」/ 具体某个 `novel_*` 工具）
3. **期望行为 vs 实际行为**
4. **证据**：报错原文、相关日志（novel-studio 的「运行追踪 / 日志」面板），不要只给结论
5. 涉及 `novel_*` 工具时，注明工具名与传入参数

## 提交 PR（到 novel-studio）

1. Fork [novel-studio](https://github.com/bbaz123/novel-studio) 并从 `main` 切分支
2. 改插件时注意**四处同步**（详见 [`NATIVE_PLUGIN_GUIDE.md`](NATIVE_PLUGIN_GUIDE.md)）：
   `server.js`/`db.js` 端点 → `novel-tools.mjs` 工具注册 → 两个 preset 文件的人设纪律 → `plugin.json`
3. **必须粘贴真实验证输出**：至少 `node harness-plugins/novel-writing/test/smoke.mjs` 的完整结果，
   PR 模板要求逐项勾选。**把 SKIP 当成通过会被直接打回。**
4. 保持改动范围最小：一个 PR 只做一件事，不要顺手重构无关代码

## 本地验证

```bash
# 端到端冒烟测试（纯 HTTP 断言，不需要模型与 API Key）
NOVELSTUDIO_REPO=/path/to/novel-studio node test/smoke.mjs
# 期望：✅ 全部 32 组断言通过。
```

Windows PowerShell：

```powershell
$env:NOVELSTUDIO_REPO = "C:\path\to\novel-studio"
node .\test\smoke.mjs
```

CI 会跑同一套测试（[`.github/workflows/smoke.yml`](.github/workflows/smoke.yml)）：检出本仓库与 `novel-studio@main` 后执行 `test/smoke.mjs`。

## 代码约定

- **唯一来源**：dsh 侧工具与人设只维护规范源一份；不要直接手改 `~/.dsh` 里的安装副本。
- **零依赖**：插件是纯 ESM JavaScript，不引入任何运行时依赖，也不需要构建步骤。
- **提案模式**：写账本类工具必须遵循 `NOVELSTUDIO_PROPOSE_MODE`，否则 headless 任务会绕过作者污染作品账本。
- **契约同步**：`plugin.json` 的 `version` 与 `novel-tools.mjs` 的 `PLUGIN_VERSION` 必须一致（见 `NATIVE_PLUGIN_GUIDE.md`）。
