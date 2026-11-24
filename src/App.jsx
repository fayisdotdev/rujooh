import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { adhkarGuide } from "./data/adhkarGuide.js";
import {
  dataStorageKey,
  fardhIds,
  statusLabels,
  statusOptions,
  sunnahPreferenceStorageKey,
  tabs,
  themeStorageKey,
  malayalamTranslationsStorageKey
} from "./data/trackerConfig.js";
import { prayers } from "./data/prayers.js";
import { formatHijriDate, dateKey, fullDate, shiftDate } from "./lib/dates.js";
import { getStreak } from "./lib/insights.js";
import { calculatePrayerTimes } from "./lib/prayerTimes.js";
import {
  isFulfilled,
  loadDays,
  loadSunnahPreference,
  normalizeDay,
  normalizeDays
} from "./lib/trackerState.js";

import GuideScreen from "./screens/GuideScreen.jsx";
import InsightsScreen from "./screens/InsightsScreen.jsx";
import MonthScreen from "./screens/MonthScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import TodayScreen from "./screens/TodayScreen.jsx";

const adhkarPdfUrl = `${import.meta.env.BASE_URL}adhkar-guide.pdf`;

function App() {
  const [days, setDays] = useState(loadDays);
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [activeTab, setActiveTab] = useState("today");
  const [selectedGuideId, setSelectedGuideId] = useState("after-prayer");
  const [expandedPrayer, setExpandedPrayer] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Allow location access to calculate approximate times on this device.");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
    } catch (error) {
      console.error("Could not load Rujooh appearance:", error);
      return "light";
    }
  });
  const [sunnahPreference, setSunnahPreference] = useState(loadSunnahPreference);
  const [showMalayalamTranslations, setShowMalayalamTranslations] = useState(() => {
    try {
      return localStorage.getItem(malayalamTranslationsStorageKey) !== "false";
    } catch (error) {
      console.error("Could not load Rujooh Malayalam preference:", error);
      return true;
    }
  });
  const [notice, setNotice] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const locationRequestedOnLoad = useRef(false);
  const todayKeyRef = useRef(dateKey());
  const activeKey = dateKey(selectedDate);
  const day = normalizeDay(days[activeKey]);
  const activeGuide = adhkarGuide.find((routine) => routine.id === selectedGuideId) || adhkarGuide[0];
  const guideRoutines = [activeGuide];
  if (selectedGuideId === "fajr" || selectedGuideId === "maghrib") {
    const afterPrayerGuide = adhkarGuide.find((routine) => routine.id === "after-prayer");
    if (afterPrayerGuide) guideRoutines.push(afterPrayerGuide);
  }
  const guideItemDone = (item) => item.target === null
    ? Boolean(day.guideDone[item.id])
    : (day.guideCounts[item.id] || 0) >= item.target;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    if (activeTab === "guide") window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    const currentKey = dateKey(now);
    if (currentKey !== todayKeyRef.current) {
      if (dateKey(selectedDate) === todayKeyRef.current) setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
      todayKeyRef.current = currentKey;
    }
  }, [now, selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem(dataStorageKey, JSON.stringify({ version: 2, days }));
    } catch (error) {
      console.error("Could not save Rujooh data:", error);
      setNotice("Your latest changes could not be saved in this browser.");
    }
  }, [days]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch (error) {
      console.error("Could not save Rujooh appearance:", error);
      setNotice("Your appearance preference could not be saved.");
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(sunnahPreferenceStorageKey, sunnahPreference);
    } catch (error) {
      console.error("Could not save Rujooh Sunnah preference:", error);
      setNotice("Your Sunnah preference could not be saved.");
    }
  }, [sunnahPreference]);

  useEffect(() => {
    try {
      localStorage.setItem(malayalamTranslationsStorageKey, String(showMalayalamTranslations));
    } catch (error) {
      console.error("Could not save Rujooh Malayalam preference:", error);
      setNotice("Your Malayalam translation preference could not be saved.");
    }
  }, [showMalayalamTranslations]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const schedule = useMemo(() => {
    if (!coordinates) return null;
    const todayTimes = calculatePrayerTimes(now, coordinates.latitude, coordinates.longitude);
    const ordered = prayers.map((prayer) => ({ ...prayer, time: todayTimes[prayer.id] }))
      .filter((prayer) => prayer.time)
      .sort((left, right) => left.time - right.time);
    const upcomingToday = ordered.find((prayer) => prayer.time > now);
    let upcoming = upcomingToday;
    if (!upcoming) {
      const tomorrow = shiftDate(now, 1);
      const fajr = calculatePrayerTimes(tomorrow, coordinates.latitude, coordinates.longitude).fajr;
      upcoming = fajr ? { ...prayers[0], time: fajr } : null;
    }
    const current = [...ordered].reverse().find((prayer) => prayer.time <= now) || null;
    return { times: todayTimes, upcoming, current };
  }, [coordinates, Math.floor(now.getTime() / 60000)]);

  function openGuide() {
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    let routineId = "after-prayer";

    if (minuteOfDay >= 22 * 60) routineId = "before-sleep";
    else if (now.getDay() === 5 && minuteOfDay >= 10 * 60 && minuteOfDay < 15 * 60) routineId = "friday";
    else if (schedule?.current?.id === "fajr") routineId = "fajr";
    else if (schedule?.current?.id === "maghrib") routineId = "maghrib";

    setSelectedGuideId(routineId);
    setActiveTab("guide");
  }

  const updateDay = (updater) => {
    setDays((previous) => ({
      ...previous,
      [activeKey]: normalizeDay(updater(normalizeDay(previous[activeKey])))
    }));
  };

  const toggle = (type, id) => updateDay((previous) => ({
    ...previous,
    [type]: { ...previous[type], [id]: !previous[type][id] }
  }));

  const changeGuideCount = (id, amount) => updateDay((previous) => ({
    ...previous,
    guideCounts: {
      ...previous.guideCounts,
      [id]: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, (previous.guideCounts[id] || 0) + amount))
    }
  }));

  const resetGuide = (routine) => updateDay((previous) => {
    const guideCounts = { ...previous.guideCounts };
    const guideDone = { ...previous.guideDone };
    routine.items.forEach((item) => {
      delete guideCounts[item.id];
      delete guideDone[item.id];
    });
    return { ...previous, guideCounts, guideDone };
  });

  const setPrayerStatus = (id, status) => updateDay((previous) => ({
    ...previous,
    fardh: { ...previous.fardh, [id]: status }
  }));

  const markAllFardhComplete = () => updateDay((previous) => ({
    ...previous,
    fardh: Object.fromEntries(fardhIds.map((id) => [id, "on-time"]))
  }));

  function notify(message) {
    setNotice(message);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser.");
      return;
    }
    setRequestingLocation(true);
    setLocationStatus("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("Times calculated locally using your device location.");
        setRequestingLocation(false);
      },
      (error) => {
        const messages = {
          1: "Location permission was denied. Allow location access in your browser settings to see prayer times.",
          2: "Your location could not be determined. Try again where GPS or network location is available.",
          3: "The location request timed out. Please try again."
        };
        setLocationStatus(messages[error.code] || "Could not get your location. Please try again.");
        setRequestingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  }

  useEffect(() => {
    if (locationRequestedOnLoad.current) return;
    locationRequestedOnLoad.current = true;
    requestLocation();
  }, []);

  const progress = fardhIds.filter((id) => isFulfilled(day.fardh[id])).length;
  const dateLabel = fullDate(selectedDate);
  const hijriLabel = formatHijriDate(selectedDate);
  const hijriArabicLabel = formatHijriDate(selectedDate, "ar-SA");
  const viewingToday = dateKey(selectedDate) === dateKey(now);
  useEffect(() => {
    setExpandedPrayer(
      viewingToday
        ? schedule?.current?.id ?? schedule?.upcoming?.id ?? prayers[0].id
        : prayers[0].id
    );
  }, [activeKey, schedule?.current?.id, schedule?.upcoming?.id, viewingToday]);

  const currentMonthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}`;
  const todayMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const monthStats = useMemo(() => {
    const currentMonth = currentMonthKey === todayMonthKey;
    const futureMonth = currentMonthKey > todayMonthKey;
    const elapsedDays = futureMonth ? 0 : currentMonth ? now.getDate() : daysInMonth;
    const counts = Object.fromEntries(statusOptions.map((option) => [option.id, 0]));
    let quranDays = 0;
    let tahajjudDays = 0;
    let witrDays = 0;
    for (let date = 1; date <= elapsedDays; date += 1) {
      const key = `${currentMonthKey}-${String(date).padStart(2, "0")}`;
      const record = normalizeDay(days[key]);
      fardhIds.forEach((id) => {
        const status = record.fardh[id] || "pending";
        counts[status] += 1;
      });
      if (record.habits.quran) quranDays += 1;
      if (record.habits.tahajjud) tahajjudDays += 1;
      if (record.habits.witr) witrDays += 1;
    }
    const totalSlots = elapsedDays * fardhIds.length;
    const fulfilled = counts["on-time"] + counts.jama + counts.qasr;
    return {
      elapsedDays,
      counts,
      totalSlots,
      fulfilled,
      fulfilledPercent: totalSlots ? Math.round((fulfilled / totalSlots) * 100) : 0,
      quranDays,
      tahajjudDays,
      witrDays,
      quranPercent: elapsedDays ? Math.round((quranDays / elapsedDays) * 100) : 0,
      tahajjudPercent: elapsedDays ? Math.round((tahajjudDays / elapsedDays) * 100) : 0,
      witrPercent: elapsedDays ? Math.round((witrDays / elapsedDays) * 100) : 0
    };
  }, [currentMonthKey, todayMonthKey, daysInMonth, now, days]);
  const streak = useMemo(() => getStreak(days, now), [days, dateKey(now)]);

  function changeMonth(amount) {
    setViewMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + amount, 1));
  }

  function selectCalendarDate(date) {
    setSelectedDate(date);
    setActiveTab("today");
    setExpandedPrayer(null);
  }

  function exportJSON() {
    const payload = { app: "Rujooh", version: 2, exportedAt: new Date().toISOString(), days };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rujooh-backup-${dateKey()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify("Backup downloaded.");
  }

  function exportCSV() {
    const headers = [
      "Date",
      "Weekday",
      ...prayers.map((prayer) => `${prayer.name} status`),
      ...prayers.flatMap((prayer) => prayer.sunnah
        .filter((item) => item[sunnahPreference] > 0)
        .map((item) => `${prayer.name} ${item.position} (${item[sunnahPreference]} rak'ah)`)),
      "Quran recitation",
      "Tahajjud",
      "Witr"
    ];
    const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [headers.map(escapeCell).join(",")];
    for (let date = 1; date <= daysInMonth; date += 1) {
      const dayDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), date);
      const key = dateKey(dayDate);
      const record = normalizeDay(days[key]);
      const statuses = prayers.map((prayer) => statusLabels[record.fardh[prayer.id] || "pending"]);
      const sunnah = prayers.flatMap((prayer) => prayer.sunnah
        .filter((item) => item[sunnahPreference] > 0)
        .map((item) => record.sunnah[item.id] ? "Done" : "Not done"));
      rows.push([
        key,
        new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(dayDate),
        ...statuses,
        ...sunnah,
        record.habits.quran ? "Done" : "Not done",
        record.habits.tahajjud ? "Done" : "Not done",
        record.habits.witr ? "Done" : "Not done"
      ].map(escapeCell).join(","));
    }
    const blob = new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rujooh-${currentMonthKey}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify(`${viewMonth.toLocaleString(undefined, { month: "long" })} CSV downloaded.`);
  }

  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => notify("The selected backup could not be read.");
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = parsed?.days ?? parsed?.data;
        const restoredDays = normalizeDays(incoming);
        setPendingImport(restoredDays);
      } catch (error) {
        console.error("Could not restore Rujooh backup:", error);
        notify("That file is not a valid Rujooh JSON backup.");
      }
    };
    reader.readAsText(file);
  }

  const firstPrayerId = viewingToday
    ? schedule?.current?.id ?? schedule?.upcoming?.id
    : null;
  const firstPrayerIndex = prayers.findIndex((prayer) => prayer.id === firstPrayerId);
  const displayedPrayers = firstPrayerIndex > 0
    ? [...prayers.slice(firstPrayerIndex), ...prayers.slice(0, firstPrayerIndex)]
    : prayers;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#today" onClick={(event) => { event.preventDefault(); setActiveTab("today"); }}>
          <span className="brand-mark" aria-hidden="true">ر</span>
          <span><strong>Rujooh</strong><small>Return to Salah.</small></span>
        </a>
        <div className="header-prayer-info" aria-live="polite">
          <div className="location-info">
            <span className="header-label">Location</span>
            <strong>{coordinates ? `${coordinates.latitude.toFixed(2)}°, ${coordinates.longitude.toFixed(2)}°` : "Not detected"}</strong>
          </div>
          <button className="location-button" type="button" onClick={requestLocation} disabled={requestingLocation}>
            {requestingLocation ? "Getting location…" : coordinates ? "Update location" : "Use my location"}
          </button>
          <small className="location-status">{locationStatus}</small>
        </div>
      </header>

      <main className="main-content">
        {activeTab === "guide" && (
          <GuideScreen
            dateLabel={dateLabel}
            activeGuide={activeGuide}
            guideRoutines={guideRoutines}
            guideItemDone={guideItemDone}
            selectedGuideId={selectedGuideId}
            setSelectedGuideId={setSelectedGuideId}
            resetGuide={resetGuide}
            day={day}
            changeGuideCount={changeGuideCount}
            toggle={toggle}
            showMalayalamTranslations={showMalayalamTranslations}
            adhkarPdfUrl={adhkarPdfUrl}
          />
        )}

        {activeTab === "today" && (
          <TodayScreen
            dateLabel={dateLabel}
            hijriLabel={hijriLabel}
            hijriArabicLabel={hijriArabicLabel}
            schedule={schedule}
            progress={progress}
            viewingToday={viewingToday}
            markAllFardhComplete={markAllFardhComplete}
            displayedPrayers={displayedPrayers}
            day={day}
            sunnahPreference={sunnahPreference}
            expandedPrayer={expandedPrayer}
            setExpandedPrayer={setExpandedPrayer}
            setPrayerStatus={setPrayerStatus}
            toggle={toggle}
          />
        )}

        {activeTab === "month" && (
          <MonthScreen
            viewMonth={viewMonth}
            changeMonth={changeMonth}
            daysInMonth={daysInMonth}
            activeKey={activeKey}
            days={days}
            now={now}
            selectCalendarDate={selectCalendarDate}
            monthStats={monthStats}
          />
        )}

        {activeTab === "insights" && (
          <InsightsScreen
            viewMonth={viewMonth}
            changeMonth={changeMonth}
            streak={streak}
            monthStats={monthStats}
          />
        )}

        {activeTab === "settings" && (
          <SettingsScreen
            sunnahPreference={sunnahPreference}
            setSunnahPreference={setSunnahPreference}
            theme={theme}
            setTheme={setTheme}
            showMalayalamTranslations={showMalayalamTranslations}
            setShowMalayalamTranslations={setShowMalayalamTranslations}
            exportJSON={exportJSON}
            exportCSV={exportCSV}
            importJSON={importJSON}
          />
        )}

      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => tab.id === "guide" ? openGuide() : setActiveTab(tab.id)}
          >
            <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      {notice && <div className="toast" role="status">{notice}</div>}
      {pendingImport && (
        <div className="dialog-backdrop">
          <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="restore-title" aria-describedby="restore-description" onKeyDown={(event) => {
            if (event.key === "Escape") setPendingImport(null);
          }}>
            <p className="eyebrow">Restore backup</p>
            <h2 id="restore-title">Replace saved tracker data?</h2>
            <p id="restore-description">This backup will replace the prayer and habit history currently stored in this browser.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" autoFocus onClick={() => setPendingImport(null)}>Cancel</button>
              <button type="button" className="primary-button" onClick={() => {
                setDays(pendingImport);
                setPendingImport(null);
                notify("Backup restored.");
              }}>Restore backup</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
