#!/usr/bin/env python3
"""Package the tested static site without deploying or declaring completion."""
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json,re,zipfile
ROOT=Path(__file__).resolve().parent

def main():
    ledger=json.loads((ROOT/'IMPLEMENTATION_LEDGER.json').read_text())
    tests=json.loads((ROOT/'TEST_RESULTS.json').read_text())
    if tests['passed']!=tests['total']:
        raise SystemExit('Release packaging requires all recorded commands to pass')
    for name,expected in tests['sourceSha256'].items():
        if sha256((ROOT/name).read_bytes()).hexdigest()!=expected:
            raise SystemExit('Source changed after tests: '+name)
    if ledger['releaseGate']['complete']:
        raise SystemExit('This packager is only for incomplete development checkpoints')
    html=(ROOT/'index.html').read_text()
    version=re.search(r'<title>[^<]*?(v\d+\.\d+\.\d+)</title>',html).group(1)
    scripts=re.findall(r'<script\b[^>]*src=["\']\./([^"\']+)["\']',html)
    files=sorted(set(['.nojekyll','index.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png']+scripts))
    for name in files:
        if not (ROOT/name).is_file():raise SystemExit('Missing runtime file '+name)
    unresolved=[]
    dependency={'abilities':['confirmed event source','rank/status/damage/field integration','independent scenarios'],
                'moves':['targets and outcome confirmation','shared ability/item reactions','independent scenarios'],
                'items':['item activity/suppression/consumption','event integration','independent scenarios'],
                'mega':['event legality and base/form stats','stone/ability transitions','independent scenarios']}
    for category,rows in ledger['inventory'].items():
        for row in rows:
            unresolved.append(dict(category=category,name=row['name'],priority=row['priority'],effect=row['effect'],
                unitVerification=row['unitVerification'],integrationVerification=row['integrationVerification'],
                completionBlockedBy=['Full per-effect and authoritative verification incomplete'],dependencies=dependency[category]))
    rank={'target':0,'unknown':1,'defer':2}
    unresolved.sort(key=lambda r:(rank[r['priority']['classification']],r['category'],r['name']))
    backlog=dict(schemaVersion=1,complete=False,scope='Every row still lacks full authoritative verification; requires-review does not mean no implementation.',
        stageSummary=ledger['stageSummary'],dependencies=dependency,entries=unresolved,
        definiteUnsupportedAbilityLabels=ledger['abilities']['markedUnsupported'],
        criticalWork=['Confirm target regulation and legal forms/stones/stats','Unify source-aware rank changes across existing paths','Connect confirmed target effects without guessed targets','Verify item suppression and post-Mega abilities','Independent full doubles match oracle and complete browser E2E'])
    (ROOT/'DEVELOPMENT_BACKLOG.json').write_text(json.dumps(backlog,ensure_ascii=False,indent=2)+'\n')
    out=ROOT/'release';out.mkdir(exist_ok=True)
    manifest=dict(version=version,development=True,complete=False,generatedAt=datetime.now(timezone.utc).isoformat(),
        baseCommit='e99c740dc7205da29518dab62829f3fe026ba26d',branch='codex-development',
        testCommands={'passed':tests['passed'],'total':tests['total']},
        files={name:sha256((ROOT/name).read_bytes()).hexdigest() for name in files},
        limitations=['No deployment performed','Full mechanics and legality not certified','See DEVELOPMENT_CHECKPOINT.md and DEVELOPMENT_BACKLOG.json in source repository'])
    manifestText=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
    (out/'RELEASE_MANIFEST.json').write_text(manifestText)
    status=f'''# {version} 開発途中の公開用ファイル一式\n\n完成版ではありません。自動テスト{tests['passed']}/{tests['total']}コマンド成功。\n全効果・対象大会の使用可否・公式ゲームとの試合照合は未完了です。\n\n同梱ファイルを静的ホスティングの同じディレクトリへ配置してください。\n全外部JSを含めて配置する必要があります。file://からの直接起動は検証対象外です。\n既存のデータ保存先は変更していません。公開・デプロイは行っていません。\n'''
    archive=out/f'gc2027ii-{version}-development.zip'
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name in files:z.write(ROOT/name,name)
        z.writestr('RELEASE_MANIFEST.json',manifestText)
        z.writestr('DEVELOPMENT_STATUS.md',status)
    checksum=sha256(archive.read_bytes()).hexdigest()
    (out/'SHA256SUMS.txt').write_text(checksum+'  '+archive.name+'\n')
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for name,expected in manifest['files'].items():assert sha256(z.read(name)).hexdigest()==expected,name
    print(f'{archive.relative_to(ROOT)}: {len(files)} runtime files, verified SHA-256; complete=false')
if __name__=='__main__':main()
