import React from "react";
import { statusLabels, statusOptions } from "../data/trackerConfig.js";
import { formatTime } from "../lib/prayerTimes.js";
import { isFulfilled } from "../lib/trackerState.js";

export default function PrayerCard({ prayer, day, habit, expanded, active, upcoming, time, sunnahPreference, onExpand, onStatusChange, onToggle }) {
  const sunnahItems = prayer.sunnah.filter((item) => item[sunnahPreference] > 0);
  const selectedSunnahCount = prayer.sunnah.reduce((total, item) => total + item[sunnahPreference], 0);
  const currentStatus = day.fardh[prayer.id] || "pending";
  const completed = isFulfilled(currentStatus);
  function cycleStatus() {
    const currentIndex = statusOptions.findIndex((option) => option.id === currentStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    onStatusChange(prayer.id, statusOptions[nextIndex].id);
  }

  return (
    <article className={`prayer-card ${expanded ? "is-expanded" : ""}`}>
      <div
        className="prayer-card-header"
        onClick={cycleStatus}
      >
        <button
          className={`prayer-disclosure ${completed ? "completed" : ""}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            cycleStatus();
          }}
          aria-label={`Cycle ${prayer.name} status. Current: ${statusLabels[currentStatus]}`}
        >
          <span className="prayer-symbol" aria-hidden="true">{completed ? "✓" : prayer.name.slice(0, 1)}</span>
          <span className="prayer-name">
            <strong>{prayer.name}</strong>
            <span className="prayer-meta">
              <small lang="ar" dir="rtl">{prayer.arabic}</small>
              {time && <small className="prayer-time">{formatTime(time)}</small>}
              {active && <small className="prayer-period">Current period</small>}
              {upcoming && <small className="prayer-period">Up next</small>}
              <small className="prayer-sunnah-summary">{selectedSunnahCount} rak'ah Sunnah</small>
            </span>
          </span>
        </button>
        <label className="status-select-label" onClick={(event) => event.stopPropagation()}>
          <span className="visually-hidden">{prayer.name} prayer status</span>
          <select
            className={`status-select status-${currentStatus}`}
            value={currentStatus}
            onChange={(event) => onStatusChange(prayer.id, event.target.value)}
          >
            {statusOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <button
          className="expand-prayer-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onExpand();
          }}
          aria-expanded={expanded}
          aria-controls={`details-${prayer.id}`}
          aria-label={`${expanded ? "Hide" : "Show"} ${prayer.name} Sunnah prayers`}
        >
          <span className={`expand-prayer-chevron ${expanded ? "open" : ""}`} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <div className="prayer-details" id={`details-${prayer.id}`}>
          <div className="subsection-title">
            <span>Sunnah prayers</span>
            <span>{sunnahPreference === "minimum" ? "Minimum set" : "Maximum set"}</span>
          </div>
          {sunnahItems.length > 0 ? (
            <div className="sunnah-list">
              {sunnahItems.map((item) => {
                const done = Boolean(day.sunnah[item.id]);
                return (
                  <button
                    type="button"
                    className={`sunnah-item ${done ? "done" : ""}`}
                    key={item.id}
                    aria-pressed={done}
                    onClick={() => onToggle("sunnah", item.id)}
                  >
                    <span className="small-check" aria-hidden="true">{done ? "✓" : ""}</span>
                    <span>{item.position === "before" ? "Before" : "After"} {prayer.name} · {item[sunnahPreference]} rak'ah</span>
                    <span className="sunnah-state">{done ? "Done" : "Not done"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="empty-sunnah">No Sunnah entries to track for {prayer.name} in the minimum set.</p>
          )}
          {habit && (
            <button
              className={`prayer-linked-habit ${day.habits[habit.id] ? "done" : ""}`}
              type="button"
              aria-pressed={Boolean(day.habits[habit.id])}
              onClick={() => onToggle("habits", habit.id)}
            >
              <span className="habit-check" aria-hidden="true">{day.habits[habit.id] ? "✓" : ""}</span>
              <span className="habit-copy"><strong>{habit.label}</strong><small>{habit.hint}</small></span>
              <span className="habit-state">{day.habits[habit.id] ? "Done" : "Mark done"}</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}
