from pathlib import Path
import re

html = Path("spanish-cheatsheet.html").read_text(encoding="utf-8")
sections = re.findall(r'data-section="([^"]+)"', html)
missing = []
for s in sections:
    p = Path("sections") / f"{s}.html"
    if not p.exists() or p.stat().st_size < 200:
        missing.append((s, p.exists(), p.stat().st_size if p.exists() else 0))
print("nav items", len(sections))
print("missing/small", missing)
for orig in [
    "verbs",
    "tener",
    "hacer",
    "ser-estar",
    "adjectives",
    "prepositions",
    "diphthongs",
    "tense/preterite-tense",
]:
    p = Path("sections") / f"{orig}.html"
    print(orig, p.exists(), p.stat().st_size if p.exists() else 0)
