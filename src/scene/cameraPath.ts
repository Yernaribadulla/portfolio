import { CubicBezierCurve3, MathUtils, Vector3 } from "three";
export const SCREEN = {
  center: new Vector3(0, 0.698, -0.077),
  width: 0.454,
  height: 0.284,
  tilt: -0.18,
};
const smooth = (x: number) => {
  const t = MathUtils.clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export function cameraPose(progress: number, aspect: number) {
  const start = new Vector3(2.3, 1.75, 4.1);
  const normal = new Vector3(0, Math.sin(0.18), Math.cos(0.18));
  const distance =
    Math.max(SCREEN.height, SCREEN.width / aspect) /
    (2 * Math.tan(MathUtils.degToRad(36) / 2));
  const end = SCREEN.center.clone().addScaledVector(normal, distance);
  const position = new CubicBezierCurve3(
    start,
    new Vector3(0.85, 1.5, 3.0),
    end.clone().addScaledVector(normal, 0.7),
    end,
  ).getPoint(smooth((progress - 0.3) / 0.7));
  const target = new Vector3(0, 0.53, 0).lerp(
    SCREEN.center,
    smooth((progress - 0.3) / 0.55),
  );
  return {
    position,
    target,
    reveal: smooth((progress - 0.1) / 0.2),
    fog: MathUtils.lerp(0.48, 0.012, smooth((progress - 0.1) / 0.75)),
  };
}
// Homography: unit rectangle -> four projected screen corners; CSS accepts it as matrix3d.
export function quadMatrix(
  points: { x: number; y: number }[],
  width: number,
  height: number,
) {
  const [p0, p1, p2, p3] = points;
  const dx1 = p1.x - p2.x,
    dx2 = p3.x - p2.x,
    dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y,
    dy2 = p3.y - p2.y,
    dy3 = p0.y - p1.y + p2.y - p3.y;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det,
    h = (dx1 * dy3 - dx3 * dy1) / det;
  const a = p1.x - p0.x + g * p1.x,
    b = p3.x - p0.x + h * p3.x,
    c = p0.x;
  const d = p1.y - p0.y + g * p1.y,
    e = p3.y - p0.y + h * p3.y,
    f = p0.y;
  return `matrix3d(${a / width},${d / width},0,${g / width},${b / height},${e / height},0,${h / height},0,0,1,0,${c},${f},0,1)`;
}
