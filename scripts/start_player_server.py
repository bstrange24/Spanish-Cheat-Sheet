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
import json
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import parse_qs, unquote, urlparse
from urllib.request import Request, urlopen

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

CHAT_MODEL = "gpt-4o-mini"
CHAT_SYSTEM_PROMPT = (
    "You are a warm, patient Spanish conversation tutor chatting with a learner. "
    "Reply mostly in natural, everyday Spanish appropriate to the learner's apparent level. "
    "If the learner's Spanish has a mistake, briefly correct it in a short English aside in "
    "parentheses, then continue the conversation in Spanish. Keep replies short (1-3 sentences) "
    "and ask a follow-up question to keep the conversation going."
)


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


def call_openai_chat(user_message: str, history: list) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set (set it in this terminal before starting the server)"
        )

    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    for turn in history[-12:]:
        role = turn.get("role") if isinstance(turn, dict) else None
        content = turn.get("content") if isinstance(turn, dict) else None
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": str(content)[:1000]})
    messages.append({"role": "user", "content": user_message})

    payload = json.dumps(
        {
            "model": CHAT_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 300,
        }
    ).encode("utf-8")
    req = Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        raise RuntimeError(
            f"OpenAI error: {exc.read().decode('utf-8', errors='ignore')}"
        ) from exc
    return data["choices"][0]["message"]["content"].strip()


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

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/api/chat":
            self._handle_chat()
            return
        self.send_error(404)

    def _handle_chat(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            body = {}

        user_message = str(body.get("message") or "").strip()[:1000]
        history = body.get("history") or []
        if not user_message:
            self._send_json({"error": "message is required"}, status=400)
            return

        try:
            reply = call_openai_chat(user_message, history)
        except Exception as e:
            self._send_json({"error": str(e)}, status=500)
            return

        self._send_json({"reply": reply})

    def _send_json(self, payload: dict, status: int = 200) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

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
