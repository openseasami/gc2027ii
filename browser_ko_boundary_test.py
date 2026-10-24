"""Frozen actual-page stat/damage/KO audit; no app function replacement.

The 120-profile matrix isolates basic modifiers with confirmed no-effect abilities.
Existing sixteen real-ability matchups run separately in the full regressions.
"""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from hashlib import sha256
from playwright.sync_api import sync_playwright
import json, subprocess, time

ROOT=Path(__file__).resolve().parent
NATURES=[['まじめ','Serious'],['いじっぱり','Adamant'],['ようき','Jolly'],['おくびょう','Timid'],
 ['ひかえめ','Modest'],['しんちょう','Careful'],['わんぱく','Impish'],['おだやか','Calm'],
 ['ずぶとい','Bold'],['せっかち','Hasty'],['むじゃき','Naive'],['ゆうかん','Brave'],
 ['れいせい','Quiet'],['なまいき','Sassy'],['のんき','Relaxed']]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False)
started=time.monotonic()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  payload=dict(adoption=json.loads((ROOT/'ADOPTION_120_NORMALIZED.json').read_text())['species'],
   audit=json.loads((ROOT/'STATS_MOVES_AUDIT_RESULTS.json').read_text()),
   baseline=json.loads((ROOT/'FROZEN_BASELINE.json').read_text()),natures=NATURES)
  data=page.evaluate('''({adoption,audit,baseline,natures})=>{
   const keys=['hp','atk','def','spa','spd','spe'];
   const statRows=baseline.targetSpecies.map(name=>({name,speciesId:NATIONAL_DEX[name].id,
    values:natures.map(([nature])=>Array.from({length:33},(_,ap)=>keys.map(k=>k==='hp'?calcRealHP(BATTLE_DATA[name].hp,ap):calcRealStat(k==='spe'?BASE_SPEED[name]:BATTLE_DATA[name][k],ap,nature,k))))}));
   const verified=new Set(audit.moves.filter(x=>x.basicCalculation==='verified-in-explicit-matrix').map(x=>x.name));
   const targets=['ガオガエン','ドドゲザン','ガブリアス','ミロカロス','バンギラス','ユキノオー','サーフゴー','リキキリン'];
   const modes=['base','trained','negativeNature','hpBulk','physicalBulk','specialBulk','orb','typeItem','rain','sun','sand','snow','screen','stacked','singleTarget','rank','sash','sturdy'];
   const natureIds=Object.fromEntries(natures);
   const profile=(nature='まじめ',points={})=>({nature,hp:0,atk:0,def:0,spa:0,spd:0,spe:0,...points});
   const stats=(name,prof)=>Object.fromEntries(keys.map(k=>[k,k==='hp'?calcRealHP(BATTLE_DATA[name].hp,prof.hp):calcRealStat(k==='spe'?BASE_SPEED[name]:BATTLE_DATA[name][k],prof[k],prof.nature,k)]));
   const damageRows=[];
   for(const [ai,mon]of adoption.entries()){
    const move=Object.entries(mon.moves).filter(([m,p])=>p>=10&&verified.has(m)).sort((a,b)=>b[1]-a[1])[0]?.[0];
    if(!move)throw Error('No verified major attack for '+mon.name);
    for(const [mi,mode]of modes.entries())for(const path of ['outgoing','incoming']){
     const an=mon.name,dn=targets[(ai+mi)%targets.length],mv=DAMAGE_MOVES[move],as=path==='outgoing'?'my':'opp',ds=as==='my'?'opp':'my';
     const offense=mv.cat==='phys'?'atk':'spa',positive=mv.cat==='phys'?'いじっぱり':'ひかえめ';
     const offensive=profile(mode==='negativeNature'?(mv.cat==='phys'?'ひかえめ':'いじっぱり'):mode==='base'?'まじめ':positive,
       mode==='base'?{}:{hp:32,[offense]:32,spe:2});
     const bulk=mode==='hpBulk'?'hp252':mode==='physicalBulk'?'phys':mode==='specialBulk'?'spec':'neutral';
     const defender=bulk==='phys'?profile('ずぶとい',{hp:32,def:32}):bulk==='spec'?profile('おだやか',{hp:32,spd:32}):bulk==='hp252'?profile('まじめ',{hp:32}):profile();
     const typeItems={'ほのお':['もくたん','charcoal'],'みず':['しんぴのしずく','mysticwater'],'くさ':['きせきのタネ','miracleseed'],'でんき':['じしゃく','magnet'],'じめん':['やわらかいすな','softsand'],'あく':['くろいメガネ','blackglasses'],'フェアリー':['ようせいのハネ','fairyfeather']};
     const held=mode==='orb'?['いのちのたま','lifeorb']:mode==='typeItem'?(typeItems[mv.type]||['こだわりスカーフ','choicescarf']):['なし',''];
     const guard=mode==='sash'?'きあいのタスキ':'なし';
     state[as+'Team']=[an,'イーブイ'];state[ds+'Team']=[dn,'イーブイ'];state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};state.mySelected=[0,1];state.magicRoomTurns=0;state.seenOpp=[0,1];state.entryFieldUncertainty=null;
     for(const side of ['my','opp'])for(let i=0;i<2;i++){
      const d=ensureBattleEntry(side,i,state[side+'Team'][i]);Object.assign(d,{hp:100,status:'なし',ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,itemConsumed:false});
      for(const k of BATTLE_STAGE_KEYS)d[k]=0;
     }
     if(mode==='singleTarget'){state[ds][1].hp=0;if(ALLY_HIT_MOVES.has(move))state[as][1].hp=0;}
     state[as][0].moves=[move];state[as][0].item=held[0];state[ds][0].item=guard;state[ds][0].bulk=bulk;
     if(mode==='sturdy')state[ds][0].ability='がんじょう';
     savedMyProfiles[0]={...(as==='my'?offensive:defender),item:as==='my'?held[0]:guard};savedMyProfiles[1]={...profile(),item:'なし'};
     savedMyMoves[0]=as==='my'?[move]:['まもる'];
     $('weather').value={rain:'雨',sun:'晴れ',sand:'砂',snow:'雪'}[mode]||'なし';$('terrain').value='なし';$('myTailwind').value=$('oppTailwind').value=$('trTurns').value='0';
     state.sideConditions={my:{},opp:{}};
     if(mode==='screen')state.sideConditions[ds][mv.cat==='phys'?'reflect':'lightScreen']=5;
     if(mode==='stacked')Object.assign(state.sideConditions[ds],{reflect:5,lightScreen:5,auroraVeil:5});
     if(mode==='rank'){state[as][0].atkStage=state[as][0].spaStage=-1;state[ds][0].defStage=state[ds][0].spdStage=1;}
     const get=()=>as==='my'?damageEstimate(an,move,dn,0,bulk,0):opponentDamageEstimateAgainstMy({kind:'attack',actor:an,move},{name:dn,idx:0,d:state.my[0]});
     const first=get();if(!first?.rolls?.length)throw Error('Missing result '+an+'/'+move);
     const rolls=r=>r.rolls.length===1?Array(16).fill(r.rolls[0]):r.rolls;
     const aProfile=as==='my'?offensive:profile(positive,{[offense]:32,...(move==='ボディプレス'?{def:32}:{})});
     const dProfile=defender;
     const hp=first.hp||first.fullHp,boundaries=[];
     if(['base','trained','orb','screen','sash','sturdy'].includes(mode)){
      const thresholds=new Set([hp,1,...rolls(first).flatMap(x=>[x-1,x,x+1])]);
      const percentages=new Set([1,25,50,75,99,100]);
      for(const n of thresholds)if(n>0&&n<=hp)percentages.add((n-.25)/hp*100);
      for(const percent of percentages){
       state[ds][0].hp=percent;const r=get();
       const prediction=as==='my'&&percent>0?predictedMoveKO(an,move,dn,0,0,bulk):null;
       const insight=prediction?damageInsightVsTarget({kind:'attack',actor:an,move},{name:dn,idx:0,d:state.opp[0]}):null;
       boundaries.push({percent,currentHp:r.currentHp,rolls:rolls(r),koChance:r.koChance??(r.eff===0?0:null),ko:r.ko||'',prediction,insightLabel:insight?.label||''});
      }
     }
     state[ds][0].hp=100;
     const aStats=stats(an,aProfile),dStats=stats(dn,dProfile);
     if(move==='イカサマ'&&as==='my')dStats.atk=calcRealStat(BATTLE_DATA[dn].atk,0,'まじめ','atk');
     // Incoming Foul Play reads our real attack stat, while the opponent profile remains an explicit offensive prior.
     damageRows.push({id:[an,move,dn,mode,path].join('/'),actor:an,sourceId:NATIONAL_DEX[an].id,targetId:NATIONAL_DEX[dn].id,move:NATIONAL_MOVES[move].id,mode,path,
      aProfile:{...aProfile,nature:natureIds[aProfile.nature]},dProfile:{...dProfile,nature:natureIds[dProfile.nature]},aStats,dStats,
      item:held[1],targetItem:mode==='sash'?'focussash':'',sturdy:mode==='sturdy',
      weather:{rain:'raindance',sun:'sunnyday',sand:'sandstorm',snow:'snowscape'}[mode]||'',screens:mode==='stacked'?['reflect','lightscreen','auroraveil']:mode==='screen'?[mv.cat==='phys'?'reflect':'lightscreen']:[],
      spread:!!mv.spread&&mode!=='singleTarget',effectiveness:first.eff,accuracy:effectiveMoveAccuracy(move,as,0,ds,0).accuracy,
      aBoosts:{atk:state[as][0].atkStage,spa:state[as][0].spaStage},dBoosts:{def:state[ds][0].defStage,spd:state[ds][0].spdStage},rolls:rolls(first),boundaries});
    }
   }
   // Actual presentation path keeps the raw classifications distinct and provisional.
   const presentation={certain:predictionDisplayText('確定1発'),random:predictionDisplayText('乱数1発')};
   if(presentation.certain===presentation.random||presentation.certain.includes('確定'))throw Error('KO presentation collapsed');
   return {statRows,damageRows,natures,presentation};
  }''',payload)
  browser.close()
 assert not errors,errors
 (ROOT/'work/ko-boundary-input.json').write_text(json.dumps(data,ensure_ascii=False))
 result=subprocess.run(['node','ko-boundary-oracle.js'],cwd=ROOT,input=json.dumps(data,ensure_ascii=False),text=True,capture_output=True,timeout=150)
 assert result.returncode==0,result.stderr[-4000:]
 report=json.loads(result.stdout);report.update(elapsedSeconds=round(time.monotonic()-started,3),species=344,megaSpecies=82,apValues=list(range(33)),natureCount=len(NATURES),profilePointLimit=66,
  sourceSha256={n:sha256((ROOT/n).read_bytes()).hexdigest() for n in ['index.html','battle-core.js','browser_ko_boundary_test.py','ko-boundary-oracle.js','ADOPTION_120_NORMALIZED.json','reference-data/stats-moves/showdown-normalized.json']},
  presentation=data['presentation'],browserErrors=errors,baselineVersion='v2.9.17',
  limitations=['AP numeric equivalence at Lv50/IV31; official AP rules, standard EV budget and different IVs/levels not certified',
   '120 stored profiles are historical tournament 30 plus ranked fallback 90, not current event measured top 120',
   'No-effect ability controls isolate basic modifiers; Sturdy/Sash are explicit test conditions, not species ability legality',
   'Incoming opponent offense is the existing AP32/favorable-nature prior; unknown spread is not established fact',
   'Boundaries use fractional HP percentages to address integer HP cuts, plus observed 1/25/50/75/99/100 percent',
   'Secondary effects, complete recommendations, all unknown abilities/items, official regulations and full match parity excluded'])
 assert report['passed'],report['failures'][:12]
 assert len(report['actors'])==120 and report['randomOnHitCases']>0 and report['certainOnHitCases']>0
 assert report['oneOfSixteenCases']>0 and report['fifteenOfSixteenCases']>0 and report['fullHpSurvivalCases']>0
 print(f"PASS KO/stat boundary audit: {report['statComparisons']} stats, {report['damageComparisons']} damage rolls, {report['hpBoundaryCases']} HP boundaries, 120 actors; no mismatch")
finally:
 server.shutdown();(ROOT/'KO_BOUNDARY_AUDIT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
