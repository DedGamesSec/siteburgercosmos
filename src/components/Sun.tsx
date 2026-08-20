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

/* Glow shells — two very soft BackSide spheres (AdditiveBlending) that densify
   the innermost corona, plus one far larger, almost transparent warm layer that
   tints the surrounding space (item 11 — the glow should spread well past the
   disc, not just cap at the corona). Bloom in the EffectComposer (CosmosScene)
   is still the main halo source. */
const SHELLS: Array<{ r: number; color: string; opacity: number; pulse: number }> = [
  { r: 1.35, color: "#ffcc55", opacity: 0.28, pulse: 0.7 },
  { r: 1.8, color: "#ff9922", opacity: 0.12, pulse: 0.45 },
];

/* Wide ambient space-glow layer — a huge, very faint warm sphere behind the
   solar system. It does NOT bloom (luminance is far below the EffectComposer
   threshold) but reads as a soft warm atmosphere across the whole region,
   which is what makes the scene feel warm and "lit by the star" rather than a
   bare disc with a halo. */
const SPACE_GLOW: Array<{ r: number; color: string; opacity: number }> = [
  { r: 9, color: "#ffdd88", opacity: 0.055 },
  { r: 16, color: "#ffa84d", opacity: 0.03 },
];

/* Bright Sun: the core is a blinding emissive sphere (toneMapped false and a
   2.2x HDR colour boost keep it above the Bloom threshold so ONLY the Sun
   blooms, not the lit planets). Two soft additive shells thicken the corona.
   The PointLight stays the real physical source — it lights the planets and
   casts the eclipsing shadows. All decoration is raycast-excluded so hover
   always reaches the planet meshes underneath. */
export default function Sun() {
  const map = useSunTexture();
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRefs = useRef<Array<THREE.Mesh | null>>(new Array(SHELLS.length).fill(null));

  /* raycast={() => null} — decorative meshes never intercept pointer events,
     otherwise a shell could swallow a hover aimed at a nearby planet. */
  const noRaycast = useMemo(() => () => null, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y += 0.03 * delta;
    for (let i = 0; i < SHELLS.length; i++) {
      const shell = shellRefs.current[i];
      if (!shell) continue;
      if (SHELLS[i].pulse) {
        shell.scale.setScalar(1 + Math.sin(t * SHELLS[i].pulse + i * 1.4) * 0.03);
      }
    }
  });

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color={0xffcc66}
        intensity={1500}
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

      {/* core — bright emissive disc, no fake layers */}
      <mesh ref={coreRef} raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial map={map} color={new THREE.Color(0xfff0c0).multiplyScalar(2.2)} toneMapped={false} />
      </mesh>

      {/* wide ambient space-glow — a huge faint warm sphere tinting the whole
          region (does NOT bloom: far below the composer's luminance threshold) */}
      {SPACE_GLOW.map((g, i) => (
        <mesh key={`space-glow-${i}`} raycast={noRaycast}>
          <sphereGeometry args={[SUN_RADIUS * g.r, 32, 32]} />
          <meshBasicMaterial
            color={g.color}
            transparent
            opacity={g.opacity}
            toneMapped={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* soft corona supplements */}
      {SHELLS.map((s, i) => (
        <mesh
          key={s.color + i}
          ref={(el) => {
            shellRefs.current[i] = el;
          }}
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