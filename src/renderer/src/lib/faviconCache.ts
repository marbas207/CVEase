const CACHE_PREFIX = 'cvease-favicon-'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  dataUrl: string
  timestamp: number
}

function getCacheKey(domain: string): string {
  return CACHE_PREFIX + domain
}

export function getCachedFavicon(domain: string): string | null {
  try {
    const raw = localStorage.getItem(getCacheKey(domain))
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(domain))
      return null
    }
    return entry.dataUrl
  } catch {
    return null
  }
}

export function cacheFavicon(domain: string, dataUrl: string): void {
  try {
    const entry: CacheEntry = { dataUrl, timestamp: Date.now() }
    localStorage.setItem(getCacheKey(domain), JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export async function fetchAndCacheFavicon(domain: string, size: number): Promise<string | null> {
  // Check cache first
  const cached = getCachedFavicon(domain)
  if (cached) return cached

  try {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        cacheFavicon(domain, dataUrl)
        resolve(dataUrl)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
