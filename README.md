# Rujooh Prayer Tracker

Rujooh is a personal salah tracker built with React and Vite. Prayer history, Sunnah check-ins, daily habits, and adhkar are saved in the current browser.

## Features

- Record each Fardh prayer as pending, on time, Jama', Qasr, Qadha, or missed.
- Tap a Fardh tile to cycle through Pending, Done, Jama', Qasr, Qadha, and Missed, or choose a status directly from its dropdown; mark all five from the daily progress panel.
- Choose minimum or maximum before/after Sunnah rak'ah counts in Settings.
- Use the plus control to expand a Fardh tile and mark its related Sunnah prayers done or not done.
- Track Quran recitation, Tahajjud, and Witr; Witr is grouped with Tahajjud under Night prayers.
- Track adhkar and custom prayer adhkar.
- Use the daily adhkar guide for after-prayer, Fajr/morning, Maghrib, Friday, and bedtime routines. Tap counters to track repetitions; progress is saved with each day's record. Open the source PDF from the guide for complete Quranic passages and references.
- Browse daily records by month, review completion insights and streaks, and switch between light and dark themes.
- Export a JSON backup or monthly CSV, and restore a JSON backup.

Existing single-day tracker data is migrated to the new date-based history when the app is opened. Data remains in this browser unless you export it. Restoring a backup replaces the data stored in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Location access is optional and is used only to calculate approximate prayer times on the device.
