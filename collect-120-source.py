#!/usr/bin/env python3
"""One-run evidence collector for GC-I tournament top 30 and Season 6 Doubles.

IMPORTANT: Season 6 ranks are NEVER represented as tournament ranks. Output is
raw, source-attributed English observations, not Japanese in-game effect data.
Requires network to source site or --offline-dir with saved HTML pages. No
partial commits: validates collected pages before atomically replacing outputs.
"""
import argparse,json,re,tempfile,os,sys,time
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
from bs4 import BeautifulSoup

TOURNAMENT='https://www.pokemon-zone.com/champions/championships/ic178714271270xvovwl/'
RANKED='https://www.pokemon-zone.com/champions/ranked-seasons/ssn6_rd178713989559pruusy/'
RANK_RE=re.compile(r'^#(\d+)\s+use\b',re.I)
RATE=re.compile(r'(.+?)\s+(\d+(?:\.\d+)?)%\s*$')

def strip(s):return re.sub(r'\s+',' ',s).strip()

def parse_text(text,source):
    """Parse visible text as returned by browser innerText or bs4 get_text."""
    lines=[strip(x) for x in text.splitlines() if strip(x)]
    records=[]; active=None; section=None
    for i,line in enumerate(lines):
        match=RANK_RE.match(line)
        if match:
            if active: records.append(active)
            rank=int(match.group(1))
            # rendered text: '#1 use Image: Rillaboom' or '#1 use' followed by name
            name=re.sub(r'^Image:\s*','',line[match.end():].strip()).strip()
            if not name and i+1<len(lines):name=lines[i+1]
            active={'rank':rank,'english':name,'moves':{},'abilities':{},'source_url':source}
            section=None;continue
        if not active:continue
        if line.startswith('Moves All'):section='moves';continue
        if line.startswith('Abilities'):section='abilities';continue
        if line.startswith(('Held Items','Stat Alignment','Top Teammates','Stat Points')):section=None;continue
        if section in ('moves','abilities'):
            m=RATE.match(line)
            if not m:continue
            name=strip(m.group(1)); pct=float(m.group(2))
            if section=='moves':
                # typical visible text has type name before percentage; eliminate
                # only the known type suffix and preserve move words.
                name=re.sub(r'\s+(Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy)\s*$','',name)
            if name and 0<=pct<=100:active[section][name]=pct
    if active:records.append(active)
    return records

def visible(html):
    """Normalize common block/inline HTML splits into one logical text row.

    A raw BeautifulSoup.get_text('\n') splits a single move into three
    rows when the move, type and percentage are separate spans. Conversely,
    joining the entire page obscures boundaries. We retain block boundaries,
    joining inline text inside each block.
    """
    soup=BeautifulSoup(html,'html.parser')
    for x in soup(['script','style','noscript','svg']):x.decompose()
    # Preserve explicit newlines in preformatted/browser-exported fixtures.
    for pre in soup.find_all('pre'):
        pre.string=pre.get_text(' ',strip=False)
    # Strip inline elements without introducing artificial newlines.
    block_tags={'article','section','div','p','li','h1','h2','h3','h4','h5','h6','tr','td','th','header','footer'}
    for el in reversed(list(soup.find_all(True))):
        if el.name in block_tags:
            el.insert_before('\n')
            el.insert_after('\n')
    lines=[]
    for line in soup.get_text(' ',strip=False).splitlines():
        norm=strip(line)
        if norm: lines.append(norm)
    return '\n'.join(lines)

def retrieve(url,filename,offline_dir):
    if offline_dir:
        path=Path(offline_dir)/filename
        if not path.is_file():raise FileNotFoundError(f'Offline source missing: {path}')
        return path.read_text(encoding='utf-8')
    req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; documented research collector)'})
    with urlopen(req,timeout=30) as res:
        if res.status!=200:raise RuntimeError(f'{url}: HTTP {res.status}')
        return res.read().decode('utf-8','replace')

def collect(offline_dir=None, pages=6, snapshot=None):
    def page(url,key):
        if snapshot is None:return retrieve(url,key,offline_dir)
        entry=snapshot.get('entries',{}).get(key)
        if not isinstance(entry,dict) or entry.get('url')!=url or not isinstance(entry.get('html'),str):
            raise ValueError(f'Snapshot missing/mismatched source: {key}')
        return entry['html']
    gc=parse_text(visible(page(TOURNAMENT,'tournament.html')),TOURNAMENT)
    if len(gc)!=30 or [r['rank'] for r in gc]!=list(range(1,31)):
        raise ValueError(f'Incomplete tournament top 30: {len(gc)}; refusing success')
    seasons=[]
    for n in range(1,pages+1):
        url=RANKED+(f'?page={n}' if n>1 else '')
        rows=parse_text(visible(page(url,f'season6-{n}.html')),url)
        if len(rows)!=20 or [r['rank'] for r in rows]!=list(range(20*(n-1)+1,20*n+1)):
            raise ValueError(f'Season 6 page {n} incomplete or incorrect rank: {len(rows)}')
        seasons.extend(rows)
        if not offline_dir:time.sleep(.15)
    for row in gc+seasons:
        if not row['english'] or not row['moves'] or not row['abilities']:
            raise ValueError(f'Incomplete fields in rank {row["rank"]}, {row["english"]}')
    # Season 6 #31 is NOT necessarily GC-I #31; do not assign fake ranks.
    gc_set={r['english'] for r in gc}
    possible=[r for r in seasons if r['english'] not in gc_set]
    return {'scope':{'tournament':'GC-I Masters top 30','ranked':'Season 6 M-C Doubles top 120 by ranked position, NOT GC-I positions 31–120'},
            'tournament_top30':gc,'ranked_top120':seasons,
            'ranked_non_tournament_top30_candidates':possible,
            'warnings':['Tournament places 31–120 are NOT published in this dataset. Ranked placement must not be relabelled tournament placement.',
                        'English move/ability names must be mapped to Japanese app keys before integration.'],
            'counts':{'tournament':len(gc),'ranked':len(seasons),'ranked_candidates_outside_tournament_top30':len(possible)}}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--offline-dir',help='Folder with tournament.html and season6-1.html..season6-6.html')
    p.add_argument('--out',default='adoption-source-120.json')
    p.add_argument('--browser-snapshot',help='Seven-page JSON saved by export-stats-browser.js')
    args=p.parse_args()
    try:
        snapshot=None
        if args.browser_snapshot:
            snapshot=json.loads(Path(args.browser_snapshot).read_text(encoding='utf-8'))
            if snapshot.get('schema')!='gc2027ii-site-html-snapshot-v1':raise ValueError('Unexpected browser snapshot schema')
        data=collect(args.offline_dir,snapshot=snapshot)
    except Exception as e:print('COLLECTION INCOMPLETE:',e,file=sys.stderr);return 2
    dest=Path(args.out);dest.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(dir=dest.parent,prefix='.adoption-source-',suffix='.tmp')
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as f:json.dump(data,f,ensure_ascii=False,indent=2);f.write('\n')
        os.replace(tmp,dest)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
    print(json.dumps(data['counts'],ensure_ascii=False));print('Saved:',dest)
    return 0
if __name__=='__main__':sys.exit(main())
