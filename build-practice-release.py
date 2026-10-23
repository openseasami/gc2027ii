#!/usr/bin/env python3
"""Build a practice-only archive; official eligibility/permission remain unconfirmed.

Never deploys, edits runtime, promotes completion, or overwrites historical ZIPs.
The checksum of the ZIP itself is an external sidecar (no self-reference).
"""
from pathlib import Path
from hashlib import sha256
from datetime import datetime, timezone
import json, subprocess, zipfile
ROOT = Path(__file__).resolve().parent
DEST = ROOT / 'release/practice-v2.9.16'
ARCHIVE = 'gc2027ii-v2.9.16-practice-verification.zip'
BASE = '3e85b0506e0bb36249150eb8df480d709b2c4cd1'
REPORTS = ['PC_OPERATION_BEFORE.json','PC_OPERATION_RESULTS.json','PC_OPERATION_LAYOUT_RESULTS.json','reference-data/series-matches/group-0.json','reference-data/series-matches/group-1.json','reference-data/series-matches/group-2.json',
    'SERIES_MATCH_RESULTS.json','SERIES_MATCH_INCIDENTS.json','SERIES_MATCH_GROUP_0_RESULTS.json','SERIES_MATCH_GROUP_1_RESULTS.json','SERIES_MATCH_GROUP_2_RESULTS.json',
    'TEST_RESULTS.json', 'FROZEN_BASELINE.json', 'OFFICIAL_MC_AUDIT.json',
    'OFFICIAL_CATALOG_COMPARISON.json', 'PRACTICE_RELEASE_READINESS.json',
    'STATS_MOVES_AUDIT_RESULTS.json', 'PRIMARY_MOVE_DIFFERENTIAL_RESULTS.json',
    'PENDING_TWENTY_AUDIT_RESULTS.json', 'THREE_ATTACKS_AUDIT_RESULTS.json',
    'KO_BOUNDARY_AUDIT_RESULTS.json', 'KO_BOUNDARY_AUDIT_INCIDENTS.json',
    'ALL_RESIST_BERRY_RESULTS.json', 'ALL_BERRY_BROWSER_RESULTS.json',
    'PC_BROWSER_RESULTS.json', 'PREZIP_BROWSER_RESULTS.json',
    'VERSION_MIGRATION_RESULTS.json', 'FULL_MATCH_E2E_RESULTS.json',
    'TOURNAMENT_PRACTICAL_RESULTS.json', 'LIVE_PRACTICAL_RESULTS.json', 'LIVE_WORKFLOW_RESULTS.json',
]
DOCS = ['PC_OPERATION_AUDIT.md','SERIES_MATCH_AUDIT.md','LIVE_PRACTICAL_AUDIT.md', 'PRACTICE_RELEASE_REPORT.md', 'OFFICIAL_CATALOG_REVIEW.md', 'PC_TRIAL_START.md',
        'JSON_BACKUP.md', 'UNCONFIRMED_CONDITIONS.md', 'STATS_MOVES_AUDIT.md',
        'THREE_ATTACKS_AUDIT.md', 'FINAL_DAMAGE_KO_AUDIT.md']

def load(name): return json.loads((ROOT / name).read_text())
def digest(data): return sha256(data).hexdigest()
def current(hashes):
    assert hashes
    for name, expected in hashes.items():
        assert digest((ROOT / name).read_bytes()) == expected, 'Changed since verification: ' + name

def main():
    assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() == 'codex-development'
    for commit in [BASE, '64d8d75']:
        subprocess.run(['git', 'merge-base', '--is-ancestor', commit, 'HEAD'], cwd=ROOT, check=True)
    tests = load('TEST_RESULTS.json'); baseline = load('FROZEN_BASELINE.json')
    assert tests['total'] >= 152 and tests['passed'] == tests['total'] == len(tests['results'])
    assert all(r['exitCode'] == 0 for r in tests['results'])
    current(tests['sourceSha256']); current(baseline['runtimeSha256'])
    assert baseline['completion'] is False and load('IMPLEMENTATION_LEDGER.json')['completion'] is False
    assert load('DEVELOPMENT_BACKLOG.json')['completion'] is False
    assert load('OFFICIAL_MC_AUDIT.json')['toolPermission']['status'] == 'unconfirmed'
    assert load('OFFICIAL_CATALOG_COMPARISON.json')['fullCatalogEligibilityCertified'] is False
    readiness = load('PRACTICE_RELEASE_READINESS.json')
    assert readiness['localTechnicalChecksPassed'] is True and readiness['completion'] is False
    current(readiness['evidenceSha256'])
    stats = load('STATS_MOVES_AUDIT_RESULTS.json')
    assert not stats['errors'] and stats['speciesSummary']['targetVerified'] == 344
    assert stats['speciesSummary']['targetUnconfirmed'] == 0
    assert stats['moveSummary']['majorCalculationVerified'] == 168
    assert stats['moveSummary']['majorCalculationUnverified'] == 11
    for name in ['PC_BROWSER_RESULTS.json', 'PREZIP_BROWSER_RESULTS.json',
                 'VERSION_MIGRATION_RESULTS.json', 'FULL_MATCH_E2E_RESULTS.json']:
        assert load(name)['passed'] is True, name
    assert load('SERIES_MATCH_RESULTS.json')['passed'] is True
    assert load('SERIES_MATCH_RESULTS.json')['completeMatches'] >= 30
    assert load('LIVE_PRACTICAL_RESULTS.json')['passed'] is True
    assert load('LIVE_PRACTICAL_RESULTS.json')['total'] >= 30
    assert load('LIVE_WORKFLOW_RESULTS.json')['passed'] is True
    old = ROOT / 'release/tournament-v2.9.13/gc2027ii-v2.9.13-tournament-trial.zip'
    assert digest(old.read_bytes()) == '3cc7b8d9ca186e3a543f8aa0b514e094b253f90d119e716aef2229b6d7d95a90'
    names = sorted(set(list(baseline['runtimeSha256']) + REPORTS + DOCS + [
        'reference-data/stats-moves/PROVENANCE.json', 'reference-data/three-attacks/PROVENANCE.json']))
    content = {name: (ROOT / name).read_bytes() for name in names}
    content['START_HERE.txt'] = ('''大会前の練習・検証専用 / PRACTICE AND VERIFICATION ONLY
v2.9.16 / baseline 3e85b05 + PC操作・更新・30試合再検証 (タスキ・18半減実修正を保持)
公式ポケモン・技・持ち物一覧の全件適合は未確認です。
対戦中の外部ツール利用許可は確認されていません。許可の証明ではありません。
全仕様 completion:false。計算は記録された検証条件内に限ります。
まず PC_TRIAL_START.md、JSON_BACKUP.md、UNCONFIRMED_CONDITIONS.md をお読みください。
Windows: start-pc-trial.cmd / py -3 launch-pc-trial.py (Python 3 が必要)
URL: http://127.0.0.1:8765/index.html (公開サイトとは別の保存領域)
起動前に旧版と移行先の両方でJSONバックアップを保存してください。
ZIP自身のSHA-256は隣接するSHA256SUMS.txt、内部ファイルはSHA256SUMS_CONTENTS.txt。
''').encode()
    manifest = dict(version='v2.9.16', branch='codex-development', completion=False,
        purpose='pre-tournament-practice-and-verification-only', sourceBaseCommit=BASE,
        generatedAt=datetime.now(timezone.utc).isoformat(), runtimeUnchangedSinceBase=False, dataBaselinePreserved=True, limitedPcUiAmendment=True,
        practiceTechnicalChecksPassed=True, fullTournamentRulesCertified=False,
        duringMatchToolPermission='unconfirmed', duringMatchUseAuthorized=False,
        meaning='No claim of permission or tournament eligibility. Use this package only for pre-tournament practice and verification.',
        sash64d8d75Included=True, all18RegisteredResistBerriesIncluded=True,
        testCommands={k: tests[k] for k in ['passed', 'total']},
        runtimeSha256=baseline['runtimeSha256'],
        builderSha256=digest(Path(__file__).read_bytes()),
        files={name: digest(data) for name, data in content.items()},
        archiveChecksum='External SHA256SUMS.txt; ZIP cannot contain its own SHA-256',
        startup='PC_TRIAL_START.md', backup='JSON_BACKUP.md', limitations='UNCONFIRMED_CONDITIONS.md')
    content['RELEASE_MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    content['SHA256SUMS_CONTENTS.txt'] = ''.join(f'{digest(data)}  {name}\n' for name, data in sorted(content.items())).encode()
    DEST.mkdir(parents=True, exist_ok=True)
    archive = DEST / ARCHIVE
    assert not archive.exists(), 'Practice ZIP already exists; do not overwrite a finalized archive'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(content.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 23, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o100644 << 16
            z.writestr(info, data)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assert all(z.read(name) == data for name, data in content.items())
    checksum = digest(archive.read_bytes())
    (DEST / 'SHA256SUMS.txt').write_text(checksum + '  ' + ARCHIVE + '\n')
    (DEST / 'RELEASE_MANIFEST.json').write_bytes(content['RELEASE_MANIFEST.json'])
    print(f'{archive.relative_to(ROOT)} SHA256 {checksum}; {len(content)} files; completion:false')
if __name__ == '__main__': main()
