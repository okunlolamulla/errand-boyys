'use client';
import { useCallback, useEffect, useState } from 'react';
import JobCard from './JobCard';
import ProofModal from './ProofModal';

const ACTIVE = ['Assigned', 'On the way', 'In Progress', 'Proof Uploaded'];

// The logged-in agent's jobs. The server only ever returns errands assigned to this agent.
export default function AgentDashboard({ request, user, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proofFor, setProofFor] = useState(null);

  const load = useCallback(async () => {
    try {
      setJobs(await request('/agent/errands'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000); // pick up new assignments
    return () => clearInterval(timer);
  }, [load]);

  const active = jobs.filter((j) => ACTIVE.includes(j.status));
  const done = jobs.filter((j) => j.status === 'Completed');
  const closeProof = useCallback(() => setProofFor(null), []);

  return (
    <div className="shell narrow">
      <header className="topbar">
        <h1>My jobs</h1>
        <span className="muted">{user.name}</span>
        <button className="btn ghost" onClick={load}>Refresh</button>
        <button className="btn ghost" onClick={onLogout}>Sign out</button>
      </header>

      {error && <p className="error banner" role="alert">{error}</p>}
      {loading ? <p className="empty">Loading…</p> : (
        <>
          <h2 className="section-title">Active <span className="count">{active.length}</span></h2>
          {active.length === 0 && <p className="empty panel">No jobs assigned to you right now. New ones appear here automatically.</p>}
          {active.map((job) => (
            <JobCard key={job.errand_id} job={job} agentName={user.name} request={request} onChanged={load} onComplete={setProofFor} />
          ))}

          {done.length > 0 && (
            <>
              <h2 className="section-title">Completed</h2>
              {done.map((job) => (
                <JobCard key={job.errand_id} job={job} agentName={user.name} request={request} onChanged={load} onComplete={setProofFor} />
              ))}
            </>
          )}
        </>
      )}

      {proofFor && <ProofModal job={proofFor} request={request} onClose={closeProof} onDone={load} />}
    </div>
  );
}
