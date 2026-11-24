import { prayers } from "./prayers.js";

export const fardhIds = prayers.map((prayer) => prayer.id);
export const statusOptions = [
  { id: "pending", label: "Pending" },
  { id: "on-time", label: "Done" },
  { id: "qadha", label: "Qadha" },
  { id: "jama", label: "Jama'" },
  { id: "qasr", label: "Qasr" },
  { id: "missed", label: "Missed" }
];
export const fulfilledStatuses = new Set(["on-time", "jama", "qasr"]);
export const statusLabels = Object.fromEntries(statusOptions.map((option) => [option.id, option.label]));
export const dataStorageKey = "rujooh-tracker-v2";
export const legacyStorageKey = "rujooh-tracker-v1";
export const themeStorageKey = "rujooh-theme-v1";
export const sunnahPreferenceStorageKey = "rujooh-sunnah-preference-v1";
export const legacySunnahIds = {
  "dhuhr-before-4": "dhuhr-before",
  "dhuhr-after-2": "dhuhr-after",
  "asr-before-4": "asr-before",
  "maghrib-after-2": "maghrib-after",
  "isha-after-2": "isha-after"
};
export const tabs = [
  { id: "today", label: "Today", icon: "◷" },
  { id: "guide", label: "Adhkar", icon: "✦" },
  { id: "month", label: "Month", icon: "▦" },
  { id: "insights", label: "Insights", icon: "⌁" },
  { id: "settings", label: "Settings", icon: "⚙" }
];
