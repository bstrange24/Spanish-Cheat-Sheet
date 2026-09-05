// All code wrapped in a function to ensure $ is defined
(function () {
     'use strict';

     // Check if $ is defined
     if (typeof $ === 'undefined') {
          // Wait for DOM to load
          document.addEventListener('DOMContentLoaded', function () {
               if (typeof $ !== 'undefined') {
                    initSpanishPractice();
               }
          });
          return;
     }

     initSpanishPractice();

     function initSpanishPractice() {
          // ===================== STATE =====================
          let myRecording = null;
          let mediaRecorder = null;
          let audioChunks = [];
          let playerVisible = true;
          let playerTimeout;
          let micPermissionGranted = false;
          let conjugationState = { correct: 0, attempted: 0 };
          let extraPool = null;

          // ===================== DOM =====================
          const targetInput = $('target');
          const targetCard = $('targetCard');
          const resultCard = $('resultCard');
          const speakBtn = $('speakBtn');
          const listenBtn = $('listenBtn');
          const randomBtn = $('randomBtn');
          const starBtn = $('starBtn');
          const recordBtn = $('recordBtn');
          const playMyBtn = $('playMyBtn');
          const playerFrame = $('playerFrame');
          const playerContainer = $('playerContainer');
          const playerStatus = $('playerStatus');

          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

          function improvedNormalize(text) {
               return text
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[¿?¡!.,;:""''«»()\[\]{}]/g, '')
                    .replace(/\s+/g, ' ')
                    .replace(/ñ/g, 'n')
                    .replace(/ll/g, 'y')
                    .replace(/rr/g, 'r')
                    .replace(/ch/g, 'c')
                    .trim();
          }

          function similarity(a, b) {
               if (!a || !b) return 0;
               const longer = a.length > b.length ? a : b;
               const shorter = a.length > b.length ? b : a;
               if (!longer.length) return 1;
               return (longer.length - editDistance(longer, shorter)) / longer.length;
          }

          function editDistance(s1, s2) {
               const costs = [];
               for (let i = 0; i <= s1.length; i++) {
                    let last = i;
                    for (let j = 0; j <= s2.length; j++) {
                         if (i === 0) costs[j] = j;
                         else if (j > 0) {
                              let nv = costs[j - 1];
                              if (s1[i - 1] !== s2[j - 1]) nv = Math.min(nv, last, costs[j]) + 1;
                              costs[j - 1] = last;
                              last = nv;
                         }
                    }
                    if (i > 0) costs[s2.length] = last;
               }
               return costs[s2.length];
          }

          function getDynamicThresholds(target) {
               const wordCount = target.split(/\s+/).length;
               let baseThreshold = 0.75;
               if (wordCount === 1) baseThreshold = 0.9;
               else if (wordCount <= 3) baseThreshold = 0.85;
               else baseThreshold = 0.7;
               if (/[ñáéíóúü]/.test(target)) baseThreshold -= 0.05;
               return {
                    similarity: baseThreshold,
                    phonetic: baseThreshold - 0.15,
                    charLevel: baseThreshold - 0.2,
               };
          }

          function isVerb(e) {
               return e.meaning.toLowerCase().startsWith('to ');
          }

          function dictEntry(k) {
               if (!k) return null;
               return DICT[k] || DICT[k.toLowerCase()] || DICT[normalize(k)] || null;
          }

          function pageGloss(phrase) {
               try {
                    const map = JSON.parse(sessionStorage.getItem('sp_page_gloss') || '{}');
                    if (!phrase || !map || typeof map !== 'object') return null;
                    if (map[phrase]) return map[phrase];
                    const lower = phrase.toLowerCase();
                    if (map[lower]) return map[lower];
                    const n = normalize(phrase);
                    const keys = Object.keys(map);
                    for (let i = 0; i < keys.length; i++) {
                         if (normalize(keys[i]) === n) return map[keys[i]];
                    }
               } catch (err) {}
               return null;
          }

          function meaningLineHtml(phrase, reveal) {
               const testMode = $('testMode') && $('testMode').checked;
               if (testMode && !reveal) {
                    return '<em style="color:var(--muted)">Meaning hidden (Test Mode)</em>';
               }
               const entry = dictEntry(phrase);
               const gloss = pageGloss(phrase);
               const meaning = (entry && entry.meaning) || (gloss && gloss.meaning) || '';
               let html = meaning ? `Meaning: <em>${meaning}</em>` : 'Meaning: <em>—</em>';
               if (gloss && gloss.irregularYo) {
                    html += ' <span class="irreg-yo-badge">Irregular yo</span>';
                    if (gloss.infinitive) html += ` of <strong>${gloss.infinitive}</strong>`;
               } else if (gloss && gloss.yoForm && gloss.infinitive) {
                    html += ` <span class="yo-form-badge">Yo form</span> of <strong>${gloss.infinitive}</strong>`;
               }
               return html;
          }

          function getFilteredKeys() {
               const level = $('difficulty').value;
               const cat = $('category').value;
               const onlyV = $('onlyVerbs').checked;
               const base = extraPool && extraPool.length ? extraPool.slice() : Object.keys(DICT);
               return base.filter(k => {
                    const e = dictEntry(k);
                    if (!extraPool && !e) return false;
                    if (level !== 'all') {
                         if (!e || e.level !== level) return false;
                    }
                    if (cat !== 'all') {
                         if (!e || e.cat !== cat) return false;
                    }
                    if (onlyV && (!e || !isVerb(e))) return false;
                    return true;
               });
          }

          // ===================== ACCENT BAR =====================
          function insertConjugationAccent(char, upper) {
               const input = $('conjugationAnswer');
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

          // ===================== PLAYER FUNCTIONS =====================
          function getPlayerUrl() {
               const text = targetInput.value.trim();
               if (!text) return null;
               const lang = $('lang').value;
               const mode = text.includes(' ') ? 'phrase' : 'word';
               const param = mode === 'word' ? 'word' : 'text';
               return `${PLAYER_BASE_URL}?${param}=${encodeURIComponent(text)}&lang=${lang}&mode=${mode}`;
          }

          function updatePlayer() {
               const text = targetInput.value.trim();
               if (!text || !playerVisible) {
                    if (!text) {
                         playerFrame.src = '';
                         playerStatus.innerHTML = '⏳ No word selected';
                    }
                    return;
               }
               const url = getPlayerUrl();
               if (!url) return;

               playerStatus.innerHTML = `⏳ Loading: <strong>«${text}»</strong>...`;
               playerStatus.className = 'player-status';
               $('playerUrlDisplay').textContent = url;
               playerFrame.src = url;

               clearTimeout(window.playerLoadTimeout);
               window.playerLoadTimeout = setTimeout(() => {
                    try {
                         const iframeDoc = playerFrame.contentDocument || playerFrame.contentWindow?.document;
                         if (iframeDoc && iframeDoc.readyState === 'complete') {
                              playerStatus.innerHTML = `✅ Loaded: <strong>«${text}»</strong>`;
                              playerStatus.className = 'player-status success';
                         } else {
                              playerStatus.innerHTML = `⚠️ Could not load player. Is the server running at <code>${PLAYER_BASE_URL}</code>?`;
                              playerStatus.className = 'player-status error';
                         }
                    } catch (e) {
                         playerStatus.innerHTML = `🔄 Player loaded (cross-origin). If you see content above, it's working!`;
                         playerStatus.className = 'player-status';
                    }
               }, 3000);
          }

          function testPlayerConnection() {
               const testUrl = PLAYER_BASE_URL;
               playerStatus.innerHTML = `🔍 Testing connection to <code>${testUrl}</code>...`;
               playerStatus.className = 'player-status';

               fetch(testUrl, { mode: 'no-cors' })
                    .then(() => {
                         playerStatus.innerHTML = `✅ Server is reachable! Try loading a word.`;
                         playerStatus.className = 'player-status success';
                    })
                    .catch(err => {
                         playerStatus.innerHTML = `❌ Cannot reach server. Make sure it's running at <code>${testUrl}</code><br>Error: ${err.message}`;
                         playerStatus.className = 'player-status error';
                    });

               playerFrame.src = `${PLAYER_BASE_URL}?word=hola&lang=es-MX&mode=word`;
          }

          function openPlayerInNewTab() {
               const url = getPlayerUrl();
               if (!url) {
                    alert('Enter or select a phrase first');
                    return;
               }
               window.open(url, '_blank', 'width=600,height=400');
          }

          // ===================== CORE UI =====================
          function showTargetInfo() {
               const phrase = targetInput.value.trim();
               if (!phrase) {
                    targetCard.style.display = 'none';
                    return;
               }
               if (!$('targetText') || !$('phoneticGuide') || !$('meaningGuide')) return;

               $('targetText').textContent = phrase;
               const entry = dictEntry(phrase);
               const gloss = pageGloss(phrase);
               const showPh = $('showPhonetic').checked;
               const testMode = $('testMode').checked;

               const showApproximate = showPh && !testMode;
               if (entry) {
                    $('phoneticGuide').innerHTML = showApproximate ? `Approximate: <em>${entry.approx}</em>` : '';
                    $('phoneticGuide').style.display = showApproximate ? 'block' : 'none';
               } else {
                    $('phoneticGuide').innerHTML = showApproximate ? 'Approximate: <em>(not in dictionary)</em>' : '';
                    $('phoneticGuide').style.display = showApproximate ? 'block' : 'none';
               }
               $('meaningGuide').innerHTML = meaningLineHtml(phrase, false);

               $('starIndicator').textContent = favorites.includes(normalize(phrase)) ? '⭐' : '';

               let tipsHtml = '<ul>' + TIPS.map(t => `<li>${t}</li>`).join('');
               const lower = phrase.toLowerCase();
               if (/rr|\br/.test(lower)) tipsHtml += '<li>Contains rolled <strong>r/rr</strong></li>';
               if (/j|g[ei]/.test(lower)) tipsHtml += '<li>Strong <strong>j/ge/gi</strong> sound</li>';
               if (!testMode && gloss && gloss.irregularYo) {
                    tipsHtml += '<li>This is an <strong>irregular yo</strong> form' + (gloss.infinitive ? ` of <strong>${gloss.infinitive}</strong>` : '') + '</li>';
               } else if (!testMode && gloss && gloss.yoForm && gloss.infinitive) {
                    tipsHtml += `<li>This is the <strong>yo</strong> form of <strong>${gloss.infinitive}</strong></li>`;
               }
               tipsHtml += '</ul>';
               $('phoneticTipsContent').innerHTML = tipsHtml;

               const key = normalize(phrase);
               const count = progress[key] || 0;
               const total = Object.values(progress).reduce((a, b) => a + b, 0);
               $('phraseProgress').innerHTML = `This phrase: <strong>${count}</strong> time(s) • Total attempts: <strong>${total}</strong>`;
               targetCard.style.display = 'block';

               clearTimeout(playerTimeout);
               playerTimeout = setTimeout(updatePlayer, 300);
          }

          // ===================== CONJUGATION PRACTICE =====================
          const CONJUGATION_PRONOUNS = [
               ['yo', 'yo'],
               ['tu', 'tú'],
               ['el', 'él / ella / usted'],
               ['nosotros', 'nosotros / nosotras'],
               ['vosotros', 'vosotros / vosotras'],
               ['ellos', 'ellos / ellas / ustedes'],
          ];

          const CONJUGATION_TENSES = [
               ['present', 'Present'],
               ['preterite', 'Preterite'],
               ['imperfect', 'Imperfect'],
               ['future', 'Future'],
               ['conditional', 'Conditional'],
          ];

          const CONJUGATION_IRREGULARS = {
               ser: { present: ['soy', 'eres', 'es', 'somos', 'sois', 'son'], preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'], imperfect: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'], future: ['seré', 'serás', 'será', 'seremos', 'seréis', 'serán'], conditional: ['sería', 'serías', 'sería', 'seríamos', 'seríais', 'serían'] },
               estar: { present: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'], preterite: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'] },
               tener: { present: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'], preterite: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'], future: ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán'], conditional: ['tendría', 'tendrías', 'tendría', 'tendríamos', 'tendríais', 'tendrían'] },
               hacer: { present: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'], preterite: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'], future: ['haré', 'harás', 'hará', 'haremos', 'haréis', 'harán'], conditional: ['haría', 'harías', 'haría', 'haríamos', 'haríais', 'harían'] },
               ir: { present: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'], preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'], imperfect: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'], future: ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán'], conditional: ['iría', 'irías', 'iría', 'iríamos', 'iríais', 'irían'] },
               poder: { present: ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden'], preterite: ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'], future: ['podré', 'podrás', 'podrá', 'podremos', 'podréis', 'podrán'], conditional: ['podría', 'podrías', 'podría', 'podríamos', 'podríais', 'podrían'] },
          };

          let conjugationVerbs = [];
          let conjugationPresentForms = {};
          let conjugationStemChanges = {};

          const CONJUGATION_STEM_CHANGE_OVERRIDES = {
               acostar: 'o→ue',
               despertar: 'e→ie',
               entender: 'e→ie',
               preferir: 'e→ie',
               sentir: 'e→ie',
               servir: 'e→i',
               vestir: 'e→i',
          };

          const CONJUGATION_ENDINGS = {
               present: { ar: ['o', 'as', 'a', 'amos', 'áis', 'an'], er: ['o', 'es', 'e', 'emos', 'éis', 'en'], ir: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
               preterite: { ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'], er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'], ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
               imperfect: { ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'], er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'], ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
          };

          function conjugateVerb(verb, tense) {
               if (verb.irregular && verb.irregular[tense]) return verb.irregular[tense];
               if (tense === 'present' && verb.present) {
                    if (verb.present.length === 7) {
                         verb.present.shift();
                    }
                    return verb.present;
               }
               const ending = verb.infinitive.slice(-2);
               if (tense === 'future' || tense === 'conditional') {
                    const suffixes = tense === 'future' ? ['é', 'ás', 'á', 'emos', 'éis', 'án'] : ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
                    return suffixes.map(suffix => verb.infinitive + suffix);
               }
               const stem = verb.infinitive.slice(0, -2);
               const forms = CONJUGATION_ENDINGS[tense][ending].map(suffix => stem + suffix);
               if (tense === 'present' && verb.stemChange) {
                    const changedStem = applyStemChange(stem, verb.stemChange);
                    [0, 1, 2, 5].forEach(index => {
                         forms[index] = changedStem + CONJUGATION_ENDINGS[tense][ending][index];
                    });
               }
               if (tense === 'present' && verb.yoForm) forms[0] = verb.yoForm;
               return forms;
          }

          function applyStemChange(stem, change) {
               const [from, to] = change.split('→');
               const position = stem.lastIndexOf(from);
               return position >= 0 ? stem.slice(0, position) + to + stem.slice(position + from.length) : stem;
          }

          async function loadConjugationVerbs() {
               const status = $('conjugationVerbStatus');
               try {
                    const response = await fetch('sections/verbs/verbs.html');
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const html = await response.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    try {
                         const irregularResponse = await fetch('sections/verbs/irregular-verbs.html');
                         if (irregularResponse.ok) {
                              const irregularDoc = new DOMParser().parseFromString(await irregularResponse.text(), 'text/html');
                              irregularDoc.querySelectorAll('table').forEach(table => {
                                   const headers = Array.from(table.querySelectorAll('thead th')).map(cell => cell.textContent.replace(/\s+/g, ' ').trim().toLowerCase());
                                   if (headers.length !== 7 && headers.length !== 8) return;
                                   if (headers[0] !== 'verb') return;
                                   if (headers.length === 8) {
                                        const heading = table.previousElementSibling?.textContent.replace(/\s+/g, ' ').trim() || '';
                                        const change = heading.match(/([eou])\s*→\s*([ieou]+)/i)?.[0]?.replace(/\s+/g, '') || '';
                                        table.querySelectorAll('tbody tr').forEach(row => {
                                             const cells = row.querySelectorAll('td');
                                             const infinitive = cells[0]?.querySelector('[data-text]')?.getAttribute('data-text')?.toLowerCase();
                                             if (infinitive && change) conjugationStemChanges[infinitive] = change;
                                        });
                                   }
                                   table.querySelectorAll('tbody tr').forEach(row => {
                                        const cells = row.querySelectorAll('td');
                                        const forms = Array.from(cells).map(cell => cell.querySelector('[data-text]')?.getAttribute('data-text') || cell.textContent.trim());
                                        const infinitive = forms[0]?.toLowerCase();
                                        if (infinitive && forms.length === 8) conjugationPresentForms[infinitive] = forms.slice(1).map(form => form.toLowerCase());
                                   });
                              });
                              irregularDoc.querySelectorAll('p').forEach(paragraph => {
                                   const text = paragraph.textContent.replace(/\s+/g, ' ').trim();
                                   const match = text.match(/^More\s+([eou])\s*→\s*([ieou]+)\s+verbs:/i);
                                   if (!match) return;
                                   const change = `${match[1]}→${match[2]}`.toLowerCase();
                                   paragraph.querySelectorAll('[data-text]').forEach(node => {
                                        const infinitive = node.getAttribute('data-text').trim().toLowerCase();
                                        if (/(ar|er|ir)$/.test(infinitive)) conjugationStemChanges[infinitive] = change;
                                   });
                              });
                         }
                    } catch (error) {
                         console.warn('Could not load irregular present-tense forms', error);
                    }
                    const rows = Array.from(doc.querySelectorAll('table tbody tr'));
                    const seen = new Set();
                    conjugationVerbs = rows
                         .map(row => {
                              const cells = row.querySelectorAll('td');
                              const infinitive = (cells[0]?.querySelector('[data-text]')?.getAttribute('data-text') || cells[0]?.textContent || '').trim().toLowerCase();
                              const meaning = (cells[2]?.textContent || '').replace(/\s+/g, ' ').trim();
                              const yoForm = (cells[3]?.querySelector('[data-text]')?.getAttribute('data-text') || cells[3]?.textContent || '').trim().toLowerCase();
                              if (!infinitive || !/(ar|er|ir)$/.test(infinitive) || seen.has(infinitive)) return null;
                              seen.add(infinitive);
                              return { infinitive, meaning: meaning || 'verb', yoForm, present: conjugationPresentForms[infinitive], stemChange: conjugationStemChanges[infinitive] || CONJUGATION_STEM_CHANGE_OVERRIDES[infinitive], irregular: CONJUGATION_IRREGULARS[infinitive] };
                         })
                         .filter(Boolean);
                    if (!conjugationVerbs.length) throw new Error('No verbs found');
                    status.textContent = `${conjugationVerbs.length} verbs loaded from verbs.html`;
                    status.className = 'conjugation-source-status loaded';
                    renderConjugationVerbOptions();
               } catch (error) {
                    status.textContent = 'Could not load verbs.html. Start the local server to use conjugation practice.';
                    status.className = 'conjugation-source-status error';
                    $('newConjugationBtn').disabled = true;
                    $('randomConjugationVerbBtn').disabled = true;
                    console.warn('Could not load conjugation verbs', error);
               }
          }

          function renderConjugationVerbOptions() {
               const verbSelect = $('conjugationVerb');
               verbSelect.innerHTML = conjugationVerbs.map((verb, index) => `<option value="${index}">${verb.infinitive} (${verb.meaning.replace(/</g, '&lt;').replace(/>/g, '&gt;')})</option>`).join('');
               verbSelect.disabled = false;
               $('newConjugationBtn').disabled = false;
               $('randomConjugationVerbBtn').disabled = false;
               renderConjugationPrompt();
          }

          // ===================== CONJUGATION TRANSLATIONS =====================
          function getConjugationTranslation(verb, tenseKey, pronounKey) {
               const meaning = verb.meaning || '';
               let baseMeaning = meaning.replace(/^to /i, '').trim();

               const irregularPastTenses = {
                    hide: 'hid',
                    write: 'wrote',
                    speak: 'spoke',
                    break: 'broke',
                    choose: 'chose',
                    drive: 'drove',
                    eat: 'ate',
                    fall: 'fell',
                    give: 'gave',
                    go: 'went',
                    know: 'knew',
                    run: 'ran',
                    see: 'saw',
                    take: 'took',
                    think: 'thought',
                    buy: 'bought',
                    bring: 'brought',
                    catch: 'caught',
                    teach: 'taught',
                    build: 'built',
                    send: 'sent',
                    spend: 'spent',
                    lose: 'lost',
                    mean: 'meant',
                    sleep: 'slept',
                    feel: 'felt',
                    keep: 'kept',
                    leave: 'left',
                    meet: 'met',
                    read: 'read',
                    say: 'said',
                    tell: 'told',
                    understand: 'understood',
                    win: 'won',
                    hold: 'held',
                    sit: 'sat',
                    stand: 'stood',
                    get: 'got',
                    forget: 'forgot',
                    have: 'had',
                    make: 'made',
                    pay: 'paid',
                    sell: 'sold',
                    wear: 'wore',
                    find: 'found',
                    hear: 'heard',
               };

               function getPastTense(word) {
                    if (irregularPastTenses[word]) return irregularPastTenses[word];
                    if (word.endsWith('e')) return word + 'd';
                    if (word.endsWith('y')) return word.slice(0, -1) + 'ied';
                    if (/[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(word)) {
                         return word + word.slice(-1) + 'ed';
                    }
                    return word + 'ed';
               }

               function getThirdPerson(word) {
                    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
                         return word + 'es';
                    }
                    if (word.endsWith('y') && !/[aeiou]/.test(word.slice(-2, -1))) {
                         return word.slice(0, -1) + 'ies';
                    }
                    return word + 's';
               }

               switch (tenseKey) {
                    case 'present':
                         if (pronounKey === 'yo') return `I ${baseMeaning}`;
                         if (pronounKey === 'tu') return `you ${baseMeaning}`;
                         if (pronounKey === 'el') return `he / she / you ${getThirdPerson(baseMeaning)}`;
                         if (pronounKey === 'nosotros') return `we ${baseMeaning}`;
                         if (pronounKey === 'vosotros') return `you all (plural) ${baseMeaning}`;
                         if (pronounKey === 'ellos') return `they ${baseMeaning}`;
                         break;

                    case 'preterite':
                         const pastForm = getPastTense(baseMeaning);
                         if (pronounKey === 'yo') return `I ${pastForm}`;
                         if (pronounKey === 'tu') return `you ${pastForm}`;
                         if (pronounKey === 'el') return `he / she ${pastForm}`;
                         if (pronounKey === 'nosotros') return `we ${pastForm}`;
                         if (pronounKey === 'vosotros') return `you (plural) ${pastForm}`;
                         if (pronounKey === 'ellos') return `they ${pastForm}`;
                         break;

                    case 'imperfect':
                         if (pronounKey === 'yo') return `I used to ${baseMeaning}`;
                         if (pronounKey === 'tu') return `you used to ${baseMeaning}`;
                         if (pronounKey === 'el') return `he / she used to ${baseMeaning}`;
                         if (pronounKey === 'nosotros') return `we used to ${baseMeaning}`;
                         if (pronounKey === 'vosotros') return `you (plural) used to ${baseMeaning}`;
                         if (pronounKey === 'ellos') return `they used to ${baseMeaning}`;
                         break;

                    case 'future':
                         if (pronounKey === 'yo') return `I will ${baseMeaning}`;
                         if (pronounKey === 'tu') return `you will ${baseMeaning}`;
                         if (pronounKey === 'el') return `he / she will ${baseMeaning}`;
                         if (pronounKey === 'nosotros') return `we will ${baseMeaning}`;
                         if (pronounKey === 'vosotros') return `you (plural) will ${baseMeaning}`;
                         if (pronounKey === 'ellos') return `they will ${baseMeaning}`;
                         break;

                    case 'conditional':
                         if (pronounKey === 'yo') return `I would ${baseMeaning}`;
                         if (pronounKey === 'tu') return `you would ${baseMeaning}`;
                         if (pronounKey === 'el') return `he / she would ${baseMeaning}`;
                         if (pronounKey === 'nosotros') return `we would ${baseMeaning}`;
                         if (pronounKey === 'vosotros') return `you (plural) would ${baseMeaning}`;
                         if (pronounKey === 'ellos') return `they would ${baseMeaning}`;
                         break;
               }

               return meaning;
          }

          // ===================== CONJUGATION SETUP =====================
          function setupConjugation() {
               const verbSelect = $('conjugationVerb');
               const tenseSelect = $('conjugationTense');
               const pronounSelect = $('conjugationPronoun');
               if (!verbSelect || !tenseSelect || !pronounSelect) return;

               verbSelect.disabled = true;
               tenseSelect.innerHTML = CONJUGATION_TENSES.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
               pronounSelect.innerHTML = CONJUGATION_PRONOUNS.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');

               function currentPrompt() {
                    const verb = conjugationVerbs[Number(verbSelect.value)];
                    if (!verb) return null;
                    const tense = CONJUGATION_TENSES.find(item => item[0] === tenseSelect.value);
                    const pronoun = CONJUGATION_PRONOUNS.find(item => item[0] === pronounSelect.value);
                    const forms = conjugateVerb(verb, tenseSelect.value);
                    const index = CONJUGATION_PRONOUNS.findIndex(item => item[0] === pronounSelect.value);
                    return {
                         verb: verb,
                         tense: tense ? tense[1] : '',
                         tenseKey: tenseSelect.value,
                         pronoun: pronoun ? pronoun[1] : '',
                         pronounKey: pronounSelect.value,
                         answer: forms ? forms[index] : '',
                    };
               }

               function displayConjugationPrompt(verb, tenseKey, pronounKey, answer, showAnswer) {
                    const promptDiv = $('conjugationPrompt');
                    if (!promptDiv) return;

                    const tenseLabel = CONJUGATION_TENSES.find(t => t[0] === tenseKey)?.[1] || tenseKey;
                    const pronounLabel = CONJUGATION_PRONOUNS.find(p => p[0] === pronounKey)?.[1] || pronounKey;
                    const translation = getConjugationTranslation(verb, tenseKey, pronounKey);

                    let answerHtml = '';
                    if (showAnswer && answer) {
                         answerHtml = `<div style="font-size: 1.2rem; color: var(--good, #22c55e); margin-top: 4px;">→ ${answer}</div>`;
                    }

                    promptDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <strong>${pronounLabel}</strong>
                    <span style="font-size: 1.1rem; font-weight: 500;">${verb.infinitive}</span>
                    <button type="button" id="conjugationHearInfinitiveBtn" 
                            style="padding: 2px 8px; font-size: 0.9rem; background: var(--accent, #3b82f6); color: white; border: none; border-radius: 4px; cursor: pointer;" 
                            title="Hear the infinitive">
                        🔊
                    </button>
                    <small style="color: var(--muted);">(${tenseLabel})</small>
                </div>
                <div style="color: var(--muted); font-size: 0.95rem;">${translation}</div>
                ${answerHtml}
            </div>
        `;

                    const hearBtn = document.getElementById('conjugationHearInfinitiveBtn');
                    if (hearBtn) {
                         hearBtn.addEventListener('click', function (e) {
                              e.stopPropagation();
                              const langSelect = $('conjugationLang') || $('lang');
                              const langCode = langSelect ? langSelect.value : 'es-MX';
                              playAudioFromServer(verb.infinitive, langCode);
                         });
                    }
               }

               function renderPrompt() {
                    const prompt = currentPrompt();
                    if (!prompt) return;

                    displayConjugationPrompt(prompt.verb, prompt.tenseKey, prompt.pronounKey, null, false);

                    const input = $('conjugationAnswer');
                    input.value = '';
                    input.disabled = false;
                    $('conjugationFeedback').innerHTML = 'Type the conjugated form.';
                    $('conjugationFeedback').className = 'conjugation-feedback';
                    input.focus();
                    enableConjugationAccentBar();

                    const langSelect = $('conjugationLang') || $('lang');
                    const langCode = langSelect ? langSelect.value : 'es-MX';
                    playAudioFromServer(prompt.verb.infinitive, langCode);
               }

               function randomizeVerb() {
                    if (!conjugationVerbs.length) return;
                    let next = Math.floor(Math.random() * conjugationVerbs.length);
                    if (conjugationVerbs.length > 1 && next === Number(verbSelect.value)) next = (next + 1) % conjugationVerbs.length;
                    verbSelect.value = String(next);

                    if ($('conjugationRandomPronoun').checked && pronounSelect.options.length > 1) {
                         randomizeSelect(pronounSelect);
                    }
                    if ($('conjugationRandomTense').checked && tenseSelect.options.length > 1) {
                         randomizeSelect(tenseSelect);
                    }

                    renderPrompt();
               }

               function randomizeSelect(select) {
                    const current = select.value;
                    let next = Math.floor(Math.random() * select.options.length);
                    if (select.options.length > 1 && select.options[next].value === current) next = (next + 1) % select.options.length;
                    select.value = select.options[next].value;
               }

               function advanceConjugationPrompt() {
                    const input = $('conjugationAnswer');
                    input.disabled = false;
                    input.value = '';

                    if ($('conjugationAutoAdvance').checked) {
                         randomizeVerb();
                    } else {
                         if ($('conjugationRandomPronoun').checked) randomizeSelect(pronounSelect);
                         if ($('conjugationRandomTense').checked) randomizeSelect(tenseSelect);
                         renderPrompt();
                    }
               }

               function checkAnswer(revealOnly) {
                    const prompt = currentPrompt();
                    if (!prompt) return;
                    const answer = $('conjugationAnswer').value.trim();

                    if (!revealOnly && !answer) {
                         $('conjugationFeedback').textContent = '⚠️ Type an answer first.';
                         $('conjugationFeedback').className = 'conjugation-feedback warning';
                         return;
                    }

                    if (!revealOnly) {
                         conjugationState.attempted++;
                         const normalizedAnswer = normalize(answer);
                         const normalizedCorrect = normalize(prompt.answer);
                         const correct = normalizedAnswer === normalizedCorrect;

                         if (correct) conjugationState.correct++;

                         displayConjugationPrompt(prompt.verb, prompt.tenseKey, prompt.pronounKey, prompt.answer, true);

                         const langSelect = $('conjugationLang') || $('lang');
                         const langCode = langSelect ? langSelect.value : 'es-MX';
                         playAudioFromServer(prompt.answer, langCode);

                         let feedbackMsg = '';
                         let feedbackClass = '';

                         if (correct) {
                              feedbackMsg = '✅ Correct!';
                              feedbackClass = 'good';
                         } else {
                              if (normalizedAnswer.length > 0) {
                                   const sim = calculateSimilarity(normalizedAnswer, normalizedCorrect);
                                   if (sim > 0.7) {
                                        feedbackMsg = `❌ Close! The correct answer is «${prompt.answer}»`;
                                   } else {
                                        feedbackMsg = `❌ Not quite. The correct answer is «${prompt.answer}»`;
                                   }
                              } else {
                                   feedbackMsg = `❌ The correct answer is «${prompt.answer}»`;
                              }
                              feedbackClass = 'bad';
                         }

                         $('conjugationFeedback').innerHTML = `
                <div class="${feedbackClass}" style="padding: 8px; border-radius: 6px;">
                    <strong>${feedbackMsg}</strong>
                    ${!correct ? `<br><span style="font-size: 0.9rem; color: var(--muted);">You typed: «${answer}»</span>` : ''}
                    ${!correct && normalizedAnswer.length > 0 ? `<br><span style="font-size: 0.85rem; color: var(--muted);">Check spelling and accents!</span>` : ''}
                </div>
            `;
                         $('conjugationFeedback').className = 'conjugation-feedback';

                         disableConjugationAccentBar();
                         const input = $('conjugationAnswer');
                         input.disabled = true;

                         if (correct && $('conjugationAutoAdvance').checked) {
                              setTimeout(advanceConjugationPrompt, 1500);
                         } else if (correct && ($('conjugationRandomPronoun').checked || $('conjugationRandomTense').checked)) {
                              setTimeout(advanceConjugationPrompt, 1500);
                         }
                    } else {
                         displayConjugationPrompt(prompt.verb, prompt.tenseKey, prompt.pronounKey, prompt.answer, true);
                         $('conjugationFeedback').innerHTML = `
                <div style="padding: 8px; border-radius: 6px; background: var(--tips-bg);">
                    <strong>Answer:</strong> «${prompt.answer}»
                </div>
            `;
                         $('conjugationFeedback').className = 'conjugation-feedback';
                         const langSelect = $('conjugationLang') || $('lang');
                         const langCode = langSelect ? langSelect.value : 'es-MX';
                         playAudioFromServer(prompt.answer, langCode);
                         disableConjugationAccentBar();
                         const input = $('conjugationAnswer');
                         input.disabled = true;
                    }

                    $('conjugationProgress').textContent = `${conjugationState.correct} correct / ${conjugationState.attempted} attempted`;
               }

               function calculateSimilarity(a, b) {
                    if (!a || !b) return 0;
                    const longer = a.length > b.length ? a : b;
                    const shorter = a.length > b.length ? b : a;
                    if (!longer.length) return 1;
                    return (longer.length - editDistance(longer, shorter)) / longer.length;
               }

               verbSelect.addEventListener('change', function () {
                    if ($('conjugationRandomPronoun').checked && pronounSelect.options.length > 1) {
                         randomizeSelect(pronounSelect);
                    }
                    if ($('conjugationRandomTense').checked && tenseSelect.options.length > 1) {
                         randomizeSelect(tenseSelect);
                    }
                    renderPrompt();
               });

               tenseSelect.addEventListener('change', renderPrompt);
               pronounSelect.addEventListener('change', renderPrompt);
               window.renderConjugationPrompt = renderPrompt;
               $('newConjugationBtn').onclick = renderPrompt;
               $('randomConjugationVerbBtn').onclick = randomizeVerb;
               $('checkConjugationBtn').onclick = () => checkAnswer(false);
               $('revealConjugationBtn').onclick = () => checkAnswer(true);
               $('hearConjugationBtn').onclick = () => {
                    const prompt = currentPrompt();
                    if (!prompt || !prompt.answer) return;
                    const langSelect = $('conjugationLang') || $('lang');
                    const langCode = langSelect ? langSelect.value : 'es-MX';
                    playAudioFromServer(prompt.answer, langCode);
               };
               $('conjugationAnswer').addEventListener('keydown', event => {
                    if (event.key === 'Enter') checkAnswer(false);
               });

               const accentKeys = document.querySelectorAll('#conjugationPanel .accent-key');
               accentKeys.forEach(btn => {
                    btn.addEventListener('mousedown', function (e) {
                         e.preventDefault();
                         const char = this.getAttribute('data-char') || '';
                         insertConjugationAccent(char, e.shiftKey);
                    });
               });

               function disableConjugationAccentBar() {
                    document.querySelectorAll('#conjugationPanel .accent-key').forEach(function (btn) {
                         btn.disabled = true;
                    });
               }

               function enableConjugationAccentBar() {
                    document.querySelectorAll('#conjugationPanel .accent-key').forEach(function (btn) {
                         btn.disabled = false;
                    });
               }

               loadConjugationVerbs();
          }

          // ===================== TAB INITIALIZATION =====================
          function initConjugationTab() {
               if ($('conjugationVerb')) {
                    setupConjugation();
               }
          }

          // ===================== EVENTS =====================
          let debounce;
          if (targetInput) {
               targetInput.addEventListener('input', () => {
                    clearTimeout(debounce);
                    debounce = setTimeout(showTargetInfo, 300);
               });
          }

          if ($('showPhonetic')) $('showPhonetic').addEventListener('change', showTargetInfo);
          if ($('testMode')) $('testMode').addEventListener('change', showTargetInfo);
          if ($('ttsRate')) {
               $('ttsRate').addEventListener('input', e => {
                    if ($('rateValue')) $('rateValue').textContent = e.target.value;
               });
          }

          // Initialize conjugation if on the tab
          if ($('conjugationVerb')) {
               initConjugationTab();
          }

          // ===================== THEME =====================
          function setTheme(t) {
               document.documentElement.setAttribute('data-theme', t);
               if ($('themeBtn')) $('themeBtn').textContent = t === 'dark' ? '☀️' : '🌙';
               localStorage.setItem('sp_theme', t);
          }

          setTheme(savedTheme);
          if ($('themeBtn')) {
               $('themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
          }

          // ===================== SPEAK =====================
          if (speakBtn) {
               speakBtn.onclick = () => {
                    const text = targetInput.value.trim();
                    if (!text) return alert('Enter or select a phrase first');
                    const langCode = $('lang').value;
                    playAudioFromServer(text, langCode);
               };
          }

          // ===================== RANDOM =====================
          if (randomBtn) {
               randomBtn.onclick = () => {
                    const keys = getFilteredKeys();
                    if (!keys.length) {
                         resultCard.innerHTML = '<span class="bad">No matches for current filters.</span>';
                         return;
                    }
                    const k = keys[Math.floor(Math.random() * keys.length)];
                    targetInput.value = k;
                    showTargetInfo();
                    resultCard.innerHTML = `Loaded: <strong>«${k}»</strong>`;
               };
          }

          // ===================== STAR =====================
          if (starBtn) {
               starBtn.onclick = () => {
                    const key = normalize(targetInput.value.trim());
                    if (!key) return;
                    const idx = favorites.indexOf(key);
                    if (idx >= 0) favorites.splice(idx, 1);
                    else favorites.push(key);
                    saveAll();
                    showTargetInfo();
               };
          }

          // ===================== WEAK =====================
          if ($('weakBtn')) {
               $('weakBtn').onclick = () => {
                    let weak = Object.entries(progress)
                         .filter(([k, c]) => c > 0)
                         .sort((a, b) => a[1] - b[1]);
                    if (extraPool && extraPool.length) {
                         const set = new Set(extraPool.map(w => w.toLowerCase()));
                         const inPool = weak.filter(([k]) => set.has(k.toLowerCase()));
                         if (inPool.length) weak = inPool;
                    }
                    weak = weak.slice(0, 15).map(x => x[0]);
                    if (!weak.length) {
                         if (extraPool && extraPool.length) {
                              const k = extraPool[Math.floor(Math.random() * extraPool.length)];
                              targetInput.value = k;
                              showTargetInfo();
                              resultCard.innerHTML = `No weak scores in this pool yet. Random from pool: <strong>«${k}»</strong>`;
                              return;
                         }
                         resultCard.innerHTML = 'No weak phrases yet. Practice more!';
                         return;
                    }
                    const k = weak[Math.floor(Math.random() * weak.length)];
                    targetInput.value = k;
                    showTargetInfo();
                    resultCard.innerHTML = `Weak phrase: <strong>«${k}»</strong>`;
               };
          }

          // ===================== RECORD =====================
          if (recordBtn) {
               recordBtn.onclick = async () => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                         mediaRecorder.stop();
                         recordBtn.textContent = '⏺ Record me';
                         return;
                    }
                    try {
                         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                         mediaRecorder = new MediaRecorder(stream);
                         audioChunks = [];
                         mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                         mediaRecorder.onstop = () => {
                              myRecording = new Blob(audioChunks, { type: 'audio/webm' });
                              playMyBtn.disabled = false;
                              stream.getTracks().forEach(t => t.stop());
                         };
                         mediaRecorder.start();
                         recordBtn.textContent = '⏹ Stop';
                    } catch (err) {
                         alert('Microphone access needed for recording.');
                    }
               };
          }

          if (playMyBtn) {
               playMyBtn.onclick = () => {
                    if (myRecording) {
                         const url = URL.createObjectURL(myRecording);
                         new Audio(url).play();
                    }
               };
          }

          // ===================== PLAYER =====================
          if ($('playerBtn')) {
               $('playerBtn').onclick = () => {
                    const text = targetInput.value.trim();
                    if (!text) {
                         alert('Enter or select a phrase first');
                         return;
                    }
                    playerContainer.style.display = 'block';
                    playerVisible = true;
                    $('togglePlayerBtn').textContent = '▼ Hide';
                    updatePlayer();
               };
          }

          if ($('togglePlayerBtn')) {
               $('togglePlayerBtn').onclick = () => {
                    playerVisible = !playerVisible;
                    const iframe = $('playerFrame');
                    const status = $('playerStatus');

                    if (playerVisible) {
                         iframe.style.display = 'block';
                         status.style.display = 'block';
                         $('togglePlayerBtn').textContent = '▼ Hide';
                         if (targetInput.value.trim()) updatePlayer();
                    } else {
                         iframe.style.display = 'none';
                         status.style.display = 'none';
                         $('togglePlayerBtn').textContent = '▲ Show';
                    }
               };
          }

          if ($('refreshPlayerBtn')) $('refreshPlayerBtn').onclick = updatePlayer;
          if ($('openPlayerBtn')) $('openPlayerBtn').onclick = openPlayerInNewTab;
          if ($('testPlayerBtn')) $('testPlayerBtn').onclick = testPlayerConnection;
          if ($('lang')) $('lang').addEventListener('change', updatePlayer);

          // ===================== HISTORY & STATS =====================
          if ($('historyBtn')) {
               $('historyBtn').onclick = () => {
                    const list = $('historyList');
                    if (!practiceHistory.length) list.innerHTML = '<p>No history yet.</p>';
                    else {
                         list.innerHTML = practiceHistory
                              .slice()
                              .reverse()
                              .map(h => `<div class="history-item"><strong>${h.phrase}</strong> — ${(h.score * 100).toFixed(0)}% <span style="color:var(--muted)">${new Date(h.date).toLocaleString()}</span></div>`)
                              .join('');
                    }
                    $('historyModal').classList.add('open');
               };
          }

          if ($('statsBtn')) {
               $('statsBtn').onclick = () => {
                    const entries = Object.entries(progress).sort((a, b) => b[1] - a[1]);
                    const most =
                         entries
                              .slice(0, 8)
                              .map(([k, v]) => `${k}: ${v}×`)
                              .join('<br>') || 'None';
                    const least =
                         entries
                              .slice(-8)
                              .reverse()
                              .map(([k, v]) => `${k}: ${v}×`)
                              .join('<br>') || 'None';
                    $('statsContent').innerHTML = `
            <p><strong>Most practiced</strong><br>${most}</p>
            <p><strong>Least practiced</strong><br>${least}</p>
            <p>Favorites: ${favorites.length}</p>
            <p>Total unique phrases: ${Object.keys(progress).length}</p>
        `;
                    $('statsModal').classList.add('open');
               };
          }

          // ===================== EXPORT / IMPORT =====================
          if ($('exportBtn')) {
               $('exportBtn').onclick = () => {
                    const data = { progress, favorites, practiceHistory, streakData, srs };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'spanish-progress.json';
                    a.click();
               };
          }

          if ($('importBtn')) {
               $('importBtn').onclick = () => {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.accept = '.json';
                    inp.onchange = e => {
                         const f = e.target.files[0];
                         if (!f) return;
                         const reader = new FileReader();
                         reader.onload = () => {
                              try {
                                   const data = JSON.parse(reader.result);
                                   if (data.progress) progress = data.progress;
                                   if (data.favorites) favorites = data.favorites;
                                   if (data.practiceHistory) practiceHistory = data.practiceHistory;
                                   if (data.history) practiceHistory = data.history; // backward compatibility
                                   if (data.streakData) streakData = data.streakData;
                                   if (data.srs) srs = data.srs;
                                   saveAll();
                                   updateStreak();
                                   alert('Progress imported successfully!');
                              } catch {
                                   alert('Invalid file');
                              }
                         };
                         reader.readAsText(f);
                    };
                    inp.click();
               };
          }

          // ===================== STREAK =====================
          function updateStreakDisplay() {
               const streakEl = $('streakDisplay');
               const goalEl = $('goalDisplay');
               const studyGoalEl = $('studyGoalDisplay');
               if (streakEl) streakEl.textContent = `🔥 Streak: ${streakData.count} day${streakData.count !== 1 ? 's' : ''}`;
               if (goalEl) goalEl.textContent = `Today: ${streakData.today} / 10`;
               if (studyGoalEl) studyGoalEl.textContent = `Today: ${streakData.today} / 10`;
          }
          updateStreakDisplay();

          // ===================== RESET & CLEAR =====================
          if ($('resetBtn')) {
               $('resetBtn').onclick = () => {
                    if (confirm('Reset ALL progress, favorites, history, streak and cards?')) {
                         progress = {};
                         favorites = [];
                         practiceHistory = [];
                         streakData = { count: 0, last: null, today: 0 };
                         srs = {};
                         saveAll();
                         updateStreakDisplay();
                         if ($('studyCard')) $('studyCard').style.display = 'none';
                         resultCard.innerHTML = '<span class="good">Everything reset.</span>';
                    }
               };
          }

          if ($('clearBtn')) {
               $('clearBtn').onclick = () => {
                    targetInput.value = '';
                    targetCard.style.display = 'none';
                    resultCard.innerHTML = 'Results will appear here…';
                    playerFrame.src = '';
                    playerStatus.innerHTML = '⏳ No word selected';
                    playerStatus.className = 'player-status';
                    if (recognition) recognition.stop();
                    synth.cancel();
               };
          }

          // ===================== SPEECH RECOGNITION =====================
          let recognition = null;
          let recognitionRetryCount = 0;
          const MAX_RETRIES = 2;
          let isNetworkErrorLoop = false;
          let isSpeaking = false;
          let recognitionTimeout = null;

          function resetListenBtn() {
               listenBtn.classList.remove('listening');
               listenBtn.textContent = '🎤 Speak';
               recognition = null;
          }

          function showRecognitionProgress(interimTranscript, confidence) {
               const confidencePercent = Math.round((confidence || 0) * 100);
               const confidenceColor = confidencePercent > 70 ? 'var(--good, #22c55e)' : confidencePercent > 40 ? 'var(--warning, #f59e0b)' : 'var(--bad, #ef4444)';

               resultCard.innerHTML = `
        <div class="listening-indicator">
            <span class="pulse-dot"></span>
            <strong>Listening:</strong> "${interimTranscript}"
            <span style="color: ${confidenceColor}; margin-left: 8px;">
                (${confidencePercent}% confidence)
            </span>
        </div>
    `;
          }

          async function ensureMicrophonePermission() {
               if (micPermissionGranted) return true;
               try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                         audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    });
                    stream.getTracks().forEach(t => t.stop());
                    micPermissionGranted = true;
                    return true;
               } catch (err) {
                    resultCard.innerHTML = `<span class="bad">❌ Microphone permission denied. Please allow it in the browser address bar.</span>`;
                    return false;
               }
          }

          if (listenBtn) {
               listenBtn.onclick = startListening;
          }
          if ($('tryAgainBtn')) {
               $('tryAgainBtn').onclick = () => {
                    resetListenBtn();
                    startListening();
               };
          }

          document.addEventListener('keydown', e => {
               if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
               if ($('studyCard') && $('studyCard').style.display !== 'none') return;
               if (e.code === 'Space') {
                    e.preventDefault();
                    startListening();
               }
               if (e.key === 'r' || e.key === 'R') randomBtn.click();
               if (e.key === 'h' || e.key === 'H') speakBtn.click();
               if (e.key === 't' || e.key === 'T') {
                    $('testMode').checked = !$('testMode').checked;
                    showTargetInfo();
               }
               if (e.key === 's' || e.key === 'S') starBtn.click();
               if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    $('playerBtn').click();
               }
          });

          document.querySelectorAll('.modal').forEach(m => {
               m.addEventListener('click', e => {
                    if (e.target === m) m.classList.remove('open');
               });
          });

          if (playerContainer) playerContainer.style.display = 'none';
          if ($('togglePlayerBtn')) $('togglePlayerBtn').textContent = '▼ Hide';
          if (playerStatus) playerStatus.innerHTML = '⏳ Select a word to load the player';

          if (!SpeechRecognition) {
               resultCard.innerHTML = '<span class="bad">Speech Recognition requires Chrome or Edge.</span>';
          }

          async function startListening() {
               const target = targetInput.value.trim();
               if (!target) {
                    resultCard.innerHTML = '⚠️ Enter or select a phrase first.';
                    return;
               }

               const allowed = await ensureMicrophonePermission();
               if (!allowed) return;

               if (isNetworkErrorLoop) {
                    resultCard.innerHTML = `
            <span class="bad">❌ Speech recognition is currently unavailable.</span>
            <div style="margin-top: 8px; font-size: 0.9rem;">
                <strong>Try these fixes:</strong>
                <ol style="margin: 8px 0; padding-left: 20px;">
                    <li>Check your internet connection</li>
                    <li>Try using a VPN</li>
                    <li>Use Chrome or Edge</li>
                    <li>Restart the browser</li>
                </ol>
                <button onclick="isNetworkErrorLoop=false; recognitionRetryCount=0; resultCard.innerHTML='Results will appear here…';"
                        style="background:#3b82f6;color:white;padding:6px 12px;border:none;border-radius:4px;cursor:pointer;">
                    🔄 Reset and try again
                </button>
            </div>`;
                    return;
               }

               if (!SpeechRecognition) {
                    resultCard.innerHTML = '<span class="bad">Speech Recognition not supported. Please use Chrome or Edge.</span>';
                    return;
               }

               if (recognition) {
                    try {
                         recognition.stop();
                    } catch (e) {}
                    // Wait a moment before starting a new one
                    await new Promise(resolve => setTimeout(resolve, 300));
                    recognition = null;
                    recognitionRetryCount = 0;
               }

               try {
                    recognition = new SpeechRecognition();
                    recognition.lang = $('lang').value;
                    recognition.interimResults = true;
                    recognition.maxAlternatives = 10;
                    recognition.continuous = false;

                    if ('grammars' in recognition) {
                         const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
                         if (SpeechGrammarList) {
                              const grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + target.toLowerCase() + ';';
                              const speechRecognitionList = new SpeechGrammarList();
                              speechRecognitionList.addFromString(grammar, 1);
                              recognition.grammars = speechRecognitionList;
                         }
                    }

                    if (recognitionTimeout) clearTimeout(recognitionTimeout);
                    recognitionTimeout = setTimeout(() => {
                         if (recognition) {
                              try {
                                   recognition.stop();
                              } catch (e) {}
                              resultCard.innerHTML = isSpeaking ? '<span class="bad">⏱️ Recognition timed out. Please try speaking more clearly.</span>' : '<span class="warning">⏱️ No speech detected. Please try speaking.</span>';
                         }
                    }, 12000);

                    recognition.onstart = () => {
                         listenBtn.classList.add('listening');
                         listenBtn.textContent = '🔴 Listening…';
                         resultCard.innerHTML = '🎤 Listening for your voice... Speak clearly!';
                         recognitionRetryCount = 0;
                         isNetworkErrorLoop = false;
                         isSpeaking = false;
                    };

                    recognition.onsoundstart = () => {
                         isSpeaking = true;
                         resultCard.innerHTML = '🗣️ Speaking detected... processing...';
                    };

                    recognition.onspeechstart = () => {
                         isSpeaking = true;
                         resultCard.innerHTML = '🗣️ Speech detected, processing...';
                    };

                    recognition.onnomatch = () => {
                         resultCard.innerHTML = '<span class="bad">❌ Could not recognize speech. Please speak clearly and try again.</span>';
                         isSpeaking = false;
                    };

                    recognition.onresult = ev => {
                         try {
                              let bestTranscript = '';
                              let bestConfidence = 0;
                              let isFinal = false;
                              let allAlternatives = [];
                              let interimTranscript = '';

                              for (let i = 0; i < ev.results.length; i++) {
                                   const result = ev.results[i];
                                   for (let j = 0; j < result.length; j++) {
                                        const alt = result[j];
                                        const cleanedText = alt.transcript.trim();
                                        allAlternatives.push({
                                             text: cleanedText,
                                             conf: alt.confidence || 0,
                                             final: result.isFinal,
                                        });
                                        if (result.isFinal) {
                                             if (alt.confidence > bestConfidence) {
                                                  bestConfidence = alt.confidence;
                                                  bestTranscript = cleanedText;
                                                  isFinal = true;
                                             }
                                        } else {
                                             interimTranscript = cleanedText;
                                        }
                                   }
                              }

                              if (!isFinal && interimTranscript) {
                                   showRecognitionProgress(interimTranscript, bestConfidence);
                                   return;
                              }

                              if (!isFinal || !bestTranscript) return;

                              allAlternatives = allAlternatives
                                   .filter(a => a.final)
                                   .filter((a, index, self) => index === self.findIndex(t => t.text.toLowerCase() === a.text.toLowerCase()))
                                   .sort((a, b) => b.conf - a.conf)
                                   .slice(0, 5);

                              if (recognitionTimeout) {
                                   clearTimeout(recognitionTimeout);
                                   recognitionTimeout = null;
                              }

                              const normalizedTarget = improvedNormalize(target);
                              const normalizedTranscript = improvedNormalize(bestTranscript);
                              const dynamicThresholds = getDynamicThresholds(target);

                              const targetWords = normalizedTarget.split(/\s+/).filter(Boolean);
                              const transcriptWords = normalizedTranscript.split(/\s+/).filter(Boolean);

                              const targetWordCount = targetWords.length;
                              const transcriptWordCount = transcriptWords.length;

                              function spanishPhoneticKey(text) {
                                   return text
                                        .toLowerCase()
                                        .normalize('NFD')
                                        .replace(/[\u0300-\u036f]/g, '')
                                        .replace(/ch/g, 'X')
                                        .replace(/ll/g, 'Y')
                                        .replace(/rr/g, 'R')
                                        .replace(/ñ/g, 'N')
                                        .replace(/qu/g, 'k')
                                        .replace(/c([ei])/g, 's$1')
                                        .replace(/g([ei])/g, 'x$1')
                                        .replace(/j/g, 'x')
                                        .replace(/z/g, 's')
                                        .replace(/v/g, 'b')
                                        .replace(/y/g, 'i')
                                        .replace(/h/g, '')
                                        .replace(/[aeiou]/g, 'V')
                                        .replace(/(.)\1+/g, '$1');
                              }

                              function phoneticSimilarity(a, b) {
                                   return similarity(spanishPhoneticKey(a), spanishPhoneticKey(b));
                              }

                              const charSimilarity = similarity(normalizedTarget, normalizedTranscript);
                              const phoneticSim = phoneticSimilarity(normalizedTarget, normalizedTranscript);

                              let matchedWords = [];
                              let orderedMatches = 0;
                              let used = new Set();
                              let extraWordsCount = 0;

                              for (let i = 0; i < targetWords.length; i++) {
                                   let bestSim = 0;
                                   let bestIdx = -1;

                                   for (let j = 0; j < transcriptWords.length; j++) {
                                        if (used.has(j)) continue;
                                        const sim = similarity(targetWords[i], transcriptWords[j]);
                                        if (sim > bestSim) {
                                             bestSim = sim;
                                             bestIdx = j;
                                        }
                                   }

                                   const threshold = targetWordCount === 1 ? dynamicThresholds.similarity : dynamicThresholds.similarity - 0.1;
                                   if (bestSim >= threshold && Math.abs(bestIdx - i) <= 1) {
                                        matchedWords.push(transcriptWords[bestIdx]);
                                        orderedMatches++;
                                        used.add(bestIdx);
                                   }
                              }

                              for (let j = 0; j < transcriptWords.length; j++) {
                                   if (!used.has(j)) extraWordsCount++;
                              }

                              const orderedRatio = targetWordCount > 0 ? orderedMatches / targetWordCount : 0;
                              const lengthRatio = Math.min(targetWordCount, transcriptWordCount) / Math.max(targetWordCount, transcriptWordCount || 1);

                              let combinedScore = 0;

                              if (targetWordCount === 1) {
                                   if (transcriptWordCount > 1) {
                                        let bestWordMatch = 0;
                                        for (const w of transcriptWords) {
                                             bestWordMatch = Math.max(bestWordMatch, similarity(targetWords[0], w));
                                        }
                                        if (bestWordMatch >= 0.9) {
                                             combinedScore = Math.max(0.25, 0.55 - extraWordsCount * 0.18);
                                        } else {
                                             combinedScore = Math.max(0.01, charSimilarity * 0.18);
                                        }
                                   } else {
                                        const wordSim = similarity(targetWords[0], transcriptWords[0] || '');
                                        if (wordSim < dynamicThresholds.charLevel) {
                                             combinedScore = Math.max(0.01, wordSim * 0.28);
                                        } else {
                                             combinedScore = Math.min(wordSim * 0.55 + phoneticSim * 0.45, 1.0);
                                        }
                                   }
                              } else {
                                   if (orderedRatio >= 0.85 && extraWordsCount <= 1 && lengthRatio > 0.8) {
                                        combinedScore = 0.92 + orderedRatio * 0.08;
                                   } else if (orderedRatio >= 0.55) {
                                        const wordScore = orderedRatio * 0.52;
                                        const charScore = charSimilarity * 0.18;
                                        const phoneScore = phoneticSim * 0.22;
                                        const extraPenalty = Math.min(extraWordsCount * 0.14, 0.38);
                                        const lengthPenalty = (1 - lengthRatio) * 0.22;
                                        combinedScore = Math.max(0, wordScore + charScore + phoneScore - extraPenalty - lengthPenalty);
                                   } else {
                                        combinedScore = Math.max(0.01, charSimilarity * 0.22 + phoneticSim * 0.28 + orderedRatio * 0.3 - 0.18);
                                   }
                              }

                              if (bestConfidence < 0.55 && targetWordCount <= 3) {
                                   combinedScore *= 0.65;
                              }

                              const weightedScore = Math.min(Math.max(combinedScore, 0), 1.0);

                              let isCompletelyWrong = false;
                              if (targetWordCount === 1) {
                                   const bestWordMatch = transcriptWords.reduce((best, w) => Math.max(best, similarity(targetWords[0], w)), 0);
                                   isCompletelyWrong = weightedScore < 0.48 || (transcriptWordCount > 1 && bestWordMatch < 0.88) || (transcriptWordCount === 1 && weightedScore < 0.42);
                              } else {
                                   isCompletelyWrong = orderedRatio < 0.25 || weightedScore < 0.32;
                              }

                              // ---------- Progress & history ----------
                              const key = normalizedTarget;
                              progress[key] = (progress[key] || 0) + 1;

                              // Make sure practiceHistory is an array before pushing
                              if (!Array.isArray(practiceHistory)) {
                                   practiceHistory = [];
                              }
                              practiceHistory.push({ phrase: target, score: weightedScore, date: Date.now() });
                              if (practiceHistory.length > 25) practiceHistory.shift();
                              updateStreak();
                              saveAll();
                              showTargetInfo();

                              if ($('testMode').checked) {
                                   $('meaningGuide').innerHTML = meaningLineHtml(target, true);
                              }

                              let feedback, cls;
                              if (weightedScore >= 0.88 && orderedRatio >= 0.75 && extraWordsCount <= 1) {
                                   feedback = '✅ Excellent!';
                                   cls = 'good';
                              } else if (weightedScore >= 0.68 && orderedRatio >= 0.5) {
                                   feedback = '👍 Pretty close';
                                   cls = 'ok';
                              } else if (isCompletelyWrong) {
                                   if (targetWordCount === 1) {
                                        if (transcriptWordCount > 1) {
                                             feedback = `❌ You said multiple words. Just say: «${target}»`;
                                        } else {
                                             feedback = `❌ That doesn't match. Say: «${target}»`;
                                        }
                                   } else {
                                        feedback = `❌ That doesn't match. Please say: «${target}»`;
                                   }
                                   cls = 'bad';
                              } else {
                                   feedback = '❌ Keep practicing';
                                   cls = 'bad';
                              }

                              const pct = Math.round(weightedScore * 100);
                              let barClass = 'low';
                              if (pct >= 75) barClass = 'high';
                              else if (pct >= 45) barClass = 'medium';

                              let matchDetails = '';
                              if (targetWordCount === 1 && transcriptWordCount > 1) {
                                   matchDetails = `
                        <div style="font-size:0.85rem;color:var(--warning);margin-top:4px;">
                            ⚠️ You said ${transcriptWordCount} words. Target is just: <strong>«${target}»</strong>
                        </div>`;
                              } else if (matchedWords.length > 0 && !isCompletelyWrong && weightedScore > 0.4) {
                                   matchDetails = `
                        <div style="font-size:0.85rem;color:var(--muted);margin-top:4px;">
                            ✅ Words matched: ${matchedWords.join(', ')}
                        </div>`;
                              } else if (weightedScore < 0.35) {
                                   matchDetails = `
                        <div style="font-size:0.85rem;color:var(--muted);margin-top:4px;">
                            🎯 Target: <strong>«${target}»</strong> → You said: <em>«${bestTranscript}»</em>
                        </div>`;
                              }

                              let altHtml = '';
                              if (allAlternatives.length > 1) {
                                   altHtml = `
                        <div style="font-size:0.8rem;color:var(--muted);margin-top:6px;">
                            Other possibilities: ${allAlternatives
                                 .slice(1)
                                 .map(a => `«${a.text}» (${Math.round(a.conf * 100)}%)`)
                                 .join(' • ')}
                        </div>`;
                              }

                              resultCard.innerHTML = `
                    <div><strong>You said:</strong> «${bestTranscript}»</div>
                    <div><strong>Target:</strong> «${target}»</div>
                    <div class="score">Similarity: <strong>${pct}%</strong>
                        ${bestConfidence > 0 ? ` • Confidence: ${Math.round(bestConfidence * 100)}%` : ''}
                    </div>
                    <div class="confidence-bar">
                        <div class="fill ${barClass}" style="width: ${pct}%"></div>
                    </div>
                    ${matchDetails}
                    ${altHtml}
                    <div class="${cls}" style="margin-top:8px;font-size:1.1rem;">${feedback}</div>
                    ${
                         isCompletelyWrong
                              ? `
                        <div style="margin-top:8px;padding:8px;background:var(--tips-bg);border-radius:6px;font-size:0.9rem;">
                            <strong>💡 Tip:</strong> Practice saying: <em>«${target}»</em>
                            ${targetWordCount === 1 ? ' (just one word)' : ''}
                        </div>`
                              : ''
                    }
                `;

                              if ($('autoAdvance').checked && weightedScore >= 0.88 && orderedRatio >= 0.75 && extraWordsCount <= 1) {
                                   setTimeout(() => randomBtn.click(), 1200);
                              }

                              isSpeaking = false;
                         } catch (err) {
                              console.error('Error processing result', err);
                              resultCard.innerHTML = '<span class="bad">Error processing speech. Please try again.</span>';
                         }
                    };

                    recognition.onerror = ev => {
                         if (recognitionTimeout) {
                              clearTimeout(recognitionTimeout);
                              recognitionTimeout = null;
                         }

                         let userMessage = '';
                         let shouldRetry = false;
                         let retryDelay = 1000;

                         switch (ev.error) {
                              case 'not-allowed':
                                   userMessage = '⚠️ Microphone permission denied. Click the 🔒 icon in the address bar to allow access.';
                                   micPermissionGranted = false;
                                   break;
                              case 'no-speech':
                                   userMessage = '🔇 No speech detected. Try speaking louder or check your microphone.';
                                   shouldRetry = true;
                                   retryDelay = 1500;
                                   break;
                              case 'audio-capture':
                                   userMessage = '🎤 No microphone found. Please connect a microphone and try again.';
                                   break;
                              case 'network':
                                   userMessage = '🌐 Network error connecting to speech recognition. ';
                                   if (recognitionRetryCount < MAX_RETRIES) {
                                        shouldRetry = true;
                                        userMessage += `Retrying... (${recognitionRetryCount + 1}/${MAX_RETRIES})`;
                                        retryDelay = 2000 * (recognitionRetryCount + 1);
                                   } else {
                                        isNetworkErrorLoop = true;
                                        userMessage += 'Service unavailable. Check your internet connection.';
                                   }
                                   break;
                              case 'aborted':
                                   return;
                              case 'language-not-supported':
                                   userMessage = '🌍 Selected language is not supported. Try a different Spanish variant.';
                                   break;
                              default:
                                   userMessage = `❌ Error: ${ev.error || 'unknown'}. Please try again.`;
                                   shouldRetry = true;
                         }

                         resultCard.innerHTML = `<span class="bad">${userMessage}</span>`;

                         if (shouldRetry && !isNetworkErrorLoop) {
                              recognitionRetryCount++;
                              setTimeout(() => {
                                   recognition = null;
                                   startListening();
                              }, retryDelay);
                         } else {
                              if (['not-allowed', 'audio-capture', 'language-not-supported'].includes(ev.error)) {
                                   resetListenBtn();
                              }
                              recognitionRetryCount = 0;
                              isSpeaking = false;
                         }
                    };

                    recognition.onend = () => {
                         if (recognitionTimeout) {
                              clearTimeout(recognitionTimeout);
                              recognitionTimeout = null;
                         }
                         resetListenBtn();
                         recognitionRetryCount = 0;
                         isSpeaking = false;
                    };

                    recognition.start();
               } catch (err) {
                    resetListenBtn();
                    resultCard.innerHTML = `<span class="bad">❌ Error starting speech recognition: ${err.message}</span>`;
               }
          }

          // ===================== CATEGORY CHANGE =====================
          if ($('category')) {
               $('category').addEventListener('change', function () {
                    extraPool = null;
               });
          }

          // ===================== TOP 1000 =====================
          if ($('top1000Btn')) {
               $('top1000Btn').onclick = () => {
                    if (typeof TOP1000 === 'undefined' || !TOP1000.length) {
                         resultCard.innerHTML = '<span class="bad">Top 1000 list is not loaded.</span>';
                         return;
                    }
                    extraPool = TOP1000.slice();
                    $('category').value = 'all';
                    $('difficulty').value = 'all';
                    resultCard.innerHTML = `Pool: Top 1000 (${extraPool.length} words). Click Random or Weak.`;
               };
          }

          // ===================== PRACTICE PARAMS =====================
          (function applyPracticeParams() {
               if (document.body.classList.contains('study-page')) return;
               const params = new URLSearchParams(window.location.search);
               const fromPage = params.get('from') === 'page' || params.get('mode') === 'quiz' || params.get('pool') === 'page';
               if (fromPage) {
                    try {
                         const launch = JSON.parse(localStorage.getItem('sp_launch') || 'null');
                         if (launch && typeof launch === 'object') {
                              if (Array.isArray(launch.items) && launch.items.length) {
                                   sessionStorage.setItem(
                                        'sp_page_quiz',
                                        JSON.stringify({
                                             sectionId: launch.sectionId || '',
                                             label: launch.label || '',
                                             items: launch.items,
                                        })
                                   );
                              }
                              if (Array.isArray(launch.pairs)) sessionStorage.setItem('sp_page_pairs', JSON.stringify(launch.pairs));
                              if (Array.isArray(launch.words) && launch.words.length) sessionStorage.setItem('sp_page_pool', JSON.stringify(launch.words));
                              if (launch.label) sessionStorage.setItem('sp_page_label', launch.label);
                              if (launch.gloss && typeof launch.gloss === 'object') sessionStorage.setItem('sp_page_gloss', JSON.stringify(launch.gloss));
                              localStorage.removeItem('sp_launch');
                         }
                    } catch (err) {
                         console.warn('Could not read cheat sheet launch', err);
                    }
               }
               if (fromPage) {
                    try {
                         const words = JSON.parse(sessionStorage.getItem('sp_page_pool') || '[]');
                         const label = sessionStorage.getItem('sp_page_label') || 'this page';
                         if (Array.isArray(words) && words.length) {
                              extraPool = words;
                              if ($('category')) $('category').value = 'all';
                              resultCard.innerHTML = `Focused on <strong>${label}</strong> (${words.length} items from the cheat sheet).`;
                              if ($('pagePoolStatus')) {
                                   $('pagePoolStatus').textContent = `${label}: ${words.length} words loaded from the Cheat Sheet page. Use Give me a phrase to choose one.`;
                                   $('pagePoolStatus').hidden = false;
                              }
                              const firstWord = words[Math.floor(Math.random() * words.length)];
                              targetInput.value = firstWord;
                              showTargetInfo();
                              resultCard.innerHTML = `Ready: <strong>«${firstWord}»</strong> from <strong>${label}</strong>. Click Hear or Speak to practice it.`;
                         }
                    } catch (err) {
                         console.warn('Could not read page practice pool', err);
                    }
               } else if (params.get('pool') === 'top1000' || params.get('mode') === 'top1000') {
                    if (typeof TOP1000 !== 'undefined') {
                         extraPool = TOP1000.slice();
                         if ($('category')) $('category').value = 'all';
                         resultCard.innerHTML = `Top 1000 pool (${extraPool.length}). Click Random.`;
                    }
               }
               const cat = params.get('cat');
               if (cat && $('category')) {
                    const ok = Array.from($('category').options).some(o => o.value === cat);
                    if (ok) {
                         extraPool = null;
                         $('category').value = cat;
                    }
               }
          })();

          console.log('✅ Spanish Practice initialized');
     }
})();