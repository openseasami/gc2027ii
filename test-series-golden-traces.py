"""Keep the v2.9.15 30-match/218-turn fixtures as the combat regression basis."""
from pathlib import Path
from hashlib import sha256
import subprocess,json
ROOT=Path(__file__).resolve().parent
BASE='3e85b0506e0bb36249150eb8df480d709b2c4cd1'
before=json.loads((ROOT/'PC_OPERATION_BEFORE.json').read_text())
assert before['runtimeIndexSha256']==sha256(subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)).hexdigest()
for i in range(3):
 name=f'reference-data/series-matches/group-{i}.json'
 assert sha256((ROOT/name).read_bytes()).hexdigest()==sha256(subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT)).hexdigest(),name
print('PASS baseline runtime measurement provenance and exact reuse of v2.9.15 three-group native match fixtures')
