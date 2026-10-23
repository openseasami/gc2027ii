"""Lock user-confirmed HTML/CSS; allow only the exact reviewed v2.9.16 summary addition."""
from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent;s=(root/'index.html').read_text();base=json.loads((root/'UI_PRESERVATION_BASELINE.json').read_text())
style='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>',s,re.S));markup=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S);markup=re.sub(r'v2\.9\.\d+','VERSION',markup)
amendment=base['operationAmendment']
assert amendment['version']=='v2.9.16' and amendment['baseCommit']=='3e85b0506e0bb36249150eb8df480d709b2c4cd1'
css=amendment['addedCss'];addition=amendment['addedMarkup']
assert style.count(css)==1 and markup.count(addition)==1
# Only these exact reviewed additions may differ; the original layout stays locked.
style=style.replace(css,'')
markup=markup.replace(re.sub(r'v2\.9\.\d+','VERSION',css),'').replace(addition,'')
assert hashlib.sha256(style.encode()).hexdigest()==base['styles'],'User-confirmed CSS changed'
assert hashlib.sha256(markup.encode()).hexdigest()==base['markup'],'User-confirmed UI markup changed'
print('PASS user-confirmed PC UI original markup/CSS preserved except exact authorized v2.9.16 rail summary')
