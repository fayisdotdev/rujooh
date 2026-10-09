import React, { useEffect, useMemo, useRef, useState } from "react";

const prayers = [
  { id: "fajr", name: "Fajr", arabic: "الفجر", icon: "☀", sunnah: [{ id: "fajr-before", label: "2 rak'ah before Fajr" }] },
  { id: "dhuhr", name: "Dhuhr", arabic: "الظهر", icon: "◉", sunnah: [{ id: "dhuhr-before-4", label: "4 rak'ah before Dhuhr" }, { id: "dhuhr-after-2", label: "2 rak'ah after Dhuhr" }] },
  { id: "asr", name: "Asr", arabic: "العصر", icon: "◌", sunnah: [{ id: "asr-before-4", label: "4 rak'ah before Asr" }] },
  { id: "maghrib", name: "Maghrib", arabic: "المغرب", icon: "◐", sunnah: [{ id: "maghrib-after-2", label: "2 rak'ah after Maghrib" }] },
  { id: "isha", name: "Isha", arabic: "العشاء", icon: "☾", sunnah: [{ id: "isha-after-2", label: "2 rak'ah after Isha" }, { id: "witr", label: "Witr" }] }
];

const adhkar = [
  { id: "astaghfirullah", text: "Astaghfirullah × 3", count: "3x" },
  { id: "allahumma-antas-salam", text: "Allahumma antas-salam wa minkas-salam...", count: "1x" },
  { id: "subhanallah", text: "SubhanAllah", count: "33x" },
  { id: "alhamdulillah", text: "Alhamdulillah", count: "33x" },
  { id: "allahu-akbar", text: "Allahu Akbar", count: "33x" },
  { id: "la-ilaha", text: "La ilaha illallahu wahdahu la sharika lah...", count: "1x" },
  { id: "ayatul-kursi", text: "Ayatul Kursi", count: "1x" }
];

const STORAGE_KEY = "rujooh-tracker-v1";

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function defaultState(date = new Date()) {
  return { date: dateKey(date), fard: {}, sunnah: {}, adhkar: {}, customAdhkar: [], customAdhkarDone: {} };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || saved.date !== dateKey()) return defaultState();
    return {
      ...defaultState(),
      ...saved,
      fard: saved.fard || {},
      sunnah: saved.sunnah || {},
      adhkar: saved.adhkar || {},
      customAdhkar: Array.isArray(saved.customAdhkar) ? saved.customAdhkar : [],
      customAdhkarDone: saved.customAdhkarDone || {}
    };
  } catch (error) {
    console.error("Could not load rujooh data:", error);
    return defaultState();
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

function createHijriFormatter(locale, options, date) {
  for (const calendar of ["islamic-umalqura", "islamic"]) {
    try {
      const formatter = new Intl.DateTimeFormat(locale, { ...options, calendar });
      const validationFormatter = new Intl.DateTimeFormat("en", { ...options, calendar });
      const year = Number(validationFormatter.formatToParts(date).find(part => part.type === "year")?.value);
      const gregorianYear = date.getFullYear();
      if (
        formatter.resolvedOptions().calendar === calendar
        && validationFormatter.resolvedOptions().calendar === calendar
        && year >= gregorianYear - 700
        && year <= gregorianYear - 500
      ) {
        return formatter;
      }
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  throw new RangeError("This browser does not support an Islamic calendar.");
}

function useHijriDate(now) {
  const options = { day: "numeric", month: "long", year: "numeric" };
  try {
    return {
      arabic: createHijriFormatter("ar-SA", options, now).format(now),
      english: createHijriFormatter("en", options, now).format(now)
    };
  } catch (error) {
    console.error("Could not format the Hijri date:", error);
    return { arabic: "Hijri date is not available.", english: "Hijri date is not available." };
  }
}

function PrayerCard({ prayer, active, upcoming, time, state, onToggle, onAddAdhkar }) {
  const completedSunnah = prayer.sunnah.filter(item => state.sunnah[item.id]).length;
  const prayerDhikr = state.customAdhkar.filter(item => item.prayerId === prayer.id);

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
    <article className={`prayer-card ${active ? "current-prayer" : ""} ${upcoming && !active ? "upcoming-prayer" : ""}`} id={`prayer-${prayer.id}`}>
      <div className="prayer-header">
        <div className="prayer-title">
          <div className="prayer-icon">{prayer.icon}</div>
          <div>
            <h3>
              {prayer.name}{" "}
              {active && <span className="prayer-status">Current period</span>}
              {upcoming && !active && <span className="prayer-status">Up next</span>}
            </h3>
            <small lang="ar" dir="rtl">{prayer.arabic}</small>
            {time && <small className="prayer-time">{formatTime(time)}</small>}
          </div>
        </div>
        <button
          className={`check-btn ${state.fard[prayer.id] ? "done" : ""}`}
          onClick={() => onToggle("fard", prayer.id)}
          aria-label={`Mark ${prayer.name} fard as complete`}
        >✓</button>
      </div>
      <div className="subsection">
        <div className="subsection-title"><span>Sunnah</span><span>{completedSunnah}/{prayer.sunnah.length}</span></div>
        <div className="sunnah-row">
          {prayer.sunnah.map(item => (
            <button
              className={`sunnah-chip ${state.sunnah[item.id] ? "done" : ""}`}
              key={item.id}
              onClick={() => onToggle("sunnah", item.id)}
            >{state.sunnah[item.id] ? "✓ " : ""}{item.label}</button>
          ))}
        </div>
      </div>
      <div className="subsection prayer-adhkar">
        <div className="subsection-title"><span>My {prayer.name} adhkar</span><span>{prayerDhikr.length}</span></div>
        {prayerDhikr.map(item => (
          <div className={`custom-dhikr ${state.customAdhkarDone[item.id] ? "done" : ""}`} key={item.id}>
            <span>{item.text} <small>{item.count}</small></span>
            <button
              className={`dhikr-check ${state.customAdhkarDone[item.id] ? "done" : ""}`}
              onClick={() => onToggle("customAdhkarDone", item.id)}
              aria-label="Mark adhkar complete"
            >✓</button>
          </div>
        ))}
        <form className="add-dhikr-form" onSubmit={handleAdd}>
          <label className="visually-hidden" htmlFor={`dhikr-text-${prayer.id}`}>Adhkar text</label>
          <textarea
            id={`dhikr-text-${prayer.id}`}
            name="text"
            placeholder="Adhkar"
            required
            maxLength="5000"
            rows="3"
            dir="auto"
          />
          <label className="visually-hidden" htmlFor={`dhikr-count-${prayer.id}`}>Count or note</label>
          <input id={`dhikr-count-${prayer.id}`} name="count" placeholder="Count (optional)" maxLength="24" />
          <button className="add-dhikr-btn" type="submit">Add</button>
        </form>
      </div>
    </article>
  );
}

function App() {
  const [state, setState] = useState(loadState);
  const [now, setNow] = useState(() => new Date());
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Allow location access to calculate approximate times on this device.");
  const [requestingLocation, setRequestingLocation] = useState(false);
  const locationRequestedOnLoad = useRef(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const hijriDate = useHijriDate(now);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save rujooh data:", error);
    }
  }, [state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = new Date();
      setNow(current);
      setState(previous => previous.date === dateKey(current) ? previous : defaultState(current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const schedule = useMemo(() => {
    if (!coordinates) return null;
    const today = calculatePrayerTimes(now, coordinates.latitude, coordinates.longitude);
    const todayPrayers = prayers.map((prayer, index) => ({ ...prayer, index, time: today[prayer.id] }))
      .filter(item => item.time)
      .sort((left, right) => left.time - right.time);
    const upcomingToday = todayPrayers.find(item => item.time > now);
    let upcoming = upcomingToday;
    if (!upcoming) {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const tomorrowFajr = calculatePrayerTimes(tomorrow, coordinates.latitude, coordinates.longitude).fajr;
      upcoming = tomorrowFajr ? { ...prayers[0], time: tomorrowFajr } : null;
    }
    const previous = [...todayPrayers].reverse().find(item => item.time <= now);
    const current = previous && previous.id !== upcoming?.id ? previous : null;
    return { times: today, upcoming, current };
  }, [coordinates, Math.floor(now.getTime() / 60000)]);

  function toggle(type, id) {
    setState(previous => ({
      ...previous,
      [type]: { ...previous[type], [id]: !previous[type][id] }
    }));
  }

  function addPrayerAdhkar(prayerId, text, count) {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setState(previous => ({
      ...previous,
      customAdhkar: [...previous.customAdhkar, { id, prayerId, text, count }]
    }));
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser.");
      return;
    }
    setRequestingLocation(true);
    setLocationStatus("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      position => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("Times calculated locally using your device location.");
        setRequestingLocation(false);
      },
      error => {
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

  const dhikrDone = adhkar.filter(item => state.adhkar[item.id]).length
    + state.customAdhkar.filter(item => state.customAdhkarDone[item.id]).length;
  const totalDhikr = adhkar.length + state.customAdhkar.length;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const elapsedPercent = Math.min(100, Math.max(0, Math.floor((now.getTime() - startOfDay) / (endOfDay - startOfDay) * 100)));

  let orderedPrayers = [...prayers];
  const priorityPrayer = schedule?.current || schedule?.upcoming;
  if (priorityPrayer) {
    const index = orderedPrayers.findIndex(prayer => prayer.id === priorityPrayer.id);
    if (index >= 0) orderedPrayers = [...orderedPrayers.slice(index), ...orderedPrayers.slice(0, index)];
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">ر</div>
          <div><h1>Rujooh</h1><p>Return to Salah.</p></div>
        </div>
        <div className="header-tools">
          <div className="header-prayer-info" aria-live="polite">
            <div className="header-next-prayer">
              <span className="header-label">Next prayer</span>
              <strong>{schedule?.upcoming
                ? `${schedule.upcoming.name} · ${formatTime(schedule.upcoming.time)}`
                : "Allow location to calculate"}</strong>
            </div>
            <div className="header-location">
              <span className="header-label">Location</span>
              <strong>{coordinates
                ? `${coordinates.latitude.toFixed(2)}°, ${coordinates.longitude.toFixed(2)}°`
                : "Not detected"}</strong>
            </div>
            <button className="location-button" type="button" onClick={requestLocation} disabled={requestingLocation}>
              {requestingLocation ? "Getting location…" : coordinates ? "Update location" : "Use my location"}
            </button>
            <small className="header-location-status">{locationStatus}</small>
          </div>
          <div className="profile-control">
            <button
              className="progress-ring header-progress"
              type="button"
              aria-label={`Day ${elapsedPercent}% elapsed. Show profile`}
              aria-expanded={profileOpen}
              aria-controls="profilePopover"
              style={{ "--day-progress": `${elapsedPercent * 3.6}deg` }}
              onClick={() => setProfileOpen(open => !open)}
            >
              <strong>{elapsedPercent}%</strong>
              <span>day elapsed</span>
            </button>
            {profileOpen && (
              <section className="profile-popover" id="profilePopover" aria-label="Profile">
                <div className="profile-popover-heading">
                  <strong>Profile</strong>
                  <button type="button" className="profile-close" onClick={() => setProfileOpen(false)} aria-label="Close profile">×</button>
                </div>
                <p>Your Rujooh tracker is saved privately in this browser.</p>
                <small>{coordinates
                  ? `Prayer times are calculated locally for ${coordinates.latitude.toFixed(2)}°, ${coordinates.longitude.toFixed(2)}°.`
                  : "Allow location access to calculate your local prayer times."}</small>
              </section>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <section className="today-strip" aria-label="Today's date and time">
          <div className="today-dates today-gregorian-side">
            <p className="today-gregorian">{new Intl.DateTimeFormat(undefined, {
              weekday: "long", day: "numeric", month: "long", year: "numeric"
            }).format(now)}</p>
            <p className="today-clock">{new Intl.DateTimeFormat(undefined, {
              hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short"
            }).format(now)}</p>
          </div>
          <div className="today-dates today-hijri-side">
            <p className="today-hijri" lang="ar" dir="rtl">{hijriDate.arabic}</p>
            {/* <p className="today-hijri-english">{hijriDate.english}</p> */}
          </div>
        </section>

        <section className="prayer-list" aria-label="Prayer tracker">
          {orderedPrayers.map(prayer => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              active={schedule?.current?.id === prayer.id}
              upcoming={schedule?.upcoming?.id === prayer.id}
              time={schedule?.times[prayer.id]}
              state={state}
              onToggle={toggle}
              onAddAdhkar={addPrayerAdhkar}
            />
          ))}
        </section>

        <section className="adhkar-section">
          <div className="section-heading">
            <div><p className="eyebrow">Daily remembrance</p><h2>Adhkar</h2></div>
            <span className="badge">{dhikrDone} / {totalDhikr}</span>
          </div>
          <div className="adhkar-list">
            {adhkar.map((item, index) => (
              <div className={`dhikr-row ${state.adhkar[item.id] ? "done" : ""}`} key={item.id}>
                <span className="dhikr-number">{String(index + 1).padStart(2, "0")}</span>
                <div><div className="dhikr-text">{item.text}</div><div className="dhikr-count">{item.count}</div></div>
                <button
                  className={`dhikr-check ${state.adhkar[item.id] ? "done" : ""}`}
                  onClick={() => toggle("adhkar", item.id)}
                  aria-label={`Mark ${item.text} complete`}
                >✓</button>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <p>rujooh • A simple personal salah tracker</p>
          <small>Your tracker stays in this browser. Location is used only on this device to calculate prayer times.</small>
        </footer>
      </main>
    </>
  );
}

export default App;
