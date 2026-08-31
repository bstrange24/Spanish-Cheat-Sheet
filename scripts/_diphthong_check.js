const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

execFileSync(process.execPath, ['--check', path.join(__dirname, '..', 'js', 'spanish-cheatsheet.js')], {
     stdio: 'inherit',
});

const DIPHTHONG_RE =
     /üe|üi|ái|áu|éi|éu|ói|óu|iá|ié|ió|uá|ué|uó|ai|au|ei|eu|oi|ou|ia|ie|io|iu|ua|ue|ui|uo|ay|ey|oy|uy/gi;
const HIATUS_RE = /ía|íe|ío|íu|úa|úe|úi|úo|uí|iú|aí|eí|oí|aú|eú|oú/gi;
const SILENT_U_RE = /[qg]u(?=[eéií])/gi;
const Y_DIPHTHONGS = { ay: true, ey: true, oy: true, uy: true };
const VOWEL_RE = /[aeiouáéíóúü]/i;

function allMatches(re, text) {
     return Array.from(String(text).matchAll(new RegExp(re.source, re.flags)));
}
function spansOverlap(a, b) {
     return !(a[1] <= b[0] || b[1] <= a[0]);
}
function findDiphthongSpans(word) {
     const blocked = new Array(word.length).fill(false);
     allMatches(HIATUS_RE, word).forEach((m) => {
          for (let i = m.index; i < m.index + m[0].length; i++) blocked[i] = true;
     });
     allMatches(SILENT_U_RE, word).forEach((m) => {
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
     candidates.forEach((span) => {
          if (chosen.some((c) => spansOverlap(span, c))) return;
          chosen.push(span);
     });
     chosen.sort((a, b) => a[0] - b[0]);
     return chosen;
}
function mark(word) {
     const spans = findDiphthongSpans(word);
     if (!spans.length) return word;
     let out = '';
     let i = 0;
     for (const [s, e] of spans) {
          out += word.slice(i, s) + '[' + word.slice(s, e) + ']';
          i = e;
     }
     return out + word.slice(i);
}

function walk(dir, acc = []) {
     for (const name of fs.readdirSync(dir)) {
          const p = path.join(dir, name);
          if (fs.statSync(p).isDirectory()) walk(p, acc);
          else if (name.endsWith('.html')) acc.push(p);
     }
     return acc;
}

const files = walk(path.join(__dirname, '..', 'sections'));
const seen = new Map();
for (const f of files) {
     const html = fs.readFileSync(f, 'utf8');
     const wr = /data-text="([^"]+)"/g;
     let m;
     while ((m = wr.exec(html))) {
          const phrase = m[1];
          const words = phrase.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) || [];
          for (const w of words) {
               if (!seen.has(w)) seen.set(w, mark(w));
          }
     }
}
const marked = [...seen.entries()].filter(([, v]) => v.includes('['));
const unmarked = [...seen.entries()].filter(([, v]) => !v.includes('['));
console.log('Unique .say words:', seen.size);
console.log('With diphthong:', marked.length);
console.log('Without:', unmarked.length);
console.log('Sample marked:', marked.slice(0, 30).map(([, v]) => v).join(', '));
console.log(
     'Hiatus/silent samples:',
     ['día', 'país', 'baúl', 'tío', 'guerra', 'queso', 'guitarra', 'qué']
          .map((w) => w + '=' + mark(w))
          .join(', ')
);
