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

    // Show a prompt and wait for a click — satisfies browser gesture requirement for both
    // AudioContext and speechSynthesis before the boot sequence starts
    var prompt = document.createElement('div');
    prompt.textContent = 'CLICK TO INITIALIZE';
    prompt.style.cssText = 'position:absolute;bottom:32px;left:50%;transform:translateX(-50%);font-family:monospace;font-size:12px;letter-spacing:.2em;color:#444;animation:blink 1.2s step-end infinite';
    overlay.appendChild(prompt);

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

      var lines = [
        'Suddenly the champion returns, with initiative and vengeance.',
        'Good ' + timeOfDay + ', sir.',
        'You can be anything you want to be, if you can see it, and you believe it, it will happen.',
      ];

      function speak(voices) {
        var voice = voices.find(function (v) { return v.name === 'Microsoft James - English (Australia)'; })
                 || voices.find(function (v) { return v.lang === 'en-GB'; })
                 || voices.find(function (v) { return v.lang.startsWith('en'); })
                 || null;

        lines.forEach(function (text) {
          var msg = new SpeechSynthesisUtterance(text);
          msg.pitch = 1.0;
          msg.rate  = 0.9;
          msg.lang  = 'en-AU';
          if (voice) msg.voice = voice;
          try { speechSynthesis.speak(msg); } catch {}
        });
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

    overlay.addEventListener('click', function () {
      prompt.remove();
      if (window.Sounds) Sounds._initCtx();
      runSequence();
    }, { once: true });
  });
})();
