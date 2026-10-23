"""Native Showdown full matches replayed as observed facts in the actual support UI.
Explicit fixture setup/API observations supplement existing no-injection real DOM E2E.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
from hashlib import sha256
import json,subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass

def run(group):
 reference=json.loads(subprocess.check_output(['node','series-match-reference.js',str(group)],cwd=ROOT,text=True))
 trace_dir=ROOT/'reference-data/series-matches';trace_dir.mkdir(parents=True,exist_ok=True);trace=(trace_dir/f'group-{group}.json');trace.write_text(json.dumps(reference,ensure_ascii=False,separators=(',',':'))+'\n')
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
 report=dict(completion=False,passed=False,group=group,oracle=reference['oracle'],format=reference['format'],games=[],limitations=['Custom Gen9 fixtures, not official Champions full-engine parity or event legality','HP/status and secondary rank/item outcomes are observations; not claimed as auto-applied','Recommendations checked for existence, legal actions and uncertainty, not optimal multi-turn policy','Linux Chromium with Windows UA, not native Windows Chrome/Edge certification','Terminal victory can interrupt residuals: final HP/status/items/actives checked; final automatic field/stage residual comparison explicitly excluded'])
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page(viewport={'width':1366,'height':900},accept_downloads=True,user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
   def inject():page.evaluate((ROOT/'series-match-replay.js').read_text())
   inject()
   for game in reference['games']:
    if report['games']:page.locator('#newMatchBtn').click()
    page.evaluate('g=>SeriesMatch.initialize(g)',game)
    row=dict(id=game['id'],family=game['family'],seed=game['seed'],selected=game['selected'],turns=0,complete=False,winner=game['winner'],undoReplay=False,jsonRestore=False,saveReload=False)
    report['games'].append(row)
    for turn in game['turns']:
     before=page.evaluate('SeriesMatch.stable()');page.evaluate('t=>SeriesMatch.preview(t)',turn);after=page.evaluate('t=>SeriesMatch.observe(t)',turn);row['turns']+=1
     if turn['number']==2:
      assert page.evaluate('undoLastGuide45Turn()') is True
      # Undo preserves its entry-event random journal; the observed state must match.
      actual=page.evaluate('SeriesMatch.stable()');assert actual['turn']==before['turn'] and actual['field']==before['field']
      for side in ['my','opp']:
       for idx,d in before['state'][side].items():
        for k in ['hp','status','itemConsumed','atkStage','defStage','spaStage','spdStage','speStage']:assert actual['state'][side][idx].get(k)==d.get(k),(game['id'],k,idx)
      replay=page.evaluate('t=>SeriesMatch.observe(t)',turn);assert replay['turn']==after['turn'] and replay['field']==after['field'];row['undoReplay']=True
     if turn['number']==3:
      # Actual backup schema validation + transactional restore; real file controls separately in DOM E2E.
      payload=page.evaluate('createBackupPayload()');page.evaluate('state.my[state.myActive[0]].hp=0')
      assert page.evaluate('p=>{const v=validateBackupPayload(p);if(v!==true&&v?.ok===false)throw Error(JSON.stringify(v));return restoreBackupPayload(p)}',payload) is not False
      restored=page.evaluate('SeriesMatch.stable()');assert restored['turn']==after['turn'] and restored['field']==after['field'];assert restored['state']['my']==after['state']['my'];assert restored['state']['opp']==after['state']['opp'];row['jsonRestore']=True
     if turn['number']==min(4,len(game['turns'])):
      rows=page.evaluate('SeriesMatch.oracle');counts=page.evaluate('SeriesMatch.counts');page.reload(wait_until='networkidle');inject();page.evaluate('v=>{SeriesMatch.oracle.push(...v.rows);Object.assign(SeriesMatch.counts,v.counts)}',dict(rows=rows,counts=counts));page.evaluate('g=>{window.SeriesMatchGame=g}',game)
      # Reinitialize only the harness reference; never replace restored battle data.
      page.evaluate('g=>SeriesMatch.setCurrent(g)',game)
      actual=page.evaluate('SeriesMatch.stable()');assert actual['turn']==after['turn'] and actual['field']==after['field'];assert actual['state']['my']==after['state']['my'];assert actual['state']['opp']==after['state']['opp'];row['saveReload']=True
     page.evaluate('SeriesMatch.reset()')
    result='win' if game['winner']=='my' else 'loss';assert game['winner'] in ['my','opp']
    final=page.evaluate('SeriesMatch.stable()');loser='opp' if result=='win' else 'my';assert all(final['state'][loser][str(i)]['hp']==0 for i in game['selected'][1 if loser=='opp' else 0])
    if page.locator('#fixed45ExitBtn').is_visible():page.locator('#fixed45ExitBtn').click()
    details=page.locator('.match-result-panel');
    if details.get_attribute('open') is None:details.locator('summary').click()
    page.locator('#matchResult').select_option(result);page.locator('#saveMatchRecordBtn').click();page.locator('#saveMatchRecordBtn').click()
    assert page.evaluate('matchHistory.length')==len(report['games']);assert page.evaluate('matchHistory.find(r=>r.id===state.savedMatchRecordId).result')==result
    assert page.evaluate('state.turnLog.length')==len(game['turns']);row['complete']=True
    sample=[r for r in page.evaluate('SeriesMatch.oracle') if r['id'].split('/')[0]==str(game['id'])]
    check=json.loads(subprocess.check_output(['node','live-practical-oracle.js'],input=json.dumps(sample),cwd=ROOT,text=True));assert check['failureCount']==0,check
    report['completedMatches']=sum(g['complete'] for g in report['games'])
    (ROOT/f'SERIES_MATCH_GROUP_{group}_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('Completed native/observed match',game['id'],row['turns'],game['winner'],flush=True)
   report['counts']=page.evaluate('SeriesMatch.counts');oracle=page.evaluate('SeriesMatch.oracle');report['differential']=json.loads(subprocess.check_output(['node','live-practical-oracle.js'],input=json.dumps(oracle),cwd=ROOT,text=True));report['browserErrors']=errors
   assert report['differential']['failureCount']==0,report['differential'];assert not errors,errors
   assert len(report['games'])==10 and all(g['complete'] and g['undoReplay'] and g['jsonRestore'] and g['saveReload'] for g in report['games'])
   report['traceSha256']=sha256(trace.read_bytes()).hexdigest();report['traceFile']=trace.relative_to(ROOT).as_posix();report['passed']=True;report['sourceSha256']={n:sha256((ROOT/n).read_bytes()).hexdigest() for n in ['index.html','series-match-reference.js','series-match-replay.js','series_match_harness.py','live-practical-oracle.js']};browser.close()
 except Exception as e:report['error']=str(e);raise
 finally:(ROOT/f'SERIES_MATCH_GROUP_{group}_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');server.shutdown()
 print('PASS complete native/observed series',group,len(report['games']),report['counts'])
