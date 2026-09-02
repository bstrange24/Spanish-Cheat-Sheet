#!/usr/bin/env python3
"""Insert <span class="secondary">pronunciation</span> after every .say span.

Prefers, in order:
  1. A Pronunciation cell in the same table row
  2. dictionary.js / dictionary-extra.js approx
  3. A generated LatAm-style phonetic (OH-lah, PWEH-doh)

Idempotent: skips spans that already have a phonetic secondary.
Run from project root:
  python scripts/add_inline_pronunciation.py
"""

from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECTIONS = ROOT / "sections"

SAY_OPEN = re.compile(
    r'<span\b(?=[^>]*\bclass="say")(?=[^>]*\bdata-text="([^"]*)")[^>]*>',
    re.I,
)

PHONETIC_HINT = re.compile(
    r"[A-Z]{2,}-[A-Z]|ah-|eh-|oh-|ee-|oo-|yeh|weh|yoh|nyah|rrh|"
    r"^(yoh|too|ehl|oy|eer|sehr|dahr|behr|meh|teh|keh|noh|see|lah|lohs|deh)$",
    re.I,
)

ENGLISH_GLOSS = re.compile(
    r"^\(| — |^(I|you|he|she|we|they|it|to |the |a |an |of |and |for |with )\b",
    re.I,
)

H1_SPANISH = {
    "decir": "deh-SEER",
    "estar": "ehs-TAHR",
    "gustar": "goos-TAHR",
    "hacer": "ah-SEHR",
    "ir": "eer",
    "jugar": "hoo-GAHR",
    "poder": "poh-DEHR",
    "querer": "keh-REHR",
    "ser": "sehr",
    "tener": "teh-NEHR",
    "haber": "ah-BEHR",
    "hay": "eye",
}

WEAK = set("iuíúü")
STRONG = set("aeoáéó")
VOWELS = WEAK | STRONG
CLUSTERS = {
    "pl",
    "pr",
    "bl",
    "br",
    "tr",
    "dr",
    "cl",
    "cr",
    "fl",
    "fr",
    "gl",
    "gr",
    "tl",
}

# Function words and a few irregulars the generator gets wrong.
EXCEPTIONS = {
    "yo": "yoh",
    "tú": "too",
    "tu": "too",
    "él": "ehl",
    "el": "ehl",
    "ella": "EH-yah",
    "ellos": "EH-yohs",
    "ellas": "EH-yahs",
    "usted": "oos-TEHD",
    "ustedes": "oos-TEH-dehs",
    "nosotros": "noh-SOH-trohs",
    "nosotras": "noh-SOH-trahs",
    "vosotros": "boh-SOH-trohs",
    "vosotras": "boh-SOH-trahs",
    "vos": "bohs",
    "mí": "mee",
    "mi": "mee",
    "me": "meh",
    "te": "teh",
    "se": "seh",
    "le": "leh",
    "les": "lehs",
    "nos": "nohs",
    "os": "ohs",
    "la": "lah",
    "las": "lahs",
    "los": "lohs",
    "un": "oon",
    "una": "OO-nah",
    "unos": "OO-nohs",
    "unas": "OO-nahs",
    "y": "ee",
    "o": "oh",
    "u": "oo",
    "e": "eh",
    "a": "ah",
    "al": "ahl",
    "del": "dehl",
    "de": "deh",
    "en": "ehn",
    "con": "kohn",
    "por": "por",
    "para": "PAH-rah",
    "sin": "seen",
    "que": "keh",
    "qué": "keh",
    "quien": "KYEHN",
    "quién": "KYEHN",
    "no": "noh",
    "sí": "see",
    "si": "see",
    "ya": "yah",
    "hay": "eye",
    "hoy": "oy",
    "muy": "mwee",
    "ir": "eer",
    "ser": "sehr",
    "dar": "dahr",
    "ver": "behr",
    "voy": "boy",
    "va": "bah",
    "vas": "bahs",
    "vamos": "BAH-mohs",
    "van": "bahn",
    "soy": "soy",
    "eres": "EH-rehs",
    "es": "ehs",
    "somos": "SOH-mohs",
    "sois": "so-ees",
    "son": "sohn",
    "estoy": "ehs-TOY",
    "he": "eh",
    "has": "ahs",
    "ha": "ah",
    "han": "ahn",
    "hemos": "EH-mohs",
    "habéis": "ah-BEH-ees",
    "sé": "seh",
    "lo": "loh",
    "los": "lohs",
    "doy": "doy",
    "das": "dahs",
    "da": "dah",
    "di": "dee",
    "ve": "beh",
    "ves": "behs",
    "mexico": "MEH-hee-koh",
    "méxico": "MEH-hee-koh",
    "mexicano": "meh-hee-KAH-noh",
    "mexicana": "meh-hee-KAH-nah",
}


def load_dict_approx() -> dict[str, str]:
    out: dict[str, str] = {}
    for name in ("js/dictionary.js", "js/dictionary-extra.js"):
        text = (ROOT / name).read_text(encoding="utf-8")
        for m in re.finditer(
            r"""['\"]?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡0-9' /?-]+)['\"]?\s*:\s*\{\s*approx:\s*['\"]([^'\"]+)['\"]""",
            text,
        ):
            key = re.sub(r"\s+", " ", m.group(1)).strip().lower()
            key = key.strip("¿?¡!.")
            if key:
                out[key] = m.group(2)
    return out


DICT_APPROX = load_dict_approx()


def is_vowel_char(ch: str) -> bool:
    return ch.lower() in VOWELS


def is_diphthong(a: str, b: str) -> bool:
    a, b = a.lower(), b.lower()
    if b == "Y":
        b = "i"
    if a not in VOWELS or b not in VOWELS:
        return False
    # Accented weak vowel starts a hiatus: día, río, país (a+í)
    if a in "íú" or b in "íú":
        return False
    if a in STRONG and b in STRONG:
        return False
    return True


def graphemes(word: str) -> list[str]:
    w = word.lower()
    i = 0
    out: list[str] = []
    while i < len(w):
        two = w[i : i + 2]
        nxt = w[i + 2] if i + 2 < len(w) else ""
        if two in ("ch", "ll", "rr"):
            out.append(two)
            i += 2
        elif two == "qu" and nxt in "eéií":
            out.append("k")
            i += 2
        elif two == "gü":
            out.append("gw")
            i += 2
        elif two == "gu" and nxt in "eéií":
            out.append("g")
            i += 2
        elif w[i] == "h":
            i += 1
        elif w[i] == "y":
            rest = w[i + 1 :]
            if out and out[-1][-1] in VOWELS and rest in ("", "s"):
                out.append("Y")
            else:
                out.append("y")
            i += 1
        else:
            out.append(w[i])
            i += 1
    return out


def merge_vowels(graphs: list[str]) -> list[str]:
    if not graphs:
        return []
    out = [graphs[0]]
    for g in graphs[1:]:
        prev = out[-1]
        if len(prev) == 1 and len(g) == 1 and is_diphthong(prev, g):
            out[-1] = prev + g
        else:
            out.append(g)
    return out


def is_cons(g: str) -> bool:
    if g == "Y":
        return False
    return not any(is_vowel_char(c) for c in g)


def syllabify(graphs: list[str]) -> list[list[str]]:
    graphs = merge_vowels(graphs)
    vowel_idx = [i for i, g in enumerate(graphs) if not is_cons(g)]
    if not vowel_idx:
        return [graphs] if graphs else []
    breaks: list[int] = []
    for a, b in zip(vowel_idx, vowel_idx[1:]):
        cons = graphs[a + 1 : b]
        n = len(cons)
        if n == 0:
            breaks.append(b)
        elif n == 1:
            breaks.append(a + 1)
        else:
            last_pair = "".join(cons[-2:])
            if last_pair in CLUSTERS:
                breaks.append(b - 2)
            else:
                breaks.append(b - 1)
    syllables: list[list[str]] = []
    start = 0
    for br in breaks:
        syllables.append(graphs[start:br])
        start = br
    syllables.append(graphs[start:])
    return [s for s in syllables if s]


def stress_index(word: str, syllables: list[list[str]]) -> int:
    n = len(syllables)
    if n <= 1:
        return 0
    joined = "".join("".join(s) for s in syllables)
    for i, syl in enumerate(syllables):
        if any(c in "áéíóúÁÉÍÓÚ" for g in syl for c in g):
            return i
    # Original word ending (ignore silent h already dropped)
    clean = re.sub(r"[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]", "", word)
    last = clean[-1].lower() if clean else ""
    if last in "aeiouáéíóúünns":
        return n - 2
    return n - 1


def cons_sound(g: str, next_g: str | None) -> str:
    if g == "ch":
        return "ch"
    if g == "ll":
        return "y"
    if g == "rr":
        return "rrh"
    if g == "ñ":
        return "ny"
    if g == "gw":
        return "gw"
    if g == "k":
        return "k"
    if g == "j":
        return "h"
    if g == "v":
        return "b"
    if g == "z":
        return "s"
    if g == "x":
        return "ks"
    if g == "q":
        return "k"
    if g == "c":
        nxt = (next_g or "")[:1]
        if nxt in "eéií":
            return "s"
        return "k"
    if g == "g":
        nxt = (next_g or "")[:1]
        if nxt in "eéií":
            return "h"
        return "g"
    if g == "y":
        return "y"
    if g == "r":
        return "r"
    return g


def vowel_sound(cluster: str) -> str:
    c = cluster.lower()
    mapping = {
        "a": "ah",
        "á": "ah",
        "e": "eh",
        "é": "eh",
        "i": "ee",
        "í": "ee",
        "o": "oh",
        "ó": "oh",
        "u": "oo",
        "ú": "oo",
        "ü": "oo",
        "ia": "yah",
        "iá": "YAH",
        "ie": "yeh",
        "ié": "YEH",
        "io": "yoh",
        "ió": "YOH",
        "iu": "yoo",
        "ua": "wah",
        "uá": "WAH",
        "ue": "weh",
        "ué": "WEH",
        "ui": "wee",
        "uí": "WEE",
        "uo": "woh",
        "ai": "eye",
        "ái": "EYE",
        "au": "ow",
        "áu": "OW",
        "ei": "ay",
        "éi": "AY",
        "eu": "eh-oo",
        "oi": "oy",
        "ói": "OY",
        "ou": "oh-oo",
        "ay": "eye",
        "aY": "eye",
        "ey": "ay",
        "eY": "ay",
        "oy": "oy",
        "oY": "oy",
        "uy": "wee",
        "uY": "wee",
    }
    if c in mapping:
        return mapping[c].lower()
    # fallback: concatenate
    return "".join(mapping.get(ch, ch) for ch in c)


def syllable_sound(syl: list[str]) -> str:
    parts: list[str] = []
    for i, g in enumerate(syl):
        nxt = syl[i + 1] if i + 1 < len(syl) else None
        if is_cons(g):
            if g == "y" and i == len(syl) - 1:
                parts.append("ee")
            else:
                parts.append(cons_sound(g, nxt))
        else:
            parts.append(vowel_sound(g))
    return "".join(parts)


def generate_word(word: str) -> str:
    key = word.lower()
    if key in EXCEPTIONS:
        return EXCEPTIONS[key]
    if key in DICT_APPROX and " " not in DICT_APPROX[key]:
        return DICT_APPROX[key]
    graphs = graphemes(word)
    if not graphs:
        return word
    # word-initial y as consonant already; word "y" handled in exceptions
    if graphs[0] == "y" and len(graphs) == 1:
        return "ee"
    syllables = syllabify(graphs)
    if not syllables:
        return word
    stressed = stress_index(word, syllables)
    rendered = [syllable_sound(s) for s in syllables]
    # Word-initial r is often written r, not rrh, matching this site
    out: list[str] = []
    for i, piece in enumerate(rendered):
        if i == stressed:
            out.append(piece.upper())
        else:
            out.append(piece)
    result = "-".join(out)
    # Single-syllable: keep lower unless it's long
    if len(out) == 1 and len(out[0]) <= 4:
        return out[0].lower() if out[0].isupper() else out[0]
    return result


def simplify_pron(pron: str) -> str:
    t = re.sub(r"\s+", " ", pron or "").strip()
    if not t:
        return ""
    m = re.match(r"(.+?)\s*\(\s*LatAm\s*\)", t, re.I)
    if m:
        return m.group(1).strip()
    t = re.sub(r"\s*\(\s*LatAm\s*\)\s*/\s*.+$", "", t, flags=re.I)
    t = re.sub(r"\s*\(\s*LatAm\s*\)\s*$", "", t, flags=re.I)
    return t.strip()


def looks_like_word_pron(pron: str, spanish: str) -> bool:
    p = (pron or "").strip()
    s = (spanish or "").strip()
    if not p or not s:
        return False
    if ENGLISH_GLOSS.search(p):
        return False
    # Ending-only labels like EH / AHS must not attach to pronouns.
    if (
        re.fullmatch(r"[A-Z]{1,4}", p)
        and len(s.split()) == 1
        and s.lower()
        in {
            "yo",
            "tú",
            "tu",
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
            "vos",
        }
    ):
        return False
    return True


def normalize_lookup_key(text: str) -> str:
    t = re.sub(r"\s+", " ", text).strip()
    t = t.strip("¿?¡!.,;:\"'“”")
    return t.lower()


def phoneticize_phrase(text: str, lookup: dict[str, str] | None = None) -> str:
    raw = re.sub(r"\s+", " ", text or "").strip()
    if not raw:
        return ""
    key = normalize_lookup_key(raw)
    if key in DICT_APPROX:
        return DICT_APPROX[key]
    if key in EXCEPTIONS:
        return EXCEPTIONS[key]
    if lookup and key in lookup:
        return lookup[key]
    # Strip inverted punctuation for word split
    cleaned = raw.replace("¿", "").replace("¡", "")
    cleaned = re.sub(r"[?!.…,;:\"“”]+$", "", cleaned)
    words = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|\d+", cleaned)
    if not words:
        return generate_word(key) if key else ""
    parts = []
    for w in words:
        if w.isdigit():
            parts.append(w)
            continue
        lk = w.lower()
        if lookup and lk in lookup:
            parts.append(lookup[lk])
        elif lk in DICT_APPROX:
            parts.append(DICT_APPROX[lk])
        else:
            parts.append(generate_word(w))
    return " ".join(parts)


def is_phonetic(text: str) -> bool:
    t = (text or "").strip()
    if not t or ENGLISH_GLOSS.search(t):
        return False
    if t in {"-", "—", "–"}:
        return False
    if PHONETIC_HINT.search(t):
        return True
    if "LatAm" in t or "Spain" in t:
        return True
    if re.fullmatch(r"[A-Za-z][A-Za-z\- /() ]{0,80}", t) and not re.search(
        r"\b(the|and|for|with|have|can|was|were)\b", t, re.I
    ):
        return True
    return False


CLOSE_SPAN = re.compile(r"</span\s*>", re.I)


def matching_span_end(html: str, inner_start: int) -> int | None:
    depth = 1
    i = inner_start
    n = len(html)
    while i < n:
        if html.startswith("<span", i) or html.startswith("<SPAN", i):
            depth += 1
            i += 5
            continue
        close = CLOSE_SPAN.match(html, i)
        if close:
            depth -= 1
            if depth == 0:
                return close.end()
            i = close.end()
            continue
        i += 1
    return None


def find_say_spans(html: str) -> list[tuple[int, int, str]]:
    found: list[tuple[int, int, str]] = []
    for m in SAY_OPEN.finditer(html):
        end = matching_span_end(html, m.end())
        if end is None:
            continue
        found.append((m.start(), end, m.group(1)))
    return found


class TableHarvest(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.lookup: dict[str, str] = {}
        self._table: dict | None = None
        self._row: list[dict] | None = None
        self._cell: dict | None = None
        self._in_th = False
        self._say_attr = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "table":
            self._table = {"headers": [], "rows": []}
        elif self._table is not None and tag == "tr":
            self._row = []
        elif self._table is not None and tag in ("th", "td"):
            self._in_th = tag == "th"
            self._cell = {"text": [], "says": []}
        elif tag == "span" and self._cell is not None:
            cls = attrs.get("class", "")
            if "say" in cls.split():
                t = (attrs.get("data-text") or "").strip()
                if t:
                    self._cell["says"].append(t)

    def handle_endtag(self, tag):
        if tag in ("th", "td") and self._cell is not None and self._row is not None:
            text = re.sub(r"\s+", " ", "".join(self._cell["text"])).strip()
            self._row.append({"text": text, "says": self._cell["says"]})
            self._cell = None
            self._in_th = False
        elif tag == "tr" and self._row is not None and self._table is not None:
            if self._row:
                if not self._table["headers"]:
                    self._table["headers"] = [c["text"] for c in self._row]
                    self._table["_header_row"] = True
                else:
                    self._table["rows"].append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            self._consume_table(self._table)
            self._table = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell["text"].append(data)

    def _consume_table(self, table: dict) -> None:
        headers = [
            re.sub(r"\s+", " ", h).strip().lower() for h in table.get("headers") or []
        ]

        def col_role(h: str) -> str:
            if re.search(r"pronunciation pattern|sound pattern", h):
                return "skip"
            if re.search(
                r"\benglish\b|^meaning\b|^notes\b|^idea\b|^use\b|^ending\b|^person\b", h
            ):
                return "skip"
            if "spain" in h:
                return "skip"
            if re.search(r"pronunciation|^latam$|^pron\.", h):
                return "pron"
            return "es"

        roles = [col_role(h) for h in headers]
        if "pron" not in roles:
            return
        pron_idx = roles.index("pron")
        for row in table.get("rows") or []:
            if pron_idx >= len(row):
                continue
            pron = simplify_pron(row[pron_idx]["text"].strip())
            if not pron or pron in ("-", "—", "–", "same"):
                continue
            if "," in pron and pron.count(",") >= 2:
                continue
            says: list[str] = []
            for i, cell in enumerate(row):
                if i >= len(roles) or roles[i] != "es":
                    continue
                says.extend(cell["says"])
            if not says:
                continue
            bits = [
                p.strip()
                for p in re.split(r"\s*/\s*", pron)
                if p.strip() and p.strip() != "-"
            ]
            if len(says) == 1:
                if looks_like_word_pron(pron, says[0]):
                    self.lookup.setdefault(normalize_lookup_key(says[0]), pron)
            elif len(bits) == len(says):
                for s, p in zip(says, bits):
                    if p.startswith("-") and len(says[0]) > 1:
                        continue
                    if looks_like_word_pron(p, s):
                        self.lookup.setdefault(normalize_lookup_key(s), p)


def harvest_file(html: str) -> dict[str, str]:
    p = TableHarvest()
    try:
        p.feed(html)
    except Exception:
        return {}
    return p.lookup


def already_has_phonetic(html: str, span_end: int) -> bool:
    after = html[span_end : span_end + 400]
    m = re.match(r'\s*(?:🔊\s*)?<span class="secondary">([^<]+)</span>', after)
    if not m:
        return False
    t = m.group(1).strip()
    if t in {"-", "—", "–"}:
        return False
    if ENGLISH_GLOSS.search(t):
        return False
    return True


def insert_after_span(html: str, span_end: int, pron: str) -> tuple[str, int]:
    snippet = f' <span class="secondary">{pron}</span>'
    after = html[span_end:]
    # Keep after the pronunciation (next to the Spanish word).
    return html[:span_end] + snippet + after, len(snippet)


def add_h1_pron(html: str) -> str:
    m = re.match(r"(<h1>)(.*?)(</h1>)", html, re.S)
    if not m:
        return html
    inner = m.group(2)
    if 'class="secondary"' in inner:
        return html
    text = re.sub(r"<[^>]+>", "", inner)
    text = re.sub(r"\s+", " ", text).replace("&amp;", "&").strip()
    # Split on common separators
    parts = re.split(r"\s*(?:/|-|–)\s*", text)
    rebuilt = inner
    changed = False
    for part in parts:
        key = part.strip().lower()
        if key in H1_SPANISH:
            # Replace first occurrence of the visible word
            word = part.strip()
            pron = H1_SPANISH[key]
            rebuilt = re.sub(
                rf"(?<![\wÁÉÍÓÚÜÑáéíóúüñ]){re.escape(word)}(?![\wÁÉÍÓÚÜÑáéíóúüñ])",
                f'{word} <span class="secondary">{pron}</span>',
                rebuilt,
                count=1,
            )
            changed = True
    if not changed:
        return html
    return html[: m.start()] + m.group(1) + rebuilt + m.group(3) + html[m.end() :]


def process_html(html: str) -> tuple[str, int]:
    local = harvest_file(html)
    spans = find_say_spans(html)
    added = 0
    for start, end, data_text in reversed(spans):
        after = html[end:]
        while True:
            dash = re.match(r'\s*<span class="secondary">[—–-]</span>', after)
            if not dash:
                break
            html = html[:end] + after[dash.end() :]
            after = html[end:]
        if already_has_phonetic(html, end):
            continue
        inner = html[start:end]
        visible = re.sub(r"<[^>]+>", "", inner)
        visible = re.sub(r"\s+", " ", visible).strip()
        if visible in {"🔊", "📢", "🎵", "▶️", ""}:
            continue
        pron = phoneticize_phrase(data_text, local)
        if not pron:
            continue
        html, _ = insert_after_span(html, end, pron)
        added += 1
    html = add_h1_pron(html)
    return html, added


def main() -> None:
    files = sorted(SECTIONS.rglob("*.html"))
    total_added = 0
    changed_files = 0
    for path in files:
        original = path.read_text(encoding="utf-8")
        updated, added = process_html(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed_files += 1
            total_added += added
            print(f"{added:5} {path.relative_to(ROOT).as_posix()}")
        elif added:
            print(f"{added:5} {path.relative_to(ROOT).as_posix()} (no write?)")
    print(f"updated {changed_files} files, inserted {total_added} pronunciations")


if __name__ == "__main__":
    main()
