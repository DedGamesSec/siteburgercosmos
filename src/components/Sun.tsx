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

/* Sun (chiaroscuro): clean warm disc (0xfff0cc) + 2-sprite compact corona.
   ONE radial pointLight (decay 1, distance 0 = unbounded) lights every planet
   from the Sun's own direction, so the day/night terminator + eclipse shadows
   read on all bodies; hemisphere fill only keeps night-sides from pure black.
   Sprites breathe gently; raycast excluded for hover. */
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
      {/* single radial sun light — every planet is lit from the Sun's direction,
          so the day/night terminator reads on every body (decay 1 keeps the
          outer planets lit, no directional flatlight washing out contrast) */}
      <pointLight
        position={[0, 0, 0]}
        color={0xffcc77}
        intensity={190}
        distance={0}
        decay={0.75}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={800}
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