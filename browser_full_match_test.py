"""Complete observed 4-vs-4 support-site workflow through real DOM controls.
No battle state/action injection. HP observations are a deterministic test fixture,
not a claim of official damage or full simulator parity.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
import json,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,kind='complete observed match UI workflow',stateInjection=False,actions=[],limitations=['Not a full battle simulator differential','No official damage, RNG, Champions legality or mobile time-budget oracle'])
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1365,'height':900});page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  page.locator('[data-fill="opp"]').click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click();assert page.locator('#battleArea').is_visible()
  body=page.locator('#fixed45Body')
  def finish_turn(knockout=False):
   for _ in range(24):
    key=page.locator('#fixed45Panel').get_attribute('data-step-key').split(':')[0]
    if key=='recommend':return
    if key=='replaceKO':
     choice=body.locator('.fixed45-switches button').first
     report['actions'].append(choice.inner_text());choice.click();continue
    if key.startswith('opp') and knockout:
     body.get_by_role('button',name='行動前にKO',exact=True).click();report['actions'].append(key+' KO');continue
    hp=body.locator('.fixed45-section.needs-input .fixed45-hp button:visible')
    if hp.count():
     value='90' if key.startswith('opp') else '100'
     body.locator('.fixed45-hp button:visible').filter(has_text=re.compile('^'+value+'$')).click();continue
    choices=body.locator('.fixed45-actions button:visible')
    selected=False
    for choice in choices.all():
     label=choice.inner_text()
     if label in ['不発を指定','不発を指定✓','行動前にKO']:continue
     if label=='不明・外れ・効果なし':choice.click();selected=True;break
     if not label.startswith('交代→'):
      report['actions'].append(label);choice.click();selected=True;break
    assert selected,body.inner_text()
   raise AssertionError('Turn input did not terminate')
  finish_turn();assert page.evaluate('battleTurnNumber')==2
  page.reload(wait_until='networkidle');assert page.locator('#fixed45Panel').get_attribute('data-step-key').startswith('recommend:')
  page.locator('#fixed45SkipBtn').click();finish_turn(True)
  assert page.evaluate('battleTurnNumber')==3
  assert page.evaluate('new Set(state.seenOpp).size')==4
  page.locator('#fixed45BackBtn').click();assert page.evaluate('battleTurnNumber')==2
  assert not page.locator('#fixed45Panel').get_attribute('data-step-key').startswith('recommend:')
  finish_turn(True);assert page.evaluate('battleTurnNumber')==3
  page.reload(wait_until='networkidle');assert page.evaluate('new Set(state.seenOpp).size')==4
  page.locator('#fixed45SkipBtn').click();finish_turn(True)
  assert page.evaluate('battleTurnNumber')==4
  assert page.evaluate('state.turnLog.length')==3
  assert page.evaluate('state.seenOpp.every(i=>state.opp[i].hp===0)')
  assert page.evaluate('manualSwitchCandidateIndices("opp").length')==0
  page.locator('#fixed45ExitBtn').click();page.locator('.match-result-panel summary').click()
  page.locator('#matchResult').select_option('win');page.locator('#saveMatchRecordBtn').click()
  page.locator('#saveMatchRecordBtn').click();assert page.evaluate('matchHistory.length')==1
  page.reload(wait_until='networkidle');assert page.evaluate('matchHistory[0].result')=='win'
  assert page.evaluate('matchHistory[0].turns.length')==3
  assert not errors,errors
  report.update(passed=True,turns=3,opponentPokemon=4,historyRecords=1,reload=True,undoReplay=True)
  browser.close()
 print('PASS complete observed 4-vs-4 match UI: three turns, KO replacements, undo/replay, reload, win record; no state injection')
except Exception as error:
 report['error']=str(error);raise
finally:
 (root/'FULL_MATCH_E2E_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 server.shutdown()
