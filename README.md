# Novel Writing 鍒涗綔鎻掍欢锛堝唴缃増 路 闈㈠悜 Novel Studio锛?

杩欐槸 **Novel Studio锛堝皬璇村垱浣滃伐鍧婏級鍐呯疆鐨勫垱浣滄彃浠?*锛氫笉鏄嫭绔嬪垎鍙戙€佷笉渚濊禆澶栭儴浠撳簱锛?
鎻掍欢鐨?dsh 渚ф簮鐮佷笌宸ュ潑鏈嶅姟绔垱浣滃唴鏍?*鍚屼粨缁存姢銆佷竴璧峰崌绾?*銆?

> **浠撳簱鍏崇郴**锛氭湰鐩綍鐨勮鑼冩簮鍦?novel-studio 浠撳簱鐨?`harness-plugins/novel-writing/`銆?
> 鑻ユ湰鐩綍鍚屾椂浠ョ嫭绔嬩粨搴擄紙bbaz123/novel-writing-plugin锛夊彂甯冿紝鍒欒浠撳簱鏄彂甯冮暅鍍忥細
> 涓や唤鏂囦欢鍐呭淇濇寔涓€鑷达紱瀹夎璇蜂紭鍏堜娇鐢?novel-studio 浠撳簱鍐呯殑鐗堟湰銆?

```
novel-studio/
鈹溾攢 db.js / server.js / harness.js / public/app.js   鈫?宸ュ潑涓讳綋锛堝垱浣滃唴鏍革細涓婁笅鏂囪閰?绾㈢嚎/浜嬩欢璐︽湰/璁板繂鐗堟湰/鎻愭纭锛?
鈹斺攢 harness-plugins/novel-writing/                   鈫?鏈彃浠讹紙dsh 渚у敮涓€鏉ユ簮锛?
   鈹溾攢 novel-tools.mjs           # novel_* 宸ュ叿闆嗭紙headless 涓?GUI preset 鍚屾簮锛?
   鈹溾攢 agent.cordis.yml          # GUI 浼氳瘽 preset锛堝啓浣滀汉璁?+ novel_* 宸ュ叿 + fs锛?
   鈹溾攢 preset.yml                # preset 鍏冧俊鎭?
   鈹溾攢 headless-cordis.patch.yml # 娉ㄥ叆 headless profile 鐨勫尯鍧楃墖娈碉紙鍚堝苟寮忓畨瑁咃級
   鈹溾攢 install.ps1               # 涓€閿畨瑁?鍗囩骇/鍗歌浇锛堝尯鍧楀悎骞躲€佷繚鐣欑敤鎴峰叾瀹?patch锛?
   鈹溾攢 plugin.json               # 娓呭崟锛氬伐鍏?绔偣/濂戠害锛堟枃妗ｄ笌娴嬭瘯鐨勫敮涓€鐪熸簮锛?
   鈹溾攢 test/smoke.mjs            # 绔埌绔啋鐑熸祴璇曪紙node:test锛?
   鈹溾攢 ENGINE.md                 # 鏋舵瀯銆佺鐐广€侀獙鏀剁粏鑺?
   鈹溾攢 NATIVE_PLUGIN_GUIDE.md    # 濡備綍鍦ㄥ伐鍧婂唴鎵╁睍鏈彃浠?
   鈹斺攢 README.md                 # 鏈枃浠?
```

## 瀹夎锛堜袱姝ワ級

```powershell
# 1) 宸ュ潑鏈綋锛氱洿鎺ヤ娇鐢?novel-studio 浠撳簱锛堝垱浣滃唴鏍稿凡鍐呯疆锛屾棤闇€瑕嗙洊浠讳綍琛ヤ竵鏂囦欢锛夈€?
#    閲嶅惎锛歯pm start锛堟暟鎹簱鍚姩鏃惰嚜鍔ㄨ縼绉绘柊琛?鏂板垪锛?

# 2) dsh 渚э紙鏈洰褰曪紱鍙戝竷闀滃儚浠撳簱涓湰鐩綍鍗充粨搴撴牴锛夛細
powershell -ExecutionPolicy Bypass -File .\install.ps1
# 棰勬紨涓嶈惤鐩橈細鈥?install.ps1 -DryRun    鍗歌浇锛氣€?install.ps1 -Uninstall
```

瀹屾垚鍚庢墦寮€ novel-studio 浣跨敤 AI 鍒涗綔鍗冲彲鈥斺€斿悗鍙?headless dsh 鑷姩鎼哄甫 novel 宸ュ叿涓庡垱浣滅邯寰嬶紝
鏃犻渶鍦?dsh 鐣岄潰鎵嬪姩閫?preset锛堣韩浠界粡 `NOVELSTUDIO_WORK_ID/CHAPTER_ID/MODE` 鐜鍙橀噺娉ㄥ叆锛夈€?

## 楠岃瘉

```bash
# 鏈嶅姟绔啋鐑熸祴璇曪紙涓嶄緷璧?dsh锛岀函 HTTP 鏂█锛涢渶鑳藉畾浣嶅埌 novel-studio 浠撳簱锛?
# 鎴栫敤 NOVELSTUDIO_REPO 鐜鍙橀噺鎸囧畾鍏舵牴鐩綍锛?
node test/smoke.mjs

# dsh 渚у伐鍏风洰褰?
cd <浣犵殑 deepseek-harness 鐩綍>
pnpm dsh --profile headless "鍙緭鍑轰竴琛岋細浣犲綋鍓嶅彲鐢ㄧ殑鍏ㄩ儴宸ュ叿鍚嶇О锛岀敤閫楀彿鍒嗛殧"
# 鏈熸湜鍑虹幇锛歯ovel_context, novel_works, novel_lookup, novel_scan, novel_style_contract,
#           novel_event_add, novel_memory_update, novel_foreshadows, novel_consistency, novel_chapter_save
```

## 宸ュ叿涓€瑙?

| 宸ュ叿 | 浣滅敤 |
| --- | --- |
| `novel_context` | 鍙栦綔鍝?绔犺妭鍒嗗眰涓婁笅鏂囷紙澶х翰/璁板繂/浜嬩欢/鏈棴鍚堜紡绗?鍓嶅悗绔犺鎺?瑙掕壊鍗?婵€娲讳笘鐣岃/绾㈢嚎锛夛紝鍒嗗眰棰勭畻鎴柇 |
| `novel_works` | 鍒楀嚭浣滃搧锛堢‘璁?work_id锛?|
| `novel_lookup` | 鍏抽敭璇嶆绱㈣鑹?璇嶆潯/绔犺妭/鍓ф儏绾匡紙鍐欏墠鏌ヨ瘉璁惧畾锛?|
| `novel_foreshadows` | 鍒楀嚭鏈棴鍚堬紙鎴栧叏閮級浼忕瑪 |
| `novel_consistency` | 鎴愭枃鍚庝竴鑷存€ф牳瀵癸細鏈棴鍚堜紡绗?鍑哄満瑙掕壊鐘舵€?鏈€杩戜簨浠?vs 姝ｆ枃 |
| `novel_scan` | 纭畾鎬у弽 AI 鑵旂孩绾挎壂鎻忥紙鍙烦杩囧紩鍙峰唴瀵硅瘽锛?|
| `novel_style_contract` | 璇诲彇鍐欎綔绾㈢嚎娓呭崟 |
| `novel_event_add` | 浜嬩欢/浼忕瑪/鐘舵€佸彉鍖栧叆璐︼紙浼忕瑪鐘舵€佷笌鍥炴敹銆佸箓绛夊幓閲嶏紱headless 鍏堣惤鎻愭锛?|
| `novel_memory_update` | 闀挎湡璁板繂鎽樿鍘嬬缉/澧為噺鎻愪氦锛堢増鏈揩鐓у彲鍥炴粴锛沨eadless 鍏堣惤鎻愭锛?|
| `novel_chapter_save` | 鎴愮鍐欏洖绔犺妭姝ｆ枃锛堟棫绋胯嚜鍔ㄥ瓨鍘嗗彶鐗堟湰锛岃繑鍥炵孩绾挎壂鎻忥級 |

## 鍏抽敭鏈哄埗

- **鎻愭纭锛坔eadless 闃叉薄鏌擄級**锛歯ovel-studio 缃戦〉鍚姩鐨勪换鍔″甫 `NOVELSTUDIO_PROPOSE_MODE=1`锛?
  AI 鐨勪簨浠?璁板繂鍏ヨ处鍏堣惤鎻愭琛紝浠诲姟缁撴潫闅忕粨鏋滆繑鍥烇紱浣滆€呭湪銆孉I 鍐欎綔缁撴灉銆嶅脊绐楀嬀閫夐噰绾筹紝
  鎴栫◢鍚庡湪銆屽皬璇磋瀹?鈫?闀挎湡璁板繂 鈫?馃摜 寰呯‘璁ゆ彁妗堛€嶉噷澶勭悊銆侴UI dsh 浼氳瘽閲屼綔鑰呭湪鍦猴紝鐩存帴鍏ヨ处銆?
- **浼忕瑪闂幆**锛歚novel_foreshadows` 鏌ユ瑺璐?鈫?姝ｆ枃鏄惧紡鍛煎簲 鈫?`novel_event_add(resolves_event_id=鈥?`
  鑷姩鎶婃棫浼忕瑪鏍囪 resolved锛沗novel_context` 閲屽缁堝甫銆愭湭闂悎浼忕瑪銆戝眰銆?
- **鍒嗗眰涓婁笅鏂囬绠?*锛氭瘡灞傜嫭绔嬩笂闄愩€佺孩绾?瑙掕壊鍗′繚搴曘€佹€婚噺鏀舵暃鎴柇锛岃秴闀胯蹇嗘爣娉ㄥ帇缂╂彁绀猴紝
  涓嶅啀涓€鍒€鍒囩洸鎴€?
- **绾㈢嚎鎵弿**锛氶粯璁?28 鏉″弽 AI 鑵旂孩绾匡紝浣滃搧绾у彲瑕嗙洊锛坄PUT /api/novel/redlines`锛夛紱
  鎵弿鏀寔 `skip_dialogue`锛堝紩鍙峰唴鍙拌瘝涓嶈锛夛紝姝ｅ垯妯″紡鏈夐暱搴︿笂闄愪笌缂栬瘧鏍￠獙銆?
- **骞傜瓑涓庝繚鐣?*锛氫簨浠舵寜 `dedup_key` 鍘婚噸锛涜蹇嗙増鏈瘡浣滃搧淇濈暀鏈€杩?200 涓紝瓒呴檺鑷姩鍓櫎锛?
  姝ｆ枃鍐欏洖鍓嶈嚜鍔ㄥ瓨绔犺妭鍘嗗彶鐗堟湰銆?

## 瀹夊叏锛堟湰鍦板伐鍏蜂篃瑕侀槻锛?

- 鏈嶅姟绔笉鍐嶈繑鍥?`Access-Control-Allow-Origin: *`锛氳法婧愰〉闈㈡棤娉曡鍙栨湰鍦?API Key 涓庝綔鍝佹暟鎹紱
  娴忚鍣ㄨ法婧愬啓璇锋眰锛圥OST/PUT/DELETE锛変竴寰?403銆?
- 璇锋眰浣撲笂闄?2MB锛涚孩绾挎鍒欓暱搴︿笂闄?500锛涢潪娉?JSON/闈?JSON 鍝嶅簲鏄惧紡鎶ラ敊銆?

## 鍗歌浇 / 鍥為€€

```powershell
powershell -ExecutionPolicy Bypass -File .\harness-plugins\novel-writing\install.ps1 -Uninstall
```

- 鍒犻櫎 `~/.dsh/.agent-presets/novel-writing`锛圙UI preset锛?
- 浠?`~/.dsh/profiles/headless/cordis.patch.yml` 涓暣娈电Щ闄ゆ湰鎻掍欢鍖哄潡锛堜繚鐣欏叾瀹?patch 鏉＄洰锛?
- 宸ュ潑鏈嶅姟绔殑鏂拌〃/鏂板垪鍚戝悗鍏煎锛堟棫鍔熻兘涓嶅彈褰卞搷锛夛紝寤鸿淇濈暀

## 鐜瑕佹眰

- Windows锛堝畨瑁呰剼鏈负 PowerShell锛涙ā鍧椾负绾?ESM JS锛屾棤绗笁鏂逛緷璧栵級
- Node.js 22.5+锛坣ovel-studio 鏈綋锛? 宸叉瀯寤虹殑 deepseek-harness锛坉sh锛変粨搴?+ headless profile
- novel-studio 鏈湴鏈嶅姟锛坔ttp://127.0.0.1:3737锛?`PORT` 鍙鐩栵紱dsh 宸ュ叿閫氳繃 `NOVELSTUDIO_BASE_URL` 鑷姩瀹氫綅锛?
- 搴旂敤鏈綋锛歨ttps://github.com/bbaz123/novel-studio
