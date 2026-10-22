"""Serve this extracted trial locally at a stable origin; never expose it to the network."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Timer
import webbrowser

def main():
 root=Path(__file__).resolve().parent
 try:server=ThreadingHTTPServer(('127.0.0.1',8765),partial(SimpleHTTPRequestHandler,directory=str(root)))
 except OSError as error:
  print('Cannot start http://127.0.0.1:8765 :',error)
  print('Close the previous trial server, then retry. Keep this port for saved data.');return 1
 print('PC trial: http://127.0.0.1:8765/index.html  (Ctrl+C to stop)')
 Timer(.5,lambda:webbrowser.open('http://127.0.0.1:8765/index.html')).start()
 try:server.serve_forever()
 except KeyboardInterrupt:pass
 finally:server.server_close()
 return 0
if __name__=='__main__':raise SystemExit(main())
