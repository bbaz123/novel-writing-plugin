# Novel Writing 插件安装脚本
# 1) agent preset（GUI 会话可选）  2) headless profile 注入（novel-studio 后台 AI 创作必用）
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dshHome = Join-Path $env:USERPROFILE '.dsh'
$presetDest = Join-Path $dshHome '.agent-presets\novel-writing'
$headlessDir = Join-Path $dshHome 'profiles\headless'

Write-Host '==> 1/2 agent preset (GUI 会话用)'
$srcPreset = Join-Path $root 'novel-writing'
if (-not (Test-Path $srcPreset)) { Write-Error "缺少 $srcPreset"; exit 1 }
if (Test-Path $presetDest) {
  $bak = "$presetDest.bak-$(Get-Date -Format yyyyMMddHHmmss)"
  Rename-Item $presetDest $bak
  Write-Host "    已备份旧 preset -> $bak"
}
Copy-Item -Recurse $srcPreset $presetDest
Write-Host "    preset 已安装：$presetDest"

Write-Host '==> 2/2 headless profile 注入（novel-studio 后台 dsh）'
if (-not (Test-Path $headlessDir)) { New-Item -ItemType Directory -Force -Path $headlessDir | Out-Null }
$srcPatch = Join-Path $root 'headless-profile\cordis.patch.yml'
$srcModule = Join-Path $root 'headless-profile\novel-tools.mjs'
if (Test-Path (Join-Path $headlessDir 'cordis.patch.yml')) {
  $bakPatch = Join-Path $headlessDir "cordis.patch.yml.bak-$(Get-Date -Format yyyyMMddHHmmss)"
  Copy-Item (Join-Path $headlessDir 'cordis.patch.yml') $bakPatch
  Write-Host "    已备份原 headless patch -> $bakPatch"
}
Copy-Item $srcPatch (Join-Path $headlessDir 'cordis.patch.yml') -Force
Copy-Item $srcModule (Join-Path $headlessDir 'novel-tools.mjs') -Force
Write-Host "    headless patch 已注入：$headlessDir"

Write-Host ''
Write-Host '✔ 安装完成。'
Write-Host '  1) 请确认 novel-studio 服务端已覆盖 novel-studio-patch 的 4 个文件并重启（npm start）。'
Write-Host '  2) 打开 novel-studio 使用 AI 创作即可，无需在 dsh 里手动选 preset。'
Write-Host '  3) 验证：cd <你的 deepseek-harness 目录>; pnpm dsh --profile headless "只输出一行：你当前可用的全部工具名称，用逗号分隔"'
