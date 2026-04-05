import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function calcDeadline(vendorNotified: string | null | undefined): string | null {
  if (!vendorNotified) return null
  const d = new Date(vendorNotified)
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + 90)
  return d.toISOString().slice(0, 10)
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const deadline = new Date(dateStr)
  if (isNaN(deadline.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
