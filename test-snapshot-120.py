import json,unittest
from pathlib import Path
P=Path(__file__).resolve().parent
class BatchVerification(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=json.loads((P/'ADOPTION_120_NORMALIZED.json').read_text(encoding='utf8'))
  cls.policy=json.loads((P/'PRIORITY_POLICY.json').read_text(encoding='utf8'))
  cls.species=cls.data['species']
 def test_exact_species_count(self):self.assertEqual(len(self.species),120)
 def test_unique_codes_and_names(self):
  self.assertEqual(len({x['code'] for x in self.species}),120)
  self.assertEqual(len({x['name'] for x in self.species}),120)
 def test_exact_primary_split(self):
  self.assertEqual(sum(x['source']=='tournament' for x in self.species),30)
  self.assertEqual(sum(x['source']=='ranked-season6' for x in self.species),90)
 def test_primary_order(self):self.assertEqual([x['verifiedTournamentRank'] for x in self.species[:30]],list(range(1,31)))
 def test_fallback_rank_undisguised(self):
  for x in self.species[30:]:
   self.assertIsNone(x['verifiedTournamentRank'])
   self.assertIsInstance(x['rankedSeasonRank'],int)
 def test_observation_counts(self):
  self.assertEqual(sum(len(x['moves']) for x in self.species),1200)
  self.assertEqual(sum(len(x['abilities']) for x in self.species),291)
 def test_policy_consistent(self):
  self.assertEqual(len(self.policy['records']),120)
  for x in self.species:
   self.assertEqual(self.policy['records'][x['name']]['moves'],x['moves'])
   self.assertEqual(self.policy['records'][x['name']]['abilities'],x['abilities'])
 def test_numeric_boundaries_and_sources(self):
  for x in self.species:
   for k in ('moves','abilities'):
    self.assertTrue(all(0 <= v <= 100 for v in x[k].values()))
   self.assertTrue(x['url'].startswith('https://www.pokemon-zone.com/champions/'))
if __name__=='__main__':unittest.main()
