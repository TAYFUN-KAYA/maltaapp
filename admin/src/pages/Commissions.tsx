import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface App {
  _id: string;
  status: string;
  commissionAmount?: number;
  offerPrice?: number;
  user?: { name: string };
  school?: { name: string; commissionRate?: number };
}

export function Commissions() {
  const [apps, setApps] = useState<App[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api<{ applications: App[]; summary: { _id: string; total: number }[] }>('/admin/commissions').then((r) => {
      setApps(r.applications);
      setTotal(r.summary.reduce((s, x) => s + x.total, 0));
    });
  }, []);

  return (
    <div>
      <h1 className="page-title">Komisyon Özeti</h1>
      <div className="stat-card" style={{ marginBottom: 24 }}>
        <h3>€{total.toFixed(0)}</h3>
        <p>Toplam kayıtlı komisyon</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Öğrenci</th><th>Okul</th><th>Durum</th><th>Teklif</th><th>Komisyon</th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a._id}>
                <td>{a.user?.name}</td>
                <td>{a.school?.name}</td>
                <td><span className="badge">{a.status}</span></td>
                <td>{a.offerPrice ? `€${a.offerPrice}` : '—'}</td>
                <td>{a.commissionAmount ? `€${a.commissionAmount}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
