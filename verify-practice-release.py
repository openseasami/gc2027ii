#!/usr/bin/env python3
"""Verify the actual practice ZIP's membership/hashes and its extracted PC runtime."""
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory
from hashlib import sha256
from datetime import datetime, timezone
import json, shutil, subprocess, sys, zipfile
ROOT = Path(__file__).resolve().parent
DEST = ROOT / 'release/practice-v2.9.13'
ARCHIVE = 'gc2027ii-v2.9.13-practice-verification.zip'
TESTS = ['test-pc-launcher.py', 'browser_pc_trial_test.py', 'browser_prezip_test.py', 'browser_full_match_test.py']

def digest(data): return sha256(data).hexdigest()
def main():
    archive = DEST / ARCHIVE
    checksum = digest(archive.read_bytes())
    assert (DEST / 'SHA256SUMS.txt').read_text() == checksum + '  ' + ARCHIVE + '\n'
    baseline = json.loads((ROOT / 'FROZEN_BASELINE.json').read_text())
    report = dict(completion=False, passed=False, purpose='pre-tournament-practice-and-verification-only',
        duringMatchToolPermission='unconfirmed', duringMatchUseAuthorized=False,
        checkedAt=datetime.now(timezone.utc).isoformat(), archive=archive.relative_to(ROOT).as_posix(),
        sha256=checksum, tests=[], runtimeSha256=baseline['runtimeSha256'],
        testSourceSha256={n:digest((ROOT/n).read_bytes()) for n in ['verify-practice-release.py'] + TESTS})
    try:
        with TemporaryDirectory(prefix='practice-final-', dir=ROOT / 'work') as folder:
            target = Path(folder)
            with zipfile.ZipFile(archive) as z:
                assert z.testzip() is None
                names = z.namelist(); assert len(names) == len(set(names))
                assert all(not PurePosixPath(n).is_absolute() and '..' not in PurePosixPath(n).parts and '\\' not in n for n in names)
                manifest = json.loads(z.read('RELEASE_MANIFEST.json'))
                assert manifest['purpose'] == report['purpose']
                assert manifest['completion'] is False and manifest['duringMatchUseAuthorized'] is False
                assert manifest['duringMatchToolPermission'] == 'unconfirmed'
                assert manifest['fullTournamentRulesCertified'] is False
                assert set(names) == set(manifest['files']) | {'RELEASE_MANIFEST.json', 'SHA256SUMS_CONTENTS.txt'}
                hashes = dict((line.split('  ', 1)[1], line.split('  ', 1)[0]) for line in z.read('SHA256SUMS_CONTENTS.txt').decode().splitlines())
                assert set(hashes) == set(names) - {'SHA256SUMS_CONTENTS.txt'}
                for name, expected in hashes.items(): assert digest(z.read(name)) == expected, name
                for name, expected in manifest['files'].items(): assert digest(z.read(name)) == expected, name
                assert manifest['runtimeSha256'] == baseline['runtimeSha256']
                for name, expected in baseline['runtimeSha256'].items():
                    assert digest(z.read(name)) == digest((ROOT/name).read_bytes()) == expected, name
                for name in ['TEST_RESULTS.json', 'OFFICIAL_MC_AUDIT.json', 'OFFICIAL_CATALOG_COMPARISON.json']:
                    assert z.read(name) == (ROOT/name).read_bytes(), 'Stale bundled evidence: ' + name
                report['filesVerified'] = len(names)
                z.extractall(target)
            report['sash64d8d75Included'] = manifest['sash64d8d75Included']
            report['all18RegisteredResistBerriesIncluded'] = manifest['all18RegisteredResistBerriesIncluded']
            refs = target / 'reference-data/stats-moves'; refs.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / 'reference-data/stats-moves/showdown-normalized.json', refs / 'showdown-normalized.json')
            # Test helpers are copied only AFTER verifying exact archive membership.
            # They are not required to start or use the extracted application.
            for name in TESTS:
                shutil.copy2(ROOT / name, target / name)
                result = subprocess.run([sys.executable, str(target/name)], cwd=target, text=True, capture_output=True, timeout=180)
                report['tests'].append(dict(command=name, exitCode=result.returncode,
                    stdout=result.stdout[-4000:], stderr=result.stderr[-4000:]))
            report['passed'] = len(report['tests']) == 4 and all(t['exitCode'] == 0 for t in report['tests'])
    finally:
        (DEST / 'ARTIFACT_VERIFICATION.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    assert report['passed'], report['tests']
    print(f'PASS practice ZIP: {report["filesVerified"]} files, extraction/launcher/PC/offline/full observed match 4/4; SHA256 {checksum}')
if __name__ == '__main__': main()
