import json,unittest
from pathlib import Path
P=Path(__file__).resolve().parent
class NormalizationTests(unittest.TestCase):
 def test_preservation(self):
  orig=json.loads((P/'ADOPTION_120_VERIFIED.json').read_text());norm=json.loads((P/'ADOPTION_120_NORMALIZED.json').read_text());
  self.assertEqual(len(orig['species']),120)
  for a,b in zip(orig['species'],norm['species']):
   for k in ('name','english','code','source','url','selectionRank','verifiedTournamentRank','rankedSeasonRank'):
    self.assertEqual(a[k],b[k])
   for k in ('moves','abilities'):
    self.assertEqual(sorted(a[k].values()),sorted(b[k].values()))
 def test_threshold_names_and_policy(self):
  data=json.loads((P/'ADOPTION_120_NORMALIZED.json').read_text());policy=json.loads((P/'PRIORITY_POLICY.json').read_text());
  for s in data['species']:
   self.assertEqual(policy['records'][s['name']]['moves'],s['moves'])
   self.assertEqual(policy['records'][s['name']]['abilities'],s['abilities'])
   for name,v in s['moves'].items():
    if v>=10:self.assertFalse(name.isascii(),name)
   for name,v in s['abilities'].items():
    if v>7:self.assertFalse(name.isascii(),name)
 def test_coverage(self):
  d=json.loads((P/'ADOPTION_120_EFFECT_AUDIT.json').read_text());self.assertEqual((d['uniqueQualifyingMoves'],d['uniqueQualifyingAbilities']),(252,112));self.assertEqual(d['missingMoveMetadata'],[]);self.assertEqual(d['missingAbilityMetadata'],[])
if __name__=='__main__':unittest.main()
