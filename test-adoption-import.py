import csv,importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).parent
spec=importlib.util.spec_from_file_location('imp',ROOT/'import-adoption-batch.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class TestImport(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.dir=Path(self.tmp.name)
  self.source={'event':'EVENT','url':'https://example.org/stats'}
  self.policy=self.dir/'policy.json';self.policy.write_text(json.dumps({'primarySource':self.source,'records':{'既存':{'english':'Old','moves':{'技':11},'abilities':{}}}}),encoding='utf8')
 def write(self,rows):
  p=self.dir/'data.csv'
  with p.open('w',newline='',encoding='utf8') as f:
   w=csv.DictWriter(f,fieldnames=['species','english','kind','name','rate','source_url','event']);w.writeheader();w.writerows(rows)
  return p
 def row(self,**kwargs):return dict(species='新規',english='New',kind='move',name='技A',rate='10',source_url=self.source['url'],event=self.source['event'],**kwargs)
 def test_valid_batch_and_threshold(self):
  p=self.write([self.row(),dict(species='新規',english='New',kind='ability',name='特性A',rate='7.1',source_url=self.source['url'],event=self.source['event'])]);out,stats=mod.prepare(p,self.policy);self.assertEqual(stats['speciesWithAnyData'],2);self.assertEqual(stats['newObservations'],2)
 def test_source_rejected(self):
  r=self.row();r['source_url']='https://wrong.example';p=self.write([r]);self.assertRaises(ValueError,mod.prepare,p,self.policy)
 def test_duplicate_rejected(self):
  r=self.row();p=self.write([r,r]);self.assertRaises(ValueError,mod.prepare,p,self.policy)
 def test_conflict_rejected(self):
  r=self.row();r.update(species='既存',english='Old',name='技',rate='12');p=self.write([r]);self.assertRaises(ValueError,mod.prepare,p,self.policy)
 def test_bad_rate_rejected(self):
  r=self.row();r['rate']='101';p=self.write([r]);self.assertRaises(ValueError,mod.prepare,p,self.policy)
if __name__=='__main__':unittest.main()
