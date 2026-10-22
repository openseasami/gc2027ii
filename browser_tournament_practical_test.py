"""Tournament-practical smoke: provisional labels, confirmed critical paths and 45s UI latency.
Fixtures exercise the application, not official legality or full battle parity.
"""
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
report=dict(completion=False,passed=False,scope='Fixture-based Chromium practical checks; no official legality/full battle oracle or human 45s timing certification',refreshSamplesMs=[])
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1365,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  page.locator('[data-fill="opp"]').click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click()
  data=page.evaluate('''() => {
   const ai=state.myActive[0],di=state.oppActive[0],an=state.myTeam[ai],dn=state.oppTeam[di];
   state.my[ai].ability='ひとでなし';state.my[ai].abilityConfirmed=true;
   savedMyProfiles[ai].item='なし';state.my[ai].itemConsumed=false;
   state.opp[di].ability='なし';state.opp[di].abilityConfirmed=true;state.opp[di].status='どく';
   const move='ウッドハンマー';
   const guaranteed=damageEstimate(an,move,dn,ai,'neutral',di);
   state.opp[di].ability='シェルアーマー';
   const blocked=damageEstimate(an,move,dn,ai,'neutral',di);
   state.opp[di].abilityConfirmed=false;
   const unknown=damageEstimate(an,move,dn,ai,'neutral',di);
   applyObservedMoveEffects('my',ai,an,'きあいだめ');save();
   return {guaranteed:guaranteed.critical,blocked:blocked.critical,blockedProfile:blocked.criticalProfile.blocked,unknown:unknown.critical,known:unknown.criticalProfile.known,focus:state.my[ai].criticalFocus};
  }''')
  assert data==dict(guaranteed=True,blocked=False,blockedProfile=True,unknown=False,known=False,focus=2),data
  page.reload(wait_until='networkidle');assert page.evaluate('state.my[state.myActive[0]].criticalFocus')==2
  for width,height in [(1365,900),(375,812),(320,740)]:
   page.set_viewport_size({'width':width,'height':height})
   for mode in [False,True]:
    page.evaluate('(mode)=>{set45Mode(mode);refresh();renderDamageOutput(true)}',mode)
    for _ in range(3):
     elapsed=page.evaluate('''() => {const t=performance.now();refresh();renderDamageOutput(true);return performance.now()-t}''')
     report['refreshSamplesMs'].append(round(elapsed,2));assert elapsed<5000,elapsed
    for selector in ['#damageOutput','#myRecommendation']:
     assert page.locator(selector).get_attribute('data-prediction-verified')=='false'
     text=page.locator(selector).inner_text()
     assert '参考推定' in text and not __import__('re').search(r'確定(?:\d+発|KO)',text),text
    assert '推定値・配分依存' in page.locator('#activeSpeedRanking').text_content()
    if mode:
     for _ in range(4):
      if page.evaluate('fixed45CurrentEntry().key')=='recommend':break
      page.locator('#fixed45SkipBtn').click()
     assert page.evaluate('fixed45CurrentEntry().key')=='recommend'
     text=page.locator('#fixed45Body').inner_text()
     assert '参考推定' in text,text
  # Formatter changes prediction claims only; observed input confirmation stays intact.
  assert page.evaluate("predictionDisplayText('確定1発／確定KO／交代を確定')")=='計算上1発（推定）／推定KO／交代を確定'
  assert not errors,errors
  report.update(passed=True,criticalConditions=data,maxRefreshMs=max(report['refreshSamplesMs']),errors=errors)
  browser.close()
finally:
 server.shutdown()
 (root/'TOURNAMENT_BROWSER_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS provisional predictions, critical confirmed/blocked/unknown, Focus Energy persistence, desktop/mobile 45s refresh <5s')
