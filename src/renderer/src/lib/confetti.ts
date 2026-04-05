import confetti from 'canvas-confetti'

export function firePublishedConfetti(): void {
  // First burst — centered
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#f97316', '#fb923c', '#fdba74', '#fbbf24', '#ffffff']
  })

  // Side cannons after a short delay
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } })
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } })
  }, 200)
}
