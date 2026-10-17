'use client';
import { useEffect, useState } from 'react';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { formatDate, money } from '../../lib/format';
import { ApprovalBadge, Pager, useDebounced, useList } from './ui';

export default function Customers({ request, openOrder }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState(null);
  const dq = useDebounced(q);
  const { rows, total, loading, error } = useList(request, '/admin/customers', { q: dq, page, per: 25 });
  return (
    <section className="panel">
      <div className="filters">
        <input aria-label="Search customers" placeholder="Search by name, phone or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Total spent</th><th>Last order</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><button className="linklike" onClick={() => setSel(c.id)}>{c.name}</button></td>
                <td>{c.phone}<div className="muted">{c.email || ''}</div></td>
                <td>{c.orders}<div className="muted">{c.paid_orders} paid</div></td>
                <td>{money(c.spent_ngn)}{Number(c.spent_usd) > 0 ? <div>{money(c.spent_usd, 'USD')}</div> : null}</td>
                <td className="muted">{c.last_order_at ? formatDate(c.last_order_at) : '—'}</td>
                <td><button className="btn" onClick={() => setSel(c.id)}>View orders</button></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan="6" className="empty">No customers yet. They appear automatically when someone places an order.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} per={25} total={total} onPage={setPage} />
      {sel && <CustomerModal id={sel} request={request} onClose={() => setSel(null)} openOrder={(o) => { setSel(null); openOrder(o); }} />}
    </section>
  );
}

function CustomerModal({ id, request, onClose, openOrder }) {
  const [d, setD] = useState(null);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { request(`/admin/customers/${id}`).then((r) => { setD(r); setNotes(r.customer.notes || ''); }).catch((e) => setMsg(e.message)); }, [id, request]);
  async function save() {
    try { await request(`/admin/customers/${id}`, { method: 'PUT', body: { notes } }); setMsg('Saved ✓'); } catch (e) { setMsg(e.message); }
  }
  return (
    <Modal title={d ? d.customer.name : 'Customer'} onClose={onClose} wide>
      {!d ? <p className="empty">{msg || 'Loading…'}</p> : (
        <>
          <dl className="details">
            <dt>Phone</dt><dd>{d.customer.phone}</dd>
            <dt>Email</dt><dd>{d.customer.email || '—'}</dd>
            <dt>Orders</dt><dd>{d.customer.orders} ({d.customer.paid_orders} paid)</dd>
            <dt>Total spent</dt><dd>{money(d.customer.spent_ngn)}{Number(d.customer.spent_usd) > 0 ? ` · ${money(d.customer.spent_usd, 'USD')}` : ''}</dd>
            <dt>Customer since</dt><dd>{formatDate(d.customer.created_at)}</dd>
          </dl>
          <h3>Orders</h3>
          <div className="table-wrap">
            <table style={{ minWidth: 520 }}>
              <tbody>
                {d.orders.map((o) => (
                  <tr key={o.errand_id}>
                    <td><button className="linklike" onClick={() => openOrder(o)}>{o.errand_id}</button></td>
                    <td>{o.service_type}</td>
                    <td><StatusBadge status={o.status} /> <ApprovalBadge value={o.approval_status} /></td>
                    <td>{money(o.quote_amount, o.quote_currency)}</td>
                    <td className="muted">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label htmlFor="cnotes">Staff notes (never shown to the customer)</label>
          <textarea id="cnotes" rows="3" maxLength="2000" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="modal-foot"><span className="muted">{msg}</span><button className="btn primary" onClick={save}>Save notes</button></div>
        </>
      )}
    </Modal>
  );
}
