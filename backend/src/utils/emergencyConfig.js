const { pickI18n } = require('./i18nContent');

function normalizeContact(contact = {}) {
  const labelI18n = contact.labelI18n || {};
  const label = contact.label || labelI18n.tr || '';
  return {
    label,
    labelI18n: {
      tr: labelI18n.tr || label,
      en: labelI18n.en || '',
      de: labelI18n.de || '',
      ar: labelI18n.ar || '',
      es: labelI18n.es || '',
    },
    number: (contact.number || '').trim(),
    icon: contact.icon || 'call',
    order: contact.order ?? 0,
    active: contact.active !== false,
  };
}

function normalizeInfoSection(section = {}, index = 0) {
  const titleI18n = section.titleI18n || {};
  const bodyI18n = section.bodyI18n || {};
  const title = section.title || titleI18n.tr || '';
  const body = section.body || bodyI18n.tr || '';
  return {
    title,
    titleI18n: {
      tr: titleI18n.tr || title,
      en: titleI18n.en || '',
      de: titleI18n.de || '',
      ar: titleI18n.ar || '',
      es: titleI18n.es || '',
    },
    body,
    bodyI18n: {
      tr: bodyI18n.tr || body,
      en: bodyI18n.en || '',
      de: bodyI18n.de || '',
      ar: bodyI18n.ar || '',
      es: bodyI18n.es || '',
    },
    icon: section.icon || 'information-circle',
    order: section.order ?? index,
    enabled: section.enabled !== false,
  };
}

function syncI18nBlock(block, fields) {
  if (!block) return block;
  const o = { ...block };
  for (const field of fields) {
    const i18n = o[`${field}I18n`];
    if (i18n && typeof i18n === 'object' && i18n.tr) o[field] = i18n.tr;
  }
  return o;
}

function prepareEmergencyBody(body) {
  const out = { ...body };
  if (out.emergencyPage) {
    out.emergencyPage = syncI18nBlock(out.emergencyPage, ['title', 'subtitle', 'body']);
  }
  if (Array.isArray(out.emergencyInfoSections)) {
    out.emergencyInfoSections = out.emergencyInfoSections
      .map(normalizeInfoSection)
      .filter((s) => s.titleI18n.tr || s.bodyI18n.tr || s.title || s.body)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  if (Array.isArray(out.emergencyContacts)) {
    out.emergencyContacts = out.emergencyContacts
      .map(normalizeContact)
      .filter((c) => c.number || c.labelI18n.tr || c.label)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  return out;
}

function legacyInfoSections(config, lang) {
  const sections = [];
  const live = config.liveChat || {};
  const call = config.callSupport || {};
  const liveTitle = pickI18n(live.titleI18n, live.title, lang);
  const liveBody = pickI18n(live.subtitleI18n, live.subtitle, lang);
  if (live.enabled !== false && (liveTitle || liveBody)) {
    sections.push({ title: liveTitle, body: liveBody, icon: 'chatbubbles', order: 0 });
  }
  const callTitle = pickI18n(call.titleI18n, call.title, lang);
  const phone = (config.supportPhone || '').trim();
  if (call.enabled !== false && (callTitle || phone)) {
    const body = [callTitle, phone].filter(Boolean).join('\n\n');
    sections.push({ title: callTitle || phone, body, icon: 'call', order: 1 });
  }
  return sections;
}

function resolveInfoSections(config, lang) {
  const stored = (config.emergencyInfoSections || [])
    .filter((s) => s.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s) => ({
      title: pickI18n(s.titleI18n, s.title, lang),
      body: pickI18n(s.bodyI18n, s.body, lang),
      icon: s.icon || 'information-circle',
      order: s.order || 0,
    }))
    .filter((s) => s.title || s.body);

  if (stored.length) return stored;
  return legacyInfoSections(config, lang);
}

function buildPublicEmergency(config, lang) {
  const page = config.emergencyPage || {};

  const contacts = (config.emergencyContacts || [])
    .filter((c) => c.active !== false && (c.number || pickI18n(c.labelI18n, c.label, lang)))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((c) => ({
      label: pickI18n(c.labelI18n, c.label, lang),
      number: (c.number || '').trim(),
      icon: c.icon || 'call',
      order: c.order || 0,
    }));

  return {
    emergencyPage: {
      title: pickI18n(page.titleI18n, page.title, lang),
      subtitle: pickI18n(page.subtitleI18n, page.subtitle, lang),
      body: pickI18n(page.bodyI18n, page.body, lang),
    },
    emergencyInfoSections: resolveInfoSections(config, lang),
    emergencyContacts: contacts,
  };
}

module.exports = {
  prepareEmergencyBody,
  buildPublicEmergency,
  normalizeContact,
  normalizeInfoSection,
};
