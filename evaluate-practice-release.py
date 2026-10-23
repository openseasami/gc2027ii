#!/usr/bin/env python3
"""v2.9.14 practice-only gate. No new official-source research or legality certification."""
from pathlib import Path
from datetime import datetime, timezone
from hashlib import sha256
import json, re, subprocess
ROOT=Path(__file__).resolve().parent
BASE='c089a1937d7fccc34e2b26a25087496cecc9a982'
def load(n):return json.loads((ROOT/n).read_text())
def digest(n):return sha256((ROOT/n).read_bytes()).hexdigest()
def current(h):return bool(h) and all(digest(n)==v for n,v in h.items())
def main():
 t=load('TEST_RESULTS.json');b=load('FROZEN_BASELINE.json');live=load('LIVE_PRACTICAL_RESULTS.json');flow=load('LIVE_WORKFLOW_RESULTS.json');stats=load('STATS_MOVES_AUDIT_RESULTS.json');migration=load('VERSION_MIGRATION_RESULTS.json')
 text=(ROOT/'index.html').read_text();original=subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT,text=True)
 data_same=all(re.search(r'const '+n+r'\s*=\s*(.+?);\s*(?:\n|$)',text)[1]==re.search(r'const '+n+r'\s*=\s*(.+?);\s*(?:\n|$)',original)[1] for n in ['REGULATION_MC','NATIONAL_DEX','NATIONAL_MOVES'])
 checks={
  'developmentBranch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip()=='codex-development',
  'baseAncestor':subprocess.run(['git','merge-base','--is-ancestor',BASE,'HEAD'],cwd=ROOT).returncode==0,
  'allExisting140PlusNewRegressions':t['total']>=142 and t['passed']==t['total']==len(t['results']) and all(x['exitCode']==0 for x in t['results']),
  'sourceHashesCurrent':current(t['sourceSha256']), 'fixedCurrentRuntime':current(b['runtimeSha256']),
  'sameCatalogData':data_same,'completionFalse':b['completion'] is False and load('IMPLEMENTATION_LEDGER.json')['completion'] is False and load('DEVELOPMENT_BACKLOG.json')['completion'] is False,
  'live30PlusScenarios':live['passed'] and live['total']>=30 and live['differential']['failureCount']==0 and current(live['sourceSha256']),
  'continuousPcWorkflow':flow['passed'] and flow['stateInjection'] is False and flow['manualOpponentRegistrations']==6 and flow['registrationToRecommendationSeconds']<45 and flow['undoReplay'] and flow['jsonRestore'] and flow['koForcedReplacement'],
  'pcBrowserE2E':load('PC_BROWSER_RESULTS.json')['passed'],'offlineAndForms':load('PREZIP_BROWSER_RESULTS.json')['passed'],'observedMatch':load('FULL_MATCH_E2E_RESULTS.json')['passed'],
  'fourVersionMigrations':migration['passed'] and len(migration['versions'])==4 and all(x['sameOriginUpgrade'] and x['jsonRestoreFreshProfile'] and x['undo'] and x['saveReload'] for x in migration['versions']),
  'stats344AndScoped168':not stats['errors'] and stats['speciesSummary']['targetVerified']==344 and stats['speciesSummary']['targetUnconfirmed']==0 and stats['moveSummary']['majorCalculationVerified']==168,
  'koBoundaryAudit':load('KO_BOUNDARY_AUDIT_RESULTS.json')['passed'] and load('KO_BOUNDARY_AUDIT_RESULTS.json')['failureCount']==0,
  'originalV13Retained':digest('release/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zip')=='3cc7b8d9ca186e3a543f8aa0b514e094b253f90d119e716aef2229b6d7d95a90',
  'c089PracticeV13Retained':digest('release/practice-v2.9.13/gc2027ii-v2.9.13-practice-verification.zip')=='a1113c059faada5cada8b28b57d44227e18ae1aeeeb3932069ed739335d298da',
  'noPermissionClaim':load('OFFICIAL_MC_AUDIT.json')['toolPermission']['status']=='unconfirmed' and load('OFFICIAL_CATALOG_COMPARISON.json')['fullCatalogEligibilityCertified'] is False,
  'practicalGate':load('TOURNAMENT_PRACTICAL_RESULTS.json')['localChecksPassed'],
 }
 names=['TEST_RESULTS.json','FROZEN_BASELINE.json','OFFICIAL_MC_AUDIT.json','OFFICIAL_CATALOG_COMPARISON.json','STATS_MOVES_AUDIT_RESULTS.json','LIVE_PRACTICAL_RESULTS.json','LIVE_WORKFLOW_RESULTS.json','PC_BROWSER_RESULTS.json','PREZIP_BROWSER_RESULTS.json','VERSION_MIGRATION_RESULTS.json','FULL_MATCH_E2E_RESULTS.json','KO_BOUNDARY_AUDIT_RESULTS.json','TOURNAMENT_PRACTICAL_RESULTS.json','evaluate-practice-release.py','build-practice-release.py','verify-practice-release.py']
 report=dict(completion=False,version='v2.9.14',sourceBaseCommit=BASE,purpose='pre-tournament-practice-and-verification-only',generatedAt=datetime.now(timezone.utc).isoformat(),localTechnicalChecksPassed=all(checks.values()),checks=checks,failedChecks=[n for n,v in checks.items() if not v],fullTournamentRulesCertified=False,duringMatchToolPermission='unconfirmed',duringMatchUseAuthorized=False,officialResearchPerformedThisIteration=False,officialEvidenceScope='Inherited c089a19 review, unchanged and unconfirmed; official lists/rules excluded from this task',actualArtifactVerification='release/practice-v2.9.14/ARTIFACT_VERIFICATION.json',evidenceSha256={n:digest(n) for n in names})
 (ROOT/'PRACTICE_RELEASE_READINESS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:report[k] for k in ['localTechnicalChecksPassed','failedChecks','completion']},ensure_ascii=False));assert report['localTechnicalChecksPassed']
if __name__=='__main__':main()
