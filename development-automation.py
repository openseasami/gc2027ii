#!/usr/bin/env python3
"""Durable work selection and evidence gates; implementation is performed by Codex."""
import argparse, hashlib, json, os, subprocess, sys
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parent
STATE='DEVELOPMENT_AUTOMATION_STATE.json'
def now(): return datetime.now(timezone.utc).isoformat()
def digest(value): return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
def read(root,name): return json.loads((root/name).read_text())
def save(root,name,data):
    target=root/name;tmp=target.with_suffix(target.suffix+'.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');os.replace(tmp,target)
def git(root,*args): return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
def guard(root):
    if git(root,'branch','--show-current')!='codex-development': raise ValueError('Only codex-development is permitted')
def state(root):
    p=root/STATE
    return read(root,STATE) if p.exists() else dict(schemaVersion=1,completion=False,tasks={},failures=[],checkpoints=[])
def tasks(root):
    backlog=read(root,'DEVELOPMENT_BACKLOG.json');policy=read(root,'DEVELOPMENT_AUTOMATION_POLICY.json')
    hooks={r['name']:r.get('referenceHooks',[]) for r in read(root,'ABILITY_REFERENCE_HOOKS.json')['entries']}
    output=[]
    for row in backlog['entries']:
        classification=row['coverage']['classification']
        if classification=='仕様対象外': continue
        phase='implement' if classification=='未実装' else 'research' if classification=='要調査' else 'extend'
        family=next((group for group,needles in policy['eventFamilies'].items() if any(any(n in h for n in needles) for h in hooks.get(row['name'],[]))),row['category'])
        scope=dict(category=row['category'],name=row['name'],phase=phase,paths=row['effect'].get('paths',[]),assessment=row['coverage'].get('assessmentScope'),tests=row['coverage'].get('tests',[]),remaining=row['coverage'].get('remaining'))
        task=dict(id=digest(scope)[:20],category=row['category'],name=row['name'],phase=phase,family=family,
                  dependencyGroup=f'{family}:{phase}',dependencies=policy['dependencies'].get(family,[]),scopeFingerprint=digest(scope),
                  priority=row['priority'],classification=classification)
        output.append(task)
    return output

def input_fingerprint(root):
    report=root/'TEST_RESULTS.json'
    files=read(root,'TEST_RESULTS.json').get('sourceSha256',{}) if report.exists() else {}
    return digest({f:hashlib.sha256((root/f).read_bytes()).hexdigest() if (root/f).exists() else None for f in files})

def plan(root,st):
    policy=read(root,'DEVELOPMENT_AUTOMATION_POLICY.json');groups={}
    for task in tasks(root):
        prior=st['tasks'].get(task['id'],{})
        if prior.get('status')=='verified-scope':
            if prior.get('testFingerprint')==input_fingerprint(root): continue
            task['recommendedAction']='revalidate-existing-scope'
            task['priorEvidence']=prior.get('evidence')
        if prior.get('status') in ['blocked','in-progress']: continue
        if prior.get('attempts',0)>=policy['maxUnchangedRetries'] and prior.get('inputFingerprint')==input_fingerprint(root): continue
        group=groups.setdefault(task['dependencyGroup'],dict(id=task['dependencyGroup'],tasks=[],dependencies=task['dependencies'],blockedBy=[]))
        group['tasks'].append(task)
    for group in groups.values():
        group['blockedBy']=[d for d in group['dependencies'] if not policy['capabilities'].get(d,False)]
        group['tasks'].sort(key=lambda t:(t['priority']['classification']!='target',-(t['priority']['maxObservedPercent'] or 0),t['name']))
    return sorted(groups.values(),key=lambda g:(bool(g['blockedBy']),not any(t['priority']['classification']=='target' for t in g['tasks']),{'implement':0,'research':1,'extend':2}[g['tasks'][0]['phase']],-max(t['priority']['maxObservedPercent'] or 0 for t in g['tasks']),g['id']))

def verify(root,st,ids,evidence):
    # Evidence accepts a scoped, explicit task-to-test mapping, never whole-mechanic completion.
    report=read(root,'TEST_RESULTS.json');manifest=report.get('sourceSha256',{})
    if not manifest or any(not (root/f).is_file() or hashlib.sha256((root/f).read_bytes()).hexdigest()!=h for f,h in manifest.items()): raise ValueError('Stale or missing test source hashes')
    if not report['results'] or report['total']!=len(report['results']) or report['passed']!=sum(r['exitCode']==0 for r in report['results']): raise ValueError('Invalid test result counts')
    results={r['command'][-1]:r for r in report['results']}
    groups=read(root,'MECHANICS_EVIDENCE.json')['groups']
    for tid in ids:
        task=st['tasks'][tid]
        if task['status']!='in-progress': raise ValueError('Task must be claimed before verification')
        scope=evidence.get(tid,{})
        if not scope.get('scope') or not scope.get('remaining') or not scope.get('tests'): raise ValueError('scope, remaining and tests are required per task')
        allowed={t for g in groups if g['category']==task['category'] and task['name'] in g['names'] for t in g['unitTests']+g['integrationTests']}
        if not set(scope['tests'])<=allowed: raise ValueError('Tests are not registered for this candidate in MECHANICS_EVIDENCE.json')
        for test in scope['tests']:
            if test not in manifest or test not in results: raise ValueError('No recorded test evidence for '+test)
    failed=[r for r in report['results'] if r['exitCode']!=0]
    if failed:
        failure=dict(at=now(),tasks=ids,sourceFingerprint=digest(manifest),causes=[dict(command=r['command'],exitCode=r['exitCode'],stderr=r.get('stderr','')[-4000:],stdout=r.get('stdout','')[-4000:]) for r in failed])
        st['failures'].append(failure)
        for tid in ids: st['tasks'][tid].update(status='retry-needed',lastFailure=len(st['failures'])-1)
        return False
    for tid in ids:
        st['tasks'][tid].update(status='verified-scope',evidence=evidence[tid],testFingerprint=digest(manifest),verifiedAt=now(),completion=False)
    return True

def main(argv=None,root=ROOT):
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['plan','claim','verify','block','release','checkpoint','status']);p.add_argument('--group');p.add_argument('--ids',nargs='+');p.add_argument('--evidence');p.add_argument('--reason');args=p.parse_args(argv)
    guard(root)
    # Mutating commands serialize across terminals; stale lock requires explicit diagnosis/removal.
    lock=root/'.development-automation.lock'
    fd=None
    try:
        if args.command not in ['plan','status']: fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
        st=state(root);st['completion']=False
        if args.command=='plan': print(json.dumps(dict(completion=False,active=[t for t in st['tasks'].values() if t['status']=='in-progress'],groups=plan(root,st)),ensure_ascii=False,indent=2));return 0
        if args.command=='status': print(json.dumps(st,ensure_ascii=False,indent=2));return 0
        if args.command=='claim':
            groups=[g for g in plan(root,st) if g['id']==args.group]
            if not groups or groups[0]['blockedBy']: raise ValueError('Group unavailable or dependency blocked')
            for task in groups[0]['tasks']:
                prior=st['tasks'].get(task['id'],{});fingerprint=input_fingerprint(root);attempts=prior.get('attempts',0) if prior.get('inputFingerprint')==fingerprint else 0;st['tasks'][task['id']]={**task,**prior,'status':'in-progress','attempts':attempts+1,'inputFingerprint':fingerprint,'claimedAt':now()}
        elif args.command in ['block','release']:
            if not args.reason or not args.ids: raise ValueError('ids and reason required')
            for tid in args.ids:
                if st['tasks'][tid]['status']=='verified-scope': raise ValueError('Verified scope is immutable; new backlog scope creates new identity')
                st['tasks'][tid].update(status='blocked' if args.command=='block' else 'pending',reason=args.reason)
        elif args.command=='verify':
            if not args.ids or not args.evidence: raise ValueError('ids and evidence required')
            passed=verify(root,st,args.ids,read(root,args.evidence));save(root,STATE,st);return 0 if passed else 1
        elif args.command=='checkpoint':
            st['checkpoints'].append(dict(at=now(),commit=git(root,'rev-parse','HEAD'),reason=args.reason or 'continuation checkpoint',completion=False,counts={s:sum(t['status']==s for t in st['tasks'].values()) for s in ['verified-scope','in-progress','retry-needed','blocked','pending']}))
        save(root,STATE,st);print(json.dumps(dict(completion=False,command=args.command,tasks=len(st['tasks'])),ensure_ascii=False));return 0
    except (ValueError,KeyError,FileExistsError) as error: print(str(error),file=sys.stderr);return 2
    finally:
        if fd is not None: os.close(fd);lock.unlink()
if __name__=='__main__':sys.exit(main())
