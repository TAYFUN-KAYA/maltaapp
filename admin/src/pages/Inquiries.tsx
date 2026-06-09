import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { InlineForm } from '../components/InlineForm';

interface Inquiry {
  _id: string;
  message: string;
  status: string;
  offerPrice?: number;
  adminReply?: string;
  user?: { name: string; email: string };
  school?: { name: string };
}

export function Inquiries() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [modalId, setModalId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const load = () => api<{ inquiries: Inquiry[] }>('/admin/inquiries').then((r) => setItems(r.inquiries));

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!modalId) return;
    await api(`/admin/inquiries/${modalId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'replied',
        adminReply,
        offerPrice: offerPrice ? Number(offerPrice) : undefined,
      }),
    });
    setModalId(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">Okula Sor Mesajları</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Okul</th>
              <th>Mesaj</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i._id}>
                <td>{i.user?.name}</td>
                <td>{i.school?.name}</td>
                <td style={{ maxWidth: 300 }}>{i.message}</td>
                <td><span className="badge">{i.status}</span></td>
                <td>
                  {i.status === 'open' && (
                    <button type="button" className="btn-sm" onClick={() => { setModalId(i._id); setAdminReply(''); setOfferPrice(''); }}>Yanıtla</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InlineForm open={!!modalId} title="Yanıt gönder" onClose={() => setModalId(null)} onSubmit={submit}>
        <div><label>Yanıt metni</label><textarea rows={4} value={adminReply} onChange={(e) => setAdminReply(e.target.value)} /></div>
        <div><label>Fiyat teklifi (€, isteğe bağlı)</label><input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} /></div>
      </InlineForm>
    </div>
  );
}
