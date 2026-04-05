import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getCachedFavicon, fetchAndCacheFavicon } from '../../lib/faviconCache'

interface Props {
  url: string | null | undefined
  size?: number
  className?: string
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export function VendorFavicon({ url, size = 16, className }: Props) {
  const domain = url ? extractDomain(url) : null
  const fetchSize = (size ?? 16) * 2

  const [src, setSrc] = useState<string | null>(() =>
    domain ? getCachedFavicon(domain) : null
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!domain) { setSrc(null); setFailed(false); return }

    // Check cache synchronously
    const cached = getCachedFavicon(domain)
    if (cached) { setSrc(cached); setFailed(false); return }

    // Fetch, cache, and set
    let cancelled = false
    fetchAndCacheFavicon(domain, fetchSize).then(dataUrl => {
      if (cancelled) return
      if (dataUrl) { setSrc(dataUrl); setFailed(false) }
      else setFailed(true)
    })
    return () => { cancelled = true }
  }, [domain, fetchSize])

  if (!domain || failed) {
    return <Building2 className={cn('text-muted-foreground/50', className)} style={{ width: size, height: size }} />
  }

  if (!src) {
    // Still loading — show placeholder
    return <div className={cn('bg-muted rounded-sm animate-pulse', className)} style={{ width: size, height: size }} />
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      className={cn('rounded-sm', className)}
      onError={() => setFailed(true)}
    />
  )
}
