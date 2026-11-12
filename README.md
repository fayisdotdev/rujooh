# Rujooh React App

This project now includes a mobile-first Live Arabic Listener alongside the Rujooh prayer tracker.

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173/rujooh/` on the computer running Vite for a UI check. For phone microphone testing, open the Vite app through an HTTPS development tunnel or an HTTPS deployment.

Important: microphone access requires a secure context. `http://localhost` works only on the same device running Vite; an `http://<your-local-ip>` network URL is not secure and will not expose microphone access on most phones. Use an HTTPS development tunnel or an HTTPS deployment to test on a phone. Safari and Chrome on iPhone/Android may require a browser permission prompt before speech capture works.

## Environment variables

Copy `.env.example` to `.env` and fill in the backend values you need. Keep real secrets only on the backend. The frontend should not contain API keys.

## Mobile testing checklist

- Start the app and switch to the Live listener tab.
- Tap Start and allow mic access.
- Confirm Arabic captions appear while you speak Arabic.
- Change English / Malayalam from the toggle. Translation is not active until a backend translation proxy is configured.
- Use Pause and Stop to test the controls.
- Keep the screen on to validate the Wake Lock notice behaviour.

## Browser limitations to expect

- Web Speech is the default provider and is not supported uniformly across all browsers.
- Web Speech recognition may process audio through the browser vendor's service; review that vendor's privacy policy. This app does not save audio in this stage.
- iOS Safari often needs permission on first use and may restart recognition more aggressively.
- Some devices cannot share the same microphone stream between SpeechRecognition and MediaRecorder cleanly; the app will degrade gracefully by showing the live caption state and warning in the UI.
- Wake Lock is optional and may be unavailable on some devices.
