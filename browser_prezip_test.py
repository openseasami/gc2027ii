"""Actual page form references, recalculation, contrast and offline/local isolation.
No runtime function replacement; direct state fixtures isolate form stat lookup.
"""
from pathlib import Path
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
import json,math
ROOT=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,nativeWindowsVerified=False,limitations=[
 'Linux Chromium; direct state fixtures check form data references, not official form-change trigger rules',
 'Offline requires a successful first HTTP load and intact browser cache; cold install offline is not certified',
 'Local/public separation tested using distinct loopback origins, without contacting or changing the public site'])
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':1366,'height':768});page=ctx.new_page();page.set_default_timeout(10000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  url=f'http://127.0.0.1:{server.server_port}/index.html'
  page.goto(url,wait_until='networkidle')
  refs=json.loads((ROOT/'reference-data/stats-moves/showdown-normalized.json').read_text())['species']
  forms=page.evaluate('''() => {
   const rows=[];savedMyProfiles[0]={nature:'まじめ',hp:0,atk:0,def:0,spa:0,spd:0,spe:0};
   for(const [name,info]of Object.entries(REGULATION_MC.megaInfo)){
    state.myTeam=[name,'イーブイ'];state.myActive=[0,1];state.my={0:{hp:100},1:{hp:100}};savedMyProfiles[0].item=info.stone;
    for(const evolved of [false,true]){
     state.my[0].megaEvolved=evolved;
     const effective=effectiveBattleName('my',0,name),expected=evolved?info.mega:info.base;
     if(effective!==expected)throw Error('Wrong Mega reference '+name);
     rows.push({kind:'mega',name,phase:evolved?'after':'before',effective,id:NATIONAL_DEX[effective].id,
      stats:{...Object.fromEntries(['hp','atk','def','spa','spd'].map(k=>[k,BATTLE_DATA[effective][k]])),spe:BASE_SPEED[effective]},speed:intrinsicBattleSpeed(name,'my',0)});
    }
   }
   for(const name of ['ロトム(ウォッシュロトム)','ロトム(ヒートロトム)','イダイトウ','イダイトウ♀','ギルガルド','ギルガルド(ブレードフォルム)']){
    if(!NATIONAL_DEX[name]||!BATTLE_DATA[name])continue;
    state.myTeam=[name,'イーブイ'];state.my[0]={hp:100};savedMyProfiles[0].item='なし';
    const effective=effectiveBattleName('my',0,name);
    rows.push({kind:'form-selection',name,effective,id:NATIONAL_DEX[effective].id,
     stats:{...Object.fromEntries(['hp','atk','def','spa','spd'].map(k=>[k,BATTLE_DATA[effective][k]])),spe:BASE_SPEED[effective]},speed:intrinsicBattleSpeed(name,'my',0)});
   }
   return rows;
  }''')
  assert sum(x['kind']=='mega' for x in forms)==164
  for row in forms:
   assert row['stats']==refs[row['id']]['stats'],row
   assert row['speed']==row['stats']['spe']+20,row
  report['formReferences']=dict(megaForms=82,megaBeforeAfter=164,otherFormSelections=sum(x['kind']=='form-selection' for x in forms),rows=forms)
  # New page resets synthetic form fixtures; start the actual standard workflow.
  page.reload(wait_until='networkidle');page.locator('[data-fill="opp"]').click()
  for i in range(4):page.locator('#myPickButtons .my-pick-btn').nth(i).click()
  page.locator('#startMatchBtn').click();page.locator('#fixed45ExitBtn').click()
  before=page.locator('#damageOutput').inner_text()
  page.locator('.poke-card[data-side="opp"][data-slot="0"] [data-hp="10"]').click()
  after=page.locator('#damageOutput').inner_text();assert before!=after,'Stale KO output after HP input'
  assert page.evaluate('state.opp[state.oppActive[0]].hp')==10
  page.locator('.poke-card[data-side="opp"][data-slot="0"] [data-hp="100"]').click()
  assert page.locator('#damageOutput').inner_text()==before,'HP reset retained stale results'
  assert page.locator('#damageOutput').get_attribute('data-prediction-verified')=='false'
  assert not page.locator('#damageOutput .ko-certain').count()
  report['hpRecalculation']=dict(changedOnHpInput=True,restoredOnReset=True,provisional=True)
  contrast=page.locator('#damageOutput').evaluate('''root=>{
   function rgb(s){return (s.match(/[\\d.]+/g)||[]).map(Number)}
   function luminance(a){const c=a.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
   return [...root.querySelectorAll('.damage-quick-line,.damage-quick-ko,.opp-name')].filter(e=>e.getBoundingClientRect().height>0).map(e=>{
    const fg=rgb(getComputedStyle(e).color);let parent=e,bg;
    while(parent){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]>=.999){bg=c;break}parent=parent.parentElement}
    bg=bg||[255,255,255];const a=luminance(fg),b=luminance(bg);
    return {text:e.textContent,fg,bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   });
  }''')
  assert contrast and all(x['ratio']>=4.5 for x in contrast),contrast
  report['fixedRailContrast']=contrast
  page.locator('#saveBtn').click();original=page.evaluate('JSON.stringify(currentMatchPayload())')
  page.evaluate('navigator.serviceWorker.ready')
  if not page.evaluate('!!navigator.serviceWorker.controller'):page.reload(wait_until='networkidle')
  await_cache=page.evaluate('''async()=>{
   const names=await caches.keys(),name=names.find(x=>x.endsWith('v2.9.14'));const c=await caches.open(name);
   const response=await c.match(new URL('./index.html',location.href).href);return {text:await response.text(),urls:(await c.keys()).map(x=>new URL(x.url).pathname.split('/').pop())};
  }''')
  assert sha256(await_cache['text'].encode()).hexdigest()==sha256((ROOT/'index.html').read_bytes()).hexdigest()
  assert 'three-attack-effects.js' in await_cache['urls']
  ctx.set_offline(True);page.reload(wait_until='networkidle')
  assert page.locator('#battleArea').is_visible()
  assert page.evaluate('JSON.stringify(currentMatchPayload())')==original
  page.locator('.poke-card[data-side="opp"][data-slot="0"] [data-hp="50"]').click()
  page.locator('#saveBtn').click();page.reload(wait_until='networkidle')
  assert page.evaluate('state.opp[state.oppActive[0]].hp')==50
  assert page.evaluate("typeof ThreeAttackEffects==='object' && typeof CriticalEffects==='object' && Object.keys(BattleCore.RESIST_BERRY_TYPES).length===18")
  report['offline']=dict(cachedCorrectedRuntime=True,allRuntimeScripts=True,matchRestore=True,hpRecalculate=True,saveReload=True)
  ctx.set_offline(False)
  # Hostname changes origin. Use only our local server; never the public deployment.
  alternate=ctx.new_page();alternate.goto(f'http://localhost:{server.server_port}/index.html',wait_until='networkidle')
  assert alternate.evaluate('localStorage.getItem(STORE)') is None
  assert alternate.locator('#battleArea').is_hidden()
  assert page.evaluate('state.opp[state.oppActive[0]].hp')==50
  report['originIsolation']=dict(separateHostnameStores=True,sourceMatchUnaffected=True,publicSiteContacted=False)
  assert not errors,errors;report.update(passed=True,errors=errors,chromiumVersion=browser.version)
  browser.close()
finally:
 server.shutdown();(ROOT/'PREZIP_BROWSER_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS pre-ZIP: 82 Mega pre/post references, selected forms, HP recalc, rail contrast, corrected offline cache/save, origin isolation')
