#!/usr/bin/env python3
"""Verify the actual final ZIP, then run launcher and browser checks on its bytes."""
from pathlib import Path
from hashlib import sha256
from tempfile import TemporaryDirectory
from datetime import datetime, timezone
import json, shutil, subprocess, sys, zipfile
ROOT=Path(__file__).resolve().parent
DEST=ROOT/'release/tournament-v2.9.13'
ARCHIVE=DEST/'gc2027ii-v2.9.13-tournament-trial.zip'

def main():
    digest=sha256(ARCHIVE.read_bytes()).hexdigest()
    report=dict(completion=False,passed=False,archive=ARCHIVE.relative_to(ROOT).as_posix(),
        archiveSha256=digest,verifiedAt=datetime.now(timezone.utc).isoformat(),tests=[],
        nativeWindowsVerified=False)
    assert (DEST/'SHA256SUMS.txt').read_text().split()[0]==digest
    try:
        with TemporaryDirectory(prefix='frozen-trial-',dir=ROOT/'work') as folder:
            target=Path(folder)
            with zipfile.ZipFile(ARCHIVE) as z:
                assert z.testzip() is None
                assert all(not Path(n).is_absolute() and '..' not in Path(n).parts for n in z.namelist())
                z.extractall(target)
            manifest=json.loads((target/'RELEASE_MANIFEST.json').read_text())
            assert manifest['completion'] is False and manifest['version']=='v2.9.13' and manifest['frozen']
            expected=set(manifest['files'])|{'RELEASE_MANIFEST.json','SHA256SUMS_CONTENTS.txt'}
            assert {p.relative_to(target).as_posix() for p in target.rglob('*') if p.is_file()}==expected
            for name,expected_hash in manifest['files'].items():
                assert sha256((target/name).read_bytes()).hexdigest()==expected_hash,name
            for line in (target/'SHA256SUMS_CONTENTS.txt').read_text().splitlines():
                expected_hash,name=line.split('  ',1)
                assert sha256((target/name).read_bytes()).hexdigest()==expected_hash,name
            for name,expected_hash in manifest['runtimeSha256'].items():
                assert sha256((target/name).read_bytes()).hexdigest()==expected_hash,name
                assert sha256((ROOT/name).read_bytes()).hexdigest()==expected_hash,name
            report['fileHashesVerified']=len(expected)
            report['runtimeFilesFrozen']=len(manifest['runtimeSha256'])
            for name in ['test-pc-launcher.py','browser_pc_trial_test.py','browser_full_match_test.py']:
                shutil.copy2(ROOT/name,target/name)
                result=subprocess.run([sys.executable,str(target/name)],cwd=target,text=True,capture_output=True,timeout=180)
                report['tests'].append(dict(command=name,exitCode=result.returncode,stdout=result.stdout[-5000:],stderr=result.stderr[-5000:]))
            report['passed']=all(t['exitCode']==0 for t in report['tests'])
            report['limitations']=['Linux Chromium/Windows UA; not native Windows Chrome/Edge certification',
                'Complete observed UI match, not a full battle oracle',
                'Old-release migration verified by bundled source-suite results; extracted ZIP runtime hashes match those tested sources']
    finally:
        (DEST/'ARTIFACT_VERIFICATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    assert report['passed'], report['tests']
    print('PASS definitive ZIP: SHA-256, enclosed file hashes, frozen runtime, extracted launcher + PC + full observed match (3/3)')
if __name__=='__main__': main()
