import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "./cosmos/config";

/* Procedural granulated sun surface. */
function buildSunTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFF2C0";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const x = size / 2 + Math.cos(a) * rr * size * 0.42;
    const y = size / 2 + Math.sin(a) * rr * size * 0.42;
    const rad = 1 + Math.random() * 4;
    const hot = Math.random() > 0.5;
    ctx.globalAlpha = 0.05 + Math.random() * 0.11;
    ctx.fillStyle = hot ? "#FFFBEA" : "#B45309";
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

/* Prefer the 2K Solar System Scope map when it exists, fall back to the
   procedural granulation otherwise. A HEAD probe avoids a noisy 404 in the
   console before the file is added. */
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

/* One bright emissive disc plus the real PointLight — no fake aura shells.
   The Sun "glows like a lightbulb" the honest way: toneMapped=false keeps the
   disc blinding bright, and the PointLight is what actually illuminates the
   planets (bright warm side toward the Sun, night side toward shadow),
   producing the eclipses. */
export default function Sun() {
  const map = useSunTexture();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.03 * delta;
  });

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color={0xffcc66}
        intensity={1200}
        distance={0}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-bias={-0.001}
        shadow-radius={4}
      />

      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial map={map} color={0xffffee} toneMapped={false} />
      </mesh>
    </group>
  );
}