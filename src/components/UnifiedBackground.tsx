import { useMemo } from "react";
import * as THREE from "three";

/* Unified background star field (promt5 item 2-3). ONE custom Points cloud at
   the root of the scene — no drei <Stars>, no <color attach="background">, so
   there is never a double background. Stars are static in space (they never
   move when the camera orbits), sit 1000–1500 units out (just inside the 3000
   far plane), use sizeAttenuation=false so they never swell when zooming, and
   AdditiveBlending + depthWrite=false so they never fight the planets. */
export default function UnifiedBackground() {
  const { positions, colors, count } = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1000 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const brightness = 0.7 + Math.random() * 0.3;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.95;
      colors[i * 3 + 2] = brightness;
    }
    return { positions, colors, count };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}