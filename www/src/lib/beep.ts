// Shared beep utility for urgent task notifications
let audioCtx: AudioContext | null = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playBeep() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "square";
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Beep failed:", e);
  }
}

export function playUrgentBeepSequence(count: number = 3, intervalMs: number = 400) {
  playBeep();
  let played = 1;
  const timer = setInterval(() => {
    if (played >= count) {
      clearInterval(timer);
      return;
    }
    playBeep();
    played++;
  }, intervalMs);
}
