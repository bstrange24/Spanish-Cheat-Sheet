#!/usr/bin/env python3
"""
Local web server for Spanish pronunciation (natural neural voices).

- Serves pronunciation_player.html
- /api/tts?text=...&lang=es-419  → high-quality MP3 (edge-tts)

VS Code Markdown preview can open http://127.0.0.1 links (file:// is blocked).

Usage (from project root) — leave running while you study:
  python scripts/start_player_server.py
"""

from __future__ import annotations

import asyncio
import hashlib
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
PORT = 8765
HOST = "127.0.0.1"
CACHE = ROOT / "data" / "tts_cache"
CACHE.mkdir(parents=True, exist_ok=True)

# Natural neural voices (Microsoft Edge TTS — free, high quality)
VOICES = {
    "es-419": "es-MX-DaliaNeural",  # Latin America (Mexico) — default
    "es-mx": "es-MX-DaliaNeural",
    "es-us": "es-US-PalomaNeural",
    "es": "es-ES-ElviraNeural",  # Spain
    "es-es": "es-ES-ElviraNeural",
}
# Male alternatives (optional later): es-MX-JorgeNeural, es-ES-AlvaroNeural


def pick_voice(lang: str) -> str:
    key = (lang or "es-419").lower().strip()
    return VOICES.get(key, VOICES["es-419"])


def cache_path(text: str, voice: str) -> Path:
    h = hashlib.sha1(f"{voice}\n{text}".encode("utf-8")).hexdigest()
    return CACHE / f"{h}.mp3"


async def synthesize(text: str, voice: str, out: Path) -> None:
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out))


def make_tts(text: str, lang: str) -> Path:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        raise ValueError("empty text")
    if len(text) > 500:
        text = text[:500]
    voice = pick_voice(lang)
    path = cache_path(text, voice)
    if path.exists() and path.stat().st_size > 0:
        return path
    asyncio.run(synthesize(text, voice, path))
    return path


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path in ("/api/tts", "/tts"):
            self._handle_tts(parsed)
            return
        if parsed.path in ("/", "/index.html"):
            self.path = "/pronunciation_player.html"
        return super().do_GET()

    def _handle_tts(self, parsed) -> None:
        qs = parse_qs(parsed.query)
        text = unquote((qs.get("text") or qs.get("q") or [""])[0])
        lang = (qs.get("lang") or qs.get("tl") or ["es-419"])[0]
        try:
            mp3 = make_tts(text, lang)
        except Exception as e:
            body = f"TTS error: {e}".encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        data = mp3.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    ThreadingHTTPServer.allow_reuse_address = True
    with ThreadingHTTPServer((HOST, PORT), Handler) as httpd:
        print("=" * 60)
        print("Spanish pronunciation server (natural neural voices)")
        print(f"  Player:  http://{HOST}:{PORT}/pronunciation_player.html")
        print(f"  API:     http://{HOST}:{PORT}/api/tts?text=hola&lang=es-419")
        print(f"  Root:    {ROOT}")
        print(f"  Cache:   {CACHE}")
        print("Leave this window open while studying.")
        print("Click words in the Markdown preview (they open in a new browser tab).")
        print("Press Ctrl+C to stop.")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
