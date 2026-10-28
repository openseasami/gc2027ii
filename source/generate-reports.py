"""Generate bounded verification/ability reports from executed JSON evidence."""
from pathlib import Path
import collections
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
def read(name):
    return json.loads((ROOT / name).read_text())
def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def md(name, text):
    (ROOT / name).write_text(text.strip() + '\n')

d = read('source/data.json')
data = read('reference/DATA_AUDIT.json')
unit = read('reference/UNIT_RESULTS.json')
numeric = read('reference/NUMERIC_RESULTS.json')
speed = read('reference/SPEED_RESULTS.json')
multi = read('reference/MULTIHIT_RESULTS.json')
browser = read('reference/BROWSER_RESULTS.json')
passed = [x for x in numeric['cases'] if x['status'] == 'passed']
unverified = [x for x in numeric['cases'] if x['status'] == 'unverified']
request = (ROOT / 'source/DEVELOPMENT_REQUEST.txt').read_text()
section = request.split('## 7. 特性の実装対象')[1].split('### 7-6.')[0]
names = re.findall(r'^- (.+)$', section, re.M)
abilities = {a['jp']: a for a in d['abilities']}
history = {'Intimidate','Defiant','Competitive','Contrary','Simple'}
setters = {'Drought','Drizzle','Sand Stream','Snow Warning','Electric Surge','Grassy Surge','Psychic Surge','Misty Surge'}
speed_abilities = {'Swift Swim','Chlorophyll','Sand Rush','Slush Rush'}
rows = []
for jp in names:
    ab = abilities.get(jp)
    en = ab['name'] if ab else None
    owners = [s['id'] for s in d['species'] if en in s['abilities']] if en else []
    evidence = [c['id'] for c in passed if c.get('aa') == en or c.get('da') == en or en and en in c['id']]
    if not owners:
        mode = '利用可能モデルに対象所有者なし／有効組合せを作らない'
    elif en in history:
        mode = '現在ランクの直接参照を検証。発動履歴・自動増減は対象外'
        evidence = [c['id'] for c in passed if c['id'].startswith('manual-ranks/' + en + '/')]
    elif en in setters:
        mode = '手動の天候・フィールドを優先することを検証。登場時上書きなし'
        evidence = [c['id'] for c in passed if c['id'] == 'manual-field/' + en]
    elif en in speed_abilities:
        mode = '指定天候下の素早さ補正を比較検証'
        evidence = [f"speed/{c['id']}/{c['weather']}/{c['fast']}" for c in speed['cases'] if c.get('ability') == en]
    elif en == 'Overcoat':
        mode = '登録あり。粉技の成否・天候定数ダメージは対象外。免疫効果の直接検証は未実施'
        evidence = []
    elif evidence:
        mode = 'ダメージ効果を比較検証（記録した技・条件の範囲）'
    else:
        mode = '名称・候補登録あり。効果の直接比較は未検証'
    notes = []
    if en in {'Multiscale','Shadow Shield'}:
        notes.append('HP満タン有効・無効の参考条件。現在HPを確定しない')
    if en == 'Friend Guard':
        notes.append('隣接する場の味方のみ。自身と控えの発動を除外')
    if en in {'Fairy Aura','Dark Aura'}:
        notes.append('場の双方へ適用。控えの発動を除外')
    if en == 'Flash Fire':
        notes.append('防御免疫と発動済み攻撃補正を別条件で比較。発動履歴は追わない')
    if en == 'Mold Breaker':
        notes.append('浮遊・マルチスケイル等の無視と持ち物の複合条件を比較。全無視対象の網羅は未認証')
    rows.append(dict(jp=jp,name=en,registered=bool(ab),ownerCount=len(owners),owners=owners,scope=mode,evidence=evidence,notes=notes,fullSpecificationCertified=False))

write('reference/ABILITY_COVERAGE.json',dict(completion=False,requested=len(rows),effectOrPolicyTested=sum(bool(x['evidence']) for x in rows),entries=rows,meaning='Evidence certifies only the listed numerical or manual-input policies, not every ability interaction.'))
table = '\n'.join('| '+r['jp']+' | '+str(r['ownerCount'])+' | '+r['scope']+' | '+str(len(r['evidence']))+' |' for r in rows)
md('docs/ABILITIES.md',f'''# 指定特性の実装・検証一覧

名称登録、利用可能なモデル所有者、効果または入力方針の比較検証を区別します。指定{len(rows)}特性のうち{sum(bool(x['evidence']) for x in rows)}特性に直接のテスト証拠があります。証拠がないものを効果実装完了とは判定しません。所有者数は公式許可数ではなく386候補形態内の数です。

| 特性 | 所有形態数 | 対応・確認範囲 | 証拠件数 |
|---|---:|---|---:|
{table}

具体的な所有者・テストID・HP条件等は `reports/ABILITY_COVERAGE.json` を参照してください。名称だけの登録を完成扱いしていません。通常16乱数のダメージ、無効化、場の補正は対応するChampionsモデルを使用し、全相互作用の認証とは分けて記録しています。

場のオーラは両側へ、フレンドガード等は対象の隣接味方へ反映します。控えは場の特性源に含めません。手動ランクと天候・フィールドを優先し、登場時・消費時の履歴を推測しません。HP・発動条件が不明な場合は参考条件または未計算です。
''')

core = (ROOT / 'source/core.cjs').read_text()
excluded = dict(re.findall(r"(\w+):'([^']+)'",core.split('const EXCLUDED_MOVES={')[1].split('};')[0]))
write('reference/UNCONFIRMED.json',dict(completion=False,officialEligibility=dict(unconfirmed=386,confirmed=0,reason='Official JavaScript roster body unavailable; direct retrieval 403'),officialNumericFormula='unconfirmed; only community implementation agreement',uncomparedSpeciesAliases=data['uncomparedWithCalc'],cosmeticEnglishLabels=data['cosmeticLabelsInEnglish'],numericUnverified=unverified,unsupportedMoves=excluded,conditionalMoves=['brine','assurance','payback','revenge','avalanche','lashout','retaliate'],statistics='No source/date; uploaded v8 percentages withheld',windowsNative=False,fileProtocol='Managed policy blocked; no bypass',limitations=['Representative hypotheses are not all opponent spreads/items/ability combinations','Full accuracy/reaction/KO stopping of multi-hit moves unverified','Intact Disguise and physical Ice Face unimplemented','History, AI, prediction, residuals and full battles are out of scope']))

report = dict(completion=False,decision='技術検証済み・完成判定保留',dateJST='2026-10-28',blockingConfirmation=['Official full M-C roster unavailable','Official numeric formula and real-game comprehensive values not acquired'],data=dict(candidateForms=386,mega=82,statDataCompared=data['statsCompared'],statDataMismatches=len(data['mismatches']),uncomparedAliases=len(data['uncomparedWithCalc'])),unit=dict(groups=len(unit['checks']),statFormulaComparisons=unit['statComparisons'],passed=unit['passed']),numeric=dict(passedCases=len(passed),unverifiedCases=len(unverified),failedCases=len(numeric['failures']),independentRolls=numeric['comparisons'],distinctMoves=len(set(c['move'] for c in passed))),multi=dict(passed=multi['passed'],cases=len(multi['cases']),independentPerHitRolls=multi['comparisons']),speed=dict(passed=speed['passed'],cases=len(speed['cases']),unverified=len(speed['unverified'])),browser=dict(passed=browser['passed'],profiles=[dict(brand=p['brand'],version=p['version'],layouts=len(p['layouts']),updateMs=p['updateMs']) for p in browser['profiles']],nativeWindows=False,externalOffline=True),htmlSha256=hashlib.sha256((ROOT/'release/GC2027II_Viewer_v9.html').read_bytes()).hexdigest())
assert unit['passed'] and numeric['passed'] and multi['passed'] and speed['passed'] and browser['passed']
write('reference/VERIFICATION_REPORT.json',report)
browser_text='\n'.join(f"- {p['brand']} {p['version']}：{len(p['layouts'])}画面幅、条件変更後の描画処理 {min(p['updateMs']):.1f}～{max(p['updateMs']):.1f} ms（自動計測）。" for p in browser['profiles'])
md('docs/VERIFICATION_REPORT.md',f'''# 検証結果（2026-10-28 JST）

**技術検証済み・完成判定保留。`completion: false`。** 公式のM-C全使用可能一覧と数値仕様・実機全条件が未照合です。テスト件数だけで公式適合・完成と判定していません。

| 試験 | 実行結果 |
|---|---|
| 候補データ | 386形態・メガ82。公式全件適合は未確認 |
| 6種族値の二実装照合 | 357形態×6＝{data['statsCompared']}値、不一致0。別名のない29形態は別枠 |
| 能力ポイント・性格・端数処理 | 全386形態×25性格×3配分×6能力＝{unit['statComparisons']:,}値、一致 |
| 単体・データ保護 | {len(unit['checks'])}グループ成功 |
| 独立した単発ダメージ | {len(passed):,}ケース・{numeric['comparisons']:,}乱数一致、不一致0 |
| 除外した未検証ケース | {len(unverified)}件。成功件数に含めない |
| 連続技 | {len(multi['cases'])}ケース・{multi['comparisons']}各ヒット乱数一致。1～最大ヒットの合算も一致 |
| 素早さ | {len(speed['cases'])}独立ケース一致 |
| 実ブラウザ | Chromium・実Edge Linux、各4画面幅、両方成功 |

ダメージ比較対象はPokémon Showdownの**Champions専用mod**、コミット `1242c1e2d9763ba5b85d33f13aecb89bae19ae3d` です。表示エンジンは `@smogon/calc@0.12.0` の世代0。通常第9世代をChampionsと同一視していません。数値比較は{len(set(c['move'] for c in passed))}種類の技を含みますが、全526技や全組合せの完了は主張しません。

天候5×フィールド5、16種族の複数技、配分・性格・ランク・火傷、急所、主要攻撃・防御特性、半減実、いのちのたま等、オーラ双方・控え不発・隣接フレンドガード・かたやぶり・手動場優先を比較。ボディプレス、イカサマ、サイコショック、必中急所の例、やけっぱち等の75/150、発動済みもらいびも含みます。すべての技と習得・使用許可の組合せを認証する試験ではありません。

## ブラウザ操作

{browser_text}

6体を実際の画像選択・フォーム・項目操作から登録し、技・特性・持ち物・性格・ポイント・保存を確認しました。味方2体選択、メガ前後、相手2体、ランク・各個体の火傷・場・TR、8対面表示、最大3パターンの重複排除、控え32比較、JSON実ダウンロード・読込確認・不正データの非反映・復元・再読込、v8ポイント移行を実行。戦闘状態の注入はしていません。

1440×1080、1366×768、1280×720、390×844で横はみ出しなし、画像欠落0、相手2体横並び。PCの主要計算見出しはy=622に配置。縦スクロールで8対面を閲覧し、すべてを1画面へ縮小はしません。

外部通信を遮断しローカルHTTPだけを許可した状態で、v9の外部リクエスト0・ページ例外0。Linuxでの実Edgeであり、Windows実機・人間の操作速度・file://直接起動は認証していません。自動処理時間は人間の判断時間ではありません。

## 証拠と配布検証

各ケースは `reports/*_RESULTS.json`、データは `DATA_AUDIT.json`、特性は `ABILITY_COVERAGE.json`。初期の失敗も `NUMERIC_ATTEMPT1/2.json` と `INCIDENTS.json` に保持し、比較器の不備と本体の不具合を区別しています。実ZIPの再展開・内容ハッシュ・起動・外部通信遮断での再試験の結果は、ZIPの隣の `ARTIFACT_VERIFICATION.json` に記録します（ZIP自身を自己改変しないため外置き）。
''')
print('Reports generated:',len(rows),'requested abilities;',len(passed),'passed damage cases;',len(unverified),'unverified')
