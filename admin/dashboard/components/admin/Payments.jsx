'use client';
import { useState } from 'react';
import { formatDate, money } from '../../lib/format';
import { Pager, Stat, moneyMap, useDebounced, useList } from './ui';

const PAY_BADGE = { paid: 'badge-paid', pending: 'badge-pending-review', stale: 'badge-proof-uploaded', mismatch: 'badge-proof-uploaded', resolved: 'badge-closed' };
const HELP = { stale: 'Money arrived but the quote changed or the order moved on.', mismatch: 'The amount or currency differed from the quote.' };

export default function Payments({ request, openOrder }) {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [note, setNote] = useState({});
  const [busy, setBusy] = useState(null);
  const dq = useDebounced(q);
  const { rows, total, loading, error, extra, reload } = useList(request, '/admin/payments', { status, q: dq, page, per: 25 });
  const t = extra?.totals;

  async function verify(p) {
    setBusy(p.id);
    try {
      const r = await request(`/admin/payments/${p.id}/verify`, { method: 'POST', body: {} });
      const msg = r.gateway_status === 'not_started' ? 'Paystack has no record yet: the customer has not opened the link.'
        : r.applied === 'paid' ? 'Paystack confirms it was paid. The order is now marked Paid.'
        : `Paystack says: ${r.gateway_status}${r.applied ? ` (${r.applied})` : ''}`;
      setNote((n) => ({ ...n, [p.id]: msg }));
      reload();
    } catch (e) { setNote((n) => ({ ...n, [p.id]: e.message })); } finally { setBusy(null); }
  }
  async function resolve(p) {
    setBusy(p.id);
    try { await request(`/admin/payments/${p.id}/resolve`, { method: 'PUT', body: {} }); reload(); } catch (e) { setNote((n) => ({ ...n, [p.id]: e.message })); } finally { setBusy(null); }
  }

  return (
    <>
      <div className="stats">
        <Stat label="Paid" value={t ? moneyMap(t.paid) : '…'} sub={`${t?.counts?.paid || 0} payments`} tone="green" />
        <Stat label="Waiting for customer" value={t ? moneyMap(t.pending) : '…'} sub={`${t?.counts?.pending || 0} links open`} />
        <Stat label="Need review" value={(t?.counts?.stale || 0) + (t?.counts?.mismatch || 0)} sub="stale or mismatched" tone={(t?.counts?.stale || 0) + (t?.counts?.mismatch || 0) ? 'red' : ''} />
      </div>
      <section className="panel">
        <div className="filters">
          <input aria-label="Search payments" placeholder="Search by reference or order ID" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select aria-label="Payment status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All payments</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="stale">Stale</option><option value="mismatch">Mismatch</option><option value="resolved">Resolved</option>
          </select>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Reference</th><th>Order</th><th>Amount</th><th>Status</th><th>Created / paid</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.reference}</code><div className="muted">{p.provider}{p.provider_txn_id ? ` · txn ${p.provider_txn_id}` : ''}</div></td>
                  <td><button className="linklike" onClick={() => openOrder({ errand_id: p.errand_id })}>{p.errand_id}</button><div className="muted">{p.errand?.contact_info?.name}</div></td>
                  <td>{money(p.amount, p.currency)}</td>
                  <td><span className={`badge ${PAY_BADGE[p.status]}`}>{p.status}</span>
                    {HELP[p.status] && <div className="muted">{HELP[p.status]}</div>}
                    {p.gateway_status && <div className="muted">Paystack: {p.gateway_status}{p.verified_at ? ` (${formatDate(p.verified_at)})` : ''}</div>}</td>
                  <td className="muted">{formatDate(p.created_at)}{p.paid_at ? <div>Paid {formatDate(p.paid_at)}</div> : null}</td>
                  <td>
                    <div className="actions">
                      {p.provider === 'paystack' && ['pending', 'stale', 'mismatch'].includes(p.status) && <button className="btn" disabled={busy === p.id} onClick={() => verify(p)}>Check with Paystack</button>}
                      {['stale', 'mismatch'].includes(p.status) && <button className="btn primary" disabled={busy === p.id} onClick={() => resolve(p)}>Mark reviewed</button>}
                    </div>
                    {note[p.id] && <p className="muted" role="status">{note[p.id]}</p>}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan="6" className="empty">No payments yet. They appear when you send a customer a quote.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={page} per={25} total={total} onPage={setPage} />
      </section>
    </>
  );
}
