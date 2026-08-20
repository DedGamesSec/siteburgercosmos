import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";

/* Smooth procedural sun surface (promt10 iteration 10): a 1024² radial
   gradient — bright white-yellow core melting into warm yellow, with soft
   bright blotches and a few small sunspots. No granulation speckles (the old
   dotted fallback read as "cheese holes"). */
function buildSunTexture(): THREE.CanvasTexture {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "#fffff5");
  gradient.addColorStop(0.15, "#ffffee");
  gradient.addColorStop(0.3, "#ffee88");
  gradient.addColorStop(0.5, "#ffdd55");
  gradient.addColorStop(0.7, "#ffcc33");
  gradient.addColorStop(0.85, "#ffbb22");
  gradient.addColorStop(1, "#ffaa11");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Soft bright blotches so the disc reads alive but stays smooth.
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 30 + Math.random() * 80;
    const brightness = 0.1 + Math.random() * 0.2;
    const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
    spot.addColorStop(0, `rgba(255, 240, 150, ${brightness})`);
    spot.addColorStop(1, "rgba(255, 240, 150, 0)");
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // A few small dark sunspots.
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 15;
    const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
    spot.addColorStop(0, "rgba(200, 150, 50, 0.3)");
    spot.addColorStop(1, "rgba(200, 150, 50, 0)");
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SUN_PATH = `${import.meta.env.BASE_URL}textures/planets/sun.jpg`;

/* Prefer the 2K Solar System Scope map when it exists, fall back to the
   smooth procedural gradient otherwise. A HEAD probe avoids a noisy 404 in
   the console before the file is added. */
function useSunTexture(): THREE.Texture {
  const procedural = useMemo(buildSunTexture, []);
  const [map, setMap] = useState<THREE.Texture>(procedural);
  useEffect(() => {
    let alive = true;
    let tex: THREE.Texture | null = null;
    fetch(SUN_PATH, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        if (!alive || !res.ok) return;
        tex = new THREE.TextureLoader().load(SUN_PATH, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          if (alive) setMap(t);
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
      tex?.dispose();
    };
  }, []);
  return map;
}

/* Bright lightbulb glow (corrected prompt) — EIGHT BackSide corona shells
   with a smooth white→yellow→orange falloff. Radii are guide ratios × our
   SUN_RADIUS=44; small radius steps (1.08→1.20→1.40→1.70→2.10→2.70→3.50→4.50)
   and a gentle opacity ramp (0.35→0.006) make the transition seamless — with
   the locked camera the shells read as one soft halo, not concentric rings.
   AdditiveBlending + depthWrite=false; no Bloom / PostProcessing anywhere. */
export const SUN_GLOW: Array<{ r: number; color: string; opacity: number }> = [
  { r: 1.08, color: "#fffff5", opacity: 0.35 },
  { r: 1.2, color: "#ffffee", opacity: 0.25 },
  { r: 1.4, color: "#ffee88", opacity: 0.18 },
  { r: 1.7, color: "#ffdd66", opacity: 0.12 },
  { r: 2.1, color: "#ffcc55", opacity: 0.07 },
  { r: 2.7, color: "#ffbb44", opacity: 0.035 },
  { r: 3.5, color: "#ffaa33", opacity: 0.015 },
  { r: 4.5, color: "#ff9922", opacity: 0.006 },
];

/* Sun (promt10 iteration 10): a bright white-yellow disc (meshBasicMaterial,
   color 0xfffff5) wrapped in the five-layer yellow halo, with the PointLight
   doing the real illumination. decay=1 (linear falloff) and a very strong
   intensity reach every planet (orbits up to ~380 world units): 10000 / 380
   ≈ 26 — brightly lit; the light casts real eclipse shadows. The halo is
   opaque-planet-friendly (planets render in front of it) and never blocks
   hover (raycast excluded). */
export default function Sun() {
  const map = useSunTexture();
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRefs = useRef<Array<THREE.Mesh | null>>(new Array(SUN_GLOW.length).fill(null));

  const noRaycast = useMemo(() => () => null, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y += 0.03 * delta;
    const g0 = glowRefs.current[0];
    if (g0) g0.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
    const g1 = glowRefs.current[1];
    if (g1) g1.scale.setScalar(1 + Math.sin(t * 0.3 + 1) * 0.03);
  });

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color={0xfff5dd}
        intensity={10000}
        distance={0}
        decay={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-bias={-0.0001}
        shadow-radius={8}
      />

      {/* the visible Sun — a bright near-white disc, toneMapped off so the
          core stays white-hot like a bulb */}
      <mesh ref={coreRef} raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial map={map} color={0xfffff5} toneMapped={false} />
      </mesh>

      {/* the four yellow halo layers (0.15 / 0.08 / 0.04 / 0.015) */}
      {SUN_GLOW.map((g, i) => (
        <mesh
          key={`glow-${i}`}
          ref={(el) => {
            glowRefs.current[i] = el;
          }}
          raycast={noRaycast}
        >
          <sphereGeometry args={[SUN_RADIUS * g.r, 32, 32]} />
          <meshBasicMaterial
            color={g.color}
            transparent
            opacity={g.opacity}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}