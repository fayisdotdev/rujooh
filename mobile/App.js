import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const STORAGE_KEY = "rujooh-tracker-v1";
const colors = {
  green950: "#063d32",
  green900: "#084d40",
  green800: "#0d5c4b",
  green100: "#e5f3ee",
  green50: "#f3faf7",
  cream: "#fbfaf5",
  ink: "#17231f",
  muted: "#6c7772",
  line: "#e2e8e4",
  gold: "#c49a42",
  white: "#ffffff"
};

const prayers = [
  { id: "fajr", name: "Fajr", arabic: "الفجر", sunnah: [{ id: "fajr-before", label: "2 rak'ah before Fajr" }] },
  { id: "dhuhr", name: "Dhuhr", arabic: "الظهر", sunnah: [{ id: "dhuhr-before-4", label: "4 rak'ah before Dhuhr" }, { id: "dhuhr-after-2", label: "2 rak'ah after Dhuhr" }] },
  { id: "asr", name: "Asr", arabic: "العصر", sunnah: [{ id: "asr-before-4", label: "4 rak'ah before Asr" }] },
  { id: "maghrib", name: "Maghrib", arabic: "المغرب", sunnah: [{ id: "maghrib-after-2", label: "2 rak'ah after Maghrib" }] },
  { id: "isha", name: "Isha", arabic: "العشاء", sunnah: [{ id: "isha-after-2", label: "2 rak'ah after Isha" }, { id: "witr", label: "Witr" }] }
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

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyState(date = new Date()) {
  return { date: dateKey(date), fard: {}, sunnah: {}, adhkar: {}, customAdhkar: [], customAdhkarDone: {} };
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
  return solarNoon + (morning ? -1 : 1) * degrees(Math.acos(cosine)) * 4;
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

function getHijriDate(date) {
  for (const calendar of ["islamic-umalqura", "islamic"]) {
    try {
      const options = { day: "numeric", month: "long", year: "numeric", calendar };
      const validationFormatter = new Intl.DateTimeFormat("en", options);
      const year = Number(validationFormatter.formatToParts(date).find(part => part.type === "year")?.value);
      if (
        validationFormatter.resolvedOptions().calendar === calendar
        && year >= date.getFullYear() - 700
        && year <= date.getFullYear() - 500
      ) {
        return {
          arabic: new Intl.DateTimeFormat("ar-SA", options).format(date),
          english: validationFormatter.format(date)
        };
      }
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
  return { arabic: "Hijri date unavailable", english: "Hijri date unavailable" };
}

function CheckButton({ checked, onPress, label }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.check, checked && styles.checkDone]}
    >
      <Text style={[styles.checkText, checked && styles.checkTextDone]}>{checked ? "✓" : ""}</Text>
    </Pressable>
  );
}

function App() {
  const [state, setState] = useState(() => emptyState());
  const [now, setNow] = useState(() => new Date());
  const [coordinates, setCoordinates] = useState(null);
  const [locationMessage, setLocationMessage] = useState("Location is used on this device to calculate prayer times.");
  const [locationBusy, setLocationBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState({});
  const [customCount, setCustomCount] = useState({});

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (!mounted || !saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.date !== dateKey(new Date())) return;
      setState({
        ...emptyState(),
        ...parsed,
        fard: parsed.fard || {},
        sunnah: parsed.sunnah || {},
        adhkar: parsed.adhkar || {},
        customAdhkar: Array.isArray(parsed.customAdhkar) ? parsed.customAdhkar : [],
        customAdhkarDone: parsed.customAdhkarDone || {}
      });
    }).catch(error => {
      console.error("Could not load Rujooh data:", error);
      setLocationMessage("Saved tracker data could not be loaded.");
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(error => {
      console.error("Could not save Rujooh data:", error);
      setLocationMessage("Tracker changes could not be saved on this device.");
    });
  }, [state, loading]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      setState(previous => previous.date === dateKey(current) ? previous : emptyState(current));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const schedule = useMemo(() => {
    if (!coordinates) return null;
    const times = calculatePrayerTimes(now, coordinates.latitude, coordinates.longitude);
    const ordered = prayers.map(prayer => ({ ...prayer, time: times[prayer.id] }))
      .filter(prayer => prayer.time)
      .sort((a, b) => a.time - b.time);
    const upcomingToday = ordered.find(prayer => prayer.time > now);
    const upcoming = upcomingToday || (() => {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const fajr = calculatePrayerTimes(tomorrow, coordinates.latitude, coordinates.longitude).fajr;
      return fajr ? { ...prayers[0], time: fajr } : null;
    })();
    const current = [...ordered].reverse().find(prayer => prayer.time <= now);
    return { times, upcoming, current: current && current.id !== upcoming?.id ? current : null };
  }, [coordinates, Math.floor(now.getTime() / 60000)]);

  async function requestLocation() {
    setLocationBusy(true);
    setLocationMessage("Getting your location…");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationMessage("Location permission was denied. Allow it in device settings to calculate prayer times.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocationMessage("Prayer times are calculated locally using your location.");
    } catch (error) {
      console.error("Could not get device location:", error);
      setLocationMessage("Could not get your location. Check location services and try again.");
    } finally {
      setLocationBusy(false);
    }
  }

  function toggle(type, id) {
    setState(previous => ({ ...previous, [type]: { ...previous[type], [id]: !previous[type][id] } }));
  }

  function addCustomAdhkar(prayerId) {
    const text = (customText[prayerId] || "").trim();
    if (!text) {
      Alert.alert("Add adhkar", "Enter the adhkar text first.");
      return;
    }
    const item = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prayerId,
      text,
      count: (customCount[prayerId] || "").trim()
    };
    setState(previous => ({ ...previous, customAdhkar: [...previous.customAdhkar, item] }));
    setCustomText(previous => ({ ...previous, [prayerId]: "" }));
    setCustomCount(previous => ({ ...previous, [prayerId]: "" }));
  }

  const doneCount = adhkar.filter(item => state.adhkar[item.id]).length
    + state.customAdhkar.filter(item => state.customAdhkarDone[item.id]).length;
  const totalCount = adhkar.length + state.customAdhkar.length;
  const elapsed = Math.floor((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 864);
  const hijriDate = getHijriDate(now);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green950} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandArabic}>ر</Text></View>
            <View><Text style={styles.brandName}>Rujooh</Text><Text style={styles.brandSubtitle}>Return to Salah.</Text></View>
            <View style={styles.elapsedBadge}><Text style={styles.elapsedNumber}>{elapsed}%</Text><Text style={styles.elapsedLabel}>day elapsed</Text></View>
          </View>
          <Text style={styles.headerInfo}>
            {schedule?.upcoming ? `Next prayer · ${schedule.upcoming.name} · ${formatTime(schedule.upcoming.time)}` : "Set your location to see prayer times"}
          </Text>
          <Text style={styles.headerLocation}>
            {coordinates ? `${coordinates.latitude.toFixed(2)}°, ${coordinates.longitude.toFixed(2)}°` : locationMessage}
          </Text>
          <Pressable style={[styles.locationButton, locationBusy && styles.disabledButton]} onPress={requestLocation} disabled={locationBusy}>
            <Text style={styles.locationButtonText}>{locationBusy ? "Getting location…" : coordinates ? "Update location" : "Use my location"}</Text>
          </Pressable>
        </View>

        <View style={styles.dateCard}>
          <View style={styles.dateColumn}>
            <Text style={styles.gregorianDate}>{new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now)}</Text>
            <Text style={styles.clock}>{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now)}</Text>
          </View>
          <View style={[styles.dateColumn, styles.hijriColumn]}>
            <Text style={styles.hijriDate} writingDirection="rtl">{hijriDate.arabic}</Text>
            <Text style={styles.hijriEnglish}>{hijriDate.english}</Text>
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>YOUR DAILY PRAYERS</Text>
        {prayers.map(prayer => {
          const isCurrent = schedule?.current?.id === prayer.id;
          const isUpcoming = schedule?.upcoming?.id === prayer.id;
          const prayerDhikr = state.customAdhkar.filter(item => item.prayerId === prayer.id);
          const completed = prayer.sunnah.filter(item => state.sunnah[item.id]).length;
          return (
            <View key={prayer.id} style={[styles.card, isCurrent && styles.currentCard]}>
              <View style={styles.prayerHeading}>
                <View style={styles.prayerHeadingText}>
                  <Text style={styles.prayerName}>{prayer.name}</Text>
                  <Text style={styles.prayerArabic}>{prayer.arabic}</Text>
                  {schedule?.times[prayer.id] && <Text style={styles.prayerTime}>{formatTime(schedule.times[prayer.id])}</Text>}
                </View>
                {(isCurrent || isUpcoming) && <Text style={styles.statusPill}>{isCurrent ? "Current" : "Up next"}</Text>}
                <CheckButton checked={!!state.fard[prayer.id]} onPress={() => toggle("fard", prayer.id)} label={`Mark ${prayer.name} fard complete`} />
              </View>
              <View style={styles.divider} />
              <View style={styles.subsectionTitle}>
                <Text style={styles.subsectionLabel}>Sunnah</Text><Text style={styles.countText}>{completed}/{prayer.sunnah.length}</Text>
              </View>
              <View style={styles.chipList}>
                {prayer.sunnah.map(item => (
                  <Pressable key={item.id} onPress={() => toggle("sunnah", item.id)} style={[styles.chip, state.sunnah[item.id] && styles.chipDone]}>
                    <Text style={[styles.chipText, state.sunnah[item.id] && styles.chipTextDone]}>{state.sunnah[item.id] ? "✓ " : ""}{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.customHeading}>
                <Text style={styles.subsectionLabel}>My {prayer.name} adhkar</Text><Text style={styles.countText}>{prayerDhikr.length}</Text>
              </View>
              {prayerDhikr.map(item => (
                <View key={item.id} style={styles.customRow}>
                  <Text style={[styles.customText, state.customAdhkarDone[item.id] && styles.doneText]}>{item.text}{item.count ? ` · ${item.count}` : ""}</Text>
                  <CheckButton checked={!!state.customAdhkarDone[item.id]} onPress={() => toggle("customAdhkarDone", item.id)} label="Mark custom adhkar complete" />
                </View>
              ))}
              <TextInput
                value={customText[prayer.id] || ""}
                onChangeText={value => setCustomText(previous => ({ ...previous, [prayer.id]: value }))}
                placeholder="Add your adhkar"
                placeholderTextColor={colors.muted}
                multiline
                style={styles.input}
              />
              <View style={styles.addRow}>
                <TextInput
                  value={customCount[prayer.id] || ""}
                  onChangeText={value => setCustomCount(previous => ({ ...previous, [prayer.id]: value }))}
                  placeholder="Count (optional)"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.countInput]}
                />
                <Pressable style={styles.addButton} onPress={() => addCustomAdhkar(prayer.id)}><Text style={styles.addButtonText}>Add</Text></Pressable>
              </View>
            </View>
          );
        })}

        <View style={styles.card}>
          <View style={styles.adhkarHeading}>
            <View><Text style={styles.sectionEyebrow}>DAILY REMEMBRANCE</Text><Text style={styles.sectionTitle}>Adhkar</Text></View>
            <Text style={styles.progressPill}>{doneCount} / {totalCount}</Text>
          </View>
          {adhkar.map((item, index) => (
            <View key={item.id} style={styles.dhikrRow}>
              <Text style={styles.dhikrNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={styles.dhikrCopy}><Text style={[styles.dhikrText, state.adhkar[item.id] && styles.doneText]}>{item.text}</Text><Text style={styles.dhikrCount}>{item.count}</Text></View>
              <CheckButton checked={!!state.adhkar[item.id]} onPress={() => toggle("adhkar", item.id)} label={`Mark ${item.text} complete`} />
            </View>
          ))}
        </View>
        <Text style={styles.footerText}>Your tracker is saved privately on this device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 36, gap: 14 },
  header: { backgroundColor: colors.white, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.line },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { height: 44, width: 44, borderRadius: 14, backgroundColor: colors.green900, justifyContent: "center", alignItems: "center" },
  brandArabic: { color: colors.white, fontSize: 27, fontWeight: "700" },
  brandName: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  brandSubtitle: { color: colors.muted, fontSize: 12 },
  elapsedBadge: { marginLeft: "auto", backgroundColor: colors.green50, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, alignItems: "center" },
  elapsedNumber: { color: colors.green900, fontSize: 18, fontWeight: "700" },
  elapsedLabel: { color: colors.muted, fontSize: 10 },
  headerInfo: { color: colors.green900, fontWeight: "700", fontSize: 14 },
  headerLocation: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  locationButton: { alignSelf: "flex-start", backgroundColor: colors.green50, borderColor: colors.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  disabledButton: { opacity: 0.6 },
  locationButtonText: { color: colors.green900, fontSize: 12, fontWeight: "600" },
  dateCard: { flexDirection: "row", backgroundColor: colors.green950, borderRadius: 18, padding: 16, gap: 12, justifyContent: "space-between" },
  dateColumn: { flex: 1, justifyContent: "center" },
  hijriColumn: { alignItems: "flex-end" },
  gregorianDate: { color: colors.white, fontSize: 14, fontWeight: "700" },
  clock: { marginTop: 4, color: colors.white, fontSize: 13 },
  hijriDate: { color: colors.white, fontSize: 14, fontWeight: "700" },
  hijriEnglish: { marginTop: 4, color: "#cbd9d3", fontSize: 11 },
  sectionEyebrow: { color: colors.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line },
  currentCard: { borderColor: colors.gold, borderWidth: 2 },
  prayerHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  prayerHeadingText: { flex: 1 },
  prayerName: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  prayerArabic: { color: colors.muted, fontSize: 14, marginTop: 1 },
  prayerTime: { color: colors.green900, fontSize: 12, fontWeight: "600", marginTop: 3 },
  statusPill: { color: colors.green900, backgroundColor: colors.green100, overflow: "hidden", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: "700" },
  check: { height: 34, width: 34, borderRadius: 11, borderWidth: 1.5, borderColor: colors.line, justifyContent: "center", alignItems: "center", backgroundColor: colors.white },
  checkDone: { backgroundColor: colors.green900, borderColor: colors.green900 },
  checkText: { fontSize: 18, color: colors.white },
  checkTextDone: { color: colors.white, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 13 },
  subsectionTitle: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  subsectionLabel: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  countText: { color: colors.muted, fontSize: 12 },
  chipList: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 10, paddingVertical: 7 },
  chipDone: { backgroundColor: colors.green100, borderColor: colors.green100 },
  chipText: { color: colors.muted, fontSize: 11 },
  chipTextDone: { color: colors.green900, fontWeight: "600" },
  customHeading: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, marginBottom: 7 },
  customRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  customText: { flex: 1, color: colors.ink, fontSize: 13 },
  doneText: { color: colors.muted, textDecorationLine: "line-through" },
  input: { minHeight: 42, borderRadius: 10, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9, color: colors.ink, fontSize: 13, marginTop: 8 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countInput: { flex: 1 },
  addButton: { backgroundColor: colors.green900, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11, marginTop: 8 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  adhkarHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { color: colors.ink, fontSize: 23, fontWeight: "700", marginTop: 3 },
  progressPill: { backgroundColor: colors.green100, color: colors.green900, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, fontSize: 12, fontWeight: "700", overflow: "hidden" },
  dhikrRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line },
  dhikrNumber: { color: colors.gold, fontSize: 13, fontWeight: "700" },
  dhikrCopy: { flex: 1 },
  dhikrText: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  dhikrCount: { color: colors.muted, fontSize: 11, marginTop: 3 },
  footerText: { color: colors.muted, fontSize: 11, textAlign: "center", paddingTop: 5 }
});

export default App;
