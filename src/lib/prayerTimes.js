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

export function calculatePrayerTimes(date, latitude, longitude) {
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

export function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}
