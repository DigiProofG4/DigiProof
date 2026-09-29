import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, imageSrc } from '../api/client.js'

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  )
}

// What the banner says for each outcome. "missing" covers a serial with no warranty.
const VERDICTS = {
  active: {
    tone: 'ok',
    mark: '✓',
    title: 'Valid Product',
    text: 'This is an authentic product registered on the DigiProof blockchain.',
  },
  pending: {
    tone: 'warn',
    mark: '!',
    title: 'Not Minted Yet',
    text: 'The warranty is recorded, but its token has not been written to the blockchain yet.',
  },
  expired: {
    tone: 'warn',
    mark: '!',
    title: 'Warranty Expired',
    text: 'This product is registered on DigiProof, but its cover has ended.',
  },
  void: {
    tone: 'bad',
    mark: '✕',
    title: 'Warranty Void',
    text: 'This warranty has been cancelled and is no longer valid.',
  },
  missing: {
    tone: 'bad',
    mark: '✕',
    title: 'No Warranty Found',
    text: 'There is no DigiProof warranty for this serial number. Check it and try again.',
  },
}

function VerifyIllustration() {
  return (
    <div className="verify-art" aria-hidden="true">
      <div className="verify-art-glow" />
      <div className="verify-art-doc">
        <svg viewBox="0 0 40 44" className="verify-art-shield">
          <path d="M20 1 L38 7 V20 C38 31 30 39 20 43 C10 39 2 31 2 20 V7 Z" fill="#4f8df7" />
          <path
            d="M12 22 L18 28 L29 16"
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="verify-art-line" />
        <span className="verify-art-line" />
        <span className="verify-art-line short" />
      </div>
      <svg viewBox="0 0 120 120" className="verify-art-lens">
        <circle
          cx="48"
          cy="48"
          r="32"
          fill="rgba(255,255,255,0.35)"
          stroke="#2f74f0"
          strokeWidth="12"
        />
        <path d="M72 72 104 104" stroke="#2f74f0" strokeWidth="16" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function ProductArt({ product }) {
  // The retailer's photo when there is one; the neutral box otherwise (or if the link is broken).
  const [broken, setBroken] = useState(false)
  const src = imageSrc(product.image_url)

  return (
    <div className="verify-product-art">
      {src && !broken ? (
        <img src={src} alt={product.name} onError={() => setBroken(true)} />
      ) : (
        <svg viewBox="0 0 120 110" aria-hidden="true">
          <path d="M60 8 108 30 60 52 12 30Z" fill="#8fb4f9" />
          <path d="M12 30 60 52v50L12 80Z" fill="#4f8df7" />
          <path d="M108 30 60 52v50l48-22Z" fill="#1d4ed8" />
          <path d="M36 19 84 41v14l-10 4V45L26 23Z" fill="#dbe7fd" />
          <path d="M76 66l8-4" stroke="#dbe7fd" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {(product.brand || product.model) && (
        <p>{[product.brand, product.model].filter(Boolean).join(' · ')}</p>
      )}
    </div>
  )
}

export default function Verify() {
  // /verify?serial=... opens with the check already run (e.g. from a QR code on a receipt).
  const [params, setParams] = useSearchParams()
  const [serial, setSerial] = useState(params.get('serial') || '')
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (serial) check(serial)
    // Only on first load; later checks go through the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    setParams({ serial: serial.trim() }, { replace: true })
    check(serial)
  }

  async function check(value) {
    setError('')
    setResult(null)
    setNotFound(false)
    setBusy(true)
    try {
      const warranty = await api.verifyBySerial(value.trim())
      setResult(warranty)
    } catch (err) {
      // "No warranty for that serial number" (a 404) is an answer, not a failure,
      // so it gets the result card rather than an error line.
      if (/no warranty/i.test(err.message)) setNotFound(true)
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const verdict = notFound
    ? VERDICTS.missing
    : result
      ? VERDICTS[result.status] || VERDICTS.active
      : null

  return (
    <div className="verify">
      <section className="verify-hero">
        <div>
          <h1>Verify a Warranty</h1>
          <p className="verify-lead">
            Check any serial number's warranty status — no account needed.
            <br />
            Useful for a second-hand buyer or a service centre.
          </p>

          <div className="verify-search">
            <div className="verify-search-head">
              <span className="verify-search-icon">
                <SearchIcon />
              </span>
              <div>
                <h2>Enter Serial Number</h2>
                <p>Enter the product's serial number to check its warranty information.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="verify-form">
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="e.g. AUR-27-000451"
                aria-label="Serial number"
                required
              />
              <button type="submit" disabled={busy}>
                <SearchIcon />
                {busy ? 'Checking…' : 'Check'}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
        <VerifyIllustration />
      </section>

      {verdict && (
        <section className="verify-result">
          <h2>Verification Result</h2>
          <div className={`verify-banner ${verdict.tone}`}>
            <span className="verify-banner-mark">{verdict.mark}</span>
            <div>
              <strong>{verdict.title}</strong>
              <p>{verdict.text}</p>
            </div>
          </div>

          {result && (
            <div className="verify-body">
              <ProductArt product={result.product} />
              <dl className="verify-details">
                <dt>Product</dt>
                <dd>{result.product.name}</dd>
                <dt>Serial Number</dt>
                <dd className="mono">{result.product.serial_number}</dd>
                <dt>Status</dt>
                <dd>
                  <span className={`pill pill-${result.status}`}>{result.status}</span>
                </dd>
                <dt>Expiry Date</dt>
                <dd>{result.expires_on}</dd>
                <dt>Token</dt>
                <dd className="mono">{result.token_id || 'not minted yet'}</dd>
                {result.explorer_tx_url && (
                  <>
                    <dt>On-chain Record</dt>
                    <dd>
                      <a href={result.explorer_tx_url} target="_blank" rel="noreferrer">
                        View transaction ↗
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
