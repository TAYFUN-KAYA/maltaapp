/**
 * Malta & Akdeniz görselleri – Unsplash (ücretsiz kullanım, hotlink).
 * w=1200&q=85 ile optimize edilmiş URL'ler.
 */
const q = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=85&auto=format&fit=crop`;

const MALTA = {
  blueLagoon: q('1612506463051-4c4f4d45d05c'),
  comino: q('1566073771259-6a8506099945'),
  goldenBay: q('1507525428034-b723cf961d3e'),
  valletta: q('1584519331111-4d5dd0f9c410'),
  mdina: q('1555993533-9ad1c6a7a4c4'),
  gozo: q('1544551763-46a013bb70d5'),
  boat: q('1544551763-46a013bb70d5'),
  sunset: q('1506905925346-21bda4d32df4'),
  diving: q('1682687220062-90a0c8a2ab56'),
  jeep: q('1469851349717-1fb1b1d1f4f6'),
  food: q('1414235077428-338989a2e8c0'),
  school: q('1523050854058-8df90110c9f1'),
  classroom: q('1503676260728-1c00da094a0b'),
  sliema: q('1516026672272-bcad1217a81d'),
  stJulians: q('1519046900754-79e4b14af06a'),
  party: q('1514525253161-7a46e19b9a77'),
  cliffs: q('1506905925346-21bda4d32df4'),
  harbour: q('1555884980-f8a948d0b42f'),
  market: q('1559339352-11d035aa6e90'),
  genericBeach: q('1507525428034-b723cf961d3e'),
};

const beachImages = {
  'blue-lagoon': [MALTA.blueLagoon, MALTA.comino],
  'golden-bay': [MALTA.goldenBay, MALTA.genericBeach],
  ghadira: [MALTA.goldenBay, MALTA.genericBeach],
  'st-peters-pool': [MALTA.cliffs, MALTA.comino],
  'ramla-bay': [MALTA.gozo, MALTA.goldenBay],
  popeye: [MALTA.harbour, MALTA.stJulians],
  'paradise-bay': [MALTA.comino, MALTA.blueLagoon],
  'pretty-bay': [MALTA.harbour, MALTA.genericBeach],
  'mellieha-bay': [MALTA.goldenBay, MALTA.genericBeach],
  'st-georges': [MALTA.stJulians, MALTA.party],
  balluta: [MALTA.sliema, MALTA.stJulians],
  armier: [MALTA.comino, MALTA.blueLagoon],
  anchor: [MALTA.harbour, MALTA.stJulians],
  gnejna: [MALTA.cliffs, MALTA.goldenBay],
  'fomm-rih': [MALTA.cliffs, MALTA.comino],
  'st-thomas': [MALTA.harbour, MALTA.genericBeach],
  'kalanka-bay': [MALTA.cliffs, MALTA.comino],
  xlendi: [MALTA.gozo, MALTA.sunset],
  'san-blas': [MALTA.gozo, MALTA.goldenBay],
  hondoq: [MALTA.gozo, MALTA.blueLagoon],
  'mgarr-xini': [MALTA.gozo, MALTA.cliffs],
  'crystal-lagoon': [MALTA.blueLagoon, MALTA.comino],
  'comino-bay': [MALTA.comino, MALTA.blueLagoon],
  qawra: [MALTA.harbour, MALTA.stJulians],
  sliema: [MALTA.sliema, MALTA.stJulians],
  bugibba: [MALTA.harbour, MALTA.sliema],
};

const tourImagesByCategory = {
  boat: [MALTA.boat, MALTA.blueLagoon, MALTA.comino],
  day_trip: [MALTA.gozo, MALTA.valletta],
  history: [MALTA.valletta, MALTA.mdina, MALTA.harbour],
  jeep: [MALTA.jeep, MALTA.cliffs],
  diving: [MALTA.diving, MALTA.comino],
  water_sports: [MALTA.genericBeach, MALTA.goldenBay],
  sunset: [MALTA.sunset, MALTA.boat],
  private_charter: [MALTA.boat, MALTA.blueLagoon],
  food_wine: [MALTA.food, MALTA.market],
  student_party: [MALTA.party, MALTA.boat],
  language_exchange: [MALTA.stJulians, MALTA.sliema],
  culture: [MALTA.valletta, MALTA.mdina],
};

const schoolImagesByCity = {
  st_julians: [MALTA.stJulians, MALTA.classroom, MALTA.school],
  sliema: [MALTA.sliema, MALTA.classroom, MALTA.school],
  valletta: [MALTA.valletta, MALTA.classroom, MALTA.school],
  gzira: [MALTA.sliema, MALTA.classroom],
  msida: [MALTA.school, MALTA.classroom],
  swieqi: [MALTA.stJulians, MALTA.school],
  san_gwann: [MALTA.school, MALTA.classroom],
  st_pauls: [MALTA.goldenBay, MALTA.school],
  other: [MALTA.school, MALTA.classroom, MALTA.valletta],
};

function beachMedia(slug) {
  return beachImages[slug] || [MALTA.genericBeach, MALTA.blueLagoon];
}

function tourMedia(category, title) {
  const pool = tourImagesByCategory[category] || [MALTA.valletta, MALTA.genericBeach];
  const cover = pool[0];
  const images = [...pool];
  if (title?.toLowerCase().includes('blue lagoon')) images.unshift(MALTA.blueLagoon);
  if (title?.toLowerCase().includes('gozo')) images.unshift(MALTA.gozo);
  return { cover, images: [...new Set(images)].slice(0, 4) };
}

function schoolMedia(city, slug) {
  const pool = schoolImagesByCity[city] || schoolImagesByCity.other;
  const variant = slug.length % pool.length;
  return {
    logo: pool[0],
    images: [pool[variant], pool[(variant + 1) % pool.length], MALTA.classroom],
  };
}

function insightImage(index) {
  const pool = [MALTA.blueLagoon, MALTA.valletta, MALTA.gozo, MALTA.stJulians, MALTA.sunset];
  return pool[index % pool.length];
}

function articleImage(category) {
  const map = {
    transport: MALTA.harbour,
    food: MALTA.food,
    practical: MALTA.valletta,
    attraction: MALTA.mdina,
    beach: MALTA.goldenBay,
    seasonal: MALTA.sunset,
  };
  return map[category] || MALTA.valletta;
}

function eventImage(type) {
  const map = {
    language_exchange: MALTA.classroom,
    party: MALTA.party,
    meetup: MALTA.valletta,
    cultural: MALTA.mdina,
  };
  return map[type] || MALTA.stJulians;
}

module.exports = { MALTA, beachMedia, tourMedia, schoolMedia, insightImage, articleImage, eventImage };
