(function () {
     'use strict';

     function getAudioBaseUrl() {
          const host = window.location.hostname;
          const isLocal = host === 'localhost' || host === '127.0.0.1';
          return isLocal ? 'http://127.0.0.1:8765' : window.location.origin;
     }

     // ─── DOM refs ───
     const player = document.getElementById('audioPlayer');
     const status = document.getElementById('audioStatus');
     const serverStatus = document.getElementById('serverStatus');
     const content = document.getElementById('content');
     const ttsLang = document.getElementById('ttsLang');
     const audioCloseButton = document.getElementById('audioPlayerClose');

     function isMobileLayout() {
          return window.matchMedia('(max-width: 768px)').matches;
     }

     function setAudioPlayerVisibility(forceVisible) {
          const shouldShow = forceVisible || !isMobileLayout();
          document.body.classList.toggle('audio-player-visible', shouldShow);
     }

     function hideAudioPlayerOnMobile() {
          if (isMobileLayout()) {
               setAudioPlayerVisibility(false);
          }
     }

     function getTtsLang() {
          const allowed = { 'es-419': true, es: true };
          const fromUi = ttsLang && ttsLang.value;
          const fromStore = localStorage.getItem('ttsLang');
          const lang = fromUi || fromStore || 'es-419';
          return allowed[lang] ? lang : 'es-419';
     }

     if (ttsLang) {
          const savedLang = localStorage.getItem('ttsLang');
          if (savedLang === 'es' || savedLang === 'es-419') {
               ttsLang.value = savedLang;
          }
          ttsLang.addEventListener('change', function () {
               localStorage.setItem('ttsLang', ttsLang.value);
               if (status) {
                    status.textContent = ttsLang.value === 'es' ? 'Voice: Spain' : 'Voice: Latin America';
               }
          });
     }

     // ─── Server check ───
     async function checkServer() {
          const baseUrl = getAudioBaseUrl();
          const isLocal = baseUrl === 'http://127.0.0.1:8765';

          try {
               const resp = await fetch(baseUrl + '/', {
                    method: 'GET',
                    signal: AbortSignal.timeout(2000),
               });
               if (resp.ok || resp.status === 404) {
                    serverStatus.textContent = isLocal ? '✅ Server online' : '✅ Vercel audio API ready';
                    serverStatus.className = 'online';
               } else {
                    serverStatus.textContent = '❌ Server error';
                    serverStatus.className = 'offline';
               }
          } catch {
               serverStatus.textContent = isLocal ? '❌ Server offline — start server!' : '❌ Audio API unavailable';
               serverStatus.className = 'offline';
          }
     }
     checkServer();

     // ─── Play audio ───
     function playAudio(text, lang) {
          if (!text || !text.trim()) return;
          text = text.trim();
          lang = lang || getTtsLang();
          const url = getAudioBaseUrl() + '/api/tts?text=' + encodeURIComponent(text) + '&lang=' + encodeURIComponent(lang);
          player.src = url;
          status.textContent = '🔊 ' + (text.length > 30 ? text.substring(0, 30) + '…' : text);
          player.play().catch(err => {
               console.warn('Playback blocked:', err);
               status.textContent = '⚠️ Click play button';
          });
          player.onended = function () {
               document.querySelectorAll('.say.playing').forEach(el => el.classList.remove('playing'));
               status.textContent = 'Ready';
          };

          player.onpause = function () {
               if (player.ended || player.currentTime >= player.duration - 0.05) {
                    // leave the player open so the user can replay by clicking the word again
               }
          };
     }

     if (audioCloseButton) {
          audioCloseButton.addEventListener('click', function () {
               hideAudioPlayerOnMobile();
               document.querySelectorAll('.say.playing').forEach(el => el.classList.remove('playing'));
          });
     }

     // ─── Click handler for audio ───
     document.addEventListener('click', function (e) {
          const close = e.target.closest('#audioPlayerClose');
          if (close) return;

          const target = e.target.closest('.say');
          if (!target) return;
          e.preventDefault();
          setAudioPlayerVisibility(true);
          let text = target.getAttribute('data-text') || target.textContent.trim();
          text = text.replace(/[🔊📢🎵▶️⏸️]/g, '').trim();
          if (text) {
               document.querySelectorAll('.say.playing').forEach(el => el.classList.remove('playing'));
               target.classList.add('playing');
               playAudio(text);
          }
     });

     // ─── Keyboard: Enter on .say ───
     document.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          const target = e.target.closest('.say');
          if (!target) return;
          e.preventDefault();
          target.click();
     });

     // ─── Diphthong underlines (spoken vowel glides in Spanish words) ───
     // Hiatus (día, país) and silent u (que/qui/gue/gui) are not marked.
     const DIPHTHONG_RE = /üe|üi|ái|áu|éi|éu|ói|óu|iá|ié|ió|uá|ué|uó|ai|au|ei|eu|oi|ou|ia|ie|io|iu|ua|ue|ui|uo|ay|ey|oy|uy/gi;
     const HIATUS_RE = /ía|íe|ío|íu|úa|úe|úi|úo|uí|iú|aí|eí|oí|aú|eú|oú/gi;
     const SILENT_U_RE = /[qg]u(?=[eéií])/gi;
     const Y_DIPHTHONGS = { ay: true, ey: true, oy: true, uy: true };
     const VOWEL_RE = /[aeiouáéíóúü]/i;
     const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

     function allMatches(re, text) {
          return Array.from(String(text).matchAll(new RegExp(re.source, re.flags)));
     }

     function spansOverlap(a, b) {
          return !(a[1] <= b[0] || b[1] <= a[0]);
     }

     function findDiphthongSpans(word) {
          const blocked = new Array(word.length).fill(false);
          allMatches(HIATUS_RE, word).forEach(m => {
               for (let i = m.index; i < m.index + m[0].length; i++) blocked[i] = true;
          });
          allMatches(SILENT_U_RE, word).forEach(m => {
               blocked[m.index + m[0].length - 1] = true;
          });

          const candidates = [];
          const dipRe = new RegExp(DIPHTHONG_RE.source, 'gi');
          for (let i = 0; i < word.length; i++) {
               dipRe.lastIndex = i;
               const m = dipRe.exec(word);
               if (!m || m.index !== i) continue;
               const start = i;
               const end = start + m[0].length;
               if (Y_DIPHTHONGS[m[0].toLowerCase()]) {
                    const next = word[end];
                    if (next && VOWEL_RE.test(next)) continue;
               }
               let hitBlocked = false;
               for (let j = start; j < end; j++) {
                    if (blocked[j]) {
                         hitBlocked = true;
                         break;
                    }
               }
               if (hitBlocked) continue;
               candidates.push([start, end]);
          }

          candidates.sort((a, b) => a[0] - b[0] || b[1] - b[0] - (a[1] - a[0]));
          const chosen = [];
          candidates.forEach(span => {
               if (chosen.some(c => spansOverlap(span, c))) return;
               chosen.push(span);
          });
          chosen.sort((a, b) => a[0] - b[0]);
          return chosen;
     }

     function highlightTextNode(node) {
          const text = node.nodeValue;
          if (!text || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(text)) return;

          const frag = document.createDocumentFragment();
          let last = 0;
          let changed = false;
          let match;
          const wordRe = new RegExp(WORD_RE.source, 'g');
          while ((match = wordRe.exec(text))) {
               const word = match[0];
               const idx = match.index;
               if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
               const spans = findDiphthongSpans(word);
               if (!spans.length) {
                    frag.appendChild(document.createTextNode(word));
               } else {
                    changed = true;
                    let i = 0;
                    spans.forEach(([start, end]) => {
                         if (start > i) frag.appendChild(document.createTextNode(word.slice(i, start)));
                         const el = document.createElement('span');
                         el.className = 'diphthong';
                         el.textContent = word.slice(start, end);
                         frag.appendChild(el);
                         i = end;
                    });
                    if (i < word.length) frag.appendChild(document.createTextNode(word.slice(i)));
               }
               last = idx + word.length;
          }
          if (!changed) return;
          if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
          node.parentNode.replaceChild(frag, node);
     }

     function highlightDiphthongs(root) {
          if (!root) return;
          root.querySelectorAll('.say').forEach(el => {
               if (el.querySelector('.diphthong')) return;
               const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
               const nodes = [];
               while (walker.nextNode()) {
                    if (walker.currentNode.parentElement && walker.currentNode.parentElement.closest('.diphthong')) continue;
                    nodes.push(walker.currentNode);
               }
               nodes.forEach(highlightTextNode);
          });
     }

     function nounGenderClass(text) {
          const t = String(text || '').trim();
          if (!t) return '';

          const normalized = t
               .toLowerCase()
               .replace(/^[“"'«]+|[”"'»]+$/g, '')
               .replace(/\s+/g, ' ');
          if (!normalized) return '';

          const first = normalized.match(/^(el|la|los|las|un|una|unos|unas|lo)\b/);
          if (!first) return '';

          switch (first[1]) {
               case 'el':
               case 'los':
               case 'un':
               case 'unos':
                    return 'noun-masc';
               case 'lo':
                    return 'noun-neuter';
               default:
                    return 'noun-fem';
          }
     }

     function applyNounColors(root) {
          if (!root) return;
          root.querySelectorAll('.say').forEach(el => {
               if (el.dataset.nounColorApplied === 'true') return;
               const text = el.getAttribute('data-text') || el.textContent || '';
               const cls = nounGenderClass(text);
               if (!cls) return;
               el.classList.add(cls);
               el.dataset.nounColorApplied = 'true';
          });
     }

     const SEE_ALSO = {
          'pronunciation-basics/alphabet': [
               { id: 'pronunciation-basics/vowels', label: 'Vowels' },
               { id: 'pronunciation-basics/pronunciation', label: 'Pronunciation' },
               { id: 'pronunciation-basics/accent-stress', label: 'Accent & Stress' },
          ],
          'pronunciation-basics/vowels': [
               { id: 'pronunciation-basics/diphthongs', label: 'Diphthongs' },
               { id: 'pronunciation-basics/accent-stress', label: 'Accent & Stress' },
          ],
          'pronunciation-basics/pronunciation': [
               { id: 'pronunciation-basics/alphabet', label: 'Alphabet' },
               { id: 'pronunciation-basics/diphthongs', label: 'Diphthongs' },
               { id: 'pronunciation-basics/accent-stress', label: 'Accent & Stress' },
          ],
          'pronunciation-basics/diphthongs': [
               { id: 'pronunciation-basics/vowels', label: 'Vowels' },
               { id: 'pronunciation-basics/accent-stress', label: 'Accent & Stress' },
          ],
          'pronunciation-basics/accent-stress': [
               { id: 'pronunciation-basics/diphthongs', label: 'Diphthongs' },
               { id: 'grammar-core/question-words', label: 'Question Words' },
          ],
          'verbs/verbs': [
               { id: 'verbs/irregular-verbs', label: 'Irregular Verbs' },
               { id: 'tense/tense-conjugations', label: 'Tense Conjugations' },
          ],
          'verbs/irregular-verbs': [
               { id: 'verbs/verbs', label: 'Verbs' },
               { id: 'verbs/poder', label: 'Poder' },
               { id: 'verbs/querer', label: 'Querer' },
               { id: 'verbs/decir', label: 'Decir' },
          ],
          'verbs/ser-estar': [
               { id: 'verbs/hacer', label: 'Hacer' },
               { id: 'verbs/tener', label: 'Tener' },
               { id: 'vocabulary/weather', label: 'Weather' },
          ],
          'verbs/hacer': [
               { id: 'verbs/ser-estar', label: 'Ser - Estar' },
               { id: 'vocabulary/weather', label: 'Weather' },
          ],
          'verbs/tener': [
               { id: 'grammar-core/obligation', label: 'Obligation' },
               { id: 'verbs/ser-estar', label: 'Ser - Estar' },
          ],
          'grammar-core/nouns': [
               { id: 'grammar-core/gender', label: 'Gender' },
               { id: 'grammar-core/plural-rules', label: 'Plural Rules' },
          ],
          'grammar-core/gender': [
               { id: 'grammar-core/nouns', label: 'Nouns' },
               { id: 'grammar-core/adjectives', label: 'Adjectives' },
          ],
          'grammar-core/plural-rules': [
               { id: 'grammar-core/nouns', label: 'Nouns' },
               { id: 'grammar-core/gender', label: 'Gender' },
          ],
          'grammar-core/pronouns': [
               { id: 'grammar-core/pronoun-placement', label: 'Pronoun Placement' },
               { id: 'verbs/gustar', label: 'Gustar' },
               { id: 'grammar-core/tu-usted-vos', label: 'Tú / Usted / Vos' },
          ],
          conjunctions: [
               { id: 'adverbs', label: 'Adverbs' },
               { id: 'subjunctive-triggers', label: 'Subjunctive Triggers' },
          ],
          adverbs: [
               { id: 'adjectives', label: 'Adjectives' },
               { id: 'conjunctions', label: 'Conjunctions' },
          ],
          adjectives: [
               { id: 'gender', label: 'Gender' },
               { id: 'comparisons', label: 'Comparisons' },
               { id: 'adverbs', label: 'Adverbs' },
          ],
          prepositions: [
               { id: 'por-para', label: 'Por vs Para' },
               { id: 'personal-a', label: 'Personal A' },
          ],
          'question-words': [
               { id: 'accent-stress', label: 'Accent & Stress' },
               { id: 'negation', label: 'Negation' },
          ],
          'por-para': [{ id: 'prepositions', label: 'Prepositions' }],
          ir: [
               { id: 'tense/informal-future-tense', label: 'Informal Future' },
               { id: 'directions-places', label: 'Directions & Places' },
               { id: 'travel', label: 'Travel & Hotel' },
          ],
          gustar: [
               { id: 'pronouns', label: 'Pronouns' },
               { id: 'emotions', label: 'Emotions' },
          ],
          haber: [
               { id: 'obligation', label: 'Obligation' },
               { id: 'tense/present-perfect-tense', label: 'Present Perfect' },
          ],
          comparisons: [{ id: 'adjectives', label: 'Adjectives' }],
          negation: [{ id: 'question-words', label: 'Question Words' }],
          'personal-a': [
               { id: 'prepositions', label: 'Prepositions' },
               { id: 'pronouns', label: 'Pronouns' },
          ],
          diminutives: [
               { id: 'nouns', label: 'Nouns' },
               { id: 'adjectives', label: 'Adjectives' },
          ],
          obligation: [
               { id: 'tener', label: 'Tener' },
               { id: 'haber', label: 'Haber / Hay' },
          ],
          'passive-se': [
               { id: 'pronouns', label: 'Pronouns' },
               { id: 'pronoun-placement', label: 'Pronoun Placement' },
          ],
          poder: [
               { id: 'querer', label: 'Querer' },
               { id: 'irregular-verbs', label: 'Irregular Verbs' },
          ],
          querer: [
               { id: 'poder', label: 'Poder' },
               { id: 'subjunctive-triggers', label: 'Subjunctive Triggers' },
          ],
          decir: [
               { id: 'irregular-verbs', label: 'Irregular Verbs' },
               { id: 'pronoun-placement', label: 'Pronoun Placement' },
          ],
          'tu-usted-vos': [
               { id: 'pronouns', label: 'Pronouns' },
               { id: 'tense/affirmative-imperative', label: 'Affirmative Imperative' },
          ],
          'subjunctive-triggers': [
               { id: 'tense/present-subjective-tense', label: 'Present Subjunctive' },
               { id: 'querer', label: 'Querer' },
               { id: 'conjunctions', label: 'Conjunctions' },
          ],
          'pronoun-placement': [
               { id: 'pronouns', label: 'Pronouns' },
               { id: 'tense/affirmative-imperative', label: 'Affirmative Imperative' },
               { id: 'tense/negative-imperative', label: 'Negative Imperative' },
          ],
          'false-friends': [
               { id: 'adjectives', label: 'Adjectives' },
               { id: 'emotions', label: 'Emotions' },
          ],
          'tense/tense-conjugations': [
               { id: 'verbs', label: 'Verbs' },
               { id: 'tense/preterite-vs-imperfect', label: 'Preterite vs Imperfect' },
          ],
          'tense/preterite-tense': [
               { id: 'tense/imperfect-tense', label: 'Imperfect Tense' },
               { id: 'tense/preterite-vs-imperfect', label: 'Preterite vs Imperfect' },
          ],
          'tense/imperfect-tense': [
               { id: 'tense/preterite-tense', label: 'Preterite Tense' },
               { id: 'tense/preterite-vs-imperfect', label: 'Preterite vs Imperfect' },
          ],
          'tense/informal-future-tense': [
               { id: 'ir', label: 'Ir' },
               { id: 'tense/future-tense', label: 'Future Tense' },
          ],
          'tense/present-subjective-tense': [
               { id: 'subjunctive-triggers', label: 'Subjunctive Triggers' },
               { id: 'tense/imperfect-subjective-tense', label: 'Imperfect Subjunctive' },
          ],
          'tense/imperfect-subjective-tense': [
               { id: 'subjunctive-triggers', label: 'Subjunctive Triggers' },
               { id: 'tense/present-subjective-tense', label: 'Present Subjunctive' },
          ],
          'tense/present-perfect-tense': [{ id: 'haber', label: 'Haber / Hay' }],
          'tense/preterite-vs-imperfect': [
               { id: 'tense/preterite-tense', label: 'Preterite Tense' },
               { id: 'tense/imperfect-tense', label: 'Imperfect Tense' },
          ],
          'tense/affirmative-imperative': [
               { id: 'tense/negative-imperative', label: 'Negative Imperative' },
               { id: 'pronoun-placement', label: 'Pronoun Placement' },
          ],
          'tense/negative-imperative': [
               { id: 'tense/affirmative-imperative', label: 'Affirmative Imperative' },
               { id: 'negation', label: 'Negation' },
          ],
          'directions-places': [
               { id: 'travel', label: 'Travel & Hotel' },
               { id: 'prepositions', label: 'Prepositions' },
               { id: 'ir', label: 'Ir' },
          ],
          numbers: [{ id: 'time-calendar', label: 'Time & Calendar' }],
          'time-calendar': [
               { id: 'numbers', label: 'Numbers' },
               { id: 'weather', label: 'Weather' },
          ],
          greetings: [
               { id: 'tu-usted-vos', label: 'Tú / Usted / Vos' },
               { id: 'emotions', label: 'Emotions' },
          ],
          family: [{ id: 'greetings', label: 'Greetings' }],
          food: [{ id: 'shopping', label: 'Shopping & Money' }],
          body: [
               { id: 'emotions', label: 'Emotions' },
               { id: 'gustar', label: 'Gustar' },
          ],
          house: [{ id: 'directions-places', label: 'Directions & Places' }],
          weather: [
               { id: 'hacer', label: 'Hacer' },
               { id: 'ser-estar', label: 'Ser - Estar' },
               { id: 'clothing', label: 'Clothing' },
          ],
          shopping: [
               { id: 'numbers', label: 'Numbers' },
               { id: 'food', label: 'Food & Drink' },
          ],
          'work-school': [{ id: 'obligation', label: 'Obligation' }],
          clothing: [
               { id: 'weather', label: 'Weather' },
               { id: 'shopping', label: 'Shopping & Money' },
          ],
          animals: [{ id: 'family', label: 'Family' }],
          emotions: [
               { id: 'gustar', label: 'Gustar' },
               { id: 'body', label: 'Body' },
               { id: 'false-friends', label: 'False Friends' },
          ],
          travel: [
               { id: 'directions-places', label: 'Directions & Places' },
               { id: 'ir', label: 'Ir' },
               { id: 'greetings', label: 'Greetings' },
          ],
     };

     let currentSectionId = '';
     let searchIndex = null;
     let searchIndexPromise = null;

     function currentSearchQuery() {
          const box = document.getElementById('navSearch');
          return (box && box.value ? box.value : '').trim();
     }

     function isExactSearch() {
          const box = document.getElementById('searchExact');
          return !!(box && box.checked);
     }

     function searchWords(text) {
          return (
               String(text || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .match(/[a-z0-9]+/g) || []
          );
     }

     function hasExactMatch(text, query) {
          const qWords = searchWords(query);
          if (!qWords.length) return false;
          const words = searchWords(text);
          if (qWords.length === 1) return words.includes(qWords[0]);
          for (let i = 0; i <= words.length - qWords.length; i++) {
               let ok = true;
               for (let j = 0; j < qWords.length; j++) {
                    if (words[i + j] !== qWords[j]) {
                         ok = false;
                         break;
                    }
               }
               if (ok) return true;
          }
          return false;
     }

     function isPronunciationHeader(text) {
          const t = (text || '').trim();
          if (/english/i.test(t)) return false;
          return /pronunciation|sound guide|^latam$|^spain\b|^pron\./i.test(t);
     }

     function applyColumnHides() {
          const hideEn = localStorage.getItem('hideEnglish') === 'true';
          const hidePron = localStorage.getItem('hidePronunciation') === 'true';
          const enBox = document.getElementById('hideEnglish');
          const pronBox = document.getElementById('hidePronunciation');
          if (enBox) enBox.checked = hideEn;
          if (pronBox) pronBox.checked = hidePron;

          // Hide inline pronunciation spans such as <span class="secondary">pehn-SAHR</span>
          // and <span class="pronunciation">OH-lah</span> when the user toggles the checkbox,
          // while keeping the existing table-column behavior.
          content.querySelectorAll('.secondary, .pronunciation').forEach(el => {
               el.style.display = hidePron ? 'none' : '';
          });

          content.querySelectorAll('table').forEach(table => {
               const enIdxs = [];
               const pronIdxs = [];
               table.querySelectorAll('thead th').forEach((th, i) => {
                    const t = th.textContent || '';
                    if (/english/i.test(t)) enIdxs.push(i);
                    else if (isPronunciationHeader(t)) pronIdxs.push(i);
               });
               table.querySelectorAll('tr').forEach(tr => {
                    const cells = tr.children;
                    enIdxs.forEach(i => {
                         if (cells[i]) cells[i].style.display = hideEn ? 'none' : '';
                    });
                    pronIdxs.forEach(i => {
                         if (cells[i]) cells[i].style.display = hidePron ? 'none' : '';
                    });
               });
          });
     }

     function normalizeSearchText(text) {
          return String(text || '')
               .toLowerCase()
               .normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '')
               .replace(/[^a-z0-9\s]/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();
     }

     function findFirstTextMatch(query) {
          const q = normalizeSearchText(query);
          if (!q) return null;
          const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null);
          let node;
          while ((node = walker.nextNode())) {
               const text = node.nodeValue || '';
               const clean = normalizeSearchText(text);
               if (clean && clean.includes(q)) {
                    const parent = node.parentElement;
                    if (parent && parent.offsetParent !== null) return parent;
                    return parent || content;
               }
          }
          return null;
     }

     function applySearchHits(query) {
          content.querySelectorAll('.search-hit').forEach(el => el.classList.remove('search-hit'));
          const q = (query || '').trim().toLowerCase();
          const exact = isExactSearch();
          if (!q || (!exact && q.length < 2)) return 0;
          let n = 0;

          content.querySelectorAll('.say').forEach(el => {
               const t = el.getAttribute('data-text') || el.textContent || '';
               const hit = exact ? hasExactMatch(t, q) : t.toLowerCase().includes(q);
               if (hit) {
                    el.classList.add('search-hit');
                    n++;
               }
          });

          const textMatches = content.querySelectorAll('td, li, p, h1, h2, h3, summary, th');
          textMatches.forEach(node => {
               const text = (node.textContent || '').toLowerCase();
               if (!text) return;
               if ((exact && hasExactMatch(text, q)) || (!exact && text.includes(q))) {
                    if (node && node.scrollIntoView) {
                         node.classList && node.classList.add('search-hit');
                    }
                    n++;
               }
          });

          const first = content.querySelector('.search-hit') || findFirstTextMatch(q);
          if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return n;
     }

     function cleanStudyText(s) {
          return String(s || '')
               .replace(/[🔊📢🎵▶️⏸️]/g, '')
               .replace(/\s+/g, ' ')
               .trim();
     }

     function colKind(header) {
          const h = String(header || '')
               .replace(/\s+/g, ' ')
               .trim()
               .toLowerCase();
          if (!/spanish/.test(h) && (/\benglish\b/.test(h) || /^meaning$/.test(h) || /^meaning\b/.test(h))) return 'en';
          if (isPronunciationHeader(header) || /say it like/.test(h)) return 'pron';
          if (/^use$|^choose$/.test(h)) return 'use';
          if (/ask yourself/.test(h)) return 'ask';
          if (/irregular\s*yo|^yo form$|^yo$/.test(h)) return 'yo';
          if (/^infinitive$|^verb$|prefixed verb/.test(h)) return 'inf';
          if (/^base verb$|^notes$|stem change|conjugation pattern/.test(h)) return 'skip';
          if (/^(tú|tu|él|ella|ud\.|usted|nosotros|vosotros|ellos|ellas|uds)\b/.test(h)) return 'person';
          if (/^spanish\b|^example$|^word$|^masculine$|^feminine$|^letter$|^spelling$/.test(h)) return 'es';
          return 'other';
     }

     function looksPhonetic(t) {
          return /[A-Z]{3,}-[A-Z]|AH-|EH-|OH-|EE-|OO-|BWEH|GRAH-|\bLatAm\b.*-/.test(t);
     }

     function sayTexts(cell) {
          if (!cell) return [];
          const found = [];
          cell.querySelectorAll('.say').forEach(el => {
               const t = cleanStudyText(el.getAttribute('data-text') || el.textContent);
               if (t && t.length <= 48) found.push(t);
          });
          return found;
     }

     function firstSay(cell) {
          const found = sayTexts(cell);
          return found.length ? found[0] : '';
     }

     function isIrregularYoColumn(header, sectionId) {
          const h = String(header || '')
               .replace(/\s+/g, ' ')
               .trim()
               .toLowerCase();
          if (/irregular\s*yo/.test(h)) return true;
          const onIrregPage = /(^|\/)irregular-verbs$/.test(String(sectionId || ''));
          return onIrregPage && (/^yo form$/.test(h) || /^yo$/.test(h));
     }

     function glossFromItems(items) {
          const gloss = {};
          (items || []).forEach(function (it) {
               if (!it || it.kind !== 'pair' || !it.spanish) return;
               const rec = gloss[it.spanish] || {};
               if (it.irregularYo || it.role === 'yo') {
                    rec.yoForm = true;
                    rec.irregularYo = !!it.irregularYo;
                    if (it.infinitive) rec.infinitive = it.infinitive;
                    if (it.meaning) rec.meaning = it.meaning;
               } else if (it.english && !rec.meaning) {
                    rec.meaning = it.english;
               }
               if (it.yoForm) rec.linkedYo = it.yoForm;
               gloss[it.spanish] = rec;
          });
          return gloss;
     }

     function collectQuizItems(root, sectionId) {
          const items = [];
          const seen = {};

          function addItem(item) {
               if (!item) return;
               const prompt = cleanStudyText(item.prompt || item.english || '');
               const answer = cleanStudyText(item.answer || item.spanish || '');
               if (!prompt || !answer) return;
               if (prompt.toLowerCase() === answer.toLowerCase()) return;
               if (prompt.length > 140 || answer.length > 80) return;
               const key = (item.kind + '|' + prompt + '|' + answer).toLowerCase();
               if (seen[key]) return;
               seen[key] = true;
               item.sectionId = sectionId;
               items.push(item);
          }

          root.querySelectorAll('table').forEach((table, tableIdx) => {
               const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
               if (!headerRow) return;
               const headers = Array.from(headerRow.children).map(h => (h.textContent || '').replace(/\s+/g, ' ').trim());
               const kinds = headers.map(colKind);
               const bodyRows = table.querySelectorAll('tbody tr');
               const rows = bodyRows.length ? bodyRows : Array.from(table.querySelectorAll('tr')).slice(1);

               rows.forEach(tr => {
                    const cells = Array.from(tr.children);
                    if (!cells.length) return;

                    const askIdx = kinds.indexOf('ask');
                    const useIdx = kinds.indexOf('use');
                    if (askIdx >= 0 && useIdx >= 0 && cells[askIdx] && cells[useIdx]) {
                         const prompt = cleanStudyText(cells[askIdx].textContent);
                         const useSays = sayTexts(cells[useIdx]);
                         const answer = useSays[0] || cleanStudyText(cells[useIdx].textContent);
                         if (prompt && answer && answer.length <= 32) {
                              addItem({
                                   kind: 'choice',
                                   prompt: prompt,
                                   answer: answer,
                                   group: 't' + tableIdx,
                              });
                         }
                    }

                    function nearestEn(fromIdx) {
                         for (let j = fromIdx + 1; j < kinds.length; j++) {
                              if (kinds[j] === 'en') return j;
                         }
                         for (let j = fromIdx - 1; j >= 0; j--) {
                              if (kinds[j] === 'en') return j;
                         }
                         return -1;
                    }

                    const infIdx = kinds.indexOf('inf');
                    const yoIdx = kinds.indexOf('yo');
                    const enIdx = kinds.indexOf('en');
                    let notesIdx = -1;
                    kinds.forEach(function (k, i) {
                         if (k === 'skip' && /notes|stem change|conjugation pattern/i.test(headers[i] || '')) notesIdx = i;
                    });
                    const handledVerbYo = infIdx >= 0 && yoIdx >= 0 && enIdx >= 0 && cells[infIdx] && cells[yoIdx] && cells[enIdx];

                    if (handledVerbYo) {
                         const inf = firstSay(cells[infIdx]) || cleanStudyText(cells[infIdx].textContent);
                         const yo = firstSay(cells[yoIdx]);
                         const meaning = cleanStudyText(cells[enIdx].textContent);
                         const notes = notesIdx >= 0 && cells[notesIdx] ? cleanStudyText(cells[notesIdx].textContent) : '';
                         const yoRegular = /regular in present/i.test(notes);
                         if (inf && meaning && meaning !== '-' && !looksPhonetic(meaning) && inf.length <= 48) {
                              addItem({
                                   kind: 'pair',
                                   spanish: inf,
                                   english: meaning,
                                   prompt: meaning,
                                   answer: inf,
                                   role: 'infinitive',
                                   yoForm: yoRegular ? '' : yo,
                              });
                         }
                         if (yo && meaning && !yoRegular && yo !== inf && meaning !== '-' && !looksPhonetic(meaning) && yo.length <= 48) {
                              const irreg = isIrregularYoColumn(headers[yoIdx], sectionId);
                              const label = irreg ? 'irregular yo of ' : 'yo form of ';
                              addItem({
                                   kind: 'pair',
                                   spanish: yo,
                                   english: label + inf + ' (' + meaning + ')',
                                   prompt: label + inf + ' (' + meaning + ')',
                                   answer: yo,
                                   role: 'yo',
                                   irregularYo: irreg,
                                   infinitive: inf,
                                   meaning: meaning,
                              });
                         }
                         return;
                    }

                    const hasEs = kinds.indexOf('es') !== -1;
                    cells.forEach(function (cell, i) {
                         if (!cell) return;
                         if (kinds[i] === 'en' || kinds[i] === 'pron' || kinds[i] === 'ask' || kinds[i] === 'use') return;
                         if (kinds[i] === 'yo' || kinds[i] === 'person' || kinds[i] === 'skip') return;
                         if (hasEs && kinds[i] !== 'es') return;
                         const says = sayTexts(cell);
                         if (!says.length) return;
                         const enAt = nearestEn(i);
                         if (enAt < 0 || !cells[enAt]) return;
                         let english = cleanStudyText(cells[enAt].textContent);
                         if (!english || english === '-' || looksPhonetic(english)) return;
                         says.forEach(function (es) {
                              if (!es || es.length > 48) return;
                              addItem({
                                   kind: 'pair',
                                   spanish: es,
                                   english: english,
                                   prompt: english,
                                   answer: es,
                              });
                         });
                    });
               });
          });

          return items;
     }

     function addPageToolbar(sectionId) {
          const bar = document.createElement('div');
          bar.className = 'page-toolbar';
          // bar.innerHTML = '<div class="page-toolbar-header">Page options</div>' + '<div class="page-toolbar-row"><label><input type="checkbox" id="hideEnglish" /> Hide English</label><label><input type="checkbox" id="hidePronunciation" /> Hide Pronunciation</label><button type="button" id="practicePageBtn">🎲 Practice this page</button><button type="button" id="quizPageBtn">📝 Quiz this page</button></div>';
          bar.innerHTML = '<div class="page-toolbar-header">Page Options</div>' + '<div class="page-toolbar-row"><label><input type="checkbox" id="hideEnglish" /> Hide EN</label><label><input type="checkbox" id="hidePronunciation" /> Hide PR</label><button type="button" id="practicePageBtn">🎲 Practice</button><button type="button" id="quizPageBtn">📝 Quiz</button></div>';
          content.insertBefore(bar, content.firstChild);
          const hideBox = document.getElementById('hideEnglish');
          hideBox.checked = localStorage.getItem('hideEnglish') === 'true';
          hideBox.addEventListener('change', function () {
               localStorage.setItem('hideEnglish', this.checked ? 'true' : 'false');
               applyColumnHides();
          });
          const hidePronBox = document.getElementById('hidePronunciation');
          hidePronBox.checked = localStorage.getItem('hidePronunciation') === 'true';
          hidePronBox.addEventListener('change', function () {
               localStorage.setItem('hidePronunciation', this.checked ? 'true' : 'false');
               applyColumnHides();
          });
          function collectPageWords() {
               const words = [];
               const seen = {};
               content.querySelectorAll('.say').forEach(el => {
                    let t = (el.getAttribute('data-text') || '').trim();
                    t = t.replace(/[🔊📢🎵▶️⏸️]/g, '').trim();
                    if (!t || t.length > 48) return;
                    const key = t.toLowerCase();
                    if (seen[key]) return;
                    seen[key] = true;
                    words.push(t);
               });
               return words;
          }

          function pageTitle() {
               const h1 = content.querySelector('h1');
               const t = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';
               return t || sectionId;
          }

          function launchStudy(opts) {
               const items = opts.items || [];
               const payload = {
                    sectionId: sectionId,
                    label: pageTitle(),
                    items: items,
                    pairs: opts.pairs || [],
                    words: opts.words || [],
                    gloss: opts.gloss || glossFromItems(items),
                    ts: Date.now(),
               };
               try {
                    localStorage.setItem('sp_launch', JSON.stringify(payload));
                    sessionStorage.setItem('sp_page_quiz', JSON.stringify({ sectionId: payload.sectionId, label: payload.label, items: payload.items }));
                    sessionStorage.setItem('sp_page_pairs', JSON.stringify(payload.pairs));
                    sessionStorage.setItem('sp_page_pool', JSON.stringify(payload.words));
                    sessionStorage.setItem('sp_page_label', payload.label);
                    sessionStorage.setItem('sp_page_gloss', JSON.stringify(payload.gloss || {}));
               } catch (err) {
                    console.warn('Could not save study launch', err);
               }
               const q = opts.mode === 'quiz' ? 'mode=quiz&from=page' : 'pool=page&from=page';
               window.open('spanish-practice.html?' + q, '_blank', 'noopener');
          }

          function pageStudyPayload() {
               const items = collectQuizItems(content, sectionId);
               const words = collectPageWords();
               const pairs = items
                    .filter(it => it.kind === 'pair' && it.spanish && it.english)
                    .map(it => ({
                         spanish: it.spanish,
                         english: it.english,
                         role: it.role || '',
                         irregularYo: !!it.irregularYo,
                         infinitive: it.infinitive || '',
                         meaning: it.meaning || '',
                         yoForm: it.yoForm || '',
                    }));
               return { items: items, words: words, pairs: pairs, gloss: glossFromItems(items) };
          }

          document.getElementById('practicePageBtn').addEventListener('click', function () {
               const payload = pageStudyPayload();
               if (!payload.words.length) {
                    alert('No practice words on this page yet.');
                    return;
               }
               launchStudy({ mode: 'practice', words: payload.words, items: payload.items, pairs: payload.pairs, gloss: payload.gloss });
          });
          document.getElementById('quizPageBtn').addEventListener('click', function () {
               const payload = pageStudyPayload();
               if (!payload.items.length) {
                    alert('No quiz items on this page yet. Try a vocab or grammar table with English meanings.');
                    return;
               }
               launchStudy({ mode: 'quiz', items: payload.items, pairs: payload.pairs, words: payload.words, gloss: payload.gloss });
          });
     }

     const SECTION_ALIASES = {
          decir: 'verbs/decir',
          'ser-estar': 'verbs/ser-estar',
          'tu-usted-vos': 'grammar-core/tu-usted-vos',
     };

     function canonicalSectionId(sectionId) {
          if (SECTION_ALIASES[sectionId]) return SECTION_ALIASES[sectionId];
          const exact = Array.from(navItems).find(item => item.dataset.section === sectionId);
          if (exact) return exact.dataset.section;
          const matches = Array.from(navItems).filter(item => item.dataset.section.endsWith('/' + sectionId));
          return matches.length === 1 ? matches[0].dataset.section : sectionId;
     }

     function getSeeAlso(sectionId) {
          const canonicalId = canonicalSectionId(sectionId);
          if (SEE_ALSO[canonicalId]) return SEE_ALSO[canonicalId];
          const legacyKey = Object.keys(SEE_ALSO).find(key => canonicalSectionId(key) === canonicalId);
          return legacyKey ? SEE_ALSO[legacyKey] : undefined;
     }

     function addSeeAlso(sectionId) {
          const links = getSeeAlso(sectionId);
          if (!links || !links.length || content.querySelector('.see-also')) return;
          const wrap = document.createElement('details');
          wrap.className = 'see-also';
          wrap.open = true;
          const summary = document.createElement('summary');
          summary.innerHTML = '<strong>See also</strong>';
          wrap.appendChild(summary);
          const row = document.createElement('div');
          row.className = 'see-also-links';
          links.forEach(link => {
               if (link.id === 'deber') return;
               const btn = document.createElement('button');
               btn.type = 'button';
               btn.className = 'see-also-link';
               btn.dataset.section = canonicalSectionId(link.id);
               btn.textContent = link.label;
               row.appendChild(btn);
          });
          wrap.appendChild(row);
          content.appendChild(wrap);
     }

     function ensureSearchIndex() {
          if (searchIndex) return Promise.resolve(searchIndex);
          if (searchIndexPromise) return searchIndexPromise;
          searchIndexPromise = Promise.all(
               Array.from(navItems).map(item => {
                    const id = item.dataset.section;
                    const label = item.textContent.replace(/\s+/g, ' ').trim();
                    return fetch('sections/' + id + '.html')
                         .then(r => (r.ok ? r.text() : ''))
                         .then(html => {
                              const parser = new DOMParser();
                              const doc = parser.parseFromString(html, 'text/html');
                              const bodyText = (doc.body ? doc.body.textContent : html).replace(/\s+/g, ' ').trim();
                              return {
                                   id,
                                   label,
                                   blob: (label + ' ' + bodyText).toLowerCase(),
                              };
                         })
                         .catch(() => ({ id, label, blob: label.toLowerCase() }));
               })
          ).then(rows => {
               searchIndex = rows;
               return searchIndex;
          });
          return searchIndexPromise;
     }

     function filterNav(query) {
          const q = (query || '').trim().toLowerCase();
          const empty = document.getElementById('searchEmpty');
          navItems.forEach(item => item.classList.remove('search-hidden'));
          document.querySelectorAll('.category-toggle, .category-items').forEach(el => {
               el.classList.remove('search-hidden');
          });
          if (!q) {
               if (empty) empty.hidden = true;
               document.querySelectorAll('.category-toggle').forEach(toggle => {
                    const saved = localStorage.getItem('category-' + toggle.dataset.category);
                    const items = document.querySelector('.category-items[data-category="' + toggle.dataset.category + '"]');
                    const open = saved === 'open';
                    toggle.classList.toggle('open', open);
                    if (items) items.classList.toggle('open', open);
               });
               return;
          }
          const indexMap = {};
          (searchIndex || []).forEach(row => {
               indexMap[row.id] = row.blob;
          });
          let shown = 0;
          const exact = isExactSearch();
          navItems.forEach(item => {
               const id = item.dataset.section;
               const label = item.textContent.toLowerCase();
               const blob = indexMap[id] || label;
               const match = exact ? hasExactMatch(label, q) || hasExactMatch(blob, q) : label.includes(q) || blob.includes(q);
               item.classList.toggle('search-hidden', !match);
               if (match) shown++;
          });
          document.querySelectorAll('.category-items').forEach(group => {
               const any = group.querySelector('.nav-item:not(.search-hidden)');
               const toggle = document.querySelector('.category-toggle[data-category="' + group.dataset.category + '"]');
               if (!any) {
                    group.classList.add('search-hidden');
                    if (toggle) toggle.classList.add('search-hidden');
               } else {
                    group.classList.add('open');
                    if (toggle) toggle.classList.add('open');
               }
          });
          if (empty) empty.hidden = shown > 0;
     }

     // ─── Navigation: load sections dynamically ───
     const navItems = document.querySelectorAll('.nav-item');

     async function loadSection(sectionId) {
          try {
               const response = await fetch(`sections/${sectionId}.html`);
               if (!response.ok) throw new Error(`Failed to load ${sectionId}`);
               const html = await response.text();
               content.innerHTML = html;
               highlightDiphthongs(content);
               applyNounColors(content);
               currentSectionId = sectionId;
               addPageToolbar(sectionId);
               addSeeAlso(sectionId);
               applyColumnHides();
               applySearchHits(currentSearchQuery());

               // Re-attach click handlers for .say elements in new content
               // (The event listener is already on document, so it works)

               // Restore details open/close state
               document.querySelectorAll('#content details').forEach(detail => {
                    if (detail.classList.contains('see-also')) return;
                    const summary = detail.querySelector('summary');
                    const key = 'details-' + (summary?.textContent?.trim()?.slice(0, 50) || 'unknown');
                    const savedState = localStorage.getItem(key);
                    if (savedState === 'open') {
                         detail.open = true;
                    } else if (savedState === 'closed') {
                         detail.open = false;
                    }
                    detail.addEventListener('toggle', function () {
                         localStorage.setItem(key, this.open ? 'open' : 'closed');
                    });
               });
          } catch (error) {
               console.error('Error loading section:', error);
               content.innerHTML = `
                <div class="section active">
                    <h1>Error</h1>
                    <p class="section-desc">Could not load section: ${sectionId}</p>
                    <p>Please check that the file <code>sections/${sectionId}.html</code> exists.</p>
                </div>
            `;
          }
     }

     async function navigateTo(sectionId) {
          // Update nav
          navItems.forEach(item => {
               item.classList.toggle('active', item.dataset.section === sectionId);
          });
          // Load section
          await loadSection(sectionId);
          // Save preference
          localStorage.setItem('activeSection', sectionId);
     }

     navItems.forEach(btn => {
          btn.addEventListener('click', function (e) {
               e.preventDefault();
               navigateTo(this.dataset.section);
          });
     });

     document.addEventListener('click', function (e) {
          const link = e.target.closest('.see-also-link');
          if (!link || !link.dataset.section) return;
          e.preventDefault();
          navigateTo(link.dataset.section);
     });

     const navSearch = document.getElementById('navSearch');
     const searchExact = document.getElementById('searchExact');
     if (searchExact) {
          searchExact.checked = localStorage.getItem('searchExact') === 'true';
     }
     if (navSearch) {
          const runSearch = function () {
               const q = navSearch.value;
               filterNav(q);
               applySearchHits(q);
               if (q.trim()) {
                    ensureSearchIndex().then(function () {
                         if (navSearch.value === q) filterNav(q);
                    });
               }
          };
          navSearch.addEventListener('input', runSearch);
          navSearch.addEventListener('keydown', function (e) {
               if (e.key !== 'Enter') return;
               e.preventDefault();
               const first = document.querySelector('#nav .nav-item:not(.search-hidden)');
               if (first) {
                    const q = navSearch.value.trim();
                    navigateTo(first.dataset.section).then(function () {
                         if (q) {
                              requestAnimationFrame(function () {
                                   applySearchHits(q);
                              });
                         }
                    });
               }
          });
          if (searchExact) {
               searchExact.addEventListener('change', function () {
                    localStorage.setItem('searchExact', searchExact.checked ? 'true' : 'false');
                    runSearch();
               });
          }
     }

     // ─── Category toggles ───
     document.querySelectorAll('.category-toggle').forEach(toggle => {
          toggle.addEventListener('click', function () {
               const category = this.dataset.category;
               const items = document.querySelector(`.category-items[data-category="${category}"]`);
               this.classList.toggle('open');
               items.classList.toggle('open');
               // Save state
               localStorage.setItem('category-' + category, items.classList.contains('open') ? 'open' : 'closed');
          });

          // Restore state
          const category = toggle.dataset.category;
          const saved = localStorage.getItem('category-' + category);
          if (saved === 'open') {
               toggle.classList.add('open');
               document.querySelector(`.category-items[data-category="${category}"]`).classList.add('open');
          }
     });

     // ─── Sidebar toggle ───
     const sidebar = document.getElementById('sidebar');
     const toggleBtn = document.getElementById('sidebarToggle'); // the one inside the sidebar
     const floatingToggle = document.getElementById('floatingToggle');

     function updateFloatingButton() {
          if (!floatingToggle) return;
          const isHidden = sidebar.classList.contains('hidden');
          floatingToggle.style.display = isHidden ? 'block' : 'none';
          document.body.classList.toggle('sidebar-collapsed', isHidden && isMobileLayout());
     }

     function toggleSidebar() {
          sidebar.classList.toggle('hidden');
          if (toggleBtn) toggleBtn.classList.toggle('collapsed');
          localStorage.setItem('sidebarHidden', sidebar.classList.contains('hidden'));
          updateFloatingButton();
     }

     function showSidebar() {
          sidebar.classList.remove('hidden');
          if (toggleBtn) toggleBtn.classList.remove('collapsed');
          localStorage.setItem('sidebarHidden', 'false');
          updateFloatingButton();
     }

     function hideSidebar() {
          sidebar.classList.add('hidden');
          if (toggleBtn) toggleBtn.classList.add('collapsed');
          localStorage.setItem('sidebarHidden', 'true');
          updateFloatingButton();
     }

     // Attach listeners
     if (toggleBtn) {
          toggleBtn.addEventListener('click', toggleSidebar);
     }
     if (floatingToggle) {
          floatingToggle.addEventListener('click', toggleSidebar);
     }

     // Restore state on page load
     const savedSidebarHidden = localStorage.getItem('sidebarHidden');
     if (savedSidebarHidden === 'true') {
          hideSidebar();
     } else {
          updateFloatingButton(); // make sure floating button starts hidden
     }
     setAudioPlayerVisibility(false);
     window.addEventListener('resize', function () {
          setAudioPlayerVisibility(false);
          updateFloatingButton();
     });

     // ─── Close sidebar when clicking overlay (mobile) ───
     // Add this overlay to your HTML:
     // <div id="sidebar-overlay"></div>
     const overlay = document.getElementById('sidebar-overlay');
     if (overlay) {
          overlay.addEventListener('click', hideSidebar);
     }

     // ─── Auto-hide on mobile when a nav item is clicked ───
     document.querySelectorAll('.nav-item').forEach(item => {
          item.addEventListener('click', function () {
               if (window.innerWidth <= 768) {
                    hideSidebar();
               }
          });
     });

     // ─── Restore last viewed section ───
     const pageParams = new URLSearchParams(window.location.search);
     const hashSection = (window.location.hash || '').replace(/^#/, '');
     const requestedSection = pageParams.get('section') || hashSection;
     const saved = localStorage.getItem('activeSection');
     function sectionExists(id) {
          return Array.from(navItems).some(item => item.dataset.section === id);
     }
     if (requestedSection && sectionExists(requestedSection)) {
          navigateTo(requestedSection);
     } else if (saved && sectionExists(saved)) {
          navigateTo(saved);
     } else {
          const first = navItems[0];
          if (first) navigateTo(first.dataset.section);
     }

     // ─── Dark/Light Mode Toggle ───
     const themeToggle = document.getElementById('themeToggle');

     function toggleTheme() {
          const html = document.documentElement;
          const isLight = html.classList.toggle('light-mode');
          // Update button icon
          if (themeToggle) {
               const darkIcon = themeToggle.querySelector('.theme-icon-dark');
               const lightIcon = themeToggle.querySelector('.theme-icon-light');
               if (darkIcon && lightIcon) {
                    darkIcon.style.display = isLight ? 'none' : 'inline';
                    lightIcon.style.display = isLight ? 'inline' : 'none';
               }
          }
          localStorage.setItem('theme', isLight ? 'light' : 'dark');
     }

     function setTheme(theme) {
          const html = document.documentElement;
          const isLight = theme === 'light';
          if (isLight) {
               html.classList.add('light-mode');
          } else {
               html.classList.remove('light-mode');
          }
          // Update button icon
          if (themeToggle) {
               const darkIcon = themeToggle.querySelector('.theme-icon-dark');
               const lightIcon = themeToggle.querySelector('.theme-icon-light');
               if (darkIcon && lightIcon) {
                    darkIcon.style.display = isLight ? 'none' : 'inline';
                    lightIcon.style.display = isLight ? 'inline' : 'none';
               }
          }
          localStorage.setItem('theme', theme);
     }

     // Toggle button click
     if (themeToggle) {
          themeToggle.addEventListener('click', toggleTheme);
     }

     // ─── Restore saved theme ───
     const savedTheme = localStorage.getItem('theme');
     if (savedTheme) {
          setTheme(savedTheme);
     } else {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(prefersDark ? 'dark' : 'light');
     }

     // ─── Keyboard shortcut: Shift+D to toggle theme ───
     document.addEventListener('keydown', function (e) {
          if (e.shiftKey && (e.key === 'd' || e.key === 'D')) {
               e.preventDefault();
               toggleTheme();
          }
     });

     console.log('🎵 Spanish audio player ready — click any highlighted word!');
})();
