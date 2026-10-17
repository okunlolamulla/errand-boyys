'use client';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../lib/format';
import { whatsappLink } from '../lib/phone';

// Quick buttons. "Completed" opens the proof form: on the server it becomes "Proof Uploaded",
// and an admin confirms it, so the agent sees "Awaiting confirmation" until then.
const STEPS = [
  { label: 'On the way', status: 'On the way', from: ['Assigned'], rank: 0 },
  { label: 'In progress', status: 'In Progress', from: ['Assigned', 'On the way'], rank: 1 },
  { label: 'Completed', status: 'Proof Uploaded', from: ['On the way', 'In Progress'], rank: 2, proof: true },
];
const RANK = { Assigned: -1, 'On the way': 0, 'In Progress': 1, 'Proof Uploaded': 2, Completed: 2 };

export default function JobCard({ job, agentName, request, onChanged, onComplete }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const current = RANK[job.status] ?? -1;
  const finished = job.status === 'Proof Uploaded' || job.status === 'Completed';

  // Opens WhatsApp with the Errand ID already typed in.
  const chat = whatsappLink(job.customer?.phone, `Hi ${job.customer?.name || ''}, this is ${agentName} from Errand Boys about your errand ${job.errand_id}.`);

  async function go(step) {
    if (step.proof) { onComplete(job); return; }
    setBusy(step.status);
    setError('');
    try {
      await request(`/agent/errands/${job.errand_id}/status`, { method: 'PUT', body: { status: step.status } });
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <article className="job panel">
      <div className="job-head">
        <div><strong>{job.errand_id}</strong><div className="muted">{job.service_type}</div></div>
        <StatusBadge status={job.status === 'Proof Uploaded' ? 'Proof Uploaded' : job.status} />
      </div>

      <dl className="details">
        <dt>Task</dt><dd>{job.task_description}</dd>
        {job.pickup_location && (<><dt>Pickup</dt><dd>{job.pickup_location}</dd></>)}
        {job.delivery_location && (<><dt>Delivery</dt><dd>{job.delivery_location}</dd></>)}
        <dt>When</dt><dd>{formatDate(job.date_time) || 'Flexible'}</dd>
        <dt>Customer</dt><dd>{job.customer?.name}</dd>
      </dl>

      <div className="job-links">
        {chat
          ? <a className="btn wa" href={chat} target="_blank" rel="noopener noreferrer">WhatsApp customer</a>
          : <span className="muted">No valid phone number for WhatsApp</span>}
        {job.customer?.phone && <a className="btn" href={`tel:${job.customer.phone}`}>Call</a>}
      </div>

      {job.status === 'Completed' ? (
        <p className="ok">✓ Confirmed by the office. Well done.</p>
      ) : (
        <>
          <div className="toggle" role="group" aria-label="Update status">
            {STEPS.map((step) => {
              const reached = current >= step.rank;
              const allowed = step.from.includes(job.status);
              return (
                <button key={step.status} className={`toggle-btn${reached ? ' reached' : ''}${current === step.rank ? ' now' : ''}`}
                  disabled={!allowed || Boolean(busy)} onClick={() => go(step)} aria-pressed={current === step.rank}>
                  {busy === step.status ? '…' : reached ? '✓ ' : ''}{step.label}
                </button>
              );
            })}
          </div>
          {finished && <p className="muted">Proof sent ({job.proof_count} file{job.proof_count === 1 ? '' : 's'}{job.proof_notes ? ' + note' : ''}). Awaiting confirmation from the office.</p>}
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </article>
  );
}
