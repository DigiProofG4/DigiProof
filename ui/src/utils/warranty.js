import { parseDate } from './dates.js'

const DAY_MS = 24 * 60 * 60 * 1000

export const STATE_LABELS = {
  active: 'Active',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  pending: 'Pending',
  void: 'Void',
}

export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// The status the owner cares about, which also looks at the date: an "active"
// warranty past its end date is expired, and one within the owner's "expiring soon"
// window (App settings, 90 days by default) is expiring soon.
export function displayState(warranty, today, soonDays) {
  if (warranty.status === 'void' || warranty.status === 'pending') return warranty.status
  const daysLeft = Math.round((parseDate(warranty.expires_on) - today) / DAY_MS)
  if (warranty.status === 'expired' || daysLeft < 0) return 'expired'
  if (daysLeft <= soonDays) return 'expiring'
  return 'active'
}

function plural(count, unit) {
  return `${count} ${unit}${count === 1 ? '' : 's'}`
}

export function timeLeft(iso, today) {
  const end = parseDate(iso)
  const days = Math.round((end - today) / DAY_MS)
  if (days < 0) return `Ended ${plural(-days, 'day')} ago`
  if (days === 0) return 'Ends today'
  if (days < 31) return `${plural(days, 'day')} remaining`
  const months = (end.getFullYear() - today.getFullYear()) * 12 + end.getMonth() - today.getMonth()
  if (months < 12) return `${plural(months, 'month')} remaining`
  return `${plural(Math.floor(months / 12), 'year')} remaining`
}

// 24 → "2 years", 18 → "18 months".
export function coverLength(months) {
  return months % 12 === 0 ? plural(months / 12, 'year') : plural(months, 'month')
}
