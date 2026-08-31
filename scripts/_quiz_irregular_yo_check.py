"""Check Irregular Verbs quiz pairing: infinitive vs irregular yo stay distinct."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "sections" / "verbs" / "irregular-verbs.html"
CHEAT = ROOT / "js" / "spanish-cheatsheet.js"
STUDY = ROOT / "js" / "spanish-study.js"
PRACTICE = ROOT / "js" / "spanish-practice.js"


def col_kind(header):
    h = re.sub(r"\s+", " ", str(header or "")).strip().lower()
    if "spanish" not in h and (re.search(r"\benglish\b", h) or re.match(r"^meaning\b", h)):
        return "en"
    if re.search(r"pronunciation|sound guide|^latam$|^spain\b|^pron\.", h) or "say it like" in h:
        return "pron"
    if re.match(r"^(use|choose)$", h):
        return "use"
    if "ask yourself" in h:
        return "ask"
    if re.search(r"irregular\s*yo|^yo form$|^yo$", h):
        return "yo"
    if re.search(r"^infinitive$|^verb$|prefixed verb", h):
        return "inf"
    if re.search(r"^base verb$|^notes$|stem change|conjugation pattern", h):
        return "skip"
    if re.match(r"^(tú|tu|él|ella|ud\.|usted|nosotros|vosotros|ellos|ellas|uds)\b", h):
        return "person"
    if re.match(r"^spanish\b|^example$|^word$|^masculine$|^feminine$|^letter$|^spelling$", h):
        return "es"
    return "other"


def is_irregular_yo_column(header, section_id="irregular-verbs"):
    h = re.sub(r"\s+", " ", str(header or "")).strip().lower()
    if re.search(r"irregular\s*yo", h):
        return True
    on_page = bool(re.search(r"(^|/)irregular-verbs$", section_id or ""))
    return on_page and (h == "yo form" or h == "yo")


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self._table = None
        self._row = None
        self._cell = None
        self._in_th = False
        self._capture_say = False
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
                else:
                    self._capture_say = True

    def handle_endtag(self, tag):
        if tag in ("th", "td") and self._cell is not None and self._row is not None:
            text = re.sub(r"\s+", " ", "".join(self._cell["text"])).strip()
            says = [s for s in self._cell["says"] if s]
            self._row.append({"text": text, "says": says})
            self._cell = None
            self._in_th = False
        elif tag == "tr" and self._row is not None and self._table is not None:
            if self._row:
                if not self._table["headers"] and all(True for _ in self._row):
                    # first row may be headers if we already collected th text
                    pass
                self._table["_rows_raw"] = self._table.get("_rows_raw", [])
                self._table["_rows_raw"].append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            raw = self._table.get("_rows_raw", [])
            if raw:
                # treat first row as headers if it came from th or looks like labels
                headers = [c["text"] for c in raw[0]]
                self._table["headers"] = headers
                self._table["rows"] = raw[1:] if len(raw) > 1 else []
            self.tables.append(self._table)
            self._table = None
        elif tag == "span":
            self._capture_say = False

    def handle_data(self, data):
        if self._cell is None:
            return
        self._cell["text"].append(data)
        if self._capture_say:
            t = data.strip()
            if t:
                self._cell["says"].append(t)
            self._capture_say = False


def first_say(cell):
    if cell["says"]:
        return cell["says"][0]
    return cell["text"].strip()


def collect_pairs(html, section_id="irregular-verbs"):
    parser = TableParser()
    parser.feed(html)
    items = []
    for table in parser.tables:
        headers = table["headers"]
        kinds = [col_kind(h) for h in headers]
        inf_i = kinds.index("inf") if "inf" in kinds else -1
        yo_i = kinds.index("yo") if "yo" in kinds else -1
        en_i = kinds.index("en") if "en" in kinds else -1
        if inf_i < 0 or yo_i < 0 or en_i < 0:
            continue
        notes_i = -1
        for i, k in enumerate(kinds):
            if k == "skip" and re.search(r"notes|stem change|conjugation pattern", headers[i], re.I):
                notes_i = i
        for row in table["rows"]:
            if max(inf_i, yo_i, en_i) >= len(row):
                continue
            inf = first_say(row[inf_i])
            yo = row[yo_i]["says"][0] if row[yo_i]["says"] else ""
            meaning = row[en_i]["text"].strip()
            notes = row[notes_i]["text"].strip() if 0 <= notes_i < len(row) else ""
            yo_regular = bool(re.search(r"regular in present", notes, re.I))
            if inf and meaning and meaning != "-":
                items.append({"role": "infinitive", "spanish": inf, "english": meaning, "yoForm": "" if yo_regular else yo})
            if yo and meaning and not yo_regular and yo != inf:
                irreg = is_irregular_yo_column(headers[yo_i], section_id)
                label = "irregular yo of " if irreg else "yo form of "
                items.append(
                    {
                        "role": "yo",
                        "spanish": yo,
                        "english": f"{label}{inf} ({meaning})",
                        "irregularYo": irreg,
                        "infinitive": inf,
                        "meaning": meaning,
                    }
                )
    return items


def must_contain(path, snippets):
    text = path.read_text(encoding="utf-8")
    missing = [s for s in snippets if s not in text]
    return missing


def main():
    html = HTML.read_text(encoding="utf-8")
    items = collect_pairs(html)
    inf_by_en = {}
    yo_by_inf = {}
    for it in items:
        if it["role"] == "infinitive":
            inf_by_en.setdefault(it["english"].lower(), set()).add(it["spanish"])
        elif it.get("irregularYo"):
            yo_by_inf.setdefault(it["infinitive"], set()).add(it["spanish"])

    fails = []

    ser = [it for it in items if it["spanish"] == "ser" and it["role"] == "infinitive"]
    soy = [it for it in items if it["spanish"] == "soy" and it.get("irregularYo")]
    if not ser:
        fails.append("missing infinitive pair for ser")
    elif ser[0]["english"].lower() != "to be (permanent)":
        fails.append(f"ser english is {ser[0]['english']!r}, expected 'to be (permanent)'")
    if not soy:
        fails.append("missing irregular-yo pair for soy")
    else:
        if soy[0].get("infinitive") != "ser":
            fails.append(f"soy infinitive is {soy[0].get('infinitive')!r}")
        if soy[0]["english"] == "to be (permanent)":
            fails.append("soy still shares the infinitive English prompt")
        if "irregular yo of ser" not in soy[0]["english"]:
            fails.append(f"soy english should mention irregular yo of ser, got {soy[0]['english']!r}")

    same_prompt = [it for it in items if it["spanish"] in ("ser", "soy") and it["english"].lower() == "to be (permanent)"]
    if any(it["spanish"] == "soy" for it in same_prompt):
        fails.append("soy is still a valid answer for 'to be (permanent)'")

    if "soy" not in yo_by_inf.get("ser", set()):
        fails.append("ser is not linked to irregular yo soy")
    if "conozco" not in yo_by_inf.get("conocer", set()):
        fails.append("conocer is not linked to irregular yo conozco")
    if "hago" not in yo_by_inf.get("hacer", set()):
        fails.append("hacer is not linked to irregular yo hago")
    if "contengo" not in yo_by_inf.get("contener", set()):
        fails.append("contener is not linked to irregular yo contengo")
    if any(it["spanish"] == "ando" and it.get("irregularYo") for it in items):
        fails.append("regular present yo ando should not be tagged irregular yo")

    yo_count = sum(1 for it in items if it.get("irregularYo"))
    if yo_count < 40:
        fails.append(f"expected many irregular yo items, got {yo_count}")

    missing_js = []
    missing_js += must_contain(CHEAT, ["irregularYo", "role: 'yo'", "sp_page_gloss", "irregular yo of "])
    missing_js += must_contain(STUDY, ["quizFormNote", "Irregular yo", "Type the "])
    missing_js += must_contain(PRACTICE, ["pageGloss", "irreg-yo-badge", "meaningLineHtml"])
    if missing_js:
        fails.append("missing JS snippets: " + ", ".join(missing_js))

    print("verb-yo pairs", len(items))
    print("irregular yo items", yo_count)
    print("ser", ser[:1])
    print("soy", soy[:1])
    if fails:
        print("FAIL")
        for f in fails:
            print(" ", f)
        raise SystemExit(1)
    print("OK")


if __name__ == "__main__":
    main()
