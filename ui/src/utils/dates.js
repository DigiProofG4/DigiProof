// Warranty dates arrive as YYYY-MM-DD. Build them in local time so the day never shifts.
export function parseDate(iso) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

// "long" → 24 Sept 2027, "iso" → 2027-09-24; chosen per user in App settings.
export function formatDate(iso, format = 'long') {
  if (format === 'iso') return iso.slice(0, 10)
  return parseDate(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}
