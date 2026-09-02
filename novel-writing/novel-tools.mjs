/**
 * novel-tools — Novel Studio 创作内核的 dsh 模型工具集。
 *
 * 这些工具通过 novel-studio 本地 HTTP API（默认 http://127.0.0.1:3737）读写创作数据：
 *  - novel_context        写作前取“ST 式分层上下文”（大纲/记忆/事件/场景/角色卡/世界观/红线）
 *  - novel_works          列出作品（便于在本会话中先选作品）
 *  - novel_lookup         按关键词检索角色/词条/章节/剧情线
 *  - novel_scan           对一段正文做确定性“反 AI 腔”红线扫描
 *  - novel_style_contract 读取当前写作红线清单（风格契约）
 *  - novel_event_add      把关键剧情/伏笔/状态变化写入事件账本
 *  - novel_memory_update  提交长期记忆增量（带版本快照，可回滚）
 *
 * 身份：当本进程由 novel-studio 的 /api/harness/run 启动时，环境变量
 * NOVELSTUDIO_WORK_ID / NOVELSTUDIO_CHAPTER_ID / NOVELSTUDIO_MODE 已注入，
 * 工具会自动回退到它们；交互会话里可在调用参数中直接传 work_id。
 */

export const name = 'novel-tools'
export const inject = ['tools']

const DEFAULT_BASE = 'http://127.0.0.1:3737'

const textOutput = {
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: { text: { type: 'string' } },
    required: ['text'],
  },
  render: (_args, value) => [{ type: 'text', text: value.text }],
}

export function apply(ctx, config) {
  const baseOf = () => (config && config.baseUrl) || process.env.NOVELSTUDIO_BASE_URL || DEFAULT_BASE

  async function jfetch(path, options = {}) {
    const base = baseOf()
    const res = await fetch(base + path, {
      method: options.method || 'GET',
      headers: { 'content-type': 'application/json' },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeout || 25000),
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`novel-studio ${res.status} ${path}: ${text.slice(0, 300)}`)
    }
    try {
      return JSON.parse(text)
    } catch {
      return { raw: text }
    }
  }

  const envId = (args, key) => (args[key] !== undefined && args[key] !== null && args[key] !== '')
    ? args[key]
    : (process.env[`NOVELSTUDIO_${key.toUpperCase()}`] || undefined)

  function identitySuffix(workId, chapterId, mode) {
    const parts = []
    if (workId !== undefined) parts.push(`work_id=${encodeURIComponent(workId)}`)
    if (chapterId !== undefined) parts.push(`chapter_id=${encodeURIComponent(chapterId)}`)
    if (mode !== undefined) parts.push(`mode=${encodeURIComponent(mode)}`)
    return parts.length ? `?${parts.join('&')}` : ''
  }

  function register(name, description, parameters, execute) {
    ctx.tools.register({
      name,
      description,
      parameters: { type: 'object', properties: parameters, additionalProperties: false },
      output: textOutput,
      async execute(args) {
        const text = await execute(args)
        return { text: String(text ?? '') }
      },
    })
  }

  register('novel_works', [
    '列出 novel-studio 里的全部作品（id + 标题）。',
    '适合在本会话开始创作前确认要操作的 work_id；也可用 novel_lookup 检索具体设定。',
  ].join('\n'), {
    includeDescription: { type: 'boolean', description: '可选：为 true 时附带作品简介首行。' },
  }, async (args) => {
    const works = await jfetch('/api/works')
    const list = Array.isArray(works) ? works : []
    if (!list.length) return 'novel-studio 里还没有作品。请先在 novel-studio 网页创建作品，或确认服务已启动（http://127.0.0.1:3737）。'
    return '作品列表：\n' + list.map((w) => {
      const desc = args.includeDescription && w.description ? `（${String(w.description).slice(0, 80)}）` : ''
      return `${w.id}. ${w.title}${desc}`
    }).join('\n')
  })

  register('novel_context', [
    '写作前调用：取指定作品/章节的完整创作上下文（ST 式分层装配）。',
    '包含：卷/剧情线/章节进度大纲、长期记忆摘要、最近事件账本、当前场景与前后章衔接、出场角色卡（含对话示例与角色系统提示）、人物关系、按优先级激活的世界观词条、写作风格红线。',
    'output 的 assembled 字段就是可直接读入的整块上下文。',
    'work_id/chapter_id 缺省时自动使用进程注入的身份（由 novel-studio 启动的任务自带）。mode: full=整章代写/分析, continuation=接龙续写, fragment=片段补写。',
  ].join('\n'), {
    work_id: { type: 'string', description: '作品 id（可选，缺省用环境身份）' },
    chapter_id: { type: 'string', description: '章节 id（可选）' },
    mode: { type: 'string', description: 'full | continuation | fragment（默认 full）' },
  }, async (args) => {
    const workId = envId(args, 'work_id')
    if (workId === undefined) {
      const works = await jfetch('/api/works')
      if (!Array.isArray(works) || !works.length) throw new Error('未提供 work_id，且 novel-studio 中暂无作品（novel_works 可查看）')
      throw new Error('未提供 work_id，请先用 novel_works 确认作品 id，或在参数中给出 work_id')
    }
    const chapterId = envId(args, 'chapter_id')
    const mode = args.mode || process.env.NOVELSTUDIO_MODE || 'full'
    const ctx = await jfetch(`/api/novel/context${identitySuffix(workId, chapterId, mode)}`)
    if (!ctx.ok) throw new Error('novel-studio 返回异常')
    const head = `作品：${ctx.work.title}${ctx.chapter ? `｜当前章节：第${ctx.chapter.position + 1}节 ${ctx.chapter.title}` : ''}（mode=${ctx.mode}）`
    const body = ctx.assembled || JSON.stringify(ctx)
    return `${head}\n\n${body}`.slice(0, 30000)
  })

  register('novel_lookup', [
    '需要临时核实设定时调用：按关键词检索角色/设定词条/章节/剧情线（一次最多各 8 条）。',
    '写正文前若上下文未覆盖某设定，用它查证，避免凭记忆写错。',
  ].join('\n'), {
    query: { type: 'string', description: '要查的关键词（角色名、地名、物品、事件等）' },
    work_id: { type: 'string', description: '作品 id（可选，缺省用环境身份）' },
    kind: { type: 'string', description: '可选过滤：character | term | chapter | plotline' },
  }, async (args) => {
    const query = String(args.query || '').trim()
    if (!query) throw new Error('缺少 query')
    const workId = envId(args, 'work_id')
    const data = await jfetch(`/api/search?q=${encodeURIComponent(query)}${workId !== undefined ? `&work_id=${encodeURIComponent(workId)}` : ''}`)
    const out = []
    const pick = (list) => (Array.isArray(list) ? list.slice(0, 8) : [])
    const kind = args.kind
    if (!kind || kind === 'character') {
      const chars = pick(data.characters)
      if (chars.length) out.push('角色：\n' + chars.map((c) => `- ${c.name}（${c.identity || ''}）${c.status ? `｜当前状态：${c.status}` : ''}`).join('\n'))
    }
    if (!kind || kind === 'term') {
      const terms = pick(data.terms)
      if (terms.length) out.push('设定词条：\n' + terms.map((t) => `- 【${t.title}】${String(t.content || '').slice(0, 200)}`).join('\n'))
    }
    if (!kind || kind === 'chapter') {
      const chs = pick(data.chapters)
      if (chs.length) out.push('章节：\n' + chs.map((c) => `- ${c.title}${c.summary ? `：${String(c.summary).slice(0, 120)}` : ''}`).join('\n'))
    }
    if (!kind || kind === 'plotline') {
      const pls = pick(data.plotlines)
      if (pls.length) out.push('剧情线：\n' + pls.map((p) => `- ${p.title}（${p.kind === 'side' ? '支线' : '主线'}）${p.summary ? `：${String(p.summary).slice(0, 120)}` : ''}`).join('\n'))
    }
    if (!out.length) return `未检索到与“${query}”相关的内容。`
    return out.join('\n\n')
  })

  register('novel_scan', [
    '对一段正文做确定性“反 AI 腔”红线扫描（词/句式/正则三类，返回命中条目与出现次数、示例上下文）。',
    '写作完成或润色后调用，把命中条目作为自检报告；命中较多时应主动改写后重扫。',
  ].join('\n'), {
    text: { type: 'string', description: '要检查的正文文本' },
    work_id: { type: 'string', description: '作品 id（可选，缺省用环境身份/全局红线）' },
  }, async (args) => {
    const text = String(args.text || '')
    if (!text.trim()) throw new Error('缺少 text')
    const workId = envId(args, 'work_id')
    const data = await jfetch('/api/novel/scan', { method: 'POST', body: { work_id: workId, text } })
    const hits = Array.isArray(data.hits) ? data.hits : []
    if (!hits.length) return '红线扫描通过：未命中任何反 AI 腔条目。'
    const lines = hits.map((h) => `- ${h.pattern}（${h.kind}）x${h.count}${h.sample ? `\n  示例：…${String(h.sample).slice(0, 80)}…` : ''}`)
    return `红线扫描命中 ${data.total} 处（建议改写后重扫）：\n${lines.join('\n')}`
  })

  register('novel_style_contract', [
    '读取当前生效的写作风格契约（反 AI 腔红线清单：慎用词/慎用句式/句式模式）。',
    '写作、润色前若不确定红线内容可调用；上下文里通常已含该段，非必需。',
  ].join('\n'), {
    work_id: { type: 'string', description: '作品 id（可选，缺省用环境身份/全局红线）' },
  }, async (args) => {
    const workId = envId(args, 'work_id')
    const data = await jfetch(`/api/novel/redlines${workId !== undefined ? `?work_id=${encodeURIComponent(workId)}` : ''}`)
    const rows = Array.isArray(data.redlines) ? data.redlines : []
    if (!rows.length) return '当前未启用任何红线规则。'
    const lines = rows.map((r) => `- [${r.kind === 'regex' ? '句式模式' : r.kind === 'word' ? '慎用词' : '慎用句式'}] ${r.pattern}${r.note ? `（${r.note}）` : ''}`)
    return '【写作风格红线 · 反 AI 腔】写作时主动避免以下词句，需要更具体、更有画面感的写法：\n' + lines.join('\n')
  })

  register('novel_event_add', [
    '把“已发生的关键剧情/新伏笔/角色状态变化/设定变更”写入作品事件账本，供长期记忆与后续一致性维护使用。',
    '仅在正文确认生成/采纳后调用，避免污染账本。payload 里可带结构化细节。',
  ].join('\n'), {
    work_id: { type: 'string', description: '作品 id（可选，缺省用环境身份）' },
    chapter_id: { type: 'string', description: '归属章节 id（可选）' },
    kind: { type: 'string', description: 'event | foreshadow | status_change | setting_change（默认 event）' },
    summary: { type: 'string', description: '一句话事件描述' },
    payload: { type: 'object', description: '可选结构化细节（角色、物品等）' },
  }, async (args) => {
    const workId = envId(args, 'work_id')
    if (workId === undefined) throw new Error('未提供 work_id')
    const summary = String(args.summary || '').trim()
    if (!summary) throw new Error('缺少 summary')
    const chapterId = envId(args, 'chapter_id')
    const data = await jfetch('/api/novel/events', {
      method: 'POST',
      body: {
        work_id: workId,
        chapter_id: chapterId,
        kind: args.kind || 'event',
        summary,
        payload: args.payload || {},
      },
    })
    return `已记录事件 #${data.id}：${summary}`
  })

  register('novel_memory_update', [
    '把一段创作后“已发生的故事进展”并入作品长期记忆（自动写版本快照，可在 novel-studio 回滚）。',
    '两种用法：1) 你已看过旧摘要，自行把“旧摘要+新进展”合并压缩为 ≤800 字的新摘要，传 summary；2) 只传 delta 让服务端简单追加（会用【此前进度】分段，提示后续压缩）。',
    '提交前请保证内容反映正文已确认发生的事件，而不是计划。',
  ].join('\n'), {
    work_id: { type: 'string', description: '作品 id（可选，缺省用环境身份）' },
    summary: { type: 'string', description: '合并压缩后的完整新摘要（与 delta 二选一）' },
    delta: { type: 'string', description: '本次进展的增量描述（与 summary 二选一）' },
    note: { type: 'string', description: '备注（如“第12章后”）' },
  }, async (args) => {
    const workId = envId(args, 'work_id')
    if (workId === undefined) throw new Error('未提供 work_id')
    if (!String(args.summary || '').trim() && !String(args.delta || '').trim()) throw new Error('需要 summary 或 delta 至少一个')
    const data = await jfetch('/api/story_memory', {
      method: 'PUT',
      body: {
        work_id: workId,
        summary: args.summary || '',
        delta: args.summary ? undefined : args.delta || '',
        source: 'auto',
        note: args.note || 'dsh 创作插件提交',
      },
    })
    const extra = data.version_id ? `（版本 #${data.version_id}，可回滚）` : ''
    if (data.summary === '') return '记忆更新为空（与旧摘要相同则自动跳过）'
    return `长期记忆已更新${extra}，当前摘要（前 ${120} 字）：${String(data.summary || '').slice(0, 120)}`
  })
}
