const SCHOOL_CITIES = [
  'sliema',
  'st_julians',
  'valletta',
  'gzira',
  'msida',
  'swieqi',
  'san_gwann',
  'st_pauls',
  'other',
];

const CITY_ALIASES = {
  "st. julian's": 'st_julians',
  'st julians': 'st_julians',
  "st julian's": 'st_julians',
  'st. julians': 'st_julians',
  'st_julians': 'st_julians',
  sliema: 'sliema',
  valletta: 'valletta',
  gzira: 'gzira',
  msida: 'msida',
  swieqi: 'swieqi',
  'san gwann': 'san_gwann',
  'san_gwann': 'san_gwann',
  "st paul's": 'st_pauls',
  'st pauls': 'st_pauls',
  'st_pauls': 'st_pauls',
  other: 'other',
};

function normalizeSchoolCity(value) {
  if (!value) return 'other';
  const raw = String(value).trim().toLowerCase();
  if (SCHOOL_CITIES.includes(raw)) return raw;
  if (CITY_ALIASES[raw]) return CITY_ALIASES[raw];

  const slug = raw
    .replace(/['.]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  if (SCHOOL_CITIES.includes(slug)) return slug;
  if (CITY_ALIASES[slug.replace(/_/g, ' ')]) return CITY_ALIASES[slug.replace(/_/g, ' ')];

  return 'other';
}

function prepareSchoolBody(body) {
  const out = { ...body };
  if (out.city != null) out.city = normalizeSchoolCity(out.city);
  return out;
}

module.exports = { SCHOOL_CITIES, normalizeSchoolCity, prepareSchoolBody };
