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

/* Glow — exactly two very thin BackSide spheres (promt6: "max 2 layers, opacity
   ≤ 0.04"). No pulse (it reads as a bug) and no big warm SPACE_GLOW auras:
   the smooth halo is produced by Bloom in the EffectComposer (CosmosScene), so
   these shells only densify the corona right around the bright disc. */
const SHELLS: Array<{ r: number; color: string; opacity: number }> = [
  { r: 1.25, color: "#ffcc44", opacity: 0.04 },
  { r: 1.6, color: "#ffaa22", opacity: 0.02 },
];

/* Bright Sun (promt6): the core is a self-lit (meshBasicMaterial) warm-white
   disc — the one true light source for the whole system. A gentle HDR boost
   (toneMapped false) keeps only the Sun above the Bloom threshold, so the
   EffectComposer halo is the soft yellow glow from the reference — no fake
   "donut" auras. Two thin additive shells thicken the corona (opacity ≤ 0.04),
   and the PointLight really illuminates every planet and casts the eclipse
   shadows. All decoration is raycast-excluded so hover always reaches the
   planet meshes underneath. */
export default function Sun() {
  const map = useSunTexture();
  const coreRef = useRef<THREE.Mesh>(null);

  /* raycast={() => null} — decorative meshes never intercept pointer events,
     otherwise a shell could swallow a hover aimed at a nearby planet. */
  const noRaycast = useMemo(() => () => null, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y += 0.03 * delta;
  });

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color={0xffdd88}
        intensity={2000}
        distance={0}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-bias={-0.0001}
        shadow-radius={8}
      />

      {/* core — bright emissive disc, no fake layers */}
      <mesh ref={coreRef} raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial map={map} color={new THREE.Color(0xffffee).multiplyScalar(1.8)} toneMapped={false} />
      </mesh>

      {/* soft corona supplements */}
      {SHELLS.map((s, i) => (
        <mesh
          key={s.color + i}
          raycast={noRaycast}
        >
          <sphereGeometry args={[SUN_RADIUS * s.r, 32, 32]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={s.opacity}
            toneMapped={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}