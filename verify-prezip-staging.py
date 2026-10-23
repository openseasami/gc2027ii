#!/usr/bin/env python3
"""Temporary engineering archive -> extracted launcher/UI tests; never a released ZIP.

Permits checking extraction/startup even while tournament-use approval is held.
The temporary archive and extracted directory are destroyed after verification.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from hashlib import sha256
from datetime import datetime,timezone
import json,zipfile,shutil,subprocess,sys
ROOT=Path(__file__).resolve().parent

def main():
    baseline=json.loads((ROOT/'FROZEN_BASELINE.json').read_text())
    report=dict(completion=False,passed=False,kind='temporary engineering archive, not a tournament release',
        checkedAt=datetime.now(timezone.utc).isoformat(),archiveRetained=False,tests=[],runtimeSha256=baseline['runtimeSha256'],
        testSourceSha256={n:sha256((ROOT/n).read_bytes()).hexdigest() for n in ['verify-prezip-staging.py','test-pc-launcher.py','browser_pc_trial_test.py','browser_prezip_test.py','browser_full_match_test.py']})
    try:
        with TemporaryDirectory(prefix='prezip-engineering-',dir=ROOT/'work') as folder:
            temp=Path(folder);archive=temp/'engineering-only.zip';target=temp/'extracted';target.mkdir()
            with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
                for name,digest in baseline['runtimeSha256'].items():
                    assert sha256((ROOT/name).read_bytes()).hexdigest()==digest,name
                    z.write(ROOT/name,name)
            report['temporaryArchiveSha256']=sha256(archive.read_bytes()).hexdigest()
            with zipfile.ZipFile(archive) as z:
                assert z.testzip() is None;z.extractall(target)
            for name,digest in baseline['runtimeSha256'].items():
                assert sha256((target/name).read_bytes()).hexdigest()==digest,name
            report['runtimeFilesVerified']=len(baseline['runtimeSha256'])
            assert "const sashActive=fullHpAtHit" in (target/'index.html').read_text()
            assert 'RESIST_BERRY_TYPES' in (target/'battle-core.js').read_text()
            report['sash64d8d75Included']=True;report['resistanceBerryCorrectionIncluded']=True
            refs=target/'reference-data/stats-moves';refs.mkdir(parents=True)
            shutil.copy2(ROOT/'reference-data/stats-moves/showdown-normalized.json',refs/'showdown-normalized.json')
            for name in ['test-pc-launcher.py','browser_pc_trial_test.py','browser_prezip_test.py','browser_full_match_test.py']:
                shutil.copy2(ROOT/name,target/name)
                result=subprocess.run([sys.executable,str(target/name)],cwd=target,text=True,capture_output=True,timeout=180)
                report['tests'].append(dict(command=name,exitCode=result.returncode,stdout=result.stdout[-4000:],stderr=result.stderr[-4000:]))
            report['passed']=all(t['exitCode']==0 for t in report['tests'])
    finally:
        (ROOT/'PREZIP_EXTRACTION_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    assert report['passed'],report['tests']
    print('PASS temporary ZIP extraction: corrected 15 runtime files, launcher/PC/offline/full observed match (4/4); no release ZIP retained')
if __name__=='__main__':main()
