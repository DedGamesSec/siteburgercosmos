import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
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

   Background: the canvas is deliberately TRANSPARENT — the site's own
   starfield (already present across the page edges) shows through instead of
   a local star/colour layer, so there is no double background on this block.

   Camera: rotation is LOCKED to a ~±3° envelope around the screenshot corner
   (azimuth 0.22π…0.28π, polar 0.32π…0.35π), damping 0.05 so it glides but
   never strays. Only zoom (220–1500) and that tiny tilt are available.

   Light (shadow iterations): one warm PointLight from the Sun (decay 2) is
   the main light — real eclipse shadows, soft edges (shadow-radius 4). A very
   low hemisphere fill (0.15) lifts the night-side just enough so it reads,
   never flattening the shadow contrast. Every planet receives AND casts
   shadows. Under eco-mode / reduced-motion the system freezes at its real
   heliocentric angles. ---- */

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
        camera={{ position: [760, 610, 760], fov: 45, near: 10, far: 3000 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={() => onHoverRef.current(null)}
        onCreated={(state) => {
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
          onReadyRef.current?.();
          if (import.meta.env.DEV) (window as unknown as { __cosmosRoot?: unknown }).__cosmosRoot = state;
        }}
      >
        {/* warm hemisphere fill — warm above, cool below for rim separation */}
        <hemisphereLight args={[0xffd98a, 0x0a0a2e, 0.08]} position={[0, 100, 0]} />
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
          rotateSpeed={0.28}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.35}
          minAzimuthAngle={Math.PI * -0.25}
          maxAzimuthAngle={Math.PI * 0.75}
          minDistance={686}
          maxDistance={1400}
          target={[0, 0, 0]}
          enabled={!motionless}
        />

        <CollisionGuard planets={planets} registry={groupRegistry} />

        <EffectComposer>
          <Bloom
            intensity={0.55}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.6}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </>
  );
}