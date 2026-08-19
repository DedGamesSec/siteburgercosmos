import { useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, Stars, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { LanguageCode } from "../i18n/languages";
import type { PlanetData } from "./ExplorePagesSection";
import { checkCollisions, type Collidable } from "../utils/collision";

/* ---- Orbiting 3D solar system (React Three Fiber).

   The 7 site planets ride their blue orbit rings exactly like the layout's
   CSS pixels expect: each ring radius `radiusPx` equals the ring div radius
   in the old 2D layout (radiusPct * ORBIT_SCALE * min(w,h)/2), and spheres
   are `sizePx` wide, so planet <-> ring alignment survives at every size.

   Camera: perspective (fov 50), initial position above the orbital plane
   looking at the Sun, drag/zoom/pan via OrbitControls.

   Interaction stays site-native: hovering a planet shows the existing info
   card (projected screen position is reported to the parent every frame
   while hovered, so the card tracks the moving planet); clicking navigates
   to the planet's page. Under eco-mode / reduced-motion the whole system
   freezes at its real heliocentric angles. ---- */

type PageRef = { id: string; labelKey: string };
type PlanetItem = { page: PageRef; data: PlanetData; radiusPx: number };
type HoverPt = { x: number; y: number };

type CosmosSceneProps = {
  planets: PlanetItem[];
  language: LanguageCode;
  initialAngles: Record<string, number>;
  motionless: boolean;
  onNavigate: (id: string, e: { clientX: number; clientY: number }) => void;
  /** null clears the hover; pt is the planet centre in container-relative px. */
  onHover: (pageId: string | null, pt?: HoverPt) => void;
  onReady?: () => void;
};

/* Per-planet kinematics (7 planets, no Earth):
   · orbitSpeed — RELATIVE orbital cadence (Mercury fastest, Neptune slowest,
     same ratios the design brief uses: Mercury 4.15 … Neptune 0.006);
   · rotationSpeed — relative axial spin (sign = retrograde for Venus/Uranus);
   · axialTilt — real inclination (°), Uranus on its side, Venus upside-down;
   · eccentricity — slight ellipticity of the orbit (Mercury most obvious). */
const PLANET_MOTION: Record<string, { orbitSpeed: number; rotationSpeed: number; axialTilt: number; eccentricity: number }> = {
  download: { orbitSpeed: 4.15, rotationSpeed: 0.005, axialTilt: 0.03, eccentricity: 0.2 },
  comparison: { orbitSpeed: 1.62, rotationSpeed: -0.002, axialTilt: 177.4, eccentricity: 0.007 },
  roadmap: { orbitSpeed: 0.53, rotationSpeed: 0.009, axialTilt: 25.2, eccentricity: 0.09 },
  tech: { orbitSpeed: 0.084, rotationSpeed: 0.02, axialTilt: 3.1, eccentricity: 0.05 },
  about: { orbitSpeed: 0.034, rotationSpeed: 0.018, axialTilt: 26.7, eccentricity: 0.056 },
  news: { orbitSpeed: 0.012, rotationSpeed: 0.011, axialTilt: 97.8, eccentricity: 0.046 },
  "how-it-works": { orbitSpeed: 0.006, rotationSpeed: 0.012, axialTilt: 28.3, eccentricity: 0.011 },
};

/* Mercury completes one orbit in ORBIT_CYCLE seconds at 1.0×; the rest scale
   down from there keeping the real ordering. */
const ORBIT_CYCLE = 60;

const SUN_RADIUS = 44;

/* Procedural granulated sun surface (flat, uniformly warm — the dark limb
   stays on the glow shells below, not in this texture). */
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
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildLabelTexture(name: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#F5F5F0";
  ctx.fillText(name, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Upright planet label — a camera-facing sprite with a canvas-drawn texture.
   (drei <Text> is not used: its text mesh runs a Blob Web Worker, which this
   site's CSP blocks, and a failed worker hangs the whole R3F frame loop.) */
function Label({ text, position }: { text: string; position: [number, number, number] }) {
  const map = useMemo(() => buildLabelTexture(text), [text]);
  return (
    <sprite position={position} scale={[110, 27.5, 1]}>
      <spriteMaterial map={map} transparent depthTest={false} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

function Sun() {
  const map = useMemo(buildSunTexture, []);
  return (
    <group>
      <pointLight intensity={2.4} decay={0} castShadow />
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.1, 32, 32]} />
        <meshBasicMaterial color="#ffb23e" transparent opacity={0.16} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.28, 32, 32]} />
        <meshBasicMaterial color="#ff7a1f" transparent opacity={0.07} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* Blue orbit ring — an ellipse matching the planet's eccentricity exactly. */
function Orbit({ radius, eccentricity }: { radius: number; eccentricity: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 160;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = (radius * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(angle));
      pts.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
    }
    return pts;
  }, [radius, eccentricity]);

  return <Line points={points} color="#0088ff" transparent opacity={0.35} />;
}

function SaturnRing({ scale }: { scale: number }) {
  const map = useTexture(`${import.meta.env.BASE_URL}textures/planets/2k_saturn_ring_alpha.png`);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[scale * 3.1, scale * 3.1]} />
      <meshBasicMaterial map={map} transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Planet({
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
  const texture = useTexture(`${import.meta.env.BASE_URL}${data.textureUrlHi ?? data.textureUrl}`);

  const seth = (g: THREE.Group | null) => {
    groupRef.current = g;
    onGroup(page.id, g);
  };

  // Hover state is kept on refs (there is no re-render here — the parent owns
  // the card/highlight states); the frame loop reads them directly.
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

    angleRef.current += orbitRate * delta * timeScale;
    const e = cfg.eccentricity;
    const r = (radiusPx * (1 - e * e)) / (1 + e * Math.cos(angleRef.current));
    g.position.set(Math.cos(angleRef.current) * r, 0, Math.sin(angleRef.current) * r);

    // Static axial spin lives on the mesh, the orbit motion on the group.
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
        <mesh ref={meshRef} castShadow receiveShadow onClick={(e) => {
          if (e.delta > 6) return; // ignore drags
          e.stopPropagation();
          onNavigateRef.current?.(page.id, e.nativeEvent as unknown as { clientX: number; clientY: number });
        }}>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
        </mesh>
        {data.hasRings && data.ringTextureUrl && <SaturnRing scale={radius} />}
      </group>

      {/* label stays upright, always faces the camera */}
      <Label position={[0, radius + 26, 0]} text={data.name[language]} />
    </group>
  );
}

/* Camera + viewport are captured in the frame loop (see Planet) so both the
   event handlers and the hover tracker always project against the live view. */

/* Collision watchdog: every frame snapshots the orbit nodes and probes pairs.
   Hoisted (not re-created on each parent render) so the R3F subtree never
   remounts when the speed slider changes. */
function CollisionWatch({ planets, registry }: { planets: PlanetItem[]; registry: MutableRefObject<Map<string, THREE.Group>> }) {
  useFrame(() => {
    const ready: Collidable[] = [];
    for (const { page, data } of planets) {
      const mesh = registry.current.get(page.id);
      if (mesh) ready.push({ name: data.name.en, radius: data.sizePx / 2, mesh });
    }
    if (ready.length === planets.length) checkCollisions(ready);
  });
  return null;
}

export default function CosmosScene(props: CosmosSceneProps) {
  const { planets, language, initialAngles, motionless, onNavigate, onHover, onReady } = props;
  const [timeScale, setTimeScale] = useState(1);

  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const groupRegistry = useRef(new Map<string, THREE.Group>());
  const onGroup = useRef((id: string, g: THREE.Group | null) => {
    if (g) groupRegistry.current.set(id, g);
    else groupRegistry.current.delete(id);
  });

  const effectiveSpeed = motionless ? 0 : timeScale;

  return (
    <>
      {!motionless && (
        <div className="absolute top-3 left-3 z-40 flex flex-col gap-2 rounded-xl border border-[#3B82F6]/20 bg-black/70 backdrop-blur-md px-3 py-2 font-mono text-[10px] text-[#F5F5F0] pointer-events-auto select-none">
          <span className="tracking-[0.2em] text-[#3B82F6]">SUN SYSTEM SIM</span>
          <label className="flex items-center gap-2">
            <span className="text-gray-400">speed</span>
            <input
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              className="w-28 accent-[#3B82F6]"
            />
            <span className="w-10 text-right tabular-nums">{timeScale.toFixed(1)}x</span>
          </label>
        </div>
      )}

      <Canvas
        className="!absolute inset-0"
        style={{ position: "absolute", inset: 0 }}
        camera={{ position: [0, 0, 220], fov: 50, near: 10, far: 4000 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power", preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={() => onHoverRef.current(null)}
        onCreated={() => onReadyRef.current?.()}
      >
        <ambientLight intensity={0.45} />
        <Sun />
        {planets.map((item) => {
          const cfg = PLANET_MOTION[item.page.id];
          return (
            <Orbit
              key={`orbit-${item.page.id}`}
              radius={item.radiusPx}
              eccentricity={cfg.eccentricity}
            />
          );
        })}
        {planets.map((item) => (
          <Planet
            key={`planet-${item.page.id}`}
            item={item}
            language={language}
            initialAngleDeg={initialAngles[item.page.id] ?? 0}
            timeScale={effectiveSpeed}
            onHoverRef={onHoverRef}
            onNavigateRef={onNavigateRef}
            onGroup={onGroup.current}
          />
        ))}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.06}
          enabled={!motionless}
          minDistance={180}
          maxDistance={2200}
          maxPolarAngle={Math.PI / 2.05}
        />
        <CollisionWatch planets={planets} registry={groupRegistry} />
      </Canvas>
    </>
  );
}