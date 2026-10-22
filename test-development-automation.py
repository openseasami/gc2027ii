import importlib.util,json,tempfile,unittest,subprocess,hashlib
from pathlib import Path
spec=importlib.util.spec_from_file_location('automation',Path(__file__).with_name('development-automation.py'));a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  subprocess.run(['git','init','-b','codex-development'],cwd=self.root,check=True,capture_output=True)
  self.put('DEVELOPMENT_AUTOMATION_POLICY.json',{'eventFamilies':{},'capabilities':{'official':False},'dependencies':{'mega':['official']},'maxUnchangedRetries':3})
  self.put('ABILITY_REFERENCE_HOOKS.json',{'entries':[]})
  rows=[]
  for name,cat,rate,status in [('high','abilities',90,'未実装'),('low','abilities',10,'未実装'),('review','moves',None,'要調査'),('blocked','mega',99,'要調査')]:rows.append(dict(name=name,category=cat,effect={'paths':[]},coverage={'classification':status},priority={'classification':'target' if rate else 'unknown','maxObservedPercent':rate}))
  self.put('DEVELOPMENT_BACKLOG.json',{'entries':rows})
  (self.root/'test-fixture.js').write_text('test fixture')
  self.put('MECHANICS_EVIDENCE.json',{'groups':[dict(category='abilities',names=['high','low'],unitTests=['test-fixture.js'],integrationTests=[])]})
  self.report()
 def put(self,name,value):a.save(self.root,name,value)
 def report(self,failed=False):
  self.put('TEST_RESULTS.json',dict(total=1,passed=0 if failed else 1,results=[dict(command=['node','test-fixture.js'],exitCode=1 if failed else 0,stderr='AssertionError: cause',stdout='')],sourceSha256={f:hashlib.sha256((self.root/f).read_bytes()).hexdigest()for f in ['test-fixture.js','MECHANICS_EVIDENCE.json']}))
 def claim(self):
  group=a.plan(self.root,a.state(self.root))[0];self.assertEqual([t['name']for t in group['tasks']],['high','low']);self.assertEqual(a.main(['claim','--group',group['id']],self.root),0);return list(a.state(self.root)['tasks'])
 def evidence(self,ids):return {tid:dict(scope='fixture limited scope',remaining='whole mechanics unverified',tests=['test-fixture.js'])for tid in ids}
 def test_dependency_group_and_adoption(self):
  groups=a.plan(self.root,a.state(self.root));self.assertEqual(len(groups[0]['tasks']),2);self.assertTrue(groups[-1]['blockedBy']);self.assertEqual(a.main(['claim','--group',groups[-1]['id']],self.root),2)
 def test_verified_dedup_and_scope_identity(self):
  ids=self.claim();st=a.state(self.root);self.assertTrue(a.verify(self.root,st,ids,self.evidence(ids)));a.save(self.root,a.STATE,st);self.assertFalse(any(g['id']=='abilities:implement'for g in a.plan(self.root,st)))
  before=a.tasks(self.root)[0]['id'];b=a.read(self.root,'DEVELOPMENT_BACKLOG.json');b['entries'][0]['effect']['candidateSourceLines']=[123];self.put('DEVELOPMENT_BACKLOG.json',b);self.assertEqual(before,a.tasks(self.root)[0]['id']);self.assertFalse(st['completion'])
 def test_failure_retry_and_stale_hash(self):
  ids=self.claim();st=a.state(self.root);self.report(True);self.assertFalse(a.verify(self.root,st,ids,self.evidence(ids)));self.assertEqual(st['tasks'][ids[0]]['status'],'retry-needed');self.assertIn('AssertionError',st['failures'][0]['causes'][0]['stderr'])
  (self.root/'test-fixture.js').write_text('changed')
  with self.assertRaisesRegex(ValueError,'Stale'):a.verify(self.root,st,ids,self.evidence(ids))
 def test_unrelated_evidence_and_branch_guard(self):
  ids=self.claim();st=a.state(self.root);e=self.evidence(ids);e[ids[0]]['tests']=['unrelated.js']
  with self.assertRaisesRegex(ValueError,'registered'):a.verify(self.root,st,ids,e)
  subprocess.run(['git','checkout','-b','main'],cwd=self.root,check=True,capture_output=True)
  with self.assertRaisesRegex(ValueError,'Only codex-development'):a.guard(self.root)
 def test_retry_budget_and_changed_input(self):
  ids=self.claim();st=a.state(self.root)
  for tid in ids:st['tasks'][tid].update(status='retry-needed',attempts=3)
  a.save(self.root,a.STATE,st);self.assertFalse(any(g['id']=='abilities:implement'for g in a.plan(self.root,st)))
  (self.root/'test-fixture.js').write_text('actual correction');self.assertTrue(any(g['id']=='abilities:implement'for g in a.plan(self.root,st)))
  self.assertEqual(a.main(['claim','--group','abilities:implement'],self.root),0);self.assertEqual(a.state(self.root)['tasks'][ids[0]]['attempts'],1)
 def test_cli_failure_then_recovery(self):
  ids=self.claim();self.put('evidence.json',self.evidence(ids));self.report(True)
  self.assertEqual(a.main(['verify','--ids',*ids,'--evidence','evidence.json'],self.root),1)
  self.assertEqual(a.main(['claim','--group','abilities:implement'],self.root),0);self.report()
  self.assertEqual(a.main(['verify','--ids',*ids,'--evidence','evidence.json'],self.root),0)
  self.assertTrue(all(t['status']=='verified-scope' for t in a.state(self.root)['tasks'].values()))
 def test_checkpoint_resume(self):
  ids=self.claim()
  subprocess.run(['git','-c','user.name=Test','-c','user.email=test@example.invalid','commit','--allow-empty','-m','fixture'],cwd=self.root,check=True,capture_output=True)
  self.assertEqual(a.main(['checkpoint','--reason','continue active work'],self.root),0)
  st=a.state(self.root);self.assertEqual(st['checkpoints'][-1]['counts']['in-progress'],2);self.assertTrue(all(st['tasks'][tid]['status']=='in-progress' for tid in ids));self.assertFalse(st['completion'])
 def test_lock_recovery(self):
  (self.root/'.development-automation.lock').write_text('other process')
  self.assertEqual(a.main(['checkpoint'],self.root),2);self.assertTrue((self.root/'.development-automation.lock').exists())
if __name__=='__main__':unittest.main()
