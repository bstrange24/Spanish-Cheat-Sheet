import asyncio
import os
import re
import tempfile
from urllib.parse import quote_plus
from urllib.request import Request, urlopen

import edge_tts
from flask import Flask, Response, request

app = Flask(__name__)

VOICES = {
    "es-419": "es-MX-DaliaNeural",
    "es-mx": "es-MX-DaliaNeural",
    "es-us": "es-US-PalomaNeural",
    "es": "es-ES-ElviraNeural",
    "es-es": "es-ES-ElviraNeural",
}


def pick_voice(lang: str) -> str:
    key = (lang or "es-419").lower().strip()
    return VOICES.get(key, VOICES["es-419"])


def normalize_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if not cleaned:
        raise ValueError("empty text")
    if len(cleaned) > 500:
        cleaned = cleaned[:500]
    return cleaned


async def synthesize_to_bytes(text: str, voice: str) -> bytes:
    fd, temp_path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(temp_path)
        with open(temp_path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def google_translate_tts_url(text: str, lang: str) -> str:
    locale_map = {
        "es-419": "es-MX",
        "es-mx": "es-MX",
        "es-us": "es-US",
        "es": "es-ES",
        "es-es": "es-ES",
    }
    normalized_lang = (lang or "es-419").lower().strip()
    tl = locale_map.get(normalized_lang, "es")
    encoded = quote_plus(text)
    return f"https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl={tl}&q={encoded}"


def synthesize_google_translate(text: str, lang: str) -> bytes:
    url = google_translate_tts_url(text, lang)
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as resp:
        data = resp.read()
    if not data:
        raise RuntimeError("empty Google Translate TTS response")
    return data


@app.route("/api/tts", methods=["GET"])
def tts():
    text = request.args.get("text") or request.args.get("q") or ""
    lang = request.args.get("lang") or "es-419"

    try:
        cleaned = normalize_text(text)
        voice = pick_voice(lang)

        if os.getenv("VERCEL"):
            audio = synthesize_google_translate(cleaned, lang)
        else:
            try:
                audio = asyncio.run(synthesize_to_bytes(cleaned, voice))
            except Exception:
                audio = synthesize_google_translate(cleaned, lang)

        return Response(
            audio,
            mimetype="audio/mpeg",
            headers={
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except Exception as exc:
        return Response(f"TTS error: {exc}", mimetype="text/plain", status=500)


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
