'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RequestsTable from './RequestsTable';
import AssignmentTable from './AssignmentTable';
import StatusMonitor from './StatusMonitor';
import QuoteModal from './QuoteModal';
import ManualPaymentModal from './ManualPaymentModal';
import ErrandDetailModal from './ErrandDetailModal';

const TABS = [
  { id: 'incoming', label: 'Incoming requests', statuses: ['Pending Review', 'Quoted'] },
  { id: 'assign', label: 'Paid & assignment', statuses: ['Paid', 'Assigned'] },
  { id: 'monitor', label: 'Status monitor', statuses: ['On the way', 'In Progress', 'Proof Uploaded', 'Completed'] },
];

export default function Dashboard({ request, user, onLogout, embedded = false }) {
  const [errands, setErrands] = useState([]);
  const [agents, setAgents] = useState([]);
  const [issues, setIssues] = useState([]); // payments that arrived but could not be applied
  const [tab, setTab] = useState('incoming');
  const [showClosed, setShowClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'quote' | 'pay' | 'detail', errand }

  const load = useCallback(async () => {
    try {
      const [e, a, i] = await Promise.all([request('/admin/errands'), request('/admin/agents'), request('/admin/payments/issues')]);
      setErrands(e);
      setAgents(a);
      setIssues(i);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // keep the board fresh
    return () => clearInterval(timer);
  }, [load]);

  const activeAgents = useMemo(() => agents.filter((a) => a.is_active), [agents]);
  const inTab = (t) => errands.filter((e) => (t.id === 'monitor' && showClosed ? [...t.statuses, 'Closed'] : t.statuses).includes(e.status));
  const current = TABS.find((t) => t.id === tab);
  const rows = inTab(current);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div className={embedded ? '' : 'shell'}>
      {!embedded && <header className="topbar">
        <h1>Errand Boys Admin</h1>
        <span className="muted">{user.name}</span>
        <button className="btn ghost" onClick={load}>Refresh</button>
        <button className="btn ghost" onClick={onLogout}>Sign out</button>
      </header>}

      <nav className="tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label} <span className="count">{errands.filter((e) => t.statuses.includes(e.status)).length}</span>
          </button>
        ))}
      </nav>

      {error && <p className="error banner" role="alert">{error}</p>}
      {issues.length > 0 && (
        <p className="error banner" role="alert">
          ⚠ {issues.length} payment{issues.length > 1 ? 's' : ''} need your review:{' '}
          {issues.map((i) => (
            <button key={i.id} className="linklike" onClick={() => setModal({ type: 'detail', errand: { errand_id: i.errand_id } })}>{i.errand_id}</button>
          ))}
        </p>
      )}
      {loading ? <p className="empty">Loading…</p> : (
        <section className="panel">
          {tab === 'incoming' && (
            <RequestsTable rows={rows}
              onQuote={(errand) => setModal({ type: 'quote', errand })}
              onPay={(errand) => setModal({ type: 'pay', errand })}
              onView={(errand) => setModal({ type: 'detail', errand })} />
          )}
          {tab === 'assign' && (
            <AssignmentTable rows={rows} agents={activeAgents} request={request} onChanged={load}
              onView={(errand) => setModal({ type: 'detail', errand })} />
          )}
          {tab === 'monitor' && (
            <StatusMonitor rows={rows} agents={agents} showClosed={showClosed} onToggleClosed={setShowClosed}
              onView={(errand) => setModal({ type: 'detail', errand })} />
          )}
        </section>
      )}

      {modal?.type === 'quote' && <QuoteModal errand={modal.errand} request={request} onClose={closeModal} onDone={load} />}
      {modal?.type === 'pay' && <ManualPaymentModal errand={modal.errand} request={request} onClose={closeModal} onDone={load} />}
      {modal?.type === 'detail' && <ErrandDetailModal id={modal.errand.errand_id} request={request} onClose={closeModal} onChanged={load} />}
    </div>
  );
}
