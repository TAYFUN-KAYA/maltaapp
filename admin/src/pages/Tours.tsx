import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { SimpleModal } from '../components/SimpleModal';
import { ImageUpload } from '../components/ImageUpload';
import { LocalizedFields } from '../components/LocalizedFields';
import { emptyI18n, i18nFromDoc, type I18nRecord } from '../lib/contentLocales';

interface Slot {
  date: string;
  spotsLeft: number;
}

interface Tour {
  _id: string;
  title: string;
  category: string;
  price: number;
  duration?: string;
  rating: number;
  active: boolean;
  featured?: boolean;
  description?: string;
  videoUrl?: string;
  images?: string[];
  availableDates?: { date: string; spotsLeft: number }[];
}

const CATEGORY_OPTIONS = [
  { value: 'boat', label: 'Tekne' },
  { value: 'jeep', label: 'Jeep' },
  { value: 'history', label: 'Tarih' },
  { value: 'diving', label: 'Dalış' },
  { value: 'water_sports', label: 'Su sporları' },
  { value: 'sunset', label: 'Gün batımı' },
  { value: 'private_charter', label: 'Özel charter' },
  { value: 'food_wine', label: 'Yemek & şarap' },
  { value: 'day_trip', label: 'Günübirlik' },
  { value: 'student_party', label: 'Öğrenci partisi (dil öğrencisi)' },
  { value: 'language_exchange', label: 'Dil değişimi (dil öğrencisi)' },
  { value: 'culture', label: 'Kültür' },
];

const empty: Partial<Tour> = {
  title: '',
  category: 'boat',
  price: 30,
  duration: '3 saat',
  description: '',
  active: true,
  images: [],
};

export function Tours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [form, setForm] = useState<Partial<Tour>>(empty);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [titleI18n, setTitleI18n] = useState<I18nRecord>(emptyI18n);
  const [descriptionI18n, setDescriptionI18n] = useState<I18nRecord>(emptyI18n);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => api<{ tours: Tour[] }>('/admin/tours?all=true').then((r) => setTours(r.tours));

  useEffect(() => {
    load();
  }, []);

  const openEdit = (t?: Tour) => {
    if (t) {
      setEditId(t._id);
      setForm(t);
      setTitleI18n(i18nFromDoc(t as Record<string, unknown>, 'title'));
      setDescriptionI18n(i18nFromDoc(t as Record<string, unknown>, 'description'));
      setSlots(
        (t.availableDates || []).map((s) => ({
          date: new Date(s.date).toISOString().slice(0, 16),
          spotsLeft: s.spotsLeft ?? 8,
        }))
      );
    } else {
      setEditId(null);
      setForm(empty);
      setTitleI18n(emptyI18n());
      setDescriptionI18n(emptyI18n());
      setSlots([]);
    }
    setOpen(true);
  };

  const save = async () => {
    const body = {
      ...form,
      title: titleI18n.tr || form.title || '',
      description: descriptionI18n.tr || form.description || '',
      titleI18n,
      descriptionI18n,
      images: form.images || [],
      active: form.active !== false,
      featured: !!form.featured,
      availableDates: slots.map((s) => ({
        date: new Date(s.date).toISOString(),
        spotsLeft: s.spotsLeft,
      })),
    };
    if (editId) await api(`/admin/tours/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
    else await api('/admin/tours', { method: 'POST', body: JSON.stringify(body) });
    setOpen(false);
    load();
  };

  const addSlot = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setSlots([...slots, { date: d.toISOString().slice(0, 16), spotsLeft: 8 }]);
  };

  return (
    <div>
      <h1 className="page-title">Turlar ({tours.length})</h1>
      <p style={{ color: '#6b7c8f', marginBottom: 16, maxWidth: 720 }}>
        Turist ve Work &amp; Study ana sayfasında <strong>öne çıkan</strong> turlar listelenir. Öğrenci kategorili
        turlar okul/tur sekmelerinde görünür.
      </p>
      <button type="button" className="btn-secondary" onClick={() => openEdit()}>
        + Yeni Tur
      </button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tur</th>
              <th>Kategori</th>
              <th>Fiyat</th>
              <th>Slot</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tours.map((t) => (
              <tr key={t._id}>
                <td>
                  <strong>{t.title}</strong>
                  {!t.active && <span className="badge pending"> Pasif</span>}
                </td>
                <td>{t.category}</td>
                <td>€{t.price}</td>
                <td>{t.availableDates?.length || 0}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openEdit(t)}>
                    Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SimpleModal open={open} title={editId ? 'Tur Düzenle' : 'Yeni Tur'} onClose={() => setOpen(false)} wide>
        <div className="form-grid">
          <LocalizedFields label="Başlık (çok dilli)" value={titleI18n} onChange={setTitleI18n} />
          <label>
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />{' '}
            Öne çıkan (dil öğrencisi / turist ana sayfa)
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{' '}
            Aktif
          </label>
          <div>
            <label>Kategori</label>
            <select value={form.category || 'boat'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Fiyat (€)</label>
            <input type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div>
            <label>Süre</label>
            <input value={form.duration || ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </div>
          <LocalizedFields
            label="Açıklama (çok dilli)"
            value={descriptionI18n}
            onChange={setDescriptionI18n}
            multiline
            rows={4}
          />
          <div>
            <label>Video URL</label>
            <input value={form.videoUrl || ''} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          </div>
          <ImageUpload
            label="Görseller"
            value={form.images || []}
            onChange={(images) => setForm({ ...form, images })}
            multiple
          />
          <div>
            <label>Grup tur tarihleri (kontenjan)</label>
            {slots.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="datetime-local" value={s.date} onChange={(e) => {
                  const next = [...slots];
                  next[i] = { ...next[i], date: e.target.value };
                  setSlots(next);
                }} />
                <input type="number" style={{ width: 80 }} value={s.spotsLeft} onChange={(e) => {
                  const next = [...slots];
                  next[i] = { ...next[i], spotsLeft: Number(e.target.value) };
                  setSlots(next);
                }} />
                <button type="button" className="btn-sm" onClick={() => setSlots(slots.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="btn-sm" onClick={addSlot}>+ Slot ekle</button>
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
