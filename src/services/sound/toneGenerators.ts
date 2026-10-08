// Web Audio API tone synthesis primitives

export function playSineTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  volume = 0.2,
  startTime?: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = startTime ?? ctx.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

export function playChord(
  ctx: AudioContext,
  frequencies: number[],
  duration: number,
  volume = 0.15
): void {
  const now = ctx.currentTime;
  frequencies.forEach((freq) => {
    playSineTone(ctx, freq, duration, volume / frequencies.length, now);
  });
}

export function playBeepSequence(
  ctx: AudioContext,
  notes: { freq: number; start: number; duration: number; type?: OscillatorType }[],
  volume = 0.2
): void {
  const baseTime = ctx.currentTime;
  notes.forEach(({ freq, start, duration, type = 'sine' }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = baseTime + start;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });
}
