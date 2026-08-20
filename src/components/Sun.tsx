import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";

/* Procedural granulated sun surface. */
function buildSunTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFF2C0";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const x = size / 2 + Math.cos(a) * rr * size * 0.42;
    const y = size / 2 + Math.sin(a) * rr * size * 0.42;
    const rad = 1 + Math.random() * 4;
    const hot = Math.random() > 0.5;
    ctx.globalAlpha = 0.05 + Math.random() * 0.11;
    ctx.fillStyle = hot ? "#FFFBEA" : "#B45309";
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SUN_PATH = `${import.meta.env.BASE_URL}textures/planets/sun.jpg`;

/* Prefer the 2K Solar System Scope map when it exists, fall back to the
   procedural granulation otherwise. A HEAD probe avoids a noisy 404 in the
   console before the file is added. */
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

/* Soft yellow sun glow (promt8 iteration 8) — three very thin BackSide corona
   shells with YELLOW colours (never orange), tiny opacities (0.08/0.03/0.01)
   and small radii (33% / 83% / 150% above the disc — scaled from the guide's
   16/22/30 onto our SUN_RADIUS=44 world units). depthWrite=false and
   AdditiveBlending make them a soft luminous wash right around the disc, never
   a wide orange blotch. No Bloom / PostProcessing (see CosmosScene). */
export const SUN_GLOW: Array<{ r: number; color: string; opacity: number }> = [
  { r: 1.33, color: "#ffee88", opacity: 0.08 },
  { r: 1.83, color: "#ffdd66", opacity: 0.03 },
  { r: 2.5, color: "#ffcc44", opacity: 0.01 },
];

/* Sun (promt8 iteration 8): a bright warm-white disc (meshBasicMaterial,
   color 0xfffff0) surrounded by three soft yellow glow layers, with the
   PointLight doing the real illumination. decay=1 (linear falloff) and a
   strong intensity reach every planet (orbits up to ~460 world units):
   5000 / 460 ≈ 10.9 — comfortably lit; the light casts real eclipse shadows.
   glow1 breathes very gently (±2%) so the corona reads alive, planet hover is
   never blocked (raycast excluded) and the night-side stays dark. */
export default function Sun() {
  const map = useSunTexture();
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRefs = useRef<Array<THREE.Mesh | null>>(new Array(SUN_GLOW.length).fill(null));

  const noRaycast = useMemo(() => () => null, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y += 0.03 * delta;
    const g0 = glowRefs.current[0];
    if (g0) {
      g0.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
    }
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
        shadow-camera-far={600}
        shadow-bias={-0.0001}
        shadow-radius={8}
      />

      {/* the visible Sun — a bright warm-white disc */}
      <mesh ref={coreRef} raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial map={map} color={0xfffff0} />
      </mesh>

      {/* three soft yellow corona layers (0.08 / 0.03 / 0.01) */}
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