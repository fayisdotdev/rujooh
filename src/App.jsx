import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
  { id: "tahajjud", prayerId: "fajr", label: "Tahajjud", hint: "Night prayer" },
  { id: "witr", prayerId: "isha", label: "Witr", hint: "Night prayer" }
];

const adhkarGuide = [
  {
    id: "after-prayer",
    label: "After prayer",
    hint: "After each of the five fard prayers",
    items: [
      {
        id: "guide-istighfar",
        title: "Seek forgiveness",
        arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ",
        transliteration: "Astaghfirullah al-'Azim",
        meaning: "I seek forgiveness from Allah, the Magnificent.",
        target: 3
      },
      {
        id: "guide-salam-worship",
        title: "Peace and help in worship",
        arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ وَإِلَيْكَ يَرْجِعُ السَّلَامُ، حَيِّنَا رَبَّنَا بِالسَّلَامِ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ\nاللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ وَتَوْفِيقِ طَاعَتِكَ وَإِيمَانِكَ يَا اللَّهُ\nاللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْجُبْنِ وَأَعُوذُ بِكَ مِنَ الْبُخْلِ وَأَعُوذُ بِكَ مِنْ أَرْذَلِ الْعُمُرِ وَأَعُوذُ بِكَ مِنْ فِتْنَةِ الدُّنْيَا وَعَذَابِ الْقَبْرِ",
        transliteration: "Allāhumma antas-salām wa minkas-salām wa ilayka yarji'us-salām, ḥayyinā rabbanā bis-salām, tabārakta rabbanā wa ta'ālayta yā dhal-jalāli wal-ikrām.\nAllāhumma a'innī 'alā dhikrika wa shukrika wa ḥusni 'ibādatika wa tawfīqi ṭā'atika wa īmānika yā Allāh.\nAllāhumma innī a'ūdhu bika minal-jubni wa a'ūdhu bika minal-bukhli wa a'ūdhu bika min ardhali al-'umuri wa a'ūdhu bika min fitnatid-dunyā wa 'adhābil-qabr.",
        meaning: "O Allah, You are Peace and from You comes peace, and to You peace returns; grant us life, our Lord, in peace. Blessed are You, our Lord, and Exalted, O Possessor of Majesty and Honor.\nO Allah, help me to remember You, thank You, worship You well, and grant me success in obeying You and holding firm to faith in You, O Allah.\nO Allah, I seek refuge in You from cowardice, stinginess, reaching the feeblest stage of old age, the trials of this world, and the punishment of the grave.",
        target: 1
      },
      {
        id: "guide-tasbih",
        title: "Tasbih",
        arabic: "سُبْحَانَ اللَّهِ",
        transliteration: "SubhanAllah — Glory be to Allah.",
        meaning: "The guide gives 33 repetitions.",
        target: 33
      },
      {
        id: "guide-tahmid",
        title: "Praise Allah",
        arabic: "الْحَمْدُ لِلَّهِ",
        transliteration: "Alhamdulillah — All praise is for Allah.",
        meaning: "The guide gives 33 repetitions.",
        target: 33
      },
      {
        id: "guide-takbir",
        title: "Magnify Allah",
        arabic: "اللَّهُ أَكْبَرُ",
        transliteration: "Allahu Akbar — Allah is the Greatest.",
        meaning: "The guide gives 33 repetitions (some narrations say 34).",
        target: 33
      },
      {
        id: "guide-complete-hundred",
        title: "Complete the hundred",
        arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
        meaning: "There is no god but Allah alone, with no partner. His is the dominion and praise, and He has power over all things.",
        target: 1
      },
      {
        id: "guide-ayatul-kursi",
        title: "Ayat al-Kursi · Quran 2:255",
        arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        transliteration: "Allahu la ilaha illa huwa, al-Hayyu al-Qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fi as-samawati wa ma fil-ard. Man dha alladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum. Wa la yuhituna bi shay'in min 'ilmihi illa bima sha'a. Wasi'a kursiyyuhu as-samawati wal-ard. Wa la ya'uduhu hifdhuhuma. Wa huwal-'Aliyyul-'Azim.",
        meaning: "Allah, there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Seat extends over the heavens and the earth, and preserving them does not burden Him. And He is the Most High, the Most Great.",
        target: 1
      }
    ]
  },
  {
    id: "fajr",
    label: "Fajr & morning",
    hint: "After Fajr, then morning remembrance",
    items: [
      {
        id: "guide-fajr-maghrib-tahlil",
        title: "La ilaha illallah wahdahu",
        arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, yuhyi wa yumit, wa huwa 'ala kulli shay'in qadir",
        meaning: "There is no god but Allah alone, with no partner. His is the dominion and praise; He gives life and causes death, and has power over all things.",
        target: 10,
        note: "The guide places this after Fajr and Maghrib fard, before moving or speaking."
      },
      {
        id: "guide-protection-from-fire",
        title: "Ask for protection from the Fire",
        arabic: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
        transliteration: "Allahumma ajirni minan-nar",
        meaning: "O Allah, protect me from the Fire.",
        target: 7,
        note: "The guide notes that scholars differ about the grading of this narration."
      },
      {
        id: "guide-fajr-dua",
        title: "Ask for beneficial knowledge and provision",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
        transliteration: "Allahumma inni as'aluka 'ilman nafi'a, wa rizqan tayyiba, wa 'amalan mutaqabbala",
        meaning: "O Allah, I ask You for beneficial knowledge, good and lawful provision, and deeds that are accepted.",
        target: 1
      },
      {
        id: "guide-morning-praise",
        title: "Morning praise",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        transliteration: "Subhanallahi wa bihamdihi, 'adada khalqihi, wa rida nafsihi, wa zinata 'arshihi, wa midada kalimatihi",
        meaning: "Glory be to Allah and praise be to Him, as many times as the number of His creation, as much as pleases Him, as heavy as His Throne, and as much as the ink of His words.",
        target: 3
      },
      {
        id: "guide-raditu",
        title: "Affirm contentment",
        arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا",
        transliteration: "Raditu billahi rabba, wa bil-Islami dina, wa bi-Muhammadin sallallahu 'alayhi wa sallama nabiyya",
        meaning: "I am pleased with Allah as my Lord, Islam as my religion, and Muhammad ﷺ as my Prophet.",
        target: 3
      },
      {
        id: "guide-dua-good-ending",
        title: "Ask for a good ending",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ حُسْنَ الْخَاتِمَةِ",
        transliteration: "Allahumma inni as'aluka husnal-khatimah",
        meaning: "O Allah, I ask You for a good ending to my life.",
        target: 1,
        note: "One of the personal duas suggested in the guide."
      },
      {
        id: "guide-dua-wellbeing",
        title: "Ask for wellbeing",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ حُسْنَ الْعَافِيَةِ",
        transliteration: "Allahumma inni as'aluka husna al-'afiyah",
        meaning: "O Allah, I ask You for the best of well-being.",
        target: 1
      },
      {
        id: "guide-dua-paradise",
        title: "Ask for Paradise",
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ",
        transliteration: "Allahumma inni as'alukal-jannah",
        meaning: "O Allah, I ask You for Paradise.",
        target: 1
      },
      {
        id: "guide-dua-firm-heart",
        title: "Ask for steadfastness",
        arabic: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَىٰ دِينِكَ",
        transliteration: "Ya muqallibal-qulub, thabbit qalbi 'ala dinik",
        meaning: "O Turner of hearts, keep my heart firm on Your religion.",
        target: 1
      },
      {
        id: "guide-dua-parents",
        title: "Pray for your parents",
        arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ",
        transliteration: "Rabbighfir li wa li-walidayya",
        meaning: "My Lord, forgive me and my parents. (Quran 71:28)",
        target: 1
      }
    ]
  },
  {
    id: "maghrib",
    label: "Maghrib",
    hint: "After Maghrib fard, before moving or speaking",
    items: [
      {
        id: "guide-maghrib-tahlil",
        title: "La ilaha illallah wahdahu",
        arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, yuhyi wa yumit, wa huwa 'ala kulli shay'in qadir",
        meaning: "There is no god but Allah alone, with no partner. His is the dominion and praise; He gives life and causes death, and has power over all things.",
        target: 10,
        note: "Read this before moving or speaking, then continue with the after-prayer adhkar."
      },
      {
        id: "guide-maghrib-protection",
        title: "Ask for protection from the Fire",
        arabic: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
        transliteration: "Allahumma ajirni minan-nar",
        meaning: "O Allah, protect me from the Fire.",
        target: 7,
        note: "The guide notes that scholars differ about the grading of this narration."
      }
    ]
  },
  {
    id: "friday",
    label: "Friday",
    hint: "Salawat and Surah Al-Kahf",
    items: [
      {
        id: "guide-friday-salawat",
        title: "Send blessings upon the Prophet ﷺ",
        transliteration: "Allahumma salli wa sallim 'ala rasulika sayyidina Muhammadin sayyidil-awwalin. Allahumma salli wa sallim 'ala rasulika sayyidina Muhammadin sayyidil-akhirin. Allahumma salli wa sallim 'ala rasulika sayyidina Muhammadin sayyidil-mala'il-a'la ila yawmid-din.",
        meaning: "O Allah, send blessings and peace upon Your Messenger, our master Muhammad, the master of the first and last generations, and the highest assembly until the Day of Judgement.",
        target: null,
        note: "The guide recommends increasing salawat throughout Friday; this is a customary wording."
      },
      {
        id: "guide-friday-kahf",
        title: "Read Surah Al-Kahf",
        transliteration: "The guide recommends reading Surah Al-Kahf on Friday.",
        meaning: "Open the source guide for its notes and references.",
        target: null
      }
    ]
  },
  {
    id: "before-sleep",
    label: "Before sleep",
    hint: "The last two verses of Al-Baqarah",
    items: [
      {
        id: "guide-last-verses",
        title: "Last two verses of Al-Baqarah · Quran 2:285–286",
        arabic: "آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ ۚ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ\nلَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
        transliteration: "Amana ar-rasulu bima unzila ilayhi min rabbihi wal-mu'minun. Kullun amana billahi wa mala'ikatihi wa kutubihi wa rusulih. La nufarriqu bayna ahadin min rusulih. Wa qalu sami'na wa ata'na, ghufranaka rabbana wa ilaykal-masir.\nLa yukallifu Allahu nafsan illa wus'aha. Laha ma kasabat wa 'alayha mak-tasabat. Rabbana la tu'akhidhna in nasina aw akhta'na. Rabbana wa la tahmil 'alayna isran kama hamaltahu 'ala alladhina min qablina. Rabbana wa la tuhammilna ma la taqata lana bih. Wa'fu 'anna waghfir lana warhamna. Anta mawlana fansurna 'alal-qawmil-kafirin.",
        meaning: "The Messenger believes in what was sent down to him from his Lord, and so do the believers. Each one believes in Allah, His angels, His books, and His messengers. \"We make no distinction between any of His messengers.\" And they say, \"We hear and we obey. Our Lord, grant us Your forgiveness, and to You is the final return.\"\nAllah does not burden a soul beyond its capacity. It gets what it has earned, and bears what it has brought upon itself. \"Our Lord, do not hold us accountable if we forget or make mistakes. Our Lord, do not place on us a burden like the one You placed on those before us. Our Lord, do not impose on us what we have no ability to bear. Pardon us, forgive us, and have mercy on us. You are our Protector, so grant us victory over the disbelieving people.\"",
        target: 1
      }
    ]
  }
];

const adhkarPdfUrl = `${import.meta.env.BASE_URL}adhkar-guide.pdf`;
const fardhIds = prayers.map((prayer) => prayer.id);
const statusOptions = [
  { id: "pending", label: "Pending" },
  { id: "on-time", label: "Done" },
  { id: "qadha", label: "Qadha" },
  { id: "jama", label: "Jama'" },
  { id: "qasr", label: "Qasr" },
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
  { id: "guide", label: "Adhkar", icon: "✦" },
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

function GuideDhikrCard({ item, count, done, onIncrement, onDecrement, onMark }) {
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const transliterationId = `guide-transliteration-${item.id}`;
  const translationId = `guide-translation-${item.id}`;
  const hasTextDetails = item.transliteration || item.meaning;

  return (
    <article className={`guide-item ${done ? "done" : ""}`}>
      <div className="guide-item-heading">
        <div>
          <h3>{item.title}</h3>
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

function PrayerCard({ prayer, day, habit, expanded, active, upcoming, time, sunnahPreference, onExpand, onStatusChange, onToggle }) {
  const sunnahItems = prayer.sunnah.filter((item) => item[sunnahPreference] > 0);
  const selectedSunnahCount = prayer.sunnah.reduce((total, item) => total + item[sunnahPreference], 0);
  const currentStatus = day.fardh[prayer.id] || "pending";
  const completed = isFulfilled(currentStatus);
  function cycleStatus() {
    const currentIndex = statusOptions.findIndex((option) => option.id === currentStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    onStatusChange(prayer.id, statusOptions[nextIndex].id);
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
              <small className="prayer-sunnah-summary">{selectedSunnahCount} rak'ah Sunnah</small>
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
          aria-label={`${expanded ? "Hide" : "Show"} ${prayer.name} Sunnah prayers`}
        >
          <span className={`expand-prayer-chevron ${expanded ? "open" : ""}`} aria-hidden="true" />
        </button>
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
          {habit && (
            <button
              className={`prayer-linked-habit ${day.habits[habit.id] ? "done" : ""}`}
              type="button"
              aria-pressed={Boolean(day.habits[habit.id])}
              onClick={() => onToggle("habits", habit.id)}
            >
              <span className="habit-check" aria-hidden="true">{day.habits[habit.id] ? "✓" : ""}</span>
              <span className="habit-copy"><strong>{habit.label}</strong><small>{habit.hint}</small></span>
              <span className="habit-state">{day.habits[habit.id] ? "Done" : "Mark done"}</span>
            </button>
          )}
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
  const [notice, setNotice] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);
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
    if (viewingToday && schedule?.current) setExpandedPrayer(schedule.current.id);
  }, [schedule?.current?.id, viewingToday]);

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
        {activeTab === "guide" && (
          <section aria-labelledby="guide-title" className="screen-section guide-screen">
            <div className="screen-heading">
              <p className="eyebrow">From your daily adhkar guide</p>
              <h1 id="guide-title">A dhikr at a time</h1>
              <p>{dateLabel} · Your counts are saved on this device for the selected day.</p>
            </div>
            <div className="guide-routine-tabs" aria-label="Choose an adhkar routine">
              {adhkarGuide.map((routine) => {
                const completed = routine.items.filter(guideItemDone).length;
                return (
                  <button
                    className={selectedGuideId === routine.id ? "selected" : ""}
                    type="button"
                    aria-pressed={selectedGuideId === routine.id}
                    key={routine.id}
                    onClick={() => setSelectedGuideId(routine.id)}
                  >
                    <strong>{routine.label}</strong>
                    <small>{completed}/{routine.items.length} done</small>
                  </button>
                );
              })}
            </div>
            {guideRoutines.map((routine) => {
              const completed = routine.items.filter(guideItemDone).length;
              return (
                <section className="guide-routine-card" aria-label={`${routine.label} adhkar`} key={routine.id}>
                  <div className="guide-routine-heading">
                    <div>
                      <p className="eyebrow">{routine.label}</p>
                      <h2>{routine.hint}</h2>
                    </div>
                    <button className="guide-reset-button" type="button" onClick={() => resetGuide(routine)}>
                      Reset set
                    </button>
                  </div>
                  <div
                    className="guide-progress-track"
                    role="progressbar"
                    aria-label={`${routine.label} adhkar completed`}
                    aria-valuenow={completed}
                    aria-valuemin={0}
                    aria-valuemax={routine.items.length}
                  >
                    <span style={{ width: `${(completed / routine.items.length) * 100}%` }} />
                  </div>
                  <div className="guide-items">
                    {routine.items.map((item) => (
                      <GuideDhikrCard
                        key={item.id}
                        item={item}
                        count={day.guideCounts[item.id] || 0}
                        done={guideItemDone(item)}
                        onIncrement={() => changeGuideCount(item.id, 1)}
                        onDecrement={() => changeGuideCount(item.id, -1)}
                        onMark={() => toggle("guideDone", item.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            <a className="guide-source-link" href={adhkarPdfUrl} target="_blank" rel="noreferrer">
              Open the complete 9-page source guide <span aria-hidden="true">↗</span>
            </a>
            <p className="guide-source-note">
              The PDF includes full Quranic passages, longer wording, meanings, references, and notes about customary additions and narrations to verify with a trusted teacher.
            </p>
          </section>
        )}

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
              <div><h2>Fardh prayers</h2><p>Tap a tile to cycle statuses. Use the dropdown to choose one. The arrow opens Sunnah and related habits.</p></div>
            </div>
            <section className="prayer-list" aria-label="Fardh prayers">
              {displayedPrayers.map((prayer) => (
                <PrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  day={day}
                  habit={nightPrayerHabits.find((item) => item.prayerId === prayer.id)}
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
