import csv,importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).parent
spec=importlib.util.spec_from_file_location('mixed',ROOT/'import-adoption-mixed.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class MixedTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);d=Path(self.tmp.name);self.d=d
  self.p=d/'policy.json';self.p.write_text(json.dumps({'primarySource':{'event':'GC','url':m.TOURNAMENT},'records':{'上位':{'english':'Top','moves':{'技':20},'abilities':{}}}},ensure_ascii=False))
  self.man=d/'ranks.json';self.man.write_text(json.dumps({'上位':{'rank':1,'source_url':m.TOURNAMENT},'下位':{'rank':31,'source_url':m.TOURNAMENT}},ensure_ascii=False))
 def row(self,s='下位',src=None,event=None):return {'species':s,'english':'Other' if s=='下位' else 'Top','kind':'move','name':'技2','rate':'20','source_url':src or m.RANKED,'event':event or m.RANKED_EVENT}
 def runrows(self,rows,manifest=None):
  csvp=self.d/'in.csv'
  with csvp.open('w',newline='') as f:
   w=csv.DictWriter(f,fieldnames=list(self.row()));w.writeheader();w.writerows(rows)
  return m.prepare(csvp,self.p,manifest or self.man)
 def test_fallback_31(self):
  data,stats=self.runrows([self.row()]);self.assertEqual(stats['rankedObservations'],1);self.assertEqual(data['observationSources']['下位']['move']['技2'],m.RANKED)
 def test_top30_reject_ranked(self):self.assertRaises(ValueError,self.runrows,[self.row('上位')])
 def test_top30_accept_tournament(self):
  data,stats=self.runrows([self.row('上位',m.TOURNAMENT,'GC')]);self.assertEqual(stats['tournamentObservations'],1)
 def test_wrong_ranked_source(self):self.assertRaises(ValueError,self.runrows,[self.row(src='https://example.org/bad')])
 def test_unknown_rank_rejected(self):self.assertRaises(ValueError,self.runrows,[self.row('未知')])
 def test_duplicate_rows_rejected(self):self.assertRaises(ValueError,self.runrows,[self.row(),self.row()])
 def test_rank_manifest_evidence_required(self):
  self.man.write_text(json.dumps({'下位':{'rank':31,'source_url':'fake'}}));self.assertRaises(ValueError,self.runrows,[self.row()])
 def test_preserve_existing_tournament(self):
  r=self.row('上位',m.TOURNAMENT,'GC');r['name']='技';r['rate']='21';self.assertRaises(ValueError,self.runrows,[r])
if __name__=='__main__':unittest.main()
