"""36 real joint-planner boards + six critical constraints, with independent damage/order oracle.
Fixtures are explicit observations, not official legality or optimal-policy certification.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
from hashlib import sha256
import json,subprocess
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
report=dict(completion=False,passed=False,scope='Explicit joint-planner constraints and local Gen9 damage/speed/order comparison, not policy optimality or official Champions certification')
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='networkidle')
  result=page.evaluate((root/'live-practical-scenarios.js').read_text())
  oracle=json.loads(subprocess.check_output(['node','live-practical-oracle.js'],input=json.dumps(result['oracle']),text=True,cwd=root))
  report.update(checks=result['checks'],total=len(result['checks']),successful=sum(x['passed'] for x in result['checks']),differential=oracle,browserErrors=errors,
   sourceSha256={n:sha256((root/n).read_bytes()).hexdigest() for n in ['index.html','live-practical-scenarios.js','live-practical-oracle.js','browser_live_practical_test.py']})
  report['passed']=report['successful']==report['total'] and report['total']>=30 and oracle['failureCount']==0 and not errors
  print(json.dumps({k:report[k] for k in ['passed','total','successful','differential']},ensure_ascii=False));print('Failed scenarios',json.dumps([x for x in result['checks'] if not x['passed']],ensure_ascii=False))
  assert report['passed'];browser.close()
finally:
 (root/'LIVE_PRACTICAL_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');server.shutdown()
