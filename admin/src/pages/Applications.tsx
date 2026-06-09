import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { InlineForm } from '../components/InlineForm';

interface Application {
  _id: string;
  status: string;
  course?: string;
  weeks?: number;
  offerPrice?: number;
  commissionAmount?: number;
  user?: { name: string; email: string };
  school?: { name: string; commissionRate?: number };
}

export function Applications() {
  const [items, setItems] = useState<Application[]>([]);
  const [modalId, setModalId] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [enroll, setEnroll] = useState(false);

  const load = () => api<{ applications: Application[] }>('/admin/applications').then((r) => setItems(r.applications));

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!modalId) return;
    const body: Record<string, unknown> = {
      status: enroll ? 'enrolled' : 'offer_sent',
      offerPrice: Number(offerPrice),
    };
    await api(`/admin/applications/${modalId}`, { method: 'PATCH', body: JSON.stringify(body) });
    setModalId(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">Okul Başvuruları</h1>
      <div className="stat-card" style={{ marginBottom: 16, maxWidth: 560 }}>
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Komisyon akışı:</strong> Teklif gönder → Kayıt tamamlandığında &quot;Kayıtlı (komisyon)&quot; seçin.
          Komisyon = teklif × okul komisyon oranı (ör. %10).
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Okul</th>
              <th>Kurs</th>
              <th>Durum</th>
              <th>Teklif</th>
              <th>Komisyon</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id}>
                <td>{a.user?.name}</td>
                <td>{a.school?.name}</td>
                <td>{a.course} · {a.weeks} hafta</td>
                <td><span className="badge">{a.status}</span></td>
                <td>{a.offerPrice ? `€${a.offerPrice}` : '—'}</td>
                <td>{a.commissionAmount ? `€${a.commissionAmount}` : '—'}</td>
                <td>
                  {(a.status === 'submitted' || a.status === 'reviewing') && (
                    <button type="button" className="btn-sm" onClick={() => { setModalId(a._id); setOfferPrice(''); setEnroll(false); }}>Teklif / Kayıt</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InlineForm open={!!modalId} title="Başvuru işle" onClose={() => setModalId(null)} onSubmit={submit}>
        <div><label>Teklif fiyatı (€)</label><input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} /></div>
        <label><input type="checkbox" checked={enroll} onChange={(e) => setEnroll(e.target.checked)} /> Kayıt tamamlandı (komisyon hesapla)</label>
      </InlineForm>
    </div>
  );
}
