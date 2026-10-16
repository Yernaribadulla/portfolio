import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useRef, type RefObject } from "react";
import {
  FogExp2,
  PerspectiveCamera,
  SpotLight,
  Vector3,
  DirectionalLight,
  Color,
  Object3D,
  RectAreaLight,
} from "three";
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init();
import Laptop from "./Laptop";
import Sofa from "./Sofa";
import Atmosphere from "./Atmosphere";

import { cameraPose, quadMatrix, SCREEN } from "./cameraPath";
interface Props {
  progress: RefObject<number>;
  surface: RefObject<HTMLDivElement | null>;
  onReady: () => void;
  onFail: () => void;
}
function Rig({ progress, surface, onReady }: Props) {
  const { camera, scene, size, invalidate, gl } = useThree();
  const key = useRef<SpotLight>(null),
    rim = useRef<DirectionalLight>(null);
  const display=useRef<RectAreaLight>(null), bounce=useRef<SpotLight>(null);
  const screenTarget=useRef(new Object3D());
  const warmup=useRef(0);
  useEffect(() => {
    scene.fog = new FogExp2("#080b10", 0.48);
    scene.background = new Color('#080b10');
    // Geometry and the shadow-casting light stay fixed; camera motion needs no shadow redraw.
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    warmup.current=0;
    screenTarget.current.position.set(0,.50,.24);
    onReady();
    invalidate();
  }, [scene, onReady, invalidate]);
  useEffect(() => {
    const redraw = () => invalidate();
    window.addEventListener("cinematic-progress", redraw);
    return () => window.removeEventListener("cinematic-progress", redraw);
  }, [invalidate]);
  useFrame(() => {
    const p = progress.current,
      pose = cameraPose(p, size.width / size.height);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
    if (scene.fog) (scene.fog as FogExp2).density = pose.fog;
    if(warmup.current++<5){gl.shadowMap.needsUpdate=true;invalidate();}
    scene.environmentIntensity = pose.reveal * 0.07;
    if (key.current) key.current.intensity = pose.reveal * .9;
    if (rim.current) rim.current.intensity = pose.reveal * .12;
    if(display.current)display.current.intensity=pose.reveal*8;
    if(bounce.current)bounce.current.intensity=pose.reveal*.32;
    const el = surface.current;
    if (el) {
      const w = SCREEN.width / 2,
        h = SCREEN.height / 2;
      const points = [
        [-w, h],
        [w, h],
        [w, -h],
        [-w, -h],
      ]
        .map(([x, y]) =>
          new Vector3(x, y, 0.011)
            .applyAxisAngle(new Vector3(1, 0, 0), SCREEN.tilt)
            .add(SCREEN.center)
            .project(camera),
        )
        .map((v) => ({
          x: ((v.x + 1) * size.width) / 2,
          y: ((1 - v.y) * size.height) / 2,
        }));
      // After camera alignment, smoothly expand the projected screen to the viewport.
      const t = Math.max(0, Math.min(1, (p - 0.87) / 0.13));
      const blend = t * t * t * (t * (t * 6 - 15) + 10);
      const full = [
        { x: 0, y: 0 },
        { x: size.width, y: 0 },
        { x: size.width, y: size.height },
        { x: 0, y: size.height },
      ];
      points.forEach((point, i) => {
        point.x += (full[i].x - point.x) * blend;
        point.y += (full[i].y - point.y) * blend;
      });
      // Render at the laptop's native aspect, not at the visitor's narrow viewport aspect.
      const layoutWidth = 1440 + (size.width - 1440) * blend;
      const projectedWidth =
        (Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) +
          Math.hypot(points[2].x - points[3].x, points[2].y - points[3].y)) /
        2;
      const projectedHeight =
        (Math.hypot(points[3].x - points[0].x, points[3].y - points[0].y) +
          Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y)) /
        2;
      const aspect =
        p < 0.87
          ? SCREEN.width / SCREEN.height
          : projectedWidth / projectedHeight;
      const layoutHeight = layoutWidth / aspect;
      el.style.width = `${layoutWidth}px`;
      el.style.height = `${layoutHeight}px`;
      el.style.transform = quadMatrix(points, layoutWidth, layoutHeight);
      el.style.opacity = String(0.08 + 0.92 * Math.min(1, p / 0.3));
    }
  });
  return (
    <>
      <ambientLight intensity={0.008} />
      <hemisphereLight args={['#c9c6b6','#171a16',.055]} />
      <rectAreaLight ref={display} position={[0,.70,-.045]} rotation={[Math.PI-.18,0,0]} width={.43} height={.27} intensity={12} color="#bedfee" />
      <primitive object={screenTarget.current}/>
      <spotLight ref={bounce} position={[0,.75,-.025]} target={screenTarget.current} color="#b3dcf0" intensity={.65} angle={1.12} penumbra={1} distance={1.4} decay={2} castShadow shadow-mapSize={[2048,2048]} shadow-camera-near={.02} shadow-camera-far={1.5} shadow-bias={-.00008} shadow-normalBias={.0003} shadow-radius={4}/>
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          color="#dce5ee"
          position={[0, 4, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[5, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          color="#b2c8e3"
          position={[-3, 1, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[2, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#f0eee8"
          position={[2, 1, 3]}
          rotation={[0, Math.PI, 0]}
          scale={[3, 2, 1]}
        />
      </Environment>
      <spotLight
        ref={key}
        position={[-1.5, 3, 2]}
        angle={0.6}
        penumbra={1}
        intensity={16}
        color="#e0d4ba"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.001}
        shadow-radius={3}
        shadow-bias={-0.0002}
        shadow-camera-near={.5}
        shadow-camera-far={6}
      />
      <directionalLight
        ref={rim}
        position={[1.2, 2, -2]}
        intensity={2.2}
        color="#9ab9df"
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.004, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#080b10" roughness={0.94} />
      </mesh>
      <Sofa />
      <Laptop />
      <ContactShadows position={[0,.002,0]} scale={1} width={3.5} height={1.7} far={1.1} opacity={.65} blur={2.7} resolution={512} frames={1} color="#050705" />
      <Atmosphere progress={progress} />
    </>
  );
}
export default function CinematicScene(props: Props) {
  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1.75, 2]}
      camera={{ fov: 36, near: 0.015, far: 100, position: [2.3, 1.75, 4.1] }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#080b10");
        (camera as PerspectiveCamera).updateProjectionMatrix();
        gl.domElement.addEventListener("webglcontextlost", props.onFail, {
          once: true,
        });
      }}
    >
      <Suspense fallback={null}>
        <Rig {...props} />

      </Suspense>
    </Canvas>
  );
}
