"""Assemble the offline viewer without runtime dependencies; never modifies the legacy repo."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT=Path(__file__).resolve().parent.parent
release=ROOT/'release'
stage=ROOT/'work/package/GC2027II_Viewer_v9'
stage.parent.mkdir(parents=True,exist_ok=True)
if stage.exists():
    shutil.rmtree(stage)
stage.mkdir()
report=json.loads((ROOT/'reference/VERIFICATION_REPORT.json').read_text())
assert report['completion'] is False
for name in ['UNIT_RESULTS','NUMERIC_RESULTS','MULTIHIT_RESULTS','SPEED_RESULTS','BROWSER_RESULTS']:
    assert json.loads((ROOT/f'reference/{name}.json').read_text())['passed'],name
html=release/'GC2027II_Viewer_v9.html'
assert hashlib.sha256(html.read_bytes()).hexdigest()==report['htmlSha256']
assert json.loads((ROOT/'reference/BROWSER_RESULTS.json').read_text())['artifact']['htmlSha256']==report['htmlSha256']
for path in [html,ROOT/'launch-viewer.py',ROOT/'start-viewer.cmd',ROOT/'README.md',ROOT/'START_HERE.txt']:
    shutil.copyfile(path,stage/path.name)
shutil.copytree(ROOT/'docs',stage/'docs')
shutil.copytree(ROOT/'vendor',stage/'licenses')
shutil.copytree(ROOT/'migration',stage/'migration')
(stage/'reports').mkdir()
names=['UNIT_RESULTS','NUMERIC_RESULTS','MULTIHIT_RESULTS','SPEED_RESULTS','BROWSER_RESULTS','DATA_AUDIT','IMAGE_AUDIT','EDGE_PROVENANCE','ABILITY_COVERAGE','UNCONFIRMED','VERIFICATION_REPORT','INCIDENTS','NUMERIC_ATTEMPT1','NUMERIC_ATTEMPT2']
for name in names:
    shutil.copyfile(ROOT/f'reference/{name}.json',stage/f'reports/{name}.json')
(stage/'reports/screenshots').mkdir()
for name in ['viewer-Chromium.png','viewer-Microsoft-Edge-Linux.png']:
    shutil.copyfile(ROOT/f'work/{name}',stage/f'reports/screenshots/{name}')
files=sorted(p for p in stage.rglob('*') if p.is_file())
manifest=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(stage).as_posix()+'\n' for p in files)
(stage/'SHA256SUMS.txt').write_text(manifest)
archive=release/'GC2027II_Viewer_v9_offline.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(stage.rglob('*')):
        if p.is_file():
            info=zipfile.ZipInfo(p.relative_to(stage).as_posix(),date_time=(2026,10,28,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644<<16
            z.writestr(info,p.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(release/(archive.name+'.sha256')).write_text(digest+'  '+archive.name+'\n')
shutil.copyfile(ROOT/'reference/VERIFICATION_REPORT.json',release/'VERIFICATION_REPORT.json')
print(archive.name,archive.stat().st_size,'bytes',digest)
