import unittest,tempfile,json
from pathlib import Path
import importlib.util
s=importlib.util.spec_from_file_location('collector','collect-120-source.py');mod=importlib.util.module_from_spec(s);s.loader.exec_module(mod)
class BrowserSnapshotTests(unittest.TestCase):
 def test_invalid_snapshot_prevents_partial_results(self):
  with self.assertRaises(ValueError):mod.collect(snapshot={'entries':{}},pages=1)
 def test_valid_source_fields_are_checked(self):
  with self.assertRaisesRegex(ValueError,'mismatched source'):
   mod.collect(snapshot={'entries':{'tournament.html':{'url':'https://wrong','html':'fake'}}},pages=1)
 def test_browser_script_has_seven_pages_and_same_origin_guard(self):
  text=Path('export-stats-browser.js').read_text()
  self.assertIn('Array.from({length:6}',text)
  self.assertIn('location.hostname',text)
  self.assertIn('if (!r.ok)',text)
if __name__=='__main__':unittest.main()
