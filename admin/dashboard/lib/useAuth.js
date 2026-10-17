'use client';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from './api';


// The sign-in token lives in sessionStorage: it is cleared when the tab closes and it expires with the token.
export function useAuth(role = 'admin') {
  const KEY = `eb_session_${role}`;
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && s.exp > Date.now()) setSession(s);
      else sessionStorage.removeItem(KEY);
    } catch { /* ignore a corrupted value */ }
    setReady(true);
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    if (r.user.role !== role) throw new ApiError(`This account is not ${role === 'admin' ? 'an admin' : 'an agent'} account`, 403);
    const s = { token: r.access_token, user: r.user, exp: Date.now() + (r.expires_in - 30) * 1000 };
    sessionStorage.setItem(KEY, JSON.stringify(s));
    setSession(s);
  }, [KEY, role]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
  }, [KEY]);

  // Adds the token to every call and signs you out if the server says it has expired.
  const request = useCallback(async (path, opts = {}) => {
    try {
      return await apiFetch(path, { ...opts, token: session?.token });
    } catch (err) {
      if (err.status === 401) logout();
      throw err;
    }
  }, [session, logout]);

  // Keeps the stored session in step when something about the user changes (e.g. the password was just changed).
  const updateUser = useCallback((patch) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, user: { ...s.user, ...patch } };
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [KEY]);

  return { session, ready, login, logout, request, updateUser };
}
