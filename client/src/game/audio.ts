// Orbital Workbench: Relaxing, melodic, lofi ambient synthesizer & soothing gamified SFX
export type SoundEvent = "start" | "fragment" | "gate" | "collision" | "toggle" | "relayCorrect" | "relayFail" | "rotate" | "puzzleSolve";

const SOUND_STORAGE_KEY = "toolboxgalaxy:game-sound";
const MUSIC_STORAGE_KEY = "toolboxgalaxy:logic-music";
const readPreference = (key: string) => {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(key) === "on";
  } catch {
    return false;
  }
};

export class OrbitAudio {
  private context: AudioContext | null = null;
  private musicNodes: {
    oscillators: OscillatorNode[];
    gain: GainNode | null;
    filter: BiquadFilterNode | null;
    intervalId?: number;
  } = { oscillators: [], gain: null, filter: null };
  
  private enabled = readPreference(SOUND_STORAGE_KEY);
  private musicEnabled = readPreference(MUSIC_STORAGE_KEY);

  isEnabled() { return this.enabled; }
  isMusicEnabled() { return this.musicEnabled; }

  private getContext() {
    if (!this.context) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new AudioCtx();
    }
    return this.context;
  }

  async setEnabled(next: boolean) {
    this.enabled = next;
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, next ? "on" : "off");
    } catch {}
    if (!next) { 
      this.pauseMusic(); 
      await this.context?.suspend(); 
      return false; 
    }
    const context = this.getContext();
    if (context.state === "suspended") await context.resume();
    this.play("toggle");
    return true;
  }

  async setMusicEnabled(next: boolean) {
    this.musicEnabled = next;
    try {
      window.localStorage.setItem(MUSIC_STORAGE_KEY, next ? "on" : "off");
    } catch {}
    if (!next) { 
      this.pauseMusic(); 
      return false; 
    }
    if (!this.enabled) await this.setEnabled(true);
    await this.startMusic();
    return true;
  }

  // Soft, warm, soothing game sounds (no harsh frequencies)
  play(event: SoundEvent) {
    if (!this.enabled) return;
    if (this.musicEnabled) void this.startMusic();
    const context = this.getContext();
    
    // Musical pentatonic chime frequencies
    const tones: Record<SoundEvent, Array<[number, number, OscillatorType, number]>> = {
      start: [[261.63, 0.15, "sine", 0], [329.63, 0.18, "sine", 0.08], [392.00, 0.25, "sine", 0.16]], // C-E-G major chord
      fragment: [[523.25, 0.12, "sine", 0], [659.25, 0.18, "sine", 0.06]], // Soft twinkle C5, E5
      gate: [[349.23, 0.1, "sine", 0]], // F4 soft note
      collision: [[146.83, 0.2, "sine", 0]], // Gentle low tone
      toggle: [[440, 0.06, "sine", 0]], // A4 gentle blip
      relayCorrect: [[440, 0.09, "sine", 0], [554.37, 0.12, "sine", 0.06], [659.25, 0.18, "sine", 0.12]], // A major arpeggio
      relayFail: [[293.66, 0.12, "sine", 0], [277.18, 0.18, "sine", 0.08]], // Gentle down tone
      rotate: [[329.63, 0.06, "sine", 0], [392.00, 0.08, "sine", 0.03]], // Quick soft wooden marimba chime
      puzzleSolve: [
        [329.63, 0.2, "sine", 0],
        [392.00, 0.2, "sine", 0.1],
        [523.25, 0.25, "sine", 0.2],
        [659.25, 0.35, "sine", 0.3],
        [783.99, 0.45, "sine", 0.4]
      ], // Victory pentatonic bloom
    };

    tones[event]?.forEach(([frequency, duration, type, delay]) => {
      this.softTone(context, frequency, duration, type, delay);
    });
  }

  private softTone(context: AudioContext, frequency: number, duration: number, type: OscillatorType, delay: number) {
    try {
      const now = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      // Low-pass filter to remove harsh sharp buzzes, creating a warm mellow sound
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);

      // Smooth attack and gentle exponential decay
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + duration + 0.05);
    } catch {
      // Audio safety
    }
  }

  // Soothing, calm meditation ambient music (soft E-minor9 / G-major lofi chord pad with subtle slow movement)
  private async startMusic() {
    if (!this.enabled || !this.musicEnabled) return;
    const context = this.getContext();
    if (context.state === "suspended") await context.resume();
    if (this.musicNodes.gain) return; // Already running

    try {
      // Master music gain node with soft fade-in
      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(0.0001, context.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.035, context.currentTime + 2.0); // Very gentle volume

      // Warm low-pass filter (cuts all squeaky high tones completely)
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, context.currentTime);
      filter.Q.setValueAtTime(1.0, context.currentTime);

      masterGain.connect(filter);
      filter.connect(context.destination);

      this.musicNodes.gain = masterGain;
      this.musicNodes.filter = filter;

      // Deep calming chord frequencies (C major 9 warm ambient pad: C3, G3, B3, D4, E4)
      const chordFreqs = [130.81, 196.00, 246.94, 293.66, 329.63];

      this.musicNodes.oscillators = chordFreqs.map((freq, i) => {
        const osc = context.createOscillator();
        osc.type = "sine"; // Pure smooth sine wave with zero distortion
        // Slightly detune to create a lush, natural analog chorus vibe
        const detune = (i - 2) * 3.5;
        osc.frequency.setValueAtTime(freq, context.currentTime);
        osc.detune.setValueAtTime(detune, context.currentTime);
        osc.connect(masterGain);
        osc.start();
        return osc;
      });

      // Subtle slow breathing filter modulation for relaxation
      let up = true;
      this.musicNodes.intervalId = window.setInterval(() => {
        if (!this.musicNodes.filter || !this.context) return;
        const now = this.context.currentTime;
        const targetFreq = up ? 520 : 380;
        this.musicNodes.filter.frequency.linearRampToValueAtTime(targetFreq, now + 4);
        up = !up;
      }, 4000);

    } catch {
      // Audio safety
    }
  }

  private pauseMusic() {
    if (this.musicNodes.intervalId) {
      window.clearInterval(this.musicNodes.intervalId);
      this.musicNodes.intervalId = undefined;
    }

    if (this.musicNodes.gain && this.context) {
      try {
        this.musicNodes.gain.gain.setValueAtTime(this.musicNodes.gain.gain.value, this.context.currentTime);
        this.musicNodes.gain.gain.linearRampToValueAtTime(0.0001, this.context.currentTime + 0.4);
      } catch {
        // Safe fallback
      }
    }

    setTimeout(() => {
      this.musicNodes.oscillators.forEach((osc) => {
        try { 
          osc.stop(); 
          osc.disconnect(); 
        } catch { /* ignore */ }
      });
      this.musicNodes.oscillators = [];
      this.musicNodes.gain?.disconnect();
      this.musicNodes.filter?.disconnect();
      this.musicNodes.gain = null;
      this.musicNodes.filter = null;
    }, 450);
  }

  dispose() {
    this.pauseMusic();
    try {
      void this.context?.close();
    } catch { /* ignore */ }
    this.context = null;
  }
}
