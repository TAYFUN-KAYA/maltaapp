import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { InlineForm } from '../components/InlineForm';
import { useAdminT } from '../i18n';

interface TourRequest {
  _id: string;
  status: string;
  estimatedPrice?: number;
  quotePrice?: number;
  participants?: number;
  preferredDate?: string;
  message?: string;
  adminReply?: string;
  discountCodeNote?: string;
  user?: { name: string; email: string; phone?: string };
  tour?: { title: string; price: number };
}

type ModalMode = 'quote' | 'confirm' | 'reject';

export function Bookings() {
  const { t } = useAdminT();
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [modal, setModal] = useState<{ id: string; mode: ModalMode } | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [adminReply, setAdminReply] = useState('');

  const load = () => api<{ bookings: TourRequest[] }>('/admin/bookings').then((r) => setRequests(r.bookings));

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, body: Record<string, unknown>) => {
    await api(`/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    setModal(null);
    setAdminReply('');
    setQuotePrice('');
    load();
  };

  const openModal = (id: string, mode: ModalMode, row: TourRequest) => {
    setModal({ id, mode });
    if (mode === 'quote') {
      setQuotePrice(String(row.estimatedPrice || row.tour?.price || row.quotePrice || ''));
      setAdminReply('');
    } else if (mode === 'confirm') {
      setAdminReply(t('bookings.approveDefault'));
    } else {
      setAdminReply(t('bookings.rejectDefault'));
    }
  };

  const submitModal = () => {
    if (!modal) return;
    if (modal.mode === 'quote') {
      update(modal.id, { status: 'quoted', quotePrice: Number(quotePrice), adminReply: adminReply.trim() });
    } else if (modal.mode === 'confirm') {
      update(modal.id, { status: 'confirmed', adminReply: adminReply.trim() || t('bookings.approveDefault') });
    } else {
      update(modal.id, { status: 'cancelled', adminReply: adminReply.trim() || t('bookings.rejectDefault') });
    }
  };

  const canQuote = (s: string) => s === 'pending' || s === 'reviewing';
  const canApprove = (s: string) => s === 'quoted';
  const canReject = (s: string) => s === 'pending' || s === 'reviewing' || s === 'quoted';

  return (
    <div>
      <h1 className="page-title">{t('bookings.title')}</h1>
      <p style={{ color: '#6b7c8f', marginBottom: 16 }}>{t('bookings.subtitle')}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('bookings.user')}</th>
              <th>{t('bookings.tour')}</th>
              <th>{t('bookings.date')}</th>
              <th>{t('bookings.participants')}</th>
              <th>{t('bookings.discount')}</th>
              <th>{t('bookings.status')}</th>
              <th>{t('bookings.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((b) => (
              <tr key={b._id}>
                <td>
                  {b.user?.name}
                  <br />
                  <small>{b.user?.email}</small>
                  {b.user?.phone && (
                    <>
                      <br />
                      <small>{b.user.phone}</small>
                    </>
                  )}
                </td>
                <td>
                  {b.tour?.title}
                  {b.quotePrice != null && (
                    <>
                      <br />
                      <small>€{b.quotePrice}</small>
                    </>
                  )}
                </td>
                <td>{b.preferredDate ? new Date(b.preferredDate).toLocaleDateString() : '—'}</td>
                <td>{b.participants}</td>
                <td>{b.discountCodeNote || '—'}</td>
                <td>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                  {b.adminReply && (
                    <>
                      <br />
                      <small>{b.adminReply}</small>
                    </>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {canQuote(b.status) && (
                    <>
                      <button type="button" className="btn-sm" onClick={() => openModal(b._id, 'quote', b)}>
                        {t('bookings.quote')}
                      </button>
                      {b.status === 'pending' && (
                        <button type="button" className="btn-sm" onClick={() => update(b._id, { status: 'reviewing' })}>
                          {t('bookings.review')}
                        </button>
                      )}
                    </>
                  )}
                  {canApprove(b.status) && (
                    <button type="button" className="btn-sm" onClick={() => openModal(b._id, 'confirm', b)}>
                      {t('bookings.approve')}
                    </button>
                  )}
                  {canReject(b.status) && (
                    <button
                      type="button"
                      className="btn-sm"
                      style={{ marginLeft: 4 }}
                      onClick={() => openModal(b._id, 'reject', b)}
                    >
                      {t('bookings.reject')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InlineForm
        open={!!modal}
        title={
          modal?.mode === 'quote'
            ? t('bookings.quoteModal')
            : modal?.mode === 'confirm'
              ? t('bookings.approveModal')
              : t('bookings.reject')
        }
        onClose={() => setModal(null)}
        onSubmit={submitModal}
      >
        {modal?.mode === 'quote' && (
          <>
            <div>
              <label>{t('bookings.quotePrice')}</label>
              <input type="number" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} />
            </div>
            <div>
              <label>{t('bookings.pushMessage')}</label>
              <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} rows={3} />
            </div>
          </>
        )}
        {modal?.mode === 'confirm' && (
          <div>
            <label>{t('bookings.approveMessage')}</label>
            <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} rows={3} />
          </div>
        )}
        {modal?.mode === 'reject' && (
          <div>
            <label>{t('bookings.rejectMessage')}</label>
            <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} rows={3} />
          </div>
        )}
      </InlineForm>
    </div>
  );
}
