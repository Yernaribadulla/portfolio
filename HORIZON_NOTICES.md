# Third-party notices

These notices cover the EVENT HORIZON module. Its black-hole shader, procedural visuals, geometry and audio are original project code; the module uses no external photographs, 3D models, recordings or video. The retained portfolio studio and project screenshots are documented separately in `ASSETS.md`.

## Fonts

- Golos Text — SIL Open Font License 1.1. Full upstream license and copyright notice: `public/licenses/golos-text-OFL.txt`.

- Manrope — Copyright 2019 The Manrope Project Authors; SIL Open Font License 1.1. [Source](https://github.com/sharanda/manrope). Full license: `public/licenses/manrope-OFL.txt`.
- IBM Plex Mono — Copyright 2017 IBM Corp.; SIL Open Font License 1.1. [Source](https://github.com/IBM/plex). Full license: `public/licenses/ibm-plex-mono-OFL.txt`.

Fonts are served locally from the build.

## Runtime and build dependencies

Exact installed versions are locked in `package-lock.json`.

- [React](https://github.com/facebook/react) — MIT.
- [Three.js](https://github.com/mrdoob/three.js) — MIT.
- [Zustand](https://github.com/pmndrs/zustand) — MIT.
- [Lucide](https://github.com/lucide-icons/lucide) — ISC, with inherited Feather icon notices.
- [GSAP](https://github.com/greensock/GSAP) — [Standard No Charge License](https://gsap.com/community/standard-license/), checked 2026-10-20. This is a proprietary library, not an MIT dependency. The upstream copyright notice is preserved in the bundle and `public/licenses/gsap-NOTICE.txt`.
- [Vite](https://github.com/vitejs/vite) — MIT.
- [TypeScript](https://github.com/microsoft/TypeScript) — Apache-2.0.

Dependency packages retain their corresponding license files in `node_modules`. A deployed bundle should keep applicable license notices. Runtime dependency license copies are also distributed under `public/licenses/`.
