#!/usr/bin/env python3
"""Apply translated profile names without changing rates, ranks or provenance; compare static catalog only."""
import json,re
from pathlib import Path
P=Path(__file__).resolve().parent
read=lambda n:json.loads((P/n).read_text(encoding='utf8'))
profile=read('ADOPTION_120_NORMALIZED.json')
base=read('ADOPTION_120_VERIFIED.json')
policy=read('PRIORITY_POLICY.json')
assert len(profile['species'])==len(base['species'])==len(policy['records'])==120
assert len({s['name'] for s in profile['species']})==120
html=(P/'index.html').read_text(encoding='utf8')
# Exact catalog key only; this is catalog presence, NOT move effect correctness.
m=re.search(r'^const NATIONAL_MOVES=(\{.*?\});$',html,re.M)
assert m
catalog=set(re.findall(r'"([^"\\]+)"\s*:',m.group(1)))
# fallback: JS object could be JSON-valid, use parse if possible
try:catalog=set(json.loads(m.group(1)))
except Exception:pass
updated=0; move_targets=[];ability_targets=[];bad=[]
for new,old in zip(profile['species'],base['species']):
 assert (new['name'],new['english'],new['source'],new['url'])==(old['name'],old['english'],old['source'],old['url'])
 assert sorted(new['moves'].values())==sorted(old['moves'].values())
 assert sorted(new['abilities'].values())==sorted(old['abilities'].values())
 rec=policy['records'][new['name']]
 if rec['moves']!=new['moves'] or rec['abilities']!=new['abilities']:updated+=1
 rec['moves']=new['moves'];rec['abilities']=new['abilities']
 for name,rate in new['moves'].items():
  if rate>=10:move_targets.append(name)
 for name,rate in new['abilities'].items():
  if rate>7:ability_targets.append(name)
policy['dataCoverage']['nameNormalization']='Japanese localized names for all qualifying moves and abilities; some low-usage English labels may remain'
policy['dataCoverage']['namingVersion']='adoption-name-normalizer-v1'
(P/'PRIORITY_POLICY.json').write_text(json.dumps(policy,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
move_unique=sorted(set(move_targets)); ability_unique=sorted(set(ability_targets))
report={'species':120,'updatedProfiles':updated,'targetMoveRows':len(move_targets),'targetAbilityRows':len(ability_targets),'targetUniqueMoves':len(move_unique),'targetUniqueAbilities':len(ability_unique),'untranslatedTargetMoves':[x for x in move_unique if x.isascii()],'untranslatedTargetAbilities':[x for x in ability_unique if x.isascii()],'catalogMoveNamesFound':len([x for x in move_unique if x in catalog]),'catalogMoveNamesMissing':[x for x in move_unique if x not in catalog],'basis':'Static name/catalog audit only; move/ability effect correctness and live UI wiring NOT certified','source':'ADOPTION_120_VERIFIED.json'}
assert not report['untranslatedTargetMoves'] and not report['untranslatedTargetAbilities']
(P/'ADOPTION_120_IMPLEMENTATION_GAP.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if not isinstance(v,list)},ensure_ascii=False,indent=2))
