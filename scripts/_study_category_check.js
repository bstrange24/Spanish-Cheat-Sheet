#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const context = {
     location: { hostname: 'localhost', protocol: 'http:', origin: 'http://localhost', hash: '' },
     document: {
          documentElement: { setAttribute: function () {}, getAttribute: function () { return ''; } },
          addEventListener: function () {},
          querySelectorAll: function () {
               return [];
          },
          querySelector: function () {
               return null;
          },
          getElementById: function (id) {
               return context._els[id] || null;
          },
     },
     localStorage: {
          getItem: function () {
               return null;
          },
          setItem: function () {},
     },
     console: console,
     _els: {},
};
context.window = context;
context.window.location = context.location;
context.globalThis = context;

function run(file) {
     vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

run('js/dictionary.js');
run('js/dictionary-extra.js');
run('js/shared.js');

const dropdown = ['greetings', 'food', 'verbs', 'everyday', 'travel', 'family', 'body', 'house', 'weather', 'shopping', 'clothing', 'animals', 'emotions', 'work', 'numbers', 'time'];

function select(cat, level, onlyVerbs) {
     context._els = {
          category: { value: cat },
          difficulty: { value: level || 'all' },
          onlyVerbs: { checked: !!onlyVerbs },
     };
}

let failed = 0;
dropdown.forEach(function (cat) {
     select(cat, 'all', false);
     const keys = context.getFilteredKeys();
     const pairs = keys.filter(function (k) {
          const e = context.dictEntry(k);
          return e && e.meaning;
     });
     if (!pairs.length) {
          console.error('FAIL', cat, 'has no quiz/flashcard pairs');
          failed += 1;
     } else {
          console.log(cat, pairs.length, 'pairs', 'e.g.', pairs[0], '→', context.dictEntry(pairs[0]).meaning);
     }
});

select('all', 'all', false);
const all = context.getFilteredKeys();
if (all.length < 100) {
     console.error('FAIL all categories too small', all.length);
     failed += 1;
}

select('food', 'beginner', false);
const foodBeginner = context.getFilteredKeys();
if (!foodBeginner.length) {
     console.error('FAIL food + beginner empty');
     failed += 1;
}

if (failed) {
     console.error(failed + ' failures');
     process.exit(1);
}
console.log('OK', all.length, 'total filtered keys');
