#!/usr/bin/env python3
"""Run every JS/Python regression plus Chromium suites; record bounded logs and source hashes."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json, subprocess, sys, time
ROOT=Path(__file__).resolve().parent

def run(command):
    started=time.monotonic()
    try:
        result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True,timeout=180)
        return dict(command=command,exitCode=result.returncode,seconds=round(time.monotonic()-started,3),stdout=result.stdout[-18000:],stderr=result.stderr[-18000:])
    except subprocess.TimeoutExpired as e:
        return dict(command=command,exitCode=124,seconds=round(time.monotonic()-started,3),stdout=str(e.stdout or '')[-18000:],stderr='Timed out after 180 seconds')

def main():
    commands=[['node',p.name] for p in sorted(ROOT.glob('test-*.js'))]
    commands += [[sys.executable,p.name] for p in sorted(ROOT.glob('test-*.py'))]
    with ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(run,commands))
    results.append(run(['node','verify-release.js']))
    # Browser cases execute sequentially to avoid resource contention.
    for file in sorted(ROOT.glob('browser_*test.py'),key=lambda p:(p.name!='browser_three_attacks_test.py',p.name)):
        results.append(run([sys.executable,file.name]))
    results.append(run([sys.executable,'browser_smoke_portable.py']))
    files=['three-attack-effects.js','three-attack-oracle.js','pending-move-oracle.js','audit-stats-moves.py','prepare-data-audit-references.js','primary-move-oracle.js','ally-damage-oracle.js','main-matchup-oracle.js','UI_PRESERVATION_BASELINE.json','launch-pc-trial.py','start-pc-trial.cmd','evaluate-tournament-practical.py','TOURNAMENT_PRACTICAL_GATES.json','critical-effects.js','rank-effects.js','index.html','sw.js','battle-core.js','effect-engine.js','priority-engine.js','turn-order-effects.js','implementation-ledger.js','MECHANICS_EVIDENCE.json','coverage-assessment.js','COVERAGE_REVIEW_PLAN.json','ABILITY_REVIEW_BASELINE.json','ABILITY_REFERENCE_HOOKS.json','reference-ability-audit.js','development-automation.py','DEVELOPMENT_AUTOMATION_POLICY.json']
    files += ['ko-boundary-oracle.js','FROZEN_BASELINE.json','build-frozen-trial.py','verify-frozen-trial.py','run-development-checks.py']
    files += sorted(p.relative_to(ROOT).as_posix() for folder in ['reference-data/stats-moves','reference-data/three-attacks'] for p in (ROOT/folder).glob('*') if p.is_file())
    files += sorted({p.name for pattern in ['test-*.js','test-*.py','browser_*.py'] for p in ROOT.glob(pattern)})
    report=dict(generatedAt=datetime.now(timezone.utc).isoformat(),complete=False,completion=False,
        limitations=['Passing scenarios do not certify full mechanics, event legality, official-game parity, mobile usability or deployed-site equivalence.'],
        sourceSha256={name:sha256((ROOT/name).read_bytes()).hexdigest() for name in files},
        total=len(results),passed=sum(r['exitCode']==0 for r in results),results=results)
    (ROOT/'TEST_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    subprocess.run(['node','implementation-ledger.js'],cwd=ROOT,check=True)
    for result in results:
        print(('PASS' if result['exitCode']==0 else 'FAIL')+' '+result['command'][-1])
    print(f"{report['passed']}/{report['total']} commands passed; complete=false")
    return int(report['passed']!=report['total'])
if __name__=='__main__':sys.exit(main())
