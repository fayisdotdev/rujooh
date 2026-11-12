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
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState('Ready');

  const stopProvider = useCallback(() => {
    providerRef.current?.stop?.();
  }, []);

  useEffect(() => {
    const config = {
      lang,
      onPartial,
      onFinal,
      onError: (message) => {
        setStatus('Error');
        onError?.(message);
      },
      onStateChange: (nextStatus) => {
        setStatus(nextStatus);
        onStatus?.(nextStatus);
      },
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
  }, [lang, onError, onFinal, onPartial, onStatus, provider]);

  const start = useCallback(() => {
    if (!providerRef.current) {
      onError?.('Speech recognition is not available.');
      return;
    }

    setStatus('Listening');
    providerRef.current.start();
  }, [onError]);

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
