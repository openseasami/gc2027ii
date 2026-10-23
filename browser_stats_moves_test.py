from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
import json,subprocess
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  rows=page.evaluate('''(ad)=>{
   const types={'ノーマル':'Normal','ほのお':'Fire','みず':'Water','でんき':'Electric','くさ':'Grass','こおり':'Ice','かくとう':'Fighting','どく':'Poison','じめん':'Ground','ひこう':'Flying','エスパー':'Psychic','むし':'Bug','いわ':'Rock','ゴースト':'Ghost','ドラゴン':'Dragon','あく':'Dark','はがね':'Steel','フェアリー':'Fairy'};
   const keys=Object.keys(DAMAGE_MOVES),canon=m=>keys.find(k=>k.normalize('NFKC')===m.normalize('NFKC')),seen=new Set(),moves=[];
   for(const mon of ad)for(const[m,rate]of Object.entries(mon.moves)){if(rate<10)continue;const n=NATIONAL_MOVES[m]?m:Object.keys(NATIONAL_MOVES).find(k=>NATIONAL_MOVES[k].id===m.toLowerCase().replace(/[^a-z0-9]/g,''));if(!n||NATIONAL_MOVES[n].cat==='status'||seen.has(n))continue;seen.add(n);const key=canon(n),mv=DAMAGE_MOVES[key];if(!mv?.power||mv.catalogOnly||MULTI_HIT_SPECS[key]||['やけっぱち','ふくろだたき','つけあがる','ひゃっきやこう','アイアンローラー','ポルターガイスト'].includes(key))continue;moves.push({name:n,key,actor:mon.name});}
   if(REGULATION_MC.items.some(x=>x.name==='こだわりハチマキ'))throw Error('Excluded item appeared');
   const rows=[];
   for(const {name,key:move,actor}of moves)for(const target of ['ミュウ','ギャラドス','ユキノオー','バンギラス'])for(const path of ['outgoing','incoming'])for(const mode of ['base','rank','burn','rain','sun','grass','psychic','mist','electric','snow','sand','orb','scarf','screens','poison']){
    if(target!=='ミュウ'&&!['base','rank','screens',target==='ユキノオー'?'snow':target==='バンギラス'?'sand':'base'].includes(mode))continue;
    const as=path==='outgoing'?'my':'opp',ds=as==='my'?'opp':'my';state[as+'Team']=[actor,'イーブイ'];state[ds+'Team']=[target,'イーブイ'];state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};state.magicRoomTurns=0;
    for(const side of ['my','opp'])for(let i=0;i<2;i++){const d=ensureBattleEntry(side,i,state[side+'Team'][i]);Object.assign(d,{hp:100,status:'なし',ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,itemConsumed:false,freshEntry:true});for(const k of BATTLE_STAGE_KEYS)d[k]=0;}
    const aProfile=as==='my'?{nature:'まじめ',hp:0,atk:32,def:32,spa:32,spd:0,spe:0,item:'なし'}:{nature:DAMAGE_MOVES[move].cat==='phys'?'いじっぱり':'ひかえめ',atk:DAMAGE_MOVES[move].cat==='phys'?32:0,spa:DAMAGE_MOVES[move].cat==='spec'?32:0,def:move==='ボディプレス'?32:0};savedMyProfiles[0]=as==='my'?aProfile:{nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:'なし'};savedMyProfiles[1]={nature:'まじめ',item:'なし'};
    if(mode==='rank'){state[as][0].atkStage=state[as][0].spaStage=2;state[ds][0].defStage=state[ds][0].spdStage=1;}
    if(mode==='burn')state[as][0].status='やけど';if(mode==='poison')state[ds][0].status='どく';
    const item=mode==='orb'?'いのちのたま':mode==='scarf'?'こだわりスカーフ':'なし';if(as==='my')savedMyProfiles[0].item=item;state[as][0].item=item;
    $('weather').value=mode==='rain'?'雨':mode==='sun'?'晴れ':mode==='snow'?'雪':mode==='sand'?'砂':'なし';$('terrain').value=mode==='grass'?'グラス':mode==='psychic'?'サイコ':mode==='mist'?'ミスト':mode==='electric'?'エレキ':'なし';$('trTurns').value=$('myTailwind').value=$('oppTailwind').value='0';state.sideConditions={my:{},opp:{}};if(mode==='screens')Object.assign(state.sideConditions[ds],{reflect:5,lightScreen:5});
    const r=as==='my'?damageEstimate(actor,move,target,0,'neutral',0):opponentDamageEstimateAgainstMy({actor,move,kind:'attack'},{name:target,idx:0,d:state.my[0]});if(!r?.rolls?.length)throw Error('No rolls '+name);
    const stats=(n,profile)=>Object.fromEntries(['atk','def','spa','spd','spe'].map(k=>[k,calcRealStat(k==='spe'?BASE_SPEED[n]:BATTLE_DATA[n][k],profile[k]||0,profile.nature||'まじめ',k)]));
    const dStats=stats(target,ds==='my'?savedMyProfiles[0]:{});if(move==='イカサマ')dStats.atk=foulPlayAttackSource(ds,0,target).atk;
    const accuracy={};for(const [a,d]of [[0,0],[1,2],[2,1],[-1,-2],[6,-6]]){state[as][0].accStage=a;state[ds][0].evaStage=d;accuracy[[a,d].join(',')]=effectiveMoveAccuracy(move,as,0,ds,0).accuracy;}
    rows.push({id:[path,name,target,mode].join('/'),name,move:NATIONAL_MOVES[name].id,sourceId:NATIONAL_DEX[actor].id,targetId:NATIONAL_DEX[target].id,aTypes:BATTLE_DATA[actor].types.map(t=>types[t]),dTypes:BATTLE_DATA[target].types.map(t=>types[t]),aStats:stats(actor,aProfile),dStats,aHp:calcRealHP(BATTLE_DATA[actor].hp,0),dHp:r.fullHp||r.hp,aBoosts:{atk:state[as][0].atkStage,spa:state[as][0].spaStage},dBoosts:{def:state[ds][0].defStage,spd:state[ds][0].spdStage},burn:mode==='burn',poison:mode==='poison',weather:mode==='rain'?'raindance':mode==='sun'?'sunnyday':mode==='snow'?'snowscape':mode==='sand'?'sandstorm':'',terrain:mode==='grass'?'grassyterrain':mode==='psychic'?'psychicterrain':mode==='mist'?'mistyterrain':mode==='electric'?'electricterrain':'',item:mode==='orb'?'lifeorb':mode==='scarf'?'choicescarf':'',screen:mode==='screens'?DAMAGE_MOVES[move].cat==='phys'?'reflect':'lightscreen':'',rolls:r.rolls.length===1?Array(16).fill(r.rolls[0]):r.rolls,accuracy});
   }return rows;
  }''',json.load(open(root/'ADOPTION_120_NORMALIZED.json'))['species']);runtime=page.evaluate("()=>{\n   const stats=d=>Object.fromEntries(['hp','atk','def','spa','spd','spe'].map(k=>[k,d[k]]));\n   return {national:Object.fromEntries(Object.entries(NATIONAL_DEX).map(([n,d])=>[n,{id:d.id,base:d.base,num:d.num,mega:d.mega,forme:d.forme,stats:stats(d)}])),regulation:Object.fromEntries(Object.entries(REGULATION_MC.entries).map(([n,d])=>[n,{id:d.id,stats:stats(d)}])),megaInfo:REGULATION_MC.megaInfo,selectable:[...POKEMON],battle:Object.fromEntries(Object.entries(BATTLE_DATA).map(([n,d])=>[n,{...stats(d),spe:BASE_SPEED[n]}])),moves:NATIONAL_MOVES,runtimeMoves:DAMAGE_MOVES,accuracy:MOVE_BASE_ACCURACY,regulationMoves:REGULATION_MC.moveDetails,moveMap:MOVE_MAP};\n  }");b.close()
  r=json.loads(subprocess.check_output(['node','primary-move-oracle.js'],input=json.dumps(rows),text=True,cwd=root))
  (root/'PRIMARY_MOVE_DIFFERENTIAL_RESULTS.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
  outcome=subprocess.run([str(root/'work/test-venv/bin/python'),'audit-stats-moves.py'],input=json.dumps({'runtime':runtime,'differential':r}),text=True,capture_output=True,cwd=root)
  print(outcome.stdout);assert outcome.returncode==0,outcome.stderr
  print('PASS primary move damage',r['comparisons'],'accuracy',r['accuracyComparisons'],'all target/catalog species; failures',r['failureCount'])

finally:server.shutdown()
