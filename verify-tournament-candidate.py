"""Validate the exact RC payload, then reuse unchanged real UI harnesses on its extracted files."""
from pathlib import Path
from hashlib import sha256
from datetime import datetime,timezone
import json,subprocess,sys,tempfile,zipfile,shutil
ROOT=Path(__file__).resolve().parent
ARCHIVE=ROOT/'release/rc1/gc2027ii-v2.9.10-tournament-rc1.zip'
def digest(data):return sha256(data).hexdigest()
def main():
 artifact=digest(ARCHIVE.read_bytes());commands=[]
 with tempfile.TemporaryDirectory(prefix='rc-verification-',dir=ROOT/'work') as temp:
  target=Path(temp)
  with zipfile.ZipFile(ARCHIVE) as z:
   assert z.testzip() is None
   assert all(not Path(n).is_absolute() and '..' not in Path(n).parts for n in z.namelist())
   manifest=json.loads(z.read('RC_MANIFEST.json'));assert manifest['completion'] is False
   assert set(z.namelist())==set(manifest['files'])|{'RC_MANIFEST.json'}
   for name,h in manifest['files'].items():assert digest(z.read(name))==h,name
   z.extractall(target)
  for name in ['test-pc-launcher.py','browser_pc_trial_test.py','browser_full_match_test.py']:
   shutil.copy2(ROOT/name,target/name)
   r=subprocess.run([sys.executable,name],cwd=target,capture_output=True,text=True,timeout=180)
   commands.append(dict(command=name,harnessSha256=digest((ROOT/name).read_bytes()),exitCode=r.returncode,stdout=r.stdout[-10000:],stderr=r.stderr[-10000:]))
   if r.returncode:break
  reports={}
  for name in ['PC_BROWSER_RESULTS.json','FULL_MATCH_E2E_RESULTS.json']:
   if (target/name).exists():reports[name]=json.loads((target/name).read_text())
  # Browser operations must not rewrite any packaged input.
  payloadUnchanged=all(digest((target/name).read_bytes())==h for name,h in manifest['files'].items())
 report=dict(completion=False,archive=ARCHIVE.relative_to(ROOT).as_posix(),archiveSha256=artifact,generatedAt=datetime.now(timezone.utc).isoformat(),passed=len(commands)==3 and all(r['exitCode']==0 for r in commands) and payloadUnchanged,payloadUnchanged=payloadUnchanged,commands=commands,reports=reports,limitations=['Exact ZIP extracted and served locally; Linux Chromium Windows-UA profiles, not native Windows product certification','Human 45-second decision timing and official regulation eligibility remain unverified'])
 (ARCHIVE.parent/'RC_ARTIFACT_VERIFICATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k not in ['commands','reports']},ensure_ascii=False,indent=2));return int(not report['passed'])
if __name__=='__main__':raise SystemExit(main())
