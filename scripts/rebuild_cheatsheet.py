#!/usr/bin/env python3
"""
Rebuild interactive markup on spanish-cheatsheet.md:
  - click-to-hear audio links (pronunciation_player.html)
  - diphthong letter highlights

Preserves all study content (English meanings, tables, structure).

Usage (from project root):
  python scripts/rebuild_cheatsheet.py
"""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import mark_audio_links as audio


def main() -> None:
    print("Rebuilding cheat sheet markup…")
    print(f"  target: {audio.TARGET}")
    print(f"  player: {audio.PLAYER_BASE}")
    print(f"  lang:   {audio.TTS_TL}")
    audio.main()
    print("Done.")
    print("1) Start player server:  python scripts/start_player_server.py")
    print("2) Reload VS Code window + reopen Markdown preview")
    print("3) Click a Spanish word or")


if __name__ == "__main__":
    main()
