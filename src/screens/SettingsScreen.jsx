import React, { useRef } from "react";
import { prayers } from "../data/prayers.js";
import { sunnahCount } from "../lib/trackerState.js";

export default function SettingsScreen({
  sunnahPreference,
  setSunnahPreference,
  theme,
  setTheme,
  exportJSON,
  exportCSV,
  importJSON
}) {
  const fileInputRef = useRef(null);
  return (
    <section aria-labelledby="settings-title" className="screen-section">
      <div className="screen-heading">
        <p className="eyebrow">Your preferences</p>
        <h1 id="settings-title">Settings</h1>
        <p>Your tracker data stays in this browser unless you export it.</p>
      </div>
      <section className="settings-card">
        <h2>Sunnah rak'ah counts</h2>
        <p className="settings-help">Choose which set of before- and after-prayer Sunnah counts to show on the Fardh tiles.</p>
        <div className="sunnah-mode-options" role="radiogroup" aria-label="Sunnah count preference">
          {[
            { id: "minimum", label: "Minimum" },
            { id: "maximum", label: "Maximum" }
          ].map((option) => (
            <button
              className={`sunnah-mode-option ${sunnahPreference === option.id ? "selected" : ""}`}
              type="button"
              role="radio"
              aria-checked={sunnahPreference === option.id}
              key={option.id}
              onClick={() => setSunnahPreference(option.id)}
            >{option.label}</button>
          ))}
        </div>
        <div className="sunnah-counts" aria-label={`${sunnahPreference} Sunnah rak'ah counts`}>
          {prayers.map((prayer) => {
            const before = sunnahCount(prayer, "before", sunnahPreference);
            const after = sunnahCount(prayer, "after", sunnahPreference);
                      return (
                        <div className="sunnah-count-row" key={prayer.id}>
                <strong>{prayer.name}</strong>
                <span>Before {before || "—"} · After {after || "—"} · Total {before + after}</span>
              </div>
                      );
                    })}
                  </div>
                </section>
                <section className="settings-card">
                  <h2>Appearance</h2>
                  <button className="setting-row theme-setting" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-pressed={theme === "dark"}>
                    <span><strong>Dark theme</strong><small>Choose a comfortable display.</small></span>
                    <span className={`toggle-switch ${theme === "dark" ? "on" : ""}`} aria-hidden="true"><i /></span>
                  </button>
                </section>
                <section className="settings-card">
                  <h2>Backup and export</h2>
                  <button className="setting-row" type="button" onClick={exportJSON}>
                    <span className="setting-icon" aria-hidden="true">↓</span>
                    <span><strong>Download JSON backup</strong><small>Save all dates so you can restore them later.</small></span>
                    <span className="setting-chevron" aria-hidden="true">›</span>
                  </button>
                  <button className="setting-row" type="button" onClick={exportCSV}>
                    <span className="setting-icon" aria-hidden="true">▤</span>
                    <span><strong>Export this month as CSV</strong><small>Open your prayer history in a spreadsheet.</small></span>
                    <span className="setting-chevron" aria-hidden="true">›</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    className="visually-hidden"
                    type="file"
                    accept=".json,application/json"
                    aria-label="Choose a Rujooh JSON backup"
                    onChange={(event) => {
                      importJSON(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button className="setting-row" type="button" onClick={() => fileInputRef.current?.click()}>
                    <span className="setting-icon" aria-hidden="true">↑</span>
                    <span><strong>Restore JSON backup</strong><small>Restoring replaces the dates currently stored here.</small></span>
                    <span className="setting-chevron" aria-hidden="true">›</span>
                  </button>
                </section>
              </section>
  );
}
