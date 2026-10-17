import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_URL } from '../lib/config';

const KEY = 'eb_cart';
const ID_KEY = 'eb_cart_id';
const CartCtx = createContext(null);
const newCartId = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
const loadId = () => { try { let id = localStorage.getItem(ID_KEY); if (!id) { id = newCartId(); localStorage.setItem(ID_KEY, id); } return id; } catch { return newCartId(); } };
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

// The shopping cart, remembered on the customer's device. { productId: { id, name, size, price, cat, qty } }
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [cartId, setCartId] = useState(loadId);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage blocked */ } }, [items]);

  // Tell the shop what is in the cart (ids and quantities only), so the admin can see live carts. Failures are ignored.
  useEffect(() => {
    if (!API_URL) return undefined;
    const t = setTimeout(() => {
      fetch(`${API_URL}/api/cart/${cartId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ items: Object.values(items).map((i) => ({ id: i.id, qty: i.qty })) }) }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [items, cartId]);

  const add = useCallback((p) => setItems((o) => ({
    ...o, [p.id]: { id: p.id, name: p.name, size: p.size, price: p.price, cat: p.cat, qty: Math.min(99, (o[p.id]?.qty || 0) + 1) },
  })), []);
  const setQty = useCallback((id, q) => setItems((o) => {
    const n = { ...o };
    if (q <= 0) delete n[id]; else if (n[id]) n[id] = { ...n[id], qty: Math.min(99, q) };
    return n;
  }), []);
  // After an order is placed the cart starts again under a new id, so the finished cart stays on record.
  const clear = useCallback(() => { setItems({}); const id = newCartId(); try { localStorage.setItem(ID_KEY, id); } catch { /* blocked */ } setCartId(id); }, []);

  const value = useMemo(() => {
    const list = Object.values(items);
    return {
      items, list, add, setQty, clear, cartId,
      count: list.reduce((a, i) => a + i.qty, 0),
      subtotal: list.reduce((a, i) => a + i.price * i.qty, 0),
    };
  }, [items, add, setQty, clear, cartId]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
