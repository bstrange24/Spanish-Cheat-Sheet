(function () {
     'use strict';

     const GROUPS = [
          ['ar', '-ar verbs'],
          ['er', '-er verbs'],
          ['ir', '-ir verbs'],
     ];
     const TENSES = [
          ['present', 'Present'],
          ['preterite', 'Preterite'],
          ['imperfect', 'Imperfect'],
          ['future', 'Future'],
          ['conditional', 'Conditional'],
     ];
     const PRONOUNS = [
          ['yo', 'yo'],
          ['tu', 'tú'],
          ['el', 'él / ella / usted'],
          ['nosotros', 'nosotros / nosotras'],
          ['vosotros', 'vosotros / vosotras'],
          ['ellos', 'ellos / ellas / ustedes'],
     ];
     const state = { correct: 0, attempted: 0 };
     const shuffled = new Map();

     function optionMarkup(items) {
          return items.map(item => `<option value="${item[0]}">${item[1]}</option>`).join('');
     }

     function randomize(select) {
          if (!select.options.length) return;
          let bag = shuffled.get(select);
          if (!bag || !bag.length) {
               bag = Array.from({ length: select.options.length }, (_, index) => index);
               for (let index = bag.length - 1; index > 0; index--) {
                    const swap = Math.floor(Math.random() * (index + 1));
                    [bag[index], bag[swap]] = [bag[swap], bag[index]];
               }
          }
          select.value = select.options[bag.shift()].value;
          shuffled.set(select, bag);
     }

     function currentPrompt() {
          const group = $('endingGroup').value;
          const tense = $('endingTense').value;
          const pronoun = $('endingPronoun').value;
          const pronounIndex = PRONOUNS.findIndex(item => item[0] === pronoun);
          return {
               group: GROUPS.find(item => item[0] === group),
               tense: TENSES.find(item => item[0] === tense),
               pronoun: PRONOUNS.find(item => item[0] === pronoun),
               answer: window.SpanishConjugate.regularEnding(group, tense, pronounIndex),
          };
     }

     function updateQuickSelects() {
          $('selectedGroupDisplay').textContent = $('endingGroup').selectedOptions[0]?.textContent || '-ar verbs';
          $('selectedTenseDisplay').textContent = $('endingTense').selectedOptions[0]?.textContent || 'Present';
          $('selectedPronounDisplay').textContent = $('endingPronoun').selectedOptions[0]?.textContent || 'yo';
     }

     function renderEndingsTable() {
          const group = $('endingGroup').value;
          const tense = $('endingTense').value;
          const selectedPronoun = $('endingPronoun').value;
          const groupLabel = $('endingGroup').selectedOptions[0]?.textContent || group;
          const tenseLabel = $('endingTense').selectedOptions[0]?.textContent || tense;
          $('endingsTableSummary').textContent = `${groupLabel} · ${tenseLabel}`;
          $('endingsTableBody').innerHTML = PRONOUNS.map(([key, label], index) => {
               const selected = key === selectedPronoun ? ' class="selected"' : '';
               const ending = window.SpanishConjugate.regularEnding(group, tense, index);
               return `<tr${selected}><th scope="row">${label}</th><td>-${ending}</td></tr>`;
          }).join('');
     }

     function renderPrompt() {
          const prompt = currentPrompt();
          $('endingPrompt').innerHTML = `<strong>${prompt.pronoun[1]}</strong><span>${prompt.group[1]}</span><small>${prompt.tense[1]} ending</small>`;
          $('endingAnswer').value = '';
          $('endingAnswer').disabled = false;
          $('endingFeedback').textContent = 'Type only the ending.';
          $('endingFeedback').className = 'conjugation-feedback';
          document.querySelectorAll('.accent-key').forEach(button => {
               button.disabled = false;
          });
          updateQuickSelects();
          renderEndingsTable();
          $('endingAnswer').focus();
     }

     function nextPrompt() {
          if ($('endingRandomGroup').checked) randomize($('endingGroup'));
          if ($('endingRandomPronoun').checked) randomize($('endingPronoun'));
          if ($('endingRandomTense').checked) randomize($('endingTense'));
          renderPrompt();
     }

     function checkAnswer(revealOnly) {
          const prompt = currentPrompt();
          const input = $('endingAnswer');
          const answer = input.value.trim();
          if (!revealOnly && !answer) {
               $('endingFeedback').textContent = '⚠️ Type an answer first.';
               $('endingFeedback').className = 'conjugation-feedback warning';
               return;
          }

          if (!revealOnly) {
               state.attempted++;
               const correct = normalize(answer) === normalize(prompt.answer);
               if (correct) state.correct++;
               $('endingFeedback').textContent = correct ? '✅ Correct!' : `❌ The correct ending is ${prompt.answer}`;
               $('endingFeedback').className = `conjugation-feedback ${correct ? 'good' : 'bad'}`;
               if (correct && ($('endingAutoAdvance').checked || $('endingRandomGroup').checked || $('endingRandomPronoun').checked || $('endingRandomTense').checked)) {
                    setTimeout(nextPrompt, 900);
               }
          } else {
               $('endingFeedback').textContent = `Answer: ${prompt.answer}`;
               $('endingFeedback').className = 'conjugation-feedback';
          }

          input.disabled = true;
          document.querySelectorAll('.accent-key').forEach(button => {
               button.disabled = true;
          });
          $('endingProgress').textContent = `${state.correct} correct / ${state.attempted} attempted`;
     }

     function openFilters(field) {
          $('filtersPanel').classList.add('open');
          $('filtersOverlay').classList.add('active');
          document.body.style.overflow = 'hidden';
          if (field) setTimeout(() => $(field).focus(), 250);
     }

     function closeFilters() {
          $('filtersPanel').classList.remove('open');
          $('filtersOverlay').classList.remove('active');
          document.body.style.overflow = '';
     }

     document.addEventListener('DOMContentLoaded', function () {
          function activateEndingsNavigation() {
               document.querySelectorAll('.page-nav a').forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === 'spanish-endings.html');
               });
               document.title = 'Spanish Tense Endings Practice';
          }
          activateEndingsNavigation();
          setTimeout(activateEndingsNavigation, 150);

          $('endingGroup').innerHTML = optionMarkup(GROUPS);
          $('endingTense').innerHTML = optionMarkup(TENSES);
          $('endingPronoun').innerHTML = optionMarkup(PRONOUNS);

          $('quickGroupBtn').onclick = () => openFilters('endingGroup');
          $('quickTenseBtn').onclick = () => openFilters('endingTense');
          $('quickPronounBtn').onclick = () => openFilters('endingPronoun');
          $('filtersPanelClose').onclick = closeFilters;
          $('filtersOverlay').onclick = closeFilters;
          document.addEventListener('keydown', event => {
               if (event.key === 'Escape') closeFilters();
          });

          ['endingGroup', 'endingTense', 'endingPronoun'].forEach(id => {
               $(id).addEventListener('change', renderPrompt);
          });
          $('newEndingBtn').onclick = renderPrompt;
          $('viewEndingsTableBtn').onclick = () => {
               renderEndingsTable();
               $('endingsTableModal').classList.add('open');
          };
          $('closeEndingsTableBtn').onclick = () => $('endingsTableModal').classList.remove('open');
          $('endingsTableModal').addEventListener('click', event => {
               if (event.target === $('endingsTableModal')) $('endingsTableModal').classList.remove('open');
          });
          document.addEventListener('keydown', event => {
               if (event.key === 'Escape') $('endingsTableModal').classList.remove('open');
          });
          $('checkEndingBtn').onclick = () => checkAnswer(false);
          $('revealEndingBtn').onclick = () => checkAnswer(true);
          $('endingAnswer').addEventListener('keydown', event => {
               if (event.key === 'Enter') checkAnswer(false);
          });
          document.querySelectorAll('.accent-key').forEach(button => {
               button.addEventListener('mousedown', event => {
                    event.preventDefault();
                    const input = $('endingAnswer');
                    const start = input.selectionStart;
                    input.value = input.value.slice(0, start) + button.dataset.char + input.value.slice(input.selectionEnd);
                    input.selectionStart = input.selectionEnd = start + button.dataset.char.length;
                    input.focus();
               });
          });

          renderPrompt();
     });
})();
