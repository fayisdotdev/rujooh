# Rujooh Prayer Tracker

Rujooh is a personal salah tracker built with React and Vite. Prayer history, Sunnah check-ins, daily habits, and adhkar are saved in the current browser.

## Features

- Record each Fardh prayer as pending, on time, Qadha, Jama', Qasr, or missed.
- Tap a Fardh tile to cycle through Pending, Done, Qadha, Jama', Qasr, and Missed, or choose a status directly from its dropdown; mark all five from the daily progress panel.
- Choose minimum or maximum before/after Sunnah rak'ah counts in Settings.
- Use the arrow control to expand a Fardh tile and mark its related Sunnah prayers done or not done.
- Expand the Fajr card to track Tahajjud and the Isha card to track Witr; track Quran recitation under Daily habits.
- Use the daily adhkar guide for after-prayer, Fajr/morning, Maghrib, Friday, and bedtime routines. Fajr and Maghrib continue with the after-prayer adhkar below. Tap counters to track repetitions; progress is saved with each day's record. Open the source PDF from the guide for complete Quranic passages and references.
- Browse daily records by month, review completion insights and streaks, and switch between light and dark themes.
- Export a JSON backup or monthly CSV, and restore a JSON backup.

Existing single-day tracker data is migrated to the new date-based history when the app is opened. Data remains in this browser unless you export it. Restoring a backup replaces the data stored in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Location access is optional and is used only to calculate approximate prayer times on the device.

## Project structure

- `src/screens/` contains the Today, Adhkar, Month, Insights, and Settings views.
- `src/components/` contains reusable prayer and dhikr cards.
- `src/data/adhkarGuide.js` holds the adhkar routines and their text.
- `src/data/prayers.js` holds prayer and habit definitions.
- `src/data/trackerConfig.js` holds status, navigation, and storage configuration.
- `src/lib/` contains date, prayer-time, saved-data, and streak helpers.
- `src/styles/app.css` contains the app's shared styles and theme.
- `src/App.jsx` coordinates app state and connects screens to shared data.

When adding content, keep existing prayer and dhikr item IDs stable: saved progress is keyed by those IDs in browser storage.
