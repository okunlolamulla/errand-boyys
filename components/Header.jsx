import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { S } from '../data/services';

const LINKS = [
  ['/', 'Home'], ['/services', 'Services'], ['/shop', 'Shop'], ['/shop?cat=groceries', 'Grocery shopping'], ['/request', 'Request an errand'], ['/verify', 'Verification errand'], ['/live', 'Live agent'],
  ['/track', 'Track errand'], ['/cart', 'Cart'], ['/checkout', 'Checkout'], ['/about', 'About'], ['/contact', 'Contact'],
];

// Logo on the left, menu button on the right that opens the list of pages.
export default function Header({ path }) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(false);
  const { count } = useCart();

  // Close the menu when you click outside it or press Esc.
  useEffect(() => {
    const onClick = (e) => { if (!e.target.closest('nav')) { setOpen(false); setSub(false); } };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setSub(false); } };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const active = (to) => to === path || (path === '/service' && to === '/services');

  return (
    <header>
      <div className="wrap">
        <nav aria-label="Main">
          <a className="logo" href="#/"><img src="/assets/img/logo.png" alt="Errand Boys logo" /><span>Errand <i>Boys</i></span></a>
          <a className="cartlink" href="#/cart" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>🛒{count > 0 && <span className="cbadge">{count}</span>}</a>
          <button id="mb" className="mb" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mp" onClick={() => { setOpen((o) => !o); setSub(false); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div id="mp" className="mp" hidden={!open}>
            {LINKS.map(([to, label]) => to === '/services' ? (
              <div key={to} className="svwrap">
                <div className="svrow">
                  <a className={'l' + (active(to) ? ' on' : '')} href={'#' + to} onClick={() => { setOpen(false); setSub(false); }}>{label}</a>
                  <button type="button" className="svtog" aria-label={sub ? 'Hide services list' : 'Show services list'} aria-expanded={sub} aria-controls="svsub" onClick={() => setSub((v) => !v)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: sub ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                </div>
                <div id="svsub" className="svsub" hidden={!sub}>
                  {S.map((s) => (
                    <a key={s.id} className="l" href={`#/service?s=${s.id}`} onClick={() => { setOpen(false); setSub(false); }}><span aria-hidden="true">{s.i}</span> {s.n}</a>
                  ))}
                </div>
              </div>
            ) : (
              <a key={to} className={'l' + (active(to) ? ' on' : '')} href={'#' + to} onClick={() => setOpen(false)}>{label}</a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
