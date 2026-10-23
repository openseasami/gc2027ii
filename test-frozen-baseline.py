"""The tournament baseline is v2.9.13, not a new feature release."""
from pathlib import Path
from hashlib import sha256
import json, subprocess

root=Path(__file__).resolve().parent
baseline=json.loads((root/'FROZEN_BASELINE.json').read_text())
assert baseline['version']=='v2.9.13' and baseline['completion'] is False
assert baseline['branch']=='codex-development'
assert baseline['currentRuntimeVersion']=='v2.9.14'
assert 'Support v2.9.14' in (root/'index.html').read_text()
assert "'v2.9.14'" in (root/'sw.js').read_text()
assert len(set(baseline['verifiedAttackMoves']))==168
assert len(set(baseline['targetSpecies']))==344
assert len(baseline['unverifiedMovesOutsideScope'])==11
for name,digest in baseline['runtimeSha256'].items():
    assert sha256((root/name).read_bytes()).hexdigest()==digest, 'Frozen runtime changed: '+name
    original=subprocess.run(['git','show',baseline['sourceCommit']+':'+name],cwd=root,check=True,capture_output=True).stdout
    old=baseline.get('originalRuntimeSha256',baseline['runtimeSha256'])[name]
    assert sha256(original).hexdigest()==old, 'Original baseline provenance changed: '+name
    if digest!=old:
        amendments=[x for x in baseline.get('auditAmendments',[]) if x['file']==name]
        assert len(amendments)==1 and amendments[0]['featureAdded'] is False
        assert amendments[0]['originalSha256']==old and amendments[0]['correctedSha256']==digest
audit=json.loads((root/'STATS_MOVES_AUDIT_RESULTS.json').read_text())
assert sorted(x['name'] for x in audit['moves'] if x['major'] and x['basicCalculation'].startswith('verified-'))==baseline['verifiedAttackMoves']
assert sorted(x['name'] for x in audit['species'] if x['target'])==baseline['targetSpecies']
assert audit['speciesSummary']['targetUnconfirmed']==0
assert audit['speciesSummary']['targetMega']==82
assert audit['unverifiedMajorMoves']==baseline['unverifiedMovesOutsideScope']
for version,digest in baseline['migrationArchives'].items():
    assert sha256((root/baseline.get('migrationArchivePaths',{}).get(version,f'release/gc2027ii-{version}-development.zip')).read_bytes()).hexdigest()==digest
print('PASS scoped v2.9.14 runtime bytes on immutable v2.9.13 data baseline, 168 verified attack identities, 344 species/82 Mega, immutable migration archives')
