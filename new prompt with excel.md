You are an expert full-stack frontend engineer. Build a modern, responsive, and aesthetic Daily Prayer & Habit Tracker Web Application using React (TypeScript or modern JavaScript), Vite, and Tailwind CSS.

### 1. Project Overview & Concept

The application is a digital tracker inspired by an Islamic habit tracker spreadsheet. It tracks daily obligatory prayers (Fardh), Sunnah/Nafl prayers, and Quran recitation across the days of the month, providing seamless data entry and monthly analytics.

### 2. Tech Stack & Libraries

- **Framework:** React + Vite
- **Styling:** Tailwind CSS (with Lucide React icons)
- **State & Storage:** React useState/useReducer with persistent sync to `localStorage`
- **Charts / Visuals:** Recharts or lightweight Tailwind progress bars

### 3. Data Schema & Tracked Items

Each day in a month (1 to 28/30/31 depending on the month) should track the following 9 categories:

1. `Tahajjud` (Qiyam al-Layl)
2. `Before Fajr` (Sunnah of Fajr)
3. `Fajr` (Fardh)
4. `Dhuhr` (Fardh)
5. `Asr` (Fardh)
6. `Maghrib` (Fardh)
7. `Isha` (Fardh)
8. `Witr`
9. `Quran` (Daily reading/recitation)

#### Entry Status Values:

Each cell can hold one of these states:

- `completed` (✅ Done on time - emerald green badge)
- `qadha` (🔄 Make-up / Late prayer - amber/yellow badge)
- `missed` (❌ Missed - rose/red badge)
- `pending` (⚪ Not yet marked / placeholder)

### 4. Key Features & Functionality

#### A. Interactive Monthly Grid (Desktop / Tablet)

- Table view with fixed/sticky headers (Date, prayer names).
- Fast marking options:
  - **Single Click / Cycle:** Clicking a cell cycles through `completed` -> `qadha` -> `missed` -> `pending` (or opens a quick circular action popover with keyboard shortcuts).
  - **Batch Mark:** An option to "Mark All Fardh Completed" for today.
- Visual distinction for:
  - Today's date (highlighted row border/glow).
  - Weekend vs. weekday subtle styling.

#### B. Mobile Card / Daily View (Responsive)

- On screens smaller than `md`, offer an intuitive tabbed switch between:
  1. **"Today's Markings"**: Clean card view showing today's 9 items with large touch-friendly buttons for instant marking.
  2. **"Monthly Grid"**: Horizontally scrollable compact matrix.

#### C. Analytics & Summary Dashboard

Include an interactive summary bar or drawer displaying:

- **Daily Fardh Adherence Rate**: % of 5 obligatory prayers completed.
- **Monthly Completion Stats**: Table or cards showing total completed, missed, and qadha counts per prayer.
- **Current Streak Counter**: Current consecutive days with all 5 daily prayers prayed.
- **Quran Consistency Meter**: Number of days Quran was recited out of the elapsed days.

#### D. Month & Data Management

- Month/Year selector header (e.g., `< November 2026 >`).
- Automatic calculation of days in the selected month.
- **Export & Import**: Export data to JSON/CSV and Import from JSON.
- **Reset / Sample Data**: A button to load sample data (matching 10 days of tracking) or clear month.

### 5. UI / Aesthetic Requirements

- **Theme:** Clean Islamic-inspired emerald palette:
  - Deep slate/emerald dark mode & crisp white/mint light mode.
  - Subtle borders, smooth transitions (`transition-all duration-200`), and rounded card corners (`rounded-xl`).
- High accessibility: clear contrast ratios and tooltip descriptions on hover.

### 6. Deliverables

1. Step-by-step setup instructions (`npm create vite@latest`, dependencies installation, Tailwind config).
2. Clean, modular component code:
   - `App.jsx` / `App.tsx` (Core state and month navigation)
   - `components/MonthlyGrid.jsx` (Main spreadsheet-style matrix)
   - `components/TodayView.jsx` (Mobile-first daily tracker cards)
   - `components/StatsSummary.jsx` (KPI cards and progress indicators)
   - `utils/storage.js` (LocalStorage helpers and initial sample data)
