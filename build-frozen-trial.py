#!/usr/bin/env python3
"""Package exactly the frozen v2.9.13 runtime and its final regression evidence.

No deploy, ledger promotion, version bump, backlog regeneration or network access.
The ZIP's own hash is an external sidecar; enclosed file hashes are inside it.
"""
from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
import json, zipfile

ROOT=Path(__file__).resolve().parent
DEST=ROOT/'release/tournament-v2.9.13'
ARCHIVE='gc2027ii-v2.9.13-tournament-trial.zip'
REPORTS=['TEST_RESULTS.json','FROZEN_BASELINE.json','TOURNAMENT_BASELINE_RESULTS.json',
    'STATS_MOVES_AUDIT_RESULTS.json','PRIMARY_MOVE_DIFFERENTIAL_RESULTS.json',
    'PENDING_TWENTY_AUDIT_RESULTS.json','THREE_ATTACKS_AUDIT_RESULTS.json',
    'VERSION_MIGRATION_RESULTS.json','PC_BROWSER_RESULTS.json','FULL_MATCH_E2E_RESULTS.json']
DOCS=['PC_TRIAL_START.md','JSON_BACKUP.md','TOURNAMENT_BASELINE_REPORT.md',
    'UNCONFIRMED_CONDITIONS.md','STATS_MOVES_AUDIT.md','THREE_ATTACKS_AUDIT.md']

def main():
    baseline=json.loads((ROOT/'FROZEN_BASELINE.json').read_text())
    tests=json.loads((ROOT/'TEST_RESULTS.json').read_text())
    decision=json.loads((ROOT/'TOURNAMENT_BASELINE_RESULTS.json').read_text())
    assert tests['passed']==tests['total'] and tests['total']>134
    assert baseline['completion'] is False and decision['completion'] is False
    assert decision['limitedTrialAccepted'] is True
    ledger=json.loads((ROOT/'IMPLEMENTATION_LEDGER.json').read_text())
    assert ledger['releaseGate']['complete'] is False
    for name, digest in tests['sourceSha256'].items():
        assert sha256((ROOT/name).read_bytes()).hexdigest()==digest, 'Changed after tests: '+name
    for name, digest in baseline['runtimeSha256'].items():
        assert sha256((ROOT/name).read_bytes()).hexdigest()==digest, 'Frozen runtime changed: '+name
    for name in ['PC_BROWSER_RESULTS.json','VERSION_MIGRATION_RESULTS.json','FULL_MATCH_E2E_RESULTS.json']:
        assert json.loads((ROOT/name).read_text())['passed'] is True, name
    audit=json.loads((ROOT/'STATS_MOVES_AUDIT_RESULTS.json').read_text())
    assert not audit['errors'] and audit['speciesSummary']['targetVerified']==344
    assert audit['speciesSummary']['targetUnconfirmed']==0
    assert audit['moveSummary']['majorCalculationVerified']==168
    assert audit['moveSummary']['majorCalculationUnverified']==11
    content={name:(ROOT/name).read_bytes() for name in sorted(set(list(baseline['runtimeSha256'])+REPORTS+DOCS))}
    for directory in ['reference-data/stats-moves','reference-data/three-attacks']:
        name=directory+'/PROVENANCE.json';content[name]=(ROOT/name).read_bytes()
    hashes={name:sha256(data).hexdigest() for name,data in content.items()}
    manifest=dict(version='v2.9.13',branch='codex-development',completion=False,
        frozen=True,sourceCommit=baseline['sourceCommit'],implementationCommit=baseline['implementationCommit'],
        generatedAt=datetime.now(timezone.utc).isoformat(),limitedTrialAccepted=True,
        fullTournamentRulesCertified=False,testCommands={k:tests[k] for k in ['passed','total']},
        runtimeSha256=baseline['runtimeSha256'],files=hashes,
        archiveChecksum='External SHA256SUMS.txt; ZIP cannot contain its own SHA-256 without self-reference',
        startup='PC_TRIAL_START.md',backup='JSON_BACKUP.md',limitations='UNCONFIRMED_CONDITIONS.md')
    content['RELEASE_MANIFEST.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
    content['SHA256SUMS_CONTENTS.txt']=''.join(f'{sha256(data).hexdigest()}  {name}\n' for name,data in sorted(content.items())).encode()
    DEST.mkdir(parents=True,exist_ok=True)
    archive=DEST/ARCHIVE
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name, data in sorted(content.items()):
            info=zipfile.ZipInfo(name,date_time=(2026,10,23,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644<<16;z.writestr(info,data)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for name,data in content.items():assert z.read(name)==data,name
    digest=sha256(archive.read_bytes()).hexdigest()
    (DEST/'SHA256SUMS.txt').write_text(digest+'  '+ARCHIVE+'\n')
    (DEST/'RELEASE_MANIFEST.json').write_bytes(content['RELEASE_MANIFEST.json'])
    print(f'{archive.relative_to(ROOT)} SHA256 {digest}; {len(content)} files; completion:false')
if __name__=='__main__': main()
