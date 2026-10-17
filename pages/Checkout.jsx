import { useState } from 'react';
import { PAY } from '../lib/config';
import { fmt, okl, parseCode, wa } from '../lib/format';
import { getD, setD, setPending } from '../lib/storage';
import { useCart } from '../context/CartContext';
import ShopCheckout from '../components/ShopCheckout';
import Confirmation from '../components/Confirmation';

let lastOrd = null; // the order stays remembered while the page is open

export default function Checkout(props) {
  return (
    <>
      <section style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <img className="trackpic" style={{ objectPosition: '50% 25%' }} src="/assets/img/checkout-pay.jpg" alt="A smiling woman paying for her shopping with a card and phone" />
        </div>
      </section>
      <CheckoutInner {...props} />
    </>
  );
}

function CheckoutInner({ query }) {
  const c = query.get('c');
  const [ord, setOrd] = useState(() => {
    const o = c ? parseCode(c) : null;
    if (o) lastOrd = o;
    return lastOrd;
  });
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const { count } = useCart();
  const [showCode, setShowCode] = useState(false);
  const [result, setResult] = useState(null);

  function useCode() {
    const o = parseCode(code);
    if (!o) { setCodeErr('That code is not valid. Check it and try again.'); return; }
    lastOrd = o; setOrd(o);
  }

  if (result) return <Confirmation result={result} />;
  // No payment code yet: if the cart has items this is the shop checkout, otherwise ask for the code.
  if (!ord && count > 0 && !showCode) return <ShopCheckout onDone={setResult} onCode={() => setShowCode(true)} />;
  if (!ord) {
    return (
      <section>
        <div className="wrap" style={{ maxWidth: '560px' }}>
          <h2>Checkout</h2>
          <p style={{ color: 'var(--mut)', margin: '12px 0 20px' }}>Enter the checkout code we sent you on WhatsApp with your price.</p>
          <label htmlFor="cc">Checkout code</label>
          <input id="cc" value={code} onChange={(e) => setCode(e.target.value)} />
          <p id="ce" style={{ color: 'var(--sun)', minHeight: '1.4em' }}>{codeErr}</p>
          <button className="btn" onClick={useCode}>Continue to payment</button>
          <p style={{ marginTop: '16px', color: 'var(--mut)' }}>{count > 0 ? <a href="#/cart" onClick={() => setShowCode(false)}>← Back to my cart</a> : <>No code? <a href="#/shop">Browse the shop</a></>}</p>
        </div>
      </section>
    );
  }
  return <Quotation ord={ord} onReset={() => { lastOrd = null; setOrd(null); }} />;
}

// The quotation fee and the button that goes to Paystack, plus a place to review or edit your details.
function Quotation({ ord, onReset }) {
  const d = getD(ord.id);
  const [f, setF] = useState({ ds: d.ds || '', lc: d.lc || '', dt: d.dt || '', nm: d.nm || '', ph: d.ph || '' });
  const [saved, setSaved] = useState('');
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const L = ord.link || PAY.link;
  const ok = L && okl(L);

  // Remember the (possibly edited) details and which errand is being paid, for the Thank you page.
  function savePending() {
    setD(ord.id, { ds: f.ds.trim(), lc: f.lc.trim(), dt: f.dt.trim(), nm: f.nm.trim(), ph: f.ph.trim() });
    setPending({ id: ord.id, sv: ord.sv, p: ord.p, cur: ord.cur });
  }

  return (
    <section>
      <div className="wrap" style={{ maxWidth: '560px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '28px', alignItems: 'center' }}>
          <span className="tag">{ord.id}</span>
          <h2 style={{ fontSize: '1.5rem' }}>Your quotation</h2>
          <p style={{ color: 'var(--mut)' }}>{ord.sv}</p>
          <p style={{ color: 'var(--mut)', marginTop: '6px' }}>Quotation fee</p>
          <div className="price" style={{ fontSize: '2.8rem', lineHeight: 1.1 }}>{fmt(ord.p, ord.cur)}</div>
          {ok ? (
            <>
              <a className="btn sun" style={{ marginTop: '14px', fontSize: '1.1rem', padding: '16px 26px' }} href={L} target="_top" rel="noopener" onClick={savePending}>CHECKOUT WITH PAYSTACK →</a>
              <p style={{ color: 'var(--mut)', fontSize: '.85rem', marginTop: '6px' }}>You will be taken to Paystack's secure payment page. <a href={L} target="_blank" rel="noopener" onClick={savePending} style={{ fontWeight: 700, textDecoration: 'underline' }}>Not redirected? Open it in a new tab</a>.</p>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--mut)', marginTop: '10px' }}>Your payment link is not ready yet. Message us and we will send it right away.</p>
              <a className="btn sun" style={{ marginTop: '8px' }} target="_blank" rel="noopener" href={wa('Hello Errand Boys, please send the payment link for errand ' + ord.id + ' (' + fmt(ord.p, ord.cur) + ')')}>Request payment link on WhatsApp</a>
            </>
          )}
          {PAY.acct ? <p style={{ marginTop: '14px', color: 'var(--mut)' }}>Or pay by bank transfer: {PAY.bank}, account {PAY.acct} ({PAY.name}). Use <b>{ord.id}</b> as the reference.</p> : null}
        </div>
        <details className="card" style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Review or edit your details</summary>
          <label htmlFor="ck_ds">Task</label>
          <textarea id="ck_ds" rows="3" value={f.ds} onChange={set('ds')} />
          <label htmlFor="ck_lc">Location</label>
          <input id="ck_lc" value={f.lc} onChange={set('lc')} />
          <label htmlFor="ck_dt">Date and time</label>
          <input id="ck_dt" type="datetime-local" value={f.dt} onChange={set('dt')} />
          <label htmlFor="ck_nm">Name</label>
          <input id="ck_nm" value={f.nm} onChange={set('nm')} />
          <label htmlFor="ck_ph">Phone or WhatsApp</label>
          <input id="ck_ph" type="tel" value={f.ph} onChange={set('ph')} />
          <button className="btn" onClick={() => { savePending(); setSaved('Saved ✓'); }}>Save changes</button>
          <span id="ck_ok" className="ok">{saved}</span>
        </details>
        <p style={{ textAlign: 'center', marginTop: '14px' }}><a href="#/checkout" onClick={onReset} style={{ color: 'var(--mut)', fontSize: '.85rem' }}>Use a different checkout code</a></p>
      </div>
    </section>
  );
}
