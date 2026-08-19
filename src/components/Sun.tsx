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

/* Glow shells — stacked BackSide spheres with AdditiveBlending that build a
   bright radial gradient around the core. `pulse` is the base sin frequency
   (0 = static shell). */
const SHELLS: Array<{ r: number; color: string; opacity: number; pulse: number }> = [
  { r: 1.25, color: "#ffdd44", opacity: 0.5, pulse: 0.8 },
  { r: 1.6, color: "#ffaa22", opacity: 0.32, pulse: 0.5 },
  { r: 2.1, color: "#ff8800", opacity: 0.18, pulse: 0.3 },
  { r: 2.8, color: "#ff6600", opacity: 0.09, pulse: 0 },
  { r: 3.8, color: "#ff4400", opacity: 0.04, pulse: 0 },
];

const RAY_COUNT = 12;

/* Bright bright Sun: the core is a blinding disc (toneMapped false), five
   pulsing additive shells radiate the halo, and 12 additive rays (elongated
   boxes in the orbital plane) shoot light beams across the scene. The
   PointLight stays the real source — the same warm light that lights the
   planets and casts the eclipsing shadows. */
export default function Sun() {
  const map = useSunTexture();
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRefs = useRef<Array<THREE.Mesh | null>>(new Array(SHELLS.length).fill(null));

  const rayMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffdd55,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  useEffect(() => () => rayMat.dispose(), [rayMat]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y += 0.03 * delta;
    for (let i = 0; i < SHELLS.length; i++) {
      const shell = shellRefs.current[i];
      if (!shell) continue;
      if (SHELLS[i].pulse) {
        shell.scale.setScalar(1 + Math.sin(t * SHELLS[i].pulse + i * 1.7) * 0.035);
      }
    }
    rayMat.opacity = 0.09 + Math.sin(t * 0.6 + 1) * 0.045;
  });

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        color={0xffcc66}
        intensity={1500}
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

      {/* core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial map={map} color={0xffffee} toneMapped={false} />
      </mesh>

      {/* rays — 12 light beams in the orbital plane */}
      {Array.from({ length: RAY_COUNT }).map((_, i) => {
        const angle = (i / RAY_COUNT) * Math.PI * 2 + 0.26;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[SUN_RADIUS * 2.2, 0, 0.02]}>
              <boxGeometry args={[SUN_RADIUS * 2, SUN_RADIUS * 0.42, SUN_RADIUS * 0.42]} />
              <primitive object={rayMat} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* additive glow shells */}
      {SHELLS.map((s, i) => (
        <mesh
          key={s.color + i}
          ref={(el) => {
            shellRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[SUN_RADIUS * s.r, 32, 32]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={s.opacity}
            toneMapped={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}