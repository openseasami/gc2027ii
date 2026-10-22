"""PC Chromium mouse/keyboard acceptance. Windows UA compatibility is not native Windows certification."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
import json,re,time,platform
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,hostPlatform=platform.system(),nativeWindowsVerified=False,nativeChromeEdgeVerified=False,profiles=[],limitations=['Linux Chromium with Windows Chrome/Edge UA compatibility profiles; not native Windows/browser distributions','Automated input timing excludes human decision time','Observed match workflow, not full battle oracle'])
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);report['chromiumVersion']=browser.version
  for brand,suffix in [('Chrome',''),('Edge',' Edg/130.0.0.0')]:
   context=browser.new_context(viewport={'width':1366,'height':768},user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'+suffix,accept_downloads=True)
   page=context.new_page();page.set_default_timeout(6000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   profile=dict(compatibilityUA=brand,layouts=[],clicks=0);report['profiles'].append(profile)
   page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
   page.locator('#editMyTeamBtn').click();page.locator('#saveMyTeamBtn').click();page.locator('[data-fill="opp"]').click()
   for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
   page.locator('#startMatchBtn').click();body=page.locator('#fixed45Body')
   for w,h in [(1366,768),(1920,1080),(1280,720),(1093,614)]:
    page.set_viewport_size({'width':w,'height':h});page.locator('#fixed45Panel').scroll_into_view_if_needed();page.wait_for_timeout(100)
    geometry=page.evaluate('''() => {
     const rail=document.querySelector('.damage-follow-rail'),r=rail.getBoundingClientRect(),out=document.getElementById('damageOutput');out.scrollTop=0;
     const rows=[...out.querySelectorAll('.damage-quick-target')].map(e=>{const x=e.getBoundingClientRect();return {slot:e.dataset.targetSlot,idx:e.dataset.targetIdx,text:e.textContent,visible:x.top>=r.top&&x.bottom<=r.bottom,overflow:e.scrollWidth>e.clientWidth+1}});
     const input=document.getElementById('fixed45Panel').getBoundingClientRect();
     return {width:r.width,top:r.top,bottom:r.bottom,left:r.left,inputRight:input.right,rows,horizontal:document.documentElement.scrollWidth>innerWidth+1,position:getComputedStyle(rail).position};
    }''')
    assert geometry['position']=='fixed' and geometry['width']<=301 and geometry['inputRight']<=geometry['left']+1,geometry
    assert geometry['top']>=0 and geometry['bottom']<=h+1 and not geometry['horizontal'],geometry
    assert len(geometry['rows'])==4 and all(r['visible'] and not r['overflow'] for r in geometry['rows']),geometry
    assert [r['slot'] for r in geometry['rows']]==['0','1','0','1'],geometry
    assert not re.search(r'確定(?:\d+発|KO)',page.locator('#damageOutput').text_content())
    before=page.locator('.damage-follow-rail').bounding_box();page.mouse.wheel(0,180);page.wait_for_timeout(100);after=page.locator('.damage-follow-rail').bounding_box();assert abs(before['y']-after['y'])<1
    profile['layouts'].append(dict(viewport=[w,h],**geometry))
   page.set_viewport_size({'width':1366,'height':768})
   # Exercise real turn input including one voluntary switch; no state injection.
   started=time.monotonic();switched=False
   for _ in range(24):
    key=page.locator('#fixed45Panel').get_attribute('data-step-key').split(':')[0]
    if key=='recommend':break
    hp=body.locator('.fixed45-section.needs-input .fixed45-hp button:visible')
    if hp.count():
     body.locator('.fixed45-hp button:visible').filter(has_text=re.compile('^90$')).click();profile['clicks']+=1;continue
    switches=body.locator('.fixed45-switches button:visible')
    if not switched and switches.count():
     switches.first.click();switched=True;profile['clicks']+=1;continue
    choices=body.locator('.fixed45-actions button:visible');selected=False
    for choice in choices.all():
     label=choice.inner_text()
     if not switched and label.startswith('交代→'):
      choice.click();switched=True;selected=True;profile['clicks']+=1;break
    if selected:continue
    for choice in choices.all():
     label=choice.inner_text()
     if label in ['不発を指定','不発を指定✓','行動前にKO'] or label.startswith('交代→'):continue
     choice.click();selected=True;profile['clicks']+=1;break
    assert selected,body.inner_text()
   assert page.locator('#fixed45Panel').get_attribute('data-step-key').startswith('recommend:'),body.inner_text()
   profile['automatedTurnSeconds']=round(time.monotonic()-started,3);assert profile['automatedTurnSeconds']<45
   assert switched and page.evaluate('battleTurnNumber')==2,(switched,page.evaluate('battleTurnNumber'),profile['clicks'],body.inner_text())
   assert page.locator('#myRecommendation').get_attribute('data-prediction-verified')=='false'
   # Header controls used to be hidden/covered by the fixed rail.
   page.locator('#saveBtn').click();page.reload(wait_until='networkidle');assert page.evaluate('battleTurnNumber')==2
   page.locator('#fixed45BackBtn').click();assert page.evaluate('battleTurnNumber')==1
   # Export and restore through real file UI; accept only the application's confirmation.
   page.locator('.compact-details').filter(has=page.locator('#exportJsonBtn')).locator('summary').click()
   with page.expect_download() as download:page.locator('#exportJsonBtn').click()
   payload=Path(download.value.path()).read_bytes();backup=json.loads(payload);assert backup['currentMatch']
   page.locator('#fixed45SkipBtn').click()
   with page.expect_file_chooser() as chooser:page.locator('#restoreBackupBtn').click()
   chooser.value.set_files(dict(name='pc-backup.json',mimeType='application/json',buffer=payload));page.wait_for_timeout(300)
   assert page.evaluate('battleTurnNumber')==backup['currentMatch']['battleTurnNumber'] if 'battleTurnNumber' in backup['currentMatch'] else page.evaluate('battleTurnNumber')==1
   page.reload(wait_until='networkidle');assert page.evaluate('battleTurnNumber')==1
   profile.update(switch=True,hpInput=True,turn=True,saveReload=True,undo=True,jsonRestore=True,errors=errors);assert not errors,errors
   context.close()
  report['passed']=True;browser.close()
finally:
 server.shutdown();(root/'PC_BROWSER_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS PC Chromium Chrome/Edge UA profiles: 8 layouts, dual targets, real 45s turn/switch/HP/save/undo/JSON restore')
