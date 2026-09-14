import json
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request

app = Flask(__name__)

TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
MAX_TEXT_CHARS = 200


def google_translate(text: str, source: str, target: str) -> str:
    url = f"{TRANSLATE_URL}?client=gtx&sl={source}&tl={target}&dt=t&q={quote(text)}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    # data[0] is a list of [translated_chunk, original_chunk, ...] sentence pairs
    return "".join(chunk[0] for chunk in data[0] if chunk and chunk[0])


@app.route("/api/translate", methods=["GET"])
def translate():
    text = (request.args.get("text") or "").strip()
    source = (request.args.get("sl") or "es").strip()
    target = (request.args.get("tl") or "en").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    text = text[:MAX_TEXT_CHARS]

    try:
        translation = google_translate(text, source, target)
    except HTTPError as exc:
        return jsonify({"error": f"Translate error: {exc.code}"}), 502
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"text": text, "translation": translation})
