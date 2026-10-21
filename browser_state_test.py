#!/usr/bin/env python3
"""Chromium document-level smoke tests with an explicitly simulated localStorage.
Not a navigation, deployment, IndexedDB or Service Worker E2E test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
STORAGE_JS = """(seed) => {
 const values = new Map(Object.entries(seed));
 const store = {
   getItem(k) { k=String(k); return values.has(k) ? values.get(k) : null; },
   setItem(k,v) { values.set(String(k), String(v)); },
   removeItem(k) { values.delete(String(k)); },
   clear() { values.clear(); },
   key(i) { return [...values.keys()][i] ?? null; },
   get length() { return values.size; }
 };
 Object.defineProperty(window, 'localStorage', { configurable: true, value: store });
 window.__getTestStorage = () => Object.fromEntries(values);
}"""

def init_page(browser, state):
    page=browser.new_page(viewport={'width': 1365, 'height': 900})
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.evaluate(STORAGE_JS, state)
    page.set_content(HTML,wait_until='domcontentloaded')
    page.wait_for_timeout(900)
    assert not errors, f'Browser JavaScript errors: {errors[:3]}'
    return page

def mode(page):
    return page.evaluate("document.body.classList.contains('mode45')")

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    try:
        a=init_page(browser,{})
        assert mode(a), 'Fresh installation should default to 45-second mode ON'
        assert a.locator('#mode45Btn').inner_text().endswith('ON')
        print('PASS first-visit default ON and label')
        a.evaluate("document.getElementById('fixed45ExitBtn').click()")
        assert not mode(a)
        state=a.evaluate('window.__getTestStorage()')
        assert state.get('gc2027ii_mode45_test')=='0',state.get('gc2027ii_mode45_test')
        print('PASS exit OFF persists 0 in simulated storage')
        a.close()
        b=init_page(browser,state)
        assert not mode(b), 'OFF mode should restore on fresh document'
        assert b.locator('#mode45Btn').inner_text().endswith('OFF')
        print('PASS new-document restore OFF')
        b.evaluate("document.getElementById('mode45Btn').click()")
        assert mode(b)
        state=b.evaluate('window.__getTestStorage()')
        assert state.get('gc2027ii_mode45_test')=='1'
        b.close()
        c=init_page(browser,state)
        assert mode(c) and c.locator('#mode45Btn').inner_text().endswith('ON')
        print('PASS new-document restore ON')
        c.close()
        d=init_page(browser,{'gc2027ii_mode45_test':'0'})
        assert not mode(d)
        d.close()
        print('PASS preexisting OFF preference restored')
        print('LIMIT document-level tests use an in-memory localStorage double; network navigation, genuine disk persistence, service worker and deployment remain unverified')
    finally:
        browser.close()
