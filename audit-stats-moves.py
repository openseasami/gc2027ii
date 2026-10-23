"""Compare actual loaded app tables with immutable external species/move snapshots."""
from pathlib import Path
from hashlib import sha256
import json,csv,re,sys,unicodedata
ROOT=Path(__file__).resolve().parent;REF=ROOT/'reference-data/stats-moves'
KEYS=['hp','atk','def','spa','spd','spe']
def read(path):return json.loads(path.read_text())
def audit(rt,differential):
 provenance=read(REF/'PROVENANCE.json')
 for n,p in provenance['files'].items():
  if sha256((REF/n).read_bytes()).hexdigest()!=p['savedSha256']:raise ValueError('Reference snapshot changed: '+n)
 ext=read(REF/'showdown-normalized.json');identities=read(REF/'pokeapi-identity-map.json');pokeStats={}
 for r in csv.DictReader((REF/'pokemon_stats.csv').open()):pokeStats.setdefault(int(r['pokemon_id']),{})[KEYS[int(r['stat_id'])-1]]=int(r['base_stat'])
 norm=lambda s:re.sub('[^a-z0-9]','',s.lower())
 pokeMoves={norm(r['identifier']):r for r in csv.DictReader((REF/'moves.csv').open())};types={1:'ノーマル',2:'かくとう',3:'ひこう',4:'どく',5:'じめん',6:'いわ',7:'むし',8:'ゴースト',9:'はがね',10:'ほのお',11:'みず',12:'くさ',13:'でんき',14:'エスパー',15:'こおり',16:'ドラゴン',17:'あく',18:'フェアリー'}
 pendingPath=ROOT/'PENDING_TWENTY_AUDIT_RESULTS.json';pending=read(pendingPath) if pendingPath.exists() else {}
 pendingValid=pending.get('sourceSha256')==sha256((ROOT/'index.html').read_bytes()).hexdigest() and pending.get('differential',{}).get('failureCount')==0 and bool(pending.get('evidenceSha256')) and all((ROOT/f).is_file() and sha256((ROOT/f).read_bytes()).hexdigest()==h for f,h in pending.get('evidenceSha256',{}).items())
 pendingRecords={m['name']:m for m in pending.get('moves',[]) if pendingValid}
 pendingMoves={n:m for n,m in pendingRecords.items() if m['calculationStatus']=='verified-scoped' and m.get('independentCalculationEvidence',{}).get('damageComparisons',0)>0}
 verified=lambda m:m['basicCalculation'] in ['verified-in-explicit-matrix','verified-scoped-pending-twenty']
 errors=[];species=[]
 for name,row in rt['national'].items():
  source=ext['species'].get(row['id']);identity=identities.get(row['id']);ps=source and source['stats'];p=identity and pokeStats.get(identity['pokemonId'])
  actuals={'national':row['stats']}
  if name in rt['regulation']:actuals['regulation']=rt['regulation'][name]['stats']
  if name in rt['battle']:actuals['runtime']=rt['battle'][name]
  for path,actual in actuals.items():
   if not ps or actual!=ps:errors.append({'species':name,'path':path,'actual':actual,'showdown':ps})
   if p and actual!=p:errors.append({'species':name,'path':path,'actual':actual,'pokeapi':p})
  species.append({'name':name,'id':row['id'],'target':name in rt['selectable'],'mega':bool(row.get('mega')),'actual':row['stats'],'runtime':rt['battle'].get(name),'showdown':ps,'pokeapi':p,'pokeapiIdentity':identity,'status':'two-sources-match' if p==ps==row['stats'] else 'second-source-unconfirmed' if ps==row['stats'] and not p else 'mismatch'})
 namesById={d['id']:n for n,d in rt['moves'].items()};aliases={unicodedata.normalize('NFKC',n):n for n in rt['runtimeMoves']};occ={}
 for mon in read(ROOT/'ADOPTION_120_NORMALIZED.json')['species']:
  for name,rate in mon['moves'].items():
   key=unicodedata.normalize('NFKC',name);key=key if key in rt['moves'] else namesById.get(norm(name))
   if key is None:errors.append({'unresolvedMove':name,'species':mon['name']});continue
   if rt['moves'][key]['cat']=='status':continue
   occ.setdefault(key,[]).append({'species':mon['name'],'adoptionRate':rate})
 moves=[]
 for name,users in occ.items():
  n=rt['moves'][name];source=ext['moves'].get(n['id']);p=pokeMoves.get(n['id']);general=source['general'];champ=source['champions'];key=aliases.get(unicodedata.normalize('NFKC',name));runtime=rt['runtimeMoves'].get(key)
  for k in ['power','type','cat','accuracy']:
   if n[k]!=general[k]:errors.append({'move':name,'path':'national','field':k,'actual':n[k],'expected':general[k]})
  if p:
   pmeta={'power':int(p['power']) if p['power'] else 0,'type':types[int(p['type_id'])],'cat':{'1':'status','2':'phys','3':'spec'}[p['damage_class_id']],'accuracy':int(p['accuracy'])/100 if p['accuracy'] else 1}
   for k in pmeta:
    if pmeta[k]!=general[k]:errors.append({'move':name,'path':'external-source-conflict','field':k,'pokeapi':pmeta[k],'showdown':general[k]})
  else:errors.append({'move':name,'missingPokeapiMetadata':True})
  if runtime:
   for k in ['type','cat']:
    if runtime[k]!=champ[k]:errors.append({'move':name,'path':'runtime','field':k})
   if not runtime.get('catalogOnly') and not champ['variable'] and not champ.get('multihit') and runtime['power']!=champ['power']:errors.append({'move':name,'path':'runtime','field':'power','actual':runtime['power'],'expected':champ['power']})
   if rt['accuracy'].get(key)!=champ['accuracy']:errors.append({'move':name,'path':'runtime','field':'accuracy'})
  primary=any(u['adoptionRate']>=10 for u in users);tested=differential['byMove'].get(name)
  moves.append({'name':name,'id':n['id'],'major':primary,'users':users,'catalogMetadata':'verified-against-general-sources','championsMetadata':champ,'generalMetadata':general,'runtimeKey':key,'runtimeMetadata':runtime,'accuracy':rt['accuracy'].get(key),'differenceFromGeneralIsChampionsOverride':{k:[general[k],champ[k]] for k in ['power','type','cat','accuracy'] if general[k]!=champ[k]},'pendingTwentyEvidence':pendingRecords.get(name),'basicCalculation':'verified-in-explicit-matrix' if tested and not tested['failures'] else 'verified-scoped-pending-twenty' if name in pendingMoves else 'not-verified-in-this-matrix','differential':tested,'unverifiedReason':None if tested or name in pendingMoves else pendingRecords[name]['remaining'] if name in pendingRecords else 'Special/variable or multihit total calculation is unimplemented or outside this single-hit audit; not counted as verified.' if primary else 'Below 10% recorded adoption; metadata audited, calculation not in primary matrix'})
 target=[s for s in species if s['target']];major=[m for m in moves if m['major']];unknown=[s for s in species if s['status']!='two-sources-match']
 return dict(completion=False,scopeCompletion=dict(speciesTargetTwoSourceAudit=not errors and all(s['status']=='two-sources-match' for s in target),majorMoveData=not errors,majorMoveCalculationAllVerified=not errors and all(verified(m) for m in major)),sourceSha256=sha256((ROOT/'index.html').read_bytes()).hexdigest(),referenceProvenance='reference-data/stats-moves/PROVENANCE.json',speciesSummary=dict(targets=len(target),targetVerified=sum(s['status']=='two-sources-match' for s in target),targetUnconfirmed=sum(s['status']!='two-sources-match' for s in target),targetMega=sum(s['mega'] for s in target),targetStatValues=len(target)*6,catalog=len(species),catalogTwoSourceVerified=len(species)-len(unknown),catalogSecondSourceUnconfirmed=len(unknown),catalogShowdownMatched=sum(s['actual']==s['showdown'] for s in species),catalogMega=sum(s['mega'] for s in species),megaTwoSourceVerified=sum(s['mega'] and s['status']=='two-sources-match' for s in species),placeholderExcluded=['その他']),moveSummary=dict(adoptionProfiles=120,recordedAttackMoves=len(moves),metadataVerified=len(moves) if not errors else None,majorAttackMoves=len(major),majorCalculationVerified=sum(verified(m) for m in major),majorCalculationUnverified=sum(not verified(m) for m in major),majorThreshold='At least one stored adoption-120 profile records >=10%; all recorded attacks also receive metadata audit.'),errors=errors,unconfirmedSpecies=[{'name':s['name'],'id':s['id'],'reason':'PokeAPI does not identify this distinct battle/form state; Showdown-only match, not guessed.'} for s in unknown],unverifiedMajorMoves=[m['name'] for m in major if not verified(m)],species=species,moves=moves,differential=differential,limitations=['Community reference consistency is not official C/M-C eligibility or Champions-specific species/AP certification.','Secondaries and action recommendation completeness are excluded from these two requested gates.','Verified damage/accuracy means the explicitly enumerated successful single-hit conditions only.'])
if __name__=='__main__':
 data=json.load(sys.stdin);report=audit(data['runtime'],data['differential']);(ROOT/'STATS_MOVES_AUDIT_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['scopeCompletion','speciesSummary','moveSummary','errors']},ensure_ascii=False,indent=2));raise SystemExit(bool(report['errors'] or report['differential']['failureCount']))
