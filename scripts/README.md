# Scripts

Run from the **project root** (`Spanish/`).

| Script                    | Command                                 | Purpose                                       |
| ------------------------- | --------------------------------------- | --------------------------------------------- |
| **rebuild_cheatsheet.py** | `python scripts/rebuild_cheatsheet.py`  | **Main** — audio links + diphthong highlights |
| mark_audio_links.py       | (called by rebuild)                     | Click-to-hear + diphthongs                    |
| mark_diphthongs.py        | `python scripts/mark_diphthongs.py`     | Diphthongs only (usually not needed alone)    |
| build_top1000_excel.py    | `python scripts/build_top1000_excel.py` | Rebuild Excel workbook                        |

## What rebuild preserves

- All English meanings and table content
- Section structure (`details` / headings)
- Study notes

## What rebuild updates

- `<a class="say">` → `pronunciation_player.html?word=…`
- `<span class="diphthong">` on diphthong **letters** only

## VS Code

**Terminal → Run Task…**

- Rebuild Spanish cheat sheet markup
- Rebuild Top 1000 Excel
