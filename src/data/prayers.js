export const prayers = [
  { id: "fajr", name: "Fajr", arabic: "الفجر", sunnah: [{ id: "fajr-before", position: "before", minimum: 2, maximum: 2 }] },
  { id: "dhuhr", name: "Dhuhr", arabic: "الظهر", sunnah: [{ id: "dhuhr-before", position: "before", minimum: 2, maximum: 4 }, { id: "dhuhr-after", position: "after", minimum: 2, maximum: 4 }] },
  { id: "asr", name: "Asr", arabic: "العصر", sunnah: [{ id: "asr-before", position: "before", minimum: 0, maximum: 4 }] },
  { id: "maghrib", name: "Maghrib", arabic: "المغرب", sunnah: [{ id: "maghrib-before", position: "before", minimum: 0, maximum: 2 }, { id: "maghrib-after", position: "after", minimum: 2, maximum: 2 }] },
  { id: "isha", name: "Isha", arabic: "العشاء", sunnah: [{ id: "isha-before", position: "before", minimum: 0, maximum: 2 }, { id: "isha-after", position: "after", minimum: 2, maximum: 4 }] }
];

export const dailyHabits = [
  { id: "quran", label: "Quran recitation", hint: "Read or reflect today" }
];
export const nightPrayerHabits = [
  { id: "tahajjud", prayerId: "fajr", label: "Tahajjud", hint: "Night prayer" },
  { id: "witr", prayerId: "isha", label: "Witr", hint: "Night prayer" }
];
