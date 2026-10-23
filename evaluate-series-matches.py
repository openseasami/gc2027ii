#!/usr/bin/env python3
"""Fail-closed aggregation of all 30 completed native/observed matches."""
from pathlib import Path
from hashlib import sha256
import json
ROOT=Path(__file__).resolve().parent

def main():
 groups=[json.loads((ROOT/f'SERIES_MATCH_GROUP_{i}_RESULTS.json').read_text()) for i in range(3)]
 games=[g for r in groups for g in r['games']]
 checks=dict(threeGroups=len(groups)==3,allPassed=all(r['passed'] for r in groups),thirtyDistinctCompleteMatches=len(games)==30 and len({g['id'] for g in games})==30 and all(g['complete'] for g in games),undoReplayEveryMatch=all(g['undoReplay'] for g in games),jsonRestoreEveryMatch=all(g['jsonRestore'] for g in games),reloadEveryMatch=all(g['saveReload'] for g in games),bothOutcomes={g['winner'] for g in games}=={'my','opp'},threeFamilies=len({g['family'] for g in games})==3,independentComparisons=all(r.get('differential',{}).get('failureCount')==0 and r['differential']['scenarios']>=30 for r in groups),noBrowserErrors=all(not r.get('browserErrors') for r in groups),traceHashesCurrent=all(sha256((ROOT/r['traceFile']).read_bytes()).hexdigest()==r['traceSha256'] for r in groups),sourceHashesCurrent=all(r.get('sourceSha256') and all(sha256((ROOT/n).read_bytes()).hexdigest()==v for n,v in r['sourceSha256'].items()) for r in groups))
 counts={k:sum(r['counts'][k] for r in groups) for k in groups[0].get('counts',{})}
 differential={k:sum(r['differential'][k] for r in groups) for k in ['scenarios','comparisons','speedComparisons','priorityComparisons','orderComparisons','failureCount']}
 report=dict(completion=False,passed=all(checks.values()),checks=checks,completeMatches=len([g for g in games if g['complete']]),nativeTurns=sum(g['turns'] for g in games),countsIncludingUndoReplay=counts,differential=differential,games=games,groups=[f'SERIES_MATCH_GROUP_{i}_RESULTS.json' for i in range(3)],limitations=groups[0]['limitations'],sourceSha256={n:sha256((ROOT/n).read_bytes()).hexdigest() for n in ['series-match-reference.js','series-match-replay.js','series_match_harness.py','live-practical-oracle.js','index.html','evaluate-series-matches.py']})
 (ROOT/'SERIES_MATCH_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:report[k] for k in ['passed','completeMatches','nativeTurns','differential','checks']},ensure_ascii=False));assert report['passed']
if __name__=='__main__':main()
