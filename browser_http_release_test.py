from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':1280,'height':800})
  page=ctx.new_page();errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
  response=page.goto(url,wait_until='domcontentloaded',timeout=25000)
  page.wait_for_timeout(700)
  assert response.status==200
  assert page.locator('body').evaluate("x=>x.classList.contains('mode45')")
  assert page.evaluate("typeof window.EffectEngine==='object' && typeof window.BattleCore==='object'")
  page.locator('#fixed45ExitBtn').click(force=True)
  assert not page.locator('body').evaluate("x=>x.classList.contains('mode45')")
  page.reload(wait_until='domcontentloaded');page.wait_for_timeout(300)
  assert not page.locator('body').evaluate("x=>x.classList.contains('mode45')")
  page.locator('#mode45Btn').click(force=True)
  assert page.locator('body').evaluate("x=>x.classList.contains('mode45')")
  page.reload(wait_until='domcontentloaded');page.wait_for_timeout(300)
  assert page.locator('body').evaluate("x=>x.classList.contains('mode45')")
  assert not errors,errors[:3]
  mobile=ctx.new_page(viewport={'width':375,'height':812}); mobile.goto(url,wait_until='domcontentloaded');mobile.wait_for_timeout(350)
  assert mobile.locator('#mode45Btn').count()==1
  print('PASS Chromium HTTP launch, real localStorage reload, mode45 on/off, external engines, mobile viewport, no JS exceptions')
  browser.close()
finally: server.shutdown()
