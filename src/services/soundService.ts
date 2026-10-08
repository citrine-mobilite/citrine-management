import { generateAlarmWavBase64 } from './sound/wavSynthesizer';
import { playSineTone, playChord, playBeepSequence } from './sound/toneGenerators';

class SoundService {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private ringbackInterval: any = null;
  private alarmInterval: any = null;
  private alertRingtoneInterval: any = null;
  private fallbackAlarmAudio: HTMLAudioElement | null = null;
  public isUnlocked: boolean = false;

  public isAlertRinging(): boolean {
    return this.alertRingtoneInterval !== null;
  }

  public startContinuousAlertRingtone(volume = 0.6): void {
    this.stopContinuousAlertRingtone();
    this.unlockAudio();
    const tick = () => {
      try {
        const ctx = this.getContext();
        playBeepSequence(
          ctx,
          [
            { freq: 880, start: 0, duration: 0.1, type: 'sine' },
            { freq: 1046, start: 0.12, duration: 0.1, type: 'sine' },
            { freq: 880, start: 0.24, duration: 0.1, type: 'sine' },
            { freq: 1318, start: 0.36, duration: 0.25, type: 'sine' },
          ],
          volume
        );
      } catch {}
    };
    tick();
    this.alertRingtoneInterval = setInterval(tick, 1200);
  }

  public stopContinuousAlertRingtone(): void {
    if (this.alertRingtoneInterval) {
      clearInterval(this.alertRingtoneInterval);
      this.alertRingtoneInterval = null;
    }
  }

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

  public unlockAudio(): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.isUnlocked = true;
        });
      } else {
        this.isUnlocked = true;
      }
    } catch {
      // Audio context might need user gesture
    }
  }

  public playPointageSuccess(): void {
    try {
      const ctx = this.getContext();
      playChord(ctx, [523.25, 659.25, 783.99, 1046.5], 0.4, 0.25);
    } catch {}
  }

  public playPointageDeparture(): void {
    try {
      const ctx = this.getContext();
      playChord(ctx, [783.99, 659.25, 523.25], 0.35, 0.2);
    } catch {}
  }

  public playAlertNotification(volume = 0.3): void {
    try {
      const ctx = this.getContext();
      playBeepSequence(
        ctx,
        [
          { freq: 880, start: 0, duration: 0.12 },
          { freq: 1174.66, start: 0.14, duration: 0.18 },
        ],
        volume
      );
    } catch {}
  }

  public playIncomingRingtone(): void {
    this.stopIncomingRingtone();
    const tick = () => {
      try {
        const ctx = this.getContext();
        playBeepSequence(
          ctx,
          [
            { freq: 800, start: 0, duration: 0.15 },
            { freq: 1000, start: 0.18, duration: 0.2 },
            { freq: 800, start: 0.42, duration: 0.15 },
            { freq: 1000, start: 0.6, duration: 0.35 },
          ],
          0.35
        );
      } catch {}
    };
    tick();
    this.ringtoneInterval = setInterval(tick, 2200);
  }

  public stopIncomingRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  public playOutgoingRingback(): void {
    this.stopOutgoingRingback();
    const tick = () => {
      try {
        const ctx = this.getContext();
        playBeepSequence(
          ctx,
          [
            { freq: 440, start: 0, duration: 1.0 },
            { freq: 480, start: 0, duration: 1.0 },
          ],
          0.15
        );
      } catch {}
    };
    tick();
    this.ringbackInterval = setInterval(tick, 3000);
  }

  public stopOutgoingRingback(): void {
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
  }

  public playCallConnected(): void {
    try {
      const ctx = this.getContext();
      playBeepSequence(
        ctx,
        [
          { freq: 523.25, start: 0, duration: 0.08 },
          { freq: 659.25, start: 0.09, duration: 0.08 },
          { freq: 783.99, start: 0.18, duration: 0.15 },
        ],
        0.25
      );
    } catch {}
  }

  public playCallEnded(): void {
    try {
      const ctx = this.getContext();
      playBeepSequence(
        ctx,
        [
          { freq: 783.99, start: 0, duration: 0.1 },
          { freq: 659.25, start: 0.12, duration: 0.1 },
          { freq: 523.25, start: 0.24, duration: 0.25 },
        ],
        0.2
      );
    } catch {}
  }

  public startEmergencyAlarm(): void {
    this.stopEmergencyAlarm();
    try {
      const wavBase64 = generateAlarmWavBase64();
      this.fallbackAlarmAudio = new Audio(wavBase64);
      this.fallbackAlarmAudio.loop = true;
      this.fallbackAlarmAudio.volume = 0.8;
      this.fallbackAlarmAudio.play().catch(() => {});
    } catch {}

    const tick = () => {
      try {
        const ctx = this.getContext();
        playBeepSequence(
          ctx,
          [
            { freq: 950, start: 0, duration: 0.18, type: 'sawtooth' },
            { freq: 1200, start: 0.22, duration: 0.25, type: 'sawtooth' },
          ],
          0.3
        );
      } catch {}
    };
    tick();
    this.alarmInterval = setInterval(tick, 800);
  }

  public stopEmergencyAlarm(): void {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.fallbackAlarmAudio) {
      try {
        this.fallbackAlarmAudio.pause();
        this.fallbackAlarmAudio.currentTime = 0;
      } catch {}
      this.fallbackAlarmAudio = null;
    }
  }
}

export const soundService = new SoundService();
export default soundService;
