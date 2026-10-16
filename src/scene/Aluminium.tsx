import { useEffect, useMemo } from "react";
import {
  DataTexture,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
} from "three";
// Microscopic finish, not visible scratches: small roughness variation breaks up uniform highlights.
export default function Aluminium({ color = "#8b9198" }: { color?: string }) {
  const grain = useMemo(() => {
    const size = 256,
      data = new Uint8Array(size * size * 4);
    let seed = 17;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        seed = (1664525 * seed + 1013904223) >>> 0;
        const value =
          205 + (seed / 4294967296 - 0.5) * 26 + Math.sin(y * 2.7) * 7;
        const i = (y * size + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = value;
        data[i + 3] = 255;
      }
    const t = new DataTexture(data, size, size, RGBAFormat);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(6, 6);
    t.generateMipmaps = true;
    t.minFilter = LinearMipmapLinearFilter;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, []);
  useEffect(() => () => grain.dispose(), [grain]);
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0.88}
      roughness={0.42}
      roughnessMap={grain}
      bumpMap={grain}
      bumpScale={0.000006}
      anisotropy={0.2}
      envMapIntensity={0.9}
    />
  );
}
