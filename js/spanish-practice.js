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
     const IRREGULAR_CLASSIFICATIONS = {
          // Irregular "yo" verbs (yo form only)
          yo: {
               hacer: { type: 'irregular-yo', yo: 'hago', pattern: 'hacer → hago' },
               poner: { type: 'irregular-yo', yo: 'pongo', pattern: 'poner → pongo' },
               salir: { type: 'irregular-yo', yo: 'salgo', pattern: 'salir → salgo' },
               tener: { type: 'irregular-yo', yo: 'tengo', pattern: 'tener → tengo' },
               venir: { type: 'irregular-yo', yo: 'vengo', pattern: 'venir → vengo' },
               decir: { type: 'irregular-yo', yo: 'digo', pattern: 'decir → digo' },
               oír: { type: 'irregular-yo', yo: 'oigo', pattern: 'oír → oigo' },
               caer: { type: 'irregular-yo', yo: 'caigo', pattern: 'caer → caigo' },
               traer: { type: 'irregular-yo', yo: 'traigo', pattern: 'traer → traigo' },
               ver: { type: 'irregular-yo', yo: 'veo', pattern: 'ver → veo' },
               saber: { type: 'irregular-yo', yo: 'sé', pattern: 'saber → sé' },
               caber: { type: 'irregular-yo', yo: 'quepo', pattern: 'caber → quepo' },
               dar: { type: 'irregular-yo', yo: 'doy', pattern: 'dar → doy' },
               conocer: { type: 'irregular-yo', yo: 'conozco', pattern: 'conocer → conozco' },
               aparecer: { type: 'irregular-yo', yo: 'aparezco', pattern: 'aparecer → aparezco' },
               establecer: { type: 'irregular-yo', yo: 'establezco', pattern: 'establecer → establezco' },
               ofrecer: { type: 'irregular-yo', yo: 'ofrezco', pattern: 'ofrecer → ofrezco' },
               parecer: { type: 'irregular-yo', yo: 'parezco', pattern: 'parecer → parezco' },
               reconocer: { type: 'irregular-yo', yo: 'reconozco', pattern: 'reconocer → reconozco' },
               producir: { type: 'irregular-yo', yo: 'produzco', pattern: 'producir → produzco' },
               conducir: { type: 'irregular-yo', yo: 'conduzco', pattern: 'conducir → conduzco' },
               traducir: { type: 'irregular-yo', yo: 'traduzco', pattern: 'traducir → traduzco' },
               agradecer: { type: 'irregular-yo', yo: 'agradezco', pattern: 'agradecer → agradezco' },
               atraer: { type: 'irregular-yo', yo: 'atraigo', pattern: 'atraer → atraigo' },
               convencer: { type: 'irregular-yo', yo: 'convenzo', pattern: 'convencer → convenzo' },
               crecer: { type: 'irregular-yo', yo: 'crezco', pattern: 'crecer → crezco' },
               dirigir: { type: 'irregular-yo', yo: 'dirijo', pattern: 'dirigir → dirijo' },
               distinguir: { type: 'irregular-yo', yo: 'distingo', pattern: 'distinguir → distingo' },
               escoger: { type: 'irregular-yo', yo: 'escojo', pattern: 'escoger → escojo' },
               exigir: { type: 'irregular-yo', yo: 'exijo', pattern: 'exigir → exijo' },
               favorecer: { type: 'irregular-yo', yo: 'favorezco', pattern: 'favorecer → favorezco' },
               fluir: { type: 'irregular-yo', yo: 'fluyo', pattern: 'fluir → fluyo' },
               incluir: { type: 'irregular-yo', yo: 'incluyo', pattern: 'incluir → incluyo' },
               influir: { type: 'irregular-yo', yo: 'influyo', pattern: 'influir → influyo' },
               introducir: { type: 'irregular-yo', yo: 'introduzco', pattern: 'introducir → introduzco' },
               merecer: { type: 'irregular-yo', yo: 'merezco', pattern: 'merecer → merezco' },
               padecer: { type: 'irregular-yo', yo: 'padezco', pattern: 'padecer → padezco' },
               pertenecer: { type: 'irregular-yo', yo: 'pertenezco', pattern: 'pertenecer → pertenezco' },
               predecir: { type: 'irregular-yo', yo: 'predigo', pattern: 'predecir → predigo' },
               prevenir: { type: 'irregular-yo', yo: 'prevengo', pattern: 'prevenir → prevengo' },
               proteger: { type: 'irregular-yo', yo: 'protejo', pattern: 'proteger → protejo' },
               reducir: { type: 'irregular-yo', yo: 'reduzco', pattern: 'reducir → reduzco' },
               satisfacer: { type: 'irregular-yo', yo: 'satisfago', pattern: 'satisfacer → satisfago' },
               sostener: { type: 'irregular-yo', yo: 'sostengo', pattern: 'sostener → sostengo' },
               surgir: { type: 'irregular-yo', yo: 'surjo', pattern: 'surgir → surjo' },
               torcer: { type: 'irregular-yo', yo: 'tuervo', pattern: 'torcer → tuervo' },
               valer: { type: 'irregular-yo', yo: 'valgo', pattern: 'valer → valgo' },
               zurcir: { type: 'irregular-yo', yo: 'zurzo', pattern: 'zurcir → zurzo' },
          },

          // Stem-changing verbs (o→ue, e→ie, e→i, u→ue)
          'stem-changer': {
               // o→ue
               acostar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               almorzar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               comprobar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               contar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               costar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               demostrar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               devolver: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               dormir: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               encontrar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               forzar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               llover: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               morir: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               mostrar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               mover: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               poder: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               probar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               promover: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               recordar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               resolver: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               soñar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               volar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               volver: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               apostar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               aprobar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               colgar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               consolar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               contar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               desaprobar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               descolgar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               envolver: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               llover: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               morder: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               oler: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               resolver: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               rodar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               rogar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               soldar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               soler: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               sonar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               torcer: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },
               tronar: { pattern: 'o→ue', type: 'stem-changer', change: 'o→ue' },

               // u→ue
               jugar: { pattern: 'u→ue', type: 'stem-changer', change: 'u→ue' },

               // e→ie
               calentar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               cerrar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               comenzar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               confesar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               convertir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               defender: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               despertar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               empezar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               encender: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               entender: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               extender: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               gobernar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               manifestar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               mentir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               negar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               nevar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               pensar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               perder: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               preferir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               recomendar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               sentar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               sentir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               temblar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               tender: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               tener: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               venir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               atender: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               calentar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               confesar: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               consentir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               contener: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               detener: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               divertir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               herir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               mantener: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               obtener: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               sostener: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },
               sugerir: { pattern: 'e→ie', type: 'stem-changer', change: 'e→ie' },

               // e→i
               conseguir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               corregir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               decir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               elegir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               medir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               pedir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               reír: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               repetir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               seguir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               servir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               vestir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               competir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               concebir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               despedir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               impedir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               reñir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               rendir: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
               sonreír: { pattern: 'e→i', type: 'stem-changer', change: 'e→i' },
          },

          // Highly irregular verbs (multiple irregularities)
          'highly-irregular': {
               ser: { type: 'highly-irregular', pattern: 'ser is completely irregular in all tenses' },
               ir: { type: 'highly-irregular', pattern: 'ir is completely irregular in all tenses' },
               estar: { type: 'highly-irregular', pattern: 'estar has stem changes in preterite' },
               haber: { type: 'highly-irregular', pattern: 'haber is irregular in most tenses' },
          },

          // Prefix-counting verbs (verbs that follow the pattern of their root)
          'prefix-counting': {
               // tener family
               contener: { type: 'prefix-counting', root: 'tener', pattern: 'contener follows tener' },
               detener: { type: 'prefix-counting', root: 'tener', pattern: 'detener follows tener' },
               mantener: { type: 'prefix-counting', root: 'tener', pattern: 'mantener follows tener' },
               obtener: { type: 'prefix-counting', root: 'tener', pattern: 'obtener follows tener' },
               sostener: { type: 'prefix-counting', root: 'tener', pattern: 'sostener follows tener' },

               // traer family
               atraer: { type: 'prefix-counting', root: 'traer', pattern: 'atraer follows traer' },
               contraer: { type: 'prefix-counting', root: 'traer', pattern: 'contraer follows traer' },
               distraer: { type: 'prefix-counting', root: 'traer', pattern: 'distraer follows traer' },

               // poner family
               imponer: { type: 'prefix-counting', root: 'poner', pattern: 'imponer follows poner' },
               suponer: { type: 'prefix-counting', root: 'poner', pattern: 'suponer follows poner' },

               // conocer family
               desconocer: { type: 'prefix-counting', root: 'conocer', pattern: 'desconocer follows conocer' },
               reconocer: { type: 'prefix-counting', root: 'conocer', pattern: 'reconocer follows conocer' },

               // conducir family
               producir: { type: 'prefix-counting', root: 'conducir', pattern: 'producir follows conducir' },
               reducir: { type: 'prefix-counting', root: 'conducir', pattern: 'reducir follows conducir' },
               introducir: { type: 'prefix-counting', root: 'conducir', pattern: 'introducir follows conducir' },
               traducir: { type: 'prefix-counting', root: 'conducir', pattern: 'traducir follows conducir' },

               // decir family
               predecir: { type: 'prefix-counting', root: 'decir', pattern: 'predecir follows decir' },
          },
     };

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
          let _autoPlayEnabled = true;

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

               playerStatus.innerHTML = `⏳ Loading: <strong>${text}</strong>...`;
               playerStatus.className = 'player-status';
               $('playerUrlDisplay').textContent = url;
               playerFrame.src = url;

               clearTimeout(window.playerLoadTimeout);
               window.playerLoadTimeout = setTimeout(() => {
                    try {
                         const iframeDoc = playerFrame.contentDocument || playerFrame.contentWindow?.document;
                         if (iframeDoc && iframeDoc.readyState === 'complete') {
                              // playerStatus.innerHTML = `✅ Loaded: <strong>${text}</strong>`;
                              // playerStatus.className = 'player-status success';
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

               // Don't auto-play if disabled (e.g., during initial page load from cheat sheet)
               if (_autoPlayEnabled !== false) {
                    clearTimeout(playerTimeout);
                    playerTimeout = setTimeout(updatePlayer, 300);
               }
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
               if (typeof SpanishConjugate !== 'undefined') {
                    const generated = SpanishConjugate.conjugate(verb.infinitive, tense);
                    if (generated && generated.length) return generated;
               }
               if (verb.irregular && verb.irregular[tense]) return verb.irregular[tense];
               if (tense === 'present' && Array.isArray(verb.present) && verb.present.length === 6 && verb.present.every(form => form && !/\s/.test(form))) {
                    return verb.present;
               }
               const ending = verb.infinitive.endsWith('ír') ? 'ir' : verb.infinitive.slice(-2);
               if (tense === 'future' || tense === 'conditional') {
                    const suffixes = tense === 'future' ? ['é', 'ás', 'á', 'emos', 'éis', 'án'] : ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
                    return suffixes.map(suffix => verb.infinitive + suffix);
               }
               const endings = CONJUGATION_ENDINGS[tense] && CONJUGATION_ENDINGS[tense][ending];
               if (!endings) return null;
               const stem = verb.infinitive.slice(0, -2);
               const forms = endings.map(suffix => stem + suffix);
               if (tense === 'present' && verb.stemChange) {
                    const changedStem = applyStemChange(stem, verb.stemChange);
                    [0, 1, 2, 5].forEach(index => {
                         forms[index] = changedStem + endings[index];
                    });
               }
               if (tense === 'present' && verb.yoForm && /(?:o|oy|í|é)$/i.test(verb.yoForm)) forms[0] = verb.yoForm;
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
                                   if (headers[0] !== 'verb') return;
                                   const personIdx = {
                                        yo: headers.findIndex(h => h === 'yo' || h.startsWith('yo ')),
                                        tu: headers.findIndex(h => h === 'tú' || h === 'tu'),
                                        el: headers.findIndex(h => /^él/.test(h)),
                                        nosotros: headers.findIndex(h => h.startsWith('nosotros')),
                                        vosotros: headers.findIndex(h => h.startsWith('vosotros')),
                                        ellos: headers.findIndex(h => /^ellos/.test(h)),
                                   };
                                   if (headers.length === 8) {
                                        const heading = table.previousElementSibling?.textContent.replace(/\s+/g, ' ').trim() || '';
                                        const change = heading.match(/([eou])\s*→\s*([ieou]+)/i)?.[0]?.replace(/\s+/g, '') || '';
                                        table.querySelectorAll('tbody tr').forEach(row => {
                                             const cells = row.querySelectorAll('td');
                                             const infinitive = cells[0]?.querySelector('[data-text]')?.getAttribute('data-text')?.toLowerCase();
                                             if (infinitive && change) conjugationStemChanges[infinitive] = change;
                                        });
                                   }
                                   if (personIdx.yo >= 0 && personIdx.el >= 0 && personIdx.nosotros >= 0 && personIdx.ellos >= 0) {
                                        table.querySelectorAll('tbody tr').forEach(row => {
                                             const cells = row.querySelectorAll('td');
                                             const cellText = index => {
                                                  const cell = cells[index];
                                                  if (!cell) return '';
                                                  return (cell.querySelector('[data-text]')?.getAttribute('data-text') || cell.textContent || '').trim().toLowerCase();
                                             };
                                             const infinitive = cellText(0);
                                             const forms = [personIdx.yo, personIdx.tu, personIdx.el, personIdx.nosotros, personIdx.vosotros, personIdx.ellos].map(cellText);
                                             if (infinitive && forms.length === 6 && forms.every(form => form && !/\s/.test(form) && !/^to$/.test(form))) {
                                                  conjugationPresentForms[infinitive] = forms;
                                             }
                                        });
                                   }
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

                              // 👇 ADD THE IRREGULAR CLASSIFICATION HERE 👇
                              // Get the irregular classification for this verb
                              const irregClass = getIrregularClassifications(infinitive);
                              let irregularType = null;
                              let irregularInfo = null;
                              if (irregClass && irregClass.length > 0) {
                                   // Store all classifications
                                   irregularType = irregClass.map(c => c.type).join('+');
                                   irregularInfo = irregClass;
                              }

                              return {
                                   infinitive,
                                   meaning: meaning || 'verb',
                                   yoForm,
                                   present: conjugationPresentForms[infinitive],
                                   stemChange: conjugationStemChanges[infinitive] || CONJUGATION_STEM_CHANGE_OVERRIDES[infinitive] || (typeof SpanishConjugate !== 'undefined' ? SpanishConjugate.stemChangeOf(infinitive) : null),
                                   irregular: CONJUGATION_IRREGULARS[infinitive],
                                   irregularType: irregularType,
                                   irregularInfo: irregularInfo,
                              };
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
               if (typeof window.updateConjugationVerbCheckboxes === 'function') window.updateConjugationVerbCheckboxes();
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
               const fromPage = new URLSearchParams(window.location.search).get('from') === 'page';
               const verbSelect = $('conjugationVerb');
               const tenseSelect = $('conjugationTense');
               const pronounSelect = $('conjugationPronoun');
               if (!verbSelect || !tenseSelect || !pronounSelect) return;

               const checkboxFilters = {
                    verb: { select: verbSelect, container: 'conjugationVerbFilters', label: 'Verb' },
                    tense: { select: tenseSelect, container: 'conjugationTenseFilters', label: 'Tense' },
                    pronoun: { select: pronounSelect, container: 'conjugationPronounFilters', label: 'Pronoun' },
               };

               function updateCheckboxFilter(key) {
                    const filter = checkboxFilters[key];
                    const container = $(filter.container)?.querySelector('.conjugation-checkbox-options');
                    if (!container) return;
                    const options = Array.from(filter.select.options);
                    container.innerHTML = `<label class="ending-filter-option ending-select-all"><input type="checkbox" class="conjugation-select-all-input" data-conjugation-select-all="${key}" />Select All</label>${options.map(option => `<label class="ending-filter-option"><input type="checkbox" class="conjugation-filter-input" data-conjugation-filter="${key}" value="${option.value}" />${option.textContent}</label>`).join('')}`;
                    const first = options[0];
                    if (first && !options.some(option => option.selected)) first.selected = true;
                    syncCheckboxFilter(key);
                    container.querySelectorAll('.conjugation-filter-input').forEach(input => {
                         input.addEventListener('change', () => {
                              ensureConjugationSelection(key);
                              syncSelectFromCheckboxes(key);
                              renderPrompt();
                         });
                    });
                    container.querySelector('.conjugation-select-all-input')?.addEventListener('change', event => {
                         container.querySelectorAll('.conjugation-filter-input').forEach(input => {
                              input.checked = event.target.checked;
                         });
                         ensureConjugationSelection(key);
                         syncSelectFromCheckboxes(key);
                         renderPrompt();
                    });
               }

               function syncCheckboxFilter(key) {
                    const filter = checkboxFilters[key];
                    const selected = new Set(Array.from(filter.select.selectedOptions).map(option => option.value));
                    const container = $(filter.container)?.querySelector('.conjugation-checkbox-options');
                    if (!container) return;
                    container.querySelectorAll('.conjugation-filter-input').forEach(input => {
                         input.checked = selected.has(input.value);
                    });
                    const all = container.querySelector('.conjugation-select-all-input');
                    const inputs = Array.from(container.querySelectorAll('.conjugation-filter-input'));
                    const count = inputs.filter(input => input.checked).length;
                    if (all) {
                         all.checked = count === inputs.length;
                         all.indeterminate = count > 0 && count < inputs.length;
                    }
               }

               function ensureConjugationSelection(key) {
                    const inputs = Array.from(document.querySelectorAll(`.conjugation-filter-input[data-conjugation-filter="${key}"]`));
                    if (!inputs.some(input => input.checked) && inputs[0]) inputs[0].checked = true;
               }

               function syncSelectFromCheckboxes(key) {
                    const filter = checkboxFilters[key];
                    const selected = new Set(Array.from(document.querySelectorAll(`.conjugation-filter-input[data-conjugation-filter="${key}"]:checked`)).map(input => input.value));
                    Array.from(filter.select.options).forEach(option => {
                         option.selected = selected.has(option.value);
                    });
                    filter.select._activeValue = Array.from(selected)[0] || '';
                    syncCheckboxFilter(key);
                    const labels = Array.from(document.querySelectorAll(`.conjugation-filter-input[data-conjugation-filter="${key}"]:checked`)).map(input => input.parentElement.textContent.trim());
                    const display = $({ verb: 'selectedVerbDisplay', tense: 'selectedTenseDisplay', pronoun: 'selectedPronounDisplay' }[key]);
                    if (display && labels.length) display.textContent = formatConjugationFilterLabel(key, labels.length, labels);
               }

               function formatConjugationFilterLabel(key, count, labels) {
                    const total = checkboxFilters[key].select.options.length;
                    const noun = key === 'verb' ? 'verb' : key === 'tense' ? 'tense' : 'pronoun';
                    if (count === total && total > 1) return `All ${noun}s`;
                    if (count > 1) return `${count} ${noun}s`;
                    return key === 'verb' ? (labels[0] || '').split('(')[0].trim() : labels[0] || '';
               }

               function openConjugationFilter(key) {
                    const isMobile = window.matchMedia('(max-width: 620px)').matches;
                    const panel = $('filtersPanel');
                    const isSameFilterOpen = panel.classList.contains('open') && panel.dataset.openFilter === key;
                    if (isSameFilterOpen) {
                         closeConjugationFilter();
                         return;
                    }
                    document.querySelectorAll('.conjugation-filters > div').forEach(wrapper => {
                         wrapper.classList.toggle('desktop-filter-open', wrapper.id === checkboxFilters[key].container);
                    });
                    if (!isMobile) {
                         const layout = document.querySelector('.mobile-conjugation-layout').getBoundingClientRect();
                         const quickRow = document.querySelector('.quick-select-row').getBoundingClientRect();
                         const quick = $({ verb: 'quickVerbBtn', tense: 'quickTenseBtn', pronoun: 'quickPronounBtn' }[key]).getBoundingClientRect();
                         const width = Math.max(280, quick.width);
                         panel.style.setProperty('--filter-top', `${quickRow.bottom - layout.top + 8}px`);
                         panel.style.setProperty('--filter-left', `${Math.max(0, Math.min(quick.left - layout.left, layout.width - width))}px`);
                         panel.style.setProperty('--filter-width', `${width}px`);
                    }
                    panel.classList.add('open');
                    panel.dataset.openFilter = key;
                    if (isMobile) {
                         $('filtersOverlay').classList.add('active');
                         document.body.style.overflow = 'hidden';
                    }
                    setTimeout(() => $(checkboxFilters[key].container)?.querySelector('.conjugation-filter-input')?.focus({ preventScroll: !isMobile }), 250);
               }

               function closeConjugationFilter() {
                    const panel = $('filtersPanel');
                    panel.classList.remove('open');
                    panel.removeAttribute('data-open-filter');
                    document.querySelectorAll('.conjugation-filters > div').forEach(wrapper => wrapper.classList.remove('desktop-filter-open'));
                    $('filtersOverlay').classList.remove('active');
                    document.body.style.overflow = '';
               }

               window.openConjugationFilter = openConjugationFilter;
               window.closeConjugationFilter = closeConjugationFilter;
               window.updateConjugationVerbCheckboxes = () => updateCheckboxFilter('verb');

               document.addEventListener('click', event => {
                    if (!$('filtersPanel').classList.contains('open')) return;
                    if (!event.target.closest('#filtersPanel') && !event.target.closest('.quick-select-btn')) closeConjugationFilter();
               });
               document.addEventListener('keydown', event => {
                    if (event.key === 'Escape' && $('filtersPanel').classList.contains('open')) closeConjugationFilter();
               });

               verbSelect.disabled = true;
               tenseSelect.innerHTML = CONJUGATION_TENSES.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
               pronounSelect.innerHTML = CONJUGATION_PRONOUNS.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
               updateCheckboxFilter('tense');
               updateCheckboxFilter('pronoun');

               function currentPrompt() {
                    const verbValue = verbSelect._activeValue || verbSelect.value;
                    const tenseValue = tenseSelect._activeValue || tenseSelect.value;
                    const pronounValue = pronounSelect._activeValue || pronounSelect.value;
                    const verb = conjugationVerbs[Number(verbValue)];
                    if (!verb) return null;
                    const tense = CONJUGATION_TENSES.find(item => item[0] === tenseValue);
                    const pronoun = CONJUGATION_PRONOUNS.find(item => item[0] === pronounValue);
                    const forms = conjugateVerb(verb, tenseValue);
                    const index = CONJUGATION_PRONOUNS.findIndex(item => item[0] === pronounValue);
                    return {
                         verb: verb,
                         tense: tense ? tense[1] : '',
                         tenseKey: tenseValue,
                         pronoun: pronoun ? pronoun[1] : '',
                         pronounKey: pronounValue,
                         answer: forms ? forms[index] : '',
                    };
               }

               function renderConjugationEndingsTable() {
                    const prompt = currentPrompt();
                    if (!prompt) return;
                    const type = prompt.verb.infinitive.endsWith('ír') ? 'ir' : prompt.verb.infinitive.slice(-2);
                    $('conjugationEndingsTableSummary').textContent = `${prompt.verb.infinitive} · ${prompt.tense}`;
                    $('conjugationEndingsTableBody').innerHTML = CONJUGATION_PRONOUNS.map(([key, label], index) => {
                         const selected = key === prompt.pronounKey ? ' class="selected"' : '';
                         const ending = window.SpanishConjugate.regularEnding(type, prompt.tenseKey, index);
                         return `<tr${selected}><th scope="row">${label}</th><td>${ending ? '-' + ending : '—'}</td></tr>`;
                    }).join('');
               }

               function displayConjugationPrompt(verb, tenseKey, pronounKey, answer, showAnswer) {
                    const promptDiv = $('conjugationPrompt');
                    if (!promptDiv) return;

                    const tenseLabel = CONJUGATION_TENSES.find(t => t[0] === tenseKey)?.[1] || tenseKey;
                    const pronounLabel = CONJUGATION_PRONOUNS.find(p => p[0] === pronounKey)?.[1] || pronounKey;
                    const translation = getConjugationTranslation(verb, tenseKey, pronounKey);

                    // Get irregular classification
                    // const irregInfo = getIrregularDisplayInfo(verb.infinitive);
                    const irregInfo = verb.irregularInfo ? getIrregularDisplayInfoFromClass(verb.irregularInfo) : null;
                    let irregBadge = '';
                    if (irregInfo) {
                         irregBadge = `
               <span class="irregular-badge ${irregInfo.cssClass}" title="${irregInfo.description}">
                    ${irregInfo.icon} ${irregInfo.label}
                    <span class="badge-detail">${irregInfo.shortLabel ? '· ' + irregInfo.shortLabel : ''}</span>
               </span>
          `;
                    }

                    let answerHtml = '';
                    if (showAnswer && answer) {
                         answerHtml = `
            <div style="font-size: 1.2rem; color: var(--good, #22c55e); margin-top: 4px;">
                → ${answer}
                ${irregInfo ? `<span style="font-size: 0.8rem; color: var(--muted); margin-left: 8px;">${irregInfo.detail}</span>` : ''}
            </div>
        `;
                    }

                    // If it's irregular, show a warning/note
                    let irregNote = '';
                    if (irregInfo && !showAnswer) {
                         irregNote = `
            <div style="font-size: 0.85rem; color: var(--warning, #f59e0b); margin-top: 4px; background: var(--tips-bg); padding: 4px 8px; border-radius: 4px;">
                ⚠️ ${irregInfo.description}
            </div>
        `;
                    }

                    promptDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <strong>${pronounLabel}</strong>
                <span>${verb.infinitive}</span>
                ${irregBadge}
                <button type="button" id="conjugationHearInfinitiveBtn" 
                        style="padding: 2px 8px; font-size: 0.9rem; background: var(--accent, #3b82f6); color: white; border: none; border-radius: 4px; cursor: pointer;" 
                        title="Hear the infinitive">
                    🔊
                </button>
                <small style="color: var(--muted);">(${tenseLabel})</small>
            </div>
            <div style="color: var(--muted); font-size: 0.95rem;">${translation}</div>
            ${irregNote}
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

               // Helper function to convert stored classification to display info
               function getIrregularDisplayInfoFromClass(irregClassArray) {
                    if (!irregClassArray || !irregClassArray.length) return null;

                    // Map type to CSS class
                    const typeMap = {
                         'irregular-yo': { label: 'Irregular "yo"', icon: '👤', cssClass: 'type-irregular-yo' },
                         'stem-changer': { label: 'Stem Change', icon: '🔄', cssClass: 'type-stem-changer' },
                         'highly-irregular': { label: 'Highly Irregular', icon: '⚡', cssClass: 'type-highly-irregular' },
                         'prefix-counting': { label: 'Prefix-counting', icon: '📎', cssClass: 'type-prefix-counting' },
                    };

                    if (irregClassArray.length === 1) {
                         const info = irregClassArray[0];
                         const typeInfo = typeMap[info.type];
                         return {
                              cssClass: typeInfo.cssClass,
                              label: typeInfo.label,
                              icon: typeInfo.icon,
                              detail: info.pattern || info.yo || '',
                              description: info.pattern || `Yo: ${info.yo}` || '',
                              shortLabel: info.pattern || info.yo || '',
                         };
                    } else {
                         // Multiple classifications
                         const labels = irregClassArray.map(c => typeMap[c.type]?.label || c.type).join(' + ');
                         const icons = irregClassArray.map(c => typeMap[c.type]?.icon || '📌').join('');
                         const details = irregClassArray
                              .map(c => c.pattern || c.yo || '')
                              .filter(Boolean)
                              .join(' · ');
                         return {
                              cssClass: 'type-multiple',
                              label: labels,
                              icon: icons,
                              detail: details,
                              description: details,
                              shortLabel: details,
                         };
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
                    if (!window.matchMedia('(max-width: 620px)').matches) input.focus();
                    enableConjugationAccentBar();

                    // Only play audio if NOT coming from a page launch and if conjugation tab is active
                    const langSelect = $('conjugationLang') || $('lang');
                    const langCode = langSelect ? langSelect.value : 'es-MX';

                    // Check if conjugation panel is visible before playing
                    const panel = document.getElementById('conjugationPanel');
                    const isVisible = panel && panel.style.display !== 'none' && !panel.classList.contains('hidden');

                    if (!fromPage && isVisible) {
                         const langSelect = $('conjugationLang') || $('lang');
                         const langCode = langSelect ? langSelect.value : 'es-MX';
                         playAudioFromServer(prompt.verb.infinitive, langCode);
                    }
               }

               let shuffledVerbs = [];
               let shuffledVerbIndex = 0;

               function randomizeVerb() {
                    if (!conjugationVerbs.length) return;
                    randomizeSelect(verbSelect);

                    if ($('conjugationRandomPronoun').checked && pronounSelect.options.length > 1) {
                         randomizeSelect(pronounSelect);
                    }

                    if ($('conjugationRandomTense').checked && tenseSelect.options.length > 1) {
                         randomizeSelect(tenseSelect);
                    }

                    renderPrompt();
               }

               let shuffledSelectOptions = new Map();
               let shuffledSelectIndexes = new Map();

               function randomizeSelect(select) {
                    if (!select || select.options.length === 0) return;

                    const options = Array.from(select.selectedOptions.length ? select.selectedOptions : select.options);
                    const poolKey = options.map(option => option.value).join('|');

                    // Get or create the shuffle bag for this select
                    if (!shuffledSelectOptions.has(select)) {
                         shuffledSelectOptions.set(select, []);
                         shuffledSelectIndexes.set(select, 0);
                    }

                    let shuffled = shuffledSelectOptions.get(select);
                    let index = shuffledSelectIndexes.get(select);

                    // Create a new shuffled list when we've used every option
                    if (index >= shuffled.length || select._shufflePoolKey !== poolKey) {
                         shuffled = Array.from({ length: options.length }, (_, i) => i);

                         // Fisher-Yates shuffle
                         for (let i = shuffled.length - 1; i > 0; i--) {
                              const j = Math.floor(Math.random() * (i + 1));
                              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                         }

                         shuffledSelectOptions.set(select, shuffled);
                         select._shufflePoolKey = poolKey;
                         index = 0;
                    }

                    // Select the next option
                    const next = shuffled[index++];
                    shuffledSelectIndexes.set(select, index);

                    if (select.multiple) {
                         options[next].selected = true;
                         select._activeValue = options[next].value;
                    } else {
                         select.value = options[next].value;
                    }
                    syncCheckboxFilter(select === verbSelect ? 'verb' : select === tenseSelect ? 'tense' : 'pronoun');
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

                         const verbSlug = prompt.verb.infinitive.toLowerCase().trim();
                         const conjugationUrl = `https://muyverbs.com/spanish-verbs/${verbSlug}-conjugation/`;

                         let feedbackMsg = '';
                         let feedbackClass = '';

                         if (correct) {
                              feedbackMsg = '✅ Correct!';
                              feedbackClass = 'good';
                         } else {
                              console.info('conjugationUrl: ' + conjugationUrl);
                              if (normalizedAnswer.length > 0) {
                                   const sim = calculateSimilarity(normalizedAnswer, normalizedCorrect);
                                   if (sim > 0.7) {
                                        feedbackMsg = `❌ Close! The correct answer is ${prompt.answer}`;
                                   } else {
                                        feedbackMsg = `❌ Not quite. The correct answer is ${prompt.answer}`;
                                   }
                              } else {
                                   feedbackMsg = `❌ The correct answer is ${prompt.answer}`;
                              }
                              feedbackClass = 'bad';
                         }

                         $('conjugationFeedback').innerHTML = `
                <div class="${feedbackClass}" style="padding: 8px; border-radius: 6px;">
                    <strong>${feedbackMsg}</strong>
                    ${!correct ? `<br><span style="font-size: 0.9rem; color: var(--muted);">You typed: ${answer}</span>` : ''}
                    ${
                         !correct && normalizedAnswer.length > 0
                              ? `<br><span style="font-size: 0.85rem; color: var(--muted);">Check spelling and accents!</span>
                                        <br><a href="${conjugationUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.85rem;">View full ${prompt.verb.infinitive.toLowerCase().trim()} conjugation</a>
`
                              : ''
                    }
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
                    <strong>Answer:</strong> ${prompt.answer}
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

          // ===================== CONJUGATION INITIALIZATION =====================
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
                    // resultCard.innerHTML = `Loaded: <strong>${k}</strong>`;
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
                              resultCard.innerHTML = `No weak scores in this pool yet. Random from pool: <strong>${k}</strong>`;
                              return;
                         }
                         resultCard.innerHTML = 'No weak phrases yet. Practice more!';
                         return;
                    }
                    const k = weak[Math.floor(Math.random() * weak.length)];
                    targetInput.value = k;
                    showTargetInfo();
                    resultCard.innerHTML = `Weak phrase: <strong>${k}</strong>`;
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
               if (typeof renderStreakDisplay === 'function') renderStreakDisplay();
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
                    recognition.lang = $('lang').value || 'es-MX';
                    recognition.interimResults = true;
                    recognition.maxAlternatives = 10;
                    recognition.continuous = false;

                    if ('grammars' in recognition) {
                         try {
                              const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
                              if (SpeechGrammarList) {
                                   const grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + target.toLowerCase() + ';';
                                   const speechRecognitionList = new SpeechGrammarList();
                                   speechRecognitionList.addFromString(grammar, 1);
                                   recognition.grammars = speechRecognitionList;
                              }
                         } catch (e) {
                              // Grammar not supported, continue without it
                              console.warn('Grammar not supported:', e);
                         }
                    }

                    // Timeout for recognition
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
                                             feedback = `❌ You said multiple words. Just say: ${target}`;
                                        } else {
                                             feedback = `❌ That doesn't match. Say: ${target}`;
                                        }
                                   } else {
                                        feedback = `❌ That doesn't match. Please say: ${target}`;
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
                            ⚠️ You said ${transcriptWordCount} words. Target is just: <strong>${target}</strong>
                        </div>`;
                              } else if (matchedWords.length > 0 && !isCompletelyWrong && weightedScore > 0.4) {
                                   matchDetails = `
                        <div style="font-size:0.85rem;color:var(--muted);margin-top:4px;">
                            ✅ Words matched: ${matchedWords.join(', ')}
                        </div>`;
                              } else if (weightedScore < 0.35) {
                                   matchDetails = `
                        <div style="font-size:0.85rem;color:var(--muted);margin-top:4px;">
                            🎯 Target: <strong>${target}</strong> → You said: <em>${bestTranscript}</em>
                        </div>`;
                              }

                              let altHtml = '';
                              if (allAlternatives.length > 1) {
                                   altHtml = `
                        <div style="font-size:0.8rem;color:var(--muted);margin-top:6px;">
                            Other possibilities: ${allAlternatives
                                 .slice(1)
                                 .map(a => `${a.text} (${Math.round(a.conf * 100)}%)`)
                                 .join(' • ')}
                        </div>`;
                              }

                              resultCard.innerHTML = `
                    <div><strong>You said:</strong> ${bestTranscript}</div>
                    <div><strong>Target:</strong> ${target}</div>
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
                            <strong>💡 Tip:</strong> Practice saying: <em>${target}</em>
                            ${targetWordCount === 1 ? ' (just one word)' : ''}
                        </div>`
                              : ''
                    }
                `;

                              if ($('autoAdvance').checked && cls === 'good') {
                                   setTimeout(() => randomBtn.click(), 1200);
                              }

                              isSpeaking = false;
                         } catch (err) {
                              console.error('Error processing result:', err);
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
                    if (typeof leaveCheatSheetPool === 'function') leaveCheatSheetPool();
                    else extraPool = null;
               });
          }

          // ===================== TOP 1000 =====================
          // if ($('top1000Btn')) {
          //      $('top1000Btn').onclick = () => {
          //           if (typeof TOP1000 === 'undefined' || !TOP1000.length) {
          //                if (resultCard) {
          //                     resultCard.innerHTML = '<span class="bad">Top 1000 list is not loaded.</span>';
          //                } else {
          //                     alert('Top 1000 list is not loaded.');
          //                }
          //                return;
          //           }
          //           if (typeof leaveCheatSheetPool === 'function') leaveCheatSheetPool();
          //           extraPool = TOP1000.slice();
          //           if ($('category')) $('category').value = 'all';
          //           if ($('difficulty')) $('difficulty').value = 'all';
          //           if (resultCard) {
          //                resultCard.innerHTML = `Pool: Top 1000 (${extraPool.length} words). Click Random or Weak.`;
          //           }
          //      };
          // }

          // ===================== PRACTICE PARAMS =====================
          (function applyPracticeParams() {
               if (document.body.classList.contains('study-page')) return;
               const params = new URLSearchParams(window.location.search);
               const fromPage = params.get('from') === 'page' || params.get('mode') === 'quiz' || params.get('pool') === 'page';

               // Check if we should show a specific tab from URL
               const tab = params.get('tab');
               if (tab && ['pronunciation', 'conjugation', 'study'].includes(tab)) {
                    setTimeout(function () {
                         switchTab(tab);
                    }, 100);
               }
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
                              window._pagePool = words;
                              window._pageLabel = label;
                              if ($('category')) $('category').value = 'all';

                              // Store for study page
                              if ($('pagePoolStatus')) {
                                   $('pagePoolStatus').textContent = `${label}: ${words.length} words loaded from the Cheat Sheet page. Use Give me a phrase to choose one.`;
                                   $('pagePoolStatus').hidden = false;
                              }

                              // Load the first word but DON'T auto-play
                              const firstWord = words[Math.floor(Math.random() * words.length)];
                              targetInput.value = firstWord;

                              // Call showTargetInfo with autoPlay disabled
                              _autoPlayEnabled = false;
                              showTargetInfo();
                              _autoPlayEnabled = true;

                              // Update the result card
                              resultCard.innerHTML = `Ready: <strong>${firstWord}</strong> from <strong>${label}</strong>. Click Hear or Speak to practice it.`;

                              // Also update the target card to show it's loaded
                              const targetCard = $('targetCard');
                              if (targetCard) {
                                   targetCard.style.display = 'block';
                              }
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

          function getIrregularClassifications(verb) {
               const infinitive = verb.infinitive || verb.toLowerCase();
               const classifications = [];

               // Check each type
               if (IRREGULAR_CLASSIFICATIONS['yo'][infinitive]) {
                    classifications.push(IRREGULAR_CLASSIFICATIONS['yo'][infinitive]);
               }
               if (IRREGULAR_CLASSIFICATIONS['stem-changer'][infinitive]) {
                    classifications.push(IRREGULAR_CLASSIFICATIONS['stem-changer'][infinitive]);
               }
               if (IRREGULAR_CLASSIFICATIONS['highly-irregular'][infinitive]) {
                    classifications.push(IRREGULAR_CLASSIFICATIONS['highly-irregular'][infinitive]);
               }
               if (IRREGULAR_CLASSIFICATIONS['prefix-counting'][infinitive]) {
                    classifications.push(IRREGULAR_CLASSIFICATIONS['prefix-counting'][infinitive]);
               }

               return classifications.length > 0 ? classifications : null;
          }

          function getIrregularDisplayInfo(verb) {
               const classifications = getIrregularClassifications(verb);
               if (!classifications) return null;

               // Build combined display
               const displayMap = {
                    'irregular-yo': { label: 'Irregular "yo"', icon: '👤', color: '#f59e0b' },
                    'stem-changer': { label: 'Stem Change', icon: '🔄', color: '#3b82f6' },
                    'highly-irregular': { label: 'Highly Irregular', icon: '⚡', color: '#ef4444' },
                    'prefix-counting': { label: 'Prefix-counting', icon: '📎', color: '#8b5cf6' },
               };

               // If multiple classifications, combine them
               if (classifications.length === 1) {
                    const info = classifications[0];
                    const display = displayMap[info.type];
                    return {
                         ...display,
                         detail: info.pattern || info.yo || '',
                         description: info.pattern || `Yo: ${info.yo}` || '',
                         shortLabel: info.pattern || info.yo || '',
                    };
               } else {
                    // Multiple classifications - show all
                    const labels = classifications.map(c => displayMap[c.type].label).join(' + ');
                    const icons = classifications.map(c => displayMap[c.type].icon).join('');
                    const colors = classifications.map(c => displayMap[c.type].color);
                    return {
                         label: labels,
                         icon: icons,
                         color: colors[0], // Use first color as primary
                         detail: classifications
                              .map(c => c.pattern || c.yo || '')
                              .filter(Boolean)
                              .join(' · '),
                         description: classifications
                              .map(c => c.pattern || `Yo: ${c.yo}` || '')
                              .filter(Boolean)
                              .join(' · '),
                         shortLabel: classifications
                              .map(c => c.pattern || '')
                              .filter(Boolean)
                              .join(' · '),
                    };
               }
          }

          console.log('✅ Spanish Practice initialized');
     }
})();
