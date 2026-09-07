#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const { conjugate } = require(path.join(root, 'js', 'spanish-conjugate.js'));

const PERSONS = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos'];
const TENSES = ['present', 'preterite', 'imperfect', 'future', 'conditional'];

function fail(message) {
     console.error('FAIL', message);
     failed += 1;
}

let failed = 0;
let checked = 0;

function expectForms(inf, tense, expected) {
     const got = conjugate(inf, tense);
     checked += 1;
     if (!got) {
          fail(`${inf} ${tense}: got null`);
          return;
     }
     for (let i = 0; i < expected.length; i++) {
          if (got[i] !== expected[i]) {
               fail(`${inf} ${tense} ${PERSONS[i]}: got ${got[i]} expected ${expected[i]}`);
          }
     }
}

function expectEl(inf, tense, expected) {
     const got = conjugate(inf, tense);
     checked += 1;
     if (!got || got[2] !== expected) {
          fail(`${inf} ${tense} él: got ${got && got[2]} expected ${expected}`);
     }
}

function expectYo(inf, expected) {
     const got = conjugate(inf, 'present');
     checked += 1;
     if (!got || got[0] !== expected) {
          fail(`${inf} present yo: got ${got && got[0]} expected ${expected}`);
     }
}

// --- Golden forms for the reported bug and nearby stem-changers ---
expectForms('volar', 'present', ['vuelo', 'vuelas', 'vuela', 'volamos', 'voláis', 'vuelan']);
expectForms('volver', 'present', ['vuelvo', 'vuelves', 'vuelve', 'volvemos', 'volvéis', 'vuelven']);
expectEl('volar', 'present', 'vuela');
expectEl('volver', 'present', 'vuelve');

expectForms('acostar', 'present', ['acuesto', 'acuestas', 'acuesta', 'acostamos', 'acostáis', 'acuestan']);
expectForms('comprobar', 'present', ['compruebo', 'compruebas', 'comprueba', 'comprobamos', 'comprobáis', 'comprueban']);
expectForms('mostrar', 'present', ['muestro', 'muestras', 'muestra', 'mostramos', 'mostráis', 'muestran']);
expectForms('probar', 'present', ['pruebo', 'pruebas', 'prueba', 'probamos', 'probáis', 'prueban']);
expectForms('morir', 'present', ['muero', 'mueres', 'muere', 'morimos', 'morís', 'mueren']);
expectForms('llover', 'present', ['lluevo', 'llueves', 'llueve', 'llovemos', 'llovéis', 'llueven']);
expectForms('convertir', 'present', ['convierto', 'conviertes', 'convierte', 'convertimos', 'convertís', 'convierten']);
expectForms('medir', 'present', ['mido', 'mides', 'mide', 'medimos', 'medís', 'miden']);
expectForms('pensar', 'present', ['pienso', 'piensas', 'piensa', 'pensamos', 'pensáis', 'piensan']);
expectForms('poder', 'present', ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden']);
expectForms('jugar', 'present', ['juego', 'juegas', 'juega', 'jugamos', 'jugáis', 'juegan']);
expectForms('seguir', 'present', ['sigo', 'sigues', 'sigue', 'seguimos', 'seguís', 'siguen']);
expectForms('conseguir', 'present', ['consigo', 'consigues', 'consigue', 'conseguimos', 'conseguís', 'consiguen']);
expectForms('pedir', 'present', ['pido', 'pides', 'pide', 'pedimos', 'pedís', 'piden']);
expectForms('vestir', 'present', ['visto', 'vistes', 'viste', 'vestimos', 'vestís', 'visten']);
expectForms('sentir', 'present', ['siento', 'sientes', 'siente', 'sentimos', 'sentís', 'sienten']);
expectForms('preferir', 'present', ['prefiero', 'prefieres', 'prefiere', 'preferimos', 'preferís', 'prefieren']);
expectForms('tener', 'present', ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen']);
expectForms('venir', 'present', ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen']);
expectForms('contener', 'present', ['contengo', 'contienes', 'contiene', 'contenemos', 'contenéis', 'contienen']);
expectForms('mantener', 'present', ['mantengo', 'mantienes', 'mantiene', 'mantenemos', 'mantenéis', 'mantienen']);
expectForms('decir', 'present', ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen']);
expectForms('hacer', 'present', ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen']);
expectForms('poner', 'present', ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen']);
expectForms('suponer', 'present', ['supongo', 'supones', 'supone', 'suponemos', 'suponéis', 'suponen']);
expectForms('conocer', 'present', ['conozco', 'conoces', 'conoce', 'conocemos', 'conocéis', 'conocen']);
expectForms('aparecer', 'present', ['aparezco', 'apareces', 'aparece', 'aparecemos', 'aparecéis', 'aparecen']);
expectForms('conducir', 'present', ['conduzco', 'conduces', 'conduce', 'conducimos', 'conducís', 'conducen']);
expectForms('oír', 'present', ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen']);
expectForms('reír', 'present', ['río', 'ríes', 'ríe', 'reímos', 'reís', 'ríen']);
expectForms('ver', 'present', ['veo', 'ves', 've', 'vemos', 'veis', 'ven']);
expectForms('dar', 'present', ['doy', 'das', 'da', 'damos', 'dais', 'dan']);
expectForms('ser', 'present', ['soy', 'eres', 'es', 'somos', 'sois', 'son']);
expectForms('ir', 'present', ['voy', 'vas', 'va', 'vamos', 'vais', 'van']);
expectForms('estar', 'present', ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están']);
expectForms('haber', 'present', ['he', 'has', 'ha', 'hemos', 'habéis', 'han']);
expectForms('saber', 'present', ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben']);
expectForms('caber', 'present', ['quepo', 'cabes', 'cabe', 'cabemos', 'cabéis', 'caben']);
expectForms('enviar', 'present', ['envío', 'envías', 'envía', 'enviamos', 'enviáis', 'envían']);
expectForms('enviar', 'preterite', ['envié', 'enviaste', 'envió', 'enviamos', 'enviasteis', 'enviaron']);
expectForms('esquiar', 'present', ['esquío', 'esquías', 'esquía', 'esquiamos', 'esquiáis', 'esquían']);
expectForms('esquiar', 'preterite', ['esquié', 'esquiaste', 'esquió', 'esquiamos', 'esquiasteis', 'esquiaron']);
expectForms('oír', 'future', ['oiré', 'oirás', 'oirá', 'oiremos', 'oiréis', 'oirán']);
expectForms('reír', 'future', ['reiré', 'reirás', 'reirá', 'reiremos', 'reiréis', 'reirán']);
expectForms('oír', 'conditional', ['oiría', 'oirías', 'oiría', 'oiríamos', 'oiríais', 'oirían']);
expectForms('caer', 'present', ['caigo', 'caes', 'cae', 'caemos', 'caéis', 'caen']);
expectForms('traer', 'present', ['traigo', 'traes', 'trae', 'traemos', 'traéis', 'traen']);
expectForms('salir', 'present', ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen']);

// Regular present
expectForms('hablar', 'present', ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan']);
expectForms('comer', 'present', ['como', 'comes', 'come', 'comemos', 'coméis', 'comen']);
expectForms('vivir', 'present', ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven']);
expectForms('abrir', 'present', ['abro', 'abres', 'abre', 'abrimos', 'abrís', 'abren']);

// Preterite irregularities and spelling
expectForms('hablar', 'preterite', ['hablé', 'hablaste', 'habló', 'hablamos', 'hablasteis', 'hablaron']);
expectForms('comer', 'preterite', ['comí', 'comiste', 'comió', 'comimos', 'comisteis', 'comieron']);
expectForms('buscar', 'preterite', ['busqué', 'buscaste', 'buscó', 'buscamos', 'buscasteis', 'buscaron']);
expectForms('llegar', 'preterite', ['llegué', 'llegaste', 'llegó', 'llegamos', 'llegasteis', 'llegaron']);
expectForms('pagar', 'preterite', ['pagué', 'pagaste', 'pagó', 'pagamos', 'pagasteis', 'pagaron']);
expectForms('jugar', 'preterite', ['jugué', 'jugaste', 'jugó', 'jugamos', 'jugasteis', 'jugaron']);
expectForms('empezar', 'preterite', ['empecé', 'empezaste', 'empezó', 'empezamos', 'empezasteis', 'empezaron']);
expectForms('almorzar', 'preterite', ['almorcé', 'almorzaste', 'almorzó', 'almorzamos', 'almorzasteis', 'almorzaron']);
expectForms('tocar', 'preterite', ['toqué', 'tocaste', 'tocó', 'tocamos', 'tocasteis', 'tocaron']);
expectForms('cruzar', 'preterite', ['crucé', 'cruzaste', 'cruzó', 'cruzamos', 'cruzasteis', 'cruzaron']);
expectForms('leer', 'preterite', ['leí', 'leíste', 'leyó', 'leímos', 'leísteis', 'leyeron']);
expectForms('caer', 'preterite', ['caí', 'caíste', 'cayó', 'caímos', 'caísteis', 'cayeron']);
expectForms('oír', 'preterite', ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron']);
expectForms('pedir', 'preterite', ['pedí', 'pediste', 'pidió', 'pedimos', 'pedisteis', 'pidieron']);
expectForms('dormir', 'preterite', ['dormí', 'dormiste', 'durmió', 'dormimos', 'dormisteis', 'durmieron']);
expectForms('morir', 'preterite', ['morí', 'moriste', 'murió', 'morimos', 'moristeis', 'murieron']);
expectForms('preferir', 'preterite', ['preferí', 'preferiste', 'prefirió', 'preferimos', 'preferisteis', 'prefirieron']);
expectForms('seguir', 'preterite', ['seguí', 'seguiste', 'siguió', 'seguimos', 'seguisteis', 'siguieron']);
expectForms('conseguir', 'preterite', ['conseguí', 'conseguiste', 'consiguió', 'conseguimos', 'conseguisteis', 'consiguieron']);
expectForms('sentir', 'preterite', ['sentí', 'sentiste', 'sintió', 'sentimos', 'sentisteis', 'sintieron']);
expectForms('convertir', 'preterite', ['convertí', 'convertiste', 'convirtió', 'convertimos', 'convertisteis', 'convirtieron']);
expectForms('tener', 'preterite', ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron']);
expectForms('contener', 'preterite', ['contuve', 'contuviste', 'contuvo', 'contuvimos', 'contuvisteis', 'contuvieron']);
expectForms('estar', 'preterite', ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron']);
expectForms('hacer', 'preterite', ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron']);
expectForms('decir', 'preterite', ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron']);
expectForms('traer', 'preterite', ['traje', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron']);
expectForms('conducir', 'preterite', ['conduje', 'condujiste', 'condujo', 'condujimos', 'condujisteis', 'condujeron']);
expectForms('producir', 'preterite', ['produje', 'produjiste', 'produjo', 'produjimos', 'produjisteis', 'produjeron']);
expectForms('andar', 'preterite', ['anduve', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron']);
expectForms('dar', 'preterite', ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron']);
expectForms('ver', 'preterite', ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron']);
expectForms('ir', 'preterite', ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']);
expectForms('ser', 'preterite', ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']);
expectForms('poder', 'preterite', ['pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron']);
expectForms('querer', 'preterite', ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron']);
expectForms('venir', 'preterite', ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron']);
expectForms('poner', 'preterite', ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron']);
expectForms('saber', 'preterite', ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron']);
expectForms('haber', 'preterite', ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron']);
expectForms('caber', 'preterite', ['cupe', 'cupiste', 'cupo', 'cupimos', 'cupisteis', 'cupieron']);

// Imperfect
expectForms('hablar', 'imperfect', ['hablaba', 'hablabas', 'hablaba', 'hablábamos', 'hablabais', 'hablaban']);
expectForms('comer', 'imperfect', ['comía', 'comías', 'comía', 'comíamos', 'comíais', 'comían']);
expectForms('ser', 'imperfect', ['era', 'eras', 'era', 'éramos', 'erais', 'eran']);
expectForms('ir', 'imperfect', ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban']);
expectForms('ver', 'imperfect', ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían']);

// Future / conditional
expectForms('hablar', 'future', ['hablaré', 'hablarás', 'hablará', 'hablaremos', 'hablaréis', 'hablarán']);
expectForms('tener', 'future', ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán']);
expectForms('contener', 'future', ['contendré', 'contendrás', 'contendrá', 'contendremos', 'contendréis', 'contendrán']);
expectForms('hacer', 'future', ['haré', 'harás', 'hará', 'haremos', 'haréis', 'harán']);
expectForms('decir', 'future', ['diré', 'dirás', 'dirá', 'diremos', 'diréis', 'dirán']);
expectForms('poner', 'future', ['pondré', 'pondrás', 'pondrá', 'pondremos', 'pondréis', 'pondrán']);
expectForms('salir', 'future', ['saldré', 'saldrás', 'saldrá', 'saldremos', 'saldréis', 'saldrán']);
expectForms('venir', 'future', ['vendré', 'vendrás', 'vendrá', 'vendremos', 'vendréis', 'vendrán']);
expectForms('poder', 'conditional', ['podría', 'podrías', 'podría', 'podríamos', 'podríais', 'podrían']);
expectForms('querer', 'conditional', ['querría', 'querrías', 'querría', 'querríamos', 'querríais', 'querrían']);
expectForms('haber', 'future', ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán']);
expectForms('saber', 'future', ['sabré', 'sabrás', 'sabrá', 'sabremos', 'sabréis', 'sabrán']);
expectForms('caber', 'future', ['cabré', 'cabrás', 'cabrá', 'cabremos', 'cabréis', 'cabrán']);

// Compare present yo against verbs.html
const verbsHtml = fs.readFileSync(path.join(root, 'sections', 'verbs', 'verbs.html'), 'utf8');
const rowRe = /<tr>[\s\S]*?<\/tr>/g;
const rows = verbsHtml.match(rowRe) || [];
let yoChecked = 0;
for (const row of rows) {
     const texts = [...row.matchAll(/data-text="([^"]+)"/g)].map(m => m[1]);
     if (texts.length < 2) continue;
     const inf = texts[0].toLowerCase();
     const yo = texts[1].toLowerCase();
     if (!/(ar|er|ir|ír)$/.test(inf)) continue;
     if (inf === 'levantarse') continue;
     yoChecked += 1;
     const got = conjugate(inf, 'present');
     if (inf === 'llover') {
          if (!got || got[2] !== 'llueve') fail(`llover él: got ${got && got[2]} expected llueve`);
          continue;
     }
     if (!got || got[0] !== yo) {
          fail(`verbs.html ${inf} yo: got ${got && got[0]} expected ${yo}`);
     }
     for (const tense of TENSES) {
          const forms = conjugate(inf, tense);
          if (!forms || forms.length !== 6 || forms.some(form => !form)) {
               fail(`${inf} ${tense}: missing forms ${JSON.stringify(forms)}`);
          }
     }
}

console.log(`checked ${checked} golden cases, ${yoChecked} verbs.html yo forms`);
if (failed) {
     console.error(`${failed} failures`);
     process.exit(1);
}
console.log('OK');
