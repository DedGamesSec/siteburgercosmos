import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";
import { createGlowTexture } from "./glowTexture";

/* Corona — 3 billboard sprites (corrected prompt v2). Sprites always face
   the camera (Three.js does this automatically), so there is NO edge and the
   layered gear-step rings are physically impossible at any camera angle.
   Each sprite carries a 64-stop eased gradient texture (smooth Gaussian-ish
   falloff) — the whole halo reads as one soft golden corona ~2.5–3× the
   disc width, exactly like the reference screenshot. */

const CORONA_LAYERS = [
  {
    scale: 2.8,
    opacity: 0.85,
    falloff: 2.4,
    inner: "rgba(255,255,245,1)",
    mid: "rgba(255,238,180,0.5)",
    outer: "rgba(255,200,110,0)",
  },
  {
    scale: 5.0,
    opacity: 0.45,
    falloff: 2.2,
    inner: "rgba(255,250,220,0.8)",
    mid: "rgba(255,220,140,0.35)",
    outer: "rgba(255,180,80,0)",
  },
  {
    scale: 8.5,
    opacity: 0.18,
    falloff: 2.0,
    inner: "rgba(255,240,200,0.5)",
    mid: "rgba(255,200,120,0.2)",
    outer: "rgba(255,160,60,0)",
  },
];

/* Sun (corrected prompt v2): a CLEAN pure-white disc (meshBasicMaterial
   color 0xfffff5, toneMapped=false so it stays white-hot) — no spotty
   procedural texture dirtying it — plus the 3-sprite corona. The PointLight
   (intensity 10000, decay 1) is the ONLY light source and does all the real
   illumination with real eclipse shadows. The disc keeps a slow roll; the
   sprites breathe very gently. raycast is excluded so hover reaches planets. */
export default function Sun() {
  const spriteRefs = useRef<THREE.Sprite[]>([]);

  const textures = useMemo(
    () =>
      CORONA_LAYERS.map((l) =>
        createGlowTexture({
          innerColor: l.inner,
          midColor: l.mid,
          outerColor: l.outer,
          falloff: l.falloff,
        })
      ),
    []
  );

  const noRaycast = useMemo(() => () => null, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    spriteRefs.current.forEach((s, i) => {
      if (!s) return;
      const base = SUN_RADIUS * CORONA_LAYERS[i].scale;
      const breathe = 1 + Math.sin(t * (0.3 + i * 0.1) + i) * 0.03;
      s.scale.setScalar(base * 2 * breathe);
    });
  });

  return (
    <group>
      {/* the single light source — warm white bulb, real eclipse shadows */}
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

      {/* the visible Sun — a clean bright-white disc, no spotty texture,
          toneMapped off so the core stays white-hot like a bulb */}
      <mesh raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial color={0xfffff5} toneMapped={false} />
      </mesh>

      {/* corona = 3 billboard sprites with the band-free gradient texture */}
      {CORONA_LAYERS.map((l, i) => (
        <sprite
          key={`corona-${i}`}
          ref={(el) => {
            if (el) spriteRefs.current[i] = el;
          }}
          raycast={() => null}
        >
          <spriteMaterial
            map={textures[i]}
            transparent
            opacity={l.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}