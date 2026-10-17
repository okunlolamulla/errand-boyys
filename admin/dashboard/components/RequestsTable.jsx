'use client';
import StatusBadge from './StatusBadge';
import { formatDate, money, shortText } from '../lib/format';

// Incoming requests: new errands (Pending Review) and quoted ones waiting for payment.
export default function RequestsTable({ rows, onQuote, onPay, onView }) {
  if (!rows.length) return <p className="empty">No incoming requests right now.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Errand</th><th>Customer</th><th>Task</th><th>Preferred time</th><th>Status</th><th>Quote</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.errand_id}>
              <td><strong>{e.errand_id}</strong><div className="muted">{e.service_type}</div></td>
              <td>{e.contact_info?.name}<div className="muted">{e.contact_info?.phone}</div></td>
              <td title={e.task_description}>{shortText(e.task_description, 70)}</td>
              <td>{formatDate(e.date_time) || 'Flexible'}</td>
              <td><StatusBadge status={e.status} /></td>
              <td>{e.quote_amount != null ? money(e.quote_amount, e.quote_currency) : '—'}</td>
              <td className="actions">
                <button className="btn primary" onClick={() => onQuote(e)}>{e.status === 'Quoted' ? 'Re-quote' : 'Send quote'}</button>
                {e.status === 'Quoted' && <button className="btn" onClick={() => onPay(e)}>Mark paid</button>}
                <button className="btn ghost" onClick={() => onView(e)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
