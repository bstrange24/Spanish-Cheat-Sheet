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
     const activePrompt = { group: 'ar', tense: 'present', pronoun: 'yo' };

     function filterMarkup(key, label, items) {
          const options = items.map(([value, text], index) => `<label class="ending-filter-option"><input type="checkbox" class="ending-filter-input" data-filter="${key}" value="${value}"${index === 0 ? ' checked' : ''} />${text}</label>`).join('');
          return `<fieldset class="ending-filter-group" data-filter-group="${key}"><legend>${label}</legend><div class="ending-filter-options"><label class="ending-filter-option ending-select-all"><input type="checkbox" class="ending-select-all-input" data-filter-select-all="${key}" />Select All</label>${options}</div></fieldset>`;
     }

     function selectedOptions(key) {
          return Array.from(document.querySelectorAll(`.ending-filter-input[data-filter="${key}"]:checked`));
     }

     function randomize(key) {
          const options = selectedOptions(key);
          if (!options.length) return '';
          const poolKey = options.map(option => option.value).join('|');
          const previous = shuffled.get(key);
          let bag = previous && previous.poolKey === poolKey ? previous.bag : null;
          if (!bag || !bag.length) {
               bag = Array.from({ length: options.length }, (_, index) => index);
               for (let index = bag.length - 1; index > 0; index--) {
                    const swap = Math.floor(Math.random() * (index + 1));
                    [bag[index], bag[swap]] = [bag[swap], bag[index]];
               }
          }
          const value = options[bag.shift()].value;
          shuffled.set(key, { poolKey: poolKey, bag: bag });
          return value;
     }

     function selectPromptValue(key, current, shouldRandomize, fallback) {
          const options = selectedOptions(key);
          const values = options.map(option => option.value);
          if (!values.length) return fallback;
          if (shouldRandomize && values.length > 1) return randomize(key);
          return values.includes(current) ? current : values[0];
     }

     function selectPromptValues(settings) {
          activePrompt.group = selectPromptValue('group', activePrompt.group, settings.group, 'ar');
          activePrompt.tense = selectPromptValue('tense', activePrompt.tense, settings.tense, 'present');
          activePrompt.pronoun = selectPromptValue('pronoun', activePrompt.pronoun, settings.pronoun, 'yo');
     }

     function currentPrompt() {
          const group = activePrompt.group;
          const tense = activePrompt.tense;
          const pronoun = activePrompt.pronoun;
          const pronounIndex = PRONOUNS.findIndex(item => item[0] === pronoun);
          return {
               group: GROUPS.find(item => item[0] === group),
               tense: TENSES.find(item => item[0] === tense),
               pronoun: PRONOUNS.find(item => item[0] === pronoun),
               answer: window.SpanishConjugate.regularEnding(group, tense, pronounIndex),
          };
     }

     function updateQuickSelects() {
          function selectedLabel(select, fallback) {
               const labels = Array.from(document.querySelectorAll(`.ending-filter-input[data-filter="${select}"]:checked`)).map(input => input.parentElement.textContent.trim());
               if (!labels.length) return fallback;
               if (labels.length <= 2) return labels.join(', ');
               return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
          }
          $('selectedGroupDisplay').textContent = selectedLabel('group', '-ar verbs');
          $('selectedTenseDisplay').textContent = selectedLabel('tense', 'Present');
          $('selectedPronounDisplay').textContent = selectedLabel('pronoun', 'yo');
     }

     function renderEndingsTable() {
          const group = activePrompt.group;
          const tense = activePrompt.tense;
          const selectedPronoun = activePrompt.pronoun;
          const groupLabel = GROUPS.find(item => item[0] === group)?.[1] || group;
          const tenseLabel = TENSES.find(item => item[0] === tense)?.[1] || tense;
          $('endingsTableSummary').textContent = `${groupLabel} · ${tenseLabel}`;
          $('endingsTableBody').innerHTML = PRONOUNS.map(([key, label], index) => {
               const selected = key === selectedPronoun ? ' class="selected"' : '';
               const ending = window.SpanishConjugate.regularEnding(group, tense, index);
               return `<tr${selected}><th scope="row">${label}</th><td>-${ending}</td></tr>`;
          }).join('');
     }

     function renderPrompt(settings) {
          selectPromptValues(settings || { group: false, tense: false, pronoun: false });
          const prompt = currentPrompt();
          const groupLabel = prompt.group[1];
          const groupSound = activePrompt.group;
          $('endingPrompt').innerHTML = `<strong>${prompt.pronoun[1]}</strong><span>${groupLabel}</span><button type="button" id="hearEndingModelBtn" style="padding: 2px 8px; font-size: 0.9rem; background: var(--accent, #3b82f6); color: white; border: none; border-radius: 4px; cursor: pointer;" aria-label="Hear ${groupLabel}" title="Hear ${groupLabel}"><i data-lucide="volume-2" aria-hidden="true"></i></button><small>(${prompt.tense[1]})</small>`;
          refreshIcons();
          $('endingAnswer').value = '';
          $('endingAnswer').disabled = false;
          $('endingFeedback').textContent = 'Type only the ending.';
          $('endingFeedback').className = 'conjugation-feedback';
          document.querySelectorAll('.accent-key').forEach(button => {
               button.disabled = false;
          });
          updateQuickSelects();
          renderEndingsTable();
          $('hearEndingModelBtn').onclick = () => playAudioFromServer(groupSound, 'es-MX');
          if (!window.matchMedia('(max-width: 620px)').matches) $('endingAnswer').focus();
     }

     function nextPrompt() {
          renderPrompt({
               group: $('endingRandomGroup').checked,
               tense: $('endingRandomTense').checked,
               pronoun: $('endingRandomPronoun').checked,
          });
     }

     function randomizeEnding() {
          renderPrompt({
               group: true,
               tense: $('endingRandomTense').checked,
               pronoun: $('endingRandomPronoun').checked,
          });
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
               if (correct) {
                    state.correct++;
                    playAudioFromServer(prompt.answer, 'es-MX');
               }
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
          const isMobile = window.matchMedia('(max-width: 620px)').matches;
          document.querySelectorAll('.conjugation-filters > div').forEach(wrapper => {
               wrapper.classList.toggle('desktop-filter-open', wrapper.id === `ending${field[0].toUpperCase()}${field.slice(1)}Filters`);
          });
          if (!isMobile) {
               const layout = document.querySelector('.mobile-conjugation-layout').getBoundingClientRect();
               const quickRow = document.querySelector('.quick-select-row').getBoundingClientRect();
               const quickButton = $({ group: 'quickGroupBtn', tense: 'quickTenseBtn', pronoun: 'quickPronounBtn' }[field]).getBoundingClientRect();
               const width = Math.max(280, quickButton.width);
               const left = Math.max(0, Math.min(quickButton.left - layout.left, layout.width - width));
               $('filtersPanel').style.setProperty('--filter-top', `${quickRow.bottom - layout.top + 8}px`);
               $('filtersPanel').style.setProperty('--filter-left', `${left}px`);
               $('filtersPanel').style.setProperty('--filter-width', `${width}px`);
          }
          $('filtersPanel').classList.add('open');
          if (isMobile) {
               $('filtersOverlay').classList.add('active');
               document.body.style.overflow = 'hidden';
          }
          if (field) {
               setTimeout(() => {
                    const target = document.querySelector(`[data-filter-group="${field}"] .ending-filter-input`);
                    if (target) target.focus({ preventScroll: !isMobile });
               }, 250);
          }
     }

     function closeFilters() {
          $('filtersPanel').classList.remove('open');
          $('filtersOverlay').classList.remove('active');
          document.querySelectorAll('.conjugation-filters > div').forEach(wrapper => wrapper.classList.remove('desktop-filter-open'));
          document.body.style.overflow = '';
     }

     function ensureFilterSelection(key) {
          const options = document.querySelectorAll(`.ending-filter-input[data-filter="${key}"]`);
          if (!Array.from(options).some(option => option.checked) && options[0]) options[0].checked = true;
     }

     function updateSelectAllState(key) {
          const options = Array.from(document.querySelectorAll(`.ending-filter-input[data-filter="${key}"]`));
          const selectAll = document.querySelector(`[data-filter-select-all="${key}"]`);
          if (!selectAll || !options.length) return;
          const selectedCount = options.filter(option => option.checked).length;
          selectAll.checked = selectedCount === options.length;
          selectAll.indeterminate = selectedCount > 0 && selectedCount < options.length;
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

          $('endingGroupFilters').innerHTML = filterMarkup('group', 'Regular verb group', GROUPS);
          $('endingTenseFilters').innerHTML = filterMarkup('tense', 'Tense', TENSES);
          $('endingPronounFilters').innerHTML = filterMarkup('pronoun', 'Pronoun', PRONOUNS);

          $('quickGroupBtn').onclick = () => openFilters('group');
          $('quickTenseBtn').onclick = () => openFilters('tense');
          $('quickPronounBtn').onclick = () => openFilters('pronoun');
          $('filtersPanelClose').onclick = closeFilters;
          $('filtersOverlay').onclick = closeFilters;
          document.addEventListener('click', event => {
               if (!event.target.closest('.filters-panel') && !event.target.closest('.quick-select-btn')) closeFilters();
          });
          document.addEventListener('keydown', event => {
               if (event.key === 'Escape') closeFilters();
          });

          document.querySelectorAll('.ending-filter-input').forEach(input => {
               input.addEventListener('change', () => {
                    ensureFilterSelection(input.dataset.filter);
                    updateSelectAllState(input.dataset.filter);
                    renderPrompt({ group: true, tense: true, pronoun: true });
               });
          });
          document.querySelectorAll('.ending-select-all-input').forEach(input => {
               input.addEventListener('change', () => {
                    document.querySelectorAll(`.ending-filter-input[data-filter="${input.dataset.filterSelectAll}"]`).forEach(option => {
                         option.checked = input.checked;
                    });
                    ensureFilterSelection(input.dataset.filterSelectAll);
                    updateSelectAllState(input.dataset.filterSelectAll);
                    renderPrompt({ group: true, tense: true, pronoun: true });
               });
          });
          ['group', 'tense', 'pronoun'].forEach(key => updateSelectAllState(key));
          $('newEndingBtn').onclick = renderPrompt;
          $('hearEndingBtn').onclick = () => playAudioFromServer(currentPrompt().answer, 'es-MX');
          $('randomEndingBtn').onclick = randomizeEnding;
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

          renderPrompt({ group: true, tense: true, pronoun: true });
     });
})();
