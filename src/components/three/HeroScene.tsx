import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import * as Astronomy from "astronomy-engine";
import { REAL_STARS, CONSTELLATION_LINES } from "../../data/realStarCatalog";
import { getRussianName } from "../../data/starNamesRu";
import { getSkyLabel } from "../../data/skyLabelsI18n";
import { useSkyActivation, cachedSatellites } from "../../hooks/useSkyActivation";
import { calculateSatLookAngles } from "../../utils/skyCalculations";

const OBSERVER_LAT = 55.7558; // Moscow
const OBSERVER_LON = 37.6173;
const DOME_RADIUS = 50;
const MAX_SATELLITES = 70;
const MAX_LABELED_SATS = 8;

interface HeroSceneProps {
  language: string;
  ecoMode: boolean;
}

interface SatLabel {
  key: string;
  pos: [number, number, number];
  name: string;
  alt: number;
  az: number;
}

const altAzToVec3 = (altDeg: number, azDeg: number, radius = DOME_RADIUS): THREE.Vector3 => {
  const alt = (altDeg * Math.PI) / 180;
  const az = (azDeg * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(alt) * Math.sin(az),
    radius * Math.sin(alt),
    -radius * Math.cos(alt) * Math.cos(az)
  );
};

const SIDEREAL_DAY_MS = 86164.0905;
const POLE_AXIS = new THREE.Vector3(
  0,
  Math.sin((OBSERVER_LAT * Math.PI) / 180),
  -Math.cos((OBSERVER_LAT * Math.PI) / 180)
);

function useHeroScrollProgress() {
  const progressRef = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      progressRef.current = Math.min(1.2, window.scrollY / window.innerHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progressRef;
}

interface SkyData {
  starPositions: Float32Array;
  starColors: Float32Array;
  starCount: number;
  linePositions: Float32Array;
  lineCount: number;
  planets: { id: string; pos: THREE.Vector3; color: string; name: string }[];
}

function useSkyData(language: string): SkyData | null {
  const [data, setData] = useState<SkyData | null>(null);

  useEffect(() => {
    const now = new Date();
    const observer = new Astronomy.Observer(OBSERVER_LAT, OBSERVER_LON, 0.05);

    const starPositions: number[] = [];
    const starColors: number[] = [];
    const starIdToIndex = new Map<string, number>();

    for (const star of REAL_STARS) {
      try {
        const horiz = Astronomy.Horizon(now, observer, star.ra, star.dec, "normal");
        if (horiz.altitude <= -5) continue;
        const v = altAzToVec3(horiz.altitude, horiz.azimuth);
        starPositions.push(v.x, v.y, v.z);
        starIdToIndex.set(star.id, starPositions.length / 3 - 1);
        const brightness = Math.max(0.35, Math.min(1, 1.15 - star.mag * 0.22));
        const color = new THREE.Color().setHSL(0.6, 0.15, brightness);
        starColors.push(color.r, color.g, color.b);
      } catch {
        // ignore single star
      }
    }

    const linePositions: number[] = [];
    for (const constel of CONSTELLATION_LINES) {
      for (const [id1, id2] of constel.lines) {
        const i1 = starIdToIndex.get(id1);
        const i2 = starIdToIndex.get(id2);
        if (i1 === undefined || i2 === undefined) continue;
        const x1 = starPositions[i1 * 3];
        const y1 = starPositions[i1 * 3 + 1];
        const z1 = starPositions[i1 * 3 + 2];
        const x2 = starPositions[i2 * 3];
        const y2 = starPositions[i2 * 3 + 1];
        const z2 = starPositions[i2 * 3 + 2];
        linePositions.push(x1, y1, z1, x2, y2, z2);
      }
    }

    const planetDefs: { body: Astronomy.Body; id: string; nameRu: string; color: string }[] = [
      { body: Astronomy.Body.Sun, id: "sun", nameRu: getSkyLabel("sun", language), color: "#FEF08A" },
      { body: Astronomy.Body.Moon, id: "moon", nameRu: getSkyLabel("moon", language), color: "#F3F4F6" },
      { body: Astronomy.Body.Venus, id: "venus", nameRu: getSkyLabel("venus", language), color: "#FFFBEB" },
      { body: Astronomy.Body.Mars, id: "mars", nameRu: getSkyLabel("mars", language), color: "#FF6B6B" },
      { body: Astronomy.Body.Jupiter, id: "jupiter", nameRu: getSkyLabel("jupiter", language), color: "#FDE68A" },
      { body: Astronomy.Body.Saturn, id: "saturn", nameRu: getSkyLabel("saturn", language), color: "#FEF08A" },
    ];

    const planets: SkyData["planets"] = [];
    for (const p of planetDefs) {
      try {
        const eq = Astronomy.Equator(p.body, now, observer, true, true);
        const horiz = Astronomy.Horizon(now, observer, eq.ra, eq.dec, "normal");
        if (horiz.altitude > -8) {
          planets.push({ id: p.id, pos: altAzToVec3(horiz.altitude, horiz.azimuth), color: p.color, name: p.nameRu });
        }
      } catch {
        // ignore
      }
    }

    setData({
      starPositions: new Float32Array(starPositions),
      starColors: new Float32Array(starColors),
      starCount: starPositions.length / 3,
      linePositions: new Float32Array(linePositions),
      lineCount: linePositions.length / 3,
      planets,
    });
  }, [language]);

  return data;
}

function MilkyWay() {
  const positions = useMemo(() => {
    const count = 2200;
    const arr = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    const tilt = new THREE.Euler();
    for (let i = 0; i < count; i++) {
      v.set(0, 0, -1);
      tilt.set((Math.random() * 2 - 1) * 0.2, 0, 0);
      v.applyEuler(tilt);
      v.applyEuler(new THREE.Euler(0, Math.random() * Math.PI * 2, 0));
      v.multiplyScalar(DOME_RADIUS * 0.97);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#3B82F6"
        size={0.32}
        sizeAttenuation
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function SatelliteLayer({ language, ecoMode }: { language: string; ecoMode: boolean }) {
  useSkyActivation(false);

  const pointsRef = useRef<THREE.Points>(null);
  const trailRef = useRef<THREE.LineSegments>(null);
  const targetPositions = useRef(new Float32Array(MAX_SATELLITES * 3));
  const currentPositions = useRef(new Float32Array(MAX_SATELLITES * 3));
  const prevPositions = useRef(new Float32Array(MAX_LABELED_SATS * 3));
  const activeCount = useRef(0);
  const initialPoints = useMemo(() => new Float32Array(MAX_SATELLITES * 3).fill(1000), []);
  const [satLabels, setSatLabels] = useState<SatLabel[]>([]);

  useEffect(() => {
    if (ecoMode) return;
    let intervalId: ReturnType<typeof setInterval>;

    const recompute = () => {
      const now = new Date();
      const future = new Date(now.getTime() + 1500);
      const nextTargets = new Float32Array(MAX_SATELLITES * 3);
      const nextActive: SatLabel[] = [];
      let count = 0;
      const sats = cachedSatellites || [];

      const sorted: { index: number; alt: number; az: number }[] = [];
      for (let i = 0; i < sats.length; i++) {
        const sat = sats[i];
        const look = calculateSatLookAngles(sat.satrec, now, OBSERVER_LAT, OBSERVER_LON);
        if (!look || look.altitude < 3) continue;
        sorted.push({ index: i, alt: look.altitude, az: look.azimuth });
      }
      sorted.sort((a, b) => b.alt - a.alt);

      for (const item of sorted) {
        if (count >= MAX_SATELLITES) break;
        const sat = sats[item.index];
        const futureLook = calculateSatLookAngles(sat.satrec, future, OBSERVER_LAT, OBSERVER_LON);
        const v1 = altAzToVec3(item.alt, item.az, DOME_RADIUS * 0.92);
        const v2 = futureLook
          ? altAzToVec3(futureLook.altitude, futureLook.azimuth, DOME_RADIUS * 0.92)
          : v1.clone();
        const pos = v1.clone().lerp(v2, 0.7);
        nextTargets[count * 3] = pos.x;
        nextTargets[count * 3 + 1] = pos.y;
        nextTargets[count * 3 + 2] = pos.z;

        if (nextActive.length < MAX_LABELED_SATS) {
          nextActive.push({
            key: sat.id,
            pos: [pos.x, pos.y, pos.z],
            name: getRussianName(sat.name, language),
            alt: item.alt,
            az: item.az,
          });
        }
        count++;
      }

      targetPositions.current = nextTargets;
      activeCount.current = count;

      if (pointsRef.current) {
        const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        attr.array = new Float32Array(nextTargets);
        attr.needsUpdate = true;
        pointsRef.current.geometry.setDrawRange(0, count);
        (pointsRef.current.material as THREE.PointsMaterial).opacity = count > 0 ? 0.95 : 0;
      }
      setSatLabels(nextActive);
    };

    recompute();
    intervalId = setInterval(recompute, 2000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, ecoMode]);

  // Плавная интерполяция позиций спутников + шлейфы на каждый кадр
  useFrame((state: RootState) => {
    if (!pointsRef.current || ecoMode) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const cur = attr.array as Float32Array;
    const tgt = targetPositions.current;
    const count = activeCount.current;
    for (let i = 0; i < count * 3; i++) {
      cur[i] += (tgt[i] - cur[i]) * 0.14;
    }
    attr.needsUpdate = true;

    if (trailRef.current) {
      const tAttr = trailRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const tArr = tAttr.array as Float32Array;
      const labelCount = Math.min(count, MAX_LABELED_SATS);
      for (let i = 0; i < labelCount; i++) {
        const base = i * 6;
        const pb = i * 3;
        const px = cur[i * 3];
        const py = cur[i * 3 + 1];
        const pz = cur[i * 3 + 2];
        const hasPrev = prevPositions.current[pb] !== 0;
        tArr[base] = hasPrev ? prevPositions.current[pb] : px;
        tArr[base + 1] = hasPrev ? prevPositions.current[pb + 1] : py;
        tArr[base + 2] = hasPrev ? prevPositions.current[pb + 2] : pz;
        tArr[base + 3] = px;
        tArr[base + 4] = py;
        tArr[base + 5] = pz;
        prevPositions.current[pb] = px;
        prevPositions.current[pb + 1] = py;
        prevPositions.current[pb + 2] = pz;
      }
      trailRef.current.geometry.setDrawRange(0, labelCount * 2);
      tAttr.needsUpdate = true;
    }

    state.invalidate();
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[initialPoints, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#FFF7E0"
          size={0.55}
          sizeAttenuation
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(MAX_LABELED_SATS * 6), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#FDE68A" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {satLabels.length > 0 && (
        <group>
          {satLabels.map((s) => (
        <Html key={s.key} position={s.pos} center distanceFactor={46} zIndexRange={[40, 0]}>
          <div
            className="select-none pointer-events-none whitespace-nowrap flex flex-col items-center gap-0.5"
            style={{ opacity: 0.85 }}
          >
            <span className="font-mono text-[9px] tracking-wider font-semibold text-[#FDE68A] drop-shadow">
              {s.name}
            </span>
            <span className="font-mono text-[8px] tracking-widest text-[#8B8F9C]">
              {getSkyLabel("altitude", language)} {s.alt.toFixed(1)}° // {getSkyLabel("az", language)} {s.az.toFixed(0)}°
            </span>
          </div>
        </Html>
          ))}
        </group>
      )}
    </>
  );
}

function CameraRig() {
  const scrollRef = useHeroScrollProgress();
  const startTime = useRef(Date.now());

  useFrame((state: RootState) => {
    const elapsed = Date.now() - startTime.current;
    const siderealAngle = (elapsed / SIDEREAL_DAY_MS) * Math.PI * 2;
    state.camera.rotation.z = -siderealAngle + 0;
    const p = scrollRef.current;
    const tilt = p * -0.12;
    const scale = 1 + p * 0.22;
    state.camera.rotation.x = tilt;
    state.camera.zoom = scale;
    state.camera.updateProjectionMatrix();
    state.invalidate();
  });

  return null;
}

const SceneContents = React.memo(function SceneContents({ language, ecoMode }: HeroSceneProps) {
  const skyData = useSkyData(language);

  return (
    <>
      <CameraRig />
      {skyData && (
        <>
          <points>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[skyData.starPositions, 3]} />
              <bufferAttribute attach="attributes-color" args={[skyData.starColors, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={0.85}
              sizeAttenuation
              vertexColors
              transparent
              opacity={0.92}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[skyData.linePositions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#8B8F9C" transparent opacity={0.14} depthWrite={false} />
          </lineSegments>
          {skyData.planets.map((p) => (
            <mesh key={p.id} position={[p.pos.x, p.pos.y, p.pos.z]}>
              <sphereGeometry args={[0.22, 12, 12]} />
              <meshBasicMaterial color={p.color} transparent opacity={0.9} />
            </mesh>
          ))}
        </>
      )}
      <MilkyWay />
      <SatelliteLayer language={language} ecoMode={ecoMode} />
    </>
  );
});

export default function HeroScene({ language, ecoMode }: HeroSceneProps) {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#0A0A0B]" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop="demand"
        camera={{ position: [0, 0, 0], near: 0.1, far: 120 }}
        gl={{ antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneContents language={language} ecoMode={ecoMode} />
      </Canvas>
    </div>
  );
}
