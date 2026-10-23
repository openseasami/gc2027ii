"""Identical DOM tasks on a selected runtime; measurements never inject battle state.

Clicks/Enter/fill are explicit Playwright commands. Scroll events include browser
auto-scroll and are reported separately from explicit wheel commands (zero).
Latency is input event -> first painted frame after synchronous refresh, not
human perception, decision time, network latency or a 45-second certification.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import argparse, json, re, time

ROOT=Path(__file__).resolve().parent
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass

def measure(runtime, samples=3):
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(runtime)))
 Thread(target=server.serve_forever,daemon=True).start()
 report=dict(completion=False,passed=False,runtime=str(runtime),samples=[],stateInjection=False,nativeWindowsVerified=False,
  definitions=dict(clicks='Explicit DOM click commands, including disclosure and correction',inputs='fill and Enter commands',scrollEvents='Captured browser scroll events including automatic scrolling; not human gestures',explicitWheelCommands=0,updateLatency='DOM event to next requestAnimationFrame after synchronous refresh; milliseconds',automatedSeconds='Playwright controls plus assertions; excludes human reading/thinking and launch'))
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   for sample in range(samples):
    context=browser.new_context(viewport={'width':1366,'height':768},user_agent=UA)
    page=context.new_page();page.set_default_timeout(8000);errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    page.add_init_script("""window.__measure={scrollEvents:0,updates:[],counts:{},serial:0};
     addEventListener('scroll',()=>__measure.scrollEvents++,true);
     for(const type of ['click','input','change'])addEventListener(type,e=>{
       __measure.serial++;__measure.eventAt=performance.now();
     },true);""")
    page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
    page.evaluate("""()=>{for(const name of ['refresh','fixed45Render','renderMyRecommendations','renderDamageOutput','save']){
      const original=window[name];window[name]=function(...args){__measure.counts[name]=(__measure.counts[name]||0)+1;
       const out=original.apply(this,args);
       if(name==='refresh'){const serial=__measure.serial,at=__measure.eventAt;
        requestAnimationFrame(()=>{if(at!=null)__measure.updates.push({serial,ms:performance.now()-at});});}
       return out;};}}""")
    page.locator('#editMyTeamBtn').click();page.locator('#saveMyTeamBtn').click()
    result=dict(sample=sample,actions=[],phases={},corrections={},updateChecks=[])
    phase='registration';started=time.monotonic()
    def act(label,fn,kind='click',updated=False):
     before=page.evaluate('JSON.parse(JSON.stringify(__measure))');a=time.monotonic();fn()
     page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
     after=page.evaluate('JSON.parse(JSON.stringify(__measure))')
     counts={k:after['counts'].get(k,0)-before['counts'].get(k,0) for k in after['counts']}
     latencies=[x['ms'] for x in after['updates'][len(before['updates']):]]
     if updated:assert counts.get('renderMyRecommendations',0)>=1 and counts.get('renderDamageOutput',0)>=1,(label,counts)
     result['actions'].append(dict(phase=phase,label=label,kind=kind,seconds=round(time.monotonic()-a,4),scrollEvents=after['scrollEvents']-before['scrollEvents'],calls=counts,updateMs=latencies))
    def click(label,loc,updated=False):act(label,loc.click,updated=updated)
    roster=['ゴリランダー','サーフゴー','ガブリアス','リキキリン','ドラパルト','ドドゲザン']
    for i,name in enumerate(roster):
     box=page.get_by_role('searchbox',name=f'相手{i+1}体目のポケモン検索',exact=True)
     act('register '+name,lambda b=box,n=name:b.fill(n),'fill');act('confirm roster',lambda b=box:b.press('Enter'),'Enter')
    result['phases'][phase]=round(time.monotonic()-started,4);phase='leads';a=time.monotonic()
    for slot,name in enumerate(['ガブリアス','リキキリン']):click('opponent lead',page.locator(f'#oppLead{slot}').locator('..').locator('.opponent-lead-buttons button').filter(has_text=re.compile('^'+name+'(?: ✓)?$')))
    for i in range(4):click('own selection',page.locator('#myPickButtons .my-pick-btn').nth(i))
    click('start',page.locator('#startMatchBtn'));result['phases'][phase]=round(time.monotonic()-a,4)
    body=page.locator('#fixed45Body')
    def hp(value,label='HP'):
     loc=body.locator('.fixed45-hp button:visible').filter(has_text=re.compile('^'+str(value)+'$'))
     click(label,loc,True)
    phase='firstTurn';a=time.monotonic()
    hp(90,'mistaken opponent HP')
    if not body.locator('.fixed45-hp button:visible').count():click('expand HP correction',body.locator('.fixed45-completed-hp > summary'))
    hp(80,'correct opponent HP');assert page.evaluate('state.opp[state.oppActive[0]].hp')==80
    result['corrections']['opponentHp']=True
    def move():
     options=body.locator('.fixed45-actions button:visible')
     valid=[b for b in options.all() if b.inner_text() not in ['不発を指定','不発を指定✓','行動前にKO'] and not b.inner_text().startswith('交代→')]
     preferred=next((b for b in valid if b.inner_text() in ['まもる','不明・外れ・効果なし']),valid[0] if valid else None)
     assert preferred is not None,body.inner_text();click('observed move/effect',preferred,True)
    move();assert page.locator('#fixed45Panel').get_attribute('data-step-key').startswith('opp2:')
    hp(90);click('opponent switch',body.locator('.fixed45-switches button').filter(has_text='サーフゴー'),True)
    hp(90,'mistaken own HP');click('return to own HP',page.locator('#fixed45BackBtn'),True)
    hp(80,'correct own HP');assert page.evaluate('state.my[state.myActive[0]].hp')==80
    result['corrections']['ownHp']=True;hp(90)
    assert page.evaluate('battleTurnNumber')==2
    assert page.locator('#myRecommendation').get_attribute('data-prediction-verified')=='false'
    result['phases'][phase]=round(time.monotonic()-a,4)
    phase='koTurn';a=time.monotonic();click('next result input',page.locator('#fixed45SkipBtn'))
    click('observed KO',body.get_by_role('button',name='行動前にKO',exact=True),True)
    for _ in range(24):
     key=page.locator('#fixed45Panel').get_attribute('data-step-key').split(':')[0]
     if key=='recommend':break
     if key=='replaceKO':click('forced replacement',body.locator('.fixed45-switches button').first,True)
     elif body.locator('.fixed45-section.needs-input .fixed45-hp button:visible').count():hp(90)
     else:move()
    assert page.evaluate('battleTurnNumber')==3
    result['phases'][phase]=round(time.monotonic()-a,4)
    result['automatedSeconds']=round(time.monotonic()-started,4)
    result['clicks']=sum(x['kind']=='click' for x in result['actions']);result['inputs']=sum(x['kind']!='click' for x in result['actions'])
    result['scrollEvents']=sum(x['scrollEvents'] for x in result['actions'])
    result['refreshCalls']=sum(x['calls'].get('refresh',0) for x in result['actions'])
    result['panelRenderCalls']=sum(x['calls'].get('fixed45Render',0) for x in result['actions'])
    result['updateMs']=[v for x in result['actions'] for v in x['updateMs']]
    result['finalState']=page.evaluate("""()=>({turn:battleTurnNumber,my:state.myActive,opp:state.oppActive,myHp:state.myActive.map(i=>state.my[i].hp),oppHp:state.oppActive.map(i=>state.opp[i].hp),log:state.turnLog.length})""")
    assert not errors,errors;result['browserErrors']=errors;report['samples'].append(result);context.close()
   browser.close()
  report['passed']=True
 finally:server.shutdown()
 return report

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=ROOT);parser.add_argument('--out',type=Path,required=True);parser.add_argument('--samples',type=int,default=3)
 args=parser.parse_args();report=measure(args.root,args.samples);args.out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('PASS PC DOM benchmark',[(s['clicks'],s['automatedSeconds'],s['panelRenderCalls']) for s in report['samples']])
