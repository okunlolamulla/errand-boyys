export const money = (amount, currency = 'NGN') =>
  amount == null ? '—' : new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(amount));

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '';

export const shortText = (text = '', max = 60) => (text.length > max ? `${text.slice(0, max)}…` : text);

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export const slug = (status) => status.toLowerCase().replace(/\s+/g, '-');
