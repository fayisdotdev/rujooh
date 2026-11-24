import React from "react";
import PrayerCard from "../components/PrayerCard.jsx";
import { fardhIds } from "../data/trackerConfig.js";
import { dailyHabits, nightPrayerHabits } from "../data/prayers.js";
import { formatTime } from "../lib/prayerTimes.js";

export default function TodayScreen({
  dateLabel,
  hijriLabel,
  hijriArabicLabel,
  schedule,
  progress,
  viewingToday,
  markAllFardhComplete,
  displayedPrayers,
  day,
  sunnahPreference,
  expandedPrayer,
  setExpandedPrayer,
  setPrayerStatus,
  toggle
}) {
  return (
    <section aria-labelledby="today-title">
      <div className="today-heading">
        <div>
          <p className="eyebrow">Your daily practice</p>
          <h1 id="today-title">{dateLabel}</h1>
          <p className="hijri-date"><span lang="en">{hijriLabel}</span>{hijriArabicLabel && <span lang="ar" dir="rtl">{hijriArabicLabel}</span>}</p>
        </div>
        <div className="today-next-prayer" aria-live="polite">
          <small>Next prayer</small>
          <strong>{schedule?.upcoming
            ? `${schedule.upcoming.name} · ${formatTime(schedule.upcoming.time)}`
            : "Allow location to calculate"}</strong>
        </div>
      </div>

      <section className="progress-panel" aria-label={`${viewingToday ? "Today's" : "Selected day's"} prayer progress`}>
        <div className="progress-overview">
          <div className="progress-copy">
            <span className="progress-kicker">Fardh prayers</span>
            <strong>{progress} <span>of 5 fulfilled</span></strong>
            <div className="progress-track" role="progressbar" aria-label="Fardh prayers fulfilled" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={5}>
              <span style={{ width: `${progress * 20}%` }} />
            </div>
          </div>
          <div className="progress-count">{String(progress).padStart(2, "0")}<small>/05</small></div>
        </div>
        <button
          className="progress-complete-button"
          type="button"
          onClick={markAllFardhComplete}
          disabled={progress === fardhIds.length}
        >
          {progress === fardhIds.length ? "All 5 Fardh fulfilled" : "Mark all 5 Fardh done"}
        </button>
      </section>

      <div className="section-title-row">
        <div><h2>Fardh prayers</h2><p>Tap a tile to cycle statuses. Use the dropdown to choose one. The arrow opens Sunnah and related habits.</p></div>
      </div>
      <section className="prayer-list" aria-label="Fardh prayers">
        {displayedPrayers.map((prayer) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            day={day}
            habit={nightPrayerHabits.find((item) => item.prayerId === prayer.id)}
            active={viewingToday && schedule?.current?.id === prayer.id}
            upcoming={viewingToday && schedule?.upcoming?.id === prayer.id}
            sunnahPreference={sunnahPreference}
            time={viewingToday
              ? (schedule?.upcoming?.id === prayer.id ? schedule.upcoming.time : schedule?.times[prayer.id])
              : null}
            expanded={expandedPrayer === prayer.id}
            onExpand={() => setExpandedPrayer((current) => current === prayer.id ? null : prayer.id)}
            onStatusChange={setPrayerStatus}
            onToggle={toggle}
          />
        ))}
      </section>

      <section className="daily-habits-section" aria-labelledby="habits-heading">
        <div className="section-title-row">
          <div><h2 id="habits-heading">Daily habits</h2><p>Optional practices, tracked separately.</p></div>
        </div>
        <div className="habit-toggle-list">
          {dailyHabits.map((habit) => (
            <button
              key={habit.id}
              type="button"
              className={`habit-toggle ${day.habits[habit.id] ? "done" : ""}`}
              aria-pressed={Boolean(day.habits[habit.id])}
              onClick={() => toggle("habits", habit.id)}
            >
              <span className="habit-check" aria-hidden="true">{day.habits[habit.id] ? "✓" : ""}</span>
              <span className="habit-copy"><strong>{habit.label}</strong><small>{habit.hint}</small></span>
              <span className="habit-state">{day.habits[habit.id] ? "Done" : "Mark done"}</span>
            </button>
          ))}
        </div>
      </section>

    </section>
  );
}
