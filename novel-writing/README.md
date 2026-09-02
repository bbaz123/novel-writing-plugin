# Novel Writing preset · 使用说明

这是一个给 DeepSeek Harness（dsh）会话用的**小说创作 agent preset**。
它让 dsh 里的 AI 在写小说/分析小说时自动遵守 novel-studio 里的世界观、角色卡与长期记忆，并输出更少 AI 腔、更有作者感的正文。

## 它能做什么（工具）

| 工具 | 作用 | 何时用 |
| --- | --- | --- |
| `novel_context` | 取作品/章节的分层创作上下文（大纲/记忆/事件/角色卡/世界观/红线） | 每次动笔、续写、润色前 |
| `novel_works` | 列出作品，确认 work_id | 会话开始 |
| `novel_lookup` | 关键词检索角色/词条/章节/剧情线 | 写前查证设定 |
| `novel_scan` | 对正文做确定性“反 AI 腔”红线扫描 | 产出后自检 |
| `novel_style_contract` | 读取当前写作红线清单 | 需要时 |
| `novel_event_add` | 关键剧情/伏笔/状态变化写入事件账本 | 章节被采纳后 |
| `novel_memory_update` | 把进展并入长期记忆（自动留版本快照，可回滚） | 章节被采纳后 |

## 安装

把整个 `novel-writing/` 目录复制到：

```
C:\Users\<你>\.dsh\.agent-presets\novel-writing\
```

（Windows 为 `%USERPROFILE%\.dsh\.agent-presets\novel-writing`；macOS/Linux 为 `~/.dsh/.agent-presets/novel-writing`。）

然后在 dsh 新建会话时选择 preset **“Novel Writing 小说创作”**。

## 前置条件

1. novel-studio 正在运行（默认 `http://127.0.0.1:3737`）；
2. novel-studio 服务端代码已升级到“创作内核”版本（见 ENGINE.md 的变更清单）；
3. 工具缺省连接 `http://127.0.0.1:3737`，可在 `agent.cordis.yml` 的 `novel-tools.config.baseUrl` 里改。

## 建议工作流

1. 在 dsh 里问“写《XXX》第 N 章”，AI 会自动拉 `novel_context`；
2. 审阅其写作方案 → 让 AI 成稿 → AI 自扫红线 → 事件入账 + 记忆更新；
3. 正文落回 novel-studio 网页编辑器（AI 输出的正文由你在网页端粘贴/保存，或用网页工具栏按钮走后台生成）。

## 卸载

删除该 preset 目录即可。
