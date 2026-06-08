import confetti from 'canvas-confetti'

const CONFETTI_COLORS = ['#4342F5', '#45F47F']

export function fireConfettiSideCannons(durationMs = 3000) {
  const end = Date.now() + durationMs

  const frame = () => {
    if (Date.now() > end) return

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: CONFETTI_COLORS,
    })
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: CONFETTI_COLORS,
    })

    requestAnimationFrame(frame)
  }

  frame()
}
