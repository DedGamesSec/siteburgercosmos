import * as THREE from "three";
import { useTexture } from "../hooks/useTexture";
import type { RingLayer } from "./cosmos/config";

const PLANE = [Math.PI / 2, 0, 0] as const;

function emissiveFor(planetId: string): number {
  if (planetId === "news") return 0.4;    // Uranus
  if (planetId === "how-it-works") return 0.5; // Neptune
  if (planetId === "tech") return 0.3;    // Jupiter
  return 0.1;                              // Saturn
}

export default function PlanetRings({ radius, layers, planetId }: { radius: number; layers: RingLayer[]; planetId: string }) {
  const alpha = useTexture(`${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`, "#c8a66a");
  const ei = emissiveFor(planetId);

  return (
    <group>
      {layers.map((r, i) => {
        const inner = radius * r.inner;
        const outer = radius * r.outer;
        const emissiveColor = new THREE.Color(r.color);
        if (r.textured) {
          return (
            <mesh key={i} rotation={PLANE} renderOrder={i + 1} castShadow receiveShadow>
              <ringGeometry args={[inner, outer, 64]} />
              <meshStandardMaterial
                map={alpha}
                alphaMap={alpha}
                color={r.color}
                emissive={emissiveColor}
                emissiveIntensity={ei}
                transparent
                opacity={r.opacity}
                alphaTest={0.05}
                side={THREE.DoubleSide}
                depthWrite={false}
                roughness={0.7}
                metalness={0.0}
              />
            </mesh>
          );
        }
        return (
          <mesh key={i} rotation={PLANE} renderOrder={i + 1} castShadow receiveShadow>
            <ringGeometry args={[inner, outer, 64]} />
            <meshStandardMaterial
              color={r.color}
              emissive={emissiveColor}
              emissiveIntensity={ei}
              transparent
              opacity={r.opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
