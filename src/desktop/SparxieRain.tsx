import { useEffect, useRef } from "react";

const SIZE = 48;
const LIMIT = 100;
type Body = { x: number; y: number; vx: number; vy: number };

export default function SparxieRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}sparxie.png`;
    const bodies: Body[] = [];
    let mask: Uint8Array | null = null;
    let bottom = SIZE;
    let width = 0, height = 0, frame = 0, previous = 0, accumulator = 0;

    image.onload = () => {
      const sample = document.createElement("canvas");
      sample.width = sample.height = SIZE;
      const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
      if (!sampleCtx) return;
      sampleCtx.drawImage(image, 0, 0, SIZE, SIZE);
      const rgba = sampleCtx.getImageData(0, 0, SIZE, SIZE).data;
      mask = new Uint8Array(SIZE * SIZE);
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const solid = rgba[(y * SIZE + x) * 4 + 3] > 90;
        mask[y * SIZE + x] = Number(solid);
        if (solid) bottom = Math.max(bottom === SIZE ? 0 : bottom, y + 1);
      }
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Rectangles only reject distant pairs. Actual contacts require both PNG alpha
    // masks to have an opaque pixel at the same point.
    const touching = (a: Body, b: Body) => {
      if (!mask) return false;
      const left = Math.max(0, Math.ceil(b.x - a.x));
      const top = Math.max(0, Math.ceil(b.y - a.y));
      const right = Math.min(SIZE, Math.floor(b.x + SIZE - a.x));
      const low = Math.min(SIZE, Math.floor(b.y + SIZE - a.y));
      if (left >= right || top >= low) return false;
      for (let y = top; y < low; y += 2) for (let x = left; x < right; x += 2) {
        if (mask[y * SIZE + x] && mask[Math.floor(y + a.y - b.y) * SIZE + Math.floor(x + a.x - b.x)]) return true;
      }
      return false;
    };
    const step = () => {
      for (const body of bodies) {
        body.vy = Math.min(body.vy + 900 / 60, 650);
        body.x += body.vx / 60;
        body.y += body.vy / 60;
        body.vx *= .993;
        const floor = height - bottom;
        if (body.y > floor) { body.y = floor; body.vy = Math.abs(body.vy) > 20 ? -body.vy * .35 : 0; body.vx *= .92; }
        if (body.x < 0 || body.x > width - SIZE) { body.x = Math.max(0, Math.min(width - SIZE, body.x)); body.vx *= -.45; }
      }
      // A broad distance check keeps the alpha test cheap even with 100 objects.
      for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        if (Math.abs(a.x - b.x) >= SIZE || Math.abs(a.y - b.y) >= SIZE || !touching(a, b)) continue;
        const dx = (b.x - a.x) || (Math.random() - .5) * .1;
        const dy = (b.y - a.y) || .1;
        const length = Math.hypot(dx, dy);
        const nx = dx / length, ny = dy / length;
        a.x -= nx * 1.4; a.y -= ny * 1.4;
        b.x += nx * 1.4; b.y += ny * 1.4;
        const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (closing > 0) {
          const impulse = closing * .42;
          a.vx -= nx * impulse; a.vy -= ny * impulse;
          b.vx += nx * impulse; b.vy += ny * impulse;
        }
      }
    };
    const render = (now: number) => {
      accumulator = Math.min(accumulator + Math.min(now - (previous || now), 50), 100);
      previous = now;
      while (accumulator >= 1000 / 60) { step(); accumulator -= 1000 / 60; }
      ctx.clearRect(0, 0, width, height);
      if (image.complete && image.naturalWidth) for (const body of bodies) ctx.drawImage(image, body.x, body.y, SIZE, SIZE);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const spawn = () => {
      if (bodies.length >= LIMIT) return;
      bodies.push({ x: Math.random() * Math.max(0, width - SIZE), y: -SIZE, vx: (Math.random() - .5) * 60, vy: 0 });
      canvas.dataset.count = String(bodies.length);
    };
    window.addEventListener("summon-sparxie", spawn);
    return () => { window.removeEventListener("summon-sparxie", spawn); observer.disconnect(); cancelAnimationFrame(frame); image.onload = null; };
  }, []);

  return <canvas ref={canvasRef} className="sparxie-rain" data-count="0" aria-hidden="true" />;
}
