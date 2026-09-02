// 导入《雾都缝匠》示例小说到 novel-studio（走本地 REST API）。
// 用法：
//   node demo/seed-demo.js                # 导入（若同名作品已存在则报错）
//   node demo/seed-demo.js --fresh        # 先删除同名作品再导入
//   node demo/seed-demo.js --delete       # 仅删除同名示例作品
//   node demo/seed-demo.js --base http://127.0.0.1:3737   # 自定义服务地址
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const BASE = (args.find((a) => a.startsWith('--base=')) || '--base=http://127.0.0.1:3737').split('=')[1]
const FRESH = args.includes('--fresh')
const DELETE_ONLY = args.includes('--delete')

const data = JSON.parse(readFileSync(join(__dirname, 'demo-data.json'), 'utf8'))

async function call(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`)
  try { return JSON.parse(text) } catch { return { raw: text } }
}

// 段落 → 简单 HTML（适配 novel-studio 富文本编辑器；已含标签的原样保留）
function toHtml(text) {
  if (!text) return ''
  if (/^</.test(text.trim())) return text.trim()
  return String(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

async function deleteDemoWork(title) {
  const works = await call('/api/works')
  const target = (Array.isArray(works) ? works : []).find((w) => w.title === title)
  if (!target) { console.log(`未找到作品「${title}」，无需删除。`); return false }
  await call(`/api/works/${target.id}`, 'DELETE')
  console.log(`已删除示例作品「${title}」(id=${target.id})，其章节/角色/记忆等已级联清理。`)
  return true
}

async function main() {
  const title = data.work.title
  if (DELETE_ONLY) return deleteDemoWork(title)

  const existing = (await call('/api/works')).find((w) => w.title === title)
  if (existing && !FRESH) {
    console.error(`作品「${title}」已存在（id=${existing.id}）。想覆盖请加 --fresh。`)
    process.exit(1)
  }
  if (existing && FRESH) await deleteDemoWork(title)

  console.log(`==> 正在创建示例作品「${title}」...`)
  const work = await call('/api/works', 'POST', data.work)
  const workId = work.id

  const byName = {}
  byName.volume = {}
  for (const v of data.volumes || []) {
    const row = await call('/api/volumes', 'POST', { work_id: workId, ...v })
    byName.volume[v.title] = row.id
  }
  byName.plotline = {}
  for (const p of data.plotlines || []) {
    const row = await call('/api/plotlines', 'POST', { work_id: workId, ...p })
    byName.plotline[p.title] = row.id
  }
  byName.category = {}
  for (const c of data.categories || []) {
    const row = await call('/api/categories', 'POST', { work_id: workId, ...c })
    byName.category[c.name] = row.id
  }
  for (const t of data.terms || []) {
    await call('/api/terms', 'POST', {
      work_id: workId,
      category_id: byName.category[t.category] ?? null,
      title: t.title, content: t.content, tags: t.tags || '',
    })
  }
  byName.character = {}
  for (const c of data.characters || []) {
    const row = await call('/api/characters', 'POST', { work_id: workId, ...c, category_id: undefined })
    byName.character[c.name] = row.id
  }
  for (const r of data.relations || []) {
    if (!byName.character[r.from] || !byName.character[r.to]) continue
    await call('/api/relations', 'POST', {
      work_id: workId,
      from_character_id: byName.character[r.from],
      to_character_id: byName.character[r.to],
      relation: r.relation, description: r.description || '',
    })
  }
  for (const w of data.worldEntries || []) {
    await call('/api/world_entries', 'POST', {
      work_id: workId, title: w.title, content: w.content,
      keywords: w.keywords || '', is_pinned: w.is_pinned || 0,
      priority: w.priority ?? 50, position: w.position ?? 0,
    })
  }
  for (const pc of data.plotlineCharacters || []) {
    if (!byName.character[pc.character] || !byName.plotline[pc.plotline]) continue
    await call('/api/plotline_characters', 'POST', {
      work_id: workId,
      plotline_id: byName.plotline[pc.plotline],
      character_id: byName.character[pc.character],
      status: pc.status || '', notes: pc.notes || '',
    })
  }
  byName.chapter = {}
  ;(data.chapters || []).forEach((ch, i) => {
    byName.chapter[ch.title] = { volume_id: byName.volume[ch.volume] ?? null, plotline_id: byName.plotline[ch.plotline] ?? null, position: i }
  })
  for (const ch of data.chapters || []) {
    const ref = byName.chapter[ch.title]
    const row = await call('/api/chapters', 'POST', {
      work_id: workId,
      volume_id: ref.volume_id,
      plotline_id: ref.plotline_id,
      parent_id: null,
      title: ch.title,
      summary: ch.summary || '',
      content: toHtml(ch.content || ''),
      position: ref.position,
    })
    byName.chapter[ch.title].id = row.id
  }
  // 长期记忆（先清空再写入，保证与演示数据一致；自带版本快照）
  await call('/api/story_memory', 'PUT', { work_id: workId, summary: '', source: 'manual', note: 'seed reset' })
  await call('/api/story_memory', 'PUT', {
    work_id: workId,
    summary: data.memory.summary,
    source: data.memory.source || 'manual',
    note: data.memory.note || 'seed-demo',
  })
  // 事件账本
  for (const e of data.events || []) {
    const chId = byName.chapter[e.chapter]?.id ?? null
    await call('/api/novel/events', 'POST', {
      work_id: workId, chapter_id: chId, kind: e.kind,
      summary: e.summary, payload: e.payload || {},
    })
  }

  console.log(`✔ 导入完成：${title} (work_id=${workId})`)
  console.log(`  卷 ${(data.volumes || []).length} · 剧情线 ${(data.plotlines || []).length} · 章节 ${(data.chapters || []).length} · 角色 ${(data.characters || []).length} · 世界观词条 ${(data.worldEntries || []).length} · 事件 ${(data.events || []).length}`)
  const firstCh = data.chapters[0]
  const ctx = await call(`/api/novel/context?work_id=${workId}&chapter_id=${byName.chapter[firstCh.title].id}&mode=continuation`)
  console.log(`  上下文冒烟：assembled ${ctx.assembled ? ctx.assembled.length : 0} 字 · 出场角色 ${(ctx.scene_characters || []).length} 位 · 红线 ${(ctx.redlines || []).length} 条`)
  console.log('  在 novel-studio 网页刷新后即可看到《雾都缝匠》；无需时可在作品列表删除（将级联清理全部演示数据）。')
}

main().catch((e) => { console.error('导入失败：' + e.message); process.exit(1) })
