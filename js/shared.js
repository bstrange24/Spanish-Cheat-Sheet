// ===================== SHARED STATE =====================
// Only declare if not already defined
if (typeof progress === 'undefined') {
     var progress = JSON.parse(localStorage.getItem('sp_progress') || '{}');
}
if (typeof favorites === 'undefined') {
     var favorites = JSON.parse(localStorage.getItem('sp_favorites') || '[]');
}
if (typeof practiceHistory === 'undefined') {
     var practiceHistory = JSON.parse(localStorage.getItem('sp_history') || '[]');
}
// Ensure practiceHistory is always an array
if (!Array.isArray(practiceHistory)) {
     practiceHistory = [];
}
if (typeof streakData === 'undefined') {
     var streakData = JSON.parse(localStorage.getItem('sp_streak') || '{"count":0,"last":null,"today":0}');
}
if (typeof srs === 'undefined') {
     var srs = JSON.parse(localStorage.getItem('sp_srs') || '{}');
}

// ===================== SHARED DOM HELPERS =====================
const $ = id => document.getElementById(id);

// ===================== SHARED HELPERS =====================
function normalize(t) {
     return t
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[¿?¡!.,;:""''']/g, '')
          .replace(/\s+/g, ' ')
          .trim();
}

function saveAll() {
     localStorage.setItem('sp_progress', JSON.stringify(progress));
     localStorage.setItem('sp_favorites', JSON.stringify(favorites));
     localStorage.setItem('sp_history', JSON.stringify(practiceHistory));
     localStorage.setItem('sp_streak', JSON.stringify(streakData));
     localStorage.setItem('sp_srs', JSON.stringify(srs));
}

function updateStreak() {
     const today = new Date().toDateString();
     if (streakData.last !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (streakData.last === yesterday.toDateString()) {
               streakData.count++;
          } else {
               streakData.count = 1;
          }
          streakData.last = today;
          streakData.today = 0;
     }
     streakData.today++;
     const streakEl = $('streakDisplay');
     const goalEl = $('goalDisplay');
     const studyGoalEl = $('studyGoalDisplay');
     if (streakEl) streakEl.textContent = `🔥 Streak: ${streakData.count} day${streakData.count !== 1 ? 's' : ''}`;
     if (goalEl) goalEl.textContent = `Today: ${streakData.today} / 10`;
     if (studyGoalEl) studyGoalEl.textContent = `Today: ${streakData.today} / 10`;
     saveAll();
}

function closeModal(id) {
     const el = $(id);
     if (el) el.classList.remove('open');
}

// ===================== AUDIO SERVER HELPERS =====================
const synth = window.speechSynthesis;

function getAudioBaseUrl() {
     const host = window.location.hostname;
     const isLocal = host === 'localhost' || host === '127.0.0.1';
     return window.location.protocol === 'file:' || isLocal ? 'http://127.0.0.1:8765' : window.location.origin;
}

function playAudioFromServer(text, lang, callback) {
     if (!text) return;
     const baseUrl = getAudioBaseUrl();
     const langCode = lang || 'es-MX';
     const url = `${baseUrl}/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;

     if (window._currentAudio) {
          window._currentAudio.pause();
          window._currentAudio = null;
     }

     const audio = new Audio(url);
     window._currentAudio = audio;

     audio.onended = function () {
          if (callback) callback();
     };
     audio.onerror = function () {
          fallbackBrowserTTS(text, langCode);
     };
     audio.play().catch(function (err) {
          fallbackBrowserTTS(text, langCode);
     });
}

function fallbackBrowserTTS(text, langCode) {
     if (!synth) return;
     try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = langCode || 'es-MX';
          utterance.rate = 0.85;
          utterance.volume = 1;
          utterance.pitch = 1;
          synth.cancel();
          synth.speak(utterance);
     } catch (e) {
          console.warn('Fallback TTS error:', e);
     }
}

// ===================== THEME =====================
function setTheme(t) {
     document.documentElement.setAttribute('data-theme', t);
     const btn = $('themeBtn');
     if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
     localStorage.setItem('sp_theme', t);
}

// Initialize theme
const savedTheme = localStorage.getItem('sp_theme') || 'light';
setTheme(savedTheme);
if ($('themeBtn')) {
     $('themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

// ===================== TAB NAVIGATION =====================
function switchTab(tabId) {
     // Hide all panels
     document.querySelectorAll('.practice-panel').forEach(panel => {
          panel.classList.add('hidden');
          panel.classList.remove('active');
          panel.style.display = 'none';
     });

     // Show selected panel
     const panel = document.getElementById(tabId + 'Panel');
     if (panel) {
          panel.classList.remove('hidden');
          panel.classList.add('active');
          panel.style.display = 'block';
     }

     // Update nav links
     document.querySelectorAll('.page-nav a').forEach(link => {
          link.classList.remove('active');
          if (link.dataset.tab === tabId) {
               link.classList.add('active');
          }
     });

     // Update URL hash
     window.location.hash = tabId;
}

// Handle nav clicks
// Handle nav clicks
document.querySelectorAll('.page-nav a').forEach(link => {
     link.addEventListener('click', function (e) {
          // If it's a regular link (has href to another page), let it navigate normally
          const href = this.getAttribute('href');
          if (href && !href.startsWith('#')) {
               return; // Let the browser navigate
          }
          e.preventDefault();
          const tab = this.dataset.tab;
          if (tab) {
               switchTab(tab);
          }
     });
});

// Restore tab from URL hash
const hash = window.location.hash.replace('#', '');
if (hash && ['pronunciation', 'conjugation', 'study'].includes(hash)) {
     setTimeout(() => switchTab(hash), 100);
} else {
     switchTab('pronunciation');
}

console.log('✅ Shared utilities loaded');
