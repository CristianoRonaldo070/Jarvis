// Sound effects using Web Audio API — no external files needed, completely free
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  fadeOut = true,
  delay = 0
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  if (fadeOut) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

/** Boot-up / splash screen — ascending sci-fi tones */
export function playBootSound() {
  playTone(220, 0.3, 'sine', 0.12, true, 0);
  playTone(330, 0.3, 'sine', 0.12, true, 0.15);
  playTone(440, 0.3, 'sine', 0.14, true, 0.3);
  playTone(660, 0.5, 'sine', 0.16, true, 0.45);
  playTone(880, 0.6, 'triangle', 0.10, true, 0.6);
}

/** Activation beep — crisp double ping */
export function playActivateSound() {
  playTone(880, 0.12, 'sine', 0.18, true, 0);
  playTone(1320, 0.18, 'sine', 0.15, true, 0.1);
}

/** Deactivation — descending beep */
export function playDeactivateSound() {
  playTone(880, 0.12, 'sine', 0.15, true, 0);
  playTone(440, 0.2, 'sine', 0.12, true, 0.1);
}

/** Processing / thinking — subtle pulsing */
export function playProcessingSound() {
  playTone(660, 0.15, 'triangle', 0.08, true, 0);
  playTone(770, 0.15, 'triangle', 0.08, true, 0.2);
  playTone(660, 0.15, 'triangle', 0.08, true, 0.4);
}

/** Response ready — gentle chime */
export function playResponseSound() {
  playTone(1047, 0.15, 'sine', 0.12, true, 0);
  playTone(1319, 0.2, 'sine', 0.10, true, 0.12);
  playTone(1568, 0.3, 'sine', 0.08, true, 0.25);
}

/** Error / alert sound */
export function playErrorSound() {
  playTone(330, 0.15, 'square', 0.10, true, 0);
  playTone(220, 0.25, 'square', 0.08, true, 0.15);
}

/** Login success — warm ascending */
export function playLoginSound() {
  playTone(523, 0.15, 'sine', 0.12, true, 0);
  playTone(659, 0.15, 'sine', 0.12, true, 0.12);
  playTone(784, 0.15, 'sine', 0.14, true, 0.24);
  playTone(1047, 0.3, 'sine', 0.12, true, 0.36);
}

/** Logout sound — gentle descending */
export function playLogoutSound() {
  playTone(784, 0.12, 'sine', 0.10, true, 0);
  playTone(523, 0.2, 'sine', 0.08, true, 0.1);
}

/** Subtle click for UI interactions */
export function playClickSound() {
  playTone(1200, 0.05, 'sine', 0.08, true, 0);
}

/** Resume audio context on user gesture (required by browsers) */
export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
