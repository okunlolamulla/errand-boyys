import { EM, PH, PHD } from '../lib/config';
import { wa } from '../lib/format';
import PayLogos from './PayLogos';

const SITE_LINKS = [['/', 'Homepage'], ['/services', 'Services'], ['/shop', 'Shop'], ['/cart', 'Cart'], ['/request', 'Request an errand'], ['/verify', 'Verification errand'], ['/live', 'Live agent'], ['/track', 'Track errand'], ['/checkout', 'Checkout'], ['/about', 'About Errand Boys'], ['/contact', 'Contact us']];
const LEGAL = [['/terms', 'Terms of Use'], ['/privacy', 'Privacy Policy'], ['/refunds', 'Refund Policy'], ['/compliance', 'Compliance']];

export default function Footer() {
  return (
    <footer className="ft" id="ft">
      <div className="wrap">
        <div className="cols">
          <div>
            <a href="#/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <img className="lg2" alt="" src="/assets/img/logo.png" style={{ height: '44px', width: 'auto', background: '#fff', borderRadius: '10px', padding: '2px 4px' }} />
              <b style={{ font: "800 1.3rem var(--font)" }}><span style={{ color: "#fff" }}>Errand</span> <span style={{ color: "#d8f0ff" }}>Boys</span></b>
            </a>
            <p style={{ color: '#fff', maxWidth: '30ch' }}>Tell us what you need done, and we'll find someone to do it.</p>
          </div>
          <div>
            <h4>Links of Interest</h4>
            <ul>{SITE_LINKS.map((l) => <li key={l[0]}><a href={'#' + l[0]}>{l[1]}</a></li>)}</ul>
          </div>
          <div>
            <h4>Legals</h4>
            <ul>{LEGAL.map((l) => <li key={l[0]}><a href={'#' + l[0]}>{l[1]}</a></li>)}</ul>
          </div>
          <div>
            <h4>Customer Service</h4>
            <ul>
              <li>Email<br /><a href={`mailto:${EM}`}>{EM}</a></li>
              <li>Phone<br /><a href={`tel:${PH}`}>{PHD}</a></li>
              <li><a href={wa('Hello Errand Boys')} target="_blank" rel="noopener">Chat on WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <PayLogos />
        <p className="fine">© 2026 Errand Boys. All rights reserved.</p>
      </div>
    </footer>
  );
}
