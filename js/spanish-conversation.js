// ===================== SPANISH CONVERSATION TUTOR =====================
(function () {
     const chatLog = $('chatLog');
     const chatInput = $('chatInput');
     const sendBtn = $('sendBtn');
     const micBtn = $('micBtn');
     const chatStatus = $('chatStatus');
     const chatLang = $('chatLang');
     const resetChatBtn = $('resetChatBtn');

     const STORAGE_KEY = 'sp_conversation_history';
     let history = loadHistory();
     let busy = false;

     function loadHistory() {
          try {
               const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
               return Array.isArray(saved) ? saved : [];
          } catch (err) {
               return [];
          }
     }

     function saveHistory() {
          try {
               localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
          } catch (err) {}
     }

     function addMessage(role, text) {
          const div = document.createElement('div');
          div.className = 'chat-msg ' + role;

          const textSpan = document.createElement('span');
          textSpan.className = 'chat-msg-text';
          textSpan.textContent = text;
          div.appendChild(textSpan);

          if (role === 'assistant') {
               const replayBtn = document.createElement('button');
               replayBtn.type = 'button';
               replayBtn.className = 'replay-btn';
               replayBtn.title = 'Listen again';
               replayBtn.setAttribute('aria-label', 'Listen to this reply again');
               replayBtn.innerHTML = '<i data-lucide="volume-2" aria-hidden="true"></i>';
               refreshIcons();
               replayBtn.addEventListener('click', function () {
                    const lang = chatLang ? chatLang.value : 'es-419';
                    setStatus('Speaking…');
                    playAudioFromServer(text, lang, function () {
                         setStatus('Ready');
                    });
               });
               div.appendChild(replayBtn);
          }

          chatLog.appendChild(div);
          chatLog.scrollTop = chatLog.scrollHeight;
          return div;
     }

     function renderIntro() {
          addMessage('system', 'Say hola or type a message to start chatting in Spanish.');
     }

     function renderHistory() {
          chatLog.innerHTML = '';
          if (!history.length) {
               renderIntro();
               return;
          }
          history.forEach(function (turn) {
               if (turn && (turn.role === 'user' || turn.role === 'assistant')) {
                    addMessage(turn.role, turn.content);
               }
          });
     }

     function resetConversation() {
          history = [];
          saveHistory();
          renderHistory();
          setStatus('Ready');
     }

     if (resetChatBtn) resetChatBtn.addEventListener('click', resetConversation);

     function setStatus(text) {
          if (chatStatus) chatStatus.textContent = text;
     }

     function setBusy(isBusy) {
          busy = isBusy;
          sendBtn.disabled = isBusy;
          chatInput.disabled = isBusy;
          micBtn.disabled = isBusy;
     }

     async function sendMessage(text) {
          const message = (text || '').trim();
          if (!message || busy) return;

          addMessage('user', message);
          chatInput.value = '';
          setBusy(true);
          setStatus('Tutor is thinking…');

          try {
               const baseUrl = getAudioBaseUrl();
               const resp = await fetch(baseUrl + '/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message, history: history }),
               });
               const data = await resp.json().catch(() => ({}));

               if (!resp.ok || data.error) {
                    addMessage('error', data.error || 'The tutor is unavailable right now.');
                    setStatus('Error');
                    return;
               }

               const reply = data.reply || '';
               history.push({ role: 'user', content: message });
               history.push({ role: 'assistant', content: reply });
               // Keep the transcript from growing without bound
               if (history.length > 24) history = history.slice(-24);
               saveHistory();

               addMessage('assistant', reply);
               setStatus('Speaking…');
               const lang = chatLang ? chatLang.value : 'es-419';
               playAudioFromServer(reply, lang, function () {
                    setStatus('Ready');
               });
          } catch (err) {
               addMessage('error', 'Could not reach the tutor. Check your connection and try again.');
               setStatus('Error');
          } finally {
               setBusy(false);
          }
     }

     sendBtn.addEventListener('click', function () {
          sendMessage(chatInput.value);
     });

     chatInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') sendMessage(chatInput.value);
     });

     // ===================== SPEECH-TO-TEXT (mic) =====================
     const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
     let recognition = null;
     let listening = false;

     if (SpeechRecognitionCtor) {
          recognition = new SpeechRecognitionCtor();
          recognition.lang = 'es-ES';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = function (event) {
               const transcript = event.results[0][0].transcript;
               chatInput.value = transcript;
               sendMessage(transcript);
          };

          recognition.onerror = function () {
               setStatus('Could not hear you, try again');
               listening = false;
               micBtn.classList.remove('listening');
          };

          recognition.onend = function () {
               listening = false;
               micBtn.classList.remove('listening');
          };

          micBtn.addEventListener('click', function () {
               if (busy) return;
               if (listening) {
                    recognition.stop();
                    return;
               }
               listening = true;
               micBtn.classList.add('listening');
               setStatus('Listening…');
               try {
                    recognition.start();
               } catch (err) {
                    listening = false;
                    micBtn.classList.remove('listening');
               }
          });
     } else {
          micBtn.disabled = true;
          micBtn.title = 'Voice input not supported in this browser — type instead';
     }

     renderHistory();
})();
