"""Final critical tactical audit, real app state and planner; UI unchanged."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json,subprocess,hashlib
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  result=page.evaluate('''()=>{
   const checks=[],oracle=[];const check=(id,ok,evidence)=>checks.push({id,passed:!!ok,evidence});
   function setup(){
    state.myTeam=['ガブリアス','サーフゴー','ペリッパー','ガオガエン'];state.oppTeam=['ガオガエン','リキキリン','ドラパルト','ゴリランダー'];state.myActive=[0,1];state.oppActive=[0,1];state.mySelected=[0,1,2,3];state.oppSelected=[0,1,2,3];state.my={};state.opp={};state.seenOpp=[0,1,2,3];state.magicRoomTurns=0;
    for(const side of ['my','opp'])for(let idx=0;idx<4;idx++){const d=ensureBattleEntry(side,idx,state[side+'Team'][idx]);Object.assign(d,{hp:100,status:'なし',ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,freshEntry:true,itemConsumed:false,moves:['たいあたり'],actionHistory:[]});for(const k of BATTLE_STAGE_KEYS)d[k]=0;}
    for(let i=0;i<4;i++){savedMyProfiles[i]={nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:'なし'};savedMyMoves[i]=['たいあたり'];}
    $('weather').value=$('terrain').value='なし';$('trTurns').value=$('myTailwind').value=$('oppTailwind').value='0';state.sideConditions={my:{},opp:{}};
   }
   setup();const eq={actor:'ガブリアス',move:'じしん'},partner={actor:'サーフゴー',move:'シャドーボール',target:'リキキリン'};
   state.my[1].hp=1;const unsafe=planAllyDamageRisk([eq,partner]);check('earthquake-lethal-ally-cost',unsafe.penalty>=10&&unsafe.entries[0]?.lethal===1,unsafe);
   const guarded=planAllyDamageRisk([eq,{actor:'サーフゴー',move:'まもる'}]);check('ally-protect-removes-damage',guarded.penalty===0,guarded);
   state.my[1].actionHistory=[{kind:'move',move:'まもる'}];const chained=planAllyDamageRisk([eq,{actor:'サーフゴー',move:'まもる'}]);check('consecutive-protect-not-assured',chained.penalty>0,chained.penalty);state.my[1].actionHistory=[];
   const immuneSwitch=planAllyDamageRisk([eq,{actor:'サーフゴー',kind:'switch',switchTo:'ペリッパー'}]);check('switch-to-flying-ally-safe',immuneSwitch.penalty===0,immuneSwitch);
   state.my[1].ability='テレパシー';const telepathy=planAllyDamageRisk([eq,partner]);check('telepathy-allied-hit-immunity',telepathy.penalty===0,telepathy);state.my[1].ability='なし';
   state.my[1].ability='ふゆう';check('levitate-allied-earthquake-immunity',planAllyDamageRisk([eq,partner]).penalty===0,null);state.my[1].ability='なし';
   check('rock-slide-does-not-hit-ally',planAllyDamageRisk([{actor:'ガブリアス',move:'いわなだれ'},partner]).penalty===0,null);
   const threeTargets=damageEstimate('ガブリアス','じしん','ガオガエン',0,'neutral',0);state.oppActive=[0];const twoTargets=damageEstimate('ガブリアス','じしん','ガオガエン',0,'neutral',0);
   check('earthquake-single-foe-plus-ally-retains-spread-reduction',JSON.stringify(threeTargets.rolls)===JSON.stringify(twoTargets.rolls),{three:threeTargets.rolls,two:twoTargets.rolls});state.oppActive=[0,1];
   state.oppTeam[0]='ガブリアス';const incoming={actor:'ガブリアス',kind:'attack',move:'じしん',target:'サーフゴー'};
   const incomingThree=opponentDamageEstimateAgainstMy(incoming,leadData('my')[1]);state.myActive=[1];const incomingTwo=opponentDamageEstimateAgainstMy(incoming,leadData('my')[0]);
   check('incoming-single-foe-plus-ally-retains-spread-reduction',JSON.stringify(incomingThree.rolls)===JSON.stringify(incomingTwo.rolls),null);state.myActive=[0,1];state.oppTeam[0]='ガオガエン';
   // Real first recommendation must not sacrifice a low-HP partner to EQ when
   // accurate single-target alternatives can finish the two low-HP foes.
   state.my[2].hp=state.my[3].hp=state.opp[2].hp=state.opp[3].hp=0;state.opp[0].hp=state.opp[1].hp=1;state.my[0].speStage=state.my[1].speStage=6;
   savedMyMoves[0]=['じしん','ドラゴンクロー'];savedMyMoves[1]=['シャドーボール'];
   const plan=exhaustiveRobustTurnPlans(temporalContext(),leadData('opp')[0],leadData('opp')[0],{});
   check('first-plan-preserves-partner-with-safe-terminal-line',plan?.best?.actions?.every(a=>a.move!=='じしん'),plan?.best?.actions);
   // Multi-turn recording/projection: Perish count 2 -> 1 -> KO; Protect cannot
   // save the threatened slot, while a normal legal switch removes the counter.
   setup();state.my[1].perishCount=2;
   const before=JSON.stringify(state);const fieldsBefore=[$('weather').value,$('trTurns').value];
   const trial=withTacticalProjection(()=>{advancePerishCounters();const first=state.my[1].perishCount;advancePerishCounters();return {first,hp:state.my[1].hp};});
   check('perish-two-turn-loss-projected',trial.first===1&&trial.hp===0,trial);
   check('projection-does-not-mutate-battle',JSON.stringify(state)===before&&JSON.stringify(fieldsBefore)===JSON.stringify([$('weather').value,$('trTurns').value]),null);
   state.my[1].perishCount=1;
   const attackLine=[{actor:'サーフゴー',move:'まもる'}],escape=[{actor:'サーフゴー',kind:'switch',switchTo:'ペリッパー'}];
   check('multi-turn-win-condition-switch-over-protect',tacticalPlanAssessment(escape).score>tacticalPlanAssessment(attackLine).score,{escape:tacticalPlanAssessment(escape),protect:tacticalPlanAssessment(attackLine)});
   setup();savedMyMoves[3]=['ねこだまし'];
   const fresh=nextTurnUtilityValue({idx:3,name:'ガオガエン',d:state.my[3]},true);$('terrain').value='サイコ';
   const blocked=nextTurnUtilityValue({idx:3,name:'ガオガエン',d:state.my[3]},true);
   check('next-turn-fake-out-no-credit-in-psychic-terrain',fresh.score>blocked.score&&!blocked.reasons.some(x=>x.includes('ねこだまし')),{fresh,blocked});$('terrain').value='なし';
   const attacker={actor:'ガブリアス',move:'ドラゴンクロー',target:'リキキリン'},protectPair={a:{actor:'リキキリン',kind:'support',move:'まもる'}};
   const firstProtect=scenarioHitAvailability(attacker,protectPair,leadData('opp')[1]);state.opp[1].actionHistory=[{kind:'move',move:'まもる'}];
   const repeatProtect=scenarioHitAvailability(attacker,protectPair,leadData('opp')[1]);check('opponent-repeat-protect-not-assured',firstProtect===0&&Math.abs(repeatProtect-2/3)<1e-8,{firstProtect,repeatProtect});
   const focused={a:{actor:'ガオガエン',kind:'attack',move:'フレアドライブ',target:'サーフゴー'}};
   state.my[1].hp=1;const protectedActions=[{actor:'サーフゴー',move:'まもる'}];
   const firstSim=oneTurnSimulation(protectedActions,focused);state.my[1].actionHistory=[{kind:'move',move:'まもる'}];const repeatSim=oneTurnSimulation(protectedActions,focused);
   check('own-repeat-protect-keeps-ko-risk',repeatSim.score<firstSim.score,{first:firstSim.score,repeat:repeatSim.score});
   // Actual own stats/profile, item and screens; independent same-side oracle below.
   for(const [actorName,move]of [['ガブリアス','じしん'],['ペリッパー','なみのり']])for(const screen of ['', 'reflect','lightscreen','auroraveil'])for(const stage of [0,2]){
    setup();state.myTeam[0]=actorName;state.my[0].ability='なし';state.my[1].ability='なし';state.my[1].hp=100;
    Object.assign(savedMyProfiles[0],{atk:32,spa:32,item:'いのちのたま'});Object.assign(savedMyProfiles[1],{hp:24,def:16,spd:8,nature:'ずぶとい'});state.my[0].atkStage=state.my[0].spaStage=stage;state.my[1].defStage=state.my[1].spdStage=stage;
    if(screen)state.sideConditions.my[{reflect:'reflect',lightscreen:'lightScreen',auroraveil:'auroraVeil'}[screen]]=5;
    const r=damageEstimate(actorName,move,'サーフゴー',0,null,1,null,false,'my');
    const stats=(name,prof)=>{const out={};for(const k of ['atk','def','spa','spd','spe'])out[k]=calcRealStat(k==='spe'?BASE_SPEED[name]:BATTLE_DATA[name][k],prof[k]||0,prof.nature,k);return out;};
    oracle.push({id:[actorName,move,screen,stage].join('/'),aid:NATIONAL_DEX[actorName].id,did:NATIONAL_DEX['サーフゴー'].id,aa:'runaway',da:'runaway',item:'lifeorb',move:NATIONAL_MOVES[move].id,aStats:stats(actorName,savedMyProfiles[0]),dStats:stats('サーフゴー',savedMyProfiles[1]),aHp:calcRealHP(BATTLE_DATA[actorName].hp,0),dHp:r.hp,aBoosts:{atk:stage,spa:stage},dBoosts:{def:stage,spd:stage},screen,rolls:r.rolls});
   }
   const box=document.createElement('div');box.textContent='確定KO';markPredictionUncertainty(box);check('unknown-predictions-labelled',box.textContent.includes('参考推定')&&box.textContent.includes('相手行動')&&!box.textContent.includes('確定KO'),box.textContent);
   return {checks,oracle};
  }''')
  oracle=json.loads(subprocess.check_output(['node','ally-damage-oracle.js'],input=json.dumps(result['oracle']),text=True,cwd=root))
  report={'completion':False,'sourceSha256':hashlib.sha256((root/'index.html').read_bytes()).hexdigest(),'total':len(result['checks']),'passed':sum(x['passed'] for x in result['checks']),'checks':result['checks'],'allyDamageDifferential':oracle}
  (root/'FINAL_TACTICAL_AUDIT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  print(json.dumps(report,ensure_ascii=False,indent=2));assert report['passed']==report['total'];assert not oracle['failures'],oracle['failures'][:5]
  browser.close()
finally:server.shutdown()
