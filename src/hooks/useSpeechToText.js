import { useCallback, useEffect, useRef, useState } from 'react';

import { createWebSpeechProvider, STT_PROVIDER_TYPES } from '../services/sttProvider';

export function useSpeechToText({
  provider = STT_PROVIDER_TYPES.webSpeech,
  lang = 'ar-SA',
  onPartial,
  onFinal,
  onError,
  onStatus,
}) {
  const providerRef = useRef(null);
  const callbacksRef = useRef({ onPartial, onFinal, onError, onStatus });
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState('Ready');

  useEffect(() => {
    callbacksRef.current = { onPartial, onFinal, onError, onStatus };
  }, [onError, onFinal, onPartial, onStatus]);

  const stopProvider = useCallback(() => {
    providerRef.current?.stop?.();
  }, []);

  useEffect(() => {
    const config = {
      lang,
      onError: (message) => {
        setStatus('Error');
        callbacksRef.current.onError?.(message);
      },
      onStateChange: (nextStatus) => {
        setStatus(nextStatus);
        callbacksRef.current.onStatus?.(nextStatus);
      },
      onPartial: (value) => callbacksRef.current.onPartial?.(value),
      onFinal: (value) => callbacksRef.current.onFinal?.(value),
    };

    if (provider === STT_PROVIDER_TYPES.deepgram) {
      providerRef.current = {
        start: () => undefined,
        stop: () => undefined,
        pause: () => undefined,
        resume: () => undefined,
      };
      setSupported(true);
      return undefined;
    }

    providerRef.current = createWebSpeechProvider(config);
    setSupported(providerRef.current.isSupported ?? true);

    return () => {
      providerRef.current?.destroy?.();
    };
  }, [lang, provider]);

  const start = useCallback(() => {
    if (!providerRef.current) {
      callbacksRef.current.onError?.('Speech recognition is not available.');
      return;
    }

    setStatus('Listening');
    providerRef.current.start();
  }, []);

  const pause = useCallback(() => {
    providerRef.current?.pause?.();
  }, []);

  const resume = useCallback(() => {
    providerRef.current?.resume?.();
  }, []);

  const stop = useCallback(() => {
    stopProvider();
    setStatus('Stopped');
  }, [stopProvider]);

  return { supported, status, start, stop, pause, resume };
}
