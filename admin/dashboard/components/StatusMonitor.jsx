'use client';
import { timeAgo } from '../lib/format';

const COLUMNS = ['On the way', 'In Progress', 'Proof Uploaded', 'Completed'];

// Board of ongoing work. "Proof Uploaded" is where the admin reviews proof; "Completed" is ready to close.
export default function StatusMonitor({ rows, agents, showClosed, onToggleClosed, onView }) {
  const agentName = (id) => agents.find((a) => a.id === id)?.name || 'Unassigned';
  const columns = showClosed ? [...COLUMNS, 'Closed'] : COLUMNS;
  return (
    <>
      <label className="check">
        <input type="checkbox" checked={showClosed} onChange={(e) => onToggleClosed(e.target.checked)} />
        Show closed requests
      </label>
      <div className="board">
        {columns.map((status) => {
          const items = rows.filter((r) => r.status === status);
          return (
            <section key={status} className="column">
              <h3>{status} <span className="count">{items.length}</span></h3>
              {items.length === 0 && <p className="empty small">Nothing here</p>}
              {items.map((e) => (
                <button key={e.errand_id} className="card" onClick={() => onView(e)}>
                  <span className="card-title">{e.errand_id}</span>
                  <span className="muted">{e.service_type}</span>
                  <span>{agentName(e.assigned_agent_id)}</span>
                  <span className="muted">Updated {timeAgo(e.updated_at)}</span>
                  {status === 'Proof Uploaded' && <span className="flag">Needs your review</span>}
                  {status === 'Completed' && <span className="flag ok-flag">Ready to close</span>}
                </button>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
