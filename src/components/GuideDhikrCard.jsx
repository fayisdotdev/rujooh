import React, { useState } from "react";

export default function GuideDhikrCard({ item, position, count, done, onIncrement, onDecrement, onMark }) {
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const transliterationId = `guide-transliteration-${item.id}`;
  const translationId = `guide-translation-${item.id}`;
  const hasTextDetails = item.transliteration || item.meaning;

  return (
    <article className={`guide-item ${done ? "done" : ""}`}>
      <div className="guide-item-heading">
        <div>
          <div className="guide-item-title">
            <span className="guide-item-position" aria-hidden="true">{position}</span>
            <h3>{item.title}</h3>
          </div>
          {item.arabic && <p className="guide-arabic" lang="ar" dir="rtl">{item.arabic}</p>}
        </div>
        {done && <span className="guide-done-badge">Done</span>}
      </div>
      {hasTextDetails && (
        <>
          <div className="guide-text-toggles">
            {item.transliteration && (
              <button
                className="guide-text-toggle"
                type="button"
                aria-expanded={showTransliteration}
                aria-controls={transliterationId}
                onClick={() => setShowTransliteration((shown) => !shown)}
              >
                {showTransliteration ? "Hide" : "Show"} transliteration
              </button>
            )}
            {item.meaning && (
              <button
                className="guide-text-toggle"
                type="button"
                aria-expanded={showTranslation}
                aria-controls={translationId}
                onClick={() => setShowTranslation((shown) => !shown)}
              >
                {showTranslation ? "Hide" : "Show"} translation
              </button>
            )}
          </div>
          {item.transliteration && (
            <p className="guide-transliteration" id={transliterationId} dir="auto" hidden={!showTransliteration}>
              {item.transliteration}
            </p>
          )}
          {item.meaning && (
            <p className="guide-meaning" id={translationId} hidden={!showTranslation}>
              {item.meaning}
            </p>
          )}
        </>
      )}
      {item.note && <p className="guide-note">{item.note}</p>}
      {item.target === null ? (
        <button className="guide-mark-button" type="button" aria-pressed={done} onClick={onMark}>
          {done ? "Marked for today" : "Mark read"}
        </button>
      ) : (
        <div className="guide-counter">
          <button type="button" aria-label={`Decrease ${item.title} count`} onClick={onDecrement} disabled={count === 0}>−</button>
          <span aria-live="polite"><strong>{count}</strong><small> / {item.target}</small></span>
          <button type="button" aria-label={`Count ${item.title}`} onClick={onIncrement}>+</button>
        </div>
      )}
    </article>
  );
}
