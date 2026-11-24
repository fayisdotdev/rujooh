import React from "react";
import GuideDhikrCard from "../components/GuideDhikrCard.jsx";
import { adhkarGuide } from "../data/adhkarGuide.js";

export default function GuideScreen({
  dateLabel,
  activeGuide,
  guideRoutines,
  guideItemDone,
  selectedGuideId,
  setSelectedGuideId,
  resetGuide,
  day,
  changeGuideCount,
  toggle,
  showMalayalamTranslations,
  adhkarPdfUrl
}) {
  return (
    <section aria-labelledby="guide-title" className="screen-section guide-screen">
      <div className="screen-heading">
        <p className="eyebrow">From your daily adhkar guide</p>
        <h1 id="guide-title">A dhikr at a time</h1>
        <p>{dateLabel} · Your counts are saved on this device for the selected day.</p>
      </div>
      <div className="guide-now-panel" aria-label="Current adhkar suggestion">
        <div>
          <span>Now</span>
          <strong>{activeGuide.label}</strong>
        </div>
        <div className="guide-now-progress">
          <span>{guideRoutines.reduce((total, routine) => total + routine.items.filter(guideItemDone).length, 0)} completed</span>
          <span>{guideRoutines.reduce((total, routine) => total + routine.items.length, 0)} total</span>
        </div>
      </div>
      <div className="guide-routine-tabs" aria-label="Choose an adhkar routine">
        {adhkarGuide.map((routine) => {
          const completed = routine.items.filter(guideItemDone).length;
                    return (
                      <button
              className={selectedGuideId === routine.id ? "selected" : ""}
              type="button"
              aria-pressed={selectedGuideId === routine.id}
              key={routine.id}
              onClick={() => setSelectedGuideId(routine.id)}
            >
              <strong>{routine.label}</strong>
              <small>{completed}/{routine.items.length} done</small>
            </button>
                    );
                  })}
                </div>
                {guideRoutines.map((routine) => {
                  const completed = routine.items.filter(guideItemDone).length;
                  return (
                    <section className="guide-routine-card" aria-label={`${routine.label} adhkar`} key={routine.id}>
            <div className="guide-routine-heading">
              <div>
                <p className="eyebrow">{routine.label}</p>
                <h2>{routine.hint}</h2>
              </div>
              <button className="guide-reset-button" type="button" onClick={() => resetGuide(routine)}>
                Reset set
              </button>
            </div>
            <div
              className="guide-progress-track"
              role="progressbar"
              aria-label={`${routine.label} adhkar completed`}
              aria-valuenow={completed}
              aria-valuemin={0}
              aria-valuemax={routine.items.length}
            >
              <span style={{ width: `${(completed / routine.items.length) * 100}%` }} />
            </div>
            <div className="guide-items">
              {routine.items.map((item, index) => (
                <GuideDhikrCard
                  key={item.id}
                  item={item}
                  position={index + 1}
                  count={day.guideCounts[item.id] || 0}
                  done={guideItemDone(item)}
                  onIncrement={() => changeGuideCount(item.id, 1)}
                  onDecrement={() => changeGuideCount(item.id, -1)}
                  onMark={() => toggle("guideDone", item.id)}
                  showMalayalamTranslations={showMalayalamTranslations}
                />
              ))}
            </div>
          </section>
                  );
                })}
                <a className="guide-source-link" href={adhkarPdfUrl} target="_blank" rel="noreferrer">
                  Open the complete 9-page source guide <span aria-hidden="true">↗</span>
                </a>
                <p className="guide-source-note">
                  The PDF includes full Quranic passages, longer wording, meanings, references, and notes about customary additions and narrations to verify with a trusted teacher.
                </p>
              </section>
  );
}
