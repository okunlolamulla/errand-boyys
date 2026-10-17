'use client';
import { useState } from 'react';
import StatusBadge from '../StatusBadge';
import { formatDate, money, shortText } from '../../lib/format';
import { ApprovalBadge, Contact, Pager, SERVICES, STATUSES, useDebounced, useList } from './ui';

// Order management: find any order, see where it is, and act on it.
export default function Orders({ request, open, onQuote, onPay, refreshKey, preset = {} }) {
  const [f, setF] = useState({ q: '', status: preset.status || '', service: '', approval: '' });
  const [page, setPage] = useState(1);
  const q = useDebounced(f.q);
  const { rows, total, loading, error } = useList(request, '/admin/orders', { ...f, q, page, per: 25 }, [refreshKey]);
  const set = (k) => (e) => { setF((o) => ({ ...o, [k]: e.target.value })); setPage(1); };

  function exportCsv() {
    const head = ['Errand ID', 'Service', 'Customer', 'Phone', 'Status', 'Approval', 'Quote', 'Currency', 'Paid', 'Created'];
    const lines = rows.map((r) => [r.errand_id, r.service_type, r.contact_info?.name, r.contact_info?.phone, r.status, r.approval_status, r.quote_amount ?? '', r.quote_currency, r.paid_at ? 'yes' : 'no', r.created_at]
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <section className="panel">
      <div className="filters">
        <input aria-label="Search orders" placeholder="Search by ID, name or phone" value={f.q} onChange={set('q')} />
        <select aria-label="Status" value={f.status} onChange={set('status')}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Service" value={f.service} onChange={set('service')}><option value="">All services</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Approval" value={f.approval} onChange={set('approval')}>
          <option value="">Any approval</option><option value="pending">Awaiting approval</option><option value="approved">Approved</option><option value="disapproved">Disapproved</option>
        </select>
        <button className="btn" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Task</th><th>Status</th><th>Quote</th><th>Placed</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.errand_id}>
                <td><button className="linklike" onClick={() => open(r)}>{r.errand_id}</button><div className="muted">{r.service_type}</div></td>
                <td><Contact c={r.contact_info} /></td>
                <td>{shortText(r.task_description, 70)}</td>
                <td><StatusBadge status={r.status} /><div style={{ marginTop: 4 }}><ApprovalBadge value={r.approval_status} /></div></td>
                <td>{money(r.quote_amount, r.quote_currency)}{r.paid_at ? <div className="ok">Paid</div> : null}</td>
                <td className="muted">{formatDate(r.created_at)}</td>
                <td><div className="actions">
                  <button className="btn" onClick={() => open(r)}>View</button>
                  {['Pending Review', 'Quoted'].includes(r.status) && r.approval_status !== 'disapproved' && <button className="btn primary" onClick={() => onQuote(r)}>{r.status === 'Quoted' ? 'Re-quote' : 'Quote'}</button>}
                  {r.status === 'Quoted' && <button className="btn" onClick={() => onPay(r)}>Mark paid</button>}
                </div></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan="7" className="empty">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <p className="muted">Loading…</p>}
      <Pager page={page} per={25} total={total} onPage={setPage} />
    </section>
  );
}
