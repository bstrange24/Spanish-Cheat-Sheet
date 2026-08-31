import importlib.util
from pathlib import Path

p = Path(__file__).resolve().parent / "build_top1000_excel.py"
spec = importlib.util.spec_from_file_location("top1000", p)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

checks = [
    ("eso", "eso", "pronoun"),
    ("casa", "casar", "noun"),
    ("caso", "casar", "noun"),
    ("dólares", "dólar", "noun"),
    ("dólar", "dólar", "noun"),
    ("ayer", "ayer", "adverb"),
    ("cerca", "cercar", "adverb"),
    ("estoy", "estar", "verb"),
    ("debo", "deber", "verb"),
    ("matar", "matar", "verb"),
    ("preocupes", "preocupar", "verb"),
    ("cállate", "callar", "verb"),
    ("calle", "callar", "noun"),
    ("oro", "orar", "noun"),
    ("comida", "comer", "noun"),
    ("comer", "comer", "verb"),
    ("armas", "armar", "noun"),
    ("negocios", "negociar", "noun"),
    ("esposa", "esposar", "noun"),
]
fail = 0
for surface, lemma, exp in checks:
    got = mod.guess_type(lemma, surface)
    if got != exp:
        fail += 1
        print("FAIL", surface, "->", lemma, "got", got, "exp", exp)

freq = mod.load_freq()
unique = {}
for rank, surface, lemma in freq:
    typ = mod.guess_type(lemma, surface)
    if typ != "verb":
        continue
    conj = mod.conjugate_regular(lemma)
    if conj is None and lemma in mod.IRREGULAR:
        conj = mod.IRREGULAR[lemma]
    if conj:
        unique[lemma] = conj
for v in list(mod.IRREGULAR) + list(mod.VERB_MEANINGS):
    if v not in unique:
        conj = mod.conjugate_regular(v)
        if conj:
            unique[v] = conj

bad = []
for lemma in sorted(unique):
    eng = mod.english_meaning(lemma, lemma, "verb")
    ok = bool(eng) and eng != lemma and eng != f"to {lemma}"
    if ok and not (
        eng.lower().startswith("to ")
        or "must" in eng.lower()
        or "should" in eng.lower()
        or "ought" in eng.lower()
    ):
        ok = False
    if not ok:
        bad.append((lemma, eng))

print("unique verbs", len(unique))
print("bad/missing English", len(bad))
for lemma, eng in bad:
    print(f"  {lemma:20} {eng!r}")
print("pos failures", fail)
if fail or bad:
    raise SystemExit(1)
print("OK")
