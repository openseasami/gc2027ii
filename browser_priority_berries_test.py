"""Actual application berry estimates/confirmed hits/undo/focus with explicit fixtures."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,scope='Explicit state/move fixtures, not legality or full match simulation')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle');page.locator('[data-fill="opp"]').click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click()
  data=page.evaluate('''() => {
   const ai=state.myActive[0],di=state.oppActive[0],an=state.myTeam[ai];state.oppTeam[di]='リキキリン';
   for(const side of ['my','opp'])for(const idx of state[side+'Active']){
    const d=state[side][idx];d.ability='なし';d.abilityConfirmed=true;d.item='なし';d.itemConfirmed=true;d.status='なし';d.criticalFocus=0;
    for(const k of BATTLE_STAGE_KEYS)d[k]=0;
    if(side==='my'){savedMyProfiles[idx].item='なし';savedMyMoves[idx]=['あくのはどう'];d.moves=['あくのはどう'];}
   }
   Object.assign(state.opp[di],{hp:100,item:'ナモのみ',itemConfirmed:true,itemConsumed:false,bulk:'neutral'});
   const calc=()=>damageEstimate(an,'あくのはどう','リキキリン',ai,'neutral',di);
   const berry=calc(),before=JSON.stringify(state);state.opp[di].itemConsumed=true;const plain=calc();state.opp[di].itemConsumed=false;
   if(!(berry.berry.consume&&Math.max(...berry.rolls)<Math.max(...plain.rolls)))throw Error('Berry not integrated into actual outgoing damage');
   const entries=leadData('my');const insights=entries.map(e=>damageInsightVsTarget({actor:e.name,move:'あくのはどう',kind:'attack'},leadData('opp').find(x=>x.idx===di)));
   const fast=entries.slice().sort((a,b)=>fieldSpeed(b.name,'my',b.idx)-fieldSpeed(a.name,'my',a.idx));
   const first=damageEstimate(fast[0].name,'あくのはどう','リキキリン',fast[0].idx,'neutral',di);
   state.opp[di].itemConsumed=true;const second=damageEstimate(fast[1].name,'あくのはどう','リキキリン',fast[1].idx,'neutral',di);state.opp[di].itemConsumed=false;
   const combo=sequentialFocusDamage(insights);
   if(combo.maxDamage!==Math.min(berry.currentHp,Math.max(...first.rolls)+Math.max(...second.rolls)))throw Error('Berry repeated on focused attacks');
   if(JSON.stringify(state)!==before)throw Error('Forecast mutated real state');
   const hit=applyConfirmedSingleHit(ai,'あくのはどう',di,'minimum','hit');
   if(!hit.ok||!state.opp[di].itemConsumed)throw Error('Confirmed hit did not consume berry');
   if(!undoConfirmedSingleHit()||state.opp[di].itemConsumed||state.opp[di].hp!==100)throw Error('Undo failed');
   // Unknown opposing ability is not silently treated as known absence of Unnerve.
   const own=state.my[ai];savedMyProfiles[ai].item='ヨプのみ';state.opp[di].abilityConfirmed=false;
   const uncertain=defensiveBerryForDamage('opp',di,'リキキリン','my',ai,an,'インファイト','かくとう',2);
   if(!uncertain.uncertain||uncertain.factor!==1||uncertain.consume)throw Error('Unknown berry blocking treated as confirmed');
   state.opp[di].ability='きんちょうかん';state.opp[di].abilityConfirmed=true;
   const blocked=defensiveBerryForDamage('opp',di,'リキキリン','my',ai,an,'インファイト','かくとう',2);
   if(blocked.factor!==1||blocked.consume)throw Error('Unnerve ignored');
   save();return {berryMax:Math.max(...berry.rolls),plainMax:Math.max(...plain.rolls),focusedMax:combo.maxDamage,undo:true,unknownHeld:true,unnerve:true};
  }''')
  page.reload(wait_until='networkidle');assert page.evaluate('state.opp[state.oppActive[0]].itemConsumed') is False
  assert not errors,errors;report.update(passed=True,checks=data,errors=errors);browser.close()
finally:
 server.shutdown();(root/'PRIORITY_BERRY_BROWSER_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS prioritized berries: outgoing damage, one-use focused attacks, confirmed consumption, undo/reload, unknown/Unnerve guards')
