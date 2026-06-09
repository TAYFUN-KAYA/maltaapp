/** Mobil ile aynı içerik dilleri */
export const CONTENT_LANGS = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
] as const;

export type ContentLangCode = (typeof CONTENT_LANGS)[number]['code'];

export type I18nRecord = Partial<Record<ContentLangCode, string>>;

export function emptyI18n(): I18nRecord {
  return { tr: '', en: '', de: '', ar: '', es: '' };
}

/** Mevcut kayıttan form için çok dilli alan doldurur */
export function i18nFromDoc(
  doc: Record<string, unknown> | undefined,
  field: string
): I18nRecord {
  const i18n = (doc?.[`${field}I18n`] as I18nRecord) || {};
  const legacyEn = doc?.[`${field}En`] as string | undefined;
  return {
    tr: i18n.tr || (doc?.[field] as string) || '',
    en: i18n.en || legacyEn || '',
    de: i18n.de || '',
    ar: i18n.ar || '',
    es: i18n.es || '',
  };
}
