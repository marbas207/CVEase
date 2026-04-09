import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { cn } from '../../lib/utils'

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
  const [failed, setFailed] = useState(false)
  const domain = url ? extractDomain(url) : null

  if (!domain || failed) {
    return <Building2 className={cn('text-muted-foreground/50', className)} style={{ width: size, height: size }} />
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${(size ?? 16) * 2}`}
      width={size}
      height={size}
      alt=""
      className={cn('rounded-sm', className)}
      onError={() => setFailed(true)}
    />
  )
}
