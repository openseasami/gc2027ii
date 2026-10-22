"""Fail-closed reporting: successful local checks never imply tournament certification."""
import importlib.util,json,tempfile,unittest,hashlib,contextlib,io
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('practical',Path(__file__).with_name('evaluate-tournament-practical.py'));app=importlib.util.module_from_spec(spec);spec.loader.exec_module(app)
class Gates(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.old=app.ROOT;app.ROOT=self.root;self.addCleanup(setattr,app,'ROOT',self.old)
  gates=json.loads(Path(__file__).with_name('TOURNAMENT_PRACTICAL_GATES.json').read_text());self.put('TOURNAMENT_PRACTICAL_GATES.json',gates)
  self.put('data.json',{'fixture':True});h=hashlib.sha256((self.root/'data.json').read_bytes()).hexdigest()
  self.put('DEVELOPMENT_ITERATION.json',{'preservedDataSha256':{'data.json':h}})
  (self.root/'index.html').write_text('fixture')
  commands=gates['requiredCommands'];self.put('TEST_RESULTS.json',{'total':len(commands),'passed':len(commands),'results':[{'command':[c],'exitCode':0}for c in commands],'sourceSha256':{'data.json':h}})
  self.put('ADOPTION_120_NORMALIZED.json',{'species':[{}]*120})
  self.put('TOURNAMENT_SPEED_DIFFERENTIAL_RESULTS.json',dict(profiles=120,cases=40320,failures=[]));self.put('TOURNAMENT_DAMAGE_DIFFERENTIAL_RESULTS.json',dict(cases=331776,failures=[]));self.put('CRITICAL_DIFFERENTIAL_RESULTS.json',dict(rateCases=432,damageCases=1152,failures=[]));self.put('TOURNAMENT_BROWSER_RESULTS.json',dict(passed=True,refreshSamplesMs=[500]*18,maxRefreshMs=500,errors=[]));self.put('FULL_MATCH_E2E_RESULTS.json',dict(passed=True,undoReplay=True,reload=True,opponentPokemon=4))
  self.put('PRIORITY_BERRY_DIFFERENTIAL_RESULTS.json',dict(cases=16384,failures=[]));self.put('PRIORITY_BERRY_BROWSER_RESULTS.json',dict(passed=True,errors=[]))
  for n in ['IMPLEMENTATION_LEDGER.json','DEVELOPMENT_BACKLOG.json']:self.put(n,{'completion':False})
 def put(self,n,x):(self.root/n).write_text(json.dumps(x))
 def run_gate(self):
  with patch.object(app.subprocess,'check_output',side_effect=lambda args,**kw:'codex-development\n' if 'branch' in args else 'fixture-commit\n'),contextlib.redirect_stdout(io.StringIO()):return app.evaluate()
 def test_local_pass_never_certifies_tournament(self):
  self.assertTrue(self.run_gate());r=json.loads((self.root/'TOURNAMENT_PRACTICAL_RESULTS.json').read_text());self.assertFalse(r['completion']);self.assertFalse(r['tournamentAccepted']);self.assertTrue(r['pending'])
 def test_stale_sources_fail(self):
  (self.root/'data.json').write_text('changed');self.assertFalse(self.run_gate())
 def test_browser_and_missing_required_evidence_fail(self):
  self.put('TOURNAMENT_BROWSER_RESULTS.json',dict(passed=False,refreshSamplesMs=[5100]*18,errors=['runtime error']));self.assertFalse(self.run_gate())
  r=json.loads((self.root/'TEST_RESULTS.json').read_text());r['results']=r['results'][1:];r['total']=r['passed']=len(r['results']);self.put('TEST_RESULTS.json',r);self.assertFalse(self.run_gate())
 def test_catalog_or_false_completion_cannot_pass(self):
  self.put('IMPLEMENTATION_LEDGER.json',{'completion':True});self.assertFalse(self.run_gate())
if __name__=='__main__':unittest.main()
