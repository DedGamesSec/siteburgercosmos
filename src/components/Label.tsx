import { useMemo } from "react";
import * as THREE from "three";

function buildLabelTexture(name: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#F5F5F0";
  ctx.fillText(name, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Upright planet label — a camera-facing sprite with a canvas-drawn texture.
   (drei <Text> is not used: its text mesh runs a Blob Web Worker, which this
   site's CSP blocks, and a failed worker hangs the whole R3F frame loop.) */
export default function Label({ text, position }: { text: string; position: [number, number, number] }) {
  const map = useMemo(() => buildLabelTexture(text), [text]);
  return (
    <sprite position={position} scale={[110, 27.5, 1]}>
      <spriteMaterial map={map} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}