/**
 * Spanish conjugator for the practice page.
 * Covers present, preterite, imperfect, future, and conditional.
 */
(function (root) {
     'use strict';

     const ENDINGS = {
          present: {
               ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
               er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
               ir: ['o', 'es', 'e', 'imos', 'ís', 'en'],
          },
          preterite: {
               ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
               er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
               ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
          },
          imperfect: {
               ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
               er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
               ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
          },
     };

     const FUTURE = ['é', 'ás', 'á', 'emos', 'éis', 'án'];
     const CONDITIONAL = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
     const BOOT = [0, 1, 2, 5];

     const STEM_CHANGE = {};
     function addChange(change, verbs) {
          verbs.forEach(function (verb) {
               STEM_CHANGE[verb] = change;
          });
     }
     addChange('o→ue', ['acostar', 'almorzar', 'aprobar', 'colgar', 'comprobar', 'contar', 'costar', 'demostrar', 'devolver', 'doler', 'dormir', 'encontrar', 'envolver', 'forzar', 'llover', 'moler', 'morir', 'mostrar', 'mover', 'poder', 'probar', 'promover', 'recordar', 'resolver', 'soñar', 'torcer', 'volar', 'volver']);
     addChange('e→ie', ['ascender', 'atender', 'atravesar', 'calentar', 'cerrar', 'comenzar', 'confesar', 'convertir', 'defender', 'despertar', 'divertir', 'empezar', 'encender', 'entender', 'extender', 'fregar', 'gobernar', 'manifestar', 'mentir', 'negar', 'nevar', 'pensar', 'perder', 'preferir', 'querer', 'recomendar', 'regar', 'sentar', 'sentir', 'sugerir', 'temblar', 'tender', 'tener', 'venir']);
     addChange('e→i', ['competir', 'conseguir', 'corregir', 'decir', 'elegir', 'freír', 'medir', 'pedir', 'reír', 'repetir', 'seguir', 'servir', 'sonreír', 'vestir']);
     addChange('u→ue', ['jugar']);
     addChange('i→ie', ['adquirir', 'inquirir']);

     const IAR_STRESS = { confiar: true, enviar: true, esquiar: true, fiar: true, fotografiar: true, guiar: true, liar: true };

     // A handful of -ir verbs break the hiatus and stress the u in boot forms (reúno, reúnes...).
     const HIATUS_U_STRESS = { reunir: true };

     // -uar verbs stress the u in boot forms (continúo, actúo) except when
     // the u is part of a gu/cu digraph pronounced as a single glide.
     const UAR_NO_STRESS = {
          averiguar: true,
          apaciguar: true,
          amortiguar: true,
          santiguar: true,
          menguar: true,
          atestiguar: true,
          aguar: true,
          desaguar: true,
          fraguar: true,
     };

     const PREFIX_ROOTS = {
          contener: 'tener',
          mantener: 'tener',
          obtener: 'tener',
          detener: 'tener',
          sostener: 'tener',
          devolver: 'volver',
          envolver: 'volver',
          revolver: 'volver',
          suponer: 'poner',
          componer: 'poner',
          imponer: 'poner',
          proponer: 'poner',
          disponer: 'poner',
          conseguir: 'seguir',
          perseguir: 'seguir',
          reconocer: 'conocer',
          desconocer: 'conocer',
          contraer: 'traer',
          distraer: 'traer',
          atraer: 'traer',
          convenir: 'venir',
          prevenir: 'venir',
          predecir: 'decir',
          bendecir: 'decir',
          rehacer: 'hacer',
          deshacer: 'hacer',
     };

     const PRETERITE_STEMS = {
          andar: 'anduv',
          caber: 'cup',
          estar: 'estuv',
          haber: 'hub',
          hacer: 'hic',
          poder: 'pud',
          poner: 'pus',
          querer: 'quis',
          saber: 'sup',
          tener: 'tuv',
          venir: 'vin',
          decir: 'dij',
          traer: 'traj',
          conducir: 'conduj',
          producir: 'produj',
          traducir: 'traduj',
          satisfacer: 'satisfic',
     };

     const J_STEMS = { dij: true, traj: true, conduj: true, produj: true, traduj: true };

     const FUTURE_STEMS = {
          caber: 'cabr',
          decir: 'dir',
          haber: 'habr',
          hacer: 'har',
          poder: 'podr',
          poner: 'pondr',
          querer: 'querr',
          saber: 'sabr',
          salir: 'saldr',
          tener: 'tendr',
          valer: 'valdr',
          venir: 'vendr',
          satisfacer: 'satisfar',
     };

     const FULL = {
          ser: {
               present: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
               preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
               imperfect: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
          },
          ir: {
               present: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
               preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
               imperfect: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
          },
          estar: {
               present: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
          },
          haber: {
               present: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
          },
          dar: {
               present: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
               preterite: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
          },
          ver: {
               present: ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
               preterite: ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
               imperfect: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
          },
          saber: {
               present: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
          },
          caber: {
               present: ['quepo', 'cabes', 'cabe', 'cabemos', 'cabéis', 'caben'],
          },
          oír: {
               present: ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'],
               preterite: ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'],
          },
          reír: {
               present: ['río', 'ríes', 'ríe', 'reímos', 'reís', 'ríen'],
               preterite: ['reí', 'reíste', 'rio', 'reímos', 'reísteis', 'rieron'],
          },
          sonreír: {
               present: ['sonrío', 'sonríes', 'sonríe', 'sonreímos', 'sonreís', 'sonríen'],
               preterite: ['sonreí', 'sonreíste', 'sonrio', 'sonreímos', 'sonreísteis', 'sonrieron'],
          },
     };

     const YO_GO = {
          hacer: 'hago',
          poner: 'pongo',
          salir: 'salgo',
          tener: 'tengo',
          venir: 'vengo',
          decir: 'digo',
          caer: 'caigo',
          traer: 'traigo',
          valer: 'valgo',
          satisfacer: 'satisfago',
     };

     function splitVerb(infinitive) {
          const inf = String(infinitive || '')
               .toLowerCase()
               .trim();
          if (inf.endsWith('ír')) return { inf: inf, stem: inf.slice(0, -2), type: 'ir' };
          if (/(ar|er|ir)$/.test(inf)) return { inf: inf, stem: inf.slice(0, -2), type: inf.slice(-2) };
          return null;
     }

     function changeStem(stem, change) {
          if (!change) return stem;
          const parts = change.split('→');
          const from = parts[0];
          const to = parts[1];
          const position = stem.lastIndexOf(from);
          if (position < 0) return stem;
          return stem.slice(0, position) + to + stem.slice(position + from.length);
     }

     function iToY(form) {
          return form.replace(/([aeoáéó])i([aeouáéóú])/gi, '$1y$2').replace(/([^g]u)i([aeouáéóú])/gi, '$1y$2');
     }

     function spellingPresentYo(inf, stem, form) {
          if (/guir$/.test(inf) && form.endsWith('guo')) return form.slice(0, -3) + 'go';
          if (/(ger|gir)$/.test(inf) && /g[oa]$/.test(form)) return form.slice(0, -2) + 'j' + form.slice(-1);
          if ((/[aeiouáéíóú]c[ei]r$/.test(inf) || /ucir$/.test(inf)) && form.endsWith('co')) {
               return form.slice(0, -2) + 'zco';
          }
          if (/[^aeiouáéíóú]c[ei]r$/.test(inf) && form.endsWith('co')) {
               return form.slice(0, -2) + 'zo';
          }
          return form;
     }

     function spellingPreteriteYo(inf, form) {
          if (inf.endsWith('car') && form.endsWith('cé')) return form.slice(0, -2) + 'qué';
          if (inf.endsWith('gar') && form.endsWith('gé')) return form.slice(0, -2) + 'gué';
          if (inf.endsWith('zar') && form.endsWith('zé')) return form.slice(0, -2) + 'cé';
          return form;
     }

     function accentIAfterVowel(stem, ending) {
          if (/[aeo]$/i.test(stem) && /^i(?!ó|e)/.test(ending)) {
               return stem + 'í' + ending.slice(1);
          }
          return stem + ending;
     }

     function presentYoOverride(inf) {
          if (YO_GO[inf]) return YO_GO[inf];
          return null;
     }

     function futureStem(inf) {
          if (FUTURE_STEMS[inf]) return FUTURE_STEMS[inf];
          if (REGULAR_FUTURE_OVERRIDE[inf]) return inf;
          if (PREFIX_ROOTS[inf] && FUTURE_STEMS[PREFIX_ROOTS[inf]]) {
               const root = PREFIX_ROOTS[inf];
               return inf.slice(0, -root.length) + FUTURE_STEMS[root];
          }
          if (inf.endsWith('ír')) return inf.slice(0, -2) + 'ir';
          return inf;
     }

     function preteriteStemFor(inf) {
          if (PRETERITE_STEMS[inf]) return PRETERITE_STEMS[inf];
          if (PREFIX_ROOTS[inf] && PRETERITE_STEMS[PREFIX_ROOTS[inf]]) {
               const root = PREFIX_ROOTS[inf];
               return inf.slice(0, -root.length) + PRETERITE_STEMS[root];
          }
          if (/ucir$/.test(inf)) return inf.slice(0, -3) + 'j';
          return null;
     }

     function conjugateRegular(inf, tense) {
          const parts = splitVerb(inf);
          if (!parts) return null;
          const type = parts.type;
          const stem = parts.stem;
          const change = STEM_CHANGE[inf];

          if (tense === 'future' || tense === 'conditional') {
               const suffixes = tense === 'future' ? FUTURE : CONDITIONAL;
               const base = futureStem(inf);
               return suffixes.map(function (suffix) {
                    return base + suffix;
               });
          }

          if (tense === 'imperfect') {
               return ENDINGS.imperfect[type].map(function (suffix) {
                    return stem + suffix;
               });
          }

          if (tense === 'preterite') {
               const irrStem = preteriteStemFor(inf);
               if (irrStem) {
                    const jStem = !!J_STEMS[irrStem] || irrStem.endsWith('j');
                    const irrEndings = jStem ? ['e', 'iste', 'o', 'imos', 'isteis', 'eron'] : ['e', 'iste', 'o', 'imos', 'isteis', 'ieron'];
                    return irrEndings.map(function (suffix, index) {
                         let form = irrStem + suffix;
                         if (irrStem.endsWith('c') && suffix.startsWith('o')) form = irrStem.slice(0, -1) + 'z' + suffix;
                         return form;
                    });
               }

               const endings = ENDINGS.preterite[type];
               return endings.map(function (suffix, index) {
                    let useStem = stem;
                    if (type === 'ir' && change && (index === 2 || index === 5)) {
                         if (change === 'e→ie' || change === 'e→i') useStem = changeStem(stem, 'e→i');
                         else if (change === 'o→ue') useStem = changeStem(stem, 'o→u');
                    }
                    let form = accentIAfterVowel(useStem, suffix);
                    if (type !== 'ar' && (index === 2 || index === 5)) form = iToY(form);
                    if (index === 0) form = spellingPreteriteYo(inf, form);
                    return form;
               });
          }

          if (tense === 'present') {
               const endings = ENDINGS.present[type];
               const changed = changeStem(stem, change);
               const forms = endings.map(function (suffix, index) {
                    let useStem = BOOT.indexOf(index) >= 0 && change ? changed : stem;
                    if (IAR_STRESS[inf] && BOOT.indexOf(index) >= 0 && useStem.endsWith('i')) {
                         useStem = useStem.slice(0, -1) + 'í';
                    }
                    if (/uar$/.test(inf) && !UAR_NO_STRESS[inf] && BOOT.indexOf(index) >= 0 && useStem.endsWith('u')) {
                         useStem = useStem.slice(0, -1) + 'ú';
                    }
                    if (HIATUS_U_STRESS[inf] && BOOT.indexOf(index) >= 0 && useStem.indexOf('u') >= 0) {
                         const pos = useStem.lastIndexOf('u');
                         useStem = useStem.slice(0, pos) + 'ú' + useStem.slice(pos + 1);
                    }
                    if (/uir$/.test(inf) && !/guir$/.test(inf) && BOOT.indexOf(index) >= 0) {
                         useStem = stem + 'y';
                    }
                    return useStem + suffix;
               });
               forms[0] = spellingPresentYo(inf, stem, forms[0]);
               const yo = presentYoOverride(inf);
               if (yo) forms[0] = yo;
               return forms;
          }

          return null;
     }

     // predecir/bendecir inherit decir's present & preterite irregularities,
     // but their future/conditional stay regular (predeciré, not "prediré").
     const REGULAR_FUTURE_OVERRIDE = { predecir: true, bendecir: true };

     function conjugate(infinitive, tense) {
          const inf = String(infinitive || '')
               .toLowerCase()
               .trim();
          if (FULL[inf] && FULL[inf][tense]) return FULL[inf][tense].slice();
          if (PREFIX_ROOTS[inf] && !(REGULAR_FUTURE_OVERRIDE[inf] && (tense === 'future' || tense === 'conditional'))) {
               const root = PREFIX_ROOTS[inf];
               const prefix = inf.slice(0, -root.length);
               const rootForms = conjugate(root, tense);
               if (rootForms && rootForms.length) {
                    return rootForms.map(function (form) {
                         return prefix + form;
                    });
               }
          }
          return conjugateRegular(inf, tense);
     }

     const api = {
          conjugate: conjugate,
          stemChangeOf: function (inf) {
               return STEM_CHANGE[String(inf || '').toLowerCase()] || null;
          },
     };

     if (typeof module !== 'undefined' && module.exports) {
          module.exports = api;
     }
     root.SpanishConjugate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
