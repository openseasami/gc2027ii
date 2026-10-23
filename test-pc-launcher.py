"""Verify the actual shipped local launcher serves the trial and engines."""
import subprocess,sys,time,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parent
process=subprocess.Popen([sys.executable,'launch-pc-trial.py'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(50):
  assert process.poll() is None,'Local launcher exited (possibly port 8765 occupied)'
  try:
   with urllib.request.urlopen('http://127.0.0.1:8765/index.html',timeout=1) as response:html=response.read().decode()
   break
  except OSError:time.sleep(.1)
 else:raise AssertionError('Local launcher did not start')
 assert 'v2.9.14' in html
 with urllib.request.urlopen('http://127.0.0.1:8765/critical-effects.js',timeout=1) as response:assert 'CriticalEffects' in response.read().decode()
 print('PASS shipped Python launcher serves trial and external engine at stable localhost origin')
finally:process.terminate();process.wait(timeout=5)
