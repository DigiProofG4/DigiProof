import { useState } from 'react'
import { imageSrc } from '../api/client.js'

// The product's photo, or a neutral box when there is none (or the link is broken).
export default function ProductImage({ product, size = 48, className = '' }) {
  const [broken, setBroken] = useState(false)
  const src = imageSrc(product.image_url)
  const style = { width: size, height: size }

  if (!src || broken) {
    return (
      <span className={`product-image placeholder ${className}`} style={style} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" />
          <path d="M3 7l9 5 9-5M12 12v10" />
        </svg>
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={product.name}
      className={`product-image ${className}`}
      style={style}
      onError={() => setBroken(true)}
    />
  )
}
