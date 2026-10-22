"""Lock user-confirmed HTML/CSS; only script logic and version metadata may change."""
from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent;s=(root/'index.html').read_text();base=json.loads((root/'UI_PRESERVATION_BASELINE.json').read_text())
style='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>',s,re.S));markup=re.sub(r'<script\b[^>]*>.*?</script>','',s,flags=re.S);markup=re.sub(r'v2\.9\.\d+','VERSION',markup)
assert hashlib.sha256(style.encode()).hexdigest()==base['styles'],'User-confirmed CSS changed'
assert hashlib.sha256(markup.encode()).hexdigest()==base['markup'],'User-confirmed UI markup changed'
print('PASS user-confirmed PC UI markup and CSS unchanged (version excluded)')
