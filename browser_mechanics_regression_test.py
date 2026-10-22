"""HTTP state/DOM integration with explicit action fixtures; no full-match legality claim."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1365,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  page.locator('[data-fill="opp"]').click()
  for index in range(4):page.locator('#myPickButtons .my-pick-btn').nth(index).click()
  page.locator('#startMatchBtn').click();assert page.locator('#battleArea').is_visible()
  values=page.evaluate('''() => {
   const idx=state.myActive[0],di=state.oppActive[0],an=state.myTeam[idx],dn=state.oppTeam[di];
   savedMyProfiles[idx].item='いのちのたま';state.my[idx].itemConsumed=false;state.magicRoomTurns=0;
   const normal=damageEstimate(an,'ウッドハンマー',dn,idx,'neutral',di).rolls;
   applyObservedMoveEffects('my',idx,an,'マジックルーム');
   const room=damageEstimate(an,'ウッドハンマー',dn,idx,'neutral',di).rolls;
   save();return {normal,room,turns:state.magicRoomTurns,item:heldItemFor('my',idx),raw:rawHeldItemFor('my',idx)};
  }''')
  assert values['turns']==5 and values['item']=='' and values['raw']=='いのちのたま'
  assert sum(values['normal'])>sum(values['room']),(values['normal'],values['room'])
  page.reload(wait_until='networkidle');assert page.evaluate('state.magicRoomTurns')==5
  assert page.evaluate('heldItemFor("my",state.myActive[0])')==''
  print('PASS Magic Room changes real damage rolls and survives HTTP save/reload')
  page.evaluate('''() => {
   state.magicRoomTurns=0;set45Mode(false);captureGuide45TurnStart();
   for(const side of ['my','opp'])for(const idx of state[side+'Active']){
    const d=state[side][idx];d.ability=(RELEVANT_ABILITIES[state[side+'Team'][idx]]||[])[0]||'';d.abilityConfirmed=true;d.item='なし';d.itemConfirmed=true;
    for(const key of BATTLE_STAGE_KEYS)d[key]=0;
   }
   savedMyProfiles[state.myActive[0]].item='なし';
   setCurrentTurnMove('my',state.myActive[0],state.myTeam[state.myActive[0]],'うそなき');renderCards();refresh();
  }''')
  target=page.evaluate('state.oppTeam[state.oppActive[1]]')
  page.get_by_role('button',name=target+'に命中',exact=True).click()
  assert page.evaluate('state.my[state.myActive[0]].currentTurnAction.targetIdx===state.oppActive[1]')
  assert page.evaluate('state.opp[state.oppActive[1]].spdStage')==0
  result=page.evaluate('''() => {
   for(const [side,slots]of [['my',[1]],['opp',[0,1]]])for(const slot of slots)state[side][state[side+'Active'][slot]].currentTurnAction={kind:'move',move:'まもる'};
   finalizeTurnState();return {selected:state.opp[state.oppActive[1]].spdStage,other:state.opp[state.oppActive[0]].spdStage,actions:state.my[state.myActive[0]].actionHistory,note:state.opp[state.oppActive[1]].rankEffectUncertainty};
  }''')
  assert result['selected']==-2 and result['other']==0,result
  print('PASS actual target-confirmation button and turn commit change only the selected doubles target')
  data=page.evaluate('''() => {
   const idx=state.myActive[0];savedMyProfiles[idx].item='しろいハーブ';state.my[idx].itemConsumed=false;
   for(const key of BATTLE_STAGE_KEYS)state.my[idx][key]=0;
   state.my[idx].currentTurnAction={kind:'move',move:'からをやぶる'};
   finalizeTurnState();save();return {entry:state.my[idx],turn:battleTurnNumber};
  }''')
  assert data['entry']['itemConsumed'] and data['entry']['defStage']==0 and data['entry']['atkStage']==2
  page.reload(wait_until='networkidle');assert page.evaluate('state.my[state.myActive[0]].itemConsumed')
  assert page.evaluate('state.my[state.myActive[0]].atkStage')==2
  assert page.evaluate('''() => {
   state.magicRoomTurns=3;const snapshot=captureTurnAttackState();state.magicRoomTurns=0;
   const historical=withHistoricalCombat({combat:snapshot},()=>state.magicRoomTurns);
   return historical===3&&state.magicRoomTurns===0;
  }''')
  print('PASS Shell Smash + White Herb real commit/reload and historical Magic Room isolation')
  assert not errors,errors
  browser.close()
finally:server.shutdown()
