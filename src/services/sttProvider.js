export const STT_PROVIDER_TYPES = {
  webSpeech: 'webSpeech',
  deepgram: 'deepgram',
};

export function getWebSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
}

export function createWebSpeechProvider({ lang = 'ar-SA', onPartial, onFinal, onError, onStateChange }) {
  const recognition = getWebSpeechRecognition();

  if (!recognition) {
    return {
      isSupported: false,
      start: () => {
        onError?.('Speech recognition is not supported on this browser.');
      },
      stop: () => undefined,
      pause: () => undefined,
      resume: () => undefined,
      destroy: () => undefined,
    };
  }

  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let listening = false;
  let paused = false;

  const handleResult = (event) => {
    let interimText = '';
    let finalText = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript?.trim() || '';

      if (!transcript) continue;

      if (result.isFinal) {
        finalText += `${transcript} `;
      } else {
        interimText += `${transcript} `;
      }
    }

    if (interimText.trim()) {
      onPartial?.(interimText.trim());
    }

    if (finalText.trim()) {
      onFinal?.(finalText.trim());
    }
  };

  recognition.onresult = handleResult;
  recognition.onerror = (event) => {
    if (event.error === 'no-speech') {
      onStateChange?.('Waiting for speech…');
      return;
    }

    onError?.(event.error || 'Speech recognition error');
  };

  recognition.onstart = () => {
    listening = true;
    paused = false;
    onStateChange?.('Listening');
  };

  recognition.onend = () => {
    if (!listening) {
      onStateChange?.('Stopped');
      return;
    }

    if (paused) {
      onStateChange?.('Paused');
      return;
    }

    try {
      recognition.start();
      onStateChange?.('Listening');
    } catch (error) {
      onStateChange?.('Reconnecting…');
    }
  };

  return {
    isSupported: true,
    start: () => {
      if (!listening) {
        listening = true;
        paused = false;
        try {
          recognition.start();
        } catch (error) {
          onStateChange?.('Listening');
        }
      }
    },
    stop: () => {
      listening = false;
      paused = false;
      recognition.stop();
      onStateChange?.('Stopped');
    },
    pause: () => {
      if (!listening) return;
      paused = true;
      listening = false;
      recognition.stop();
      onStateChange?.('Paused');
    },
    resume: () => {
      if (paused) {
        paused = false;
        listening = true;
        try {
          recognition.start();
        } catch (error) {
          onStateChange?.('Listening');
        }
      }
    },
    destroy: () => {
      listening = false;
      paused = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onstart = null;
      recognition.onend = null;
      recognition.stop();
    },
  };
}

export function createDeepgramProvider() {
  return {
    isSupported: true,
    start: () => {
      console.info('Deepgram streaming provider is not connected yet. Add a backend WebSocket bridge to enable it.');
    },
    stop: () => undefined,
    pause: () => undefined,
    resume: () => undefined,
    destroy: () => undefined,
  };
}
