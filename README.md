# Novel Writing 创作插件（novel-writing-plugin）

让 **novel-studio 网页里点“AI 创作/续写/润色”所调起的 dsh（deepseek-harness）** 自动具备
小说创作人格与 `novel_*` 工具：写作前拉取世界观/角色卡/长期记忆上下文（ST 式分层装配），
产出后自动做“反 AI 腔”红线扫描、事件入账、长期记忆版本化（git 式、可回滚）。

> ✅ 已实测：headless 工具目录出现全部 7 个 `novel_*` 工具；经由
> novel-studio `/api/harness/run` 的真实任务成功调用 `novel_context`
> 读取到作品上下文与红线清单，零编造。

## 目录

| 路径 | 说明 |
| --- | --- |
| `headless-profile/` | **核心**：注入 novel-studio 后台 dsh 的文件（`cordis.patch.yml` + `novel-tools.mjs`），放在 `~/.dsh/profiles/headless/` |
| `novel-writing/` | agent preset（GUI 交互会话用），放在 `~/.dsh/.agent-presets/novel-writing/` |
| `novel-studio-patch/` | novel-studio 服务端引擎改动（`db.js` / `server.js` / `harness.js` / `public/app.js` / `demo-data.json`），覆盖到你的 novel-studio 目录 |
| `install.ps1` | 一键安装（自动备份原 headless patch） |
| `demo/` | 示例小说《雾都缝匠》演示数据（`demo-data.json` + `seed-demo.js`，命令行导入/删除；应用内置“我的作品→一键导入”后可选） |
| `ENGINE.md` | 架构、数据表、REST 端点、挂载与验证细节 |

## 安装（两步）

```powershell
# 1) 升级 novel-studio 服务端：把 novel-studio-patch\ 内 5 个文件覆盖到你的 novel-studio 目录
#    （db.js / server.js / harness.js / public/app.js / demo-data.json），重启：npm start
#    （数据库启动时自动迁移：story_events / memory_versions / writing_redlines，
#    world_entries 自动补 priority 列）

# 2) 安装 dsh 侧文件：
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

完成后打开 novel-studio 使用 AI 创作即可——后台 headless dsh 自动携带 novel 工具与创作纪律，
无需在 dsh 界面手动选择 preset（身份经 `NOVELSTUDIO_WORK_ID/CHAPTER_ID/MODE` 环境变量注入）。

## 验证

```bash
cd <你的 deepseek-harness 目录>
pnpm dsh --profile headless "只输出一行：你当前可用的全部工具名称，用逗号分隔"
# 期望出现：novel_context, novel_works, novel_lookup, novel_scan,
#           novel_style_contract, novel_event_add, novel_memory_update
```

## 示例数据（《雾都缝匠》）

`demo/` 里带一部可直接导入的演示小说，用来体验整套插件（含世界观词条激活、角色卡口吻、前文衔接、伏笔/事件账本与红线约束）。**推荐方式**：打开 novel-studio →“我的作品”→ 示例小说卡片 → “一键导入《雾都缝匠》”（应用内置按钮，可打开/重新导入/删除）。命令行方式同样可用：

```bash
# 前置：novel-studio 已应用 novel-studio-patch 并运行（http://127.0.0.1:3737）
node demo/seed-demo.js          # 导入（同名作品已存在会提示）
node demo/seed-demo.js --fresh  # 覆盖导入
node demo/seed-demo.js --delete # 删除示例作品（级联清理）
```

演示内容包括：2 卷 / 3 条剧情线（含暗线）/ 6 章（前 4 章有正文，后 2 章留空待续写）/
4 张角色卡（含对话示例与角色系统提示）/ 5 条世界观词条（固定+关键词激活+优先级）/
长期记忆摘要 / 4 条事件账本（含伏笔与状态变化）。
第三章正文里故意保留了几处 AI 腔句式，可用来跑 `novel_scan` 看红线命中效果。
导入后即可让 dsh 以《雾都缝匠》为背景做续写/分析（dsh 会话里用 `novel_context` 选 work 或直接用 novel-studio 网页 AI 续写第五章）。

## 工具一览

| 工具 | 作用 |
| --- | --- |
| `novel_context` | 取作品/章节分层上下文（大纲进度/长期记忆/最近事件/前后章衔接/角色卡/激活世界观/写作红线），mode: full/continuation/fragment |
| `novel_works` | 列出作品（确认 work_id） |
| `novel_lookup` | 关键词检索角色/词条/章节/剧情线（写前查证设定） |
| `novel_scan` | 对正文做确定性反 AI 腔红线扫描（词/句式/正则） |
| `novel_style_contract` | 读取写作红线清单 |
| `novel_event_add` | 关键剧情/伏笔/状态变化写入事件账本 |
| `novel_memory_update` | 把进展并入长期记忆（summary 语义压缩提交，或 delta 追加；自动版本快照可回滚） |

## 红线清单（默认 28 条）

内置“反 AI 腔”红线（慎用词/慎用句式/句式模式三类，如：微微、缓缓、不禁、眸、嘴角、
“眼中闪过”“空气仿佛凝固”“嘴角勾起一抹”等），可经 `PUT /api/novel/redlines` 全量替换；
写作时约束、产出后确定性扫描。详见 ENGINE.md。

## 卸载 / 回退

- 删除 `%USERPROFILE%\.dsh\.agent-presets\novel-writing`
- 用安装时备份的 `cordis.patch.yml.bak-*` 覆盖回 `%USERPROFILE%\.dsh\profiles\headless\cordis.patch.yml`，删除 `novel-tools.mjs`
- 服务端改动向后兼容（新表/新列不影响旧功能），建议保留

## 环境要求

- Windows（脚本为 PowerShell；模块为纯 ESM JS，无第三方依赖）
- deepseek-harness（dsh）本地源仓库 + headless profile（`dsh --profile headless` 可跑通）
- novel-studio 本地服务（http://127.0.0.1:3737，默认端口可用 `PORT` 覆盖并在 patch 的 `baseUrl` 同步）
- novel-studio本地服务源代码以及安装地址：https://github.com/bbaz123/novel-studio
