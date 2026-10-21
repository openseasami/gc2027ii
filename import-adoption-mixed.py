#!/usr/bin/env python3
"""Strict, atomic importer preserving source attribution for GC-I and Season 6 doubles.

Only GC-I tournament rank >=31 may use ranked fallback. A tournament rank must
be backed by a separately verified ranking manifest; ranked season placement is
NOT tournament placement. No guessing unknown ranks.
"""
import argparse,csv,json,os,sys,tempfile
from pathlib import Path
from urllib.parse import urlsplit
BASE=Path(__file__).resolve().parent
TOURNAMENT='https://www.pokemon-zone.com/champions/championships/ic178714271270xvovwl/'
RANKED='https://www.pokemon-zone.com/champions/ranked-seasons/ssn6_rd178713989559pruusy/'
HEADERS={'species','english','kind','name','rate','source_url','event'}
RANKED_EVENT='Season 6 — Doubles (M-C), updated 2026-10-07'

def load_manifest(path):
    data=json.loads(Path(path).read_text(encoding='utf-8'))
    if not isinstance(data,dict):raise ValueError('ranking manifest must be a dictionary')
    ranks={}; used=set()
    for species,info in data.items():
        if not isinstance(info,dict) or type(info.get('rank')) is not int or not 1<=info['rank']<=262:raise ValueError(f'{species}: unknown/invalid tournament rank')
        if info['rank'] in used:raise ValueError(f'duplicate tournament rank: {info["rank"]}')
        if info.get('source_url')!=TOURNAMENT:raise ValueError(f'{species}: tournament evidence missing')
        ranks[species]=info['rank'];used.add(info['rank'])
    return ranks

def prepare(path,policy_file,manifest_file,allow_overwrite=False):
    data=json.loads(Path(policy_file).read_text(encoding='utf-8'))
    ranks=load_manifest(manifest_file)
    provenance=data.setdefault('observationSources',{})
    changes={}; seen=set(); errors=[]; counts={'tournamentObservations':0,'rankedObservations':0}
    with open(path,encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        if not HEADERS.issubset(reader.fieldnames or []):raise ValueError('Missing CSV columns: '+str(HEADERS-set(reader.fieldnames or [])))
        for line,r in enumerate(reader,2):
            species=r['species'].strip(); eng=r['english'].strip(); kind=r['kind'].strip();name=r['name'].strip();source=r['source_url'].strip();event=r['event'].strip()
            if not species or not eng or not name or kind not in ('move','ability'):errors.append(f'{line}: invalid entry');continue
            if species not in ranks:errors.append(f'{line}: tournament ranking unverified for {species}');continue
            rank=ranks[species]
            if rank<=30:
                if source!=TOURNAMENT or event!=data['primarySource']['event']:errors.append(f'{line}: top-30 must use tournament source');continue
            else:
                if source!=RANKED or event!=RANKED_EVENT:errors.append(f'{line}: ranked fallback must use exact Season 6 doubles source');continue
            try:rate=float(r['rate'])
            except ValueError:errors.append(f'{line}: invalid rate');continue
            if not 0<=rate<=100:errors.append(f'{line}: rate out of range');continue
            k=(species,kind,name)
            if k in seen:errors.append(f'{line}: duplicate');continue
            seen.add(k)
            existing=data['records'].get(species)
            if existing and existing['english']!=eng:errors.append(f'{line}: English name mismatch');continue
            field='moves' if kind=='move' else 'abilities'; old=existing.get(field,{}).get(name) if existing else None
            old_source=provenance.get(species,{}).get(kind,{}).get(name)
            # Legacy observations are GC tournament entries.
            if old is not None and not old_source:old_source=TOURNAMENT
            if old is not None and (old!=rate or old_source!=source) and not allow_overwrite:errors.append(f'{line}: existing value/source conflict');continue
            changes[k]=(eng,field,rate,source,rank)
            counts['tournamentObservations' if source==TOURNAMENT else 'rankedObservations']+=1
    if errors:raise ValueError('\n'.join(errors))
    added=0;updated=0
    for (species,kind,name),(eng,field,rate,source,rank) in changes.items():
        rec=data['records'].setdefault(species,{'english':eng,'moves':{},'abilities':{}})
        if name not in rec[field]:added+=1
        elif rec[field][name]!=rate:updated+=1
        rec[field][name]=rate
        provenance.setdefault(species,{}).setdefault(kind,{})[name]=source
    data['records']=dict(sorted(data['records'].items()))
    data['tournamentRanksVerified']={k:ranks[k] for k in sorted(ranks)}
    data['rankedFallbackSource']={'event':RANKED_EVENT,'url':RANKED,'conditions':'Regulation M-C, Season 6, Doubles; only verified GC-I rank >=31'}
    counts.update({'newObservations':added,'changedObservations':updated,'totalSpeciesWithData':len(data['records']),'tournamentRanksVerified':len(ranks)})
    return data,counts

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('csv');ap.add_argument('--manifest',required=True);ap.add_argument('--policy',default=str(BASE/'PRIORITY_POLICY.json'));ap.add_argument('--commit',action='store_true');ap.add_argument('--allow-overwrite',action='store_true')
    args=ap.parse_args()
    try: data,stats=prepare(args.csv,args.policy,args.manifest,args.allow_overwrite)
    except (ValueError,OSError,KeyError) as e:print('REJECTED:',e,file=sys.stderr);return 2
    print(json.dumps(stats,ensure_ascii=False,indent=2))
    if args.commit:
        dst=Path(args.policy);fd,tmp=tempfile.mkstemp(dir=dst.parent,prefix='.verified-adoption-',suffix='.tmp')
        try:
            with os.fdopen(fd,'w',encoding='utf8') as f:json.dump(data,f,ensure_ascii=False,indent=2);f.write('\n')
            os.replace(tmp,dst)
        finally:
            if os.path.exists(tmp):os.remove(tmp)
        print('COMMITTED:',dst)
    else:print('DRY RUN, no files changed')
    return 0
if __name__=='__main__':sys.exit(main())
