import * as THREE from "three";
import { useTexture } from "../hooks/useTexture";
import type { RingLayer } from "./cosmos/config";

const PLANE = [Math.PI / 2, 0, 0] as const;

export default function PlanetRings({ radius, layers }: { radius: number; layers: RingLayer[] }) {
  const alpha = useTexture(`${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`, "#c8a66a");

  return (
    <group>
      {layers.map((r, i) => {
        const inner = radius * r.inner;
        const outer = radius * r.outer;
        if (r.textured) {
          return (
            <mesh key={i} rotation={PLANE} renderOrder={i + 1} castShadow receiveShadow>
              <ringGeometry args={[inner, outer, 64]} />
              <meshStandardMaterial
                map={alpha}
                alphaMap={alpha}
                color={r.color}
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
