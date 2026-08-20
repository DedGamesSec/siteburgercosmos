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
    scale: 4.0,
    opacity: 0.8,
    falloff: 2.2,
    inner: "rgba(255, 250, 220, 1.0)",
    mid: "rgba(255, 230, 150, 0.6)",
    outer: "rgba(255, 200, 100, 0)",
  },
  {
    scale: 8.0,
    opacity: 0.4,
    falloff: 1.8,
    inner: "rgba(255, 245, 200, 0.9)",
    mid: "rgba(255, 220, 140, 0.4)",
    outer: "rgba(255, 180, 80, 0)",
  },
  {
    scale: 15.0,
    opacity: 0.15,
    falloff: 1.5,
    inner: "rgba(255, 240, 190, 0.6)",
    mid: "rgba(255, 210, 130, 0.25)",
    outer: "rgba(255, 170, 70, 0)",
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
        color={0xffeebb}
        intensity={8}
        distance={0}
        decay={0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={500}
        shadow-bias={-0.0001}
        shadow-radius={8}
      />

      {/* the visible Sun — bright, warm, with a crisp edge; toneMapped off
            keeps it luminous like a bulb (corrected prompt v7) */}
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