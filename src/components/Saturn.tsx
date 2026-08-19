import * as THREE from "three";
import { useTexture } from "../hooks/useTexture";

/* Saturn's rings — a real ring (annulus) instead of a flat quad, so the
   planet never shows as a bare sphere. The alpha PNG drives the bands via
   alphaMap (white = ring, black = gap) on a beige base, and a dark Cassini
   division band sits between the A and B systems. */
export default function SaturnRings({ radius }: { radius: number }) {
  const alpha = useTexture(`${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`, "#77706a");
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh renderOrder={2}>
        <ringGeometry args={[radius * 1.25, radius * 2.35, 128]} />
        <meshStandardMaterial
          color="#c8c0b6"
          alphaMap={alpha}
          transparent
          opacity={0.92}
          alphaTest={0.04}
          side={THREE.DoubleSide}
          roughness={0.7}
          metalness={0.05}
          depthWrite={false}
        />
      </mesh>
      {/* Cassini division — a thin dark gap between the bright A and B rings */}
      <mesh renderOrder={3}>
        <ringGeometry args={[radius * 1.72, radius * 1.88, 128]} />
        <meshBasicMaterial color="#14141a" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}