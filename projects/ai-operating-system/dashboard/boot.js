/* ============================================================
   BOOT.JS — Cinematic boot screen + Alfred voice greeting
   Fires once per browser session (sessionStorage guard).
   ============================================================ */

(function () {
  if (sessionStorage.getItem('jamesOS_booted')) return;
  sessionStorage.setItem('jamesOS_booted', '1');

  const LINES = [
    { text: 'INITIALIZING EXECUTIVE SYSTEMS...' },
    { text: 'LOADING MISSION PARAMETERS...' },
    { text: 'CALIBRATING NEURAL INTERFACES...' },
    { text: 'BIOMETRIC VERIFICATION: PASS' },
    { text: 'ACCESS GRANTED', isGranted: true },
  ];

  const CHAR_MS = 28;

  document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('boot-overlay');
    const linesEl = document.getElementById('boot-lines');
    const cursor  = document.querySelector('.boot-cursor');

    if (!overlay) return;

    // Prime AudioContext on any click (user gesture requirement)
    overlay.addEventListener('click', function () {
      if (window.Sounds) Sounds._initCtx();
    }, { once: true });

    var lineIdx = 0;

    function typeLine(lineConfig, onComplete) {
      var div = document.createElement('div');
      div.className = 'boot-line' + (lineConfig.isGranted ? ' boot-line--granted' : '');
      linesEl.appendChild(div);
      linesEl.appendChild(cursor);

      var charIdx = 0;
      var text = lineConfig.text;

      function typeChar() {
        if (charIdx < text.length) {
          div.textContent += text[charIdx++];
          setTimeout(typeChar, CHAR_MS);
        } else {
          setTimeout(onComplete, 300);
        }
      }
      typeChar();
    }

    function runSequence() {
      if (lineIdx >= LINES.length) return;
      var line = LINES[lineIdx++];
      typeLine(line, function () {
        if (line.isGranted) {
          if (window.Sounds) { try { Sounds.playAccessGranted(); } catch {} }
          setTimeout(dismissOverlay, 600);
        } else {
          runSequence();
        }
      });
    }

    function dismissOverlay() {
      overlay.style.opacity = '0';
      setTimeout(alfredGreeting, 200);
      overlay.addEventListener('transitionend', function () {
        overlay.remove();
      }, { once: true });
    }

    function alfredGreeting() {
      if (!window.speechSynthesis) return;

      var hour = new Date().getHours();
      var timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      var msg = new SpeechSynthesisUtterance('Good ' + timeOfDay + ', sir.');
      msg.pitch = 0.85;
      msg.rate  = 0.9;
      msg.lang  = 'en-GB';

      function speak(voices) {
        var ukMale = voices.find(function (v) {
          return v.lang === 'en-GB' && /george|david|richard|male/i.test(v.name);
        });
        var ukAny  = voices.find(function (v) { return v.lang === 'en-GB'; });
        var enAny  = voices.find(function (v) { return v.lang.startsWith('en'); });
        var voice  = ukMale || ukAny || enAny || null;
        if (voice) msg.voice = voice;
        try { speechSynthesis.speak(msg); } catch {}
      }

      var voices = speechSynthesis.getVoices();
      if (voices.length) {
        speak(voices);
      } else {
        speechSynthesis.addEventListener('voiceschanged', function () {
          speak(speechSynthesis.getVoices());
        }, { once: true });
      }
    }

    runSequence();
  });
})();
