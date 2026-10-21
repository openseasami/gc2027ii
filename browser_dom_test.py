from playwright.sync_api import sync_playwright
from pathlib import Path
html=(Path(__file__).resolve().parent / 'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1365,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded');page.wait_for_timeout(1600)
 assert not errors,errors
 assert 'mode45' in page.locator('body').get_attribute('class')
 page.evaluate("document.getElementById('fixed45ExitBtn').click()")
 assert 'mode45' not in page.locator('body').get_attribute('class')
 page.evaluate("document.getElementById('mode45Btn').click()")
 assert 'mode45' in page.locator('body').get_attribute('class')
 assert page.locator('#mode45Btn').inner_text().endswith('ON')
 print('PASS: Chromium inline scripts, initial 45s mode, exit, re-entry, no uncaught errors')
 print('LIMIT: about:blank cannot verify persistence, HTTP navigation blocked by environment')
 b.close()
