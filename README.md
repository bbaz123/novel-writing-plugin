# Novel Writing · dsh 创作内核插件

[![Node.js ≥ 22.13](https://img.shields.io/badge/node-%E2%89%A5%2022.13-3c873a?logo=node.js&logoColor=white)](https://nodejs.org)
[![npm dependencies: 0](https://img.shields.io/badge/npm%20dependencies-0-brightgreen)](#-环境要求与兼容性)
[![tools: 13](https://img.shields.io/badge/novel__*%20tools-13-blue)](#-工具一览)
[![smoke: 32 groups](https://img.shields.io/badge/smoke-32%20groups-blueviolet)](#-测试与验证)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

**给 AI 写作装上「分层上下文 + 伏笔账本 + 反 AI 腔红线」的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：13 个 `novel_*` 工具，让长篇中文小说写到第 100 章也不跑设定。**

> 📌 本仓库是 **[novel-studio](https://github.com/bbaz123/novel-studio) 内置创作插件的发布镜像**。插件规范源在 novel-studio 的 `harness-plugins/novel-writing/`，两边 1:1 同步；**安装请优先用规范源那一份**。

| 仓库 | 角色 | 说明 |
| --- | --- | --- |
| [bbaz123/novel-studio](https://github.com/bbaz123/novel-studio) | **应用本体 + 规范源** | 工坊主程序；插件规范源在 `harness-plugins/novel-writing/` |
| **bbaz123/novel-writing-plugin** | 发布镜像（本仓库） | 插件目录的独立镜像，便于单独引用、追踪变更与提交 issue |

## 🎯 30 秒讲清它解决什么问题

用对话式 AI 写长篇，通常写到第 20～80 章之间开始崩，症状很具体：

- **设定漂移**：第 12 章写「李队」，第 40 章变成「队长」，前后对不上
- **状态错乱**：第 3 章已经死掉的配角重新出场
- **伏笔失踪**：埋的线没人回收，或被当成既成事实提前用掉
- **AI 腔**：满屏「心中一凛」「眼中闪过一丝复杂」
- **失忆**：每次都要手动把设定贴进对话框——贴少了它编，贴多了超上下文

插件本身**不写提示词、不调用模型**，它做的事是：把 novel-studio 里已经结构化的作品数据，在写作的前、中、后三个阶段**接进 AI 的工具调用**。

| 阶段 | 机制 | 对应工具 |
| --- | --- | --- |
| 写前 | 按预算装配分层上下文（大纲 / 长期记忆 / 事件账本 / 未闭合伏笔 / 本章蓝图 / 出场角色卡 / 世界观 / 写作红线…） | `novel_context` `novel_lookup` `novel_foreshadows` |
| 写中 | 把「写作纪律」写进人设：守设定、守角色、守篇幅、守红线 | `agent.cordis.yml` / `headless-cordis.patch.yml` |
| 写后 | 一致性核对、反 AI 腔扫描、事件与伏笔入账、审稿报告、正文写回 | `novel_consistency` `novel_scan` `novel_event_add` `novel_review` `novel_chapter_save` |

```text
裸用对话式 AI 写长篇：
  第 12 章「李队」写成「李队长」 · 第 3 章死掉的配角又出场 · 伏笔没人回收 · 每次都要手动贴设定

接入本插件后：
  写作前自动装配分层上下文（含角色当前状态与未闭合伏笔）
  成文后一致性核对逐项指出冲突；反 AI 腔红线确定性正则扫描并给出命中位置
```

## 🚫 它不做什么 · 什么时候才需要它

- **不是独立应用**：插件没有自己的界面，必须配合 [novel-studio](https://github.com/bbaz123/novel-studio) 使用；单独装它没有任何可见效果
- **不含模型、不联网调模型**：`novel_*` 工具只通过本机 HTTP 读写 novel-studio（默认 `http://127.0.0.1:3737`），**不产生任何 API 费用**
- **不是「一键成书机」**：headless 模式下 AI 的事件与记忆入账**先落提案**，由作者勾选采纳后才进作品账本，避免绕过作者污染设定
- **不替你改作品**：`novel_blueprint`（蓝图）、`novel_review`（审稿报告）、`novel_chapter_save`（正文写回）都走 novel-studio 的确认流程
- **不动你 profile 里的其它配置**：`install.ps1` 采用**区块合并**，只替换本插件维护的那一段，你手动加的 patch 条目原样保留
- **不是 npm 包**：零依赖、纯 ESM，安装就是「复制文件」，没有 `npm install`
- **安装脚本仅 Windows**（PowerShell）；插件模块本身跨平台

## ⚡ 3 分钟跑起来

**前置条件**：Node.js **22.13+**、一份**已构建的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 仓库** + 其中的 `headless` profile、Windows（安装脚本）。

**第 1 步：装工坊本体**

```bash
git clone https://github.com/bbaz123/novel-studio.git
cd novel-studio
npm start            # 打开 http://localhost:3737；数据库启动时自动建表 / 迁移
```

> 工坊本体已内置创作内核，**不装本插件也能当纯写作工具用**；本插件只增强「AI 写作」那部分。

**第 2 步：装 dsh 侧插件**（本仓库根目录）

```powershell
# 预演：不写任何文件，先看会改哪些路径
powershell -ExecutionPolicy Bypass -File .\install.ps1 -DryRun

# 安装 / 升级
powershell -ExecutionPolicy Bypass -File .\install.ps1

# 卸载（删 GUI preset + 整段移除 headless patch 区块）
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall
```

安装脚本会自动完成两处接线：

- `~/.dsh/profiles/headless/cordis.patch.yml` —— 合并式注入「Novel Studio 创作内核」区块
- `~/.dsh/.agent-presets/novel-writing/` —— GUI 会话 preset

若工坊本体不在默认位置，启动工坊前指定 dsh 仓库路径：

```powershell
$env:NOVELSTUDIO_DSH_REPO = "C:\path\to\deepseek-harness"
npm start
```

完成后在 novel-studio 里点「AI 写作」即可——后台 headless 任务自动携带 `novel_*` 工具与创作纪律，
**不需要在 dsh 界面手动选 preset**（身份经 `NOVELSTUDIO_WORK_ID` / `NOVELSTUDIO_CHAPTER_ID` / `NOVELSTUDIO_MODE` 注入）。

## 👀 它长什么样

插件本身没有界面，它服务于 novel-studio 的写作台：

![Novel Studio 正文写作界面：左侧作品与章节树，中间富文本编辑器，右侧设定参考面板](https://raw.githubusercontent.com/bbaz123/novel-studio/main/assets/screenshot-writing.png)

## 🧰 工具一览

| 工具 | 作用 |
| --- | --- |
| `novel_context` | 取分层上下文（大纲/记忆/事件/未闭合伏笔/本章蓝图/目标字数/前后章衔接/角色卡/世界观/红线），分层预算截断。`mode=settings` 用于设定类生成，只去掉章节层、质量层零丢失 |
| `novel_works` | 列出作品（确认 `work_id`） |
| `novel_lookup` | 关键词检索角色/设定词条/章节/剧情线（写前查证设定） |
| `novel_foreshadows` | 列出未闭合（或全部）伏笔 |
| `novel_foreshadow_update` | 标记伏笔状态（`resolved`/`dropped`/`open`，可回链回收事件） |
| `novel_consistency` | 成文后一致性核对：未闭合伏笔 / 出场角色状态 / 最近事件 vs 正文（蓝图为核对锚点） |
| `novel_scan` | 确定性反 AI 腔红线扫描（可 `skip_dialogue` 跳过引号内对话） |
| `novel_style_contract` | 读取当前写作红线清单 |
| `novel_event_add` | 事件/伏笔/状态变化入账（伏笔回收、幂等去重；headless 先落提案） |
| `novel_memory_update` | 长期记忆摘要压缩/增量提交（版本快照可回滚；headless 先落提案） |
| `novel_blueprint` | 保存本章写作蓝图（场景目标/情节点/冲突/钩子/目标字数），作者确认后落库 |
| `novel_review` | 保存成文的审稿报告（总评/问题清单/优点），作者在工坊界面确认清单并按清单修稿 |
| `novel_chapter_save` | 成稿写回章节正文（旧稿自动存历史版本，返回红线扫描） |

完整工具与端点契约以 [`plugin.json`](plugin.json) 为准（文档与测试的唯一真源）。

## 🔧 关键机制

- **分层上下文预算**：每层独立上限、红线/角色卡保底、总量收敛截断；超长记忆标注压缩提示，不做一刀切盲截。红线层的保底位由 `TOTAL_BUDGET` / `FLEX_ORDER` 收敛逻辑保证。
- **提案确认（headless 防污染）**：novel-studio 网页启动的任务带 `NOVELSTUDIO_PROPOSE_MODE=1`，AI 的事件/记忆入账先落提案表，作者勾选采纳后才进账本；GUI dsh 会话里作者在场，直接入账。
- **伏笔闭环**：`novel_foreshadows` 查欠账 → 正文显式呼应 → `novel_event_add(resolves_event_id=…)` 自动把旧伏笔标记 `resolved`；`novel_context` 始终带【未闭合伏笔】层。
- **审稿 → 修稿闭环**：审稿报告 → 逐条确认/忽略 → 按确认清单修稿 → 段落级差异预览 → 合并到正文（旧稿存历史版本）。
- **红线与正向风格契约**：默认 28 条反 AI 腔红线，作品级可覆盖；支持 `skip_dialogue`（引号内台词不计）与**整词豁免**（如「眸 → 豁免 眼眸/回眸/眸色」），并可配置正向风格要求一起进入写作上下文。
- **记忆版本化**：长期记忆每次保存/回滚自动留快照，每作品保留最近 200 个，可一键回滚与差异预览。
- **幂等与保留**：事件按 `dedup_key` 去重；正文写回前自动存章节历史版本；审稿报告每章保留最近 10 份。
- **本地安全**：服务端不返回 `Access-Control-Allow-Origin: *`，跨源写请求一律 403；写类端点校验 `work_id` 与章节归属，防串作品误写。

更细的架构、端点与验收细节见 [`ENGINE.md`](ENGINE.md)。

## 🏗 文件结构

```text
novel-writing-plugin/
├─ novel-tools.mjs            # dsh 侧 13 个 novel_* 工具（插件入口，纯 ESM）
├─ agent.cordis.yml           # GUI 会话 preset：写作人设 + novel_* 工具 + fs
├─ preset.yml                 # preset 元信息
├─ headless-cordis.patch.yml  # 注入 headless profile 的区块片段（合并式安装）
├─ install.ps1                # 一键安装 / 升级 / 卸载（区块合并，自动备份）
├─ plugin.json                # 清单：工具 / 端点 / 契约（唯一真源）
├─ test/smoke.mjs             # 端到端冒烟测试（32 组断言，纯 HTTP）
├─ ENGINE.md                  # 架构、端点、验收细节
├─ NATIVE_PLUGIN_GUIDE.md     # 如何在工坊内扩展本插件
├─ CHANGELOG.md               # 版本更新记录
└─ README.md                  # 本文件
```

两层结构：**dsh 侧**（本仓库：工具 + 人设 + 安装脚本）负责「AI 怎么调用工具」，
**服务端**（novel-studio：`server.js` / `db.js`）负责「上下文怎么装配、账本怎么落库」。

## ⚙️ 配置

插件通过环境变量获取**运行时身份**（由 novel-studio 的任务启动器注入，通常无需手工设置）：

| 变量 | 作用 |
| --- | --- |
| `NOVELSTUDIO_BASE_URL` | novel-studio 服务地址，默认 `http://127.0.0.1:3737` |
| `NOVELSTUDIO_WORK_ID` | 当前作品 id（工具的 `work_id` 兜底） |
| `NOVELSTUDIO_CHAPTER_ID` | 当前章节 id（工具的 `chapter_id` 兜底） |
| `NOVELSTUDIO_MODE` | 任务模式（如 `settings` 设定类生成） |
| `NOVELSTUDIO_PROPOSE_MODE` | `1` = 写账本类工具先落提案（headless 防污染） |
| `NOVELSTUDIO_DSH_REPO` | 工坊启动时用：指定 deepseek-harness 仓库路径 |

## 🧪 测试与验证

冒烟测试是**纯 HTTP 断言**，不依赖 dsh、模型与 API Key，但需要一份 novel-studio 检出（用到它的 `server.js` 与 `zip-reader.mjs`）。
测试脚本会自行拉起服务、在临时数据目录里跑完整流程。

```bash
NOVELSTUDIO_REPO=/path/to/novel-studio node test/smoke.mjs
```

Windows PowerShell：

```powershell
$env:NOVELSTUDIO_REPO = "C:\path\to\novel-studio"
node .\test\smoke.mjs
```

期望输出 `✅ 全部 32 组断言通过。`，覆盖：分层上下文与 `settings` 模式轻量装配、红线扫描（对话豁免 / 整词豁免 / 正向契约）、
伏笔闭环与事件幂等、提案确认流、记忆版本与回滚、一致性核对、蓝图与目标字数、多关键词检索、审稿清单、
出场角色评分制（别名命中 / 单字防误命中 / 核心保底）、TXT 与 EPUB 导入导出、正文写回与历史版本、
跨源写拒绝、`work_id` 归属校验、大作品装配性能基线、日志系统。

同一套测试已接进 GitHub Actions（[`.github/workflows/smoke.yml`](.github/workflows/smoke.yml)）：检出本仓库 + `novel-studio@main`，直接跑 `test/smoke.mjs`。

dsh 侧工具是否真的挂上，可以这样抽查（需要已安装插件）：

```bash
cd <你的 deepseek-harness 目录>
pnpm dsh --profile headless "只输出一行：你当前可用的全部工具名称，用逗号分隔"
# 期望包含：novel_context, novel_works, novel_lookup, novel_scan, novel_style_contract,
#           novel_event_add, novel_memory_update, novel_foreshadows, novel_foreshadow_update,
#           novel_consistency, novel_blueprint, novel_review, novel_chapter_save
```

手动抽查服务端接口：

```bash
curl "http://127.0.0.1:3737/api/novel/ping"
curl -X POST "http://127.0.0.1:3737/api/novel/scan" -H "Content-Type: application/json" \
  -d '{"text":"他嘴角勾起一抹冷笑，眼中闪过一丝复杂。"}'
```

## 📋 环境要求与兼容性

| 项目 | 要求 |
| --- | --- |
| Node.js | **22.13+**（novel-studio 用内置 `node:sqlite`，该版本起不再需要 `--experimental-sqlite`；**22.5–22.12 会起不来**） |
| DeepSeek Harness | 一份已构建的 dsh 仓库 + 其中的 `headless` profile |
| 操作系统 | 安装脚本 `install.ps1` 仅 Windows；插件模块是跨平台纯 ESM |
| 第三方依赖 | **无**（无 `dependencies`，无构建步骤） |
| 网络 | 不需要联网；除访问本机 novel-studio 外不发起请求 |

## 🧩 扩展这个插件

新增一个工具（例：`novel_timeline`）需要同步改四处，完整步骤见 [`NATIVE_PLUGIN_GUIDE.md`](NATIVE_PLUGIN_GUIDE.md)：

1. **服务端**（novel-studio 的 `server.js` / `db.js`）加端点与数据表
2. **dsh 侧**（`novel-tools.mjs`）用 `ctx.tools.register({ name, description, parameters, output, execute })` 注册
3. **人设**（`agent.cordis.yml` 与 `headless-cordis.patch.yml`）补一句使用时机，两边保持同一纪律文本
4. **清单与测试**：`plugin.json` 补一行，`test/smoke.mjs` 补断言，README 工具表补一行

> ⚠️ 不要直接手改 `~/.dsh` 里的安装副本——**唯一来源是本仓库**，下次安装会覆盖。

## 🗑 卸载 / 回退

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall
```

- 删除 `~/.dsh/.agent-presets/novel-writing`（GUI preset）
- 从 `~/.dsh/profiles/headless/cordis.patch.yml` 中**整段移除**本插件区块，其它 patch 条目原样保留
- 安装脚本每次改动前自动备份（保留最近 5 个 `.bak`），可据此回退
- novel-studio 服务端的新表/新列向后兼容，旧功能不受影响，建议保留

## 🤝 参与贡献

本仓库是**发布镜像**：代码的规范源在 [novel-studio](https://github.com/bbaz123/novel-studio) 的 `harness-plugins/novel-writing/`。

- **Bug / 功能建议**：请提到 [novel-studio issues](https://github.com/bbaz123/novel-studio/issues)，这样修复能同时覆盖规范源与镜像
- **Pull Request**：同样请提到 novel-studio（本仓库的改动会在下次同步时被规范源内容覆盖）
- 详见 [`CONTRIBUTING.md`](CONTRIBUTING.md)

## 📄 License

[Apache-2.0](LICENSE) © 2026 bbaz123

## 🗓 更新记录

当前镜像与 [novel-studio](https://github.com/bbaz123/novel-studio) **v0.9.3** 同步。完整版本历史见 [`CHANGELOG.md`](CHANGELOG.md)。

**v0.9.3（本版重点）**

- `novel_context` 新增 `settings` 模式：设定类生成只去掉「当前场景 / 本章蓝图 / 前后章衔接」三层，质量层（红线、角色卡、世界观词条、长期记忆、事件账本、未闭合伏笔）零丢失
- **headless profile 瘦身**：关闭与创作无关的通用能力（`agent-instructions`、`tool-pwsh`、`workflow`/`subagent`/`todo`/`goal`/`jobs`/`ralph`、`plan-mode`、`web`、`skill` 等），保留 `novel_*` 工具与 read/write/edit/glob/grep
- **冒烟测试扩至 32 组**：新增 `settings` 模式轻量装配断言
