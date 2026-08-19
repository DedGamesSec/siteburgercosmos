import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { LanguageCode } from "../i18n/languages";
import Sun from "./Sun";
import Orbit from "./Orbit";
import Planet from "./Planet";
import CollisionGuard from "./CollisionGuard";
import { type HoverPt, type PlanetItem } from "./cosmos/config";

/* ---- Orbiting 3D solar system (React Three Fiber).

   The 7 site planets ride their blue orbit rings exactly like the layout's
   CSS pixels expect: each ring radius `radiusPx` equals the ring div radius
   (radiusPct * ORBIT_SCALE * min(w,h)/2). BODIES are drawn at REAL relative
   sizes (a shadow is a tiny fraction of its orbit ring), so neighbour radius
   sums never reach the ring gaps and collisions are physically impossible.

   Camera (promt4 item 1): a smooth, damped, LOW-SPEED rotation inside a strict
   envelope — polar 27°…81°, azimuth ±54°, zoom between 220 and 1500 — so the
   view always stays the same handsome isometric-ish corner as the screenshots.
   Under eco-mode / reduced-motion the whole system freezes at its real
   heliocentric angles (rotation+zoom disabled).

   Light: one warm PointLight from the Sun; every planet receives AND casts
   shadows, so eclipses really happen (promt4 item 8). Post FX: selective
   Bloom — only the Sun's layer-1 bodies blow out (promt4 item 7). ---- */

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
        style={{ position: "absolute", inset: 0 }}
        shadows="soft"
        camera={{ position: [760, 610, 760], fov: 45, near: 10, far: 4000 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={() => onHoverRef.current(null)}
        onCreated={(state) => {
          // Select the Sun layer so the bright bodies render in the main pass
          // too (the Bloom pass then only makes them glow, promt4 item 7).
          state.camera.layers.enable(1);
          onReadyRef.current?.();
          if (import.meta.env.DEV) (window as unknown as { __cosmosRoot?: unknown }).__cosmosRoot = state;
        }}
      >
        <ambientLight intensity={0.45} />
        {/* Stars locked to the scene, far beyond the outermost ring (promt4
            item 4). `speed` 0 keeps the shell fixed in space — drei's speed
            would SPIN the star cloud, which the brief explicitly forbids. */}
        <Stars radius={800} depth={100} count={3000} factor={6} saturation={0} fade speed={0} />

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
          rotateSpeed={0.3}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.45}
          minAzimuthAngle={-Math.PI * 0.3}
          maxAzimuthAngle={Math.PI * 0.3}
          minDistance={220}
          maxDistance={1500}
          target={[0, 0, 0]}
          enabled={!motionless}
        />

        <CollisionGuard planets={planets} registry={groupRegistry} />

        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.6} luminanceSmoothing={0.2} radius={0.8} />
        </EffectComposer>
      </Canvas>
    </>
  );
}