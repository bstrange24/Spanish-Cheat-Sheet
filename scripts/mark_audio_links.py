#!/usr/bin/env python3
"""
Make Spanish words clickable so they play pronunciation.

In VS Code Markdown preview, clicking a word opens pronunciation_player.html
which plays Spanish TTS audio in your browser.

Also re-applies diphthong letter highlights inside those words.

Usage (from project root):
  python scripts/mark_audio_links.py

Safe to re-run.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import quote

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

# Reuse diphthong logic
import mark_diphthongs as md

TARGET = ROOT / "spanish-cheatsheet.md"

# VS Code Markdown preview blocks file:// links (clicks do nothing).
# Serve the player with:  python scripts/start_player_server.py
PLAYER_HOST = "127.0.0.1"
PLAYER_PORT = 8765
PLAYER_BASE = f"http://{PLAYER_HOST}:{PLAYER_PORT}/pronunciation_player.html"

# LatAm Spanish (matches cheat-sheet default). Change to "es" for Spain.
TTS_TL = "es-419"

# Extra common Spanish words (no diphthong required) so nearly all study words are clickable
EXTRA_SPANISH = {
    "que",
    "de",
    "no",
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "y",
    "en",
    "lo",
    "por",
    "para",
    "con",
    "sin",
    "sobre",
    "entre",
    "hasta",
    "desde",
    "hacia",
    "según",
    "durante",
    "contra",
    "mediante",
    "vía",
    "me",
    "te",
    "se",
    "nos",
    "os",
    "le",
    "les",
    "mi",
    "tu",
    "su",
    "mis",
    "tus",
    "sus",
    "mío",
    "mía",
    "tuyo",
    "suyo",
    "yo",
    "tú",
    "él",
    "ella",
    "usted",
    "nosotros",
    "nosotras",
    "vosotros",
    "vosotras",
    "ellos",
    "ellas",
    "ustedes",
    "ello",
    "mí",
    "ti",
    "ser",
    "estar",
    "haber",
    "tener",
    "hacer",
    "ir",
    "venir",
    "decir",
    "poder",
    "querer",
    "saber",
    "ver",
    "dar",
    "poner",
    "salir",
    "llegar",
    "pasar",
    "deber",
    "dejar",
    "llevar",
    "encontrar",
    "seguir",
    "llamar",
    "pensar",
    "hablar",
    "tomar",
    "vivir",
    "sentir",
    "escribir",
    "leer",
    "comer",
    "beber",
    "dormir",
    "abrir",
    "cerrar",
    "buscar",
    "trabajar",
    "estudiar",
    "aprender",
    "enseñar",
    "comprar",
    "vender",
    "pagar",
    "usar",
    "necesitar",
    "gustar",
    "parecer",
    "conocer",
    "entender",
    "preguntar",
    "responder",
    "ayudar",
    "escuchar",
    "mirar",
    "esperar",
    "entrar",
    "subir",
    "bajar",
    "correr",
    "caminar",
    "viajar",
    "jugar",
    "ganar",
    "perder",
    "cambiar",
    "terminar",
    "empezar",
    "continuar",
    "intentar",
    "decidir",
    "creer",
    "recordar",
    "olvidar",
    "amar",
    "odiar",
    "casa",
    "hombre",
    "mujer",
    "niño",
    "niña",
    "padre",
    "madre",
    "hijo",
    "hija",
    "hermano",
    "hermana",
    "amigo",
    "amiga",
    "familia",
    "gente",
    "persona",
    "día",
    "noche",
    "mañana",
    "tarde",
    "hora",
    "tiempo",
    "año",
    "mes",
    "semana",
    "vez",
    "lugar",
    "mundo",
    "país",
    "ciudad",
    "pueblo",
    "calle",
    "agua",
    "pan",
    "leche",
    "café",
    "té",
    "vino",
    "cerveza",
    "comida",
    "cena",
    "libro",
    "escuela",
    "trabajo",
    "dinero",
    "problema",
    "nombre",
    "número",
    "color",
    "perro",
    "gato",
    "mesa",
    "silla",
    "puerta",
    "ventana",
    "coche",
    "sol",
    "luna",
    "mar",
    "río",
    "fuego",
    "tierra",
    "aire",
    "luz",
    "paz",
    "amor",
    "verdad",
    "vida",
    "muerte",
    "dios",
    "señor",
    "señora",
    "sí",
    "tal",
    "cada",
    "otro",
    "mismo",
    "todo",
    "nada",
    "algo",
    "alguien",
    "nadie",
    "mucho",
    "poco",
    "más",
    "menos",
    "muy",
    "tan",
    "tanto",
    "bien",
    "mal",
    "ya",
    "aún",
    "todavía",
    "siempre",
    "nunca",
    "ahora",
    "antes",
    "después",
    "luego",
    "entonces",
    "aquí",
    "allí",
    "ahí",
    "cerca",
    "lejos",
    "dentro",
    "fuera",
    "arriba",
    "abajo",
    "hoy",
    "ayer",
    "pronto",
    "temprano",
    "claro",
    "seguro",
    "importante",
    "posible",
    "fácil",
    "difícil",
    "grande",
    "pequeño",
    "bueno",
    "malo",
    "nuevo",
    "viejo",
    "joven",
    "feliz",
    "triste",
    "cansado",
    "ocupado",
    "listo",
    "primero",
    "último",
    "mejor",
    "peor",
    "mayor",
    "menor",
    "rojo",
    "azul",
    "verde",
    "negro",
    "blanco",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "cien",
    "mil",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "domingo",
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
    "qué",
    "quién",
    "dónde",
    "cuándo",
    "cómo",
    "cuál",
    "cuánto",
    "porque",
    "hola",
    "adiós",
    "gracias",
    "favor",
    "perdón",
    "permiso",
    "español",
    "inglés",
    "méxico",
    "españa",
    "texas",
    "estados",
    "unidos",
    "conmigo",
    "contigo",
    "consigo",
    "del",
    "al",
    "esto",
    "eso",
    "aquel",
    "esta",
    "ese",
    "esa",
    "estos",
    "esas",
    "aquella",
    "nuestro",
    "vuestra",
    "este",
    # cheat-sheet heavy hitters
    "hablo",
    "hablas",
    "habla",
    "hablamos",
    "hablan",
    "como",
    "comes",
    "come",
    "vivo",
    "vives",
    "vive",
    "soy",
    "eres",
    "somos",
    "son",
    "estoy",
    "estás",
    "está",
    "estamos",
    "están",
    "tengo",
    "tienes",
    "tiene",
    "tenemos",
    "tienen",
    "voy",
    "vas",
    "va",
    "vamos",
    "van",
    "puedo",
    "puedes",
    "puede",
    "podemos",
    "pueden",
    "quiero",
    "quieres",
    "quiere",
    "hago",
    "haces",
    "hace",
    "digo",
    "dices",
    "dice",
    "sé",
    "sabes",
    "sabe",
    "veo",
    "ves",
    "ve",
    "doy",
    "das",
    "da",
    "hay",
    "he",
    "has",
    "ha",
    "hemos",
    "han",
    "vengo",
    "vienes",
    "viene",
    "llego",
    "llegas",
    "llega",
    "llamo",
    "llamas",
    "llaman",
    "guerra",
    "guitarra",
    "queso",
    "aquí",
    "pingüino",
    "vergüenza",
    "cero",
    "cine",
    "gente",
    "jamón",
    "niño",
    "españa",
    "zapato",
    "examen",
    "familia",
    "ciudad",
    "baile",
    "bueno",
    "tiene",
    "muy",
    "hay",
    "gracias",
}


def is_pronounceable_spanish(word: str) -> bool:
    low = word.lower()
    if md.is_pronunciation_guide(word):
        return False
    if low in md.ENGLISH_SKIP:
        return False
    # skip pure English respelling leftovers
    if low in {
        "eye",
        "beyn",
        "sayss",
        "today",
        "noun",
        "casual",
        "without",
        "monday",
        "restaurant",
        "weather",
        "children",
        "friend",
        "same",
        "both",
        "please",
        "thanks",
        "hello",
        "goodbye",
        "yes",
        "maybe",
        "never",
        "always",
        "often",
        "here",
        "there",
        "where",
        "when",
        "what",
        "who",
        "why",
        "how",
        "which",
        "because",
        "before",
        "after",
        "under",
        "over",
        "between",
        "through",
        "preview",
        "editor",
        "window",
        "reload",
        "click",
        "press",
        "section",
        "sections",
        "example",
        "examples",
        "note",
        "notes",
        "tip",
        "tips",
        "english",
        "latin",
        "america",
        "castilian",
        "sheet",
        "file",
        "folder",
        "style",
        "styles",
        "margin",
        "padding",
        "layout",
        "spacing",
        "format",
        "highlight",
        "underline",
        "yellow",
        "triangle",
        "triangles",
        "chevron",
        "details",
        "summary",
        "markdown",
        "developer",
        "workspace",
        "setting",
        "value",
        "currently",
        "content",
        "title",
        "pattern",
        "sound",
        "letter",
        "word",
        "phrase",
        "sentence",
        "meaning",
        "person",
        "people",
        "place",
        "time",
        "date",
        "number",
        "month",
        "week",
        "day",
        "year",
        "hour",
        "gender",
        "verb",
        "noun",
        "adjective",
        "pronoun",
        "article",
        "adverb",
        "preposition",
        "conjunction",
        "singular",
        "plural",
        "masculine",
        "feminine",
        "formal",
        "informal",
        "present",
        "past",
        "future",
        "default",
        "optional",
        "important",
        "common",
        "useful",
        "basic",
        "advanced",
        "beginner",
        "learner",
        "practice",
        "review",
        "reference",
        "guide",
        "table",
        "column",
        "row",
        "filter",
        "freeze",
        "sheet",
        "workbook",
        "excel",
        "csv",
        "pdf",
        "print",
        "export",
        "import",
    }:
        return False
    if md.SPANISH_HINT.search(word):
        return True
    if low in EXTRA_SPANISH or low in md.SPANISH_DIPHTHONG_WORDS:
        return True
    if md.word_is_spanish_context(word):
        return True
    # Spanish morphology
    if re.search(
        r"(?i)(ción|sión|dad|tad|mente|idad|ando|iendo|arse|erse|irse|"
        r"amos|emos|imos|áis|éis|aba|aban|aste|aron|ido|ada|ados|adas|"
        r"mente)$",
        word,
    ):
        return True
    return False


def word_player_url(word: str) -> str:
    """Popup player for a single word (http://localhost — works in MD preview)."""
    q = quote(word, safe="")
    return f"{PLAYER_BASE}?word={q}&lang={TTS_TL}&mode=word"


def phrase_player_url(phrase: str) -> str:
    """Popup player for a full phrase / sentence."""
    q = quote(phrase, safe="")
    return f"{PLAYER_BASE}?text={q}&lang={TTS_TL}&mode=phrase"


# Open audio links in a new browser tab so the markdown preview stays on the same page.
PLAYER_TARGET = "_blank"

# Light separators allowed BETWEEN consecutive word-links in one phrase
_SEP_RE = re.compile(r'^[\s,;:¡!¿?.…\'"«»\-—]*$')

# A single word-link whose body is only text and optional diphthong spans
# (never uses .*? which can backtrack across other tags / table cells)
_SAY_LINK_RE = re.compile(
    # class="say" only (not say-phrase); body = text + optional diphthong spans
    r'<a\s+class="say"\s'
    r'[^>]*title="Click to hear word: (?P<word>[^"]+)"'
    r"[^>]*>"
    r'(?:[^<]|<span class="diphthong">[^<]*</span>)*'
    r"</a>",
    re.I,
)

_WORD_TOKEN_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$")


def unwrap_all(text: str) -> str:
    """
    Strip all markup we inject so rebuilds start from clean Spanish text.

    Must tolerate nested / broken leftover tags from older builds
    (nested diphthongs, orphan </span>, phrase wrappers that crossed cells).
    """
    # Drop sticky player iframe (re-injected later)
    text = re.sub(
        r'<iframe\b[^>]*\bname="spanish-player"[^>]*>\s*</iframe>\s*',
        "",
        text,
        flags=re.I,
    )
    text = re.sub(
        r'<iframe\b[^>]*\bid="spanish-player"[^>]*>\s*</iframe>\s*',
        "",
        text,
        flags=re.I,
    )

    for _ in range(40):
        prev = text
        # phrase play buttons first
        text = re.sub(
            r'\s*<a\s+class="say-phrase"[^>]*>.*?</a>',
            "",
            text,
            flags=re.I | re.S,
        )
        # word audio links — keep inner content (may include diphthong spans)
        text = re.sub(
            r'<a\s+class="say"[^>]*>(.*?)</a>',
            r"\1",
            text,
            flags=re.I | re.S,
        )
        # phrase wrappers
        text = re.sub(
            r'<span class="phrase">(.*?)</span>',
            r"\1",
            text,
            flags=re.I | re.S,
        )
        # diphthong spans (innermost / non-nested first)
        text = re.sub(
            r'<span class="diphthong">([^<]*)</span>',
            r"\1",
            text,
            flags=re.I,
        )
        if text == prev:
            break

    # Orphans from broken nesting in older builds
    text = re.sub(r'</?span\s+class="(?:phrase|diphthong)"[^>]*>', "", text, flags=re.I)
    text = re.sub(r'<a\s+class="say(?:-phrase)?"[^>]*>', "", text, flags=re.I)
    # Our markup is the only use of </span> in this file
    text = re.sub(r"</span>", "", text, flags=re.I)
    return text


def link_attrs(url: str, title: str) -> str:
    """Common attributes for word/phrase links (new tab target)."""
    return f'href="{url}" target="{PLAYER_TARGET}" rel="noopener" ' f'title="{title}"'


def process_words(text: str) -> tuple[str, int, int]:
    audio_count = 0
    diph_count = 0
    parts = re.split(r"(<[^>]+>)", text)
    out: list[str] = []

    for part in parts:
        if part.startswith("<"):
            out.append(part)
            continue

        def repl(m: re.Match) -> str:
            nonlocal audio_count, diph_count
            w = m.group(0)
            if not is_pronounceable_spanish(w):
                return w
            audio_count += 1
            if md.word_is_spanish_context(w):
                spans = md.find_diphthong_spans(w)
                diph_count += len(spans)
                inner = md.wrap_spans_in_word(w)
            else:
                inner = w
            url = word_player_url(w)
            # target=spanish-player → sticky iframe (sections stay open)
            return (
                f'<a class="say" {link_attrs(url, f"Click to hear word: {w}")}>'
                f"{inner}</a>"
            )

        out.append(md.WORD_RE.sub(repl, part))

    return "".join(out), audio_count, diph_count


# Particles that alone shouldn't create a "sentence" button
_FUNCTION_WORDS = {
    "el",
    "la",
    "los",
    "las",
    "de",
    "del",
    "a",
    "al",
    "en",
    "y",
    "o",
    "u",
    "e",
    "un",
    "una",
    "unos",
    "unas",
    "por",
    "para",
    "con",
    "sin",
    "que",
    "qué",
    "se",
    "me",
    "te",
    "nos",
    "os",
    "lo",
    "le",
    "les",
    "su",
    "mi",
    "tu",
    "sus",
    "mis",
    "tus",
    "es",
    "son",
    "ser",
    "estar",
    "yo",
    "tú",
    "él",
    "ella",
    "usted",
    "si",
    "sí",
    "no",
    "ya",
    "muy",
    "más",
    "tan",
    "como",
    "cuando",
    "donde",
    "cómo",
    "dónde",
    "cuándo",
    "quién",
    "cuál",
    "y",
    "e",
    "ni",
    "mas",
    "pero",
}


def extract_phrase_words(run_html: str) -> list[str]:
    """Rebuild plain Spanish words from consecutive say-links (titles only)."""
    words = re.findall(r'title="Click to hear word: ([^"]+)"', run_html)
    # Keep only real Spanish word tokens (drops HTML leftovers)
    return [w for w in words if _WORD_TOKEN_RE.fullmatch(w)]


def is_real_phrase(words: list[str]) -> bool:
    """Require 2–8 words and at least one content word (not only particles)."""
    if len(words) < 2 or len(words) > 8:
        return False
    if not all(_WORD_TOKEN_RE.fullmatch(w) for w in words):
        return False
    content = [w for w in words if w.lower() not in _FUNCTION_WORDS and len(w) >= 3]
    return len(content) >= 1


def _inject_phrases_in_segment(segment: str) -> tuple[str, int]:
    """
    Add after consecutive word-links inside one line/cell only.
    Never crosses '|' or newlines (caller splits those first).
    """
    links = list(_SAY_LINK_RE.finditer(segment))
    if len(links) < 2:
        return segment, 0

    groups: list[list[re.Match]] = []
    current = [links[0]]
    for prev, curr in zip(links, links[1:]):
        between = segment[prev.end() : curr.start()]
        if _SEP_RE.fullmatch(between):
            current.append(curr)
        else:
            groups.append(current)
            current = [curr]
    groups.append(current)

    count = 0
    result = segment
    # Apply from the end so earlier offsets stay valid
    for group in reversed(groups):
        if len(group) < 2:
            continue
        words = [g.group("word") for g in group]
        if not is_real_phrase(words):
            continue
        phrase = " ".join(words)
        start = group[0].start()
        end = group[-1].end()
        run = result[start:end]
        url = phrase_player_url(phrase)
        btn = (
            f' <a class="say-phrase" '
            f'{link_attrs(url, f"Play full phrase: {phrase}")}>🔊</a>'
        )
        result = (
            result[:start] + f'<span class="phrase">{run}{btn}</span>' + result[end:]
        )
        count += 1
    return result, count


def inject_phrase_buttons(text: str) -> tuple[str, int]:
    """
    After multi-word Spanish runs, add a control that plays the whole phrase.
    Processes one line at a time; table cells are split on '|' so phrases
    never leak across rows/columns (that was producing "uánto lo el viaje").
    """
    count = 0
    out_lines: list[str] = []
    for line in text.split("\n"):
        # Table row: process each cell independently
        if "|" in line:
            cells = line.split("|")
            new_cells: list[str] = []
            for cell in cells:
                new_cell, c = _inject_phrases_in_segment(cell)
                count += c
                new_cells.append(new_cell)
            out_lines.append("|".join(new_cells))
        else:
            new_line, c = _inject_phrases_in_segment(line)
            count += c
            out_lines.append(new_line)
    return "\n".join(out_lines), count


def process(text: str) -> tuple[str, int, int, int]:
    updated, n_audio, n_diph = process_words(text)
    updated, n_phrases = inject_phrase_buttons(updated)
    return updated, n_audio, n_diph, n_phrases


def main() -> None:
    raw = TARGET.read_text(encoding="utf-8")
    cleaned = unwrap_all(raw)
    updated, n_audio, n_diph, n_phrases = process(cleaned)
    TARGET.write_text(updated, encoding="utf-8")
    print(f"Word audio links: {n_audio}")
    print(f"Phrase/sentence buttons: {n_phrases}")
    print(f"Diphthong clusters: {n_diph}")
    print(f"Wrote {TARGET}")
    print(f"Player URL base: {PLAYER_BASE}")
    print(f"Player target: {PLAYER_TARGET} (new browser tab — sections stay open)")
    print(f"TTS lang: {TTS_TL} (es-419 = LatAm; es = Spain)")
    print("Word click = one word.  after a phrase = full sentence.")
    print("IMPORTANT: start the local server before clicking words:")
    print("  python scripts/start_player_server.py")


if __name__ == "__main__":
    main()
