// Audio Tone Generator using native Web Audio API & HTML5 Audio Fallback (100% offline, zero asset dependencies)

class SoundService {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private ringbackInterval: any = null;
  private alarmInterval: any = null;
  private fallbackAlarmAudio: HTMLAudioElement | null = null;
  public isUnlocked: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Generate a synthesized WAV alarm tone in Base64 for 100% guaranteed HTML5 Audio playback fallback
  private generateAlarmWavBase64(): string {
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

      // Beep 1: 0.00s - 0.18s @ 880Hz
      if (t >= 0.02 && t < 0.18) {
        sample += Math.sin(2 * Math.PI * 880 * t) * 0.6;
        sample += Math.sin(2 * Math.PI * 1760 * t) * 0.25;
      }
      // Beep 2: 0.22s - 0.38s @ 1046Hz
      else if (t >= 0.22 && t < 0.38) {
        sample += Math.sin(2 * Math.PI * 1046.5 * t) * 0.6;
        sample += Math.sin(2 * Math.PI * 2093 * t) * 0.25;
      }
      // Beep 3: 0.44s - 0.62s @ 880Hz
      else if (t >= 0.44 && t < 0.62) {
        sample += Math.sin(2 * Math.PI * 880 * t) * 0.6;
        sample += Math.sin(2 * Math.PI * 1760 * t) * 0.25;
      }
      // Beep 4: 0.66s - 0.90s @ 1174.66Hz (High D6 alarm finish)
      else if (t >= 0.66 && t < 0.90) {
        sample += Math.sin(2 * Math.PI * 1174.66 * t) * 0.7;
        sample += Math.sin(2 * Math.PI * 2349 * t) * 0.2;
      }

      // Bell decay resonance tail: 0.90s - 1.20s
      if (t >= 0.90) {
        const decay = Math.exp(-(t - 0.90) * 12);
        sample += Math.sin(2 * Math.PI * 1318.5 * t) * decay * 0.35;
      }

      // Clamp to 16-bit PCM integer range [-32768, 32767]
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

  // Unlock AudioContext on first user interaction (click/touch/key)
  public unlockAudio(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        }).catch(() => {});
      } else {
        this.isUnlocked = true;
      }

      // Pre-warm HTML5 Audio fallback
      if (!this.fallbackAlarmAudio && typeof Audio !== 'undefined') {
        try {
          const wavUri = this.generateAlarmWavBase64();
          this.fallbackAlarmAudio = new Audio(wavUri);
          this.fallbackAlarmAudio.volume = 0.9;
        } catch (e) {}
      }

      // Play a micro silent buffer to warm up audio engine
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      // Ignore
    }
  }

  // Loud & Resonant Alarm Chime (Repeating multi-frequency digital alarm alert)
  public playAlarmTone(volume = 0.9): void {
    let playedWebAudio = false;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      
      const now = ctx.currentTime;

      // Play high urgency multi-tone pattern (880Hz A5 + 1046Hz C6 + 1174Hz D6)
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Primary tone
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        // Harmonic overtone for brilliance & penetrating alert volume
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.5, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.02);
        gain.gain.setValueAtTime(volume * 0.8, startTime + duration - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };

      // Pulse 1: Beep-Beep
      playBeep(880, now, 0.14);
      playBeep(1046.5, now + 0.16, 0.16);

      // Pulse 2: Beep-Beep (higher urgency)
      playBeep(880, now + 0.38, 0.14);
      playBeep(1174.66, now + 0.54, 0.22); // D6

      // Extra loud bell resonance chime
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(1318.5, now + 0.60); // E6
      bellGain.gain.setValueAtTime(volume * 0.6, now + 0.60);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      bell.connect(bellGain);
      bellGain.connect(ctx.destination);
      bell.start(now + 0.60);
      bell.stop(now + 1.4);

      playedWebAudio = true;
    } catch (e) {
      console.warn('WebAudio playAlarmTone error, trying HTML5 Audio fallback:', e);
    }

    // Secondary fallback: HTML5 Audio with embedded base64 WAV sound
    if (!playedWebAudio || this.ctx?.state === 'suspended') {
      try {
        if (!this.fallbackAlarmAudio && typeof Audio !== 'undefined') {
          const wavUri = this.generateAlarmWavBase64();
          this.fallbackAlarmAudio = new Audio(wavUri);
        }
        if (this.fallbackAlarmAudio) {
          this.fallbackAlarmAudio.currentTime = 0;
          this.fallbackAlarmAudio.volume = volume;
          this.fallbackAlarmAudio.play().catch(() => {});
        }
      } catch (e) {}
    }

    // Trigger mobile vibration if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (e) {}
    }
  }

  // Active alarm repeating chime loop (Rings until dismissed)
  public startAlarmLoop(intervalMs = 2000, volume = 0.9): void {
    this.stopAlarmLoop();
    this.unlockAudio();
    this.playAlarmTone(volume);
    this.alarmInterval = setInterval(() => {
      this.playAlarmTone(volume);
    }, intervalMs);
  }

  // Stop ongoing alarm loop
  public stopAlarmLoop(): void {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.fallbackAlarmAudio) {
      try {
        this.fallbackAlarmAudio.pause();
        this.fallbackAlarmAudio.currentTime = 0;
      } catch (e) {}
    }
  }

  // Instant notification / Alert Chime (for urgent toasts, new warnings, incidents)
  public playAlertNotification(volume = 0.7): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;

      // Fast rising alert chime (587Hz -> 880Hz -> 1174Hz)
      const notes = [587.33, 880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(volume * 0.7, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      console.warn('Alert notification playback error:', e);
    }
  }

  // Incoming Call Ringtone (Pleasant musical chord sequence)
  public startIncomingRingtone(): void {
    this.stopAll();
    const playChime = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        // Dual pleasant frequency chime (A4 + E5 + A5)
        const notes = [440, 659.25, 880];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + index * 0.15);

          gain.gain.setValueAtTime(0, now + index * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + index * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.15 + 0.5);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + index * 0.15);
          osc.stop(now + index * 0.15 + 0.55);
        });
      } catch (e) {
        console.warn('Audio ringtone playback warning:', e);
      }
    };

    playChime();
    this.ringtoneInterval = setInterval(playChime, 2200);
  }

  // Outgoing Ringback tone (Standard gentle European phone ringback beep)
  public startOutgoingRingback(): void {
    this.stopAll();
    const playRingback = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(425, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.setValueAtTime(0.15, now + 1.0);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.1);
        osc2.stop(now + 1.1);
      } catch (e) {
        console.warn('Ringback audio playback warning:', e);
      }
    };

    playRingback();
    this.ringbackInterval = setInterval(playRingback, 3500);
  }

  // Call Connected Beep (Short high pleasant chirp)
  public playConnectedChime(): void {
    this.stopAll();
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Connected audio error:', e);
    }
  }

  // Call Ended / Hangup Tone (Low descending double beep)
  public playHangupTone(): void {
    this.stopAll();
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const freqs = [400, 300];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.15, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.14);
      });
    } catch (e) {
      console.warn('Hangup audio error:', e);
    }
  }

  // Stop any ongoing ringtone, ringback, or alarm loop
  public stopAll(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.fallbackAlarmAudio) {
      try {
        this.fallbackAlarmAudio.pause();
        this.fallbackAlarmAudio.currentTime = 0;
      } catch (e) {}
    }
  }
}

export const soundService = new SoundService();

// Global listener to unlock Web Audio on first browser interaction (clicks, touch, keys)
if (typeof window !== 'undefined') {
  const onInteraction = () => {
    soundService.unlockAudio();
  };
  window.addEventListener('click', onInteraction, { passive: true });
  window.addEventListener('touchstart', onInteraction, { passive: true });
  window.addEventListener('keydown', onInteraction, { passive: true });
}
