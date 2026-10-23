"""Real browser calculation and stamped history tests, limited to three requested attacks."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
from hashlib import sha256
import json,subprocess
root=Path(__file__).resolve().parent
for name,record in json.load(open(root/'reference-data/three-attacks/PROVENANCE.json'))['files'].items():
 assert sha256((root/'reference-data/three-attacks'/name).read_bytes()).hexdigest()==record['savedSha256'],name
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  data=page.evaluate('''()=>{
   const types={'ノーマル':'Normal','ほのお':'Fire','みず':'Water','でんき':'Electric','くさ':'Grass','こおり':'Ice','かくとう':'Fighting','どく':'Poison','じめん':'Ground','ひこう':'Flying','エスパー':'Psychic','むし':'Bug','いわ':'Rock','ゴースト':'Ghost','ドラゴン':'Dragon','あく':'Dark','はがね':'Steel','フェアリー':'Fairy'};
   const rows=[],names=['やけっぱち','トリプルアクセル','ネズミざん'];
   for(const name of names)for(const actor of name==='やけっぱち'?['リザードン','ミュウ']:name==='トリプルアクセル'?['マニューラ','カポエラー']:['イッカネズミ','ミュウ'])for(const target of ['ミュウ','バンギラス','ユキノオー','ゲンガー'])for(const side of ['my','opp'])for(const critical of [false,true])for(const mode of ['base','rank','negative','burn','orb','lens','dice','technician','skilllink','compoundeyes','hustle','noguard','lens-ranks','tech-lens','tech-dice','tech-orb','skill-dice','skill-lens','noguard-dice','screens','sash','sturdy','stamina'])for(const previous of name==='やけっぱち'?['success','failed']:['success']){
    if(['sash','sturdy','stamina'].includes(mode)&&(target!=='ミュウ'||name==='やけっぱち'))continue;
    const other=side==='my'?'opp':'my';battleTurnNumber=3;state[side+'Team']=[actor,'イーブイ'];state[other+'Team']=[target,'イーブイ'];state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};state.magicRoomTurns=0;
    for(const s of ['my','opp'])for(let i=0;i<2;i++){const d=ensureBattleEntry(s,i,state[s+'Team'][i]);Object.assign(d,{hp:100,status:'なし',ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,itemConsumed:false,damagePreviousTurn:{turn:2,result:previous}});for(const k of BATTLE_STAGE_KEYS)d[k]=0;}
    const ability={'tech-lens':'テクニシャン','tech-dice':'テクニシャン','tech-orb':'テクニシャン','skill-dice':'スキルリンク','skill-lens':'スキルリンク','noguard-dice':'ノーガード',technician:'テクニシャン',skilllink:'スキルリンク',compoundeyes:'ふくがん',hustle:'はりきり',noguard:'ノーガード'}[mode]||'なし';state[side][0].ability=ability;
    const item={'tech-lens':'こうかくレンズ','tech-dice':'いかさまダイス','tech-orb':'いのちのたま','skill-dice':'いかさまダイス','skill-lens':'こうかくレンズ','noguard-dice':'いかさまダイス',orb:'いのちのたま',lens:'こうかくレンズ','lens-ranks':'こうかくレンズ',dice:'いかさまダイス'}[mode]||'なし';state[side][0].item=item;
    const profile=side==='my'?{nature:'まじめ',atk:32,spa:32,item}:{nature:'いじっぱり',atk:32,spa:0};savedMyProfiles[0]=side==='my'?profile:{nature:'まじめ',item:'なし'};savedMyProfiles[1]={nature:'まじめ',item:'なし'};
    if(mode==='rank'||mode==='lens-ranks'){state[side][0].atkStage=2;state[other][0].defStage=1;state[side][0].accStage=1;state[other][0].evaStage=2;}
    if(mode==='negative'){state[side][0].atkStage=-2;state[other][0].defStage=-1;state[side][0].accStage=-1;state[other][0].evaStage=1;}
    if(mode==='burn')state[side][0].status='やけど';$('weather').value='なし';$('terrain').value='なし';state.sideConditions={my:{reflect:0,lightScreen:0,auroraVeil:0},opp:{reflect:0,lightScreen:0,auroraVeil:0}};
    state[other][0].ability={sturdy:'がんじょう',stamina:'じきゅうりょく'}[mode]||'なし';if(mode==='sash'){state[other][0].item='きあいのタスキ';if(other==='my')savedMyProfiles[0].item='きあいのタスキ';}
    if(mode==='screens')state.sideConditions[other].reflect=5;
    const before=JSON.stringify([state,savedMyProfiles]);const spec=MULTI_HIT_SPECS[name],max=spec?.max||1;
    const strikes=[];for(let hit=1;hit<=max;hit++){const power=spec?multiHitStrikePower(name,hit):null;const r=side==='my'?damageEstimate(actor,name,target,0,'neutral',0,power,critical):opponentDamageEstimateAgainstMy({kind:'attack',actor,move:name},{idx:0,name:target,d:state.my[0]},power,critical);if(!r?.rolls?.length)throw Error('Missing strike '+name);strikes.push(r.rolls.length===1?Array(16).fill(r.rolls[0]):r.rolls);}
    const sequence=spec&&['base','rank','technician','orb','tech-lens','tech-dice','tech-orb','skill-dice','skill-lens','noguard-dice','screens','sash','sturdy','stamina'].includes(mode)?multiHitKOEstimate(actor,name,target,0,'neutral',0,max,{side,critical}):null;
    let distribution=null;if(spec&&side==='my'&&!critical&&target==='ミュウ'){
      const meta=multiHitOutcomeDistribution(name,0,0,side);distribution=Object.fromEntries([[0,1-meta.accuracy],...meta.distribution.map(([n,p])=>[n,p*meta.accuracy])]);
      const display=damageEstimateForDisplay(actor,name,target,0,'neutral',0);if(!display.multiHit||display.multiHit.length!==max)throw Error('Missing hit totals in display '+name);
      if(meta.accuracy<1&&/確定KO/.test(display.ko))throw Error('Accuracy uncertain but certain KO displayed '+name);
    }
    if(before!==JSON.stringify([state,savedMyProfiles]))throw Error('Estimate mutated state '+name);
    const stats=(n,p)=>Object.fromEntries(['atk','def','spa','spd','spe'].map(k=>[k,calcRealStat(k==='spe'?BASE_SPEED[n]:BATTLE_DATA[n][k],p[k]||0,p.nature||'まじめ',k)]));
    rows.push({id:[name,actor,target,side,critical,mode,previous].join('/'),name,move:NATIONAL_MOVES[name].id,sourceId:NATIONAL_DEX[actor].id,targetId:NATIONAL_DEX[target].id,aStats:stats(actor,profile),dStats:stats(target,other==='my'?savedMyProfiles[0]:{}),aHp:calcRealHP(BATTLE_DATA[actor].hp,0),dHp:calcRealHP(BATTLE_DATA[target].hp,0),aBoosts:{atk:state[side][0].atkStage,accuracy:state[side][0].accStage},dBoosts:{def:state[other][0].defStage,evasion:state[other][0].evaStage},ability:{'tech-lens':'technician','tech-dice':'technician','tech-orb':'technician','skill-dice':'skilllink','skill-lens':'skilllink','noguard-dice':'noguard',technician:'technician',skilllink:'skilllink',compoundeyes:'compoundeyes',hustle:'hustle',noguard:'noguard'}[mode]||'Run Away',item:{'tech-lens':'widelens','tech-dice':'loadeddice','tech-orb':'lifeorb','skill-dice':'loadeddice','skill-lens':'widelens','noguard-dice':'loadeddice',orb:'lifeorb',lens:'widelens','lens-ranks':'widelens',dice:'loadeddice'}[mode]||'',screen:mode==='screens',targetAbility:{sturdy:'sturdy',stamina:'stamina'}[mode]||'',targetItem:mode==='sash'?'focussash':'',critical,burn:mode==='burn',previous,strikes,totals:sequence?.byCount.map(r=>r.damageDistribution),hitDistribution:distribution});
   }
   // Unknown/stale history must show both powers, with no certain KO/raw rolls.
   state.myTeam=['リザードン','イーブイ'];state.oppTeam=['ミュウ','イーブイ'];state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};for(const s of ['my','opp'])for(let i=0;i<2;i++){const d=ensureBattleEntry(s,i,state[s+'Team'][i]);Object.assign(d,{hp:100,ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true});}savedMyProfiles[0]={nature:'まじめ',atk:32,item:'なし'};battleTurnNumber=3;
   const checks=[];for(const record of [null,{turn:1,result:'failed'},{turn:2,result:'unknown'}]){state.my[0].damagePreviousTurn=record;const r=damageEstimateForDisplay('リザードン','やけっぱち','ミュウ',0,'neutral',0);if(r.rolls||r.ko||!r.text.includes('威力75')||!r.text.includes('威力150')||!r.text.includes('参考推定'))throw Error('Unknown history overclaimed');checks.push('unknown-dual-power');}
   state.opp[0].damagePreviousTurn=null;state.opp[0].moves=['やけっぱち'];const incoming=previewIncomingDamage(0,'やけっぱち',0);if(incoming.ok||!incoming.reason.includes('威力75')||!incoming.reason.includes('威力150')||!incoming.uncertainPower)throw Error('Incoming unknown power not shown');checks.push('incoming-unknown-dual-reference-no-auto-apply');
   for(const result of ['failed','success','other']){state.my[0].damagePreviousTurn={turn:2,result};const r=resolveMoveForDamage('my',0,'リザードン','やけっぱち',DAMAGE_MOVES['やけっぱち'],'opp',0,'ミュウ');if(r.power!==(result==='failed'?150:75)||r.powerUnknown)throw Error('Wrong recorded history');checks.push('history-'+result);}
   // Use the real turn-commit path, then saving/restoring and undo snapshots.
   state.my[0].currentTurnAction={kind:'move',move:'まもる',failed:true};state.opp[0].currentTurnAction={kind:'move',move:'まもる',failed:false};commitTurnActions();battleTurnNumber++;
   if(state.my[0].damagePreviousTurn.result!=='failed'||state.my[0].damagePreviousTurn.turn!==3)throw Error('Commit failed to stamp result');const transaction=captureTurnCommitTransaction();state.my[0].damagePreviousTurn={turn:99,result:'success'};battleTurnNumber=100;restoreTurnCommitTransaction(transaction);if(state.my[0].damagePreviousTurn.turn!==3||battleTurnNumber!==4)throw Error('Undo history mismatch');checks.push('transaction-history-undo');const saved=JSON.stringify(state),old=JSON.stringify(state.my[0].damagePreviousTurn);Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,JSON.parse(saved));if(JSON.stringify(state.my[0].damagePreviousTurn)!==old)throw Error('Saved history lost');checks.push('real-commit-history-save');
   state.myTeam=['イッカネズミ','マニューラ'];state.oppTeam=['ミュウ','バンギラス'];state.my={};state.opp={};battleTurnNumber=3;
   for(const s of ['my','opp'])for(let i=0;i<2;i++){const d=ensureBattleEntry(s,i,state[s+'Team'][i]);Object.assign(d,{hp:100,ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,damagePreviousTurn:null});for(const k of BATTLE_STAGE_KEYS)d[k]=0;}
   savedMyProfiles[0]={nature:'まじめ',atk:32,item:'こうかくレンズ'};savedMyProfiles[1]={nature:'まじめ',atk:32,item:'いかさまダイス'};state.my[0].moves=['ネズミざん','やけっぱち'];state.my[1].moves=['トリプルアクセル','やけっぱち'];renderDamageOutput(true);
   const detail=document.querySelector('#damageOutput .damage-detail-shell:last-child');if(!detail.textContent.includes('10回')||!detail.textContent.includes('3回')||!detail.textContent.includes('威力75')||!detail.textContent.includes('威力150'))throw Error('Missing rendered results');checks.push('real-dom-all-hit-counts-and-both-temper-powers');
   const reference=damageEstimateForDisplay('イッカネズミ','ネズミざん','ミュウ',0,'neutral',0);if(reference.ko.includes('確定KO'))throw Error('Lens still has miss probability');
   state.opp[0].item='オボンのみ';const unsafe=damageEstimateForDisplay('イッカネズミ','ネズミざん','ミュウ',0,'neutral',0);if(unsafe.koChance!==null||!unsafe.ko.includes('参考推定')||unsafe.ko.includes('確定KO'))throw Error('Unverified mid-hit recovery overclaimed');checks.push('unsupported-reaction-reference-only');
   state.myTeam=['イッカネズミ','マニューラ','リザードン','ミュウ','カポエラー','イーブイ'];state.oppTeam=['ミュウ','バンギラス','ゲンガー','ユキノオー','イーブイ','リザードン'];state.mySelected=[0,1,2,3];
   for(const s of ['my','opp'])for(let i=0;i<6;i++)ensureBattleEntry(s,i,state[s+'Team'][i]);state.my[0].damagePreviousTurn={turn:2,result:'failed'};battleTurnNumber=3;
   if(!save())throw Error('Persistent save failed');state.my[0].damagePreviousTurn=null;battleTurnNumber=100;load();if(state.my[0].damagePreviousTurn?.result!=='failed'||battleTurnNumber!==3)throw Error('Persistent restore lost previous turn');checks.push('real-local-storage-save-load-history');
   const hitSnapshot=captureTurnCommitTransaction();state.my[0].hp=100;state.my[0].defStage=0;state.my[0].ability='じきゅうりょく';const observed=applyConfirmedIncomingHit(0,50,10);if(!observed.ok||observed.hits!==10||state.my[0].defStage!==6)throw Error('Ten observed incoming hits unsupported '+JSON.stringify(observed)+' def='+state.my[0].defStage);if(applyConfirmedIncomingHit(0,40,11).ok)throw Error('Invalid hit count accepted');restoreTurnCommitTransaction(hitSnapshot);checks.push('observed-ten-hit-record-and-cap');
   const switchSnapshot=captureTurnCommitTransaction();state.my[2].damagePreviousTurn={turn:2,result:'failed'};state.my[2].hp=100;
   if(!recordSwitchForSlot('my',0,2))throw Error('Switch fixture invalid');commitTurnActions();const entered=ThreeAttackEffects.temperPower(state.my[2].damagePreviousTurn,battleTurnNumber);if(!entered.known||entered.power!==75)throw Error('Switch retained previous failure');battleTurnNumber++;const next=ThreeAttackEffects.temperPower(state.my[2].damagePreviousTurn,battleTurnNumber);if(!next.known||next.power!==75)throw Error('Next-turn entry history wrong');restoreTurnCommitTransaction(switchSnapshot);checks.push('real-switch-clears-failure-current-and-next-turn');
   savedMyMoves[0]=['やけっぱち'];savedMyMoves[1]=['トリプルアクセル','ネズミざん'];state.my[0].moves=[...savedMyMoves[0]];state.my[1].moves=[...savedMyMoves[1]];state.my[0].damagePreviousTurn=null;state.my[1].damagePreviousTurn=null;state.opp[0].item='なし';renderDamageOutput(true);
   return {rows,checks,metadata:Object.fromEntries(names.map(n=>[n,{national:NATIONAL_MOVES[n],runtime:DAMAGE_MOVES[n],champions:REGULATION_MC.moveDetails[n],accuracy:MOVE_BASE_ACCURACY[n]}]))};
  }''')
  ui_checks=[]
  for width,height in [(1366,768),(1920,1080),(1280,720),(1093,614)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(100)
   geometry=page.evaluate('''()=>{const r=document.querySelector('.damage-follow-rail').getBoundingClientRect();return {width:r.width,top:r.top,bottom:r.bottom,horizontal:document.documentElement.scrollWidth>innerWidth+1,rows:[...document.querySelectorAll('#damageOutput .damage-quick-target')].map(e=>{const x=e.getBoundingClientRect();return {visible:x.top>=r.top&&x.bottom<=r.bottom,overflow:e.scrollWidth>e.clientWidth+1,text:e.textContent}})}}''')
   assert geometry['width']<=301 and geometry['top']>=0 and geometry['bottom']<=height+1 and not geometry['horizontal'],geometry
   assert len(geometry['rows'])==4 and all(r['visible'] and not r['overflow'] for r in geometry['rows']),geometry
   assert all('威力75' in r['text'] and '威力150' in r['text'] for r in geometry['rows'][:2]),geometry
   ui_checks.append(dict(viewport=[width,height],**geometry))
  browser.close()
 reference=json.load(open(root/'reference-data/stats-moves/showdown-normalized.json'))
 for name,m in data['metadata'].items():
  e=reference['moves'][m['national']['id']]
  for k in ['power','type','cat','accuracy']:assert m['national'][k]==e['general'][k] and m['champions'][k]==e['champions'][k],(name,k)
  for k in ['power','type','cat']:assert m['runtime'][k]==e['champions'][k],(name,k)
  assert m['accuracy']==e['champions']['accuracy']
 result=json.loads(subprocess.check_output(['node','three-attack-oracle.js'],input=json.dumps(data['rows']),text=True,cwd=root))
 report=dict(completion=False,metadataVerified=3,calculationVerified=sum(v['damageComparisons']>0 and not v['failures'] for v in result['byMove'].values()),sourceSha256=sha256((root/'index.html').read_bytes()).hexdigest(),evidenceSha256={f:sha256((root/f).read_bytes()).hexdigest() for f in ['three-attack-effects.js','three-attack-oracle.js','browser_three_attacks_test.py','reference-data/three-attacks/PROVENANCE.json']},moves=[dict(name=n,basicCalculationVerified=result['byMove'][n]['damageComparisons']>0 and not result['byMove'][n]['failures'] and (n=='やけっぱち' or result['byMove'][n]['totalComparisons']>0 and result['byMove'][n]['probabilityComparisons']>0)) for n in ['やけっぱち','トリプルアクセル','ネズミざん']],differential=result,browserChecks=data['checks'],pcLayouts=ui_checks,limitations=['Gen9 community engine; not an official Champions simulator certification.','Unknown Temper Flare history shows 75/150 reference scenarios and is withheld from automatic incoming prediction.','Other eleven unverified attacks excluded from this audit.','Mixed accuracy/evasion ranks follow the pinned Showdown repeated-hit path (including its integer-event behavior), not officially certified game rounding. These are reference estimates and cannot produce certain KO.','Mid-strike contact recoil, ability/type changes and recovery berries are not fully simulated; recognized conditions withhold certain KO.','Critical damage is checked explicitly; routine displayed KO probabilities are conditional on non-critical strikes, not a mixture of random critical outcomes.'])
 (root/'THREE_ATTACKS_AUDIT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False)[:4000]);assert not result['failureCount'],result['failures'][:10]
finally:server.shutdown()
