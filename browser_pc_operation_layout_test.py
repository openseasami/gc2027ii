"""Verify the new compact reference is current, visible and does not cover damage."""
from pathlib import Path
from http.server import ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
from pc_operation_benchmark import Quiet,UA
import json,re
ROOT=Path(__file__).resolve().parent
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,layouts=[],stateInjection=False,checks=[])
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1366,'height':768},user_agent=UA);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  page.locator('#editMyTeamBtn').click();page.locator('#saveMyTeamBtn').click();page.locator('[data-fill="opp"]').click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click()
  def check(label):
   current=page.evaluate("""()=>{const s=document.querySelector('#pcLiveRecommendation'),r=s.getBoundingClientRect(),out=document.querySelector('#damageOutput'),o=out.getBoundingClientRect();
    const lines=[...document.querySelectorAll('#myRecommendation .primary-rec-actions .rec-line')].map(e=>e.textContent);
    return {label:s.textContent,turn:s.dataset.turn,verified:s.dataset.predictionVerified,expectedTurn:battleTurnNumber,
     lines:[...s.querySelectorAll('p')].map(e=>e.textContent),expected:lines,top:r.top,bottom:r.bottom,height:r.height,
     clipped:s.scrollHeight>s.clientHeight+1,outputBottom:o.bottom,viewport:[innerWidth,innerHeight],
     rows:[...out.querySelectorAll('.damage-quick-target')].map(e=>{const b=e.getBoundingClientRect();return {visible:b.top>=o.top&&b.bottom<=o.bottom+1,bottom:b.bottom};}),
     panelPosition:getComputedStyle(document.querySelector('#fixed45Panel')).position};}""")
   assert current['turn']==str(current['expectedTurn']) and current['verified']=='false',current
   assert current['top']>=0 and current['bottom']<=current['viewport'][1] and current['height']>0,current
   assert not current['clipped'] and current['lines'][:len(current['expected'])]==current['expected'],current
   assert len(current['rows'])==4 and all(row['visible'] for row in current['rows']),current
   assert current['outputBottom']<=current['top']+1 and current['panelPosition']=='static',current
   report['layouts'].append(dict(stage=label,**current))
  for width,height in [(1920,1080),(1366,768),(1280,720),(1093,614)]:
   page.set_viewport_size({'width':width,'height':height});page.locator('#damageOutput').evaluate('(e)=>e.scrollTop=0')
   check('before input');page.mouse.wheel(0,900);page.wait_for_timeout(80);check('after document scroll')
  page.set_viewport_size({'width':1366,'height':768})
  body=page.locator('#fixed45Body');hp=lambda n:body.locator('.fixed45-hp button:visible').filter(has_text=re.compile('^'+str(n)+'$'))
  hp(90).click();assert body.locator('.fixed45-completed-hp').get_attribute('open') is not None
  hp(80).click();assert page.evaluate('state.opp[state.oppActive[0]].hp')==80
  check('immediate corrected HP')
  report['checks'].append('HP correction exposed with no disclosure click; summary matches current authoritative recommendation')
  page.set_viewport_size({'width':390,'height':844})
  assert not page.locator('#pcLiveRecommendation').is_visible()
  report['checks'].append('narrow screen summary hidden; original mobile layout retained')
  assert not errors,errors;report['browserErrors']=errors;browser.close();report['passed']=True
finally:
 server.shutdown();(ROOT/'PC_OPERATION_LAYOUT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS PC reference recommendation: current, reference-only, fixed rail/no overlap, 4 target rows, normal input scroll, mobile preserved')
