import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";

/* Procedural granulated sun surface (constant warm tone — the limb darkening
   and corona live in the additive glow shells, not in this map). */
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

/* Soft yellow glow built ONLY from stacked spheres with AdditiveBlending —
   deliberately no Bloom / PostProcessing (promt5 item 1). depthWrite=false so
   the shells never occlude each other, transparency ramps down
   0.4 → 0.2 → 0.08 → 0.03, and the three inner shells pulse at different
   frequencies for a living halo. The Sun is also the light source casting the
   eclipsing shadows. */
export default function Sun() {
  const map = useSunTexture();
  const meshRef = useRef<THREE.Mesh>(null);
  const glow1Ref = useRef<THREE.Mesh>(null);
  const glow2Ref = useRef<THREE.Mesh>(null);
  const glow3Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y += 0.03 * delta;
    if (glow1Ref.current) glow1Ref.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.02);
    if (glow2Ref.current) glow2Ref.current.scale.setScalar(1 + Math.sin(t * 0.5 + 1) * 0.03);
    if (glow3Ref.current) glow3Ref.current.scale.setScalar(1 + Math.sin(t * 0.3 + 2) * 0.04);
  });

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color={0xffcc66}
        intensity={1000}
        distance={0}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-bias={-0.001}
        shadow-radius={4}
      />

      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial map={map} color={0xffffee} />
      </mesh>

      {/* Layer 1 — near glow (bright yellow) */}
      <mesh ref={glow1Ref}>
        <sphereGeometry args={[SUN_RADIUS * 1.33, 32, 32]} />
        <meshBasicMaterial
          color={0xffdd44}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Layer 2 — mid glow (orange-yellow) */}
      <mesh ref={glow2Ref}>
        <sphereGeometry args={[SUN_RADIUS * 1.83, 32, 32]} />
        <meshBasicMaterial
          color={0xffaa22}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Layer 3 — far glow (soft orange) */}
      <mesh ref={glow3Ref}>
        <sphereGeometry args={[SUN_RADIUS * 2.67, 32, 32]} />
        <meshBasicMaterial
          color={0xff8800}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Layer 4 — furthest (barely visible) */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 3.75, 32, 32]} />
        <meshBasicMaterial
          color={0xff6600}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}