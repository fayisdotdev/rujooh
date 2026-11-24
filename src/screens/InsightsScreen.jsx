import React from "react";
import { statusOptions } from "../data/trackerConfig.js";

export default function InsightsScreen({
  viewMonth,
  changeMonth,
  streak,
  monthStats
}) {
  return (
    <section aria-labelledby="insights-title" className="screen-section">
      <div className="screen-heading">
        <p className="eyebrow">Look back with care</p>
        <h1 id="insights-title">Your progress</h1>
        <p>{viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}</p>
      </div>
      <div className="insights-month-switcher">
        <button type="button" className="icon-button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
        <span>{viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
        <button type="button" className="icon-button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
      </div>
      <section className="streak-panel" aria-label="Consecutive Fardh streak">
        <div><span className="streak-mark" aria-hidden="true">✦</span><p className="progress-kicker">Fardh streak</p></div>
        <strong>{streak}<small> {streak === 1 ? "day" : "days"}</small></strong>
        <p>Consecutive days with all five Fardh prayers fulfilled.</p>
      </section>
      <section className="insight-card">
        <div className="insight-card-heading">
          <div><h2>Fardh breakdown</h2><p>{monthStats.totalSlots} prayer windows recorded in the period</p></div>
          <strong>{monthStats.fulfilledPercent}%</strong>
        </div>
        <div className="fulfillment-bar" role="img" aria-label={`${monthStats.fulfilledPercent}% of prayers fulfilled`}>
          {["on-time", "jama", "qasr", "qadha", "missed", "pending"].map((status) => {
            const percent = monthStats.totalSlots ? (monthStats.counts[status] / monthStats.totalSlots) * 100 : 0;
            return <span key={status} className={`bar-${status}`} style={{ width: `${percent}%` }} />;
          })}
        </div>
        <div className="status-breakdown">
          {statusOptions.map((option) => (
            <div className="status-breakdown-row" key={option.id}>
              <span><i className={`legend-dot status-dot-${option.id}`} />{option.label}</span>
              <strong>{monthStats.counts[option.id]}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="insight-card">
        <div className="insight-card-heading">
          <div><h2>Daily practices</h2><p>Days marked in this month</p></div>
        </div>
        {[
          { label: "Quran recitation", count: monthStats.quranDays, percent: monthStats.quranPercent },
          { label: "Tahajjud", count: monthStats.tahajjudDays, percent: monthStats.tahajjudPercent },
          { label: "Witr", count: monthStats.witrDays, percent: monthStats.witrPercent }
        ].map((habit) => (
          <div className="habit-insight" key={habit.label}>
            <div><span>{habit.label}</span><strong>{habit.count} days · {habit.percent}%</strong></div>
            <div className="habit-progress"><span style={{ width: `${habit.percent}%` }} /></div>
          </div>
        ))}
      </section>
    </section>
  );
}
