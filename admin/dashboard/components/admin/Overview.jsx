'use client';
import { useCallback, useEffect, useState } from 'react';
import { money } from '../../lib/format';
import { Stat, moneyMap } from './ui';

export default function Overview({ request, goto }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => request('/admin/overview').then((r) => { setD(r); setError(''); }).catch((e) => setError(e.message)), [request]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (error) return <p className="error banner" role="alert">{error}</p>;
  if (!d) return <p className="empty">Loading…</p>;

  const maxOrders = Math.max(1, ...d.daily.map((x) => x.orders));
  const maxRev = Math.max(1, ...d.daily.map((x) => Number(x.revenue)));
  const statusRows = Object.entries(d.by_status).sort((a, b) => b[1] - a[1]);
  const maxStatus = Math.max(1, ...statusRows.map(([, n]) => n));

  return (
    <>
      <div className="stats">
        <Stat label="Total customers" value={d.customers} sub="matched by phone number" />
        <Stat label="Total orders" value={d.orders} sub={`${d.paid_orders} paid`} />
        <Stat label="Total revenue" value={moneyMap(d.revenue)} sub={`Last 30 days: ${moneyMap(d.revenue_30d)}`} tone="green" />
        <Stat label="Awaiting approval" value={d.awaiting_approval} sub="open Errand tracking" tone={d.awaiting_approval ? 'amber' : ''} />
        <Stat label="Active orders" value={d.active_orders} sub="not yet completed" />
        <Stat label="Payments to review" value={d.payment_issues} sub="stale or mismatched" tone={d.payment_issues ? 'red' : ''} />
      </div>
      {(d.awaiting_approval > 0 || d.payment_issues > 0) && (
        <p className="banner notice">
          {d.awaiting_approval > 0 && <button className="linklike" onClick={() => goto('tracking')}>{d.awaiting_approval} order{d.awaiting_approval > 1 ? 's' : ''} waiting for approval →</button>}
          {d.payment_issues > 0 && <button className="linklike" onClick={() => goto('payments')}>{d.payment_issues} payment{d.payment_issues > 1 ? 's' : ''} need review →</button>}
        </p>
      )}

      <div className="two">
        <section className="panel">
          <h2>Last 14 days</h2>
          <p className="muted">Orders received (blue) and revenue collected in naira (green)</p>
          <div className="chart" role="img" aria-label="Orders and revenue per day for the last 14 days">
            {d.daily.map((x) => (
              <div key={x.day} className="chart-col" title={`${x.day}: ${x.orders} orders, ${money(x.revenue)}`}>
                <div className="bars">
                  <span className="bar b-orders" style={{ height: `${(x.orders / maxOrders) * 100}%` }} />
                  <span className="bar b-rev" style={{ height: `${(Number(x.revenue) / maxRev) * 100}%` }} />
                </div>
                <small>{new Date(x.day).getDate()}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Orders by status</h2>
          {statusRows.length === 0 ? <p className="empty small">No orders yet.</p> : statusRows.map(([s, n]) => (
            <div key={s} className="hbar"><span>{s}</span><div><i style={{ width: `${(n / maxStatus) * 100}%` }} /></div><b>{n}</b></div>
          ))}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2>Orders by service</h2>
        <div className="table-wrap">
          <table style={{ minWidth: 420 }}>
            <thead><tr><th>Service</th><th>Orders</th><th>Revenue (₦)</th></tr></thead>
            <tbody>
              {d.by_service.map((s) => <tr key={s.service}><td>{s.service}</td><td>{s.orders}</td><td>{money(s.revenue_ngn)}</td></tr>)}
              {d.by_service.length === 0 && <tr><td colSpan="3" className="empty small">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
