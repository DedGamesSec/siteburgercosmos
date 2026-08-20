import * as THREE from "three";
import { useTexture } from "../hooks/useTexture";

/* Saturn's rings — four real annulus layers (promt4 item 2):
   · C inner crepe (faint, dusty),
   · B dense bright bands,
   · A outer textured ring driven by the Solar System Scope alpha map,
   · the dark Cassini division cut between the A and B systems.
   Every layer is a real ringGeometry in the planet's equatorial plane; the
   shell doubles-inside the visible sphere so silhouette stays realistic. */
export default function SaturnRings({ radius }: { radius: number }) {
  const alpha = useTexture(`${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`, "#c8a66a");
  const plane = [Math.PI / 2, 0, 0] as const;
  return (
    <group>
      {/* Ring C — inner, misty */}
      <mesh rotation={plane} renderOrder={1}>
        <ringGeometry args={[radius * 1.1, radius * 1.3, 64]} />
        <meshStandardMaterial color="#d4b078" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Ring B — dense, medium */}
      <mesh rotation={plane} renderOrder={2}>
        <ringGeometry args={[radius * 1.5, radius * 1.9, 64]} />
        <meshStandardMaterial color="#e4c98a" transparent opacity={0.62} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Ring A — outer, textured */}
      <mesh rotation={plane} renderOrder={3}>
        <ringGeometry args={[radius * 1.25, radius * 2.2, 64]} />
        <meshStandardMaterial
          map={alpha}
          alphaMap={alpha}
          color="#dcc088"
          transparent
          opacity={0.85}
          alphaTest={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Cassini division — a dark gap cut behind the bright A band */}
      <mesh rotation={plane} renderOrder={4}>
        <ringGeometry args={[radius * 1.95, radius * 2.0, 64]} />
        <meshBasicMaterial color="#2a2012" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}