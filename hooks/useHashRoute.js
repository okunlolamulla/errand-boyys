import { useEffect, useState } from 'react';

// The site uses hash addresses (#/services, #/checkout?c=...) so it works on any web server and old links keep working.
const read = () => {
  const raw = window.location.hash.slice(1) || '/';
  const [path, qs = ''] = raw.split('?');
  return { path, query: new URLSearchParams(qs), key: raw };
};

export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
