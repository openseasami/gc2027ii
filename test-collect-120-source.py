import importlib.util,unittest,tempfile
from pathlib import Path
p=Path(__file__).with_name('collect-120-source.py')
spec=importlib.util.spec_from_file_location('source120',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Test(unittest.TestCase):
 def test_parse_visible(self):
  s='''#1 use Image: Rillaboom\nRillaboom\nGrass\nMoves All (10) Show less\nGrassy Glide Grass 97.3%\nFake Out Normal 94.8%\nAbilities\nGrassy Surge 99.9%\nOvergrow 0.1%\nHeld Items\nMiracle Seed 60.1%'''
  r=m.parse_text(s,'test');self.assertEqual(len(r),1);self.assertEqual(r[0]['english'],'Rillaboom');self.assertEqual(r[0]['moves']['Grassy Glide'],97.3);self.assertEqual(r[0]['abilities']['Grassy Surge'],99.9);self.assertNotIn('Miracle Seed',r[0]['abilities'])
 def test_realistic_split_html_elements(self):
  html="""<section><h3>#1 <span>use</span> <img alt=\"Rillaboom\"></h3><h4>Rillaboom</h4><h5>Moves All (10) Show less</h5><div>Grassy Glide <span>Grass</span> <span>97.3%</span></div><div>Fake Out <span>Normal</span> <span>94.8%</span></div><h5>Abilities</h5><div>Grassy Surge <span>99.9%</span></div><h5>Held Items</h5><div>Miracle Seed <span>60.1%</span></div></section>"""
  r=m.parse_text(m.visible(html),'html-test')
  self.assertEqual(len(r),1)
  self.assertEqual(r[0]['english'],'Rillaboom')
  self.assertEqual(r[0]['moves'],{'Grassy Glide':97.3,'Fake Out':94.8})
  self.assertEqual(r[0]['abilities'],{'Grassy Surge':99.9})
 def test_not_fabricate_missing_data(self):
  with tempfile.TemporaryDirectory() as d:
   Path(d,'tournament.html').write_text('<h1>Top 30</h1>',encoding='utf8')
   with self.assertRaises(ValueError):m.collect(d)
 def test_complete_120_batch_offline(self):
  with tempfile.TemporaryDirectory() as d:
   def page(start,stop):
    return '<html><body><pre>'+''.join(f'#' +str(i)+' use Image: Pokemon'+str(i)+'\nMoves All (10) Show less\nProtect Normal 90.0%\nAbilities\nPressure 99.0%\nHeld Items\n' for i in range(start,stop+1))+'</pre></body></html>'
   Path(d,'tournament.html').write_text(page(1,30),encoding='utf8')
   for n in range(1,7):Path(d,f'season6-{n}.html').write_text(page((n-1)*20+1,n*20),encoding='utf8')
   result=m.collect(d)
   self.assertEqual(result['counts']['tournament'],30)
   self.assertEqual(result['counts']['ranked'],120)
   self.assertEqual(result['counts']['ranked_candidates_outside_tournament_top30'],90)
   self.assertEqual(result['ranked_top120'][119]['rank'],120)
 def test_duplicate_source_ranks_preserved(self):
  r=m.parse_text('#31 use Image: Raichu\nRaichu\nMoves All (10)\nThunderbolt Electric 56.2%\nAbilities\nStatic 97.0%','ranked')
  self.assertEqual(r[0]['rank'],31);self.assertEqual(r[0]['source_url'],'ranked')
if __name__=='__main__':unittest.main()
