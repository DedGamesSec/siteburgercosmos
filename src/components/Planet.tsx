import { useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { LanguageCode } from "../i18n/languages";
import { useTexture } from "../hooks/useTexture";
import { ORBIT_CYCLE, PLANET_MOTION, type HoverPt, type PlanetItem } from "./cosmos/config";
import Label from "./Label";
import SaturnRings from "./Saturn";

/* A single orbiting planet:
   · perfect circle on its blue ring (no eccentricity — promt3 item 5);
   · real axial tilt, continuous axial spin (retrograde for Venus/Uranus);
   · one shared light from the Sun, so planets receive + cast shadows
     (only the biggest cast, keeping the shadow map cheap — promt3 item 4);
   · hover raycasts the sphere and reports the projected screen position so
     the parent info card tracks the moving planet; click navigates;
   · gentle dim/scale of the neighbours and an upright canvas-label. */
export default function Planet({
  item,
  language,
  initialAngleDeg,
  timeScale,
  onHoverRef,
  onNavigateRef,
  onGroup,
}: {
  item: PlanetItem;
  language: LanguageCode;
  initialAngleDeg: number;
  timeScale: number;
  onHoverRef: MutableRefObject<((pageId: string | null, pt?: HoverPt) => void) | null>;
  onNavigateRef: MutableRefObject<((id: string, e: { clientX: number; clientY: number }) => void) | null>;
  onGroup: (id: string, g: THREE.Group | null) => void;
}) {
  const { page, data, radiusPx } = item;
  const cfg = PLANET_MOTION[page.id];
  const radius = data.sizePx / 2;
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(THREE.MathUtils.degToRad(initialAngleDeg));
  const orbitRate = (Math.PI * 2 * cfg.orbitSpeed) / (ORBIT_CYCLE * 4.15);
  const texture = useTexture(`${import.meta.env.BASE_URL}${data.textureUrlHi ?? data.textureUrl}`, data.color);

  const seth = (g: THREE.Group | null) => {
    groupRef.current = g;
    onGroup(page.id, g);
  };

  // Hover state lives on refs (no re-render here — the parent owns the
  // card/highlight states); the frame loop reads them directly.
  const ownHoverRef = useRef(false);
  const lastPtRef = useRef<HoverPt | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const reportProjected = () => {
    const g = groupRef.current;
    const camera = cameraRef.current;
    if (!g || !camera) return;
    const v = new THREE.Vector3();
    g.getWorldPosition(v);
    v.project(camera);
    const pt = { x: (v.x * 0.5 + 0.5) * sizeRef.current.width, y: (1 - (v.y * 0.5 + 0.5)) * sizeRef.current.height };
    const last = lastPtRef.current;
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > 5) {
      lastPtRef.current = pt;
      onHoverRef.current?.(page.id, pt);
    }
  };

  useFrame((state, delta) => {
    cameraRef.current = state.camera;
    sizeRef.current = { width: state.size.width, height: state.size.height };
    const g = groupRef.current;
    const m = meshRef.current;
    if (!g || !m) return;

    // Perfect circular orbit around the shared centre.
    angleRef.current += orbitRate * delta * timeScale;
    g.position.set(Math.cos(angleRef.current) * radiusPx, 0, Math.sin(angleRef.current) * radiusPx);

    // Axial spin lives on the mesh, orbit motion on the group.
    m.rotation.y += cfg.rotationSpeed * delta * 60 * timeScale;

    // Dim + gentle scale of the hovered/neighbour bodies each frame (no state).
    const hovered = ownHoverRef.current;
    m.traverse((o) => {
      const node = o as THREE.Mesh;
      if (!node.isMesh || !node.material) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const mm of mats as THREE.MeshStandardMaterial[]) {
        mm.transparent = true;
        mm.opacity = hovered ? 1 : 0.98;
      }
    });
    const targetScale = hovered ? 1.05 : 1;
    if (Math.abs(m.scale.x - targetScale) > 0.0001) m.scale.setScalar(targetScale);

    if (ownHoverRef.current) {
      reportProjected();
    }
  });

  // Only the biggest planets cast shadows (promt3 item 4).
  const castShadow = data.sizePx >= 120;

  return (
    <group
      ref={seth}
      onPointerOver={(e) => {
        e.stopPropagation();
        ownHoverRef.current = true;
        reportProjected();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        ownHoverRef.current = false;
        onHoverRef.current?.(null);
      }}
    >
      {/* axial tilt wrapper — the equator plane rotates this way */}
      <group rotation={[THREE.MathUtils.degToRad(cfg.axialTilt), 0, 0]}>
        <mesh
          ref={meshRef}
          castShadow={castShadow}
          receiveShadow
          onClick={(e) => {
            if (e.delta > 6) return; // ignore drags
            e.stopPropagation();
            onNavigateRef.current?.(page.id, e.nativeEvent as unknown as { clientX: number; clientY: number });
          }}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
        </mesh>
        {data.hasRings && data.ringTextureUrl && <SaturnRings radius={radius} />}
      </group>

      {/* label stays upright, always faces the camera */}
      <Label position={[0, radius + 26, 0]} text={data.name[language]} />
    </group>
  );
}