#!/usr/bin/env python3
"""Validated, offline, transactional import of externally verified adoption data."""
import argparse,csv,json,re,sys,tempfile,os
from pathlib import Path

BASE=Path(__file__).resolve().parent
REQUIRED={'species','english','kind','name','rate','source_url','event'}
ALLOWED_KINDS={'move':'moves','ability':'abilities'}

def prepare(csv_path,policy_path,allow_overwrite=False):
    policy=json.loads(Path(policy_path).read_text(encoding='utf-8'))
    source=policy['primarySource']
    errors=[]; candidates={}; seen={}
    with open(csv_path,encoding='utf-8-sig',newline='') as fh:
        reader=csv.DictReader(fh)
        missing=REQUIRED-set(reader.fieldnames or [])
        if missing: raise ValueError('Missing columns: '+', '.join(sorted(missing)))
        for n,row in enumerate(reader,2):
            species=(row['species'] or '').strip(); name=(row['name'] or '').strip()
            kind=(row['kind'] or '').strip().lower(); english=(row['english'] or '').strip()
            event=(row['event'] or '').strip(); url=(row['source_url'] or '').strip()
            if not species or not name or not english: errors.append(f'line {n}: missing species/name/english');continue
            if kind not in ALLOWED_KINDS:errors.append(f'line {n}: invalid kind');continue
            if event!=source['event'] or url!=source['url']:
                errors.append(f'line {n}: source mismatch (must match primarySource)');continue
            try: rate=float(row['rate'])
            except (TypeError,ValueError):errors.append(f'line {n}: invalid rate');continue
            if not (0<=rate<=100):errors.append(f'line {n}: rate out of range');continue
            key=(species,kind,name)
            if key in seen:
                errors.append(f'line {n}: duplicate item first seen at {seen[key]}');continue
            seen[key]=n
            old=policy['records'].get(species)
            if old and old.get('english')!=english:
                errors.append(f'line {n}: species english mismatch');continue
            rec=candidates.setdefault(species,{'english':english,'moves':{},'abilities':{}})
            if rec['english']!=english:errors.append(f'line {n}: inconsistent english name');continue
            field=ALLOWED_KINDS[kind]
            if old and name in old[field] and old[field][name]!=rate and not allow_overwrite:
                errors.append(f'line {n}: conflicts with existing rate; --allow-overwrite required');continue
            rec[field][name]=rate
    if errors: raise ValueError('\n'.join(errors))
    updated=0;added=0
    for species, rec in candidates.items():
        target=policy['records'].setdefault(species,{'english':rec['english'],'moves':{},'abilities':{}})
        for field in ('moves','abilities'):
            for name,rate in rec[field].items():
                if name not in target[field]:added+=1
                elif target[field][name]!=rate:updated+=1
                target[field][name]=rate
    policy['records']=dict(sorted(policy['records'].items()))
    return policy,{'speciesInImport':len(candidates),'speciesWithAnyData':len(policy['records']),
                   'speciesWithoutData':max(0,262-len(policy['records'])),
                   'newObservations':added,'changedObservations':updated,
                   'uniqueTargetMoves':len({m for r in policy['records'].values() for m,v in r['moves'].items() if v>=10}),
                   'uniqueTargetAbilities':len({a for r in policy['records'].values() for a,v in r['abilities'].items() if v>7})}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('csv');p.add_argument('--policy',default=str(BASE/'PRIORITY_POLICY.json'))
    p.add_argument('--allow-overwrite',action='store_true');p.add_argument('--commit',action='store_true',help='Update policy atomically; default is dry run')
    args=p.parse_args()
    try: new,stats=prepare(args.csv,args.policy,args.allow_overwrite)
    except (ValueError,OSError,KeyError) as e:print('IMPORT REJECTED: '+str(e),file=sys.stderr);return 2
    print(json.dumps(stats,ensure_ascii=False,indent=2))
    if args.commit:
        dest=Path(args.policy);fd,tmp=tempfile.mkstemp(dir=dest.parent,prefix='.adoption-',suffix='.tmp')
        try:
            with os.fdopen(fd,'w',encoding='utf-8') as f:json.dump(new,f,ensure_ascii=False,indent=2);f.write('\n')
            os.replace(tmp,dest)
        finally:
            if os.path.exists(tmp):os.unlink(tmp)
        print('COMMITTED:',dest)
    else: print('DRY RUN: no files changed (use --commit)')
    return 0
if __name__=='__main__':sys.exit(main())
