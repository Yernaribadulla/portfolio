import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SpriteMaterial,
  Sprite,
} from "three";
// Small, deterministic opacity field. No volumetric raymarching or animation loop.
export default function Atmosphere({
  progress,
}: {
  progress: RefObject<number>;
}) {
  const camera = useThree((state) => state.camera);
  const texture = useMemo(() => {
    const size = 256,
      data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = (x / (size - 1)) * 2 - 1,
          ny = (y / (size - 1)) * 2 - 1,
          r = nx * nx + ny * ny;
        const cloud =
          0.6 +
          0.2 * Math.sin(nx * 9 + ny * 4) +
          0.2 * Math.cos(ny * 13 - nx * 5);
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = Math.round(Math.max(0, 1 - r) ** 3 * cloud * 255);
      }
    const t = new DataTexture(data, size, size, RGBAFormat);
    t.magFilter = LinearFilter;
    t.minFilter = LinearFilter;
    t.needsUpdate = true;
    return t;
  }, []);
  const mats = useRef<(SpriteMaterial | null)[]>([]);
  const clouds = useRef<(Sprite | null)[]>([]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    const p = progress.current;
    const opacity =
      Math.max(0, Math.min(1, (p - 0.08) / 0.15)) *
      (1 - Math.min(1, p / 0.9)) *
      0.3;
    mats.current.forEach((m) => {
      if (m) m.opacity = opacity;
    });
    clouds.current.forEach((cloud, i) => {
      if (cloud)
        cloud.position.x =
          [-1, 1, 0, -1.6, 1.8][i] + Math.sin(p * 3 + i) * 0.28;
    });
  });
  return (
    <group>
      {[
        [-1, 0.3, -0.7],
        [1, 0.24, 0.5],
        [0, 0.09, 1.1],
        [-1.6, 0.65, -0.5],
        [1.8, 0.5, -0.8],
      ].map((position, i) => (
        <sprite
          key={i}
          ref={(node) => {
            clouds.current[i] = node;
          }}
          position={position as [number, number, number]}
          scale={[4.5, i > 2 ? 1.5 : 0.8, 1]}
        >
          <spriteMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={texture}
            color="#94a8bb"
            transparent
            opacity={0}
            depthWrite={false}
            onBeforeCompile={(shader) => {
              // Fade in world space before the floor depth-test clips the billboard.
              shader.uniforms.mistCameraWorld = { value: camera.matrixWorld };
              shader.vertexShader = `uniform mat4 mistCameraWorld;
varying float mistHeight;
${shader.vertexShader}`.replace(
                "gl_Position = projectionMatrix * mvPosition;",
                "mistHeight = (mistCameraWorld * mvPosition).y;\ngl_Position = projectionMatrix * mvPosition;",
              );
              shader.fragmentShader = `varying float mistHeight;\n${shader.fragmentShader}`.replace(
                "#include <alphamap_fragment>",
                "#include <alphamap_fragment>\ndiffuseColor.a *= smoothstep(0.015, 0.24, mistHeight);",
              );
            }}
            customProgramCacheKey={() => "ground-faded-mist-v1"}
          />
        </sprite>
      ))}
    </group>
  );
}
