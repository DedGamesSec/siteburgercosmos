import { useMemo } from "react";
import * as THREE from "three";

/* Blue orbit ring — a perfect concentric circle (no eccentricity), built once
   into a BufferGeometry-backed THREE.Line instead of re-tessellating every
   frame (see promt3 items 4-5). All rings share the Sun's centre, so they can
   never intersect. */
export default function Orbit({ radius }: { radius: number }) {
  const line = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: "#4a5568", transparent: true, opacity: 0.08 });
    return new THREE.Line(geo, mat);
  }, [radius]);

  return <primitive object={line} raycast={() => null} />;
}