const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      // For FormData (file uploads) the browser must set the Content-Type itself.
      headers: { ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the API is running and the address is right.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.details?.[0];
    throw new ApiError(d ? `${d.field}: ${d.message}` : data.error || 'Request failed', res.status);
  }
  return data;
}
