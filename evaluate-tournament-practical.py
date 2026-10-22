#!/usr/bin/env python3
"""Evaluate reproducible local gates separately from unverified tournament acceptance."""
from pathlib import Path
from hashlib import sha256
from datetime import datetime,timezone
import json,subprocess,re
ROOT=Path(__file__).resolve().parent
def read(name):return json.loads((ROOT/name).read_text())
def evaluate():
 gates=read('TOURNAMENT_PRACTICAL_GATES.json');tests=read('TEST_RESULTS.json');checks={}
 checks['developmentBranch']=subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()==gates['branch']
 checks['allTestsPassed']=tests['total']>0 and tests['passed']==tests['total']==len(tests['results']) and all(r['exitCode']==0 for r in tests['results'])
 checks['currentSourceHashes']=bool(tests['sourceSha256']) and all((ROOT/f).is_file() and sha256((ROOT/f).read_bytes()).hexdigest()==h for f,h in tests['sourceSha256'].items())
 success={r['command'][-1] for r in tests['results'] if r['exitCode']==0}
 checks['requiredCommands']=set(gates['requiredCommands'])<=success
 checks['adoption120']=len(read('ADOPTION_120_NORMALIZED.json')['species'])==120
 baseline=read('DEVELOPMENT_ITERATION.json')['preservedDataSha256'];html=(ROOT/'index.html').read_text()
 def data_hash(name):
  if name.endswith('.json'):return sha256((ROOT/name).read_bytes()).hexdigest()
  # Inventory originals used literal source hashes (not re-serialization).
  m=re.search(r'^const '+name+r'\s*=\s*(.*);$',html,re.M)
  return sha256(m[1].encode()).hexdigest() if m else None
 checks['preservedCatalogs']=all(data_hash(n)==h for n,h in baseline.items())
 speed=read('TOURNAMENT_SPEED_DIFFERENTIAL_RESULTS.json');damage=read('TOURNAMENT_DAMAGE_DIFFERENTIAL_RESULTS.json');critical=read('CRITICAL_DIFFERENTIAL_RESULTS.json');browser=read('TOURNAMENT_BROWSER_RESULTS.json');match=read('FULL_MATCH_E2E_RESULTS.json');limit=gates['localAcceptance']
 checks['speedDifferential']=speed['profiles']==120 and speed['cases']>=limit['speedCasesAtLeast'] and not speed['failures']
 checks['damageDifferential']=damage['cases']>=limit['commonDamageCasesAtLeast'] and not damage['failures']
 checks['criticalDifferential']=critical['rateCases']>=limit['criticalRateCasesAtLeast'] and critical['damageCases']>=limit['criticalDamageCasesAtLeast'] and not critical['failures']
 checks['browserPractical']=browser['passed'] and len(browser['refreshSamplesMs'])>=18 and max(browser['refreshSamplesMs'])<limit['browserRefreshBudgetMs'] and not browser['errors']
 berries=read('PRIORITY_BERRY_DIFFERENTIAL_RESULTS.json');berry_browser=read('PRIORITY_BERRY_BROWSER_RESULTS.json')
 checks['priorityBerries']=berries['cases']>=limit['priorityBerryCasesAtLeast'] and not berries['failures'] and berry_browser['passed'] and not berry_browser['errors']
 pc=read('PC_BROWSER_RESULTS.json')
 checks['pcBrowserTrial']=pc['passed'] and len(pc['profiles'])==2 and sum(len(p['layouts']) for p in pc['profiles'])==8 and all(p['automatedTurnSeconds']<45 for p in pc['profiles'])
 matchup=read('MAIN_MATCHUP_DIFFERENTIAL_RESULTS.json')
 checks['mainMatchups']=matchup['matchups']>=16 and matchup['comparisons']>=46080 and matchup['failureCount']==0 and matchup['speedComparisons']>=5760 and matchup['orderComparisons']>=5760
 checks['observedCompleteMatch']=match['passed'] and match['undoReplay'] and match['reload'] and match['opponentPokemon']==4
 checks['incompleteRemainsExplicit']=read('IMPLEMENTATION_LEDGER.json')['completion'] is False and read('DEVELOPMENT_BACKLOG.json')['completion'] is False
 passed=all(checks.values())
 report=dict(completion=False,generatedAt=datetime.now(timezone.utc).isoformat(),localChecksPassed=passed,checks=checks,tournamentAccepted=False,readiness='conditional-reference-build' if passed else 'local-gates-failed',pending=gates['tournamentAcceptancePending'],testCommands=dict(passed=tests['passed'],total=tests['total']),speedComparisons=speed['cases'],damageComparisons=damage['cases'],criticalComparisons=critical['rateCases']+critical['damageCases'],priorityBerryComparisons=berries['cases'],maxRefreshMs=browser.get('maxRefreshMs'),sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip())
 (ROOT/'TOURNAMENT_PRACTICAL_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2));return passed
if __name__=='__main__':raise SystemExit(0 if evaluate() else 1)
