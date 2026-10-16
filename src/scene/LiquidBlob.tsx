import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, MeshDistortMaterial } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Mesh, SphereGeometry } from 'three';

type Ripple = { x: number; y: number; dx: number; dy: number; strength: number; born: number };
function Liquid() {
  const mesh = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ripples = useRef<Ripple[]>([]);
  const deformed = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const geometry = useMemo(() => new SphereGeometry(1, 64, 64), []);
  const original = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    let previous: { x: number; y: number; time: number } | null = null;
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = gl.domElement.getBoundingClientRect();
      // Intersect the pointer path with the blob's front plane; a fast sweep can cross
      // the entire form between two browser events, so sample the segment too.
      const halfHeight = Math.tan(42 * Math.PI / 360) * (camera.position.z - .65);
      const x = ((event.clientX - rect.left) / rect.width * 2 - 1) * halfHeight * rect.width / rect.height;
      const y = (1 - (event.clientY - rect.top) / rect.height * 2) * halfHeight / 1.08;
      const time = performance.now() / 1000;
      pointer.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
      if (previous && time - previous.time < .15) {
        const dx = x - previous.x, dy = y - previous.y;
        const distance = Math.hypot(dx, dy);
        if (distance > .008) {
          const strength = Math.min(1, distance / Math.max(.008, time - previous.time) / 9);
          const steps = Math.min(12, Math.max(1, Math.ceil(distance / .12)));
          for (let i = 1; i <= steps; i++) {
            const px = previous.x + dx * i / steps, py = previous.y + dy * i / steps;
            if (px * px + py * py < 1.5) ripples.current.push({ x: px, y: py, dx: dx / distance, dy: dy / distance, strength, born: time });
          }
          ripples.current = ripples.current.slice(-32);
        }
      }
      previous = { x, y, time };
    };
    const leave = () => { previous = null; };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
    };
  }, [gl, camera]);
  useFrame(({ clock }, dt) => {
    if (!mesh.current) return;
    const now = performance.now() / 1000;
    ripples.current = ripples.current.filter(r => now - r.born < 1.6);
    const positions = geometry.attributes.position;
    if (ripples.current.length || deformed.current) {
    for (let i = 0; i < positions.count; i++) {
      const x = original[i * 3], y = original[i * 3 + 1], z = original[i * 3 + 2];
      let dent = 0, dragX = 0, dragY = 0;
      // Only the visible skin responds; never collapse the back of the sphere.
      const front = Math.max(0, z);
      for (const r of ripples.current) {
        const age = now - r.born;
        const distance = Math.hypot(x - r.x, y - r.y);
        const decay = Math.exp(-age * 3.8) * r.strength;
        const groove = Math.exp(-distance * distance / .035) * decay;
        const wave = Math.sin(distance * 17 - age * 10) * Math.exp(-distance * 4) * decay;
        dent += (-groove * .075 + wave * .018) * front;
        dragX += groove * r.dx * .025 * front;
        dragY += groove * r.dy * .025 * front;
      }
      dent = Math.max(-.28, Math.min(.12, dent));
      positions.setXYZ(i, x + x * dent + dragX, y + y * dent + dragY, z + z * dent);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    deformed.current = ripples.current.length > 0;
    }
    const t = clock.elapsedTime;
    mesh.current.rotation.y += (pointer.current.x * .12 + Math.sin(t * .16) * .14 - mesh.current.rotation.y) * Math.min(1, dt * 2);
    mesh.current.rotation.x += (pointer.current.y * .09 + Math.cos(t * .12) * .08 - mesh.current.rotation.x) * Math.min(1, dt * 2);
  });
  return <>
    <ambientLight intensity={.9}/>
    <directionalLight position={[2,3,4]} intensity={2} color="#a2d9d1"/>
    <directionalLight position={[-3,-1,2]} intensity={1.3} color="#8c8bbd"/>
    <Environment resolution={64} frames={1}>
      <Lightformer position={[0,2,3]} scale={[4,1,1]} intensity={3} color="#b6dbd9"/>
      <Lightformer position={[-3,0,2]} scale={[1,4,1]} intensity={2} color="#646eac"/>
    </Environment>
    <mesh ref={mesh} geometry={geometry} scale={[1,1.08,1]}>
      <MeshDistortMaterial color="#35494e" emissive="#14262c" emissiveIntensity={.35} metalness={.35} roughness={.42} clearcoat={.35} distort={.65} speed={1.15}/>
    </mesh>
  </>;
}
export default function LiquidBlob({progress}:{progress:RefObject<number>}){
  const [visible,setVisible]=useState(progress.current<.32);
  useEffect(()=>{
    const update=()=>setVisible(progress.current<.32);
    window.addEventListener('cinematic-progress',update);
    return()=>window.removeEventListener('cinematic-progress',update);
  },[progress]);
  return visible?<div className="intro-blob" aria-hidden="true">
    <Canvas camera={{position:[0,0,4.2],fov:42}} dpr={[1,1.5]} gl={{alpha:true,antialias:true}}><Liquid/></Canvas>
  </div>:null;
}
