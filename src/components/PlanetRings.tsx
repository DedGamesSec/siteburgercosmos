import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "../hooks/useTexture";
import type { RingLayer } from "./cosmos/config";

const PLANE = [Math.PI / 2, 0, 0] as const;

function generateRingTexture(
  planetId: string,
  layer: RingLayer,
  width: number,
  height: number
): THREE.CanvasTexture | null {
  if (layer.textured) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const baseColor = new THREE.Color(layer.color);
  const opacity = layer.opacity;

  if (planetId === "about") {
    for (let y = 0; y < height; y++) {
      const t = y / height;
      const band = Math.sin(t * Math.PI * 60) * 0.5 + 0.5;
      const brightness = 0.6 + band * 0.4;
      const r = Math.floor(baseColor.r * 255 * brightness);
      const g = Math.floor(baseColor.g * 255 * brightness);
      const b = Math.floor(baseColor.b * 255 * brightness);
      const a = opacity * (0.5 + band * 0.5);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(0, y, width, 1);
    }
  } else if (planetId === "tech") {
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const y = Math.floor(i / 4 / width);
      const t = y / height;
      const radialFade = Math.pow(1 - t, 0.3);
      const noise = Math.random();
      const value = (0.5 + noise * 0.3) * radialFade;
      imageData.data[i] = Math.floor(baseColor.r * 255 * value);
      imageData.data[i + 1] = Math.floor(baseColor.g * 255 * value);
      imageData.data[i + 2] = Math.floor(baseColor.b * 255 * value);
      imageData.data[i + 3] = Math.floor(opacity * value * 255);
    }
    ctx.putImageData(imageData, 0, 0);
  } else if (planetId === "news") {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(${baseColor.r * 255},${baseColor.g * 255},${baseColor.b * 255},${opacity * 0.5})`);
    gradient.addColorStop(0.5, `rgba(${baseColor.r * 255},${baseColor.g * 255},${baseColor.b * 255},${opacity * 0.3})`);
    gradient.addColorStop(1, `rgba(${baseColor.r * 255},${baseColor.g * 255},${baseColor.b * 255},${opacity * 0.15})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 4) {
      const brightness = 0.6 + Math.random() * 0.4;
      ctx.fillStyle = `rgba(${baseColor.r * brightness * 255},${baseColor.g * brightness * 255},${baseColor.b * brightness * 255},${opacity * 0.4})`;
      ctx.fillRect(0, y, width, 1);
    }
  } else if (planetId === "how-it-works") {
    const arcPosition = layer.arcPosition ?? Math.PI;
    const arcWidth = layer.arcWidth ?? Math.PI / 4;
    const arcBrightness = layer.arcBrightness ?? 2.0;
    for (let x = 0; x < width; x++) {
      const angle = (x / width) * Math.PI * 2;
      const distFromArc = Math.abs(((angle - arcPosition + Math.PI) % (Math.PI * 2)) - Math.PI);
      const inArc = distFromArc < arcWidth / 2;
      const arcFade = inArc ? 1 - (distFromArc / (arcWidth / 2)) * 0.3 : 0.25;
      for (let y = 0; y < height; y++) {
        const t = y / height;
        const radialFade = Math.pow(1 - t, 0.2);
        const brightness = arcFade * arcBrightness * radialFade;
        const r = Math.min(255, Math.floor(baseColor.r * brightness * 255));
        const g = Math.min(255, Math.floor(baseColor.g * brightness * 255));
        const b = Math.min(255, Math.floor(baseColor.b * brightness * 255));
        const a = Math.min(255, Math.floor(opacity * arcFade * radialFade * 255));
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function RingLayer({ layer, inner, outer, planetId, ei }: { layer: RingLayer; inner: number; outer: number; planetId: string; ei: number }) {
  const proceduralTexture = useMemo(() => generateRingTexture(planetId, layer, 1024, 64), [planetId, layer]);
  const alphaMap = useTexture(`${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`, "#c8a66a");

  if (planetId === "about") {
    return (
      <mesh rotation={PLANE} castShadow receiveShadow>
        <ringGeometry args={[inner, outer, 64]} />
        <meshBasicMaterial
          map={layer.textured ? alphaMap : proceduralTexture}
          color={layer.textured ? layer.color : undefined}
          transparent
          opacity={layer.opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    );
  }

  return (
    <mesh rotation={PLANE} castShadow receiveShadow>
      <ringGeometry args={[inner, outer, 64]} />
      <meshStandardMaterial
        map={proceduralTexture}
        color={layer.color}
        emissive={new THREE.Color(layer.color)}
        emissiveIntensity={ei}
        transparent
        opacity={layer.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        roughness={1.0}
        metalness={0.0}
      />
    </mesh>
  );
}

export default function PlanetRings({ radius, layers, planetId }: { radius: number; layers: RingLayer[]; planetId: string }) {
  const EMISSIVE: Record<string, number> = {
    tech: 0.25,
    news: 0.35,
    "how-it-works": 0.4,
  };
  const ei = EMISSIVE[planetId] ?? 0;

  return (
    <group>
      {layers.map((r, i) => (
        <RingLayer
          key={i}
          layer={r}
          inner={radius * r.inner}
          outer={radius * r.outer}
          planetId={planetId}
          ei={ei}
        />
      ))}
    </group>
  );
}
