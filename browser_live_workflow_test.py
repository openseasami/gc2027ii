"""Continuous real PC controls: six manual registrations, leads, fields, KO/replacement,
turn/undo/replay and JSON restore. No battle-state injection or forced clicks.
Automated <45s is a tool latency budget, not human decision-time certification.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
import json,re,time
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,stateInjection=False,nativeWindowsVerified=False,actions=[],layouts=[],limitations=['Automated input time excludes reading/thinking; six-team registration normally belongs to preview, not the official turn clock','Linux Chromium Windows UA compatibility, not native Windows product certification','Observed HP/actions, not a full battle simulator'])
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=browser.new_context(viewport={'width':1366,'height':768},accept_downloads=True,user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0')
  page=context.new_page();page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle');page.locator('#editMyTeamBtn').click();page.locator('#saveMyTeamBtn').click()
  start=time.monotonic()
  roster=['ゴリランダー','サーフゴー','ガブリアス','リキキリン','ドラパルト','ドドゲザン']
  for i,name in enumerate(roster):
   box=page.get_by_role('searchbox',name=f'相手{i+1}体目のポケモン検索',exact=True);box.fill(name);box.press('Enter')
   assert page.locator(f'#opp{i}').input_value()==name
  registered=time.monotonic()
  for slot,name in enumerate(['ガブリアス','リキキリン']):
   page.locator(f'#oppLead{slot}').locator('..').locator('.opponent-lead-buttons button').filter(has_text=re.compile('^'+name+'(?: ✓)?$')).click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click();assert page.evaluate('state.oppActive')==[2,3]
  body=page.locator('#fixed45Body')
  def layout(label):
   page.locator('#fixed45Panel').scroll_into_view_if_needed()
   d=page.evaluate('''()=>{const rail=document.querySelector('.damage-follow-rail'),r=rail.getBoundingClientRect();document.querySelector('#damageOutput').scrollTop=0;
    const rows=[...document.querySelectorAll('#damageOutput .damage-quick-target')].map(e=>{const b=e.getBoundingClientRect();return {slot:e.dataset.targetSlot,visible:b.top>=r.top&&b.bottom<=r.bottom,overflow:e.scrollWidth>e.clientWidth+1}});
    const inputs=['#fixed45Panel','#myRecommendation','#fixed45SkipBtn','#fixed45BackBtn',...Array.from(document.querySelectorAll('#fixed45Body .fixed45-switches button')).map((_,i)=>'#fixed45Body .fixed45-switches button:nth-child('+(i+1)+')')].map(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {selector:s,overlap:b.width>0&&b.height>0&&b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top}}).filter(Boolean);
    return {rows,inputs,position:getComputedStyle(rail).position,width:r.width,top:r.top,bottom:r.bottom,viewport:[innerWidth,innerHeight]};}''')
   assert d['position']=='fixed' and d['width']<=301 and d['top']>=0 and d['bottom']<=d['viewport'][1]+1,d
   assert not any(x['overlap'] for x in d['inputs']),d
   assert all(x['visible'] and not x['overflow'] for x in d['rows']) and len(d['rows'])==4,d
   report['layouts'].append(dict(stage=label,**d))
  def finish_turn(ko=False,switch=False):
   did_switch=False;did_ko=False
   for _ in range(30):
    key=page.locator('#fixed45Panel').get_attribute('data-step-key').split(':')[0]
    if key=='recommend':return
    if key=='replaceKO':
     b=body.locator('.fixed45-switches button').first;report['actions'].append(b.inner_text());b.click();continue
    if ko and key=='opp1' and not did_ko:
     body.get_by_role('button',name='行動前にKO',exact=True).click();did_ko=True;continue
    hp=body.locator('.fixed45-section.needs-input .fixed45-hp button:visible')
    if hp.count():body.locator('.fixed45-hp button:visible').filter(has_text=re.compile('^90$')).click();continue
    if switch and key.startswith('opp') and not did_switch:
     b=body.locator('.fixed45-switches button').filter(has_text='サーフゴー');assert b.count()==1;report['actions'].append(b.inner_text());b.click();did_switch=True;continue
    choices=body.locator('.fixed45-actions button:visible');chosen=False
    for b in choices.all():
     label=b.inner_text()
     if label in ['不発を指定','不発を指定✓','行動前にKO'] or label.startswith('交代→'):continue
     if label=='まもる' or label=='不明・外れ・効果なし':b.click();report['actions'].append(label);chosen=True;break
    if not chosen:
     for b in choices.all():
      label=b.inner_text()
      if label in ['不発を指定','不発を指定✓','行動前にKO'] or label.startswith('交代→'):continue
      b.click();report['actions'].append(label);chosen=True;break
    assert chosen,body.inner_text()
   raise AssertionError('Continuous turn did not finish')
  layout('start');finish_turn(switch=True)
  report['registrationSeconds']=round(registered-start,3);report['registrationToRecommendationSeconds']=round(time.monotonic()-start,3)
  assert report['registrationToRecommendationSeconds']<45,report['registrationToRecommendationSeconds']
  assert page.evaluate('battleTurnNumber')==2
  assert page.locator('#myRecommendation').get_attribute('data-prediction-verified')=='false'
  for w,h in [(1366,768),(1280,720),(1093,614)]:page.set_viewport_size({'width':w,'height':h});layout('after-switch')
  page.set_viewport_size({'width':1366,'height':768})
  # Enter the next result-input phase, then observe field changes using normal controls.
  page.locator('#fixed45SkipBtn').click()
  core='''()=>({turn:battleTurnNumber,my:state.myActive,opp:state.oppActive,hp:[state.myActive.map(i=>state.my[i].hp),state.oppActive.map(i=>state.opp[i].hp)],field:Object.fromEntries(['weather','weatherTurns','terrain','terrainTurns','trTurns','myTailwind','oppTailwind'].map(id=>[id,document.getElementById(id).value])),turns:state.turnLog.length})'''
  before=page.evaluate(core)
  page.locator('#fixed45ExitBtn').click();details=page.locator('#battleFieldDetails')
  if details.get_attribute('open') is None:details.locator(':scope > summary').click()
  for id,value in [('weather','雨'),('weatherTurns','4'),('terrain','エレキ'),('terrainTurns','4'),('trTurns','3'),('myTailwind','3'),('oppTailwind','2')]:page.locator('#'+id).select_option(value)
  page.locator('#mode45Btn').click();finish_turn(ko=True)
  after=page.evaluate(core)
  assert after['turn']==3 and after['field']['weather']=='雨' and after['field']['terrain']=='エレキ',after
  assert after['field']['trTurns']=='2' and after['field']['myTailwind']=='2' and after['field']['oppTailwind']=='1',after
  assert after['opp']!=before['opp'] and len(set(after['opp']))==2,(before,after)
  layout('KO-replacement')
  page.locator('#saveBtn').click();page.reload(wait_until='networkidle');assert page.evaluate(core)==after
  page.locator('#fixed45BackBtn').click();assert page.evaluate(core)==before,(page.evaluate(core),before)
  # Re-enter the same field observations and replay after undo.
  page.locator('#fixed45ExitBtn').click()
  if page.locator('#battleFieldDetails').get_attribute('open') is None:page.locator('#battleFieldDetails > summary').click()
  for id,value in [('weather','雨'),('weatherTurns','4'),('terrain','エレキ'),('terrainTurns','4'),('trTurns','3'),('myTailwind','3'),('oppTailwind','2')]:page.locator('#'+id).select_option(value)
  page.locator('#mode45Btn').click();finish_turn(ko=True);assert page.evaluate(core)==after
  details=page.locator('.compact-details').filter(has=page.locator('#exportJsonBtn'))
  if details.get_attribute('open') is None:details.locator(':scope > summary').click()
  with page.expect_download() as download:page.locator('#exportJsonBtn').click()
  payload=Path(download.value.path()).read_bytes();assert json.loads(payload)['currentMatch']
  page.locator('#fixed45SkipBtn').click();finish_turn();assert page.evaluate('battleTurnNumber')==4
  with page.expect_file_chooser() as chooser:page.locator('#restoreBackupBtn').click()
  chooser.value.set_files(dict(name='practice-continuous.json',mimeType='application/json',buffer=payload));page.wait_for_function('battleTurnNumber===3')
  assert page.evaluate(core)==after
  page.reload(wait_until='networkidle');assert page.evaluate(core)==after
  assert not errors,errors
  report.update(passed=True,manualOpponentRegistrations=6,selectedOpponentLeads=[2,3],voluntarySwitch=True,koForcedReplacement=True,protectRecorded='まもる' in report['actions'],fieldCounterAdvance=True,undoReplay=True,jsonRestore=True,saveReload=True,browserErrors=errors)
  assert report['protectRecorded'],report['actions'];browser.close()
finally:
 (root/'LIVE_WORKFLOW_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');server.shutdown()
print('PASS continuous PC workflow: manual six, leads, HP/switch, fields/TR/Tailwind/Protect, KO replacement, undo/replay, JSON; automated registration-to-recommendation <45s')
