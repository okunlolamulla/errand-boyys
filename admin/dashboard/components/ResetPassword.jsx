'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

// The email link opens this page as /reset-password#access_token=...&type=recovery
export default function ResetPassword() {
  const [token, setToken] = useState(null); // null = still reading the address, '' = no token
  const [linkError, setLinkError] = useState('');
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    setLinkError(h.get('error_description') || '');
    setToken(h.get('access_token') || '');
    if (window.location.hash) history.replaceState(null, '', window.location.pathname); // keep the token out of the address bar
  }, []);

  async function submit(e) {
    e.preventDefault(); setError('');
    if (pw !== again) return setError('The two passwords do not match');
    setBusy(true);
    try { await apiFetch('/auth/reset-password', { method: 'POST', body: { access_token: token, password: pw } }); setDone(true); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  if (token === null) return null;
  return (
    <main className="login panel">
      <h1>Choose a new password</h1>
      {done ? (
        <>
          <p className="ok" role="status">Your password has been changed.</p>
          <a className="btn primary full" href="/">Sign in</a>
        </>
      ) : !token ? (
        <>
          <p className="error" role="alert">{linkError ? linkError.replace(/\+/g, ' ') : 'This page needs the link from your reset email.'}</p>
          <p className="muted center"><a href="/forgot-password">Send me a new link</a></p>
        </>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="rp1">New password</label>
          <input id="rp1" type="password" autoComplete="new-password" minLength="8" value={pw} onChange={(e) => setPw(e.target.value)} required />
          <p className="muted">At least 8 characters, with a letter and a number.</p>
          <label htmlFor="rp2">Repeat new password</label>
          <input id="rp2" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary full" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        </form>
      )}
    </main>
  );
}
