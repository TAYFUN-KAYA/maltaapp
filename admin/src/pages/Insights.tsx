import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { LocalizedFields } from '../components/LocalizedFields';
import { emptyI18n, i18nFromDoc, type I18nRecord } from '../lib/contentLocales';

interface Insight {
  _id: string;
  title: string;
  description: string;
  date: string;
  userTypes?: string[];
}

const emptyForm = () => ({
  title: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  userTypes: ['all'] as string[],
});

const USER_TYPE_OPTIONS = [
  { value: 'all', label: 'Tüm kullanıcılar' },
  { value: 'tourist', label: 'Turist' },
  { value: 'work_study', label: 'Work & Study' },
] as const;

function toggleUserType(current: string[], value: string) {
  if (value === 'all') return ['all'];
  const withoutAll = current.filter((x) => x !== 'all');
  return withoutAll.includes(value)
    ? withoutAll.filter((x) => x !== value)
    : [...withoutAll, value];
}

function formatUserTypes(types?: string[]) {
  if (!types?.length || types.includes('all')) return 'Tümü';
  return types
    .map((t) => USER_TYPE_OPTIONS.find((o) => o.value === t)?.label || t)
    .join(', ');
}

export function Insights() {
  const [items, setItems] = useState<Insight[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [titleI18n, setTitleI18n] = useState<I18nRecord>(emptyI18n);
  const [descriptionI18n, setDescriptionI18n] = useState<I18nRecord>(emptyI18n);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api<{ insights: Insight[] }>('/admin/insights').then((r) => setItems(r.insights));
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm());
    setTitleI18n(emptyI18n());
    setDescriptionI18n(emptyI18n());
    setOpen(true);
  };

  const openEdit = (i: Insight) => {
    setEditId(i._id);
    setForm({
      title: i.title,
      description: i.description,
      date: new Date(i.date).toISOString().slice(0, 10),
      userTypes: i.userTypes || ['all'],
    });
    setTitleI18n(i18nFromDoc(i as Record<string, unknown>, 'title'));
    setDescriptionI18n(i18nFromDoc(i as Record<string, unknown>, 'description'));
    setOpen(true);
  };

  const save = async () => {
    if (!form.userTypes.length) {
      alert('Hedef kitle seçin');
      return;
    }
    const body = {
      ...form,
      title: titleI18n.tr || form.title,
      description: descriptionI18n.tr || form.description,
      titleI18n,
      descriptionI18n,
      date: new Date(`${form.date}T12:00:00`),
    };
    if (editId) {
      await api(`/admin/insights/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    } else {
      await api('/admin/insights', { method: 'POST', body: JSON.stringify(body) });
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Bu kartı silmek istediğinize emin misiniz?')) return;
    await api(`/admin/insights/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="page-title">Malta&apos;da Bugün Kartları</h1>
      <p style={{ color: '#6b7c8f', marginBottom: 16, maxWidth: 720 }}>
        Keşfet ekranındaki günlük kartlar (turist ve Work &amp; Study). Dil öğrencisi modunda bu bölüm
        gösterilmez.
      </p>
      <button type="button" className="btn-secondary" onClick={openNew}>
        + Kart
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Hedef kitle</th>
              <th>Tarih</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id}>
                <td>{i.title}</td>
                <td>{formatUserTypes(i.userTypes)}</td>
                <td>{new Date(i.date).toLocaleDateString()}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openEdit(i)}>
                    Düzenle
                  </button>
                  <button type="button" className="btn-sm" style={{ marginLeft: 8 }} onClick={() => remove(i._id)}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SimpleModal open={open} title={editId ? 'Kartı Düzenle' : 'Yeni Kart'} onClose={() => setOpen(false)} wide>
        <div className="form-grid">
          <LocalizedFields label="Başlık (çok dilli)" value={titleI18n} onChange={setTitleI18n} />
          <LocalizedFields
            label="Açıklama (çok dilli)"
            value={descriptionI18n}
            onChange={setDescriptionI18n}
            multiline
            rows={3}
          />
          <div>
            <label>Tarih</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label>Hedef kitle (mobil kullanıcı tipi)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {USER_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.userTypes.includes(opt.value)}
                    onChange={() =>
                      setForm({
                        ...form,
                        userTypes: toggleUserType(form.userTypes, opt.value),
                      })
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {!form.userTypes.length && (
              <small style={{ color: '#e74c3c' }}>En az bir hedef kitle seçin</small>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-sm" onClick={save}>
            Kaydet
          </button>
        </div>
      </SimpleModal>
    </div>
  );
}
