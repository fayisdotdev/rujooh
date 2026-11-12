# Rujooh React App

This project now includes a mobile-first Live Arabic Listener alongside the Rujooh prayer tracker.

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Open the device URL shown in the terminal (for example `http://<your-local-ip>:5173/rujooh/`) on your phone while connected to the same Wi‑Fi network.

Important: microphone access requires a secure context, so use `vite --host` and a network URL rather than a plain file:// page. Safari and Chrome on iPhone/Android may require a browser permission prompt before speech capture works.

## Environment variables

Copy `.env.example` to `.env` and fill in the backend values you need. Keep real secrets only on the backend. The frontend should not contain API keys.

## Mobile testing checklist

- Start the app and switch to the Live listener tab.
- Tap Start and allow mic access.
- Confirm Arabic captions appear while you speak Arabic.
- Change English / Malayalam from the toggle and expect the translation panel to update after final segments are captured.
- Use Pause and Stop to test the controls.
- Keep the screen on to validate the Wake Lock notice behaviour.

## Browser limitations to expect

- Web Speech is the default provider and is not supported uniformly across all browsers.
- iOS Safari often needs permission on first use and may restart recognition more aggressively.
- Some devices cannot share the same microphone stream between SpeechRecognition and MediaRecorder cleanly; the app will degrade gracefully by showing the live caption state and warning in the UI.
- Wake Lock is optional and may be unavailable on some devices.
