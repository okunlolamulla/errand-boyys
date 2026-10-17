'use client';
import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await apiFetch('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } }); setSent(true); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <main className="login panel">
      <h1>Forgot password?</h1>
      {sent ? (
        <>
          <p>If <b>{email}</b> has an account, we have emailed it a link to choose a new password. It can take a few minutes: check your spam folder too.</p>
          <p className="muted center"><a href="/">Back to sign in</a></p>
        </>
      ) : (
        <form onSubmit={submit}>
          <p className="muted">Enter your account email and we will send you a link to set a new password.</p>
          <label htmlFor="fe">Email</label>
          <input id="fe" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          <p className="muted center"><a href="/">Back to sign in</a></p>
        </form>
      )}
    </main>
  );
}
