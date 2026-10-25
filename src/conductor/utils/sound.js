// Plays a short browser-generated tone so the "Sound alerts" settings can be tried out.
const TONES = { chime: [880, 1175], beep: [740, 740], alert: [660, 990, 660] }

export function playTone(tone = 'chime', volume = 60) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const gain = ctx.createGain()
    gain.gain.value = Math.max(0, Math.min(1, volume / 100)) * 0.25
    gain.connect(ctx.destination)
    const notes = TONES[tone] || TONES.chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.frequency.value = freq
      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.14)
    })
    setTimeout(() => ctx.close(), notes.length * 200 + 200)
  } catch {
    /* audio not available: ignore */
  }
}
