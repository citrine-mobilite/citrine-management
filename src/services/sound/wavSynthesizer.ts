// Synthesized WAV alarm tone in Base64 for 100% guaranteed HTML5 Audio playback fallback

export function generateAlarmWavBase64(): string {
  const sampleRate = 22050;
  const duration = 1.2;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF Header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate dual-pulse high urgency alarm beeps (880Hz / 1174Hz)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (t >= 0.02 && t < 0.18) {
      sample += Math.sin(2 * Math.PI * 880 * t) * 0.6;
      sample += Math.sin(2 * Math.PI * 1760 * t) * 0.25;
    } else if (t >= 0.22 && t < 0.38) {
      sample += Math.sin(2 * Math.PI * 1046.5 * t) * 0.6;
      sample += Math.sin(2 * Math.PI * 2093 * t) * 0.25;
    } else if (t >= 0.44 && t < 0.62) {
      sample += Math.sin(2 * Math.PI * 880 * t) * 0.6;
      sample += Math.sin(2 * Math.PI * 1760 * t) * 0.25;
    } else if (t >= 0.66 && t < 0.90) {
      sample += Math.sin(2 * Math.PI * 1174.66 * t) * 0.7;
      sample += Math.sin(2 * Math.PI * 2349 * t) * 0.2;
    }

    if (t >= 0.90) {
      const decay = Math.exp(-(t - 0.90) * 12);
      sample += Math.sin(2 * Math.PI * 1318.5 * t) * decay * 0.35;
    }

    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}
