"""Build one limited-use RC from current passing evidence; never deploy or certify all mechanics."""
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json, re, subprocess, zipfile
ROOT=Path(__file__).resolve().parent
BASE='3fc189b8d77ed15fd4dc7552408c8417a3c45edf'
NAME='gc2027ii-v2.9.10-tournament-rc1.zip'
EVIDENCE=['TEST_RESULTS.json','TOURNAMENT_PRACTICAL_RESULTS.json','MAIN_MATCHUP_DIFFERENTIAL_RESULTS.json','FINAL_TACTICAL_AUDIT_RESULTS.json','RECOMMENDATION_STRATEGY_RESULTS.json','PC_BROWSER_RESULTS.json','FULL_MATCH_E2E_RESULTS.json','TOURNAMENT_SPEED_DIFFERENTIAL_RESULTS.json','TOURNAMENT_DAMAGE_DIFFERENTIAL_RESULTS.json','CRITICAL_DIFFERENTIAL_RESULTS.json','PRIORITY_BERRY_DIFFERENTIAL_RESULTS.json','REGULATION_SOURCE_REVIEW.json','IMPLEMENTATION_LEDGER.json','ADOPTION_120_NORMALIZED.json','UI_PRESERVATION_BASELINE.json']
def digest(data):return sha256(data).hexdigest()
def read(name):return json.loads((ROOT/name).read_text())
def encode(value):return (json.dumps(value,ensure_ascii=False,indent=2)+'\n').encode()
def require(condition,message):
 if not condition:raise SystemExit(message)
def main():
 require(subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='codex-development','Development branch required')
 tests=read('TEST_RESULTS.json');success={r['command'][-1] for r in tests['results'] if r['exitCode']==0}
 require(tests['passed']==tests['total']==len(tests['results']) and tests['total']>0 and all(r['exitCode']==0 for r in tests['results']),'All recorded tests must pass')
 for name,h in tests['sourceSha256'].items():require(digest((ROOT/name).read_bytes())==h,'Source changed after test: '+name)
 require({'browser_final_tactical_test.py','browser_recommendation_strategy_test.py','browser_pc_trial_test.py','browser_full_match_test.py','test-ui-preservation.py'}<=success,'Required tactical and PC evidence missing')
 subprocess.run(['python','evaluate-tournament-practical.py'],cwd=ROOT,check=True,capture_output=True)
 practical=read('TOURNAMENT_PRACTICAL_RESULTS.json');require(practical['localChecksPassed'] and practical['completion'] is False,'Local practical gates failed')
 source=digest((ROOT/'index.html').read_bytes());tactics=read('FINAL_TACTICAL_AUDIT_RESULTS.json');strategy=read('RECOMMENDATION_STRATEGY_RESULTS.json')
 require(tactics['sourceSha256']==strategy['sourceSha256']==source and tactics['passed']==tactics['total']==17 and strategy['passed']==strategy['total']==28,'Current tactical evidence required')
 require(not tactics['allyDamageDifferential']['failures'] and tactics['allyDamageDifferential']['comparisons']==256,'Ally damage differential failed')
 require(read('IMPLEMENTATION_LEDGER.json')['completion'] is False and read('DEVELOPMENT_BACKLOG.json')['completion'] is False,'Global completion must remain false')
 for name in ['RELEASE_CANDIDATE_DECISION.md','PC_TRIAL_START.md']:require((ROOT/name).is_file(),'Missing '+name)
 html=(ROOT/'index.html').read_text();version=re.search(r'<title>[^<]*?(v\d+\.\d+\.\d+)</title>',html).group(1);require(version=='v2.9.10','This RC is pinned to reviewed runtime')
 scripts=re.findall(r'<script\b[^>]*src=["\']\./([^"\']+)["\']',html)
 runtime=sorted(set(['.nojekyll','index.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','launch-pc-trial.py','start-pc-trial.cmd']+scripts))
 files={name:(ROOT/name).read_bytes() for name in runtime}
 files['PC_TRIAL_START.md']=(ROOT/'PC_TRIAL_START.md').read_text().replace('release/gc2027ii-v2.9.10-development.zip',NAME).encode()
 files['READ_ME_FIRST.md']=(ROOT/'RELEASE_CANDIDATE_DECISION.md').read_bytes()
 files['FINAL_TACTICAL_AUDIT.md']=(ROOT/'FINAL_TACTICAL_AUDIT.md').read_bytes()
 files['MAIN_MATCHUP_VALIDATION.md']=(ROOT/'MAIN_MATCHUP_VALIDATION.md').read_bytes()
 for name in EVIDENCE:files['evidence/'+name]=(ROOT/name).read_bytes()
 manifest=dict(completion=False,releaseCandidate=True,candidate='rc1',runtimeVersion=version,sourceBaseCommit=BASE,branch='codex-development',generatedAt=datetime.now(timezone.utc).isoformat(),limitedUseAccepted=True,officialTournamentRulesVerified=False,fullMechanicsCertified=False,allMatchupsCertified=False,
  knownCriticalDefectsInAcceptedScope=[],criticalDefectAssessment='No unresolved reproduced blocker in the tested/manual-reference scope. This is not a guarantee of no defects outside that scope; see READ_ME_FIRST.md.',
  testCommands={k:tests[k] for k in ['passed','total']},files={name:digest(data) for name,data in files.items()},packagerSha256=digest(Path(__file__).read_bytes()),
  acceptedScope=['PC manual observed-state entry, team/save/restore/history/undo','Damage/speed/order reference under explicitly tested inputs','Action candidates used as provisional advice, not guaranteed outcomes'],
  excludedScope=['Official C/M-C/Mega permissions and AP/base-stat certification','All 120x120 matchups and complete battle engine parity','Opponent action probabilities, general multi-turn optimality, exact joint KO order and all ally-hit secondary combinations','Native Windows product/version and human 45-second decision timing certification'])
 files['RC_MANIFEST.json']=encode(manifest)
 out=ROOT/'release'/'rc1';out.mkdir(parents=True,exist_ok=True);archive=out/NAME
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for name,data in files.items():z.writestr(name,data)
 with zipfile.ZipFile(archive) as z:
  require(z.testzip() is None,'ZIP CRC failure')
  for name,h in manifest['files'].items():require(digest(z.read(name))==h,'Packaged hash differs: '+name)
 (out/'SHA256SUMS.txt').write_text(digest(archive.read_bytes())+'  '+NAME+'\n')
 (out/'RC_MANIFEST.json').write_bytes(files['RC_MANIFEST.json'])
 print(f'{archive.relative_to(ROOT)}: {len(runtime)} runtime/launcher files; all payload hashes and ZIP CRC verified; completion:false')
if __name__=='__main__':main()
