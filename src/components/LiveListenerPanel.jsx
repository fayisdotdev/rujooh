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

export function LiveListenerPanel({ initialPrefs, onPrefsChange }) {
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_STATE, ...initialPrefs }));
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [finalizedSegments, setFinalizedSegments] = useState([]);
  const [translationSegments, setTranslationSegments] = useState([]);
  const [translationErrors, setTranslationErrors] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [translationPending, setTranslationPending] = useState(0);
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
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    onStatus: (nextStatus) => {
      const listeningState = !['Ready', 'Paused', 'Stopped', 'Error'].includes(nextStatus);
      setIsListening(listeningState);
    },
  });

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

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
    if (!isListening) return undefined;

    timerRef.current = window.setInterval(() => {
      setSessionSeconds((current) => current + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isListening]);

  useEffect(() => {
    if (!isListening) return undefined;

    let cancelled = false;

    async function startLevelMeter() {
      try {
        const stream = streamRef.current;
        if (!stream) return;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const buffer = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled || !analyserRef.current) return;
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
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isListening]);

  useEffect(() => {
    let active = true;
    const translatedIds = new Set(translationSegments.map((segment) => segment.arabic));
    const untranslated = finalizedSegments.filter((segment) => !translatedIds.has(segment));
    if (untranslated.length === 0) return undefined;

    const timer = window.setTimeout(async () => {
      setTranslationPending((count) => count + untranslated.length);
      const results = await Promise.all(untranslated.map(async (arabic) => {
        try {
          const translation = await translateText(arabic, prefs.targetLang);
          return { arabic, translation, error: '' };
        } catch (error) {
          return {
            arabic,
            translation: '',
            error: error instanceof Error ? error.message : 'Translation unavailable.',
          };
        }
      }));

      setTranslationPending((count) => Math.max(0, count - untranslated.length));
      if (!active) return;

      setTranslationSegments((previous) => [
        ...previous,
        ...results
          .filter((result) => result.translation)
          .map((result) => ({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            arabic: result.arabic,
            translation: result.translation,
            source: 'Automatic translation',
          })),
      ]);
      setTranslationErrors((previous) => [
        ...previous,
        ...results.filter((result) => result.error).map((result) => result.error),
      ]);
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [finalizedSegments, prefs.targetLang, translationSegments]);

  useEffect(() => {
    if (!panelRef.current) return;
    if (prefs.autoScroll && !scrollLocked) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [finalizedSegments, partialText, prefs.autoScroll, scrollLocked]);

  useEffect(() => {
    window.localStorage.setItem('rujooh-listener-prefs', JSON.stringify(prefs));
    onPrefsChange?.(prefs);
  }, [onPrefsChange, prefs]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(sessionSeconds / 60);
    const seconds = sessionSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [sessionSeconds]);

  const startListening = () => {
    setErrorMessage('');
    if (!speech.supported) {
      setErrorMessage('Live captions are not supported in this browser. Try a supported version of Chrome or Safari.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Microphone access requires a supported browser and a secure HTTPS connection.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        speech.start();
      })
      .catch((error) => {
        const message = error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow microphone access in browser settings and try again.'
          : error.name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : 'Microphone access could not start. Check your browser permissions and secure connection.';
        setErrorMessage(message);
      });
  };

  const pauseListening = () => {
    speech.pause();
    setIsListening(false);
    releaseMicrophone();
  };

  const resumeListening = () => {
    setErrorMessage('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Microphone access requires a supported browser and a secure HTTPS connection.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        speech.resume();
        setIsListening(true);
      })
      .catch((error) => {
        const message = error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow microphone access in browser settings and try again.'
          : error.name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : 'Microphone access could not restart. Check your browser permissions and secure connection.';
        setErrorMessage(message);
      });
  };

  const releaseMicrophone = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopListening = () => {
    speech.stop();
    setIsListening(false);
    releaseMicrophone();
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
          speech.status === 'Paused' ? (
            <button type="button" className="primary-button" onClick={resumeListening}>Resume</button>
          ) : (
          <button type="button" className="primary-button" onClick={startListening}>Start</button>
          )
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
        <strong>Privacy note:</strong> no audio is stored by this feature. Web Speech may process audio through your browser provider; check its privacy policy. A translation backend is not configured yet, so translation is unavailable.
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
          {translationErrors.length > 0 && (
            <div className="translation-warning" role="status">
              {translationErrors[translationErrors.length - 1]}
            </div>
          )}
        </div>
      </div>

      <div className="listener-footer">
        <div className="wake-lock-note">{wakeLockStatus}</div>
        <small>Web Speech is the default provider. A streaming provider adapter can be added later behind the same STT interface.</small>
      </div>
    </section>
  );
}
