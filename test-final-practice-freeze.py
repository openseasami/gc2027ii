"""Final planned stage: forbid functional/UI/data/save changes from fe26ed5."""
from pathlib import Path
from hashlib import sha256
import json,subprocess
ROOT=Path(__file__).resolve().parent
BASE='fe26ed5fec5a165909c2f4d6979df7ca27d8cb92'
baseline=json.loads((ROOT/'FROZEN_BASELINE.json').read_text())
assert baseline['completion'] is False and baseline['currentRuntimeVersion']=='v2.9.17'
for name in baseline['runtimeSha256']:
 original=subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT)
 current=(ROOT/name).read_bytes()
 if name=='index.html':current=current.replace(b'Support v2.9.17</title>',b'Support v2.9.16</title>')
 if name=='sw.js':current=current.replace(b"'v2.9.17'",b"'v2.9.16'")
 assert current==original,'Unapproved functional/UI/data change from final baseline: '+name
for name in ['ADOPTION_120_NORMALIZED.json','UI_PRESERVATION_BASELINE.json','reference-data/series-matches/group-0.json','reference-data/series-matches/group-1.json','reference-data/series-matches/group-2.json']:
 assert (ROOT/name).read_bytes()==subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT),name
assert sha256((ROOT/'release/practice-v2.9.16/gc2027ii-v2.9.16-practice-verification.zip').read_bytes()).hexdigest()=='16376cfdd58adc63be1859d9bc38089ed7f558bde5d9a59c11e6885b256be62a'
print('PASS final fe26ed5 freeze: runtime/UI/data/calculator/save logic unchanged; only title/cache version; old ZIP immutable')
