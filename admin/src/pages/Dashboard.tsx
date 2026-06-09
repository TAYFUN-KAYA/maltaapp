import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Stats {
  users: number;
  schools: number;
  tours: number;
  bookings: number;
  applications: number;
  inquiries: number;
  customRequests: number;
  pendingBookings: number;
  totalCommission?: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<{ stats: Stats }>('/admin/dashboard').then((r) => setStats(r.stats));
  }, []);

  const cards = stats
    ? [
        { label: 'Kullanıcılar', value: stats.users },
        { label: 'Aktif Okullar', value: stats.schools },
        { label: 'Turlar', value: stats.tours },
        { label: 'Rezervasyonlar', value: stats.bookings },
        { label: 'Bekleyen Rezervasyon', value: stats.pendingBookings },
        { label: 'Başvurular', value: stats.applications },
        { label: 'Açık Sorular', value: stats.inquiries },
        { label: 'Özel Tur Talepleri', value: stats.customRequests },
        { label: 'Toplam Komisyon (€)', value: stats.totalCommission ?? 0 },
      ]
    : [];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <h3>{c.value ?? '—'}</h3>
            <p>{c.label}</p>
          </div>
        ))}
      </div>
      <p style={{ color: '#6b7c8f' }}>
        Komisyonlu okul kayıtları ana gelir kaynağıdır. Özel tur teklifleri ve rezervasyonları buradan yönetin.
      </p>
    </div>
  );
}
