import { useState } from 'react';
import { PH, PHD } from '../lib/config';
import { wa } from '../lib/format';

export default function Live() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  return (
    <section>
      <div className="wrap">
        <img className="trackpic" style={{ objectPosition: "50% 30%" }} src="/assets/img/live-agent.jpg" alt="A smiling Errand Boys agent on a phone call at a laptop" />
        <h2>Talk to a live agent</h2>
        <div className="grid">
          <div className="card">
            <div className="ic">💬</div>
            <h3>WhatsApp</h3>
            <p>Chat with us now.</p>
            <a className="btn" target="_blank" rel="noopener" href={wa('Hello Errand Boys, I need help.')}>Open WhatsApp</a>
          </div>
          <div className="card">
            <div className="ic">📞</div>
            <h3>Call us</h3>
            <p>{PHD}</p>
            {PH && <a className="btn" href={`tel:${PH}`}>Call now</a>}
          </div>
          <div className="card">
            <div className="ic">↩️</div>
            <h3>Request a callback</h3>
            <label htmlFor="cn">Name</label>
            <input id="cn" value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="cp">Phone</label>
            <input id="cp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <a className="btn sun" target="_blank" rel="noopener" href={wa(`Please call me back. Name: ${name}, Phone: ${phone}`)}>Ask for callback</a>
          </div>
        </div>
      </div>
    </section>
  );
}
