"""Reproduce the M-C roster comparison offline from dated factual site extracts."""
from pathlib import Path
import json,csv,io

ROOT=Path(__file__).resolve().parent.parent
REF=ROOT/'reference/mc-roster'
def read(p):return json.loads(p.read_text())
baseline=read(ROOT/'work/mc-sources/previous-data.json') if (ROOT/'work/mc-sources/previous-data.json').exists() else None
# The original candidate identities are retained as factual audit input, not runtime eligibility.
candidate_path=REF/'original-candidates.json'
if not candidate_path.exists():
    assert baseline is not None
    candidate_path.write_text(json.dumps([{k:s[k] for k in ['id','name','jp','num','baseId','isMega','battleOnly','cosmeticIdentity']} for s in baseline['species']],ensure_ascii=False,indent=2)+'\n')
candidates=read(candidate_path)
byid={s['id']:s for s in candidates}
facts={k:read(REF/(k+'.json')) for k in ['pokewiki','bulbapedia','serebii']}
supplements={r['id']:r for r in read(REF/'form-supplements.json')}
entries=[]
aliases={}
appearance=[s for s in candidates if s['cosmeticIdentity'] or s['id'] in ['vivillonfancy','vivillonpokeball']]
for s in appearance:
    aliases[s['id']]='vivillon' if s['num']==666 else 'alcremie'
for s in candidates:
    exact=[];family=[]
    for site,rows in facts.items():
        for row in rows:
            if row.get('id')==s['id']:exact.append(dict(site=site,line=row['line'],name=row['name'],match='explicit-form' if site!='serebii' else 'name-entry'))
        # Family confirmation is separate from exact form evidence.
        members=[r for r in rows if (r.get('id') in byid and byid[r['id']]['num']==s['num'] and not byid[r['id']]['isMega']) or (site=='serebii' and r.get('num')==s['num'] and not r['name'].startswith('Mega '))]
        if members:family.append(site)
    extra=supplements.get(s['id'])
    original=s['baseId'] if s['battleOnly'] and not s['isMega'] else s['id']
    if s['id'] in aliases:
        decision='appearance-consolidated';reason='Same calculation inputs represented by a canonical appearance; not declared illegal'
    elif not family:
        decision='excluded-no-roster-evidence';reason='Base species absent from the compared M-C/available rosters; engine-only battle form is insufficient'
    elif len({r['site'] for r in exact})>=2:
        decision='included';reason='Explicit entries corroborated across roster sites'
    elif exact and len(set(family))>=2:
        decision='included';reason='One explicit form entry plus independent eligible-family corroboration; source grouping differs'
    elif extra and len(set(family))>=2:
        decision='included';reason='Explicit Champions form supplement plus independently corroborated eligible family'
    else:
        decision='excluded-unresolved';reason='Insufficient form evidence'
    entries.append(dict(id=s['id'],jp=s['jp'],num=s['num'],decision=decision,kind='mega-form' if s['isMega'] else 'battle-reference' if s['battleOnly'] else 'entry-form',exactEvidence=exact,familyEvidence=family,formSupplement=extra,reason=reason,officialCertified=False))
included=[r for r in entries if r['decision']=='included']
report=dict(completion=False,scopeCompleted=True,dateJST='2026-10-29',basis='Non-official sources under revised user acceptance criteria',counts=dict(previous=len(entries),included=len(included),species=len({r['num'] for r in included}),mega=sum(r['kind']=='mega-form' for r in included),battleReferences=sum(r['kind']=='battle-reference' for r in included),entryForms=sum(r['kind']=='entry-form' for r in included),appearanceConsolidated=len(aliases),excludedNoEvidence=sum(r['decision']=='excluded-no-roster-evidence' for r in entries),unresolved=sum(r['decision']=='excluded-unresolved' for r in entries)),aliases=aliases,entries=entries,notes=['Exact form membership and family-level grouping are not counted as equivalent evidence','Bulbapedia omits Kingambit; Japanese wiki and Serebii include it, so it is retained','Serebii uses one Mega Meowstic heading; Japanese wiki and the explicit RotomLabs female page support both sex records','No official permission or real-game numerical certification is asserted; both are outside revised acceptance'])
assert report['counts']['unresolved']==0
(ROOT/'reference/MC_ROSTER_AUDIT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
out=io.StringIO(newline='');writer=csv.writer(out)
writer.writerow(['図鑑番号','名称','形態ID','区分','形態掲載サイト','元種族掲載サイト','形態補足URL','基準'])
for r in included:
    writer.writerow([r['num'],r['jp'],r['id'],r['kind'],' / '.join(sorted({e['site'] for e in r['exactEvidence']})),' / '.join(r['familyEvidence']),r['formSupplement']['url'] if r['formSupplement'] else '',report['basis']])
(ROOT/'reference/MC_ROSTER.csv').write_text(out.getvalue(),encoding='utf-8-sig',newline='')
print(json.dumps(report['counts'],ensure_ascii=False))
