export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function formatHijriDate(date, locale = "en") {
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

export function shiftDate(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

export function fullDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}
