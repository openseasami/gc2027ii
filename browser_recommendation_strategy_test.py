"""Tactical acceptance scenarios on actual loaded recommendation functions (no mocks)."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json, hashlib, sys, subprocess
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  if '--previous-denial' in sys.argv:
   old=subprocess.check_output(['git','show','ee7ae6daf98ce83553bd9bf614d4b49a6d0a5148:index.html'],text=True)
   source=old[old.index('function winConditionActionBlockScore('):old.index('function winConditionDenialForPlan(')]
   page.evaluate('(source)=>window.eval(source)',source)
  results=page.evaluate('''()=>{
   const rows=[];
   const check=(id,ok,evidence)=>{rows.push({id,passed:!!ok,evidence});};
   function setup(){
    state.myTeam=['ゴリランダー','ドラパルト','ガオガエン','ペリッパー'];state.oppTeam=['リキキリン','ガブリアス','サーフゴー','ペリッパー'];
    state.myActive=[0,1];state.oppActive=[0,1];state.mySelected=[0,1,2,3];state.oppSelected=[0,1,2,3];state.my={};state.opp={};state.turn=1;state.seenOpp=[0,1,2,3];state.magicRoomTurns=0;
    for(const side of ['my','opp'])for(let i=0;i<4;i++){
     const d=ensureBattleEntry(side,i,state[side+'Team'][i]);Object.assign(d,{hp:100,ability:'なし',abilityConfirmed:true,item:'なし',itemConfirmed:true,status:'なし',freshEntry:true,substituteHp:0,moves:['たいあたり','まもる']});for(const k of BATTLE_STAGE_KEYS)d[k]=0;
    }
    for(let i=0;i<4;i++){savedMyProfiles[i]={nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0,item:'なし'};savedMyMoves[i]=['たいあたり','まもる'];}
    $('weather').value='なし';$('terrain').value='なし';$('trTurns').value='0';$('myTailwind').value='0';$('oppTailwind').value='0';state.sideConditions={my:{},opp:{}};
   }
   setup();
   const fake={actor:'ゴリランダー',move:'ねこだまし',target:'リキキリン'};
   const taunt={actor:'ドラパルト',move:'ちょうはつ',target:'リキキリン'};
   const wc={id:'tailwind',actors:['リキキリン'],targets:[]};
   const pair={a:{kind:'support',actor:'リキキリン',move:'おいかぜ'},b:{kind:'attack',actor:'ガブリアス',move:'じしん',target:'ゴリランダー'}};
   check('fake-out-valid-first-turn',disruptionCanAffect(fake,leadData('opp')[0]),null);
   for(const ability of ['せいしんりょく','りんぷん','テイルアーマー']){
    state.opp[0].ability=ability;check('fake-out-blocked-'+ability,!disruptionCanAffect(fake,leadData('opp')[0]),ability);
   }
   state.opp[0].ability='なし';state.opp[0].item='おんみつマント';check('fake-out-covert-cloak',!disruptionCanAffect(fake,leadData('opp')[0]),null);state.opp[0].item='なし';
   $('terrain').value='サイコ';check('fake-out-psychic-terrain',!disruptionCanAffect(fake,leadData('opp')[0]),null);$('terrain').value='なし';
   state.my[0].freshEntry=false;check('fake-out-not-entry-turn',winConditionActionBlockScore(fake,wc,pair)===0,null);state.my[0].freshEntry=true;
   const fast=winConditionActionBlockScore(taunt,wc,pair);state.opp[0].speStage=6;state.my[1].speStage=-6;
   const late=winConditionActionBlockScore(taunt,wc,pair);check('taunt-after-tailwind-no-denial',fast>0&&late===0,{fast,late});
   $('trTurns').value='5';const reversed=winConditionActionBlockScore(taunt,wc,pair);check('trick-room-reverses-denial-order',reversed>0,reversed);$('trTurns').value='0';
   state.my[1].speStage=0;state.opp[0].speStage=0;
   for(const ability of ['どんかん','おうごんのからだ','マジックミラー','アロマベール']){state.opp[0].ability=ability;check('taunt-blocked-'+ability,winConditionActionBlockScore(taunt,wc,pair)===0,null);}state.opp[0].ability='なし';
   state.opp[0].item='メンタルハーブ';check('taunt-mental-herb-no-turn-denial',winConditionActionBlockScore(taunt,wc,pair)===0,null);state.opp[0].item='なし';
   state.opp[0].substituteHp=25;check('taunt-bypasses-substitute',disruptionCanAffect(taunt,leadData('opp')[0]),null);check('substitute-stops-fake-out-flinch',!disruptionCanAffect(fake,leadData('opp')[0]),null);state.opp[0].substituteHp=0;
   state.opp[1].ability='アロマベール';check('ally-aroma-veil-blocks-taunt',!disruptionCanAffect(taunt,leadData('opp')[0]),null);state.opp[1].ability='なし';
   const protectPair={a:{kind:'support',actor:'リキキリン',move:'まもる'},b:pair.b};
   check('protect-stops-targeted-denial',winConditionActionBlockScore(fake,wc,protectPair)===0,null);
   const attack={actor:'ドラパルト',move:'りゅうのはどう',target:'リキキリン'};
   state.opp[0].hp=1;
   const earlyKO=winConditionActionBlockScore(attack,wc,pair);state.my[1].speStage=-6;state.opp[0].speStage=6;
   const lateKO=winConditionActionBlockScore(attack,wc,pair);check('late-ko-does-not-prevent-setup',earlyKO>0&&lateKO===0,{earlyKO,lateKO});
   setup();
   const swPair={a:{kind:'switch',actor:'リキキリン',move:'交代',switchTo:'サーフゴー'},b:pair.b};
   const replacement=scenarioSwitchDefender(swPair,leadData('opp')[0]);
   check('known-switch-targets-entrant',replacement?.name==='サーフゴー'&&winConditionActionBlockScore(fake,wc,swPair)===0,replacement?.name);
   const immuneAttack={actor:'ゴリランダー',move:'たいあたり',target:'リキキリン'};
   const switched=scenarioDamageInsights(immuneAttack,swPair);check('switch-immunity-not-outgoing-damage',switched.every(x=>x.avgCurPct===0),switched.map(x=>({target:x.target,avg:x.avgCurPct})));
   const unknownPair={a:{kind:'switch',actor:'リキキリン',switchTo:'不明'},b:pair.b};
   check('unknown-switch-not-assured-ko',scenarioDamageInsights(attack,unknownPair).length===0,null);
   const spread={actor:'ドラパルト',move:'なみのり',target:null};
   const guardPair={a:{kind:'support',actor:'リキキリン',move:'ワイドガード'},b:pair.b};
   check('wide-guard-blocks-spread',scenarioDamageInsights(spread,guardPair).every(x=>x.avgCurPct===0),null);
   // Full real candidate generation/ranking: both foes at 1 HP, no bench available.
   // Win condition: take two accurate KOs rather than wasting both attacks on one slot.
   setup();state.my[2].hp=state.my[3].hp=state.opp[2].hp=state.opp[3].hp=0;
   savedMyMoves[0]=['ウッドハンマー','まもる'];savedMyMoves[1]=['りゅうのはどう','まもる'];state.opp[0].hp=state.opp[1].hp=1;
   state.opp[0].moves=['たいあたり'];state.opp[1].moves=['たいあたり'];state.my[0].speStage=6;
   const mine=myActiveEntries(),opp=leadData('opp'),tc=temporalContext();
   const best=exhaustiveRobustTurnPlans(tc,opp[0],opp[0],{});
   check('full-planner-finishes-two-low-hp-foes',best?.best?.actions?.length===2&&new Set(best.best.actions.map(a=>a.target)).size===2&&best.best.actions.every(a=>DAMAGE_MOVES[a.move]?.power),{actions:best?.best?.actions,scenarios:best?.scenarios?.length,generated:best?.generatedCount,alternatives:best?.alternatives});
   // Same terminal win under reversed speed, then a spread option. Require actual
   // guaranteed damage coverage, not a particular move name or arbitrary score.
   for(const mode of ['trick-room','spread']){
    if(mode==='trick-room'){state.my[0].speStage=state.my[1].speStage=-6;$('trTurns').value='5';}
    else{$('trTurns').value='0';state.my[0].speStage=state.my[1].speStage=6;savedMyMoves[1]=['なみのり','りゅうのはどう','まもる'];}
    const plan=exhaustiveRobustTurnPlans(temporalContext(),leadData('opp')[0],leadData('opp')[0],{});
    const covered=new Set((plan?.best?.actions||[]).flatMap(a=>actionDamageInsights(a).filter(d=>d.koChance===1).map(d=>d.target)));
    check('full-planner-terminal-'+mode,covered.size===2,{actions:plan?.best?.actions,covered:[...covered],scenarios:plan?.scenarios?.length});
   }
   setup();state.my[2].hp=state.my[3].hp=state.opp[2].hp=state.opp[3].hp=0;
   savedMyMoves[0]=savedMyMoves[1]=['たいあたり'];state.my[0].speStage=state.my[1].speStage=6;
   state.opp[0].moves=state.opp[1].moves=['たいあたり'];
   const focusActions=myActiveEntries().map(e=>({actor:e.name,move:'たいあたり',target:'リキキリン'}));
   const focusDamage=focusActions.map(a=>damageInsightVsTarget(a,leadData('opp')[0]));
   const sumMin=focusDamage.reduce((n,d)=>n+Math.min(...d.rolls),0),maxSingle=Math.max(...focusDamage.map(d=>Math.max(...d.rolls)));
   const targetHp=Math.floor((sumMin+maxSingle)/2);state.opp[0].hp=targetHp/focusDamage[0].fullHp*100;
   const focusPlan=exhaustiveRobustTurnPlans(temporalContext(),leadData('opp')[0],leadData('opp')[0],{});
   check('full-planner-focus-needed-for-ko',targetHp>maxSingle&&targetHp<=sumMin&&focusPlan?.best?.actions?.every(a=>a.target==='リキキリン'),{targetHp,maxSingle,sumMin,actions:focusPlan?.best?.actions});
   const focusPair={a:{kind:'attack',actor:'リキキリン',move:'サイコキネシス',target:'ゴリランダー'},b:{kind:'attack',actor:'ガブリアス',move:'じしん',target:'ゴリランダー'}};
   const exposed=[{actor:'ゴリランダー',move:'ウッドハンマー',target:'リキキリン'}];
   const guarded=[{actor:'ゴリランダー',move:'まもる',target:null}];
   check('protect-favored-against-focus-scenario',opponentScenarioAdjustment(guarded,focusPair)>opponentScenarioAdjustment(exposed,focusPair),{guard:opponentScenarioAdjustment(guarded,focusPair),attack:opponentScenarioAdjustment(exposed,focusPair)});
   return rows;
  }''')
  report={'completion':False,'scope':'Explicit tactical constraints on actual planner/scenario helpers, not game-theoretic optimality or opponent-prediction calibration','sourceSha256':hashlib.sha256((root/'index.html').read_bytes()).hexdigest(),'total':len(results),'passed':sum(r['passed'] for r in results),'scenarios':results}
  report['previousDenialOnly']='--previous-denial' in sys.argv
  (root/('RECOMMENDATION_DENIAL_BEFORE_FIX.json' if '--previous-denial' in sys.argv else 'RECOMMENDATION_STRATEGY_RESULTS.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
  failures=[r for r in results if not r['passed']]
  print(json.dumps(report,ensure_ascii=False,indent=2))
  assert not failures,failures
  browser.close()
finally: server.shutdown()
