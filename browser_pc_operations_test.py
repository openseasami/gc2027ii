"""Reproducible before/after DOM workload, real correction, HP/switch/KO refresh."""
from pathlib import Path
from hashlib import sha256
from statistics import median
import json
from pc_operation_benchmark import measure
ROOT=Path(__file__).resolve().parent
before=json.loads((ROOT/'PC_OPERATION_BEFORE.json').read_text())
assert before['sourceBaseCommit']=='3e85b0506e0bb36249150eb8df480d709b2c4cd1'
assert before['benchmarkSha256']==sha256((ROOT/'pc_operation_benchmark.py').read_bytes()).hexdigest()
after=measure(ROOT,3)
def summary(report):
 s=report['samples'];latencies=[x for row in s for x in row['updateMs']]
 return dict(samples=len(s),clicks=median(x['clicks'] for x in s),inputs=median(x['inputs'] for x in s),explicitWheelCommands=0,
  scrollEvents=median(x['scrollEvents'] for x in s),automatedSeconds=median(x['automatedSeconds'] for x in s),
  panelRenderCalls=median(x['panelRenderCalls'] for x in s),refreshCalls=median(x['refreshCalls'] for x in s),
  updateMedianMs=round(median(latencies),2),updateMaxMs=round(max(latencies),2))
bs,as_=summary(before),summary(after)
assert before['passed'] and after['passed'] and bs['samples']==as_['samples']==3
assert bs['clicks']==24 and as_['clicks']==23,(bs,as_)
assert as_['panelRenderCalls']<bs['panelRenderCalls'] and as_['refreshCalls']<bs['refreshCalls'],(bs,as_)
assert all(s['finalState']==before['samples'][0]['finalState'] for s in after['samples'])
assert all(s['corrections']=={'opponentHp':True,'ownHp':True} for s in after['samples'])
assert as_['automatedSeconds']<45 and as_['updateMedianMs']<1500 and as_['updateMaxMs']<2500,(bs,as_)
report=dict(completion=False,passed=True,baselineCommit='3e85b0506e0bb36249150eb8df480d709b2c4cd1',before=bs,after=as_,measurements=after,
 beforeEvidenceSha256=sha256((ROOT/'PC_OPERATION_BEFORE.json').read_bytes()).hexdigest(),
 sourceSha256={n:sha256((ROOT/n).read_bytes()).hexdigest() for n in ['index.html','pc_operation_benchmark.py','browser_pc_operations_test.py']},
 limitations=['Automated controls/assertions; excludes human reading and decision time; no human 45-second certification',
 'Scroll event count includes browser automatic scrolling, is not a count of human wheel gestures and varies with layout/timing',
 'Three samples per version in the same Linux Chromium/Windows UA environment; timing is descriptive, not a statistical performance guarantee',
 '30-match combat regression is separate from this UI workload; no official/rules research'])
(ROOT/'PC_OPERATION_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS before/after PC operations:',json.dumps(dict(before=bs,after=as_),ensure_ascii=False))
