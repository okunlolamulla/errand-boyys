// Payment marks shown in the footer on every page. Simple vector badges, no outside images needed.
const box = { width: 84, height: 46, viewBox: '0 0 84 46', role: 'img' };

export default function PayLogos() {
  return (
    <div className="paylogos" aria-label="Accepted payment methods">
      <span className="paylabel">Secure payments</span>
      <svg {...box} aria-label="Paystack">
        <rect width="84" height="46" rx="9" fill="#fff" />
        <g fill="#00C3F7">
          <rect x="9" y="12" width="14" height="3.4" rx="1.2" />
          <rect x="9" y="18" width="14" height="3.4" rx="1.2" />
          <rect x="9" y="24" width="14" height="3.4" rx="1.2" />
          <rect x="9" y="30" width="8" height="3.4" rx="1.2" />
        </g>
        <text x="27" y="27.5" fontFamily="Inter,Arial,sans-serif" fontWeight="800" fontSize="11.5" fill="#011B33" letterSpacing="-.2">paystack</text>
      </svg>
      <svg {...box} aria-label="Mastercard">
        <rect width="84" height="46" rx="9" fill="#fff" />
        <circle cx="34" cy="20" r="11" fill="#EB001B" />
        <circle cx="50" cy="20" r="11" fill="#F79E1B" />
        <path d="M42 11.2a11 11 0 0 1 0 17.6 11 11 0 0 1 0-17.6z" fill="#FF5F00" />
        <text x="42" y="40" textAnchor="middle" fontFamily="Inter,Arial,sans-serif" fontWeight="600" fontSize="8" fill="#222">mastercard</text>
      </svg>
      <svg {...box} aria-label="Visa">
        <rect width="84" height="46" rx="9" fill="#fff" />
        <text x="42" y="30" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontWeight="900" fontStyle="italic" fontSize="21" fill="#1A1F71" letterSpacing="-.5">VISA</text>
      </svg>
      <svg {...box} aria-label="Verve">
        <rect width="84" height="46" rx="9" fill="#fff" />
        <text x="40" y="28" textAnchor="middle" fontFamily="Inter,Arial,sans-serif" fontWeight="800" fontSize="16" fill="#1B1B1B" letterSpacing="-.3">Verve</text>
        <path d="M60 14c4 0 7 2 7 5" fill="none" stroke="#EE3124" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="64" cy="26" r="2.2" fill="#00A9E0" />
      </svg>
    </div>
  );
}
