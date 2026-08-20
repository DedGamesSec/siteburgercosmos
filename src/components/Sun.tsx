import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";

/* Smooth procedural sun surface (promt9 iteration 9): a bright warm-white
   radial gradient with soft blotches — NO granulation speckles (the old
   dotted fallback read as "cheese holes"). */
function buildSunTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.25, "#fff4c2");
  gradient.addColorStop(0.55, "#ffe28a");
  gradient.addColorStop(0.85, "#ffd054");
  gradient.addColorStop(1, "#ffc837");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // A few very soft, larger blotches so the disc reads alive but stays smooth.
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 24 + Math.random() * 90;
    const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
    const darker = Math.random() > 0.5;
    spot.addColorStop(0, darker ? "rgba(255, 190, 60, 0.18)" : "rgba(255, 255, 240, 0.16)");
    spot.addColorStop(1, "rgba(255, 190, 60, 0)");
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

/* Bright lightbulb glow (promt9 iteration 9) — four wide yellow BackSide
   corona shells. Radii keep the guide's 20/35/55/80 ratios (1.667 / 2.917 /
   4.583 / 6.667 × the sun) mapped onto our SUN_RADIUS=44 world units, so the
   halo reads as big as the reference photo (~40% of the screen). Pure yellow
   colours (never orange), AdditiveBlending, depthWrite=false — no Bloom /
   PostProcessing anywhere (see CosmosScene). glow1 + glow2 breathe gently so
   the halo reads alive. */
export const SUN_GLOW: Array<{ r: number; color: string; opacity: number }> = [
  { r: 1.667, color: "#ffee88", opacity: 0.15 },
  { r: 2.917, color: "#ffdd66", opacity: 0.08 },
  { r: 4.583, color: "#ffcc44", opacity: 0.04 },
  { r: 6.667, color: "#ffbb33", opacity: 0.015 },
];

/* Sun (promt9 iteration 9): a bright white-yellow disc (meshBasicMaterial,
   color 0xfffff0) wrapped in the four-layer yellow halo, with the PointLight
   doing the real illumination. decay=1 (linear falloff) and a strong
   intensity reach every planet (orbits up to ~380 world units): 5000 / 380
   ≈ 13 — brightly lit; the light casts real eclipse shadows. The halo is
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
        color={0xffeebb}
        intensity={5000}
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

      {/* the visible Sun — a bright warm-white smooth disc */}
      <mesh ref={coreRef} raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial map={map} color={0xfffff0} />
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