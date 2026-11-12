import { useEffect, useMemo, useRef, useState } from 'react';

import { useSpeechToText } from '../hooks/useSpeechToText';
import { useWakeLock } from '../hooks/useWakeLock';
import { translateText } from '../services/translateService';

const MODES = [
  { id: 'khutba', label: 'Friday Khutba' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'quran', label: 'Quran recitation' },
];

const DEFAULT_STATE = {
  mode: 'khutba',
  targetLang: 'en',
  fontScale: 1,
  autoScroll: true,
};

function getSessionLabel(prefix, mode) {
  const map = {
    khutba: 'Khutba',
    prayer: 'Prayer',
    quran: 'Quran',
  };

  return `${prefix} · ${map[mode] || mode}`;
}

export function LiveListenerPanel({ initialPrefs }) {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_STATE, ...initialPrefs }));
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [finalizedSegments, setFinalizedSegments] = useState([]);
  const [translationSegments, setTranslationSegments] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [translationPending, setTranslationPending] = useState(false);
  const panelRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const wakeLockStatus = useWakeLock(isListening);

  const speech = useSpeechToText({
    lang: 'ar-SA',
    onPartial: (value) => {
      setPartialText(value);
    },
    onFinal: (value) => {
      const sentence = value.replace(/\s+/g, ' ').trim();
      if (!sentence) return;
      setFinalizedSegments((previous) => [...previous, sentence]);
      setPartialText('');
    },
    onError: (message) => {
      setErrorMessage(message || 'Speech recognition could not start.');
      setIsListening(false);
      setIsPaused(false);
    },
    onStatus: (nextStatus) => {
      const listeningState = nextStatus === 'Listening';
      setIsListening(listeningState);
      setIsPaused(nextStatus === 'Paused');
    },
  });

  useEffect(() => {
    if (!panelRef.current) return undefined;

    const panel = panelRef.current;
    const handleScroll = () => {
      const atBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 12;
      setScrollLocked(!atBottom);
    };

    panel.addEventListener('scroll', handleScroll);
    return () => panel.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isListening || isPaused) return undefined;

    timerRef.current = window.setInterval(() => {
      setSessionSeconds((current) => current + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isListening, isPaused]);

  useEffect(() => {
    if (!isListening || isPaused) return undefined;

    let cancelled = false;

    async function startLevelMeter() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const buffer = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (!cancelled || !analyserRef.current) return;
          analyser.getByteFrequencyData(buffer);
          const average = buffer.reduce((total, value) => total + value, 0) / buffer.length;
          setAudioLevel(Math.min(100, Math.round((average / 255) * 100)));
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      } catch (error) {
        console.warn('Microphone level meter could not start.', error);
      }
    }

    startLevelMeter();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isListening, isPaused]);

  useEffect(() => {
    if (finalizedSegments.length === 0) return;

    const latest = finalizedSegments[finalizedSegments.length - 1];
    setTranslationPending(true);

    translateText(latest, prefs.targetLang)
      .then((translatedText) => {
        setTranslationSegments((previous) => {
          const next = [...previous];
          const item = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            arabic: latest,
            translation: translatedText,
            source: 'Automatic translation',
          };
          next.push(item);
          return next;
        });
      })
      .catch(() => {
        setTranslationSegments((previous) => [
          ...previous,
          { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, arabic: latest, translation: 'Translation unavailable.', source: 'Automatic translation' },
        ]);
      })
      .finally(() => {
        setTranslationPending(false);
      });
  }, [finalizedSegments, prefs.targetLang]);

  useEffect(() => {
    if (!panelRef.current) return;
    if (prefs.autoScroll && !scrollLocked) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [finalizedSegments, partialText, prefs.autoScroll, scrollLocked]);

  useEffect(() => {
    window.localStorage.setItem('rujooh-listener-prefs', JSON.stringify(prefs));
  }, [prefs]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(sessionSeconds / 60);
    const seconds = sessionSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [sessionSeconds]);

  const startListening = () => {
    setErrorMessage('');
    speech.start();
  };

  const pauseListening = () => {
    speech.pause();
  };

  const stopListening = () => {
    speech.stop();
    setIsListening(false);
    setIsPaused(false);
  };

  return (
    <section className="listener-shell" aria-label="Live Arabic listener">
      <div className="listener-header">
        <div>
          <p className="eyebrow subtle">Live Arabic Listener</p>
          <h2>Listen, caption, and translate</h2>
        </div>
        <span className="badge badge-soft">{getSessionLabel('Session', prefs.mode)}</span>
      </div>

      <div className="listener-toolbar">
        <div className="segmented-control" aria-label="Mode selector">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={prefs.mode === mode.id ? 'active' : ''}
              onClick={() => setPrefs((previous) => ({ ...previous, mode: mode.id }))}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="language-toggle" aria-label="Translation language selector">
          <button
            type="button"
            className={prefs.targetLang === 'en' ? 'active' : ''}
            onClick={() => setPrefs((previous) => ({ ...previous, targetLang: 'en' }))}
          >
            English
          </button>
          <button
            type="button"
            className={prefs.targetLang === 'ml' ? 'active' : ''}
            onClick={() => setPrefs((previous) => ({ ...previous, targetLang: 'ml' }))}
          >
            Malayalam
          </button>
        </div>
      </div>

      <div className="session-meta">
        <div className="time-box">
          <span className="meta-label">Timer</span>
          <strong>{formattedTime}</strong>
        </div>

        <div className="level-box" aria-label="Microphone level meter">
          <div className="meter-track">
            <span style={{ width: `${audioLevel}%` }} />
          </div>
          <small>{audioLevel}%</small>
        </div>

        <div className="status-box">
          <span className="meta-label">Status</span>
          <strong>{speech.status}</strong>
        </div>
      </div>

      <div className="listener-controls">
        {!isListening ? (
          <button type="button" className="primary-button" onClick={startListening}>Start</button>
        ) : (
          <button type="button" className="secondary-button" onClick={pauseListening}>Pause</button>
        )}

        <button type="button" className="ghost-button" onClick={stopListening}>Stop</button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPrefs((previous) => ({ ...previous, autoScroll: !previous.autoScroll }))}
        >
          {prefs.autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPrefs((previous) => ({ ...previous, fontScale: Math.min(1.5, Number((previous.fontScale + 0.1).toFixed(1))) }))}
        >
          A+
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPrefs((previous) => ({ ...previous, fontScale: Math.max(0.9, Number((previous.fontScale - 0.1).toFixed(1))) }))}
        >
          A-
        </button>
      </div>

      <div className="privacy-note">
        <strong>Privacy note:</strong> audio stays on your device, and only text snippets are sent to the translation backend when enabled.
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <div className="caption-panel" ref={panelRef}>
        <div className="caption-block arabic-block" style={{ fontSize: `${prefs.fontScale}rem` }} dir="rtl">
          <p className="caption-label">Arabic</p>
          <div className="caption-text" lang="ar" dir="rtl">
            {finalizedSegments.length > 0 ? finalizedSegments.join(' ') : 'اضغط ابدأ للاستماع إلى الكلام العربي'}
          </div>
          {partialText && <div className="partial-text" lang="ar" dir="rtl">{partialText}</div>}
        </div>

        <div className="caption-block translation-block" style={{ fontSize: `${Math.max(0.95, prefs.fontScale * 0.92)}rem` }}>
          <p className="caption-label">Translation</p>
          <div className="translation-text">
            {translationSegments.length > 0
              ? translationSegments.map((segment) => (
                  <div key={segment.id} className="translation-item">
                    <strong>{segment.source}</strong>
                    <p>{segment.translation}</p>
                  </div>
                ))
              : 'Automatic translation appears here as speech is finalized.'}
          </div>
          {translationPending && <small className="translation-pending">Translating final segment…</small>}
        </div>
      </div>

      <div className="listener-footer">
        <div className="wake-lock-note">{wakeLockStatus}</div>
        <small>Web Speech is the default provider. A streaming provider adapter can be added later behind the same STT interface.</small>
      </div>
    </section>
  );
}
