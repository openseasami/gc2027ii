#!/usr/bin/env python3
"""Build exactly 120 disjoint adoption profiles from user's 7-page saved HTML.
Tournament top 30, then highest-ranked Season 6 non-tournament species.
Season rank is NOT falsely asserted as GC-I rank. Preserve English move labels when untranslated.
"""
import json,re,csv,sys
from pathlib import Path
from bs4 import BeautifulSoup
BASE=Path(__file__).resolve().parent
SNAP=Path(sys.argv[1]) if len(sys.argv)>1 else BASE/'GC2027II_stats_7pages.json'
TURL='https://www.pokemon-zone.com/champions/championships/ic178714271270xvovwl/'
RURL='https://www.pokemon-zone.com/champions/ranked-seasons/ssn6_rd178713989559pruusy/'
D=json.loads(SNAP.read_text(encoding='utf8'))
assert D['schema']=='gc2027ii-site-html-snapshot-v1' and len(D['entries'])==7
policy=json.loads((BASE/'PRIORITY_POLICY.json').read_text(encoding='utf8'))
site=(BASE/'index.html').read_text(encoding='utf8')
roster=json.loads(re.search(r'const REGULATION_MC=(\{.*?\});',site).group(1))['mapping']
code_names={str(x['code']):x['name'] for x in roster}
known_eng={r['english']:key for key,r in policy['records'].items()}

def extract(key, src):
  soup=BeautifulSoup(D['entries'][key]['html'],'html.parser'); out=[]
  for item in soup.select('details.ranked-poke'):
    en=item.select_one('.ranked-poke__name').get_text(' ',strip=True)
    pos=int(item['id'].split('-')[-1]); sprite=item.select_one('summary img.ranked-poke__sprite')
    img=sprite.get('src','') if sprite else ''
    match=re.search(r'ui_PokeIcon_\d+_(\d{4})_(\d{2})_',img)
    code=f'{match.group(1)}-{int(match.group(2)):03d}' if match else None
    jp=known_eng.get(en) or code_names.get(code)
    if jp is None: jp='EN:'+en
    moves={};abilities={}; items={}
    for tile in item.select('.champ-stat-grid__tile'):
      h=tile.select_one('.champ-stat-grid__heading-text') or tile.select_one('.champ-stat-grid__heading')
      heading=h.get_text(' ',strip=True) if h else ''
      field= moves if heading.startswith('Moves') else abilities if heading.startswith('Abilities') else items if heading.startswith('Held Items') else None
      if field is None: continue
      for row in tile.select('.ranked-row'):
        anchor=row.select_one('.ranked-row__name a'); label=row.select_one('.usage-bar__label')
        if not anchor or not label:continue
        val=float(label.get_text(strip=True).strip('%'))
        assert 0<=val<=100
        nm=anchor.get_text(' ',strip=True)
        if nm in field:raise ValueError(('duplicate label',en,nm))
        field[nm]=val
    assert moves and abilities,(key,en)
    out.append(dict(name=jp,english=en,rank=pos,code=code,moves=moves,abilities=abilities,items=items,source=src,url=D['entries'][key]['url']))
  return out

t=extract('tournament.html','tournament')
r=[]
for i in range(1,7):r.extend(extract(f'season6-{i}.html','ranked-season6'))
assert len(t)==30 and len(r)==120
assert [x['rank'] for x in t]==list(range(1,31))
assert [x['rank'] for x in r]==list(range(1,121))
assert len({x['code'] for x in r})==120
selected=list(t); seen={x['code'] for x in t}
for x in r:
  if x['code'] in seen:continue
  selected.append(x);seen.add(x['code'])
  if len(selected)==120:break
assert len(selected)==120
for x in selected:
  x['selectionRank']=selected.index(x)+1
  x['verifiedTournamentRank']=x['rank'] if x['source']=='tournament' else None
  x['rankedSeasonRank']=x['rank'] if x['source']=='ranked-season6' else None
  if x['source']=='ranked-season6':x['rank']=None
# preserve existing Japanese move translations by per-species matching rates where unique
for x in selected:
  old=policy['records'].get(x['name'])
  if old and old.get('english')==x['english']:
    for k in ('moves','abilities'):
      used=set();new={}
      for english,rate in x[k].items():
        matches=[j for j,v in old.get(k,{}).items() if abs(v-rate)<0.000001 and j not in used]
        mapped=matches[0] if len(matches)==1 else english
        new[mapped]=rate; used.add(mapped)
      x[k]=new
# avoid overclaim: alternate ranked rows are NOT tournament rank 31-120; proxy selection explicit
out={'schema':'gc2027ii-adoption-120-v1','collected_at':D['collected_at'],
'selectionMethod':'Global Challenge I tournament top 30 followed by top Season 6 doubles species excluded from tournament top 30; NOT claimed to be tournament ranks 31-120',
'primarySource':TURL,'fallbackSource':RURL,'species':selected}
(BASE/'ADOPTION_120_VERIFIED.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
with (BASE/'ADOPTION_120_VERIFIED.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['selection_rank','pokemon','english','source','verified_tournament_rank','ranked_season_rank','kind','name','percent','url'])
 for x in selected:
  for kind in ('moves','abilities'):
   for name,pct in x[kind].items():w.writerow([x['selectionRank'],x['name'],x['english'],x['source'],x['verifiedTournamentRank'] or '',x['rankedSeasonRank'] or '',kind,name,pct,x['url']])
old=policy['records']; records={};prov={}
for x in selected:
 k=x['name']; rec=old.get(k,{'english':x['english'],'moves':{},'abilities':{}})
 assert rec['english']==x['english'],(k,rec['english'],x['english'])
 rec['moves']=x['moves'];rec['abilities']=x['abilities'];records[k]=rec
 prov[k]={'sourceType':x['source'],'sourceURL':x['url'],'verifiedTournamentRank':x['verifiedTournamentRank'],'rankedSeasonRank':x['rankedSeasonRank'],'selectionRank':x['selectionRank'],'moveLanguage':'mixed-japanese-english','abilityLanguage':'mixed-japanese-english'}
policy['records']={k:records[k] for k in sorted(records)}
policy['observationSourcesV2']=prov
policy['primarySource']['provenance']='User-provided 2026-10-20 HTML snapshot, 30 GC-I tournament profiles, remaining ranked Season 6 doubles profiles; English labels retained where mapping unverified'
policy['dataCoverage']={'target':120,'profiles':len(selected),'tournament':30,'rankedFallback':90,'rankingNote':out['selectionMethod'],'sourceSnapshot':'GC2027II_stats_7pages.json'}
(BASE/'PRIORITY_POLICY.json').write_text(json.dumps(policy,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('total',len(selected),'tournament',30,'ranked',90,'moves',sum(len(x['moves']) for x in selected),'abilities',sum(len(x['abilities']) for x in selected),'unknownJP',sum(x['name'].startswith('EN:') for x in selected))
print('threshold move',sum(p>=10 for x in selected for p in x['moves'].values()),'ability',sum(p>7 for x in selected for p in x['abilities'].values()))
