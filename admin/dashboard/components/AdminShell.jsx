'use client';
import { useCallback, useState } from 'react';
import Dashboard from './Dashboard';
import Overview from './admin/Overview';
import Orders from './admin/Orders';
import Customers from './admin/Customers';
import Services from './admin/Services';
import Payments from './admin/Payments';
import Tracking from './admin/Tracking';
import Stock from './admin/Stock';
import Carts from './admin/Carts';
import QuoteModal from './QuoteModal';
import ManualPaymentModal from './ManualPaymentModal';
import ErrandDetailModal from './ErrandDetailModal';
import ChangePassword from './ChangePassword';

const NAV = [
  { id: 'overview', icon: '📊', label: 'Dashboard overview' },
  { id: 'orders', icon: '📦', label: 'Order management' },
  { id: 'customers', icon: '👥', label: 'Customer management' },
  { id: 'services', icon: '🧰', label: 'Services management' },
  { id: 'payments', icon: '💳', label: 'Payments & transactions' },
  { id: 'tracking', icon: '📍', label: 'Errand tracking' },
  { id: 'stock', icon: '🏷️', label: 'Stock management' },
  { id: 'carts', icon: '🛒', label: 'Customer carts' },
  { id: 'workflow', icon: '🗂️', label: 'Workflow board' },
];

// The admin home: a side menu with the six control areas, plus the original workflow board.
export default function AdminShell({ request, user, onLogout }) {
  const [view, setView] = useState('overview');
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null); // { type: 'quote' | 'pay' | 'detail', errand }
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const close = useCallback(() => setModal(null), []);
  const pick = (id) => { setView(id); setMenu(false); };
  const current = NAV.find((n) => n.id === view);

  return (
    <div className="admin">
      <aside className={`side${menu ? ' open' : ''}`}>
        <div className="brand">Errand Boys <small>Admin</small></div>
        <nav aria-label="Admin sections">
          {NAV.map((n) => (
            <button key={n.id} className={`navbtn${view === n.id ? ' on' : ''}`} aria-current={view === n.id ? 'page' : undefined} onClick={() => pick(n.id)}>
              <span aria-hidden="true">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div className="side-foot"><span>{user.name}</span><button className="btn ghost" onClick={() => setModal({ type: 'password' })}>Change password</button><button className="btn ghost" onClick={onLogout}>Sign out</button></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="btn menu-btn" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>☰</button>
          <h1>{current.label}</h1>
          <button className="btn ghost" onClick={refresh}>Refresh</button>
        </header>
        {view === 'overview' && <Overview key={tick} request={request} goto={pick} />}
        {view === 'orders' && <Orders request={request} refreshKey={tick} open={(e) => setModal({ type: 'detail', errand: e })} onQuote={(e) => setModal({ type: 'quote', errand: e })} onPay={(e) => setModal({ type: 'pay', errand: e })} />}
        {view === 'customers' && <Customers request={request} openOrder={(e) => setModal({ type: 'detail', errand: e })} />}
        {view === 'services' && <Services request={request} />}
        {view === 'payments' && <Payments key={tick} request={request} openOrder={(e) => setModal({ type: 'detail', errand: e })} />}
        {view === 'tracking' && <Tracking request={request} refreshKey={tick} onChanged={refresh} open={(e) => setModal({ type: 'detail', errand: e })} />}
        {view === 'stock' && <Stock request={request} />}
        {view === 'carts' && <Carts request={request} openOrder={(e) => setModal({ type: 'detail', errand: e })} />}
        {view === 'workflow' && <Dashboard embedded request={request} user={user} onLogout={onLogout} />}
      </main>
      {modal?.type === 'password' && <ChangePassword request={request} onClose={close} onDone={close} />}
      {modal?.type === 'quote' && <QuoteModal errand={modal.errand} request={request} onClose={close} onDone={refresh} />}
      {modal?.type === 'pay' && <ManualPaymentModal errand={modal.errand} request={request} onClose={close} onDone={refresh} />}
      {modal?.type === 'detail' && <ErrandDetailModal id={modal.errand.errand_id} request={request} onClose={close} onChanged={refresh} />}
    </div>
  );
}
