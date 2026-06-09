import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getAdminSocket } from '../lib/socket';
import { SimpleModal } from '../components/SimpleModal';
import { useAdminT } from '../i18n';
import type { Socket } from 'socket.io-client';

interface Request {
  _id: string;
  participants: number;
  budget?: number;
  budgetCurrency?: string;
  preferredDate?: string;
  flexibleDates?: boolean;
  requirements: string;
  status: string;
  quotePrice?: number;
  quoteMessage?: string;
  user?: { name: string; email: string; phone?: string };
}

interface Msg {
  _id: string;
  content: string;
  isAdmin: boolean;
  sender?: { name: string };
}

export function CustomTours() {
  const { t } = useAdminT();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<Request[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState('');
  const [quoteModal, setQuoteModal] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const load = () => api<{ requests: Request[] }>('/admin/custom-tours').then((r) => setItems(r.requests));

  const loadChat = (id: string) => {
    setSelected(id);
    api<{ messages: Msg[] }>(`/admin/custom-tours/${id}/messages`).then((r) => setMessages(r.messages));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId) loadChat(chatId);
  }, [searchParams]);

  useEffect(() => {
    if (!selected) return;

    let mounted = true;
    const onMsg = (msg: Msg) => {
      if (!mounted) return;
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };

    (async () => {
      try {
        const socket = await getAdminSocket();
        socketRef.current = socket;
        socket.emit('join_custom_tour', selected);
        socket.off('custom_tour_new_message', onMsg);
        socket.on('custom_tour_new_message', onMsg);
      } catch {
        /* HTTP fallback */
      }
    })();

    return () => {
      mounted = false;
      socketRef.current?.off('custom_tour_new_message', onMsg);
    };
  }, [selected]);

  const patchRequest = async (id: string, body: Record<string, unknown>) => {
    await api(`/admin/custom-tours/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    load();
    if (selected === id) loadChat(id);
  };

  const submitQuote = async () => {
    if (!quoteModal || !quotePrice || !quoteMessage.trim()) return;
    await patchRequest(quoteModal, {
      status: 'quoted',
      quotePrice: Number(quotePrice),
      quoteMessage: quoteMessage.trim(),
    });
    setQuoteModal(null);
    setQuotePrice('');
    setQuoteMessage('');
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    await patchRequest(rejectModal, {
      status: 'rejected',
      quoteMessage: rejectMessage.trim() || t('customTours.rejectDefault'),
    });
    setRejectModal(null);
    setRejectMessage('');
  };

  const sendMsg = async () => {
    if (!selected || !reply.trim()) return;
    const content = reply.trim();
    setReply('');
    try {
      const socket = socketRef.current || (await getAdminSocket());
      socketRef.current = socket;
      socket.emit('join_custom_tour', selected);
      socket.emit('custom_tour_message', { requestId: selected, content });
    } catch {
      await api(`/admin/custom-tours/${selected}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      loadChat(selected);
    }
  };

  const openQuote = (r: Request) => {
    setQuoteModal(r._id);
    setQuotePrice(String(r.quotePrice || r.budget || ''));
    setQuoteMessage(r.quoteMessage || '');
  };

  const canQuote = (s: string) => s === 'pending' || s === 'quoted';
  const canApprove = (s: string) => s === 'quoted';
  const canReject = (s: string) => s === 'pending' || s === 'quoted';

  return (
    <div>
      <h1 className="page-title">{t('customTours.title')}</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('customTours.user')}</th>
              <th>{t('customTours.participants')}</th>
              <th>{t('customTours.budget')}</th>
              <th>{t('customTours.requirements')}</th>
              <th>{t('customTours.status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>
                  {r.user?.name}
                  <br />
                  <small>{r.user?.email}</small>
                </td>
                <td>{r.participants}</td>
                <td>
                  {r.budget != null ? `€${r.budget}` : '—'}
                  {r.preferredDate && (
                    <>
                      <br />
                      <small>{new Date(r.preferredDate).toLocaleDateString()}</small>
                    </>
                  )}
                </td>
                <td style={{ maxWidth: 240 }}>{r.requirements}</td>
                <td>
                  <span className="badge">{r.status}</span>
                  {r.quotePrice != null && (
                    <>
                      <br />
                      <small>€{r.quotePrice}</small>
                    </>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn-sm" onClick={() => loadChat(r._id)}>
                    {t('customTours.chat')}
                  </button>
                  {canQuote(r.status) && (
                    <button type="button" className="btn-sm" onClick={() => openQuote(r)}>
                      {t('customTours.quote')}
                    </button>
                  )}
                  {canApprove(r.status) && (
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => patchRequest(r._id, { status: 'accepted' })}
                    >
                      {t('customTours.approve')}
                    </button>
                  )}
                  {canReject(r.status) && (
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => {
                        setRejectModal(r._id);
                        setRejectMessage(t('customTours.rejectDefault'));
                      }}
                    >
                      {t('customTours.reject')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{ marginTop: 24, background: '#fff', padding: 16, borderRadius: 16 }}>
          <h3>{t('customTours.chatTitle')}</h3>
          <div className="chat-panel" style={{ maxHeight: 320, overflowY: 'auto' }}>
            {messages.map((m) => (
              <div key={m._id} className={`chat-msg ${m.isAdmin ? 'admin' : ''}`}>
                <strong>
                  {m.sender?.name || (m.isAdmin ? t('customTours.admin') : t('customTours.userLabel'))}:
                </strong>{' '}
                {m.content}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              style={{ flex: 1, padding: 10 }}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t('customTours.placeholder')}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button type="button" className="btn-sm" onClick={sendMsg}>
              {t('common.send')}
            </button>
          </div>
        </div>
      )}

      <SimpleModal open={!!quoteModal} title={t('customTours.quoteModal')} onClose={() => setQuoteModal(null)}>
        <div className="form-grid">
          <div>
            <label>{t('customTours.price')}</label>
            <input type="number" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} />
          </div>
          <div>
            <label>{t('customTours.message')}</label>
            <textarea value={quoteMessage} onChange={(e) => setQuoteMessage(e.target.value)} rows={4} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-sm" onClick={() => setQuoteModal(null)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-sm" onClick={submitQuote}>
            {t('common.save')}
          </button>
        </div>
      </SimpleModal>

      <SimpleModal open={!!rejectModal} title={t('customTours.rejectModal')} onClose={() => setRejectModal(null)}>
        <div>
          <label>{t('customTours.message')}</label>
          <textarea value={rejectMessage} onChange={(e) => setRejectMessage(e.target.value)} rows={3} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-sm" onClick={() => setRejectModal(null)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn-sm" onClick={submitReject}>
            {t('bookings.reject')}
          </button>
        </div>
      </SimpleModal>
    </div>
  );
}
