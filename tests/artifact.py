"""Verify the actual ZIP, run its loopback launcher, then repeat real browser tests against its extraction."""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import urllib.request
import zipfile

ROOT=Path(__file__).resolve().parent.parent
archive=ROOT/'release/GC2027II_Viewer_v9_offline.zip'
dest=ROOT/'work/extracted-v9'
report=dict(completion=False,passed=False,archive=archive.name,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),manifestFiles=0,launcherPassed=False,browserPassed=False,limitations=['Native Windows and file:// direct launch unexecuted; loopback HTTP is the verified method'])
if dest.exists():
    shutil.rmtree(dest)
dest.mkdir(parents=True)
try:
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert all(not Path(n).is_absolute() and '..' not in Path(n).parts for n in z.namelist())
        z.extractall(dest)
    for line in (dest/'SHA256SUMS.txt').read_text().splitlines():
        expected,name=line.split('  ',1)
        assert hashlib.sha256((dest/name).read_bytes()).hexdigest()==expected,name
        report['manifestFiles']+=1
    actual=(dest/'GC2027II_Viewer_v9.html').read_bytes()
    assert actual==(ROOT/'release/GC2027II_Viewer_v9.html').read_bytes()
    report['htmlSha256']=hashlib.sha256(actual).hexdigest()
    proc=subprocess.Popen([sys.executable,str(dest/'launch-viewer.py'),'--no-open','--port','0'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        url=proc.stdout.readline().strip()
        assert url.startswith('http://127.0.0.1:') and url.endswith('/GC2027II_Viewer_v9.html'),url
        # No proxy is needed to access this process's loopback listener.
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(url,timeout=10) as response:
            assert response.status==200
            assert response.read()==actual
        report['launcherPassed']=True
    finally:
        proc.terminate()
        proc.communicate(timeout=10)
    env=dict(os.environ,VIEWER_ARTIFACT_ROOT=str(dest),VIEWER_BROWSER_REPORT=str(ROOT/'reference/ARTIFACT_BROWSER_RESULTS.json'))
    subprocess.run([sys.executable,str(ROOT/'tests/browser.py')],cwd=ROOT,env=env,check=True)
    browsers=json.loads((ROOT/'reference/ARTIFACT_BROWSER_RESULTS.json').read_text())
    assert browsers['passed'] and browsers['artifact']['htmlSha256']==report['htmlSha256']
    report['browserPassed']=True
    report['browserEvidence']='ARTIFACT_BROWSER_RESULTS.json'
    report['passed']=True
finally:
    for path in [ROOT/'release/ARTIFACT_VERIFICATION.json',ROOT/'reference/ARTIFACT_VERIFICATION.json']:
        path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS actual ZIP extraction, all hashes, actual launcher HTTP, offline browser operations and save/restore')
