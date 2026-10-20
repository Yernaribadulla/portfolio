/**
 * Procedural, deliberately quiet cinematic ambience.
 *
 * Constructing this object is silent and does not allocate an AudioContext.
 * Call enable() directly inside a click / key event. No samples, network
 * requests, AudioWorklets, or animation timers are needed.
 */

type SceneAudioParameters = {
  distance: number;
  chapter: number;
  spin: number;
  timeScale: number;
  paused: boolean;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type Voice = {
  oscillator: OscillatorNode;
  gain: GainNode;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const finite = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

export class AmbientEngine {
  private context: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private master: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private airGain: GainNode | null = null;
  private pulseDepth: GainNode | null = null;
  private pulse: OscillatorNode | null = null;
  private panMotion: OscillatorNode | null = null;
  private panWidth: GainNode | null = null;
  private voices: Voice[] = [];
  private radioVoices: Voice[] = [];
  private active = false;
  private disposed = false;
  private revision = 0;
  private lastUpdate = -Infinity;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  private parameters: SceneAudioParameters = {
    distance: 21,
    chapter: 0,
    spin: 0.65,
    timeScale: 1,
    paused: false,
  };

  get enabled(): boolean {
    return this.active;
  }

  async enable(): Promise<void> {
    if (this.disposed) {
      throw new Error('This audio engine has been disposed.');
    }

    if (this.suspendTimer !== null) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    if (!this.context) this.build();
    const context = this.context!;
    const request = ++this.revision;

    // This invocation must happen synchronously in the original user gesture.
    await context.resume();
    if (request !== this.revision || this.disposed) return;

    this.active = true;
    this.lastUpdate = -Infinity;
    this.update(this.parameters);
    if (this.master) this.target(this.master.gain, 0.68, 1.15);
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.enable();
      return;
    }

    this.active = false;
    const request = ++this.revision;
    if (this.suspendTimer !== null) clearTimeout(this.suspendTimer);
    if (!this.context || this.disposed) return;

    if (this.master) this.target(this.master.gain, 0, 0.16);
    const context = this.context;
    this.suspendTimer = setTimeout(() => {
      this.suspendTimer = null;
      if (request === this.revision && !this.active && !this.disposed) {
        // Suspension preserves the procedural score's phase for the next visit.
        void context.suspend().catch(() => undefined);
      }
    }, 1050);
  }

  update(parameters: SceneAudioParameters): void {
    this.parameters = {
      distance: clamp(finite(parameters.distance, 21), 7, 40),
      chapter: clamp(finite(parameters.chapter, 0), 0, 4),
      spin: clamp(finite(parameters.spin, 0.65), 0, 1),
      timeScale: clamp(finite(parameters.timeScale, 1), 0, 4),
      paused: parameters.paused,
    };

    const context = this.context;
    if (!context || this.disposed || context.state !== 'running') return;

    // Callers can update every frame without filling AudioParam event queues.
    if (context.currentTime - this.lastUpdate < 0.09) return;
    this.lastUpdate = context.currentTime;

    const { distance, chapter, spin, timeScale, paused } = this.parameters;
    const proximity = clamp((35 - distance) / 28, 0, 1);
    const horizon = clamp(chapter - 2, 0, 1);
    const beyond = clamp(chapter - 3, 0, 1);
    const motion = paused ? 0 : Math.sqrt(timeScale);
    const base = 32.7032 * (1 - horizon * 0.09 + beyond * 0.16);
    const smooth = 1.6;

    if (this.voices[0]) {
      this.target(this.voices[0].oscillator.frequency, base, smooth);
      this.target(this.voices[0].gain.gain, 0.075 + proximity * 0.039, smooth);
    }
    if (this.voices[1]) {
      this.target(this.voices[1].oscillator.frequency, base * 1.5007, smooth);
      this.target(this.voices[1].gain.gain, 0.026 + proximity * 0.018, smooth);
    }
    if (this.voices[2]) {
      this.target(this.voices[2].oscillator.frequency, base * 2.003, smooth);
      this.target(this.voices[2].gain.gain, 0.009 + beyond * 0.014, smooth);
    }
    if (this.bassFilter) {
      this.target(this.bassFilter.frequency, 115 + proximity * 95, smooth);
    }
    if (this.rumbleFilter) {
      this.target(
        this.rumbleFilter.frequency,
        135 + proximity * 350 + spin * 90 + beyond * 330,
        smooth,
      );
    }
    if (this.rumbleGain) {
      this.target(
        this.rumbleGain.gain,
        (0.032 + proximity * 0.053) * (paused ? 0.68 : 1),
        smooth,
      );
    }
    if (this.airFilter) {
      this.target(
        this.airFilter.frequency,
        650 + proximity * 600 + beyond * 1550,
        smooth,
      );
    }
    if (this.airGain) {
      this.target(this.airGain.gain, 0.011 + beyond * 0.025 + spin * 0.006, smooth);
    }
    if (this.pulse) {
      this.target(this.pulse.frequency, 0.055 + motion * (0.1 + spin * 0.22), 1);
    }
    if (this.pulseDepth) {
      this.target(this.pulseDepth.gain, motion > 0 ? 0.002 + proximity * 0.004 : 0, 1);
    }
    if (this.panMotion) {
      this.target(this.panMotion.frequency, 0.018 + motion * 0.024, smooth);
    }
    if (this.panWidth) {
      this.target(this.panWidth.gain, 0.32 + beyond * 0.36 + spin * 0.12, smooth);
    }

    // The slight non-harmonic interval becomes more apparent near the horizon;
    // BEYOND opens it back into a wide consonant interval.
    const radioRoot = 130.8128 * (1 - horizon * 0.13 + beyond * 0.26);
    this.radioVoices.forEach((voice, index) => {
      const interval = index === 0 ? 1 : 1.004 + horizon * 0.012 + beyond * 0.482;
      this.target(voice.oscillator.frequency, radioRoot * interval, 2.4);
      this.target(voice.gain.gain, 0.003 + horizon * 0.004 + beyond * 0.006, 2.4);
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.active = false;
    ++this.revision;
    if (this.suspendTimer !== null) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // A partially constructed source may not have been started.
      }
    }
    for (const node of this.nodes) node.disconnect();
    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => undefined);
    }
    this.sources = [];
    this.nodes = [];
    this.voices = [];
    this.radioVoices = [];
    this.context = null;
    this.master = null;
    this.bassFilter = null;
    this.rumbleFilter = null;
    this.airFilter = null;
    this.rumbleGain = null;
    this.airGain = null;
    this.pulseDepth = null;
    this.pulse = null;
    this.panMotion = null;
    this.panWidth = null;
  }

  private target(parameter: AudioParam, value: number, timeConstant: number): void {
    const now = this.context!.currentTime;
    if (typeof parameter.cancelAndHoldAtTime === 'function') {
      parameter.cancelAndHoldAtTime(now);
    } else {
      // Compatibility path for older engines without cancelAndHoldAtTime.
      const current = parameter.value;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
    }
    parameter.setTargetAtTime(value, now, timeConstant);
  }

  private track<T extends AudioNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }

  private oscillator(
    frequency: number,
    type: OscillatorType = 'sine',
  ): OscillatorNode {
    const oscillator = this.track(this.context!.createOscillator());
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    this.sources.push(oscillator);
    return oscillator;
  }

  private gain(value: number): GainNode {
    const gain = this.track(this.context!.createGain());
    gain.gain.value = value;
    return gain;
  }

  private build(): void {
    const Constructor =
      window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Constructor) throw new Error('Web Audio is unavailable in this browser.');

    const context = new Constructor({ latencyHint: 'playback' });
    this.context = context;
    this.master = this.gain(0);

    // Keep a comfortable output level and catch peaks from overlapping layers.
    const compressor = this.track(context.createDynamicsCompressor());
    compressor.threshold.value = -20;
    compressor.knee.value = 12;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.38;
    const dcBlocker = this.track(context.createBiquadFilter());
    dcBlocker.type = 'highpass';
    dcBlocker.frequency.value = 24;
    dcBlocker.Q.value = 0.5;
    this.master.connect(dcBlocker);
    dcBlocker.connect(compressor);
    compressor.connect(context.destination);

    this.bassFilter = this.track(context.createBiquadFilter());
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 160;
    this.bassFilter.Q.value = 0.5;
    this.bassFilter.connect(this.master);

    [32.7032, 49.0804, 65.5045].forEach((frequency, index) => {
      const oscillator = this.oscillator(frequency, index === 2 ? 'triangle' : 'sine');
      const gain = this.gain([0.075, 0.026, 0.009][index]);
      oscillator.connect(gain);
      gain.connect(this.bassFilter!);
      this.voices.push({ oscillator, gain });
    });

    // Very slow pitch drift gives the drone movement without a melodic loop.
    const drift = this.oscillator(0.021);
    const driftDepth = this.gain(5.5);
    drift.connect(driftDepth);
    this.voices.forEach(({ oscillator }) => driftDepth.connect(oscillator.detune));

    const noise = this.track(context.createBufferSource());
    noise.buffer = this.createNoiseBuffer(context);
    noise.loop = true;
    this.sources.push(noise);

    this.rumbleFilter = this.track(context.createBiquadFilter());
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.value = 290;
    this.rumbleFilter.Q.value = 0.6;
    this.rumbleGain = this.gain(0.045);
    noise.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.master);

    this.airFilter = this.track(context.createBiquadFilter());
    this.airFilter.type = 'bandpass';
    this.airFilter.frequency.value = 960;
    this.airFilter.Q.value = 0.55;
    this.airGain = this.gain(0.014);
    const airPan = this.track(context.createStereoPanner());
    noise.connect(this.airFilter);
    this.airFilter.connect(this.airGain);
    this.airGain.connect(airPan);
    airPan.connect(this.master);

    this.panMotion = this.oscillator(0.036);
    this.panWidth = this.gain(0.4);
    this.panMotion.connect(this.panWidth);
    this.panWidth.connect(airPan.pan);

    // A soft machine pulse shares the underlying drone's key. Its envelope is
    // generated on the audio clock, so it never depends on rendering framerate.
    const mechanical = this.oscillator(98.1096, 'triangle');
    const mechanicalGain = this.gain(0.0065);
    const mechanicalFilter = this.track(context.createBiquadFilter());
    mechanicalFilter.type = 'lowpass';
    mechanicalFilter.frequency.value = 260;
    mechanicalFilter.Q.value = 0.4;
    const mechanicalPan = this.track(context.createStereoPanner());
    mechanicalPan.pan.value = -0.34;
    mechanical.connect(mechanicalGain);
    mechanicalGain.connect(mechanicalFilter);
    mechanicalFilter.connect(mechanicalPan);
    mechanicalPan.connect(this.master);
    this.pulse = this.oscillator(0.2);
    this.pulseDepth = this.gain(0.003);
    this.pulse.connect(this.pulseDepth);
    this.pulseDepth.connect(mechanicalGain.gain);

    // Two distant carrier tones beat gently, with a short filtered echo.
    const radioPan = this.track(context.createStereoPanner());
    radioPan.pan.value = 0.28;
    const radioMix = this.gain(1);
    const echo = this.track(context.createDelay(1));
    echo.delayTime.value = 0.431;
    const echoFilter = this.track(context.createBiquadFilter());
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = 850;
    echoFilter.Q.value = 0.3;
    const echoFeedback = this.gain(0.18);
    const echoMix = this.gain(0.23);
    radioMix.connect(radioPan);
    radioPan.connect(this.master);
    radioMix.connect(echo);
    echo.connect(echoFilter);
    echoFilter.connect(echoFeedback);
    echoFeedback.connect(echo);
    echoFilter.connect(echoMix);
    echoMix.connect(this.master);

    [130.8128, 131.336].forEach((frequency) => {
      const oscillator = this.oscillator(frequency);
      const gain = this.gain(0.003);
      oscillator.connect(gain);
      gain.connect(radioMix);
      this.radioVoices.push({ oscillator, gain });
    });

    const start = context.currentTime;
    this.sources.forEach((source) => source.start(start));
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const count = Math.floor(context.sampleRate * 7.9);
    const buffer = context.createBuffer(1, count, context.sampleRate);
    const output = buffer.getChannelData(0);
    let random = 0x73ad2c65;
    let brown = 0;

    for (let index = 0; index < count; index++) {
      // Deterministic xorshift noise: no media fetches and a fixed memory budget.
      random ^= random << 13;
      random ^= random >>> 17;
      random ^= random << 5;
      const white = ((random >>> 0) / 0xffffffff) * 2 - 1;
      brown = (brown + white * 0.024) / 1.024;
      output[index] = brown * 2.6 + white * 0.15;
    }

    // Remove the loop discontinuity without a periodic silence or fade.
    const seam = output[count - 1] - output[0];
    for (let index = 0; index < count; index++) {
      output[index] -= seam * (index / (count - 1) - 0.5);
    }
    return buffer;
  }
}
