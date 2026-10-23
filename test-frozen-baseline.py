"""The tournament baseline is v2.9.13, not a new feature release."""
from pathlib import Path
from hashlib import sha256
import json, subprocess

root=Path(__file__).resolve().parent
baseline=json.loads((root/'FROZEN_BASELINE.json').read_text())
assert baseline['version']=='v2.9.13' and baseline['completion'] is False
assert baseline['branch']=='codex-development'
assert len(set(baseline['verifiedAttackMoves']))==168
assert len(set(baseline['targetSpecies']))==344
assert len(baseline['unverifiedMovesOutsideScope'])==11
for name,digest in baseline['runtimeSha256'].items():
    assert sha256((root/name).read_bytes()).hexdigest()==digest, 'Frozen runtime changed: '+name
    original=subprocess.run(['git','show',baseline['sourceCommit']+':'+name],cwd=root,check=True,capture_output=True).stdout
    assert sha256(original).hexdigest()==digest, 'Baseline differs from original commit: '+name
audit=json.loads((root/'STATS_MOVES_AUDIT_RESULTS.json').read_text())
assert sorted(x['name'] for x in audit['moves'] if x['major'] and x['basicCalculation'].startswith('verified-'))==baseline['verifiedAttackMoves']
assert sorted(x['name'] for x in audit['species'] if x['target'])==baseline['targetSpecies']
assert audit['speciesSummary']['targetUnconfirmed']==0
assert audit['speciesSummary']['targetMega']==82
assert audit['unverifiedMajorMoves']==baseline['unverifiedMovesOutsideScope']
for version,digest in baseline['migrationArchives'].items():
    assert sha256((root/f'release/gc2027ii-{version}-development.zip').read_bytes()).hexdigest()==digest
print('PASS frozen v2.9.13 runtime bytes, 168 verified attack identities, 344 species/82 Mega, immutable migration archives')
