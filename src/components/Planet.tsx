import { useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { LanguageCode } from "../i18n/languages";
import { useTexture } from "../hooks/useTexture";
import {
  ORBIT_CYCLE,
  PLANET_MOTION,
  PLANET_VISUAL_RADIUS,
  type HoverPt,
  type PlanetItem,
} from "./cosmos/config";
import Label from "./Label";
import SaturnRings from "./Saturn";

/* A single orbiting planet:
   · perfect circle on its blue ring (no eccentricity — promt4 item 3);
   · real axial tilt, continuous axial spin (retrograde for Venus/Uranus);
   · a REALISTIC visual radius (PLANET_VISUAL_RADIUS — a shadow is a tiny
     fraction of its orbit, so neighbour sums never reach the ring gaps and
     collisions are physically impossible) plus a big invisible hover shell
     (data.sizePx) so the tiny bodies stay easy to aim at;
   · one shared light from the Sun, so every planet receives AND casts shadows
     (promt4 item 8 — eclipses when one crosses in front of another);
   · hover raycasts the shell and reports the projected screen position so
     the parent info card tracks the moving planet; click navigates;
   · gentle dim/scale of the neighbours and an upright canvas-label. */
export default function Planet({
  item,
  language,
  initialAngleDeg,
  onHoverRef,
  onNavigateRef,
  onGroup,
}: {
  item: PlanetItem;
  language: LanguageCode;
  initialAngleDeg: number;
  onHoverRef: MutableRefObject<((pageId: string | null, pt?: HoverPt) => void) | null>;
  onNavigateRef: MutableRefObject<((id: string, e: { clientX: number; clientY: number }) => void) | null>;
  onGroup: (id: string, g: THREE.Group | null) => void;
}) {
  const { page, data, radiusPx } = item;
  const cfg = PLANET_MOTION[page.id];
  const visualRadius = PLANET_VISUAL_RADIUS[page.id] ?? Math.max(8, data.sizePx / 2);
  const hoverRadius = data.sizePx / 2;
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
    angleRef.current += orbitRate * delta;
    g.position.set(Math.cos(angleRef.current) * radiusPx, 0, Math.sin(angleRef.current) * radiusPx);

    // Axial spin lives on the mesh, orbit motion on the group.
    m.rotation.y += cfg.rotationSpeed * delta * 60;

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
    const targetScale = hovered ? 1.1 : 1;
    if (Math.abs(m.scale.x - targetScale) > 0.0001) m.scale.setScalar(targetScale);

    if (ownHoverRef.current) {
      reportProjected();
    }
  });

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
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[visualRadius, 32, 32]} />
          <meshStandardMaterial
            map={texture}
            color={0xffffff}
            roughness={0.85}
            metalness={0.0}
          />
        </mesh>
        {/* rim-подсветка тёмной стороны — отдельный меш, не трогает основной материал */}
        <mesh scale={1.03} raycast={() => null}>
          <sphereGeometry args={[visualRadius, 32, 32]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            side={THREE.BackSide}
            uniforms={{
              rimColor: { value: new THREE.Color(0x3a4a6a) },
              rimPower: { value: 2.5 },
              rimStrength: { value: 0.35 },
            }}
            vertexShader={`
              varying vec3 vNormal;
              varying vec3 vViewDir;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewDir = normalize(-mvPosition.xyz);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              uniform vec3 rimColor;
              uniform float rimPower;
              uniform float rimStrength;
              varying vec3 vNormal;
              varying vec3 vViewDir;
              void main() {
                float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
                rim = pow(rim, rimPower) * rimStrength;
                gl_FragColor = vec4(rimColor, rim);
              }
            `}
          />
        </mesh>
        {data.hasRings && data.ringTextureUrl && <SaturnRings radius={visualRadius} />}
      </group>

      {/* invisible hover shell — wide, occludes nothing, receives the rays */}
      <mesh
        castShadow={false}
        receiveShadow={false}
        renderOrder={-1}
      >
        <sphereGeometry args={[hoverRadius, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* label stays upright, always faces the camera */}
      <Label position={[0, visualRadius + 24, 0]} text={data.name[language]} />
    </group>
  );
}