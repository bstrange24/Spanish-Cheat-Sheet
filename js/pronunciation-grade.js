/**
 * Grade a spoken Spanish attempt from speech-recognition transcripts.
 * Compares every alternative to the target with Spanish-aware phonetics
 * and word alignment. This is still text-vs-text (ASR output), not a
 * waveform phoneme scorer — it is built to be as reliable as that constraint allows.
 */
(function (root) {
     'use strict';

     const NUMBER_WORDS = {
          0: 'cero',
          1: 'uno',
          2: 'dos',
          3: 'tres',
          4: 'cuatro',
          5: 'cinco',
          6: 'seis',
          7: 'siete',
          8: 'ocho',
          9: 'nueve',
          10: 'diez',
          11: 'once',
          12: 'doce',
          13: 'trece',
          14: 'catorce',
          15: 'quince',
          16: 'dieciseis',
          17: 'diecisiete',
          18: 'dieciocho',
          19: 'diecinueve',
          20: 'veinte',
          21: 'veintiuno',
          22: 'veintidos',
          23: 'veintitres',
          24: 'veinticuatro',
          25: 'veinticinco',
          30: 'treinta',
          40: 'cuarenta',
          50: 'cincuenta',
          60: 'sesenta',
          70: 'setenta',
          80: 'ochenta',
          90: 'noventa',
          100: 'cien',
          1000: 'mil',
     };

     const WORD_HIT = 0.78;

     function clamp(n, lo, hi) {
          return Math.min(hi, Math.max(lo, n));
     }

     function editDistance(a, b) {
          const n = a.length;
          const m = b.length;
          if (!n) return m;
          if (!m) return n;
          const dp = new Array(m + 1);
          for (let j = 0; j <= m; j++) dp[j] = j;
          for (let i = 1; i <= n; i++) {
               let prev = dp[0];
               dp[0] = i;
               for (let j = 1; j <= m; j++) {
                    const tmp = dp[j];
                    const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
                    dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
                    prev = tmp;
               }
          }
          return dp[m];
     }

     function similarity(a, b) {
          if (!a && !b) return 1;
          if (!a || !b) return 0;
          const longer = a.length >= b.length ? a : b;
          if (!longer.length) return 1;
          return (longer.length - editDistance(a, b)) / longer.length;
     }

     function expandNumbers(text) {
          return text.replace(/\b\d+\b/g, function (d) {
               const n = Number(d);
               return NUMBER_WORDS.hasOwnProperty(n) ? NUMBER_WORDS[n] : d;
          });
     }

     function canonicalize(text) {
          let s = String(text || '').toLowerCase().normalize('NFC');
          s = s.replace(/[¿?¡!.,;:"""''«»()[\]{}]/g, ' ');
          s = s.replace(/[-—–]/g, ' ');
          s = s.replace(/ü/g, '\uE001');
          s = s.replace(/ñ/g, '\uE000');
          s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          s = s.replace(/\uE000/g, 'ñ');
          s = s.replace(/\uE001/g, 'ü');
          s = expandNumbers(s);
          s = s.replace(/\s+/g, ' ').trim();
          s = s.replace(/\bpor que\b/g, 'porque');
          s = s.replace(/\bde el\b/g, 'del');
          s = s.replace(/\ba el\b/g, 'al');
          return s;
     }

     function isSpain(lang) {
          return String(lang || '')
               .toLowerCase()
               .replace('_', '-')
               .startsWith('es-es');
     }

     function phoneticKey(text, lang) {
          let s = canonicalize(text);
          s = s.replace(/ch/g, 'Ç');
          s = s.replace(/ll/g, 'Y');
          s = s.replace(/rr/g, 'R');
          s = s.replace(/ñ/g, 'Ñ');
          s = s.replace(/qu/g, 'k');
          s = s.replace(/gü/g, 'W');
          s = s.replace(/ü/g, 'W');
          s = s.replace(/gu([ei])/g, 'g$1');
          if (isSpain(lang)) {
               s = s.replace(/c([ei])/g, 'θ$1');
               s = s.replace(/z/g, 'θ');
          } else {
               s = s.replace(/c([ei])/g, 's$1');
               s = s.replace(/z/g, 's');
          }
          s = s.replace(/c/g, 'k');
          s = s.replace(/g([ei])/g, 'x$1');
          s = s.replace(/j/g, 'x');
          s = s.replace(/v/g, 'b');
          s = s.replace(/h/g, '');
          s = s.replace(/y/g, 'Y');
          s = s.replace(/x/g, 'x');
          s = s.replace(/([^ÇRÑYθW])\1+/g, '$1');
          s = s.replace(/\s+/g, '');
          return s;
     }

     function tokenize(text) {
          return canonicalize(text)
               .split(/\s+/)
               .filter(Boolean);
     }

     function wordSimilarity(a, b, lang) {
          const ca = canonicalize(a);
          const cb = canonicalize(b);
          return Math.max(similarity(ca, cb), similarity(phoneticKey(ca, lang), phoneticKey(cb, lang)));
     }

     function greedyAlign(targetWords, saidWords, lang) {
          const used = new Set();
          const hits = [];
          const missing = [];
          let bestSingle = 0;

          for (let i = 0; i < targetWords.length; i++) {
               let best = 0;
               let bestJ = -1;
               for (let j = 0; j < saidWords.length; j++) {
                    if (used.has(j)) continue;
                    const sim = wordSimilarity(targetWords[i], saidWords[j], lang);
                    if (sim > best) {
                         best = sim;
                         bestJ = j;
                    }
               }
               if (i === 0) bestSingle = best;
               else bestSingle = Math.max(bestSingle, best);

               if (best >= WORD_HIT && bestJ >= 0) {
                    used.add(bestJ);
                    hits.push({
                         target: targetWords[i],
                         said: saidWords[bestJ],
                         sim: best,
                         targetIndex: i,
                         saidIndex: bestJ,
                    });
               } else {
                    missing.push(targetWords[i]);
               }
          }

          if (targetWords.length === 1) {
               bestSingle = 0;
               for (let j = 0; j < saidWords.length; j++) {
                    bestSingle = Math.max(bestSingle, wordSimilarity(targetWords[0], saidWords[j], lang));
               }
          }

          const extras = saidWords.filter(function (_, j) {
               return !used.has(j);
          });

          let lastSaid = -1;
          let orderedHits = 0;
          hits.slice()
               .sort(function (a, b) {
                    return a.targetIndex - b.targetIndex;
               })
               .forEach(function (h) {
                    if (h.saidIndex > lastSaid) {
                         orderedHits += 1;
                         lastSaid = h.saidIndex;
                    }
               });

          return { hits: hits, missing: missing, extras: extras, bestSingle: bestSingle, orderedHits: orderedHits };
     }

     function pairQuality(hits, lang) {
          if (!hits.length) return { phone: 0, char: 0, avg: 0 };
          let phone = 0;
          let chars = 0;
          for (let i = 0; i < hits.length; i++) {
               const t = hits[i].target;
               const s = hits[i].said;
               chars += similarity(canonicalize(t), canonicalize(s));
               phone += similarity(phoneticKey(t, lang), phoneticKey(s, lang));
          }
          const n = hits.length;
          return { phone: phone / n, char: chars / n, avg: (phone + chars) / (2 * n) };
     }

     function distinctiveTips(target, said) {
          const tips = [];
          const t = String(target || '').toLowerCase();
          const s = String(said || '').toLowerCase();
          if (/rr/.test(t) && !/rr/.test(s)) tips.push('Roll the <strong>rr</strong> (a trill), not a single r.');
          if (/ñ/.test(t) && !/ñ/.test(s)) tips.push('<strong>ñ</strong> sounds like the ny in canyon.');
          if (/ch/.test(t) && !/ch/.test(s)) tips.push('<strong>ch</strong> is like English church, not a plain c.');
          if (/ll/.test(t) && !/ll/.test(s) && !/\by/.test(s)) tips.push('<strong>ll</strong> sounds like English y (as in yes).');
          if (/j|g[ei]/.test(t) && !/j|g[ei]/.test(s)) tips.push('<strong>j / ge / gi</strong> is a strong H, like the ch in loch.');
          if (/(?:^|\s)h/.test(t)) tips.push('<strong>h</strong> is silent in Spanish.');
          if (/[áéíóú]/.test(String(target || '')) && !/[áéíóú]/.test(String(said || ''))) {
               tips.push('Stress the accented syllable: <strong>' + String(target) + '</strong>.');
          }
          return tips.slice(0, 3);
     }

     function bandFor(score, bagRatio, extraCount, targetWordCount) {
          if (score >= 0.92 && bagRatio >= 0.99 && extraCount <= 2) return 'excellent';
          if (score >= 0.78) return 'close';
          if (score >= 0.55) return 'partial';
          return 'miss';
          // targetWordCount reserved for future phrase-length tweaks
          void targetWordCount;
     }

     function labelFor(band) {
          if (band === 'excellent') return 'Excellent!';
          if (band === 'close') return 'Pretty close';
          if (band === 'partial') return 'Getting there';
          return "That doesn't match";
     }

     function classFor(band) {
          if (band === 'excellent') return 'good';
          if (band === 'close') return 'ok';
          return 'bad';
     }

     function scoreTranscript(target, transcript, lang) {
          const tCanon = canonicalize(target);
          const sCanon = canonicalize(transcript);
          const empty = {
               score: 0,
               tCanon: tCanon,
               sCanon: sCanon,
               targetWords: tCanon ? tokenize(tCanon) : [],
               saidWords: sCanon ? tokenize(sCanon) : [],
               hits: [],
               missing: tCanon ? tokenize(tCanon) : [],
               extras: sCanon ? tokenize(sCanon) : [],
               orderedRatio: 0,
               bagRatio: 0,
               phoneSim: 0,
               charSim: 0,
          };

          if (!tCanon || !sCanon) return empty;

          const targetWords = tokenize(tCanon);
          const saidWords = tokenize(sCanon);
          const tPhone = phoneticKey(tCanon, lang);
          const sPhone = phoneticKey(sCanon, lang);
          const align = greedyAlign(targetWords, saidWords, lang);
          const bagRatio = targetWords.length ? align.hits.length / targetWords.length : 0;
          const orderedRatio = targetWords.length ? align.orderedHits / targetWords.length : 0;
          const extraCount = align.extras.length;
          const extraRatio = saidWords.length ? extraCount / saidWords.length : 0;
          const quality = pairQuality(align.hits, lang);
          const fullChar = similarity(tCanon.replace(/\s+/g, ''), sCanon.replace(/\s+/g, ''));
          const fullPhone = similarity(tPhone, sPhone);
          const phoneSim = align.hits.length ? quality.phone : fullPhone;
          const charSim = align.hits.length ? quality.char : fullChar;

          let score;
          if (tCanon === sCanon) {
               score = 1;
          } else if (tPhone === sPhone && extraCount === 0 && targetWords.length === saidWords.length) {
               score = 0.97;
          } else if (targetWords.length === 1) {
               const best = align.bestSingle;
               if (best >= 0.97) {
                    score = clamp(1 - 0.045 * extraCount, 0, 1);
               } else if (best >= WORD_HIT) {
                    score = clamp(0.12 + best * 0.72 + fullPhone * 0.16 - 0.05 * extraCount, 0, 1);
               } else {
                    score = clamp(0.55 * fullPhone + 0.45 * fullChar, 0, 1);
               }
          } else {
               const missingRatio = 1 - bagRatio;
               score = clamp(
                    bagRatio * 0.4 +
                         orderedRatio * 0.15 +
                         phoneSim * 0.2 +
                         charSim * 0.15 -
                         missingRatio * 0.35 -
                         Math.min(0.2, extraRatio * 0.25),
                    0,
                    1
               );
               if (bagRatio >= 0.99 && extraCount === 0 && quality.avg >= 0.97) {
                    score = Math.max(score, 0.55 * quality.avg + 0.25 * orderedRatio + 0.2 * phoneSim);
               }
          }

          const band = bandFor(score, bagRatio, extraCount, targetWords.length);
          return {
               score: score,
               tCanon: tCanon,
               sCanon: sCanon,
               targetWords: targetWords,
               saidWords: saidWords,
               hits: align.hits,
               missing: align.missing,
               extras: align.extras,
               orderedRatio: orderedRatio,
               bagRatio: bagRatio,
               phoneSim: phoneSim,
               charSim: charSim,
               band: band,
          };
     }

     function uniqueAlternatives(alternatives) {
          const seen = new Set();
          const out = [];
          (alternatives || []).forEach(function (alt) {
               if (!alt) return;
               const text = String(alt.text || alt.transcript || '').trim();
               if (!text) return;
               const key = text.toLowerCase();
               if (seen.has(key)) return;
               seen.add(key);
               const conf = typeof alt.confidence === 'number' ? alt.confidence : typeof alt.conf === 'number' ? alt.conf : 0;
               out.push({ text: text, confidence: conf });
          });
          return out;
     }

     function gradePronunciation(opts) {
          const target = String((opts && opts.target) || '').trim();
          const lang = (opts && opts.lang) || 'es-MX';
          const alts = uniqueAlternatives(opts && opts.alternatives);

          if (!target) {
               return {
                    score: 0,
                    percent: 0,
                    band: 'miss',
                    label: 'No target phrase',
                    className: 'bad',
                    transcript: '',
                    confidence: 0,
                    hits: [],
                    missing: [],
                    extras: [],
                    tips: [],
                    alternatives: [],
                    bagRatio: 0,
                    orderedRatio: 0,
               };
          }

          if (!alts.length) {
               return {
                    score: 0,
                    percent: 0,
                    band: 'miss',
                    label: 'No speech detected',
                    className: 'bad',
                    transcript: '',
                    confidence: 0,
                    hits: [],
                    missing: tokenize(target),
                    extras: [],
                    tips: ['Speak a little louder and closer to the microphone.'],
                    alternatives: [],
                    bagRatio: 0,
                    orderedRatio: 0,
               };
          }

          let best = null;
          const scored = [];
          for (let i = 0; i < alts.length; i++) {
               const result = scoreTranscript(target, alts[i].text, lang);
               result.transcript = alts[i].text;
               result.confidence = alts[i].confidence;
               scored.push(result);
               if (
                    !best ||
                    result.score > best.score + 0.015 ||
                    (Math.abs(result.score - best.score) <= 0.015 && result.confidence > best.confidence)
               ) {
                    best = result;
               }
          }

          const band = best.band || bandFor(best.score, best.bagRatio, best.extras.length, best.targetWords.length);
          const tips = [];
          if (best.missing.length) tips.push('Missing: <strong>' + best.missing.join(', ') + '</strong>.');
          if (best.extras.length && best.targetWords.length === 1) {
               tips.push('Say only: <strong>' + target + '</strong>.');
          } else if (best.extras.length) {
               tips.push('Extra: <em>' + best.extras.join(', ') + '</em>.');
          }
          distinctiveTips(target, best.transcript).forEach(function (t) {
               if (tips.length < 3) tips.push(t);
          });
          if (band === 'miss' && !tips.length) {
               tips.push('Listen to the model, then say: <strong>' + target + '</strong>.');
          }

          return {
               score: best.score,
               percent: Math.round(best.score * 100),
               band: band,
               label: labelFor(band),
               className: classFor(band),
               transcript: best.transcript,
               confidence: best.confidence,
               hits: best.hits,
               missing: best.missing,
               extras: best.extras,
               targetWords: best.targetWords,
               saidWords: best.saidWords,
               tips: tips,
               alternatives: scored.slice().sort(function (a, b) {
                    return b.score - a.score;
               }),
               bagRatio: best.bagRatio,
               orderedRatio: best.orderedRatio,
               phoneSim: best.phoneSim,
               charSim: best.charSim,
          };
     }

     const api = {
          canonicalize: canonicalize,
          phoneticKey: phoneticKey,
          similarity: similarity,
          scoreTranscript: scoreTranscript,
          gradePronunciation: gradePronunciation,
     };

     if (typeof module !== 'undefined' && module.exports) {
          module.exports = api;
     }
     root.PronunciationGrade = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
