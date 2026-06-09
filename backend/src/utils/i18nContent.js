const { SUPPORTED_LANGS } = require('../constants/locales');

const i18nSchemaFields = {
  tr: String,
  en: String,
  de: String,
  ar: String,
  es: String,
};

function resolveLang(req) {
  const raw = (req.query?.lang || req.user?.language || 'tr').toLowerCase();
  return SUPPORTED_LANGS.includes(raw) ? raw : 'tr';
}

function pickI18n(i18nObj, legacy, lang) {
  if (i18nObj && typeof i18nObj === 'object') {
    if (i18nObj[lang]) return i18nObj[lang];
    if (i18nObj.en) return i18nObj.en;
    if (i18nObj.tr) return i18nObj.tr;
    const first = SUPPORTED_LANGS.map((l) => i18nObj[l]).find(Boolean);
    if (first) return first;
  }
  return legacy || '';
}

function pickField(doc, field, lang) {
  const i18n = doc[`${field}I18n`];
  if (i18n && typeof i18n === 'object') {
    if (i18n[lang]) return i18n[lang];
    if (i18n.en) return i18n.en;
    if (i18n.tr) return i18n.tr;
    const first = SUPPORTED_LANGS.map((l) => i18n[l]).find(Boolean);
    if (first) return first;
  }
  const legacyEn = doc[`${field}En`];
  if (lang === 'en' && legacyEn) return legacyEn;
  return doc[field] ?? '';
}

function stripI18nFields(obj, fields) {
  for (const field of fields) {
    delete obj[`${field}I18n`];
    delete obj[`${field}En`];
  }
  return obj;
}

function localizeDoc(doc, lang, fields) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  for (const field of fields) {
    o[field] = pickField(o, field, lang);
  }
  return stripI18nFields(o, fields);
}

function localizeDocs(docs, lang, fields) {
  return docs.map((d) => localizeDoc(d, lang, fields));
}

/** Admin kaydında TR/EN legacy alanları senkron tutar */
function prepareI18nBody(body, fields) {
  const out = { ...body };
  for (const field of fields) {
    const i18n = out[`${field}I18n`];
    if (!i18n || typeof i18n !== 'object') continue;
    if (i18n.tr) out[field] = i18n.tr;
    if (i18n.en) out[`${field}En`] = i18n.en;
  }
  return out;
}

module.exports = {
  i18nSchemaFields,
  resolveLang,
  pickI18n,
  pickField,
  localizeDoc,
  localizeDocs,
  prepareI18nBody,
  SUPPORTED_LANGS,
};
