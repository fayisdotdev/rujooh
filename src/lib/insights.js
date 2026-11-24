import { fardhIds } from "../data/trackerConfig.js";
import { dateKey, shiftDate } from "./dates.js";
import { isFulfilled, normalizeDay } from "./trackerState.js";

export function getStreak(days, today) {
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
