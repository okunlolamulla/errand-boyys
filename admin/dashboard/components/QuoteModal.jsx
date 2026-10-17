'use client';
import { useState } from 'react';
import Modal from './Modal';
import { money } from '../lib/format';

// Admin enters a price. Submitting saves it, creates a Paystack payment link on the server,
// and sends that link to the customer by email and/or WhatsApp. Works with whichever gateway the server uses.
export default function QuoteModal({ errand, request, onClose, onDone }) {
  const email = errand.contact_info?.email;
  const phone = errand.contact_info?.phone;
  const [currency, setCurrency] = useState(errand.quote_currency || 'NGN');
  const [amount, setAmount] = useState(errand.quote_amount ?? '');
  const [sendEmail, setSendEmail] = useState(Boolean(email));
  const [sendWhatsApp, setSendWhatsApp] = useState(Boolean(phone));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const n = Number(amount);
    if (!(n > 0) || n > 100000000) { setError('Enter an amount greater than 0.'); return; }
    setBusy(true);
    setError('');
    try {
      const notify = [sendEmail && 'email', sendWhatsApp && 'whatsapp'].filter(Boolean);
      setResult(await request(`/admin/errands/${errand.errand_id}/quote`, { method: 'PUT', body: { quote_amount: n, currency, notify } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const finish = () => { onDone(); onClose(); };

  if (result) {
    const n = result.notifications || {};
    return (
      <Modal title="Quote saved" onClose={finish}>
        <p>{errand.errand_id} quoted at <strong>{money(result.errand.quote_amount, result.errand.quote_currency)}</strong>.</p>
        {result.payment_link
          ? <p className="muted">Checkout page: <a href={result.checkout_link || result.payment_link} target="_blank" rel="noreferrer">open</a></p>
          : <p className="warn">No payment link was created because a payment gateway is not set up on the server yet.</p>}
        {Object.entries(n).map(([channel, r]) => (
          <p key={channel} className={r.ok ? 'ok' : 'error'}>
            {channel === 'email' ? 'Email' : 'WhatsApp'}: {r.ok ? '✓' : '✗'} {r.detail}
          </p>
        ))}
        <div className="modal-foot"><button className="btn primary" onClick={finish}>Done</button></div>
      </Modal>
    );
  }

  return (
    <Modal title={`Quote ${errand.errand_id}`} onClose={onClose}>
      <p className="muted">{errand.service_type} for {errand.contact_info?.name}</p>
      <form onSubmit={submit}>
        <div className="row">
          <label className="grow">Price
            <input type="number" min="1" step="0.01" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
        </div>
        {Number(amount) > 0 && <p className="muted">Customer will pay <strong>{money(amount, currency)}</strong>.</p>}

        <fieldset>
          <legend>Send the payment link to the customer</legend>
          <label className="check">
            <input type="checkbox" checked={sendEmail} disabled={!email} onChange={(e) => setSendEmail(e.target.checked)} />
            Email {email ? `(${email})` : '(no email given)'}
          </label>
          <label className="check">
            <input type="checkbox" checked={sendWhatsApp} disabled={!phone} onChange={(e) => setSendWhatsApp(e.target.checked)} />
            WhatsApp {phone ? `(${phone})` : '(no phone given)'}
          </label>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-foot">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Save quote & send link'}</button>
        </div>
      </form>
    </Modal>
  );
}
