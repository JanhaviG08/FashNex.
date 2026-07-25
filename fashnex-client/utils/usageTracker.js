/**
 * fashnex-client/src/utils/usageTracker.js
 * ============================================
 * Minimal per-browser usage counter (localStorage-backed) for features
 * that don't have server-side event tracking yet. Not tied to the
 * account — good enough for a "X times used" badge on this device,
 * not a source of truth across devices.
 *
 * Wiring it up (one line each, in files not included in this upload):
 *   // src/pages/TryOn.jsx, inside useEffect on mount:
 *   import { trackUsage } from '../utils/usageTracker'
 *   trackUsage('tryOn')
 *
 *   // src/pages/WeatherRecommendation.jsx, when a recommendation is generated:
 *   trackUsage('weatherRec')
 *
 * If/when you add real server-side tracking, swap getUsageCount's
 * localStorage read for an API call — the call sites in Profile.jsx
 * don't need to change.
 */

const KEY = 'fashnex_usage_counts'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function trackUsage(key) {
  const all = readAll()
  all[key] = (all[key] || 0) + 1
  localStorage.setItem(KEY, JSON.stringify(all))
  return all[key]
}

export function getUsageCount(key) {
  return readAll()[key] || 0
}