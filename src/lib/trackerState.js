import {
  dataStorageKey,
  fulfilledStatuses,
  fardhIds,
  legacySunnahIds,
  legacyStorageKey,
  statusOptions,
  sunnahPreferenceStorageKey
} from "../data/trackerConfig.js";
import { prayers } from "../data/prayers.js";
import { isValidDateKey } from "./dates.js";

export function emptyDay() {
  return { fardh: {}, sunnah: {}, adhkar: {}, customAdhkar: [], customAdhkarDone: {}, habits: {}, guideCounts: {}, guideDone: {} };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeBooleanMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, done]) => typeof done === "boolean"));
}

function normalizeCountMap(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, count]) => Number.isSafeInteger(count) && count >= 0));
}

export function normalizeDay(value) {
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
  const guideCounts = normalizeCountMap(value.guideCounts);
  if (guideCounts["guide-salam-worship"] === undefined
    && guideCounts["guide-salam"] >= 1
    && guideCounts["guide-dhikr-help"] >= 1) {
    guideCounts["guide-salam-worship"] = 1;
  }
  delete guideCounts["guide-salam"];
  delete guideCounts["guide-dhikr-help"];
  return {
    fardh,
    sunnah,
    adhkar: normalizeBooleanMap(value.adhkar),
    customAdhkar,
    customAdhkarDone: normalizeBooleanMap(value.customAdhkarDone),
    habits,
    guideCounts,
    guideDone: normalizeBooleanMap(value.guideDone)
  };
}

export function normalizeDays(value) {
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

export function migrateLegacyState(value) {
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

export function loadDays() {
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

export function loadSunnahPreference() {
  try {
    return localStorage.getItem(sunnahPreferenceStorageKey) === "maximum" ? "maximum" : "minimum";
  } catch (error) {
    console.error("Could not load Rujooh Sunnah preference:", error);
    return "minimum";
  }
}

export function isFulfilled(status) {
  return fulfilledStatuses.has(status);
}

export function sunnahCount(prayer, position, preference) {
  return prayer.sunnah.find((item) => item.position === position)?.[preference] || 0;
}
