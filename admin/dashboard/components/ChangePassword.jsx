'use client';
import { useState } from 'react';
import Modal from './Modal';

// Change your own password. `forced` = full page shown at first sign-in with the default password.
export default function ChangePassword({ request, forced = false, onDone, onClose, onLogout }) {
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (f.next !== f.again) return setError('The two new passwords do not match');
    setBusy(true);
    try {
      await request('/auth/change-password', { method: 'POST', body: { current_password: f.current, new_password: f.next } });
      setSaved(true);
      setTimeout(onDone, forced ? 0 : 1200);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  const form = (
    <form onSubmit={submit}>
      {forced && <p className="muted">You signed in with the default password. Choose your own to continue.</p>}
      <label htmlFor="cp0">{forced ? 'Default password' : 'Current password'}</label>
      <input id="cp0" type="password" autoComplete="current-password" value={f.current} onChange={set('current')} required />
      <label htmlFor="cp1">New password</label>
      <input id="cp1" type="password" autoComplete="new-password" minLength="8" value={f.next} onChange={set('next')} required />
      <p className="muted">At least 8 characters, with a letter and a number.</p>
      <label htmlFor="cp2">Repeat new password</label>
      <input id="cp2" type="password" autoComplete="new-password" value={f.again} onChange={set('again')} required />
      {error && <p className="error" role="alert">{error}</p>}
      {saved && <p className="ok" role="status">Password changed ✓</p>}
      <button className="btn primary full" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      {forced && <button type="button" className="btn ghost full" onClick={onLogout}>Sign out</button>}
    </form>
  );
  if (forced) return <main className="login panel"><h1>Choose a new password</h1>{form}</main>;
  return <Modal title="Change password" onClose={onClose}>{form}</Modal>;
}
