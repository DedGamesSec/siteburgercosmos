import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
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
   (radiusPct * ORBIT_SCALE * min(w,h)/2), and spheres are `sizePx` wide, so
   planet <-> ring alignment survives at every container size.

   Camera (promt3 item 1): fixed above-side view on the Sun — a handsome
   isometric-ish corner. Rotation and panning are locked; only zoom is
   available, so the composition can't be spun out of shape.

   Interaction stays site-native: hovering a planet shows the existing info
   card (projected screen position is reported to the parent every frame
   while hovered, so the card tracks the moving planet); clicking navigates
   to the planet's page. Under eco-mode / reduced-motion the whole system
   freezes at its real heliocentric angles. ---- */

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
        shadows
        camera={{ position: [760, 610, 760], fov: 45, near: 10, far: 4000 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={() => onHoverRef.current(null)}
        onCreated={(state) => {
          onReadyRef.current?.();
          if (import.meta.env.DEV) (window as unknown as { __cosmosRoot?: unknown }).__cosmosRoot = state;
        }}
      >
        <ambientLight intensity={0.45} />
        <Stars radius={400} depth={60} count={2000} factor={4} saturation={0} fade speed={0.6} />

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
            timeScale={effectiveSpeed}
            onHoverRef={onHoverRef}
            onNavigateRef={onNavigateRef}
            onGroup={onGroup.current}
          />
        ))}

        <OrbitControls
          makeDefault
          enableRotate={false}
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          target={[0, 0, 0]}
          minDistance={600}
          maxDistance={3200}
          enabled={!motionless}
        />

        <CollisionGuard planets={planets} registry={groupRegistry} />
      </Canvas>
    </>
  );
}