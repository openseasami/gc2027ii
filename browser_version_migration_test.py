"""Real old-release saves -> frozen current runtime; same-origin and JSON migration.

Fixtures are created through old application controls, never invented save schemas.
Service Workers and genuine localStorage remain enabled. No user data is used.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from hashlib import sha256
from playwright.sync_api import sync_playwright
import json, re, tempfile, zipfile

ROOT = Path(__file__).resolve().parent
BASE = json.loads((ROOT/'FROZEN_BASELINE.json').read_text())
active = {'directory': str(ROOT)}
class Quiet(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=active['directory'], **kwargs)
    def log_message(self, *args): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

def subset(expected, actual, path='backup'):
    """Allow new default fields, but preserve every previously persisted value."""
    if isinstance(expected, dict):
        assert isinstance(actual, dict), path
        for key, value in expected.items():
            assert key in actual, path+'.'+key
            subset(value, actual[key], path+'.'+key)
    elif isinstance(expected, list):
        assert isinstance(actual, list) and len(expected)==len(actual), path
        for i, value in enumerate(expected): subset(value, actual[i], path+f'[{i}]')
    else: assert expected==actual, (path, expected, actual)

def retained(data):
    # v2.9.14 deliberately recomputes the advisory ranking diagnostic; preserve
    # every recorded input/outcome, including the turn's historical recommendation.
    if data.get('currentMatch',{}).get('state'):
        data['currentMatch']['state'].pop('lastRecommendationDiagnostic',None)
    return {k:data[k] for k in ['myTeam','myMoves','myProfiles','matches','currentMatch']}

def export(page):
    details=page.locator('.compact-details').filter(has=page.locator('#exportJsonBtn'))
    if details.get_attribute('open') is None: details.locator(':scope > summary').click()
    with page.expect_download() as download: page.locator('#exportJsonBtn').click()
    return Path(download.value.path()).read_bytes()

def finish_turn(page):
    body=page.locator('#fixed45Body')
    for _ in range(24):
        if page.locator('#fixed45Panel').get_attribute('data-step-key').startswith('recommend:'): return
        hp=body.locator('.fixed45-section.needs-input .fixed45-hp button:visible')
        if hp.count():
            body.locator('.fixed45-hp button:visible').filter(has_text=re.compile('^90$')).click()
            continue
        selected=False
        for choice in body.locator('.fixed45-actions button:visible').all():
            label=choice.inner_text()
            if label in ['不発を指定','不発を指定✓','行動前にKO'] or label.startswith('交代→'): continue
            choice.click(); selected=True; break
        assert selected, body.inner_text()
    raise AssertionError('Old release turn did not finish')

server=ThreadingHTTPServer(('127.0.0.1',0),Quiet)
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
report=dict(completion=False,passed=False,versions=[],limitations=[
    'Synthetic, valid old-release fixtures; not every user save or pre-v2.9.1 format',
    'Legacy history-only JSON is not a full backup and is not supported by JSON restore',
    'Browser/host/port/profile changes require JSON; browser settings/private browsing are not portable'])
try:
    with tempfile.TemporaryDirectory(dir=ROOT/'work',prefix='migration-') as temp, sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        report['chromiumVersion']=browser.version
        for version, expected_hash in BASE['migrationArchives'].items():
            archive=ROOT/BASE.get('migrationArchivePaths',{}).get(version,f'release/gc2027ii-{version}-development.zip')
            assert sha256(archive.read_bytes()).hexdigest()==expected_hash, version
            old=Path(temp)/version
            with zipfile.ZipFile(archive) as z: z.extractall(old)
            active['directory']=str(old)
            context=browser.new_context(viewport={'width':1366,'height':900},accept_downloads=True)
            page=context.new_page(); page.set_default_timeout(8000)
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
            page.goto(url,wait_until='networkidle');assert version in page.title()
            page.locator('#editMyTeamBtn').click();page.locator('#saveMyTeamBtn').click()
            page.locator('[data-fill="opp"]').click()
            for i in range(4): page.locator('#myPickButtons .my-pick-btn').nth(i).click()
            page.locator('#startMatchBtn').click();finish_turn(page)
            assert page.evaluate('battleTurnNumber')==2
            page.locator('#fixed45ExitBtn').click()
            page.locator('#battleFieldDetails > summary').click()
            page.locator('#weather').select_option('雨')
            page.locator('#weatherTurns').select_option('3')
            page.locator('#myTailwind').select_option('2')
            page.locator('.match-result-panel summary').click()
            page.locator('#matchResult').select_option('win');page.locator('#saveMatchRecordBtn').click()
            # Old releases auto-save on turn/history confirmation; their header
            # save button is hidden before the later PC layout fix.
            payload=export(page); expected=retained(json.loads(payload))
            assert expected['matches'] and expected['currentMatch']['state']['turnLog']
            assert expected['currentMatch']['runtime']['guide45LastCommittedSnapshot']
            assert expected['currentMatch']['field']['weather']=='雨'
            assert expected['currentMatch']['field']['weatherTurns']=='3'
            assert expected['currentMatch']['field']['myTailwind']=='2'
            assert any(m['hp']==90 for m in expected['currentMatch']['state']['my'].values())
            # Real server directory upgrade: retain old origin/profile/storage/SW.
            active['directory']=str(ROOT)
            page.reload(wait_until='networkidle');assert BASE.get('currentRuntimeVersion',BASE['version']) in page.title()
            subset(expected,retained(json.loads(export(page))))
            page.locator('#saveBtn').click();page.reload(wait_until='networkidle')
            subset(expected,retained(json.loads(export(page))))
            # Snapshot survives migration and still drives the real undo control.
            page.locator('#mode45Btn').click();page.locator('#fixed45BackBtn').click()
            assert page.evaluate('battleTurnNumber')==1
            assert not errors,errors
            context.close()
            # Fresh browser profile: no shared localStorage; real JSON chooser.
            context=browser.new_context(viewport={'width':1366,'height':900},accept_downloads=True)
            page=context.new_page();page.set_default_timeout(8000);page.on('dialog',lambda d:d.accept())
            fresh_errors=[];page.on('pageerror',lambda e:fresh_errors.append(str(e)))
            page.goto(url,wait_until='networkidle')
            assert page.evaluate('matchHistory.length')==0
            details=page.locator('.compact-details').filter(has=page.locator('#restoreBackupBtn'))
            details.locator(':scope > summary').click()
            with page.expect_file_chooser() as chooser: page.locator('#restoreBackupBtn').click()
            chooser.value.set_files(dict(name=f'{version}-backup.json',mimeType='application/json',buffer=payload))
            page.wait_for_function('battleTurnNumber===2 && matchHistory.length===1')
            subset(expected,retained(json.loads(export(page))))
            page.reload(wait_until='networkidle');subset(expected,retained(json.loads(export(page))))
            if not page.evaluate("document.body.classList.contains('mode45')"):page.locator('#mode45Btn').click()
            page.locator('#fixed45BackBtn').click();assert page.evaluate('battleTurnNumber')==1
            assert not fresh_errors,fresh_errors
            report['versions'].append(dict(version=version,archiveSha256=expected_hash,
                backupSha256=sha256(payload).hexdigest(),sameOriginUpgrade=True,jsonRestoreFreshProfile=True,
                saveReload=True,undo=True,teams=True,moves=True,profiles=True,hp=True,turnLog=True,history=True,
                nonDefaultWeatherAndTailwind=True,allPersistedValuesRetained=True,errors=errors+fresh_errors))
            context.close()
        browser.close();report['passed']=True
finally:
    server.shutdown()
    (ROOT/'VERSION_MIGRATION_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS old-release real saves: four versions including c089a19 v2.9.13, same-origin upgrade + fresh-profile JSON, save/reload, history, undo')
