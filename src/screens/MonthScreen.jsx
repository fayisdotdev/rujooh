import React from "react";
import { fardhIds } from "../data/trackerConfig.js";
import { dateKey, fullDate } from "../lib/dates.js";
import { isFulfilled, normalizeDay } from "../lib/trackerState.js";

export default function MonthScreen({
  viewMonth,
  changeMonth,
  daysInMonth,
  activeKey,
  days,
  now,
  selectCalendarDate,
  monthStats
}) {
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  return (
    <section aria-labelledby="month-title" className="screen-section">
      <div className="screen-heading">
        <p className="eyebrow">Your practice over time</p>
        <h1 id="month-title">Month at a glance</h1>
        <p>Select a day to open and edit its record.</p>
      </div>
      <div className="month-switcher">
        <button type="button" className="icon-button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
        <h2>{viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}</h2>
        <button type="button" className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
      </div>
      <div className="calendar-panel">
        <div className="calendar-grid calendar-weekdays" aria-hidden="true">
          {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: firstWeekday }, (_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1);
            const record = normalizeDay(days[dateKey(date)]);
            const doneCount = fardhIds.filter((id) => isFulfilled(record.fardh[id])).length;
            const isToday = dateKey(date) === dateKey(now);
            const isSelected = dateKey(date) === activeKey;
            const isFuture = date > new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      return (
                        <button
                type="button"
                key={index}
                className={`calendar-day ${doneCount === 5 ? "complete" : doneCount > 0 ? "partial" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
                onClick={() => selectCalendarDate(date)}
                aria-label={`${fullDate(date)}: ${doneCount} of 5 Fardh fulfilled${isFuture ? ", future date" : ""}`}
              >
                <span>{index + 1}</span>
                <small>{isFuture ? "—" : `${doneCount}/5`}</small>
              </button>
                      );
                    })}
                  </div>
                  <div className="calendar-legend">
                    <span><i className="legend-dot complete" />5 of 5</span>
                    <span><i className="legend-dot partial" />1–4</span>
                    <span><i className="legend-dot" />No entries</span>
                  </div>
                </div>
                <div className="month-summary">
                  <div><strong>{monthStats.fulfilledPercent}%</strong><span>Fardh fulfilled this month</span></div>
                  <div><strong>{monthStats.elapsedDays}</strong><span>days in view so far</span></div>
                </div>
              </section>
  );
}
