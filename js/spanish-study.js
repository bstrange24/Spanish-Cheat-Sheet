// Study modes: page/pool quiz, listening dictation, SM-2 flashcards.
// Uses the same globals as spanish-practice.js. Does not change speaking flow.
(function () {
     'use strict';
     if (typeof $ !== 'function') return;

     const studyCard = $('studyCard');
     const studyBody = $('studyBody');
     const studyTitle = $('studyTitle');
     if (!studyCard || !studyBody) return;

     const MAX_QUIZ = 100;
     const MAX_DICTATION = 50;
     const MAX_NEW_CARDS = 100;

     let study = null;

     function esc(s) {
          return String(s == null ? '' : s)
               .replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;');
     }

     function shuffle(arr) {
          const a = arr.slice();
          for (let i = a.length - 1; i > 0; i--) {
               const j = Math.floor(Math.random() * (i + 1));
               const t = a[i];
               a[i] = a[j];
               a[j] = t;
          }
          return a;
     }

     function uniqueOptions(correct, pool, n) {
          const seen = new Set();
          const out = [];
          const ckey = normalize(correct);
          seen.add(ckey);
          shuffle(pool).forEach(x => {
               if (out.length >= n) return;
               const k = normalize(x);
               if (!k || seen.has(k)) return;
               seen.add(k);
               out.push(x);
          });
          return shuffle([correct].concat(out));
     }

     function pageLabel() {
          try {
               return sessionStorage.getItem('sp_page_label') || '';
          } catch (err) {
               return '';
          }
     }

     function fromCheatSheet() {
          const params = new URLSearchParams(window.location.search);
          return params.get('mode') === 'quiz' || params.get('pool') === 'page' || params.get('from') === 'page';
     }

     function storedQuiz() {
          try {
               const data = JSON.parse(sessionStorage.getItem('sp_page_quiz') || 'null');
               if (data && Array.isArray(data.items) && data.items.length) return data;
          } catch (err) {}
          return null;
     }

     function storedPairs() {
          try {
               const rows = JSON.parse(sessionStorage.getItem('sp_page_pairs') || '[]');
               return Array.isArray(rows) ? rows : [];
          } catch (err) {
               return [];
          }
     }

     function dictPairsFromPool() {
          const keys = typeof getFilteredKeys === 'function' ? getFilteredKeys() : Object.keys(typeof DICT === 'object' ? DICT : {});
          const pairs = [];
          const seen = new Set();

          function addPair(spanish, english, extra) {
               if (!spanish || !english) return;
               const id = normalize(spanish) + '|' + normalize(english);
               if (seen.has(id)) return;
               seen.add(id);
               const row = { kind: 'pair', spanish: spanish, english: english };
               if (extra) {
                    if (extra.role) row.role = extra.role;
                    if (extra.irregularYo) row.irregularYo = true;
                    if (extra.infinitive) row.infinitive = extra.infinitive;
                    if (extra.meaning) row.meaning = extra.meaning;
                    if (extra.yoForm) row.yoForm = extra.yoForm;
               }
               pairs.push(row);
          }

          keys.forEach(k => {
               const e = typeof dictEntry === 'function' ? dictEntry(k) : null;
               if (e && e.meaning) addPair(k, e.meaning);
          });

          if (fromCheatSheet()) {
               storedPairs().forEach(p =>
                    addPair(p.spanish, p.english, {
                         role: p.role,
                         irregularYo: p.irregularYo,
                         infinitive: p.infinitive,
                         meaning: p.meaning,
                         yoForm: p.yoForm,
                    })
               );
          }

          return pairs;
     }

     const ACCENT_CHARS = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'];

     function accentBarHtml() {
          return (
               '<div class="accent-bar" aria-label="Spanish accent marks">' +
               ACCENT_CHARS.map(function (ch) {
                    return `<button type="button" class="accent-key" data-study="accent" data-char="${ch}" title="Insert ${ch} — Shift+click for uppercase">${ch}</button>`;
               }).join('') +
               '</div>'
          );
     }

     function insertAccent(char, upper) {
          const input = $('studyInput');
          if (!input || input.disabled || !char) return;
          let ch = char;
          if (upper && /[áéíóúüñ]/i.test(char)) ch = char.toUpperCase();
          const start = input.selectionStart == null ? input.value.length : input.selectionStart;
          const end = input.selectionEnd == null ? start : input.selectionEnd;
          input.value = input.value.slice(0, start) + ch + input.value.slice(end);
          const pos = start + ch.length;
          try {
               input.setSelectionRange(pos, pos);
          } catch (err) {}
          input.focus();
     }

     function disableAccentBar() {
          studyBody.querySelectorAll('.accent-bar button').forEach(function (btn) {
               btn.disabled = true;
          });
     }

     function wireStudyInput(onEnter) {
          const input = $('studyInput');
          if (!input) return;
          input.focus();
          input.addEventListener('keydown', function (e) {
               if (e.key === 'Enter') {
                    e.preventDefault();
                    onEnter();
               }
          });
     }

     function speakText(text) {
          if (!text || typeof synth === 'undefined' || !synth) return;
          const u = new SpeechSynthesisUtterance(text);
          u.lang = ($('lang') && $('lang').value) || 'es-MX';
          u.rate = parseFloat(($('ttsRate') && $('ttsRate').value) || '0.85');
          synth.cancel();
          synth.speak(u);
     }

     function looksLikeEnglishGloss(text) {
          const t = String(text || '');
          if (/[áéíóúüñ¿¡]/i.test(t)) return false;
          return /\b(the|to|I|you|he|she|we|they|is|are|was|were|a|an|of|and|for|with|from|this|that|what|how|not|it|my|your)\b/i.test(t);
     }

     function spanishFromPrompt(prompt) {
          const t = String(prompt || '');
          const guillemets = t.match(/«([^»]+)»/);
          if (guillemets) return guillemets[1];
          const quoted = t.match(/What does ["“]([^"”]+)["”] mean/i);
          if (quoted) return quoted[1];
          return '';
     }

     function speakClickedChoice(current, chosen) {
          if (!current) return;
          if (study && study.mode === 'cards') {
               if (current.dir === 'en-es') speakText(chosen);
               else speakText(current.spanish);
               return;
          }
          const targetSpanish = current.speak || spanishFromPrompt(current.prompt);
          const answerIsSpanish = targetSpanish && normalize(current.answer || '') === normalize(targetSpanish);
          if (targetSpanish && !answerIsSpanish) {
               speakText(targetSpanish);
               return;
          }
          if (chosen && !looksLikeEnglishGloss(chosen)) {
               speakText(chosen);
               return;
          }
          if (targetSpanish) speakText(targetSpanish);
          else if (current.allowStrip && current.answer) speakText(current.answer);
     }

     function sectionLink(sectionId) {
          if (!sectionId) return '';
          const href = 'spanish-cheatsheet.html?section=' + encodeURIComponent(sectionId);
          return `<a href="${esc(href)}" target="_blank" rel="noopener">Open this page</a>`;
     }

     function answersMatch(expected, typed, allowStripArticle) {
          const a = normalize(expected);
          const b = normalize(typed);
          if (!a || !b) return false;
          if (a === b) return true;
          if (!allowStripArticle) return false;
          const strip = s => s.replace(/^(el|la|los|las|un|una|unos|unas)\s+/, '');
          return strip(a) === strip(b);
     }

     function accentNote(expected, typed) {
          const e = String(expected || '')
               .toLowerCase()
               .trim();
          const t = String(typed || '')
               .toLowerCase()
               .trim();
          if (!e || !t) return '';
          if (e === t) return '';
          if (normalize(e) === normalize(t)) return ` Watch the accent: «${esc(expected)}»`;
          return '';
     }

     function yoBadgeHtml(irregularYo) {
          return irregularYo ? '<span class="irreg-yo-badge">Irregular yo</span>' : '<span class="yo-form-badge">Yo form</span>';
     }

     function quizFormNote(q, given, ok) {
          if (!q) return '';
          const givenN = normalize(given);
          const inf = q.infinitive || '';
          const yo = q.yoForm || '';
          const yoLabel = q.irregularYo ? 'irregular yo' : 'yo';
          if (q.yoHint && yo && normalize(q.answer) === normalize(yo)) {
               if (!ok && inf && givenN === normalize(inf)) {
                    return ` That's the infinitive. The ${yoLabel} form is «${esc(q.answer)}».`;
               }
               if (inf) return ` ${yoBadgeHtml(q.irregularYo)} ${esc(inf)} → ${esc(q.answer)}`;
               return ` ${yoBadgeHtml(q.irregularYo)}`;
          }
          if (q.yoHint && inf && normalize(q.answer) === normalize(inf)) {
               if (!ok && yo && givenN === normalize(yo)) {
                    return ` That's the ${yoLabel} form. The infinitive is «${esc(q.answer)}».`;
               }
               if (yo) return ` ${yoBadgeHtml(q.irregularYo)} ${esc(q.answer)} → ${esc(yo)}`;
               return ` ${yoBadgeHtml(q.irregularYo)}`;
          }
          if (!q.yoHint && q.yoForm && givenN === normalize(q.yoForm) && normalize(q.answer) !== givenN) {
               return ` That's the yo form. The infinitive is «${esc(q.answer)}».`;
          }
          return '';
     }

     function pairCardFields(p) {
          return {
               irregularYo: !!(p && p.irregularYo),
               infinitive: (p && p.infinitive) || '',
               yoForm: !!(p && (p.role === 'yo' || p.irregularYo)),
          };
     }

     function ensureSrs() {
          if (typeof srs !== 'object' || !srs) {
               try {
                    srs = JSON.parse(localStorage.getItem('sp_srs') || '{}');
               } catch (err) {
                    srs = {};
               }
          }
          return srs;
     }

     function scheduleSrs(id, quality) {
          const store = ensureSrs();
          let c = store[id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0, next: 0, last: 0 };
          const now = Date.now();
          if (quality < 3) {
               c.lapses = (c.lapses || 0) + 1;
               c.reps = 0;
               c.interval = 0;
               c.next = now + 60 * 1000;
               c.ease = Math.max(1.3, (c.ease || 2.5) - 0.2);
          } else {
               if (!c.reps) c.interval = quality === 5 ? 4 : 1;
               else if (c.reps === 1) c.interval = quality === 5 ? 7 : 6;
               else {
                    const mul = quality === 5 ? 1.3 : quality === 3 ? 0.8 : 1;
                    c.interval = Math.max(1, Math.round((c.interval || 1) * (c.ease || 2.5) * mul));
               }
               c.reps = (c.reps || 0) + 1;
               c.ease = Math.max(1.3, (c.ease || 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
               c.next = now + c.interval * 24 * 60 * 60 * 1000;
          }
          c.last = now;
          store[id] = c;
          srs = store;
          if (typeof saveAll === 'function') saveAll();
     }

     function markStudyAttempt() {
          if (typeof updateStreak === 'function') updateStreak();
          else if (typeof saveAll === 'function') saveAll();
     }

     function closeStudy() {
          study = null;
          studyCard.style.display = 'none';
          studyBody.innerHTML = '';
          if (studyTitle) studyTitle.textContent = 'Study';
          if (typeof synth !== 'undefined' && synth) synth.cancel();
     }

     function showStudy() {
          studyCard.style.display = 'block';
          try {
               studyCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          } catch (err) {}
     }

     function progressLine(extra) {
          if (!study) return '';
          const n = study.questions ? study.questions.length : 0;
          const i = Math.min((study.index || 0) + 1, n);
          const score = study.correct || 0;
          const bits = [`${i} / ${n}`];
          if (study.answeredCount) bits.push(`${score} correct`);
          if (extra) bits.push(extra);
          return `<div class="study-meta">${bits.join(' • ')}</div>`;
     }

     function isYoPair(p) {
          return !!(p && (p.role === 'yo' || p.irregularYo));
     }

     function yoGloss(p) {
          const inf = p.infinitive || '';
          const meaning = p.meaning || '';
          if (inf && meaning) return inf + ' (' + meaning + ')';
          return inf || meaning || p.english || '';
     }

     function buildQuestions(items) {
          const pairs = items.filter(it => it.kind === 'pair' && it.spanish && it.english);
          const choices = items.filter(it => it.kind === 'choice' && it.prompt && it.answer);
          const questions = [];
          const yoPairs = pairs.filter(isYoPair);
          const lexPairs = pairs.filter(p => !isYoPair(p));

          const choiceAnswers = {};
          choices.forEach(c => {
               const g = c.group || 'all';
               if (!choiceAnswers[g]) choiceAnswers[g] = [];
               if (!choiceAnswers[g].some(x => normalize(x) === normalize(c.answer))) choiceAnswers[g].push(c.answer);
          });

          choices.forEach(c => {
               const pool = (choiceAnswers[c.group || 'all'] || []).filter(x => normalize(x) !== normalize(c.answer));
               const options = uniqueOptions(c.answer, pool, 3);
               questions.push({
                    mode: options.length > 1 ? 'mcq' : 'type',
                    prompt: c.prompt,
                    answer: c.answer,
                    options: options,
                    sectionId: c.sectionId,
                    allowStrip: false,
                    speak: looksLikeEnglishGloss(c.answer) ? '' : c.answer,
               });
          });

          const yoEs = yoPairs.map(p => p.spanish);
          const yoInf = yoPairs.map(p => p.infinitive).filter(Boolean);
          const esPool = lexPairs.map(p => p.spanish);
          const enPool = lexPairs.map(p => p.english);

          yoPairs.forEach(p => {
               const sectionId = p.sectionId;
               const gloss = yoGloss(p);
               const label = p.irregularYo ? 'irregular yo' : 'yo';
               const roll = Math.random();
               const shared = {
                    sectionId: sectionId,
                    irregularYo: !!p.irregularYo,
                    infinitive: p.infinitive || '',
                    yoHint: true,
                    yoForm: p.spanish,
                    speak: p.spanish,
                    allowStrip: false,
               };
               if (roll < 0.4 || p.spanish.length > 28) {
                    questions.push(
                         Object.assign(
                              {
                                   mode: 'type',
                                   prompt: 'Type the ' + label + ' form of ' + gloss,
                                   answer: p.spanish,
                              },
                              shared
                         )
                    );
               } else if (roll < 0.75 && yoEs.length > 1) {
                    const options = uniqueOptions(p.spanish, yoEs, 3);
                    questions.push(
                         Object.assign(
                              {
                                   mode: options.length > 1 ? 'mcq' : 'type',
                                   prompt: 'What is the ' + label + ' form of ' + gloss + '?',
                                   answer: p.spanish,
                                   options: options,
                              },
                              shared
                         )
                    );
               } else if (p.infinitive && yoInf.length > 1) {
                    const options = uniqueOptions(p.infinitive, yoInf, 3);
                    questions.push(
                         Object.assign(
                              {
                                   mode: options.length > 1 ? 'mcq' : 'type',
                                   prompt: '«' + p.spanish + '» is the ' + label + ' form of which verb?',
                                   answer: p.infinitive,
                                   options: options,
                                   speak: p.spanish,
                              },
                              shared
                         )
                    );
               } else {
                    questions.push(
                         Object.assign(
                              {
                                   mode: 'type',
                                   prompt: 'Type the ' + label + ' form of ' + gloss,
                                   answer: p.spanish,
                              },
                              shared
                         )
                    );
               }
          });

          lexPairs.forEach(p => {
               const roll = Math.random();
               const sectionId = p.sectionId;
               const extra = { yoForm: p.yoForm || '', infinitive: p.spanish };
               if (roll < 0.25 && p.spanish.length <= 28) {
                    questions.push(
                         Object.assign(
                              {
                                   mode: 'type',
                                   prompt: 'Type the Spanish for: "' + p.english + '"',
                                   answer: p.spanish,
                                   sectionId: sectionId,
                                   allowStrip: true,
                                   speak: p.spanish,
                              },
                              extra
                         )
                    );
               } else if (roll < 0.62) {
                    const options = uniqueOptions(p.english, enPool, 3);
                    questions.push({
                         mode: options.length > 1 ? 'mcq' : 'type',
                         prompt: 'What does "' + p.spanish + '" mean?',
                         answer: p.english,
                         options: options,
                         sectionId: sectionId,
                         allowStrip: false,
                         speak: p.spanish,
                    });
               } else {
                    const options = uniqueOptions(p.spanish, esPool, 3);
                    questions.push(
                         Object.assign(
                              {
                                   mode: options.length > 1 ? 'mcq' : 'type',
                                   prompt: 'How do you say: "' + p.english + '?"',
                                   answer: p.spanish,
                                   options: options,
                                   sectionId: sectionId,
                                   allowStrip: true,
                                   speak: p.spanish,
                              },
                              extra
                         )
                    );
               }
          });

          return shuffle(questions).slice(0, MAX_QUIZ);
     }

     function renderQuiz() {
          if (!study || study.mode !== 'quiz') return;
          const n = study.questions.length;
          if (!n) {
               studyBody.innerHTML = '<span class="bad">No quiz items for the current filters.</span>';
               return;
          }
          if (study.index >= n) {
               const pct = Math.round((study.correct / n) * 100);
               const cls = pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad';
               const missLink = study.sectionId ? `<div class="study-meta" style="margin-top:8px">${sectionLink(study.sectionId)}</div>` : '';
               studyBody.innerHTML = `<div class="study-prompt">Quiz complete</div>` + `<div class="${cls}">${study.correct} / ${n} (${pct}%)</div>` + missLink + `<div class="study-actions">` + `<button type="button" data-study="retry">🔄 Retry</button>` + `<button type="button" data-study="exit" style="background:#64748b;color:white">Close</button>` + `</div>`;
               return;
          }

          const q = study.questions[study.index];
          study.current = q;
          study.answered = false;
          let html = progressLine();
          if (q.irregularYo) html += '<div class="study-meta"><span class="irreg-yo-badge">Irregular yo</span></div>';
          else if (q.yoHint) html += '<div class="study-meta"><span class="yo-form-badge">Yo form</span></div>';
          html += `<div class="study-prompt">${esc(q.prompt)}</div>`;
          if (q.mode === 'mcq') {
               html += q.options.map(opt => `<button type="button" class="quiz-choice" data-study="choose" data-value="${esc(opt)}">${esc(opt)}</button>`).join('');
          } else {
               html +=
                    `<input type="text" id="studyInput" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Type your answer" />` +
                    accentBarHtml() +
                    `<div class="study-actions"><button type="button" data-study="check" style="background:#0ea5e9;color:white">Check</button></div>`;
          }
          html += `<div id="studyFeedback" class="study-feedback"></div>`;
          studyBody.innerHTML = html;
          wireStudyInput(submitTypeAnswer);
     }

     function finishQuizAnswer(ok, given) {
          if (!study || study.answered) return;
          study.answered = true;
          study.answeredCount = (study.answeredCount || 0) + 1;
          const q = study.current;
          if (ok) study.correct++;
          markStudyAttempt();

          const note = accentNote(q.answer, given);
          const yoNote = quizFormNote(q, given, ok);
          const fb = $('studyFeedback');
          const miss = !ok && q.sectionId ? ` • ${sectionLink(q.sectionId)}` : '';
          if (fb) {
               fb.innerHTML = ok
                    ? `<span class="good">✅ Correct.</span>${note}${yoNote}`
                    : `<span class="bad">❌ ${esc(given || '')}</span> → <strong>«${esc(q.answer)}»</strong>${yoNote}${miss}`;
          }

          if (q.mode === 'mcq') {
               studyBody.querySelectorAll('.quiz-choice').forEach(btn => {
                    const val = btn.getAttribute('data-value') || '';
                    if (normalize(val) === normalize(q.answer)) btn.classList.add('correct');
                    else if (given && normalize(val) === normalize(given)) btn.classList.add('wrong');
               });
          } else {
               const input = $('studyInput');
               if (input) input.disabled = true;
               disableAccentBar();
          }

          const actions = studyBody.querySelector('.study-actions') || studyBody;
          const next = document.createElement('button');
          next.type = 'button';
          next.setAttribute('data-study', 'next');
          next.style.background = '#8b5cf6';
          next.style.color = 'white';
          next.textContent = study.index + 1 >= study.questions.length ? 'See score' : 'Next';
          actions.appendChild(next);
     }

     function submitTypeAnswer() {
          if (!study || study.answered || !study.current) return;
          const input = $('studyInput');
          const given = input ? input.value.trim() : '';
          if (!given) return;
          const ok = answersMatch(study.current.answer, given, !!study.current.allowStrip);
          finishQuizAnswer(ok, given);
     }

     function startQuiz(items, label, sectionId) {
          const questions = buildQuestions(items || []);
          if (!questions.length) {
               if (typeof resultCard !== 'undefined' && resultCard) {
                    resultCard.innerHTML = '<span class="bad">No quiz items for the current filters.</span>';
               }
               return;
          }
          study = {
               mode: 'quiz',
               questions: questions,
               index: 0,
               correct: 0,
               answeredCount: 0,
               answered: false,
               current: null,
               sectionId: sectionId || '',
               sourceItems: items || [],
               label: label || '',
          };
          if (studyTitle) studyTitle.textContent = label ? '📝 Quiz — ' + label : '📝 Quiz';
          showStudy();
          renderQuiz();
     }

     function startQuizFromButton() {
          const stored = storedQuiz();
          const params = new URLSearchParams(window.location.search);
          if ((params.get('mode') === 'quiz' || params.get('from') === 'page') && stored) {
               const label = stored.label || pageLabel() || stored.sectionId || 'this page';
               startQuiz(stored.items, label, stored.sectionId);
               return;
          }
          const pairs = dictPairsFromPool();
          if (!pairs.length) {
               if (typeof resultCard !== 'undefined' && resultCard) {
                    resultCard.innerHTML = '<span class="bad">No quiz items. Pick a category or open Quiz this page from the cheat sheet.</span>';
               }
               return;
          }
          startQuiz(pairs, extraPool && extraPool.length ? 'current pool' : 'dictionary');
     }

     function dictationPool() {
          const keys = typeof getFilteredKeys === 'function' ? getFilteredKeys() : [];
          const out = [];
          const seen = new Set();
          keys.forEach(k => {
               const t = String(k || '').trim();
               if (!t || t.length > 48) return;
               const id = normalize(t);
               if (seen.has(id)) return;
               seen.add(id);
               out.push(t);
          });
          return shuffle(out).slice(0, MAX_DICTATION);
     }

     function renderDictation() {
          if (!study || study.mode !== 'dictation') return;
          const n = study.questions.length;
          if (!n) {
               studyBody.innerHTML = '<span class="bad">No words to dictate for the current filters.</span>';
               return;
          }
          if (study.index >= n) {
               const pct = Math.round((study.correct / n) * 100);
               const cls = pct >= 80 ? 'good' : pct >= 50 ? 'ok' : 'bad';
               studyBody.innerHTML = `<div class="study-prompt">Dictation complete</div>` + `<div class="${cls}">${study.correct} / ${n} (${pct}%)</div>` + `<div class="study-actions">` + `<button type="button" data-study="retry">🔄 Retry</button>` + `<button type="button" data-study="exit" style="background:#64748b;color:white">Close</button>` + `</div>`;
               return;
          }

          study.current = { answer: study.questions[study.index] };
          study.answered = false;
          studyBody.innerHTML =
               progressLine('type what you hear') +
               `<div class="study-prompt">Listen and type the Spanish</div>` +
               `<input type="text" id="studyInput" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Type what you hear" />` +
               accentBarHtml() +
               `<div class="study-actions">` +
               `<button type="button" data-study="hear" style="background:var(--accent);color:white">🔊 Hear</button>` +
               `<button type="button" data-study="check" style="background:#14b8a6;color:white">Check</button>` +
               `<button type="button" data-study="reveal" style="background:#64748b;color:white">Reveal</button>` +
               `<button type="button" data-study="skip" style="background:#94a3b8;color:white">Skip</button>` +
               `</div>` +
               `<div id="studyFeedback" class="study-feedback"></div>`;
          wireStudyInput(function () {
               submitDictation(false);
          });
          speakText(study.current.answer);
     }

     function submitDictation(revealed) {
          if (!study || study.mode !== 'dictation' || study.answered || !study.current) return;
          const input = $('studyInput');
          const given = input ? input.value.trim() : '';
          const answer = study.current.answer;
          if (!revealed && !given) {
               speakText(answer);
               return;
          }
          study.answered = true;
          study.answeredCount = (study.answeredCount || 0) + 1;
          const ok = !revealed && answersMatch(answer, given, answer.split(/\s+/).length <= 3);
          if (ok) study.correct++;
          markStudyAttempt();
          if (input) input.disabled = true;
          disableAccentBar();
          const note = accentNote(answer, given);
          const fb = $('studyFeedback');
          if (fb) {
               if (revealed) fb.innerHTML = `Answer: <strong>«${esc(answer)}»</strong>`;
               else if (ok) fb.innerHTML = `<span class="good">✅ Correct.</span>${note}`;
               else fb.innerHTML = `<span class="bad">❌ ${esc(given)}</span> → <strong>«${esc(answer)}»</strong>`;
          }
          const actions = studyBody.querySelector('.study-actions');
          if (actions) {
               const next = document.createElement('button');
               next.type = 'button';
               next.setAttribute('data-study', 'next');
               next.style.background = '#8b5cf6';
               next.style.color = 'white';
               next.textContent = study.index + 1 >= study.questions.length ? 'See score' : 'Next';
               actions.appendChild(next);
          }
     }

     function startDictation() {
          const words = dictationPool();
          if (!words.length) {
               if (typeof resultCard !== 'undefined' && resultCard) {
                    resultCard.innerHTML = '<span class="bad">No dictation words for the current filters.</span>';
               }
               return;
          }
          study = {
               mode: 'dictation',
               questions: words,
               index: 0,
               correct: 0,
               answeredCount: 0,
               answered: false,
               current: null,
          };
          if (studyTitle) studyTitle.textContent = '✍️ Dictation';
          showStudy();
          renderDictation();
     }

     function cardQueue() {
          const pairs = dictPairsFromPool();
          const store = ensureSrs();
          const now = Date.now();
          const due = [];
          const neu = [];
          const fav = new Set(typeof favorites !== 'undefined' && Array.isArray(favorites) ? favorites.map(normalize) : []);

          pairs.forEach(p => {
               ['en-es', 'es-en'].forEach(dir => {
                    const id = dir + ':' + normalize(p.spanish);
                    const card = Object.assign({ spanish: p.spanish, english: p.english, dir: dir, id: id }, pairCardFields(p));
                    const rec = store[id];
                    if (!rec) neu.push(card);
                    else if ((rec.next || 0) <= now) due.push(card);
               });
          });

          neu.sort((a, b) => {
               const fa = fav.has(normalize(a.spanish)) ? 1 : 0;
               const fb = fav.has(normalize(b.spanish)) ? 1 : 0;
               return fb - fa;
          });

          return {
               queue: shuffle(due).concat(neu.slice(0, MAX_NEW_CARDS)),
               due: due.length,
               neu: Math.min(neu.length, MAX_NEW_CARDS),
               extra: false,
               all: pairs,
          };
     }

     function renderCard() {
          if (!study || study.mode !== 'cards') return;
          const n = study.questions.length;
          if (!n) {
               studyBody.innerHTML = '<span class="bad">No flashcards for the current filters (need words with meanings).</span>';
               return;
          }
          if (study.index >= n) {
               studyBody.innerHTML = `<div class="study-prompt">Cards done for now</div>` + `<div class="good">${study.correct} remembered • ${Math.max(0, n - study.correct)} again</div>` + `<div class="study-meta">New reviews are scheduled automatically.</div>` + `<div class="study-actions">` + `<button type="button" data-study="retry">🔄 More cards</button>` + `<button type="button" data-study="exit" style="background:#64748b;color:white">Close</button>` + `</div>`;
               return;
          }

          const card = study.questions[study.index];
          study.current = card;
          study.answered = false;
          const front = card.dir === 'es-en' ? card.spanish : card.english;
          const hint = card.dir === 'es-en' ? 'What does this mean?' : 'How do you say this in Spanish?';
          const options = cardOptions(card);
          let html = progressLine(study.dueLine || '') + `<div class="study-meta">${esc(hint)}</div>`;
          if (card.irregularYo) html += `<div class="study-meta">${yoBadgeHtml(true)}</div>`;
          else if (card.yoForm) html += `<div class="study-meta">${yoBadgeHtml(false)}</div>`;
          html += `<div class="study-prompt">${esc(front)}</div>`;
          if (options && options.length > 1) {
               html += options.map(opt => `<button type="button" class="quiz-choice" data-study="choose" data-value="${esc(opt)}">${esc(opt)}</button>`).join('');
          }
          html += `<div class="study-actions"><button type="button" data-study="show-card" style="background:#6366f1;color:white">Show answer</button></div>` + `<div id="studyFeedback" class="study-feedback"></div>`;
          studyBody.innerHTML = html;
     }

     function cardOptions(card) {
          const pool = (study && study.pairPool) || [];
          if (!card || pool.length < 2) return null;
          if (card.dir === 'en-es')
               return uniqueOptions(
                    card.spanish,
                    pool.map(p => p.spanish),
                    3
               );
          return uniqueOptions(
               card.english,
               pool.map(p => p.english),
               3
          );
     }

     function showCardRating() {
          const actions = studyBody.querySelector('.study-actions');
          if (!actions) return;
          actions.innerHTML = `<button type="button" data-study="rate" data-quality="1" style="background:#ef4444;color:white">❌ Again</button>` + `<button type="button" data-study="rate" data-quality="3" style="background:#f59e0b;color:white">Hard</button>` + `<button type="button" data-study="rate" data-quality="4" style="background:#10b981;color:white">👍 Good</button>` + `<button type="button" data-study="rate" data-quality="5" style="background:#6366f1;color:white">⭐ Easy</button>`;
     }

     function finishCardChoice(given) {
          if (!study || study.mode !== 'cards' || study.answered || !study.current) return;
          study.answered = true;
          const card = study.current;
          const expected = card.dir === 'en-es' ? card.spanish : card.english;
          const ok = normalize(given) === normalize(expected);
          studyBody.querySelectorAll('.quiz-choice').forEach(btn => {
               const val = btn.getAttribute('data-value') || '';
               if (normalize(val) === normalize(expected)) btn.classList.add('correct');
               else if (normalize(val) === normalize(given)) btn.classList.add('wrong');
          });
          const fb = $('studyFeedback');
          const yoBit = card.irregularYo ? ` ${yoBadgeHtml(true)}` : card.yoForm ? ` ${yoBadgeHtml(false)}` : '';
          if (fb) {
               fb.innerHTML = ok ? `<span class="good">✅ Correct.</span>${yoBit}` : `<span class="bad">❌</span> → <strong>«${esc(expected)}»</strong>${yoBit}`;
          }
          showCardRating();
     }

     function revealCard() {
          if (!study || study.mode !== 'cards' || study.answered || !study.current) return;
          study.answered = true;
          const card = study.current;
          const back = card.dir === 'es-en' ? card.english : card.spanish;
          const expected = card.dir === 'en-es' ? card.spanish : card.english;
          studyBody.querySelectorAll('.quiz-choice').forEach(btn => {
               const val = btn.getAttribute('data-value') || '';
               if (normalize(val) === normalize(expected)) btn.classList.add('correct');
          });
          const fb = $('studyFeedback');
          const yoBit = card.irregularYo ? ` ${yoBadgeHtml(true)}` : card.yoForm ? ` ${yoBadgeHtml(false)}` : '';
          if (fb) fb.innerHTML = `<strong>«${esc(back)}»</strong>${yoBit}`;
          speakText(card.spanish);
          showCardRating();
     }

     function rateCard(quality) {
          if (!study || study.mode !== 'cards' || !study.current) return;
          const q = parseInt(quality, 10);
          scheduleSrs(study.current.id, q);
          if (q >= 3) study.correct++;
          markStudyAttempt();
          study.index++;
          renderCard();
     }

     function startCards() {
          const built = cardQueue();
          let queue = built.queue;
          if (!queue.length && built.all && built.all.length) {
               queue = shuffle(built.all)
                    .slice(0, MAX_QUIZ)
                    .map(p => {
                         const dir = Math.random() < 0.5 ? 'en-es' : 'es-en';
                         return Object.assign(
                              {
                                   spanish: p.spanish,
                                   english: p.english,
                                   dir: dir,
                                   id: dir + ':' + normalize(p.spanish),
                              },
                              pairCardFields(p)
                         );
                    });
               built.extra = true;
          }
          if (!queue.length) {
               if (typeof resultCard !== 'undefined' && resultCard) {
                    resultCard.innerHTML = '<span class="bad">No flashcards for the current filters (need words with meanings).</span>';
               }
               return;
          }
          study = {
               mode: 'cards',
               questions: queue,
               index: 0,
               correct: 0,
               answeredCount: 0,
               answered: false,
               current: null,
               pairPool: built.all || [],
               dueLine: built.extra ? 'extra review — nothing due' : `${built.due} due • ${built.neu} new`,
          };
          if (studyTitle) studyTitle.textContent = '🃏 Cards';
          showStudy();
          renderCard();
     }

     function retryCurrent() {
          if (!study) return;
          if (study.mode === 'quiz') startQuiz(study.sourceItems, study.label, study.sectionId);
          else if (study.mode === 'dictation') startDictation();
          else if (study.mode === 'cards') startCards();
     }

     studyBody.addEventListener('mousedown', function (e) {
          const btn = e.target.closest('[data-study="accent"]');
          if (!btn) return;
          e.preventDefault();
          insertAccent(btn.getAttribute('data-char') || '', e.shiftKey);
     });

     studyBody.addEventListener('click', function (e) {
          const btn = e.target.closest('[data-study]');
          if (!btn) return;
          const action = btn.getAttribute('data-study');
          if (action === 'accent') return;
          if (action === 'choose') {
               if (!study || !study.current) return;
               const given = btn.getAttribute('data-value') || '';
               speakClickedChoice(study.current, given);
               if (study.answered) return;
               if (study.mode === 'cards') finishCardChoice(given);
               else {
                    const ok = normalize(given) === normalize(study.current.answer);
                    finishQuizAnswer(ok, given);
               }
          } else if (action === 'check') {
               if (study && study.mode === 'dictation') submitDictation(false);
               else submitTypeAnswer();
          } else if (action === 'next') {
               if (!study) return;
               study.index++;
               if (study.mode === 'quiz') renderQuiz();
               else if (study.mode === 'dictation') renderDictation();
               else renderCard();
          } else if (action === 'hear') {
               if (study && study.current) speakText(study.current.answer);
          } else if (action === 'reveal') {
               submitDictation(true);
          } else if (action === 'skip') {
               if (!study || study.mode !== 'dictation') return;
               study.index++;
               renderDictation();
          } else if (action === 'show-card') {
               revealCard();
          } else if (action === 'rate') {
               rateCard(btn.getAttribute('data-quality'));
          } else if (action === 'retry') {
               retryCurrent();
          } else if (action === 'exit') {
               closeStudy();
          }
     });

     if ($('studyExitBtn')) $('studyExitBtn').onclick = closeStudy;
     if ($('quizBtn')) $('quizBtn').onclick = startQuizFromButton;
     if ($('dictationBtn')) $('dictationBtn').onclick = startDictation;
     if ($('cardsBtn')) $('cardsBtn').onclick = startCards;

     const params = new URLSearchParams(window.location.search);
     const mode = params.get('mode');
     if (mode === 'quiz') startQuizFromButton();
     else if (mode === 'dictation') startDictation();
     else if (mode === 'cards') startCards();
})();
