#!/usr/bin/env python3
"""Chromium document-level smoke suite; no network, persistent storage or HTTP E2E claims."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
STORAGE_JS="""(seed) => {
 const data=new Map(Object.entries(seed));
 const storage={getItem(k){return data.get(String(k))??null},setItem(k,v){data.set(String(k),String(v))},removeItem(k){data.delete(String(k))},clear(){data.clear()},key(i){return [...data.keys()][i]??null},get length(){return data.size}};
 Object.defineProperty(window,'localStorage',{configurable:true,value:storage});
 window.__storageSnapshot=()=>Object.fromEntries(data);
}"""

def fresh(browser, seed):
 page=browser.new_page(viewport={'width':1365,'height':900})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.evaluate(STORAGE_JS,seed)
 page.set_content(HTML,wait_until='domcontentloaded')
 page.wait_for_timeout(600)
 assert not errors, errors
 return page

with sync_playwright() as playwright:
 browser=playwright.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 try:
  page=fresh(browser,{})
  assert page.locator('body').evaluate("el=>el.classList.contains('mode45')")
  assert page.locator('#mode45Btn').inner_text().endswith('ON')
  print('PASS default mode45 enabled')
  page.evaluate("document.getElementById('fixed45ExitBtn').click()")
  assert not page.locator('body').evaluate("el=>el.classList.contains('mode45')")
  stored=page.evaluate('window.__storageSnapshot()')
  assert stored.get('gc2027ii_mode45_test')=='0'
  print('PASS exit action and localStorage stub writes OFF')
  page.close()
  page=fresh(browser,stored)
  assert not page.locator('body').evaluate("el=>el.classList.contains('mode45')")
  assert page.locator('#mode45Btn').inner_text().endswith('OFF')
  print('PASS reload-equivalent fresh document restores OFF')
  page.evaluate("document.getElementById('mode45Btn').click()")
  assert page.locator('body').evaluate("el=>el.classList.contains('mode45')")
  stored=page.evaluate('window.__storageSnapshot()')
  assert stored.get('gc2027ii_mode45_test')=='1'
  print('PASS re-enable action persists ON')
  page.close()
  page=fresh(browser,stored)
  assert page.locator('body').evaluate("el=>el.classList.contains('mode45')")
  print('PASS reload-equivalent fresh document restores ON')
  page.close()
 finally:
  browser.close()
print('LIMITATIONS: mocked storage, set_content document, no full battle E2E or deployed-site check')
