import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";
import { createGlowTexture } from "./glowTexture";

/* Corona — 2 billboard sprites with a 64-stop eased gradient texture.
   Compact: single layer ≈1.3× the disc, outer ≈2.0× — the aura no longer
   swallows the inner planets. */

const CORONA_LAYERS = [
  {
    scale: 1.25,
    opacity: 0.95,
    falloff: 6.0,
    inner: "rgba(255, 250, 220, 1.0)",
    mid: "rgba(255, 230, 140, 0.5)",
    outer: "rgba(255, 190, 60, 0)",
  },
  {
    scale: 1.9,
    opacity: 0.25,
    falloff: 5.0,
    inner: "rgba(255, 235, 180, 0.6)",
    mid: "rgba(255, 210, 110, 0.2)",
    outer: "rgba(255, 170, 40, 0)",
  },
];

/* Sun (shadow fix): clean warm disc (0xfff0cc) + 2-sprite compact corona
   (1.25×/1.9×, tight falloff). hybrid light: pointLight decay=2 (near zone)
   + directionalLight (outer planets), hemisphere fill keeps night-sides
   readable. Sprites breathe gently; raycast excluded for hover. */
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
      {/* hybrid lighting (shadow-darkness fix):
          pointLight — near zone (0–150): natural decay=2 falloff, hard
          eclipse shadows for inner planets;
          directionalLight — whole scene: uniform sun-parallel rays reach the
          outer planets without 1/d² darkness, still casts shadows. */}
      <pointLight
        position={[0, 0, 0]}
        color={0xffcc77}
        intensity={8}
        distance={150}
        decay={2}
        castShadow
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[0, 80, 120]}
        color={0xffddaa}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* the visible Sun — warm disc, bright core */}
      <mesh raycast={noRaycast}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial color={0xfff0cc} toneMapped={false} />
      </mesh>

      {/* corona = 2 billboard sprites with the band-free gradient texture */}
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