"""Real DOM registration, conditional comparison, save/reload/JSON and v8 migration.
Network disconnected means external requests blocked; localhost server remains usable.
Native Windows/file:// policies are not certified by Linux browsers.
"""
from pathlib import Path
from functools import partial
from threading import Thread
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
import json,os,re,time,hashlib
from helping_hand_browser import exercise_helping_hand
ROOT=Path(__file__).resolve().parent.parent
ART=Path(os.environ.get('VIEWER_ARTIFACT_ROOT',ROOT/'release')).resolve()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def translate_path(self,path):
  if path.startswith('/migration/'):
   migration=ART/'migration'/'GC2027II_Viewer_v8.html'
   return str(migration if migration.exists() else ROOT/'migration'/'GC2027II_Viewer_v8.html')
  return super().translate_path(path)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ART)));Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,artifact=dict(htmlSha256=hashlib.sha256((ART/'GC2027II_Viewer_v9.html').read_bytes()).hexdigest()),nativeWindows=False,fileProtocol='Not executed: managed Chromium blocked file navigation; no policy bypass attempted',offlineMode='External internet blocked; local HTTP server available. No service worker or online CDN needed.',profiles=[],stateInjection=False)
try:
 with sync_playwright() as p:
  browsers=[('Chromium',os.environ.get('VIEWER_CHROMIUM','/usr/bin/chromium')),('Microsoft Edge Linux',os.environ.get('VIEWER_EDGE',str(ROOT/'work/edge/unpacked/opt/microsoft/msedge/msedge')))]
  for brand,executable in browsers:
   if not Path(executable).exists():report['profiles'].append(dict(brand=brand,passed=False,unexecuted='browser not available'));continue
   browser=p.chromium.launch(executable_path=executable,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':1080},accept_downloads=True)
   external=[];errors=[];page=context.new_page();page.set_default_timeout(10000);page.on('pageerror',lambda e:errors.append(str(e)))
   def offline(route):
    if route.request.url.startswith('http://127.0.0.1:'):route.continue_()
    elif route.request.url.startswith('data:'):route.continue_()
    else:external.append(route.request.url);route.abort()
   context.route('**/*',offline)
   result=dict(brand=brand,version=browser.version,passed=False,layouts=[],operations=[],updateMs=[]);report['profiles'].append(result)
   origin=f'http://127.0.0.1:{server.server_port}'
   if brand=='Chromium':
    page.goto(origin+'/migration/GC2027II_Viewer_v8.html',wait_until='domcontentloaded');page.locator('#teamSettings > summary').click()
    for stat,value in [(0,'2'),(1,'32'),(5,'32')]:
     loc=page.locator(f'input[data-ev-slot="0"][data-ev-stat="{stat}"]');loc.fill(value);loc.press('Tab')
    with page.expect_download() as download:page.locator('#exportV8ToV9').click()
    legacy=Path(download.value.path()).read_bytes();assert json.loads(legacy)['version']==8
    result['legacyDownload']=True
   external.clear();page.goto(origin+'/GC2027II_Viewer_v9.html',wait_until='domcontentloaded');assert not errors,errors
   assert page.locator('#calc .calc').count()==8
   if brand=='Chromium':assert page.evaluate('ViewerApp.getState().team[0].points')==[2,32,0,0,0,32];assert 'v8' in page.locator('#notice').inner_text();result['sameOriginV8Migration']=True
   page.locator('#teamSettings > summary').click()
   names=[('rillaboom','ゴリランダー'),('sneasler','オオニューラ'),('garchomp','ガブリアス'),('floetteeternal','フラエッテ'),('incineroar','ガオガエン'),('primarina','アシレーヌ')]
   for i,(id,name) in enumerate(names):
    page.locator(f'[data-picker="team"][data-index="{i}"]').click();page.locator('#pickerSearch').fill(name);page.locator('#pickerGrid [data-pick="'+id+'"]').click()
   for field,value in [('ability','Grassy Surge'),('item','Life Orb'),('nature','Adamant')]:page.locator(f'[data-edit="{field}"][data-index="0"]').select_option(value)
   for stat,value in [(0,'2'),(1,'32'),(5,'32')]:
    loc=page.locator(f'[data-points="{stat}"][data-index="0"]');loc.fill(value);loc.press('Tab')
   for move,id in enumerate(['leafstorm','earthpower','protect','drumbeating']):page.locator(f'[data-move-edit="{move}"][data-index="0"]').select_option(id)
   page.locator('[data-edit="form"][data-index="3"]').select_option('floettemega')
   saved=page.evaluate('ViewerApp.exportTeam()');assert len(saved['team'])==6 and all(p['species'] for p in saved['team']);assert saved['team'][0]['item']=='Life Orb' and saved['team'][0]['nature']=='Adamant'
   assert saved['team'][3]['item']=='Floettite' and saved['team'][3]['form']=='floettemega'
   assert page.locator('#weather').input_value()=='none' and page.locator('#terrain').input_value()=='none','Entry abilities must not overwrite manual field'
   # Invalid individual/total points and duplicate moves must not overwrite a valid team.
   for stat,value in [(1,'33'),(0,'3')]:
    loc=page.locator(f'[data-points="{stat}"][data-index="0"]');loc.fill(value);loc.press('Tab');assert page.evaluate('ViewerApp.exportTeam()')==saved
   page.locator('[data-move-edit="1"][data-index="0"]').select_option(saved['team'][0]['moves'][0]);assert page.evaluate('ViewerApp.exportTeam()')==saved
   page.locator('[data-move-edit="1"][data-index="0"]').select_option(saved['team'][0]['moves'][1]);assert page.evaluate('ViewerApp.exportTeam()')==saved
   page.locator('#teamSettings > summary').click();page.locator('select[data-own="1"]').select_option('3')
   page.locator('[data-form-side="own"][data-index="1"]').select_option('floetteeternal');page.locator('[data-form-side="own"][data-index="1"]').select_option('floettemega')
   for slot,id,name in [(0,'dragonite','カイリュー'),(1,'garchompmegaz','メガガブリアスZ')]:
    page.locator(f'[data-picker="opp"][data-index="{slot}"]').click();page.locator('#pickerSearch').fill(name);page.locator(f'#pickerGrid [data-pick="{id}"]').click()
   def update(fn,label):
    before=int(page.locator('#updateStatus').get_attribute('data-revision'));fn();after=int(page.locator('#updateStatus').get_attribute('data-revision'));assert after>before,(label,before,after)
    result['updateMs'].append(float(page.locator('#updateStatus').get_attribute('data-ms')));result['operations'].append(label)
   update(lambda:page.locator('#weather').select_option('rain'),'weather');update(lambda:page.locator('#terrain').select_option('grassy'),'terrain')
   damage=page.locator('#calc').inner_text();update(lambda:page.locator('#tr').check(),'TR');assert page.locator('#calc').inner_text()==damage,'TR must not change damage'
   update(lambda:page.locator('[data-rank="1"][data-side="own"][data-index="0"][data-stat="0"]').click(),'own rank')
   update(lambda:page.locator('[data-rank="1"][data-side="opp"][data-index="0"][data-stat="1"]').click(),'opponent rank')
   update(lambda:page.locator('[data-burn-side="own"][data-index="0"]').check(),'own burn')
   assert page.locator('[data-burn-side="opp"][data-index="0"]').is_checked() is False
   update(lambda:page.locator('[data-burn-side="opp"][data-index="0"]').check(),'opponent burn')
   assert page.evaluate('ViewerApp.getState().state.ranks.own[0][0]')==1
   for block in page.locator('#calc .damage-move-block').all():
    rows=block.locator(':scope > .condition');assert rows.count()<=3
    visible=[r.locator('strong').inner_text() for r in rows.all() if r.locator('strong').count()];assert len(visible)==len(set(visible)),visible
   for width,height in [(1440,1080),(1366,768),(1280,720),(390,844)]:
    page.set_viewport_size({'width':width,'height':height});page.evaluate('scrollTo(0,0)')
    layout=page.evaluate('''()=>{const a=[...document.querySelectorAll('#opp .card')].map(e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width}}),calc=document.querySelector('#mainDamage').getBoundingClientRect();return {viewport:[innerWidth,innerHeight],horizontal:document.documentElement.scrollWidth>innerWidth+1,opp:a,damageTop:calc.y,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length,pairs:document.querySelectorAll('#calc .calc').length};}''')
    assert not layout['horizontal'] and layout['brokenImages']==0 and layout['pairs']==8,layout
    assert abs(layout['opp'][0]['y']-layout['opp'][1]['y'])<2,layout
    if width>1000:assert layout['damageTop']<700,layout
    result['layouts'].append(layout)
   page.set_viewport_size({'width':1440,'height':1080});page.screenshot(path=str(ROOT/'work'/('viewer-'+brand.replace(' ','-')+'.png')),full_page=True)
   page.locator('#pokemonDetails > summary').click();assert '統計未取得' in page.locator('#detailsGrid').inner_text();assert not re.search(r'\d+(?:\.\d+)?%',page.locator('#detailsGrid').inner_text())
   page.locator('#benchSettings > summary').click()
   for i,(id,name) in enumerate([('tyranitar','バンギラス'),('pelipper','ペリッパー'),('metagross','メタグロス'),('gardevoir','サーナイト')]):
    page.locator(f'[data-picker="bench"][data-index="{i}"]').click();page.locator('#pickerSearch').fill(name);page.locator(f'#pickerGrid [data-pick="{id}"]').click()
   assert page.locator('#benchCalc .calc').count()==32
   result['benchComparisons']=32
   exercise_helping_hand(page,result,ROOT)
   assert not re.search('確定KO|確定1発|推奨行動',page.locator('#calc').inner_text())
   if page.locator('#teamSettings').get_attribute('open') is None:page.locator('#teamSettings > summary').click()
   with page.expect_download() as download:page.locator('#exportJson').click()
   payload=Path(download.value.path()).read_bytes();assert json.loads(payload)==saved
   page.reload(wait_until='domcontentloaded');assert page.evaluate('ViewerApp.exportTeam()')==saved
   page.locator('#teamSettings > summary').click()
   if brand=='Chromium':
    with page.expect_file_chooser() as chooser:page.locator('#importJson').click()
    chooser.value.set_files(dict(name='old-v8.json',mimeType='application/json',buffer=legacy));page.locator('#confirmImport').click();assert page.evaluate('ViewerApp.getState().team[0].points')==[2,32,0,0,0,32]
    page.locator('#restorePrevious').click();assert page.evaluate('ViewerApp.exportTeam()')==saved
   with page.expect_file_chooser() as chooser:page.locator('#importJson').click()
   chooser.value.set_files(dict(name='team.json',mimeType='application/json',buffer=payload));page.locator('#confirmImport').click();assert page.evaluate('ViewerApp.exportTeam()')==saved
   invalid=json.loads(payload);invalid['team'][0]['points'][0]=33
   with page.expect_file_chooser() as chooser:page.locator('#importJson').click()
   chooser.value.set_files(dict(name='invalid.json',mimeType='application/json',buffer=json.dumps(invalid).encode()));page.wait_for_function("document.querySelector('#notice').textContent.includes('読込を中止')");assert page.evaluate('ViewerApp.exportTeam()')==saved
   page.reload(wait_until='domcontentloaded');assert page.evaluate('ViewerApp.exportTeam()')==saved
   # New M-C picker boundaries and real-file migration of old appearance registrations.
   page.locator('[data-picker="opp"][data-index="0"]').click();page.locator('#pickerSearch').fill('メテノ');assert page.locator('#pickerGrid [data-pick="miniormeteor"]').count()==0
   page.locator('#pickerSearch').fill('ビビヨン');assert page.locator('#pickerGrid [data-pick="vivillon"]').count()==1;assert page.locator('#pickerGrid [data-pick="vivillonarchipelago"]').count()==0;page.locator('#pickerClose').click()
   oldcore=json.loads((ROOT/'reference/mc-roster/baseline-core.json').read_text())
   appearance=json.loads(payload);old=oldcore['vivillonarchipelago'];appearance['team'][5]=dict(species='vivillonarchipelago',form='vivillonarchipelago',moves=old['moves'][:4],ability=old['abilities'][0],item='',nature='Modest',points=[32,0,0,32,0,2])
   if page.locator('#teamSettings').get_attribute('open') is None:page.locator('#teamSettings > summary').click()
   with page.expect_file_chooser() as chooser:page.locator('#importJson').click()
   chooser.value.set_files(dict(name='old-v9-appearance.json',mimeType='application/json',buffer=json.dumps(appearance).encode()));page.locator('#confirmImport').click();normalized=page.evaluate('ViewerApp.exportTeam()');expected={**appearance['team'][5],'species':'vivillon','form':'vivillon'};assert normalized['team'][5]==expected
   with page.expect_file_chooser() as chooser:page.locator('#importJson').click()
   chooser.value.set_files(dict(name='team.json',mimeType='application/json',buffer=payload));page.locator('#confirmImport').click();assert page.evaluate('ViewerApp.exportTeam()')==saved
   # Stored legacy fixture tests the load-failure backup path; no battle state is injected.
   excluded=json.loads(payload);old=oldcore['miniormeteor'];excluded['team'][0]=dict(species='miniormeteor',form='miniormeteor',moves=old['moves'][:4],ability=old['abilities'][0],item='',nature='Serious',points=[0,0,0,0,0,0]);raw=json.dumps(excluded,ensure_ascii=False)
   page.evaluate("raw=>localStorage.setItem('gc2027ii-viewer-v9-team',raw)",raw);page.reload(wait_until='domcontentloaded');assert '対象外' in page.locator('#notice').inner_text()
   page.locator('#teamSettings > summary').click()
   with page.expect_download() as original:page.locator('#exportJson').click()
   assert Path(original.value.path()).read_text()==raw
   assert page.evaluate("localStorage.getItem('gc2027ii-viewer-v9-team')")==raw
   with page.expect_file_chooser() as chooser:page.locator('#importJson').click()
   chooser.value.set_files(dict(name='team.json',mimeType='application/json',buffer=payload));page.locator('#confirmImport').click();page.reload(wait_until='domcontentloaded');assert page.evaluate('ViewerApp.exportTeam()')==saved
   result.update(mcPickerRestricted=True,appearanceJsonMigration=True,outOfScopeOriginalBackup=True,storageMigrationFixture=True)
   assert not errors,errors;assert not external,external
   result.update(passed=True,sixManualRegistrations=True,megaBeforeAfter=True,manualWeatherRetained=True,independentBurns=True,jsonRoundTrip=True,invalidImportAtomic=True,reload=True,bench=True,externalRequests=external,pageErrors=errors,offlineInternetBlocked=True)
   context.close();browser.close()
  report['passed']=len(report['profiles'])==2 and all(p['passed'] for p in report['profiles'])
finally:
 server.shutdown();Path(os.environ.get('VIEWER_BROWSER_REPORT',ROOT/'reference/BROWSER_RESULTS.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
assert report['passed'],report
print('PASS Chromium + real Microsoft Edge Linux: six manual registrations, mega, ranks/burn/fields/TR, eight pairs, 8 layouts, bench, v8 migration, save/reload/JSON and external-network offline')
