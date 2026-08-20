#!/usr/bin/env python3
"""Serve THE GRIND and proxy live ESPN scoreboards."""

from __future__ import annotations

import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PORT = 4173
SPORTS = {
    "mlb": "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    "nfl": "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "nba": "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "nhl": "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/api/scores":
            self._scores()
            return
        return super().do_GET()

    def _scores(self):
        payload = {}
        for league, url in SPORTS.items():
            try:
                request = Request(url)
                with urlopen(request, timeout=8) as response:
                    payload[league] = json.loads(response.read().decode("utf-8"))
            except Exception as exc:
                payload[league] = {"events": [], "error": str(exc)}
        body = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys_stdout = __import__("sys").stdout
        sys_stdout.write("%s - %s\n" % (self.address_string(), fmt % args))
        sys_stdout.flush()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"THE GRIND running at http://127.0.0.1:{PORT}")
    server.serve_forever()
