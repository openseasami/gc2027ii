"""HTTP browser regression: real controls, viewport scroll, persistence and offline shell.
This is not a complete battle or official game comparison.
"""
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
url=f'http://127.0.0.1:{server.server_port}/index.html'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':1365,'height':900})
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url,wait_until='networkidle')
  # Save the existing default team through the actual registration controls.
  page.locator('#editMyTeamBtn').click();page.locator('#saveMyTeamBtn').click()
  assert page.evaluate('savedMyTeam.length===6 && regulationMCTeamIssues(savedMyTeam,savedMyMoves,savedMyProfiles).length===0')
  page.locator('[data-fill="opp"]').click()
  for index in range(4):page.locator('#myPickButtons .my-pick-btn').nth(index).click()
  page.locator('#startMatchBtn').click();assert page.locator('#battleArea').is_visible()
  assert page.evaluate('Array.isArray(state.turnRecommendation?.actions) || !!document.getElementById("damageOutput").textContent')
  for width,height in [(1365,900),(1024,768),(768,1024),(375,812),(320,740)]:
   page.set_viewport_size({'width':width,'height':height})
   page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
   page.wait_for_timeout(100)
   data=page.evaluate('''() => {
    const input=document.getElementById('fixed45Panel'),rail=document.querySelector('.damage-follow-rail');
    const rect=rail.getBoundingClientRect();
    return {input:getComputedStyle(input).position,rail:getComputedStyle(rail).position,top:rect.top,left:rect.left,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height,inputTop:input.getBoundingClientRect().top,scroll:scrollY,
     outputOverflow:getComputedStyle(document.getElementById('damageOutput')).overflowY,spacer:document.getElementById('fixed45Spacer').getBoundingClientRect().height};
   }''')
   assert data['input']=='static',data
   assert data['rail']=='fixed' and 0<=data['left'] and data['right']<=width+1,data
   assert data['top']>=0 and data['bottom']<=height+1 and data['width']<=301,data
   assert data['height']>height*(.5 if width<=980 else .9),data
   assert data['spacer']==0 and data['outputOverflow']=='auto',data
   page.evaluate("window.scrollBy({top:200,behavior:'instant'})")
   moved=page.evaluate('''() => ({rail:document.querySelector('.damage-follow-rail').getBoundingClientRect().top,input:document.getElementById('fixed45Panel').getBoundingClientRect().top,scroll:scrollY})''')
   assert abs(moved['rail']-data['top'])<1,(data,moved)
   assert abs((data['inputTop']-moved['input'])-(moved['scroll']-data['scroll']))<2,(data,moved)
  print('PASS normal input scrolling and fixed narrower/taller damage panel at five viewport sizes')
  page.set_viewport_size({'width':1365,'height':900})
  assert page.evaluate('save()')
  before=page.evaluate('JSON.stringify({my:state.myTeam,opp:state.oppTeam,active:state.myActive})')
  page.reload(wait_until='networkidle');assert page.locator('#battleArea').is_visible()
  assert page.evaluate('JSON.stringify({my:state.myTeam,opp:state.oppTeam,active:state.myActive})')==before
  print('PASS real team save/start/reload and preserved active slots')
  # Inject explicit action observations, then use production finalization/undo functions.
  # This covers browser state/persistence, not every tap in the 45-second input flow.
  page.on('dialog',lambda d:d.accept())
  original=page.evaluate('({turn:battleTurnNumber,atk:state.my[state.myActive[0]].atkStage||0})')
  assert page.evaluate("""() => {
   captureGuide45TurnStart();
   state.my[state.myActive[0]].currentTurnAction={kind:'move',move:'つるぎのまい'};
   state.my[state.myActive[1]].currentTurnAction={kind:'move',move:'まもる'};
   for(const i of state.oppActive)state.opp[i].currentTurnAction={kind:'move',move:'まもる'};
   guide45State={opp1:{hp:true,action:true},opp2:{hp:true,action:true},my1:{hp:true},my2:{hp:true}};
   return autoFinalizeTurnIfReady();
  }""")
  assert page.evaluate('battleTurnNumber')==original['turn']+1
  assert page.evaluate('state.turnLog.length')==1
  assert page.evaluate('state.my[state.myActive[0]].atkStage')==min(6,original['atk']+2)
  page.reload(wait_until='networkidle')
  assert page.evaluate('battleTurnNumber')==original['turn']+1
  assert page.evaluate('undoLastGuide45Turn()')
  assert page.evaluate('battleTurnNumber')==original['turn']
  assert page.evaluate('state.my[state.myActive[0]].atkStage||0')==original['atk']
  page.locator('.match-result-panel summary').click()
  page.locator('#saveMatchRecordBtn').click();history=page.evaluate('matchHistory.length')
  page.locator('#saveMatchRecordBtn').click();assert page.evaluate('matchHistory.length')==history
  page.reload(wait_until='networkidle');assert page.evaluate('matchHistory.length')==history
  print('PASS observed-action fixture: real turn commit, save/reload, undo, and history save deduplication')
  page.evaluate('navigator.serviceWorker.ready')
  if not page.evaluate('!!navigator.serviceWorker.controller'):page.reload(wait_until='networkidle')
  assert page.evaluate('!!navigator.serviceWorker.controller')
  cached=page.evaluate('''async () => {
   const names=await caches.keys(),name=names.find(n=>n.endsWith('v2.9.1'));
   if(!name)return [];const cache=await caches.open(name);return (await cache.keys()).map(r=>new URL(r.url).pathname.split('/').pop());
  }''')
  for file in ['index.html','battle-core.js','effect-engine.js','priority-engine.js','turn-order-effects.js']:assert file in cached,(file,cached)
  context.set_offline(True);page.reload(wait_until='domcontentloaded')
  assert page.evaluate('!!window.BattleCore && !!window.EffectEngine && !!window.PriorityEngine && !!window.TurnOrderEffects')
  assert page.locator('#battleArea').is_visible()
  assert not errors,errors
  print('PASS offline HTTP reload with all external engines cached; no uncaught browser exceptions')
  browser.close()
finally:server.shutdown()
