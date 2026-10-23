#!/usr/bin/env python3
"""Separate local regression success from approval of a tournament-use archive.
Never writes ZIPs, changes runtime, deploys, or treats unknown rules as success.
"""
from pathlib import Path
from hashlib import sha256
from datetime import datetime,timezone
import json,subprocess
ROOT=Path(__file__).resolve().parent
def read(name):return json.loads((ROOT/name).read_text())

def evaluate():
    tests=read('TEST_RESULTS.json');stats=read('STATS_MOVES_AUDIT_RESULTS.json');ko=read('KO_BOUNDARY_AUDIT_RESULTS.json')
    berries=read('ALL_RESIST_BERRY_RESULTS.json');berry_ui=read('ALL_BERRY_BROWSER_RESULTS.json');three=read('THREE_ATTACKS_AUDIT_RESULTS.json')
    ui=read('PREZIP_BROWSER_RESULTS.json');pc=read('PC_BROWSER_RESULTS.json');migration=read('VERSION_MIGRATION_RESULTS.json')
    extraction=read('PREZIP_EXTRACTION_RESULTS.json');baseline=read('FROZEN_BASELINE.json');official=read('OFFICIAL_MC_AUDIT.json')
    current=lambda hashes:bool(hashes) and all((ROOT/n).is_file() and sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in hashes.items())
    local={
      'developmentBranch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='codex-development',
      'requiredSashCommitAncestor':subprocess.run(['git','merge-base','--is-ancestor','64d8d75','HEAD'],cwd=ROOT).returncode==0,
      'allRegressionCommands':tests['total']>=140 and tests['passed']==tests['total']==len(tests['results']) and all(r['exitCode']==0 for r in tests['results']),
      'testSourceHashesCurrent':current(tests['sourceSha256']),
      'fixedRuntimeHashes':current(baseline['runtimeSha256']),
      'major168BasicDamage':stats['moveSummary']['majorCalculationVerified']==168 and stats['moveSummary']['majorCalculationUnverified']==11 and not stats['errors'],
      'species344BaseStats':stats['speciesSummary']['targetVerified']==344 and stats['speciesSummary']['targetMega']==82 and stats['speciesSummary']['targetUnconfirmed']==0,
      'apNatureRanksRandom16':ko['passed'] and ko['failureCount']==0 and len(ko['actors'])==120 and ko['statComparisons']>=1073520,
      'oneAndTwoHitLabels':ko['certainOnHitCases']>0 and ko['randomOnHitCases']>0 and ko['certainTwoHitCases']>0 and ko['randomTwoHitCases']>0 and ko['oneOfSixteenCases']>0 and ko['fifteenOfSixteenCases']>0,
      'resistBerries18':berries['berries']==18 and not berries['failures'] and berries['comparisons']>=18432 and berry_ui['passed'] and berry_ui['berries']==18,
      'threeNamedAttacks':three['differential']['failureCount']==0 and len(three['differential']['byMove'])==3,
      'megaAndFormReferences':ui['passed'] and ui['formReferences']['megaBeforeAfter']==164,
      'pc45sFixedDualTargets':pc['passed'] and len(pc['profiles'])==2 and all(len(p['layouts'])==4 and p['automatedTurnSeconds']<45 and p['saveReload'] and p['undo'] and p['jsonRestore'] for p in pc['profiles']),
      'contrastAndFreshCalculations':ui['hpRecalculation']['changedOnHpInput'] and ui['hpRecalculation']['restoredOnReset'] and min(x['ratio'] for x in ui['fixedRailContrast'])>=4.5,
      'uncertaintyDisplay':ui['hpRecalculation']['provisional'] and read('TOURNAMENT_PRACTICAL_RESULTS.json')['localChecksPassed'],
      'offlineSaveRestore':all(ui['offline'].values()),
      'localOriginIsolation':ui['originIsolation']['separateHostnameStores'] and not ui['originIsolation']['publicSiteContacted'],
      'oldSaveMigration':migration['passed'] and len(migration['versions'])==3 and all(x['sameOriginUpgrade'] and x['jsonRestoreFreshProfile'] and x['saveReload'] and x['undo'] for x in migration['versions']),
      'temporaryZipExtractAndRun':extraction['passed'] and len(extraction['tests'])==4 and all(t['exitCode']==0 for t in extraction['tests']) and extraction['runtimeSha256']==baseline['runtimeSha256'] and current(extraction['testSourceSha256']),
      'oldZipRetained':sha256((ROOT/'release/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zip').read_bytes()).hexdigest()=='3cc7b8d9ca186e3a543f8aa0b514e094b253f90d119e716aef2229b6d7d95a90',
      'globalCompletionFalse':read('IMPLEMENTATION_LEDGER.json')['completion'] is False and read('DEVELOPMENT_BACKLOG.json')['completion'] is False
    }
    rules={
      'officialMCDoublesAndTimers':official['confirmed']['format']=='M-C doubles' and official['confirmed']['timersSeconds']==dict(total=1200,player=420,turn=45,preview=90),
      'newOfficialMegaExamplesPresent':official['localComparison']['newSixMegaFormsPresent'],
      'eligibleRosterFullyCompared':official['localComparison']['rosterComparedCompletely'],
      'heldItemListFullyCompared':official['localComparison']['itemsComparedCompletely'],
      'independentToolUsePermissionVerified':official['toolPermission']['status']=='verified-allowed' and official['toolPermission']['expressPermissionFound']
    }
    passed=all(local.values());package=passed and all(rules.values())
    report=dict(completion=False,version='v2.9.13',sourceBaseCommit='64d8d75bc6a7466c788a35327f6f0f7c84e415f6',generatedAt=datetime.now(timezone.utc).isoformat(),
        localTechnicalChecksPassed=passed,tournamentPackageAllowed=package,technicalChecks=local,officialChecks=rules,
        blockingChecks=[k for checks in [local,rules] for k,v in checks.items() if v is not True],
        releaseZipCreated=False,releaseArchive=None,originalZipPreserved=True,
        evidenceSha256={n:sha256((ROOT/n).read_bytes()).hexdigest() for n in ['TEST_RESULTS.json','OFFICIAL_MC_AUDIT.json','PREZIP_EXTRACTION_RESULTS.json','KO_BOUNDARY_AUDIT_RESULTS.json','ALL_RESIST_BERRY_RESULTS.json','ALL_BERRY_BROWSER_RESULTS.json','PREZIP_BROWSER_RESULTS.json','evaluate-prezip-audit.py']},
        meaning='A tournament ZIP requires local checks plus the requested official roster/item and tool-use confirmation. Unknown is not a passing rule check. Temporary engineering archive is destroyed and is not a released tournament ZIP.')
    (ROOT/'FINAL_PREZIP_AUDIT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['localTechnicalChecksPassed','tournamentPackageAllowed','blockingChecks','releaseZipCreated','completion']},ensure_ascii=False))
    return passed
if __name__=='__main__':raise SystemExit(0 if evaluate() else 1)
