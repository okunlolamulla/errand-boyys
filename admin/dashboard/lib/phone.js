// 0816 462 1148 -> 2348164621148, ready for https://wa.me/<number>
export function whatsappNumber(raw) {
  const cc = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || '234';
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = cc + d.slice(1);
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export function whatsappLink(phone, message) {
  const n = whatsappNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : null;
}
