'use client';
import { useState } from 'react';

// Dropdown of active agents. Works for a first assignment (Paid) and a reassignment (Assigned).
export default function AssignAgent({ errand, agents, request, onDone }) {
  const current = errand.assigned_agent_id || '';
  const [agentId, setAgentId] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function assign() {
    setBusy(true);
    setError('');
    try {
      const r = await request(`/admin/errands/${errand.errand_id}/assign`, { method: 'PUT', body: { agent_id: agentId } });
      // Show whether the agent and the customer were notified.
      setInfo(Object.entries(r.notifications || {})
        .map(([who, ch]) => `${who}: ${Object.entries(ch).map(([c, x]) => `${c} ${x.ok ? '✓' : '✗'}`).join(', ')}`).join(' · '));
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="assign">
      <select aria-label={`Agent for ${errand.errand_id}`} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
        <option value="">{agents.length ? 'Select agent…' : 'No active agents'}</option>
        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}{a.phone ? ` · ${a.phone}` : ''}</option>)}
      </select>
      <button className="btn primary" disabled={!agentId || agentId === current || busy} onClick={assign}>
        {busy ? 'Saving…' : errand.status === 'Assigned' ? 'Reassign' : 'Assign'}
      </button>
      {error && <p className="error">{error}</p>}
      {info && <p className="muted">Notified — {info}</p>}
    </div>
  );
}
