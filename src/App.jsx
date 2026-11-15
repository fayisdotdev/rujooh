import React, { useEffect, useMemo, useRef, useState } from "react";

const prayers = [
  { id: "fajr", name: "Fajr", arabic: "الفجر", sunnah: [{ id: "fajr-before", position: "before", minimum: 2, maximum: 2 }] },
  { id: "dhuhr", name: "Dhuhr", arabic: "الظهر", sunnah: [{ id: "dhuhr-before", position: "before", minimum: 2, maximum: 4 }, { id: "dhuhr-after", position: "after", minimum: 2, maximum: 4 }] },
  { id: "asr", name: "Asr", arabic: "العصر", sunnah: [{ id: "asr-before", position: "before", minimum: 0, maximum: 4 }] },
  { id: "maghrib", name: "Maghrib", arabic: "المغرب", sunnah: [{ id: "maghrib-before", position: "before", minimum: 0, maximum: 2 }, { id: "maghrib-after", position: "after", minimum: 2, maximum: 2 }] },
  { id: "isha", name: "Isha", arabic: "العشاء", sunnah: [{ id: "isha-before", position: "before", minimum: 0, maximum: 2 }, { id: "isha-after", position: "after", minimum: 2, maximum: 4 }] }
];

const dailyHabits = [
  { id: "quran", label: "Quran recitation", hint: "Read or reflect today" }
];
const nightPrayerHabits = [
  { id: "tahajjud", label: "Tahajjud", hint: "Night prayer" },
  { id: "witr", label: "Witr", hint: "Night prayer" }
];

const dailyDhikr = [
  { id: "astaghfirullah", text: "Astaghfirullah × 3", count: "3x" },
  { id: "allahumma-antas-salam", text: "Allahumma antas-salam wa minkas-salam...", count: "1x" },
  { id: "subhanallah", text: "SubhanAllah", count: "33x" },
  { id: "alhamdulillah", text: "Alhamdulillah", count: "33x" },
  { id: "allahu-akbar", text: "Allahu Akbar", count: "33x" },
  { id: "la-ilaha", text: "La ilaha illallahu wahdahu la sharika lah...", count: "1x" },
  { id: "ayatul-kursi", text: "Ayatul Kursi", count: "1x" }
];

const fardhIds = prayers.map((prayer) => prayer.id);
const statusOptions = [
  { id: "pending", label: "Pending" },
  { id: "on-time", label: "Done" },
  { id: "jama", label: "Jama'" },
  { id: "qasr", label: "Qasr" },
  { id: "qadha", label: "Qadha" },
  { id: "missed", label: "Missed" }
];
const fulfilledStatuses = new Set(["on-time", "jama", "qasr"]);
const statusLabels = Object.fromEntries(statusOptions.map((option) => [option.id, option.label]));
const dataStorageKey = "rujooh-tracker-v2";
const legacyStorageKey = "rujooh-tracker-v1";
const themeStorageKey = "rujooh-theme-v1";
const sunnahPreferenceStorageKey = "rujooh-sunnah-preference-v1";
const legacySunnahIds = {
  "dhuhr-before-4": "dhuhr-before",
  "dhuhr-after-2": "dhuhr-after",
  "asr-before-4": "asr-before",
  "maghrib-after-2": "maghrib-after",
  "isha-after-2": "isha-after"
};
const tabs = [
  { id: "today", label: "Today", icon: "◷" },
  { id: "month", label: "Month", icon: "▦" },
  { id: "insights", label: "Insights", icon: "⌁" },
  { id: "settings", label: "Settings", icon: "⚙" }
];

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function emptyDay() {
  return { fardh: {}, sunnah: {}, adhkar: {}, customAdhkar: [], customAdhkarDone: {}, habits: {} };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeBooleanMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, done]) => typeof done === "boolean"));
}

function normalizeDay(value) {
  if (!isRecord(value)) return emptyDay();
  const fardh = {};
  if (isRecord(value.fardh)) {
    for (const id of fardhIds) {
      const status = value.fardh[id];
      if (statusOptions.some((option) => option.id === status)) fardh[id] = status;
      else if (status === true) fardh[id] = "on-time";
      else if (status === false) fardh[id] = "pending";
    }
  }
  const customAdhkar = Array.isArray(value.customAdhkar)
    ? value.customAdhkar.filter((item) => isRecord(item) && typeof item.id === "string" && typeof item.text === "string")
      .map((item) => ({
        id: item.id,
        prayerId: prayers.some((prayer) => prayer.id === item.prayerId) ? item.prayerId : "fajr",
        text: item.text.slice(0, 5000),
        count: typeof item.count === "string" ? item.count.slice(0, 24) : ""
      }))
    : [];
  const sunnah = normalizeBooleanMap(value.sunnah);
  const habits = normalizeBooleanMap(value.habits);
  for (const [legacyId, currentId] of Object.entries(legacySunnahIds)) {
    if (sunnah[currentId] === undefined && typeof sunnah[legacyId] === "boolean") {
      sunnah[currentId] = sunnah[legacyId];
    }
    delete sunnah[legacyId];
  }
  if (habits.witr === undefined && typeof sunnah.witr === "boolean") habits.witr = sunnah.witr;
  delete sunnah.witr;
  return {
    fardh,
    sunnah,
    adhkar: normalizeBooleanMap(value.adhkar),
    customAdhkar,
    customAdhkarDone: normalizeBooleanMap(value.customAdhkarDone),
    habits
  };
}

function normalizeDays(value) {
  if (!isRecord(value)) throw new Error("Backup data must be an object keyed by date.");
  const result = {};
  for (const [key, record] of Object.entries(value)) {
    if (!isValidDateKey(key) || !isRecord(record)) {
      throw new Error("Backup contains an invalid date or day record.");
    }
    result[key] = normalizeDay(record);
  }
  return result;
}

function migrateLegacyState(value) {
  if (!isRecord(value) || typeof value.date !== "string" || !isValidDateKey(value.date)) return {};
  const migrated = emptyDay();
  for (const [id, done] of Object.entries(normalizeBooleanMap(value.fardh))) {
    if (fardhIds.includes(id)) migrated.fardh[id] = done ? "on-time" : "pending";
  }
  migrated.sunnah = normalizeBooleanMap(value.sunnah);
  migrated.adhkar = normalizeBooleanMap(value.adhkar);
  migrated.customAdhkar = Array.isArray(value.customAdhkar) ? value.customAdhkar : [];
  migrated.customAdhkarDone = normalizeBooleanMap(value.customAdhkarDone);
  return { [value.date]: normalizeDay(migrated) };
}

function loadDays() {
  try {
    const saved = localStorage.getItem(dataStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!isRecord(parsed) || !isRecord(parsed.days)) throw new Error("Saved Rujooh data has an invalid format.");
      return normalizeDays(parsed.days);
    }
    const legacy = localStorage.getItem(legacyStorageKey);
    return legacy ? migrateLegacyState(JSON.parse(legacy)) : {};
  } catch (error) {
    console.error("Could not load Rujooh data:", error);
    return {};
  }
}

function loadSunnahPreference() {
  try {
    return localStorage.getItem(sunnahPreferenceStorageKey) === "maximum" ? "maximum" : "minimum";
  } catch (error) {
    console.error("Could not load Rujooh Sunnah preference:", error);
    return "minimum";
  }
}

function radians(value) {
  return value * Math.PI / 180;
}

function degrees(value) {
  return value * 180 / Math.PI;
}

function solarPosition(date) {
  const julianDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000 + 2440587.5;
  const century = (julianDay - 2451545) / 36525;
  const meanLongitude = (280.46646 + century * (36000.76983 + century * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + century * (35999.05029 - 0.0001537 * century);
  const eccentricity = 0.016708634 - century * (0.000042037 + 0.0000001267 * century);
  const center = Math.sin(radians(meanAnomaly)) * (1.914602 - century * (0.004817 + 0.000014 * century))
    + Math.sin(radians(2 * meanAnomaly)) * (0.019993 - 0.000101 * century)
    + Math.sin(radians(3 * meanAnomaly)) * 0.000289;
  const omega = 125.04 - 1934.136 * century;
  const apparentLongitude = meanLongitude + center - 0.00569 - 0.00478 * Math.sin(radians(omega));
  const meanObliquity = 23 + (26 + (21.448 - century * (46.815 + century * (0.00059 - century * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(radians(omega));
  const declination = degrees(Math.asin(Math.sin(radians(obliquity)) * Math.sin(radians(apparentLongitude))));
  const y = Math.tan(radians(obliquity / 2)) ** 2;
  const equationOfTime = 4 * degrees(
    y * Math.sin(2 * radians(meanLongitude))
      - 2 * eccentricity * Math.sin(radians(meanAnomaly))
      + 4 * eccentricity * y * Math.sin(radians(meanAnomaly)) * Math.cos(2 * radians(meanLongitude))
      - 0.5 * y * y * Math.sin(4 * radians(meanLongitude))
      - 1.25 * eccentricity * eccentricity * Math.sin(2 * radians(meanAnomaly))
  );
  return { declination, equationOfTime };
}

function timeForSunAltitude(solarNoon, latitude, declination, altitude, morning) {
  const numerator = Math.sin(radians(altitude)) - Math.sin(radians(latitude)) * Math.sin(radians(declination));
  const denominator = Math.cos(radians(latitude)) * Math.cos(radians(declination));
  const cosine = numerator / denominator;
  if (cosine < -1 || cosine > 1) return null;
  const hourAngle = degrees(Math.acos(cosine)) * 4;
  return solarNoon + (morning ? -hourAngle : hourAngle);
}

function calculatePrayerTimes(date, latitude, longitude) {
  const { declination, equationOfTime } = solarPosition(date);
  const solarNoon = 720 - 4 * longitude - equationOfTime - date.getTimezoneOffset();
  const asrAngle = degrees(Math.atan(1 / (1 + Math.tan(Math.abs(radians(latitude - declination))))));
  const minutes = {
    fajr: timeForSunAltitude(solarNoon, latitude, declination, -18, true),
    dhuhr: solarNoon,
    asr: timeForSunAltitude(solarNoon, latitude, declination, asrAngle, false),
    maghrib: timeForSunAltitude(solarNoon, latitude, declination, -0.833, false),
    isha: timeForSunAltitude(solarNoon, latitude, declination, -17, false)
  };
  return Object.fromEntries(Object.entries(minutes).map(([id, value]) => [
    id,
    value === null ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, value)
  ]));
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatHijriDate(date, locale = "en") {
  for (const calendar of ["islamic-umalqura", "islamic"]) {
    try {
      return new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, {
        day: "numeric", month: "long", year: "numeric"
      }).format(date);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  return "";
}

function shiftDate(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

function fullDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

function isFulfilled(status) {
  return fulfilledStatuses.has(status);
}

function sunnahCount(prayer, position, preference) {
  return prayer.sunnah.find((item) => item.position === position)?.[preference] || 0;
}

function getStreak(days, today) {
  let cursor = today;
  const todayRecord = normalizeDay(days[dateKey(today)]);
  if (!fardhIds.every((id) => isFulfilled(todayRecord.fardh[id]))) cursor = shiftDate(today, -1);
  let streak = 0;
  while (streak < 3660) {
    const day = normalizeDay(days[dateKey(cursor)]);
    if (!fardhIds.every((id) => isFulfilled(day.fardh[id]))) break;
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function PrayerCard({ prayer, day, expanded, active, upcoming, time, sunnahPreference, onExpand, onStatusChange, onToggle, onAddAdhkar }) {
  const prayerAdhkar = day.customAdhkar.filter((item) => item.prayerId === prayer.id);
  const sunnahItems = prayer.sunnah.filter((item) => item[sunnahPreference] > 0);
  const currentStatus = day.fardh[prayer.id] || "pending";
  const completed = isFulfilled(currentStatus);
  function cycleStatus() {
    const currentIndex = statusOptions.findIndex((option) => option.id === currentStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    onStatusChange(prayer.id, statusOptions[nextIndex].id);
  }

  function handleAdd(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = form.elements.text.value.trim();
    const count = form.elements.count.value.trim();
    if (!text) return;
    onAddAdhkar(prayer.id, text, count);
    form.reset();
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
          aria-label={`${expanded ? "Hide" : "Show"} ${prayer.name} Sunnah and adhkar`}
        >{expanded ? "−" : "+"}</button>
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
          <div className="prayer-adhkar">
            <div className="subsection-title">
              <span>My {prayer.name} adhkar</span>
              <span>{prayerAdhkar.length}</span>
            </div>
            {prayerAdhkar.map((item) => {
              const done = Boolean(day.customAdhkarDone[item.id]);
              return (
                <div className={`custom-dhikr ${done ? "done" : ""}`} key={item.id}>
                  <span>{item.text} <small>{item.count}</small></span>
                  <button
                    className="dhikr-check"
                    type="button"
                    aria-label={`${done ? "Unmark" : "Mark"} adhkar complete`}
                    aria-pressed={done}
                    onClick={() => onToggle("customAdhkarDone", item.id)}
                  >{done ? "✓" : ""}</button>
                </div>
              );
            })}
            <form className="add-dhikr-form" onSubmit={handleAdd}>
              <label className="visually-hidden" htmlFor={`dhikr-text-${prayer.id}`}>Adhkar text</label>
              <textarea id={`dhikr-text-${prayer.id}`} name="text" placeholder="Add adhkar for this prayer" required maxLength={5000} rows={2} dir="auto" />
              <label className="visually-hidden" htmlFor={`dhikr-count-${prayer.id}`}>Count or note</label>
              <input id={`dhikr-count-${prayer.id}`} name="count" placeholder="Count or note (optional)" maxLength={24} />
              <button className="primary-button add-dhikr-btn" type="submit">Add</button>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}

function App() {
  const [days, setDays] = useState(loadDays);
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMonth, setViewMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [activeTab, setActiveTab] = useState("today");
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
  const [notice, setNotice] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);
  const locationRequestedOnLoad = useRef(false);
  const todayKeyRef = useRef(dateKey());
  const activeKey = dateKey(selectedDate);
  const day = normalizeDay(days[activeKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  const setPrayerStatus = (id, status) => updateDay((previous) => ({
    ...previous,
    fardh: { ...previous.fardh, [id]: status }
  }));

  const markAllFardhComplete = () => updateDay((previous) => ({
    ...previous,
    fardh: Object.fromEntries(fardhIds.map((id) => [id, "on-time"]))
  }));

  const addPrayerAdhkar = (prayerId, text, count) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    updateDay((previous) => ({
      ...previous,
      customAdhkar: [...previous.customAdhkar, { id, prayerId, text, count }]
    }));
  };

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
  const dhikrDone = dailyDhikr.filter((item) => day.adhkar[item.id]).length
    + day.customAdhkar.filter((item) => day.customAdhkarDone[item.id]).length;
  const totalDhikr = dailyDhikr.length + day.customAdhkar.length;
  const dateLabel = fullDate(selectedDate);
  const hijriLabel = formatHijriDate(selectedDate);
  const hijriArabicLabel = formatHijriDate(selectedDate, "ar-SA");
  const viewingToday = dateKey(selectedDate) === dateKey(now);
  const currentMonthKey = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}`;
  const todayMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
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
        {activeTab === "today" && (
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
              <div><h2>Fardh prayers</h2><p>Tap a tile to cycle statuses. Use the dropdown to choose one. + opens Sunnah.</p></div>
            </div>
            <section className="prayer-list" aria-label="Fardh prayers">
              {displayedPrayers.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  day={day}
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
                  onAddAdhkar={addPrayerAdhkar}
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

            <section className="daily-habits-section" aria-labelledby="night-prayers-heading">
              <div className="section-title-row">
                <div><h2 id="night-prayers-heading">Night prayers</h2><p>Tahajjud and Witr are tracked separately.</p></div>
              </div>
              <div className="habit-toggle-list">
                {nightPrayerHabits.map((habit) => (
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

            <section className="adhkar-section">
              <div className="section-title-row">
                <div><p className="eyebrow">Daily remembrance</p><h2>Adhkar</h2></div>
                <span className="completion-badge">{dhikrDone} / {totalDhikr}</span>
              </div>
              <div className="adhkar-list">
                {dailyDhikr.map((item, index) => {
                  const done = Boolean(day.adhkar[item.id]);
                  return (
                    <div className={`dhikr-row ${done ? "done" : ""}`} key={item.id}>
                      <span className="dhikr-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="dhikr-copy"><strong>{item.text}</strong><small>{item.count}</small></span>
                      <button
                        className="dhikr-check"
                        type="button"
                        aria-label={`${done ? "Unmark" : "Mark"} ${item.text} complete`}
                        aria-pressed={done}
                        onClick={() => toggle("adhkar", item.id)}
                      >{done ? "✓" : ""}</button>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>
        )}

        {activeTab === "month" && (
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
        )}

        {activeTab === "insights" && (
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
        )}

        {activeTab === "settings" && (
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
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
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
