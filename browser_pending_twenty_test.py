"""Audit previously excluded twenty moves using real page calculators and pinned oracle."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
from hashlib import sha256
import json,subprocess
root=Path(__file__).resolve().parent
NAMES=['ツインビーム','ダブルウイング','いのちがけ','アイアンローラー','つけあがる','ふんどのこぶし','ドラゴンアロー','ネズミざん','いかりのまえば','ふくろだたき','ポルターガイスト','ひゃっきやこう','トリプルアクセル','しっぺがえし','とっておき','みずしゅりけん','やけっぱち','じわれ','ミラーコート','ぜったいれいど']
REASONS={
'ツインビーム':('existing-multihit-path','既存2連続処理が通常1発マトリクスから除外されていた'),
'ダブルウイング':('existing-multihit-path','既存2連続処理が通常1発マトリクスから除外されていた'),
'アイアンローラー':('field-condition','フィールド有無による成立判定が未接続'),
'つけあがる':('variable-power','正の全7能力ランク合計からの威力計算が未接続'),
'ひゃっきやこう':('status-condition','状態異常/ぜったいねむりによる倍威力が未接続'),
'ポルターガイスト':('item-condition','持ち物所持の成立条件が未接続。相手持ち物未確認時は計算保留'),
'いのちがけ':('special-damage','使用者の正確な現在HPを使う固定ダメージ経路が未実装。通常式では計算不可'),
'ふんどのこぶし':('missing-history','交代をまたいだ被命中回数が必要。ランクや現在HPから推測不可'),
'ドラゴンアロー':('multitarget-multihit','2体への振り分け/無効・守る時の再配分が未実装。範囲0.75倍ではない'),
'ネズミざん':('per-hit-accuracy','各打撃の命中/中断と最大10回・ダイスの回数分布が未実装'),
'いかりのまえば':('special-damage','対象の正確な現在HPの半分を使う特殊ダメージ経路が未実装'),
'ふくろだたき':('party-dependent','参加可能な非瀕死/非状態異常の各味方の種族攻撃値から1発ずつ算定する経路が未実装'),
'トリプルアクセル':('per-hit-power-accuracy','20/40/60の威力推移、各打撃命中と中断が未実装'),
'しっぺがえし':('same-turn-order','対象の当該ターン行動済み情報と交代扱いが必要。単なる素早さ比較で代用不可'),
'とっておき':('missing-history','実際の4技構成と他の全技使用履歴による成立判定が未実装'),
'みずしゅりけん':('variable-multihit','2〜5打撃と特定形態/特性の例外を含む集計が未接続'),
'やけっぱち':('missing-history','前ターンの失敗/行動不能/交代の区別と保存履歴が未接続'),
'じわれ':('ohko','通常ダメージ式の対象外。レベル条件/地面無効/がんじょう/一撃必殺命中の専用経路が未実装'),
'ミラーコート':('received-damage','当該ターンに受けた特殊ダメージ/攻撃者/対象指定の専用経路が未実装'),
'ぜったいれいど':('ohko','通常式の対象外。レベル/氷タイプ使用者の命中差・氷対象無効等の専用経路が未実装')}
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  data=page.evaluate('''names=>{
   const enabled=['ツインビーム','ダブルウイング','アイアンローラー','つけあがる','ポルターガイスト','ひゃっきやこう'];
   const types={'ノーマル':'Normal','ほのお':'Fire','みず':'Water','でんき':'Electric','くさ':'Grass','こおり':'Ice','かくとう':'Fighting','どく':'Poison','じめん':'Ground','ひこう':'Flying','エスパー':'Psychic','むし':'Bug','いわ':'Rock','ゴースト':'Ghost','ドラゴン':'Dragon','あく':'Dark','はがね':'Steel','フェアリー':'Fairy'};
   const rows=[],metadata={};for(const n of names)metadata[n]={id:NATIONAL_MOVES[n].id,catalog:NATIONAL_MOVES[n],runtime:DAMAGE_MOVES[n],champions:REGULATION_MC.moveDetails[n],accuracy:MOVE_BASE_ACCURACY[n]};
   for(const name of enabled)for(const target of ['ミュウ','ギャラドス','バンギラス','ユキノオー','イーブイ','ブラッキー'])for(const path of ['outgoing','incoming'])for(const mode of ['base','rank','negative','maxboost','burn','poison','paralysis','sleep','freeze','comatose','grass','psychic','electric','mist','orb','screens','item','unknown-item','consumed-item','one-target']){
    const as=path==='outgoing'?'my':'opp',ds=as==='my'?'opp':'my',actor='ミュウ';state[as+'Team']=[actor,'イーブイ'];state[ds+'Team']=[target,'イーブイ'];state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};state.magicRoomTurns=0;
    for(const side of ['my','opp'])for(let i=0;i<2;i++){const d=ensureBattleEntry(side,i,state[side+'Team'][i]);Object.assign(d,{hp:100,status:'なし',ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,itemConsumed:false});for(const k of BATTLE_STAGE_KEYS)d[k]=0;}
    const aProfile=as==='my'?{nature:'まじめ',atk:32,spa:32}:{nature:DAMAGE_MOVES[name].cat==='phys'?'いじっぱり':'ひかえめ',atk:DAMAGE_MOVES[name].cat==='phys'?32:0,spa:DAMAGE_MOVES[name].cat==='spec'?32:0};savedMyProfiles[0]=as==='my'?aProfile:{nature:'まじめ'};savedMyProfiles[1]={nature:'まじめ'};
    if(mode==='rank'){state[as][0].atkStage=2;state[as][0].spaStage=1;state[as][0].accStage=2;state[as][0].evaStage=1;state[ds][0].defStage=state[ds][0].spdStage=1;}
    if(mode==='negative'){for(const k of BATTLE_STAGE_KEYS)state[as][0][k]=-6;}
    if(mode==='maxboost'){for(const k of BATTLE_STAGE_KEYS)state[as][0][k]=6;}
    if(mode==='burn')state[as][0].status='やけど';const statuses={poison:'どく',paralysis:'まひ',sleep:'ねむり',freeze:'こおり'};state[ds][0].status=statuses[mode]||'なし';if(mode==='comatose')state[ds][0].ability='ぜったいねむり';
    const item=mode==='orb'?'いのちのたま':'なし';state[as][0].item=item;if(as==='my')savedMyProfiles[0].item=item;
    const targetItem=mode==='item'?'いのちのたま':'なし';state[ds][0].item=targetItem;if(ds==='my')savedMyProfiles[0].item=mode==='unknown-item'?'不明':targetItem;else state[ds][0].itemConfirmed=mode!=='unknown-item';if(mode==='consumed-item'){state[ds][0].itemConsumed=true;state[ds][0].item='いのちのたま';}
    $('weather').value='なし';$('terrain').value={grass:'グラス',psychic:'サイコ',electric:'エレキ',mist:'ミスト'}[mode]||'なし';state.sideConditions={my:{reflect:0,lightScreen:0,auroraVeil:0},opp:{reflect:0,lightScreen:0,auroraVeil:0}};if(mode==='screens')Object.assign(state.sideConditions[ds],{reflect:5,lightScreen:5});if(mode==='one-target'){state.my[1].hp=state.opp[1].hp=0;}
    const before=JSON.stringify([state,savedMyProfiles]);const r=as==='my'?damageEstimate(actor,name,target,0,'neutral',0):opponentDamageEstimateAgainstMy({actor,move:name,kind:'attack'},{name:target,idx:0,d:state.my[0]});
    const total=as==='my'&&MULTI_HIT_SPECS[name]?multiHitKOEstimate(actor,name,target,0,'neutral',0,2):null;
    if(before!==JSON.stringify([state,savedMyProfiles]))throw Error('Calculation mutated state '+name);
    const stats=(n,profile)=>Object.fromEntries(['atk','def','spa','spd','spe'].map(k=>[k,calcRealStat(k==='spe'?BASE_SPEED[n]:BATTLE_DATA[n][k],profile[k]||0,profile.nature||'まじめ',k)]));
    const boostMap={atk:'atkStage',def:'defStage',spa:'spaStage',spd:'spdStage',spe:'speStage',accuracy:'accStage',evasion:'evaStage'},boosts=side=>Object.fromEntries(Object.entries(boostMap).map(([a,b])=>[a,state[side][0][b]]));const aBoosts=boosts(as),dBoosts=boosts(ds);
    const accuracy={};for(const [a,d]of [[0,0],[1,2],[2,1],[-1,-2],[6,-6]]){state[as][0].accStage=a;state[ds][0].evaStage=d;accuracy[[a,d].join(',')]=effectiveMoveAccuracy(name,as,0,ds,0).accuracy;}
    const unknown=name==='ポルターガイスト'&&mode==='unknown-item',valid=name==='アイアンローラー'?$('terrain').value!=='なし':name==='ポルターガイスト'?mode==='item':true;
    rows.push({id:[path,name,target,mode].join('/'),name,move:NATIONAL_MOVES[name].id,sourceId:NATIONAL_DEX[actor].id,targetId:NATIONAL_DEX[target].id,aTypes:BATTLE_DATA[actor].types.map(t=>types[t]),dTypes:BATTLE_DATA[target].types.map(t=>types[t]),aStats:stats(actor,aProfile),dStats:stats(target,ds==='my'?savedMyProfiles[0]:{}),aHp:calcRealHP(BATTLE_DATA[actor].hp,0),dHp:r?.fullHp||r?.hp||calcRealHP(BATTLE_DATA[target].hp,0),aBoosts,dBoosts,burn:mode==='burn',status:{poison:'psn',paralysis:'par',sleep:'slp',freeze:'frz'}[mode]||'',comatose:mode==='comatose',terrain:{grass:'grassyterrain',psychic:'psychicterrain',electric:'electricterrain',mist:'mistyterrain'}[mode]||'',item:mode==='orb'?'lifeorb':'',targetItem:mode==='item'?'lifeorb':'',screen:mode==='screens'?DAMAGE_MOVES[name].cat==='phys'?'reflect':'lightscreen':'',singleTarget:mode==='one-target',valid,unknown,rolls:r?.rolls?.length===1?Array(16).fill(r.rolls[0]):r?.rolls,accuracy,totalDistribution:total?.damageDistribution});
   }
   for(const n of names.filter(n=>!enabled.includes(n)&&!['やけっぱち','トリプルアクセル','ネズミざん'].includes(n))){const r=damageEstimate('ミュウ',n,'イーブイ',0,'neutral',0);if(r?.rolls?.length)throw Error('Unsupported move silently calculated '+n);}
   return {rows,metadata};
  }''',NAMES);browser.close()
 oracle=json.loads(subprocess.check_output(['node','pending-move-oracle.js'],input=json.dumps(data['rows']),text=True,cwd=root))
 ref=json.load(open(root/'reference-data/stats-moves/showdown-normalized.json'));records=[]
 for name in NAMES:
  m=data['metadata'][name];external=ref['moves'][m['id']];g=external['general'];c=external['champions']
  for key in ['power','type','cat','accuracy']:assert m['catalog'][key]==g[key],(name,key)
  for key in ['power','type','cat','accuracy','spread']:assert m['champions'][key]==c[key],(name,key)
  assert m['accuracy']==c['accuracy']
  case=oracle['byMove'].get(name);verified=bool(case and case['damageComparisons'] and case['accuracyComparisons'] and not case['failures'])
  records.append(dict(name=name,id=m['id'],initialReasonCategory=REASONS[name][0],initialReason=REASONS[name][1],metadataVerified=True,general=g,champions=c,runtime=m['runtime'],targetModifier='1.0 per target; no 0.75 spread reduction (Dragon Darts split is a separate unresolved route)',calculationStatus='verified-scoped' if verified else 'unverified',remaining=None if verified else REASONS[name][1],externalDataEvidence='reference-data/stats-moves/PROVENANCE.json',independentCalculationEvidence=case,scope='Explicit outgoing/incoming per-hit calculation; outgoing two-hit clipped total distribution for Twin Beam/Dual Wingbeat; successful-hit conditions only. No secondaries/recommendations.' if verified else 'Metadata only. No successful runtime damage comparison; not counted as calculation-verified.'))
 report=dict(completion=False,baseCommit='63c00636be95da872325e5828c37477edaab3f79',sourceSha256=sha256((root/'index.html').read_bytes()).hexdigest(),evidenceSha256={f:sha256((root/f).read_bytes()).hexdigest() for f in ['pending-move-oracle.js','browser_pending_twenty_test.py','reference-data/stats-moves/PROVENANCE.json','reference-data/stats-moves/showdown-normalized.json']},total=20,metadataVerified=20,calculationVerified=sum(r['calculationStatus']=='verified-scoped' for r in records),calculationUnverified=sum(r['calculationStatus']=='unverified' for r in records),newDamageHandlers=4,reusedDamageHandlers=2,moves=records,differential=oracle,limitations=['No official Champions engine certification. Numeric metadata comes from pinned Champions source; behavioral callbacks from pinned general Gen9 engine.','Unsupported mechanics have independent metadata/spec sources but no implemented, independently tested runtime damage route.','No Choice Band/Choice Specs, UI changes, species stat changes, secondary effects or recommendation redesign.'])
 (root/'PENDING_TWENTY_AUDIT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:report[k] for k in ['total','metadataVerified','calculationVerified','calculationUnverified']},ensure_ascii=False),json.dumps(oracle,ensure_ascii=False)[:1600]);assert not oracle['failureCount'],oracle['failures'][:12]
finally:server.shutdown()
