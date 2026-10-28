"""Start the self-contained viewer on loopback only (Python 3, standard library)."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()
    base = Path(__file__).resolve().parent
    root = base if (base / "GC2027II_Viewer_v9.html").is_file() else base / "release"
    if not (root / "GC2027II_Viewer_v9.html").is_file():
        parser.error("GC2027II_Viewer_v9.html was not found. Extract the whole ZIP first.")
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root)))
    except OSError as exc:
        parser.error(f"Cannot start local server: {exc}. Close the previous viewer server and retry.")
    url = f"http://127.0.0.1:{server.server_port}/GC2027II_Viewer_v9.html"
    print(url, flush=True)
    print("Loopback only. No internet needed. Stop with Ctrl+C. Keep the same browser and port for saved teams.", flush=True)
    if not args.no_open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
