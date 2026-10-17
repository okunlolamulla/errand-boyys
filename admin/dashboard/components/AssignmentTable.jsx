'use client';
import AssignAgent from './AssignAgent';
import StatusBadge from './StatusBadge';
import { money } from '../lib/format';

// Paid errands waiting for an agent, plus assigned ones that can still be reassigned.
export default function AssignmentTable({ rows, agents, request, onChanged, onView }) {
  if (!rows.length) return <p className="empty">No paid errands waiting for an agent.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Errand</th><th>Customer</th><th>Paid</th><th>Status</th><th>Agent</th><th /></tr></thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.errand_id}>
              <td><strong>{e.errand_id}</strong><div className="muted">{e.service_type}</div></td>
              <td>{e.contact_info?.name}<div className="muted">{e.contact_info?.phone}</div></td>
              <td>{money(e.quote_amount, e.quote_currency)}</td>
              <td><StatusBadge status={e.status} /></td>
              <td><AssignAgent errand={e} agents={agents} request={request} onDone={onChanged} /></td>
              <td><button className="btn ghost" onClick={() => onView(e)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
