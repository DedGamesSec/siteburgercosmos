import * as THREE from "three";

/* 64-stop smooth radial glow texture — the opposite of the old stepped
   BackSide shells. The eased (pow 2.2) falloff gives a Gaussian profile with
   zero visible banding, so billboard sprites read as one soft corona. */

function parseRGBA(s: string) {
  const m = s.match(/rgba?\(([^)]+)\)/)!;
  const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}

function lerpColor(a: string, b: string, c: string, t: number): string {
  const [c1, c2] = t < 0.5 ? [a, b] : [b, c];
  const localT = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const pa = parseRGBA(c1);
  const pb = parseRGBA(c2);
  const r = Math.round(pa.r + (pb.r - pa.r) * localT);
  const g = Math.round(pa.g + (pb.g - pa.g) * localT);
  const bl = Math.round(pa.b + (pb.b - pa.b) * localT);
  const al = pa.a + (pb.a - pa.a) * localT;
  return `rgba(${r},${g},${bl},${al})`;
}

export function createGlowTexture({
  size = 512,
  innerColor = "rgba(255, 250, 220, 1.0)",
  midColor = "rgba(255, 220, 140, 0.6)",
  outerColor = "rgba(255, 180, 80, 0)",
  falloff = 2.2,
}: {
  size?: number;
  innerColor?: string;
  midColor?: string;
  outerColor?: string;
  falloff?: number;
} = {}): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;

  const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);

  const STEPS = 64;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const eased = Math.pow(t, falloff);
    gradient.addColorStop(t, lerpColor(innerColor, midColor, outerColor, eased));
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}