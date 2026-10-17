import { useEffect, useState } from 'react';
import { API_URL } from '../lib/config';

// The shop catalogue. When the website is connected to the Errand Boys API it comes from there, so stock added, removed
// or marked "out of stock" in the admin dashboard shows up straight away. Without the API (or if it cannot be reached)
// the site falls back to /catalog.json, so the shop never goes blank.
let cache = null, cachedAt = 0, pending = null;
const FRESH_MS = 30000;

function fetchCatalog() {
  const local = () => fetch('/catalog.json', { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error('catalog'); return r.json(); });
  if (!API_URL) return local();
  return fetch(API_URL + '/api/catalog').then((r) => { if (!r.ok) throw new Error('api'); return r.json(); })
    .then((d) => { if (!d.products || !d.products.length) throw new Error('empty'); return d; })
    .catch(local);
}

export function useCatalog() {
  const fresh = cache && Date.now() - cachedAt < FRESH_MS;
  const [state, setState] = useState(cache ? { data: cache } : { loading: true });
  useEffect(() => {
    if (fresh) return undefined;
    let alive = true;
    pending = pending || fetchCatalog();
    pending.then((d) => { cache = d; cachedAt = Date.now(); pending = null; if (alive) setState({ data: d }); })
      .catch(() => { pending = null; if (alive && !cache) setState({ error: 'We could not load the shop right now. Please refresh and try again.' }); });
    return () => { alive = false; };
  }, [fresh]);
  return state;
}
