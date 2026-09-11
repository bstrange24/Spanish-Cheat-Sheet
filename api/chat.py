import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request

app = Flask(__name__)

MODEL = "gpt-4o-mini"
MAX_HISTORY_TURNS = 12
MAX_MESSAGE_CHARS = 1000

SYSTEM_PROMPT = (
    "You are a warm, patient Spanish conversation tutor chatting with a learner. "
    "Reply mostly in natural, everyday Spanish appropriate to the learner's apparent level. "
    "If the learner's Spanish has a mistake, briefly correct it in a short English aside in "
    "parentheses, then continue the conversation in Spanish. Keep replies short (1-3 sentences) "
    "and ask a follow-up question to keep the conversation going."
)


def call_openai(messages: list) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured on the server")

    payload = json.dumps(
        {
            "model": MODEL,
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
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def build_messages(user_message: str, history: list) -> list:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in history[-MAX_HISTORY_TURNS:]:
        role = turn.get("role") if isinstance(turn, dict) else None
        content = turn.get("content") if isinstance(turn, dict) else None
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": str(content)[:MAX_MESSAGE_CHARS]})
    messages.append({"role": "user", "content": user_message})
    return messages


@app.route("/api/chat", methods=["POST"])
def chat():
    body = request.get_json(silent=True) or {}
    user_message = (body.get("message") or "").strip()
    history = body.get("history") or []

    if not user_message:
        return jsonify({"error": "message is required"}), 400
    user_message = user_message[:MAX_MESSAGE_CHARS]

    try:
        reply = call_openai(build_messages(user_message, history))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        return jsonify({"error": f"OpenAI error: {detail}"}), 502
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify({"reply": reply})


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001)
