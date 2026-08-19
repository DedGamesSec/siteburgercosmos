import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";

/* Procedural granulated sun surface (constant warm tone — the limb darkening
   and corona live in the BackSide glow shells, not in this map). */
function buildSunTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFE9A8";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const x = size / 2 + Math.cos(a) * rr * size * 0.42;
    const y = size / 2 + Math.sin(a) * rr * size * 0.42;
    const rad = 1 + Math.random() * 4;
    const hot = Math.random() > 0.5;
    ctx.globalAlpha = 0.05 + Math.random() * 0.11;
    ctx.fillStyle = hot ? "#FFF8E0" : "#B45309";
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SUN_PATH = `${import.meta.env.BASE_URL}textures/planets/sun.jpg`;

/* Prefer the 2K Solar System Scope map when it exists (promt3 item 8), fall
   back to the procedural granulation otherwise. A HEAD probe avoids a noisy
   404 in the console before the file is added. */
function useSunTexture(): THREE.Texture {
  const procedural = useMemo(buildSunTexture, []);
  const [map, setMap] = useState<THREE.Texture>(procedural);
  useEffect(() => {
    let alive = true;
    let tex: THREE.Texture | null = null;
    fetch(SUN_PATH, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        if (!alive || !res.ok) return;
        tex = new THREE.TextureLoader().load(SUN_PATH, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          if (alive) setMap(t);
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
      tex?.dispose();
    };
  }, []);
  return map;
}

/* The real source of warmth: a warm PointLight that reaches every planet and
   casts shadows, an emissive sun sphere (it lights itself via basic material)
   and two BackSide glow shells for the corona. */
export default function Sun() {
  const map = useSunTexture();
  const sunRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (sunRef.current) sunRef.current.rotation.y += 0.002;
  });
  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color="#ffc680"
        intensity={2.6}
        decay={0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={1400}
        shadow-bias={-0.0001}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      {/* inner glow */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.08, 32, 32]} />
        <meshBasicMaterial color="#ffb23e" transparent opacity={0.18} toneMapped={false} side={THREE.BackSide} />
      </mesh>
      {/* corona */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.35, 32, 32]} />
        <meshBasicMaterial color="#ff7a1f" transparent opacity={0.08} toneMapped={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}