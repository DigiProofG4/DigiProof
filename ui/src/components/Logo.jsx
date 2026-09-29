// Vector version of the DigiProof logo, so it stays sharp at any size.
export function ShieldIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" aria-hidden="true">
      <defs>
        <linearGradient id="shield-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M20 1 L38 7 V20 C38 31 30 39 20 43 C10 39 2 31 2 20 V7 Z" fill="url(#shield-fill)" />
      <path d="M20 7 L32 11 V20 C32 28 27 33 20 36 C13 33 8 28 8 20 V11 Z" fill="#ffffff" />
      {/* Light diagonal band across the inner shield */}
      <path d="M20 7 L32 11 V17 L8 29 C8 26 8 23 8 20 V11 Z" fill="#dbeafe" />
    </svg>
  )
}

export default function Logo() {
  return (
    <span className="logo">
      <ShieldIcon />
      <span className="logo-text">
        <span className="logo-name">DigiProof</span>
        <span className="logo-tagline">Your products. Verified on-chain.</span>
      </span>
    </span>
  )
}
