"""Actual loaded app adapters, selected top-120 matchups, no damage-function stubs."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json,subprocess
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
fixtures=[
 ['ゴリランダー','グラスメイカー','grassysurge','ウッドハンマー','ガオガエン','いかく','intimidate','グラス','なし'],
 ['オオニューラ','かるわざ','unburden','インファイト','ドドゲザン','まけんき','defiant','なし','なし'],
 ['ガブリアス','さめはだ','roughskin','じしん','サーフゴー','おうごんのからだ','goodasgold','なし','なし'],
 ['ニンフィア','フェアリースキン','pixilate','ハイパーボイス','ガブリアス','さめはだ','roughskin','なし','なし'],
 ['ペリッパー','あめふらし','drizzle','ウェザーボール','ガオガエン','いかく','intimidate','なし','雨'],
 ['イダイトウ','てきおうりょく','adaptability','アクアブレイク','ガオガエン','いかく','intimidate','なし','雨'],
 ['ドドゲザン','そうだいしょう','supremeoverlord','ドゲザン','イエッサン♀','サイコメイカー','psychicsurge','サイコ','なし'],
 ['ブリジュラス','じきゅうりょく','stamina','ボディプレス','ドドゲザン','まけんき','defiant','なし','なし'],
 ['コータス','ひでり','drought','ふんか','ミロカロス','かちき','competitive','なし','晴れ'],
 ['アシレーヌ','うるおいボイス','liquidvoice','ハイパーボイス','ガオガエン','いかく','intimidate','なし','なし'],
 ['ウルガモス','ほのおのからだ','flamebody','ねっぷう','メタグロス','クリアボディ','clearbody','なし','晴れ'],
 ['ゴリランダー','グラスメイカー','grassysurge','グラススライダー','リキキリン','テイルアーマー','armortail','グラス','なし'],
 ['ゴリランダー','グラスメイカー','grassysurge','ねこだまし','イエッサン♀','サイコメイカー','psychicsurge','サイコ','なし'],
 ['ドラパルト','すりぬけ','infiltrator','かえんほうしゃ','メタグロス','クリアボディ','clearbody','なし','なし'],
 ['イダイトウ','すいすい','swiftswim','アクアブレイク','ガオガエン','いかく','intimidate','なし','雨'],
 ['リキキリン','テイルアーマー','armortail','サイコキネシス','オオニューラ','かるわざ','unburden','サイコ','なし'],
]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  rows=page.evaluate('''(fixtures)=>{
   const rows=[];
   for(const [an,aa,aid,move,dn,da,did,terrain,weather]of fixtures){
    if(!NATIONAL_DEX[an]||!NATIONAL_DEX[dn])throw Error('Missing species');
    for(const path of ['outgoing','incoming'])for(const burn of [false,true])for(const held of ['', 'いのちのたま','こだわりスカーフ'])for(const screen of ['', 'reflect','lightscreen','auroraveil','stacked'])for(const stage of [-1,0,2]){
     const as=path==='outgoing'?'my':'opp',ds=as==='my'?'opp':'my';
     state.myTeam=['ゴリランダー','イーブイ'];state.oppTeam=['ゴリランダー','イーブイ'];state[as+'Team'][0]=an;state[ds+'Team'][0]=dn;
     state.myActive=[0,1];state.oppActive=[0,1];state.my={};state.opp={};state.magicRoomTurns=0;state.seenOpp=[0,1];state.entryFieldUncertainty=null;
     for(const side of ['my','opp'])for(const idx of [0,1]){const d=ensureBattleEntry(side,idx,state[side+'Team'][idx]);Object.assign(d,{ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,hp:100,status:'なし',itemConsumed:false});for(const k of BATTLE_STAGE_KEYS)d[k]=0;}
     Object.assign(state[as][0],{ability:aa,status:burn?'やけど':'なし',item:held||'なし',moves:[move],atkStage:stage,spaStage:stage,defStage:stage,speStage:stage});Object.assign(state[ds][0],{ability:da,defStage:stage,spdStage:stage,speStage:stage});
     savedMyProfiles[0]={nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:as==='my'?held||'なし':'なし'};savedMyProfiles[1]={nature:'まじめ',item:'なし'};savedMyMoves[0]=as==='my'?[move]:['まもる'];
     $('weather').value=weather;$('terrain').value=terrain;$('myTailwind').value='0';$('oppTailwind').value='0';$('trTurns').value='0';
     state.sideConditions={my:{reflect:0,lightScreen:0},opp:{reflect:0,lightScreen:0}};if(screen)state.sideConditions[ds][{reflect:'reflect',lightscreen:'lightScreen',auroraveil:'auroraVeil',stacked:'auroraVeil'}[screen]]=5;if(screen==='stacked')Object.assign(state.sideConditions[ds],{reflect:5,lightScreen:5});
     const result=path==='outgoing'?damageEstimate(an,move,dn,0,'neutral',0):opponentDamageEstimateAgainstMy({kind:'attack',actor:an,move},{idx:0,name:dn,d:state.my[0]});
     if(!result?.rolls?.length)throw Error('No estimate '+an+move);
     const mv=DAMAGE_MOVES[move],a=BATTLE_DATA[an],d=BATTLE_DATA[dn];
     if(path==='outgoing'){const insight=damageInsightVsTarget({kind:'attack',actor:an,move},{idx:0,name:dn,d:state.opp[0]});if(!insight||Math.max(...insight.rolls)!==Math.max(...result.rolls))throw Error('Recommendation damage diverged');const average=result.rolls.reduce((a,b)=>a+b,0)/result.rolls.length/insight.curHp*100;if(Math.abs(average-insight.avgCurPct)>1e-8)throw Error('Recommendation average diverged');if(['グラススライダー','ねこだまし'].includes(move)&&actionDamageInsights({kind:'attack',actor:an,move,target:dn}).length!==0)throw Error('Priority-blocked attack scored as damage');}
     const aSpeed=fieldSpeed(an,as,0) ,dSpeed=fieldSpeed(dn,ds,0);
     const aStats={},dStats={};for(const k of ['atk','def','spa','spd','spe']){let points=0,nature='まじめ';if(as==='opp'){if(k===(mv.cat==='phys'?'atk':'spa')){points=32;nature=mv.cat==='phys'?'いじっぱり':'ひかえめ';}if(move==='ボディプレス'&&k==='def')points=32;}aStats[k]=calcRealStat(k==='spe'?BASE_SPEED[an]:a[k],points,nature,k);dStats[k]=calcRealStat(k==='spe'?BASE_SPEED[dn]:d[k],0,'まじめ',k);}
     aStats.spe=intrinsicBattleSpeed(an,as,0);dStats.spe=intrinsicBattleSpeed(dn,ds,0);
     const sourceEvent=simulatedActionEvent({kind:'move',actor:an,move},as),targetEvent=simulatedActionEvent({kind:'move',actor:dn,move:'たいあたり'},ds);
     const orders=[];for(const tr of [false,true]){$('trTurns').value=tr?'5':'0';const sorted=sortTurnSimulationEvents([sourceEvent,targetEvent]);orders.push(sourceEvent.priority===targetEvent.priority&&aSpeed===dSpeed?null:sorted[0].side===as?'source':'target');}$('trTurns').value='0';
     rows.push({orderNormal:orders[0],orderTR:orders[1],aSpeed,dSpeed,priority:movePriorityForActor(move,'move',as,0,an),id:[an,move,dn,burn,held,screen,stage].join('/'),path,sourceId:NATIONAL_DEX[an].id,targetId:NATIONAL_DEX[dn].id,aa:aid,da:did,sourceItem:held==='いのちのたま'?'lifeorb':held==='こだわりスカーフ'?'choicescarf':'',targetItem:'',moveId:NATIONAL_MOVES[move].id,spread:!!mv.spread,burn,screen,weatherId:{'雨':'raindance','晴れ':'sunnyday'}[weather]||'',terrainId:{'グラス':'grassyterrain','サイコ':'psychicterrain'}[terrain]||'',aStats,dStats,aHp:calcRealHP(a.hp,0),dHp:calcRealHP(d.hp,0),aBoosts:{atk:stage,spa:stage,def:stage,spe:stage},dBoosts:{def:stage,spd:stage,spe:stage},rolls:result.rolls});
    }
   }return rows;
  }''',fixtures)
  page.reload(wait_until='networkidle');page.locator('[data-fill="opp"]').click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click()
  lifecycle=page.evaluate('''() => {
   const ai=state.myActive[0],oi=state.oppActive[0],name=state.myTeam[ai];savedMyProfiles[ai].item='ひかりのねんど';
   const sc=ensureSideConditions();sc.my.auroraVeil=0;$('weather').value='なし';
   applyObservedMoveEffects('my',ai,name,'オーロラベール');if(sc.my.auroraVeil!==0)throw Error('Veil without snow');
   $('weather').value='雪';$('weatherTurns').value='5';applyObservedMoveEffects('my',ai,name,'オーロラベール');if(sc.my.auroraVeil!==8)throw Error('Clay duration');
   sc.my.auroraVeil=0;state.opp[oi].ability='ノーてんき';state.opp[oi].abilityConfirmed=true;
   applyObservedMoveEffects('my',ai,name,'オーロラベール');if(sc.my.auroraVeil!==0)throw Error('Suppressed snow');
   state.opp[oi].ability='なし';applyObservedMoveEffects('my',ai,name,'オーロラベール',{failed:true});if(sc.my.auroraVeil!==0)throw Error('Failed veil');
   savedMyProfiles[ai].item='なし';applyObservedMoveEffects('my',ai,name,'オーロラベール');if(sc.my.auroraVeil!==5)throw Error('Standard duration');
   $('weather').value='なし';if(screenDamageMod('my','phys')!==2/3||screenDamageMod('my','spec')!==2/3)throw Error('Veil disappeared with snow');sc.my.reflect=5;sc.my.lightScreen=5;
   if(screenDamageMod('my','phys')!==2/3||screenDamageMod('my','spec')!==2/3)throw Error('Double screen stacking');
   const snap=captureTurnCommitTransaction();decrementTurnFieldCounters();if(sc.my.auroraVeil!==4)throw Error('Countdown');restoreTurnCommitTransaction(snap);
   if(ensureSideConditions().my.auroraVeil!==5)throw Error('Rollback lost veil');
   for(let i=0;i<5;i++)decrementTurnFieldCounters();if(ensureSideConditions().my.auroraVeil!==0)throw Error('Expiration');
   ensureSideConditions().my.auroraVeil=3;save();return {snow:true,clay:true,suppressed:true,failed:true,stacking:true,countdown:true,rollback:true};
  }''')
  page.reload(wait_until='networkidle');assert page.evaluate('ensureSideConditions().my.auroraVeil')==3
  lifecycle['saveReload']=True
  browser.close()
 (root/'work/main-matchup-input.json').write_text(json.dumps(rows))
 result=subprocess.run(['node','main-matchup-oracle.js'],cwd=root,input=json.dumps(rows),capture_output=True,text=True)
 assert result.returncode==0,result.stderr[-2000:]
 report=json.loads(result.stdout)
 report['matchups']=len(fixtures);report['veilLifecycle']=lifecycle;(root/'MAIN_MATCHUP_DIFFERENTIAL_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 assert report['failureCount']==0,(report['failureCount'],report['failures'][:8])
 print(f"PASS {report['comparisons']} actual browser-adapter comparisons over {len(fixtures)} adoption-120 matchups")
finally:server.shutdown()
