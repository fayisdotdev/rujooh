import { useEffect, useMemo, useRef, useState } from 'react';

import { useSpeechToText } from '../hooks/useSpeechToText';
import { useWakeLock } from '../hooks/useWakeLock';
import { getTranslationServiceStatus, translateText } from '../services/translateService';

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
  const [audioLevelStatus, setAudioLevelStatus] = useState('Microphone is off');
  const [scrollLocked, setScrollLocked] = useState(false);
  const [translationPending, setTranslationPending] = useState(0);
  const [translationServiceStatus, setTranslationServiceStatus] = useState('Checking translation service…');
  const panelRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(0);

  const wakeLockStatus = useWakeLock(isListening);

  const speech = useSpeechToText({
    lang: 'ar-SA',
    onPartial: (value) => {
      setPartialText(value);
    },
    onFinal: (value) => {
      const sentence = value.replace(/\s+/g, ' ').trim();
      if (!sentence) return;
      setFinalizedSegments((previous) => [
        ...previous,
        { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: sentence },
      ]);
      setPartialText('');
    },
    onError: (message) => {
      setErrorMessage(message || 'Speech recognition could not start.');
      setIsListening(false);
      releaseMicrophone();
    },
    onStatus: (nextStatus) => {
      const listeningState = !['Ready', 'Paused', 'Stopped', 'Error'].includes(nextStatus);
      setIsListening(listeningState);
    },
  });

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;

    getTranslationServiceStatus()
      .then((status) => {
        if (!active) return;
        setTranslationServiceStatus(status.configured
          ? 'Translation service ready'
          : 'Translation needs setup: add ANTHROPIC_API_KEY to the backend .env file.');
      })
      .catch((error) => {
        if (active) {
          setTranslationServiceStatus(error instanceof Error ? error.message : 'Translation service is unavailable.');
        }
      });

    return () => {
      active = false;
    };
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
    let active = true;
    const translatedKeys = new Set(translationSegments.map((segment) => `${segment.segmentId}:${segment.targetLang}`));
    const failedKeys = new Set(translationErrors.map((segment) => `${segment.segmentId}:${segment.targetLang}`));
    const untranslated = finalizedSegments.filter((segment) => {
      const key = `${segment.id}:${prefs.targetLang}`;
      return !translatedKeys.has(key) && !failedKeys.has(key);
    });
    if (untranslated.length === 0) return undefined;

    const timer = window.setTimeout(async () => {
      setTranslationPending((count) => count + untranslated.length);
      const results = await Promise.all(untranslated.map(async (segment) => {
        try {
          const translation = await translateText(segment.text, prefs.targetLang);
          return { segment, translation, error: '' };
        } catch (error) {
          return {
            segment,
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
          .map(({ segment, translation }) => ({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            segmentId: segment.id,
            arabic: segment.text,
            targetLang: prefs.targetLang,
            translation,
            source: 'Automatic translation',
          })),
      ]);
      setTranslationErrors((previous) => [
        ...previous,
        ...results
          .filter((result) => result.error)
          .map(({ segment, error }) => ({
            segmentId: segment.id,
            targetLang: prefs.targetLang,
            message: error,
          })),
      ]);
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [finalizedSegments, prefs.targetLang, translationErrors, translationSegments]);

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
  const autoScrollPaused = !prefs.autoScroll || scrollLocked;

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

    const audioContext = createAudioContext();
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        startAudioMeter(stream, audioContext);
        speech.start();
      })
      .catch((error) => {
        audioContext?.close().catch(() => undefined);
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

    const audioContext = createAudioContext();
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        startAudioMeter(stream, audioContext);
        speech.resume();
        setIsListening(true);
      })
      .catch((error) => {
        audioContext?.close().catch(() => undefined);
        const message = error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow microphone access in browser settings and try again.'
          : error.name === 'NotFoundError'
            ? 'No microphone was found on this device.'
            : 'Microphone access could not restart. Check your browser permissions and secure connection.';
        setErrorMessage(message);
      });
  };

  const releaseMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setAudioLevelStatus('Microphone is off');
  };

  function createAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setAudioLevelStatus('Level meter is not supported on this browser');
      return null;
    }

    try {
      const context = new AudioContext();
      audioContextRef.current = context;
      context.resume().catch(() => {
        setAudioLevelStatus('Tap Start again to enable the microphone level meter');
      });
      return context;
    } catch (error) {
      setAudioLevelStatus('Microphone level meter is unavailable');
      return null;
    }
  }

  function startAudioMeter(stream, audioContext) {
    if (!audioContext) return;

    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          setAudioLevelStatus('Tap Start again to enable the microphone level meter');
        });
      }

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const mutedOutput = audioContext.createGain();
      analyser.fftSize = 512;
      source.connect(analyser);
      mutedOutput.gain.value = 0;
      analyser.connect(mutedOutput);
      mutedOutput.connect(audioContext.destination);
      analyserRef.current = analyser;

      const samples = new Uint8Array(analyser.fftSize);
      let lastPaint = 0;
      const startedAt = performance.now();
      let lastSignalAt = startedAt;
      let meterStatus = 'Listening for microphone input';
      let smoothedLevel = 0;
      setAudioLevelStatus('Listening for microphone input');

      const tick = (timestamp) => {
        if (audioContextRef.current !== audioContext || !analyserRef.current) return;

        analyser.getByteTimeDomainData(samples);
        let energy = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          energy += normalized * normalized;
        }

        const rms = Math.sqrt(energy / samples.length);
        const measuredLevel = Math.max(0, Math.min(100, Math.round((rms - 0.008) * 650)));
        if (measuredLevel >= 4) lastSignalAt = timestamp;
        smoothedLevel = smoothedLevel * 0.72 + measuredLevel * 0.28;

        if (timestamp - lastPaint >= 80) {
          setAudioLevel(Math.round(smoothedLevel));
          const nextMeterStatus = timestamp - lastSignalAt < 700
            ? 'Microphone signal detected'
            : timestamp - startedAt > 1600
              ? 'No mic signal — check permissions'
              : 'Listening for microphone input';
          if (nextMeterStatus !== meterStatus) {
            meterStatus = nextMeterStatus;
            setAudioLevelStatus(nextMeterStatus);
          }
          lastPaint = timestamp;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    } catch (error) {
      setAudioLevelStatus('Microphone level meter could not start');
      console.error('Could not start microphone level meter:', error);
    }
  }

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
              aria-pressed={prefs.mode === mode.id}
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
            aria-pressed={prefs.targetLang === 'en'}
            onClick={() => setPrefs((previous) => ({ ...previous, targetLang: 'en' }))}
          >
            English
          </button>
          <button
            type="button"
            className={prefs.targetLang === 'ml' ? 'active' : ''}
            aria-pressed={prefs.targetLang === 'ml'}
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
          <div className="meter-track" role="meter" aria-label="Microphone input level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={audioLevel}>
            <span style={{ width: `${audioLevel}%` }} />
          </div>
          <small>{audioLevel}% · {audioLevelStatus}</small>
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

        <button type="button" className="ghost-button control-wide" onClick={stopListening}>Stop</button>
        <button
          type="button"
          className="ghost-button control-wide"
          aria-pressed={!autoScrollPaused}
          onClick={() => {
            if (autoScrollPaused) {
              setPrefs((previous) => ({ ...previous, autoScroll: true }));
              setScrollLocked(false);
            } else {
              setPrefs((previous) => ({ ...previous, autoScroll: false }));
            }
          }}
        >
          {autoScrollPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
        </button>
        <button
          type="button"
          className="ghost-button font-control"
          aria-label="Increase caption text size"
          onClick={() => setPrefs((previous) => ({ ...previous, fontScale: Math.min(1.5, Number((previous.fontScale + 0.1).toFixed(1))) }))}
        >
          A+
        </button>
        <button
          type="button"
          className="ghost-button font-control"
          aria-label="Decrease caption text size"
          onClick={() => setPrefs((previous) => ({ ...previous, fontScale: Math.max(0.9, Number((previous.fontScale - 0.1).toFixed(1))) }))}
        >
          A-
        </button>
      </div>

      <div className="privacy-note">
        <strong>Privacy note:</strong> no audio is stored by this feature. Web Speech may process it through your browser provider; check that provider’s privacy policy. Only finalized text is sent to the translation service.
      </div>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <div className="caption-panel" ref={panelRef}>
        <div className="caption-block arabic-block" style={{ fontSize: `${prefs.fontScale}rem` }} dir="rtl">
          <p className="caption-label">Arabic</p>
          <div className="caption-text" lang="ar" dir="rtl">
            {finalizedSegments.length > 0
              ? finalizedSegments.map((segment) => segment.text).join(' ')
              : 'اضغط ابدأ للاستماع إلى الكلام العربي'}
          </div>
          {partialText && <div className="partial-text" lang="ar" dir="rtl">{partialText}</div>}
        </div>

        <div className="caption-block translation-block" style={{ fontSize: `${Math.max(0.95, prefs.fontScale * 0.92)}rem` }}>
          <p className="caption-label">Translation</p>
          <p className="translation-service-status" role="status">{translationServiceStatus}</p>
          <div className="translation-text">
            {translationSegments.some((segment) => segment.targetLang === prefs.targetLang)
              ? translationSegments
                .filter((segment) => segment.targetLang === prefs.targetLang)
                .map((segment) => (
                  <div key={segment.id} className="translation-item">
                    <strong>{segment.source}</strong>
                    <p>{segment.translation}</p>
                  </div>
                ))
              : 'Automatic translation will appear here as speech is finalized.'}
          </div>
          {translationPending && <small className="translation-pending">Translating final segment…</small>}
          {translationErrors
            .filter((item) => item.targetLang === prefs.targetLang)
            .map((item) => (
              <div className="translation-warning" role="status" key={`${item.segmentId}:${item.targetLang}`}>
                <span>{item.message}</span>
                <button type="button" onClick={() => setTranslationErrors((previous) => previous.filter((error) => error !== item))}>
                  Retry translation
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className="listener-footer">
        <div className="wake-lock-note">{wakeLockStatus}</div>
        <small>Web Speech is the default provider. A streaming provider adapter can be added later behind the same STT interface.</small>
      </div>
    </section>
  );
}
