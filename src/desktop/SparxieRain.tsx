import { useEffect, useRef } from "react";

const SIZE = 48, HALF = 24, RADIUS = 33, CELL = 72, LIMIT = 500, DT = 1 / 60;
type Body = { x: number; y: number; vx: number; vy: number; angle: number; spin: number;
  rest: number; still: number; anchorX: number; anchorY: number; asleep: boolean };
type Trail = { x: number; y: number; t: number };

export default function SparxieRain({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    const canvas = canvasRef.current, layer = canvas?.parentElement, ctx = canvas?.getContext("2d");
    if (!canvas || !layer || !ctx) return;
    const dock = layer.parentElement?.querySelector<HTMLElement>(".dock");
    const image = new Image(); image.src = `${import.meta.env.BASE_URL}sparxie.png`;
    const bodies: Body[] = [], trail: Trail[] = [];
    let mask: Uint8Array | undefined, outline: { x: number; y: number }[] = [];
    let width = 0, height = 0, frame = 0, previous = 0, accumulator = 0, pending = 0, lastSpawn = 0;
    let dockLeft = Infinity, dockRight = -Infinity, dockTop = 0, dockBottom = 0;
    let held: { body: Body; id: number; dx: number; dy: number; x: number; y: number; t: number } | undefined;
    image.onload = () => {
      const sample = document.createElement("canvas"); sample.width = sample.height = SIZE;
      const sc = sample.getContext("2d", { willReadFrequently: true }); if (!sc) return;
      sc.drawImage(image, 0, 0, SIZE, SIZE);
      const rgba = sc.getImageData(0, 0, SIZE, SIZE).data;
      mask = new Uint8Array(SIZE * SIZE);
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) mask[y * SIZE + x] = Number(rgba[(y * SIZE + x) * 4 + 3] > 90);
      // Rotated ground contacts use the actual transparent silhouette.
      outline = [];
      for (let y = 0; y < SIZE; y += 2) for (let x = 0; x < SIZE; x += 2)
        if (mask[y * SIZE + x] && (x < 2 || y < 2 || x >= SIZE - 2 || y >= SIZE - 2 ||
          !mask[y * SIZE + x - 1] || !mask[y * SIZE + x + 1] ||
          !mask[(y - 1) * SIZE + x] || !mask[(y + 1) * SIZE + x]))
          outline.push({ x: x - HALF, y: y - HALF });
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();

    const opaque = (body: Body, px: number, py: number) => {
      if (!mask) return false;
      const dx = px - body.x, dy = py - body.y, c = Math.cos(body.angle), s = Math.sin(body.angle);
      const x = Math.floor(dx * c + dy * s + HALF), y = Math.floor(-dx * s + dy * c + HALF);
      return x >= 0 && y >= 0 && x < SIZE && y < SIZE && !!mask[y * SIZE + x];
    };
    const contact = (a: Body, b: Body) => {
      const left = Math.ceil(Math.max(a.x - RADIUS, b.x - RADIUS));
      const right = Math.floor(Math.min(a.x + RADIUS, b.x + RADIUS));
      const top = Math.ceil(Math.max(a.y - RADIUS, b.y - RADIUS));
      const bottom = Math.floor(Math.min(a.y + RADIUS, b.y + RADIUS));
      if (left >= right || top >= bottom) return false;
      // Broad phase is circular; narrow phase samples rotated PNG alpha on both bodies.
      for (let y = top; y <= bottom; y += 3) for (let x = left; x <= right; x += 3)
        if (opaque(a, x, y) && opaque(b, x, y)) return true;
      return false;
    };
    const silhouette = (body: Body) => {
      const c = Math.cos(body.angle), s = Math.sin(body.angle);
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (const p of outline) {
        const x = p.x * c - p.y * s, y = p.x * s + p.y * c;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      return Number.isFinite(bottom) ? { left, right, top, bottom } :
        { left: -HALF, right: HALF, top: -HALF, bottom: HALF };
    };
    const updateGround = () => {
      const canvasRect = canvas.getBoundingClientRect(), dockRect = dock?.getBoundingClientRect();
      if (!dockRect?.width || !dockRect.height || !canvasRect.width || !canvasRect.height) {
        dockLeft = Infinity; dockRight = -Infinity; return;
      }
      const scaleX = width / canvasRect.width, scaleY = height / canvasRect.height;
      dockLeft = (dockRect.left - canvasRect.left) * scaleX;
      dockRight = (dockRect.right - canvasRect.left) * scaleX;
      dockTop = (dockRect.top - canvasRect.top) * scaleY;
      dockBottom = (dockRect.bottom - canvasRect.top) * scaleY;
    };
    const overDock = (body: Body, shape: ReturnType<typeof silhouette>) =>
      body.x + shape.right > dockLeft && body.x + shape.left < dockRight;
    const wake = (body: Body) => {
      body.asleep = false; body.rest = body.still = 0; body.anchorX = body.x; body.anchorY = body.y;
    };
    const step = () => {
      for (const body of bodies) {
        if (body.asleep || body === held?.body) continue;
        const oldX = body.x, oldBottom = body.y + silhouette(body).bottom;
        body.vy = Math.min(body.vy + 850 * DT, 780);
        body.x += body.vx * DT; body.y += body.vy * DT; body.angle += body.spin * DT;
        body.vx *= .99; body.spin *= .985;
        const shape = silhouette(body);
        // Entering from a side hits the dock's wall; only a sprite falling from above lands on top.
        if (body.y + shape.bottom > dockTop && body.y + shape.top < dockBottom) {
          if (oldX + shape.right <= dockLeft && body.x + shape.right > dockLeft) {
            body.x = dockLeft - shape.right; body.vx *= -.18; body.spin *= .65;
          } else if (oldX + shape.left >= dockRight && body.x + shape.left < dockRight) {
            body.x = dockRight - shape.left; body.vx *= -.18; body.spin *= .65;
          }
        }
        const landsOnDock = overDock(body, shape) && oldBottom <= dockTop + 3;
        const floor = (landsOnDock ? dockTop : height) - shape.bottom;
        if (body.y >= floor) {
          body.y = floor; body.vy = Math.abs(body.vy) > 100 ? -body.vy * .16 : 0;
          body.vx *= .78; body.spin *= .5;
        }
        if (body.x < HALF || body.x > width - HALF) {
          body.x = Math.max(HALF, Math.min(width - HALF, body.x));
          body.vx *= -.35; body.spin += body.vy * .002;
        }
      }
      // Buckets avoid testing every pair when hundreds of sprites are present.
      const buckets = new Map<string, number[]>();
      bodies.forEach((body, index) => {
        const cx = Math.floor(body.x / CELL), cy = Math.floor(body.y / CELL);
        const key = `${cx},${cy}`, list = buckets.get(key);
        if (list) list.push(index); else buckets.set(key, [index]);
      });
      const supported = new Set<Body>();
      for (let ai = 0; ai < bodies.length; ai++) {
        const base = bodies[ai], cx = Math.floor(base.x / CELL), cy = Math.floor(base.y / CELL);
        for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++)
          for (const bi of buckets.get(`${gx},${gy}`) || []) {
        if (bi <= ai) continue;
        const a = bodies[ai], b = bodies[bi];
        if (a.asleep && b.asleep) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) > RADIUS * 2 || Math.abs(dy) > RADIUS * 2 || !contact(a, b)) continue;
        const len = Math.max(1, Math.hypot(dx, dy)), nx = dx / len, ny = dy / len;
        const af = a.asleep || a === held?.body, bf = b.asleep || b === held?.body;
        if (Math.abs(ny) > .35) supported.add(ny > 0 ? a : b);
        const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        const correction = Math.min(Math.abs(closing) > 90 ? 1.4 : .35,
          Math.max(.1, (RADIUS * 2 - len) * .055));
        if (!af) { a.x -= nx * (bf ? correction * 2 : correction); a.y -= ny * (bf ? correction * 2 : correction); }
        if (!bf) { b.x += nx * (af ? correction * 2 : correction); b.y += ny * (af ? correction * 2 : correction); }
        if (closing > 0) {
          const impulse = closing * (af || bf ? 1 : .5) * (closing > 140 ? 1.08 : 1);
          if (!af) { a.vx -= nx * impulse; a.vy -= ny * impulse; a.spin -= nx * impulse * .004; }
          if (!bf) { b.vx += nx * impulse; b.vy += ny * impulse; b.spin += nx * impulse * .004; }
          if (a.asleep && closing > 90) wake(a);
          if (b.asleep && closing > 90) wake(b);
        }
        if (!af) a.spin *= .8;
        if (!bf) b.spin *= .8;
          }
      }
      for (const body of bodies) {
        if (body.asleep || body === held?.body) continue;
        const shape = silhouette(body);
        // Pair resolution must not push a settled sprite back through the dock.
        if (overDock(body, shape) && body.y + shape.bottom > dockTop && body.y + shape.top < dockBottom) {
          if (body.y < dockTop) {
            body.y = dockTop - shape.bottom; body.vy = Math.min(0, body.vy);
          } else if (body.x < (dockLeft + dockRight) / 2) {
            body.x = dockLeft - shape.right; body.vx = Math.min(0, body.vx);
          } else {
            body.x = dockRight - shape.left; body.vx = Math.max(0, body.vx);
          }
        }
        const bottom = body.y + shape.bottom;
        const supportedNow = bottom >= height - 4 ||
          (overDock(body, shape) && Math.abs(bottom - dockTop) < 5) || supported.has(body);
        body.rest = supportedNow && Math.hypot(body.vx, body.vy) < 42 && Math.abs(body.spin) < .5
          ? body.rest + 1 : Math.max(0, body.rest - 2);
        const movement = Math.hypot(body.x - body.anchorX, body.y - body.anchorY);
        body.still = movement < .6 && Math.abs(body.spin) < .6
          ? body.still + 1 : Math.max(0, body.still - 3);
        body.anchorX = body.x; body.anchorY = body.y;
        if (body.rest > 24 || (body.still > 36 && Math.hypot(body.vx, body.vy) < 80 && Math.abs(body.spin) < 1)) {
          body.asleep = true; body.vx = body.vy = body.spin = 0;
        }
      }
    };
    const render = (now: number) => {
      if (!activeRef.current) {
        accumulator = 0; previous = now; trail.length = 0;
        frame = requestAnimationFrame(render);
        return;
      }
      updateGround();
      // Bursts enter in a short stream so hundreds do not start in one overlapping row.
      if (pending && now - lastSpawn >= 35) {
        bodies.push({ x: HALF + Math.random() * Math.max(0, width - SIZE), y: -HALF,
          vx: (Math.random() - .5) * 80, vy: 0, angle: (Math.random() - .5) * .5,
          spin: (Math.random() - .5) * 2, rest: 0, still: 0, anchorX: 0, anchorY: -HALF, asleep: false });
        pending--; lastSpawn = now;
        canvas.dataset.active = String(bodies.length);
      }
      accumulator = Math.min(accumulator + Math.min(now - (previous || now), 50), 100);
      while (accumulator >= DT * 1000) { step(); accumulator -= DT * 1000; }
      previous = now;
      ctx.clearRect(0, 0, width, height);
      while (trail.length && now - trail[0].t > 500) trail.shift();
      ctx.lineCap = "round";
      for (let i = 1; i < trail.length; i++) {
        const fade = Math.max(0, 1 - (now - trail[i].t) / 500);
        ctx.strokeStyle = `rgba(255,150,190,${fade * .4})`; ctx.lineWidth = 9 * fade;
        ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
      }
      if (image.complete && image.naturalWidth) for (const body of bodies) {
        ctx.save(); ctx.translate(body.x, body.y); ctx.rotate(body.angle);
        ctx.drawImage(image, -HALF, -HALF, SIZE, SIZE); ctx.restore();
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const point = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e: PointerEvent) => {
      if (!activeRef.current) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const p = point(e);
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i]; if (!opaque(b, p.x, p.y)) continue;
        e.preventDefault(); e.stopPropagation(); wake(b);
        canvas.dataset.dragging = "true";
        held = { body: b, id: e.pointerId, dx: b.x - p.x, dy: b.y - p.y, x: p.x, y: p.y, t: performance.now() };
        b.vx = b.vy = b.spin = 0; trail.length = 0;
        trail.push({ x: p.x, y: p.y, t: performance.now() }); break;
      }
    };
    const move = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      e.preventDefault(); const p = point(e), now = performance.now(), ms = Math.max(8, now - held.t);
      const vx = (p.x - held.x) / ms * 1000, vy = (p.y - held.y) / ms * 1000, b = held.body;
      b.vx = b.vx * .35 + vx * .65; b.vy = b.vy * .35 + vy * .65;
      b.spin = Math.max(-15, Math.min(15, b.vx * .014));
      // A lagged tilt while held makes the sprite swing behind the cursor.
      b.angle += (Math.max(-.85, Math.min(.85, b.vx * .001)) - Math.sin(b.angle) * .1) * .22;
      const oldX = b.x;
      const oldBottom = b.y + silhouette(b).bottom;
      b.x = Math.max(HALF, Math.min(width - HALF, p.x + held.dx));
      b.y = Math.max(HALF, Math.min(height - HALF, p.y + held.dy));
      const shape = silhouette(b);
      if (b.y + shape.bottom > dockTop && b.y + shape.top < dockBottom) {
        if (overDock(b, shape) && oldBottom <= dockTop + 3)
          b.y = dockTop - shape.bottom;
        else if (oldX + shape.right <= dockLeft && b.x + shape.right > dockLeft)
          b.x = dockLeft - shape.right;
        else if (oldX + shape.left >= dockRight && b.x + shape.left < dockRight)
          b.x = dockRight - shape.left;
      }
      held.x = p.x; held.y = p.y; held.t = now;
      trail.push({ x: p.x, y: p.y, t: now }); if (trail.length > 20) trail.shift();
    };
    const up = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      const b = held.body;
      b.vx = Math.max(-1050, Math.min(1050, b.vx));
      b.vy = Math.max(-1050, Math.min(1050, b.vy));
      canvas.dataset.dragging = "false";
      held = undefined;
    };
    const spawn = () => {
      if (!activeRef.current || bodies.length + pending >= LIMIT) return;
      pending++;
      canvas.dataset.count = String(bodies.length + pending);
    };
    layer.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    window.addEventListener("summon-sparxie", spawn);
    return () => {
      layer.removeEventListener("pointerdown", down, true); window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      window.removeEventListener("summon-sparxie", spawn); observer.disconnect(); cancelAnimationFrame(frame); image.onload = null;
    };
  }, []);
  return <canvas ref={canvasRef} className="sparxie-rain" data-count="0" data-active="0" data-dragging="false" aria-hidden="true" />;
}
