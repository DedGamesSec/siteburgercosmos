import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { LanguageCode } from "../i18n/languages";
import Sun from "./Sun";
import Orbit from "./Orbit";
import Planet from "./Planet";
import CollisionGuard from "./CollisionGuard";
import UnifiedBackground from "./UnifiedBackground";
import { type HoverPt, type PlanetItem } from "./cosmos/config";

/* ---- Orbiting 3D solar system (React Three Fiber).

   The 7 site planets ride their blue orbit rings exactly like the layout's
   CSS pixels expect: each ring radius `radiusPx` equals the ring div radius
   (radiusPct * ORBIT_SCALE * min(w,h)/2). BODIES are drawn at REAL relative
   sizes (a shadow is a tiny fraction of its orbit ring), so neighbour radius
   sums never reach the ring gaps and collisions are physically impossible.

   Background (promt5 items 2-3): one pure-black backdrop + ONE custom star
   field (UnifiedBackground) — no drei <Stars>, no scene background <color>,
   no double background anywhere. The stars are static in space, always inside
   the 3000 far plane.

   Camera: rotation is LOCKED to a ~±3° envelope around the screenshot corner
   (azimuth 0.22π…0.28π, polar 0.32π…0.35π — the user asked to cut the range
   down to ~10% of the old one), damping 0.05 so it glides but never strays.
   Only zoom (220–1500) and that tiny tilt are available.

   Light (promt5 item 1): one warm PointLight; the Sun's halo is only stacked
   AdditiveBlending shells — NO postprocessing/Bloom. Every planet receives
   AND casts shadows, so eclipses really happen. Under eco-mode / reduced-
   motion the system freezes at its real heliocentric angles. ---- */

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

export default function CosmosScene(props: CosmosSceneProps) {
  const { planets, language, initialAngles, motionless, onNavigate, onHover, onReady } = props;

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

  return (
    <>
      <Canvas
        className="!absolute inset-0"
        style={{ position: "absolute", inset: 0, background: "#000000" }}
        shadows="soft"
        camera={{ position: [760, 610, 760], fov: 45, near: 10, far: 3000 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={() => onHoverRef.current(null)}
        onCreated={(state) => {
          onReadyRef.current?.();
          if (import.meta.env.DEV) (window as unknown as { __cosmosRoot?: unknown }).__cosmosRoot = state;
        }}
      >
        <ambientLight intensity={0.45} />
        <UnifiedBackground />
        <Sun />

        {planets.map((item) => (
          <Orbit key={`orbit-${item.page.id}`} radius={item.radiusPx} />
        ))}

        {planets.map((item) => (
          <Planet
            key={`planet-${item.page.id}`}
            item={item}
            language={language}
            initialAngleDeg={initialAngles[item.page.id] ?? 0}
            onHoverRef={onHoverRef}
            onNavigateRef={onNavigateRef}
            onGroup={onGroup.current}
          />
        ))}

        <OrbitControls
          makeDefault
          enableRotate
          enableZoom
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.2}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.35}
          minAzimuthAngle={Math.PI * 0.22}
          maxAzimuthAngle={Math.PI * 0.28}
          minDistance={220}
          maxDistance={1500}
          target={[0, 0, 0]}
          enabled={!motionless}
        />

        <CollisionGuard planets={planets} registry={groupRegistry} />
      </Canvas>
    </>
  );
}