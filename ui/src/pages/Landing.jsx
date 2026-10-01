import { Link } from 'react-router-dom'
import { ShieldIcon } from '../components/Logo.jsx'

const FEATURES = [
  {
    tone: 'blue',
    title: 'Access your warranties',
    text: 'View all NFTs linked to your wallet',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    tone: 'green',
    title: 'Trusted and secure',
    text: 'Stored on blockchain. Tamper-proof.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 2 20 5v6c0 5.5-3.4 9.4-8 11-4.6-1.6-8-5.5-8-11V5l8-3Z" />
      </svg>
    ),
  },
  {
    tone: 'purple',
    title: 'Start managing',
    text: 'File claims, transfer ownership and more',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
]

function Headphones() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <path d="M18 70V58a42 42 0 0 1 84 0v12" fill="none" stroke="#1f2328" strokeWidth="9" strokeLinecap="round" />
      <rect x="8" y="58" width="26" height="44" rx="12" fill="#2b3036" />
      <rect x="86" y="58" width="26" height="44" rx="12" fill="#2b3036" />
      <rect x="14" y="64" width="12" height="32" rx="6" fill="#16191d" />
      <rect x="94" y="64" width="12" height="32" rx="6" fill="#16191d" />
    </svg>
  )
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-pedestal" />
      <div className="hero-phone">
        <div className="hero-screen">
          <ShieldIcon size={54} />
          <p className="hero-phone-brand">DigiProof</p>
          <div className="hero-product">
            <Headphones />
          </div>
          <p className="hero-product-name">Wireless Headphones XR200</p>
          <span className="hero-verified">✓ Verified on-chain</span>
          <p className="hero-serial">SN-48213-XR</p>
          <span className="hero-skeleton" />
          <span className="hero-skeleton short" />
        </div>
      </div>
      <div className="hero-badge">
        <svg viewBox="0 0 40 44">
          <path d="M20 1 L38 7 V20 C38 31 30 39 20 43 C10 39 2 31 2 20 V7 Z" fill="#1d6ff2" />
          <path d="M12 22 L18 28 L29 16" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="hero-note">
        <p>
          Your products.
          <br />
          Your ownership.
          <br />
          On-chain.
        </p>
        <svg viewBox="0 0 120 12" className="hero-note-line">
          <path d="M2 10 C40 2 80 1 118 4" fill="none" stroke="#1d6ff2" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>A smarter way to protect what you own.</h1>
          <p className="hero-lead">
            Store, verify and manage your product warranties as secure NFTs on the blockchain.
          </p>
          <Link to="/register" className="hero-cta">
            Create an Account <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-signin">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
        <HeroVisual />
      </section>

      <section className="features">
        {FEATURES.map((feature) => (
          <div className="feature" key={feature.title}>
            <span className={`feature-icon ${feature.tone}`}>{feature.icon}</span>
            <div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="landing-banner">
        <span className="landing-banner-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48">
            <path d="M24 5 42 14v20L24 43 6 34V14Z" fill="#4f8df7" />
            <path d="M24 5 42 14 24 23 6 14Z" fill="#9cc0fb" />
            <path d="M24 23v20l18-9V14Z" fill="#1d5fe0" />
            <path d="M15 9.5 33 18.5v7l-4 2v-7L11 11.5Z" fill="#e3edfe" />
          </svg>
        </span>
        <p>
          From everyday products to big purchases,
          <br />
          DigiProof keeps your warranties in one secure place.
        </p>
      </section>
    </div>
  )
}
