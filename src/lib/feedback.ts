// src/lib/feedback.ts
// Global Audio & Haptic Feedback Manager

type HapticPattern = number | number[];

class FeedbackManager {
  private audioCtx: AudioContext | null = null;
  public isMuted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored =
          localStorage.getItem('setu_sound_muted') ?? localStorage.getItem('app_sound_muted');
        this.isMuted = stored === 'true';
      } catch {
        this.isMuted = false;
      }
    }
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.isMuted);
      } catch (err) {
        console.error('Feedback listener error:', err);
      }
    });
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('setu_sound_muted', String(this.isMuted));
        localStorage.setItem('app_sound_muted', String(this.isMuted));
      } catch {
        // ignore
      }
    }
    this.notify();
    return this.isMuted;
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('setu_sound_muted', String(muted));
        localStorage.setItem('app_sound_muted', String(muted));
      } catch {
        // ignore
      }
    }
    this.notify();
    return this.isMuted;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || this.isMuted) return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public triggerHaptic(pattern: HapticPattern = 8) {
    if (this.isMuted) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback
      }
    }
  }

  public playTap() {
    if (this.isMuted) return;
    this.triggerHaptic(8);
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio fallback safeguard
    }
  }

  public playPop() {
    if (this.isMuted) return;
    this.triggerHaptic([15, 30, 20]);
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // Audio fallback safeguard
    }
  }

  public playSelect() {
    if (this.isMuted) return;
    this.triggerHaptic(5);
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch {
      // Audio fallback safeguard
    }
  }

  public playNotification() {
    if (this.isMuted) return;
    this.triggerHaptic([15, 35, 15]);
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio fallback safeguard
    }
  }
}

export const feedback = new FeedbackManager();

// Functional exports
export const playTap = () => feedback.playTap();
export const playPop = () => feedback.playPop();
export const playSelect = () => feedback.playSelect();
export const playNotification = () => feedback.playNotification();
export const toggleMute = () => feedback.toggleMute();
export const isMuted = () => feedback.isMuted;
export const triggerHaptic = (pattern?: HapticPattern) => feedback.triggerHaptic(pattern);