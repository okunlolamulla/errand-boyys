'use client';
import { useState } from 'react';
import Modal from './Modal';
import { money } from '../lib/format';

// Fallback for transfers/cash, or if the Paystack webhook is not connected yet.
export default function ManualPaymentModal({ errand, request, onClose, onDone }) {
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await request(`/admin/errands/${errand.errand_id}/payment`, { method: 'PUT', body: { payment_reference: reference.trim() } });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Mark ${errand.errand_id} as paid`} onClose={onClose}>
      <p className="muted">Only do this after you have seen the {money(errand.quote_amount, errand.quote_currency)} in your Paystack or bank account.</p>
      <form onSubmit={submit}>
        <label>Payment reference
          <input autoFocus value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Paystack reference or transfer ID" minLength={4} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Mark as paid'}</button>
        </div>
      </form>
    </Modal>
  );
}
