import { useState } from 'react';
import { S } from '../data/services';
import { FORMS } from '../data/forms';
import { API_URL } from '../lib/config';
import { buildMsg } from '../lib/message';
import { newId, wa } from '../lib/format';
import { rememberErrand, setD } from '../lib/storage';
import PhotoPicker from './PhotoPicker';

const QBTN = 'REQUEST QUOTATION FEE';

// One form engine for all eight services (fields come from data/forms.js). Calls onDone(result) when the request is ready.
export default function ServiceForm({ initialSel, locked, onDone }) {
  const [sel, setSel] = useState(String(initialSel));
  const [vals, setVals] = useState({});
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const F = FORMS[+sel];

  // Changing the service starts the form again.
  function change(v) { setSel(v); setVals({}); setPhotos([]); setErr(''); }
  const set = (k) => (e) => setVals((o) => ({ ...o, [k]: e.target.value }));

  async function submit() {
    const d = {};
    for (const f of F.f) d[f.k] = (vals[f.k] || '').trim();
    const miss = F.f.filter((f) => f.r && !d[f.k]);
    if (miss.length) return setErr('Please fill in: ' + miss.map((f) => f.m.toLowerCase()).join(', ') + '.');
    if (!/^\+?[0-9\s-]{7,20}$/.test(d.phone)) return setErr('Enter a valid phone number.');
    setBusy(true); setErr('');
    const A = F.api(d);
    let id = newId(), saved = false;
    if (API_URL) { // send to the admin dashboard too; if it fails the WhatsApp message still works
      try {
        const fd = new FormData();
        fd.append('service_type', F.service); fd.append('task_description', A.task);
        if (A.pickup) fd.append('pickup_location', A.pickup);
        if (A.delivery) fd.append('delivery_location', A.delivery);
        if (A.when) fd.append('date_time', new Date(A.when).toISOString());
        fd.append('contact_info', JSON.stringify({ name: d.name, phone: d.phone }));
        fd.append('details', JSON.stringify(Object.fromEntries(Object.entries(A.details).filter(([, v]) => v))));
        photos.forEach((f) => fd.append('photos', f));
        const r = await fetch(API_URL + '/api/errands', { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.errand_id) { id = j.errand_id; saved = true; }
      } catch { /* keep the offline ID */ }
    }
    rememberErrand(id);
    setD(id, { ds: A.ds, lc: A.lc, dt: A.when && String(A.when).length > 10 ? A.when : '', nm: d.name, ph: d.phone });
    const n = photos.length, m = buildMsg(F, d, id, n);
    const long = encodeURIComponent(m).length > 1900;
    const link = wa(long ? m.slice(0, 1000) + '\n…(rest pasted below)' : m);
    onDone({ kind: 'form', id, saved, n, m, long, link, photos });
  }

  return (
    <div className="card">
      <label htmlFor="sv">Service</label>
      <select id="sv" disabled={locked} value={sel} onChange={(e) => change(e.target.value)}>
        {S.map((s) => <option key={s.id} value={s.id}>{s.n}</option>)}
      </select>
      <div id="ff">
        {F ? (
          <>
            <p style={{ color: 'var(--mut)', fontSize: '.9rem', marginTop: '10px' }}>{F.intro}</p>
            {F.f.map((f) => <Field key={f.k} f={f} value={vals[f.k] || ''} onChange={set(f.k)} />)}
            {F.files && <PhotoPicker label={F.files} photos={photos} setPhotos={setPhotos} setError={setErr} />}
            <p id="er" style={{ color: '#d33', minHeight: '1.4em' }}>{err}</p>
            <button className="btn sun" disabled={busy} onClick={submit}>{busy ? 'Sending…' : (F.btn || QBTN)}</button>
          </>
        ) : (
          <GenericFields locked={locked} sel={sel} onDone={onDone} />
        )}
      </div>
    </div>
  );
}

function Field({ f, value, onChange }) {
  const id = 'f_' + f.k;
  const label = <label htmlFor={id}>{f.l}{f.r ? ' *' : ''}</label>;
  if (f.t === 'area') return <>{label}<textarea id={id} rows={f.rows || 3} maxLength={2500} placeholder={f.ph || ''} value={value} onChange={onChange} /></>;
  if (f.t === 'ck') {
    return (
      <>
        <label>{f.l}{f.r ? ' *' : ''}</label>
        <div role="group" aria-label={f.l} className="ckrow">
          {f.o.map((o) => (
            <label key={o} className="agebox"><input type="checkbox" checked={value === o} onChange={(e) => onChange({ target: { value: e.target.checked ? o : '' } })} /> {o}</label>
          ))}
        </div>
      </>
    );
  }
  if (f.t === 'sel') {
    return (
      <>{label}
        <select id={id} value={value} onChange={onChange}>
          <option value="">Select…</option>
          {f.o.map((o) => <option key={o}>{o}</option>)}
        </select>
      </>
    );
  }
  const type = { tel: 'tel', number: 'number', dt: 'datetime-local', d: 'date' }[f.t] || 'text';
  return (
    <>{label}
      <input id={id} type={type} {...(f.t === 'number' ? { min: '0', inputMode: 'numeric' } : {})} {...(f.ac ? { autoComplete: f.ac } : {})} placeholder={f.ph || ''} value={value} onChange={onChange} />
    </>
  );
}

// Fallback if the address names a service that has no dedicated form.
function GenericFields({ locked, sel, onDone }) {
  const [v, setV] = useState({ ds: '', lc: '', dt: '', nm: '', ph: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setV((o) => ({ ...o, [k]: e.target.value }));
  function send() {
    const g = (k) => v[k].trim();
    if (!g('ds') || !g('lc') || !g('nm') || !g('ph')) return setErr('Please fill in the task, location, your name and phone.');
    const id = newId(), sv = (S.find((s) => String(s.id) === sel) || S[0]).n;
    rememberErrand(id);
    setD(id, { ds: g('ds'), lc: g('lc'), dt: g('dt'), nm: g('nm'), ph: g('ph') });
    const m = `Hello Errand Boys. New request ${id}\nService: ${sv}\nTask: ${g('ds')}\nLocation: ${g('lc')}\nWhen: ${g('dt') || 'Flexible'}\nName: ${g('nm')}\nPhone: ${g('ph')}`;
    onDone({ kind: 'generic', id, link: wa(m) });
  }
  return (
    <>
      <label htmlFor="ds">{locked ? 'What should we verify?' : 'Describe the task'}</label>
      <textarea id="ds" rows="4" value={v.ds} onChange={set('ds')} />
      <label htmlFor="lc">Location</label><input id="lc" value={v.lc} onChange={set('lc')} />
      <label htmlFor="dt">Date and time</label><input id="dt" type="datetime-local" value={v.dt} onChange={set('dt')} />
      <label htmlFor="nm">Your name</label><input id="nm" value={v.nm} onChange={set('nm')} />
      <label htmlFor="ph">Phone or WhatsApp</label><input id="ph" type="tel" value={v.ph} onChange={set('ph')} />
      <p id="er" style={{ color: '#d33', minHeight: '1.4em' }}>{err}</p>
      <button className="btn sun" onClick={send}>{QBTN}</button>
    </>
  );
}
