import { create } from 'zustand';

export type Quality = 'LOW' | 'HIGH' | 'CINEMATIC';
export type Parameter = 'mass' | 'spin' | 'intensity' | 'timeScale' | 'distance' | 'exposure';
export type PointOfInterest = 'horizon' | 'disk' | 'photon' | null;

export const chapters = [
  { name: 'THE VOID', eyebrow: 'A JOURNEY TO THE EDGE OF EXISTENCE', title: ['EVENT', 'HORIZON'], description: 'Where light ends.\nAnd the unknown begins.', distance: 21, tilt: .20, azimuth: .0, kicker: 'NOTHING ESCAPES. EVERYTHING BEGINS.', metric: 'OBSERVER / STABLE ORBIT' },
  { name: 'ACCRETION', eyebrow: 'CHAPTER 02 / A FURNACE IN THE DARK', title: ['MATTER', 'IN MOTION'], description: 'A dying star becomes a river of light.\nWatch the universe feed the darkness.', distance: 14.5, tilt: .31, azimuth: .35, kicker: 'THE LAST LIGHT OF FALLING MATTER.', metric: 'PLASMA / DIFFERENTIAL ROTATION' },
  { name: 'GRAVITY', eyebrow: 'CHAPTER 03 / THE SHAPE OF LIGHT', title: ['SPACE', 'IS BENDING'], description: 'The far side folds into view.\nEven light must follow the curve.', distance: 17, tilt: .08, azimuth: -.2, kicker: 'WHAT YOU SEE IS NOT WHERE IT IS.', metric: 'LENSING / CURVED LIGHT PATHS' },
  { name: 'EVENT HORIZON', eyebrow: 'CHAPTER 04 / THE POINT OF NO RETURN', title: ['NO WAY', 'BACK'], description: 'One boundary. No return signal.\nBeyond it, every future leads inward.', distance: 9.4, tilt: .16, azimuth: .1, kicker: 'THE UNIVERSE HAS AN EDGE.', metric: 'PROXIMITY / CRITICAL' },
  { name: 'BEYOND', eyebrow: 'CHAPTER 05 / A SPECULATIVE EPILOGUE', title: ['BEYOND', 'THE KNOWN'], description: 'Our equations reach their limit.\nHere, imagination takes the controls.', distance: 7, tilt: .42, azimuth: .6, kicker: 'AN ARTISTIC HYPOTHESIS. NOT AN OBSERVATION.', metric: 'UNKNOWN / HYPOTHETICAL SPACE' },
] as const;

export const defaults = { mass: 1, spin: .72, intensity: 1, timeScale: 1, distance: 21, exposure: 1.12 };

interface ExperienceState {
  mass: number; spin: number; intensity: number; timeScale: number; distance: number; exposure: number;
  portfolio: boolean; chapter: number; intro: boolean; ready: boolean; paused: boolean; free: boolean;
  audio: boolean; panel: boolean; hidden: boolean; info: boolean; poi: PointOfInterest;
  quality: Quality; autoQuality: boolean; fps: number; gpuMs: number; dpr: number; error: string | null;
  setParameter: (key: Parameter, value: number) => void;
  setChapter: (chapter: number) => void;
  setQuality: (quality: Quality, automatic?: boolean) => void;
  set: (state: Partial<ExperienceState>) => void;
  reset: () => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  ...defaults,
  portfolio: true, chapter: 0, intro: false, ready: false, paused: false, free: false,
  audio: false, panel: false, hidden: false, info: false, poi: null,
  quality: 'HIGH', autoQuality: true, fps: 0, gpuMs: 0, dpr: 1, error: null,
  setParameter: (key, value) => set({ [key]: value }),
  setChapter: (chapter) => {
    const next = Math.max(0, Math.min(4, chapter));
    set({ chapter: next, distance: chapters[next].distance, poi: null, intro: false });
  },
  setQuality: (quality, automatic = false) => set({ quality, autoQuality: automatic }),
  set,
  reset: () => set({ ...defaults, chapter: 0, free: false, paused: false, poi: null }),
}));
