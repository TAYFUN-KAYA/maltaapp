import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { LocalizedFields } from '../components/LocalizedFields';
import { emptyI18n, i18nFromDoc, type I18nRecord } from '../lib/contentLocales';

const CONTACT_ICONS = ['call', 'shield', 'medkit', 'flag', 'headset'] as const;
const SECTION_ICONS = [
  'information-circle',
  'alert-circle',
  'document-text',
  'medkit',
  'shield',
  'call',
] as const;

type Contact = {
  label: string;
  labelI18n: I18nRecord;
  number: string;
  icon: string;
  order: number;
  active: boolean;
};

type InfoSection = {
  title: string;
  titleI18n: I18nRecord;
  body: string;
  bodyI18n: I18nRecord;
  icon: string;
  order: number;
  enabled: boolean;
};

type AppConfig = {
  emergencyPage?: Record<string, unknown>;
  emergencyInfoSections?: InfoSection[];
  emergencyContacts?: Contact[];
};

export function Emergency() {
  const [pageTitle, setPageTitle] = useState<I18nRecord>(emptyI18n());
  const [pageSubtitle, setPageSubtitle] = useState<I18nRecord>(emptyI18n());
  const [pageBody, setPageBody] = useState<I18nRecord>(emptyI18n());
  const [sections, setSections] = useState<InfoSection[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const cfgRes = await api<{ config: AppConfig }>('/admin/app-config');
    const c = cfgRes.config;
    const page = c.emergencyPage as Record<string, unknown> | undefined;
    setPageTitle(i18nFromDoc(page, 'title'));
    setPageSubtitle(i18nFromDoc(page, 'subtitle'));
    setPageBody(i18nFromDoc(page, 'body'));
    setSections(
      (c.emergencyInfoSections || []).map((item, i) => ({
        title: item.title || '',
        titleI18n: item.titleI18n || i18nFromDoc(item as Record<string, unknown>, 'title'),
        body: item.body || '',
        bodyI18n: item.bodyI18n || i18nFromDoc(item as Record<string, unknown>, 'body'),
        icon: item.icon || 'information-circle',
        order: item.order ?? i,
        enabled: item.enabled !== false,
      }))
    );
    setContacts(
      (c.emergencyContacts || []).map((item, i) => ({
        label: item.label || '',
        labelI18n: item.labelI18n || i18nFromDoc(item as Record<string, unknown>, 'label'),
        number: item.number || '',
        icon: item.icon || 'call',
        order: item.order ?? i,
        active: item.active !== false,
      }))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        title: '',
        titleI18n: emptyI18n(),
        body: '',
        bodyI18n: emptyI18n(),
        icon: 'information-circle',
        order: prev.length,
        enabled: true,
      },
    ]);
  };

  const updateSection = (index: number, patch: Partial<InfoSection>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { label: '', labelI18n: emptyI18n(), number: '', icon: 'call', order: prev.length, active: true },
    ]);
  };

  const updateContact = (index: number, patch: Partial<Contact>) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api('/admin/app-config', {
        method: 'PATCH',
        body: JSON.stringify({
          emergencyPage: {
            title: pageTitle.tr,
            subtitle: pageSubtitle.tr,
            body: pageBody.tr,
            titleI18n: pageTitle,
            subtitleI18n: pageSubtitle,
            bodyI18n: pageBody,
          },
          emergencyInfoSections: sections.map((s, i) => ({
            ...s,
            order: i,
            title: s.titleI18n.tr || s.title,
            body: s.bodyI18n.tr || s.body,
          })),
          emergencyContacts: contacts.map((c, i) => ({
            ...c,
            order: i,
            label: c.labelI18n.tr || c.label,
          })),
        }),
      });
      alert('Acil destek ayarları kaydedildi');
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Acil Destek Sayfası</h1>
      <p style={{ color: '#6b7c8f', marginBottom: 24 }}>
        Mobil acil destek ekranı yalnızca bilgilendirme metinleri gösterir; sohbet odasına veya aramaya yönlendirme
        yapmaz. Her alan için TR, EN, DE, AR, ES metinleri girin.
      </p>

      <div className="form-grid" style={{ maxWidth: 720 }}>
        <LocalizedFields label="Sayfa başlığı" value={pageTitle} onChange={setPageTitle} />
        <LocalizedFields label="Sayfa alt başlığı" value={pageSubtitle} onChange={setPageSubtitle} multiline rows={2} />
        <LocalizedFields
          label="Ana açıklama metni (mobilde büyük gösterilir)"
          value={pageBody}
          onChange={setPageBody}
          multiline
          rows={10}
        />

        <h3 style={{ margin: '24px 0 8px', color: '#0d3b4c' }}>Bilgi bölümleri</h3>
        <p style={{ color: '#6b7c8f', fontSize: 14, marginBottom: 12 }}>
          İpuçları, uyarılar veya ek açıklamalar. Tıklanabilir değildir.
        </p>
        {sections.map((s, i) => (
          <div
            key={i}
            style={{
              border: '1px solid #e8edf2',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Bölüm #{i + 1}</strong>
              <button type="button" className="btn-sm" onClick={() => removeSection(i)}>
                Sil
              </button>
            </div>
            <LocalizedFields label="Başlık" value={s.titleI18n} onChange={(titleI18n) => updateSection(i, { titleI18n })} />
            <LocalizedFields
              label="İçerik"
              value={s.bodyI18n}
              onChange={(bodyI18n) => updateSection(i, { bodyI18n })}
              multiline
              rows={6}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <div>
                <label>İkon</label>
                <select value={s.icon} onChange={(e) => updateSection(i, { icon: e.target.value })}>
                  {SECTION_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => updateSection(i, { enabled: e.target.checked })}
                />
                Mobilde göster
              </label>
            </div>
          </div>
        ))}
        <button type="button" className="btn-sm" onClick={addSection}>
          + Bilgi bölümü ekle
        </button>

        <h3 style={{ margin: '24px 0 8px', color: '#0d3b4c' }}>Önemli numaralar (bilgi)</h3>
        <p style={{ color: '#6b7c8f', fontSize: 14, marginBottom: 12 }}>
          Numaralar metin olarak listelenir; otomatik arama başlatılmaz.
        </p>
        {contacts.map((c, i) => (
          <div
            key={i}
            style={{
              border: '1px solid #e8edf2',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>#{i + 1}</strong>
              <button type="button" className="btn-sm" onClick={() => removeContact(i)}>
                Sil
              </button>
            </div>
            <LocalizedFields
              label="Görünen ad"
              value={c.labelI18n}
              onChange={(labelI18n) => updateContact(i, { labelI18n })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, marginTop: 8 }}>
              <div>
                <label>Telefon / numara</label>
                <input value={c.number} onChange={(e) => updateContact(i, { number: e.target.value })} />
              </div>
              <div>
                <label>İkon</label>
                <select value={c.icon} onChange={(e) => updateContact(i, { icon: e.target.value })}>
                  {CONTACT_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={c.active}
                onChange={(e) => updateContact(i, { active: e.target.checked })}
              />
              Mobilde göster
            </label>
          </div>
        ))}
        <button type="button" className="btn-sm" onClick={addContact}>
          + Numara ekle
        </button>

        <button type="button" className="btn-secondary" onClick={save} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  );
}
