import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as Astronomy from "astronomy-engine";
import { REAL_STARS, CONSTELLATION_LINES, type RealStar } from "../../data/realStarCatalog";
import { getRussianName } from "../../data/starNamesRu";
import { getSkyLabel, type SkyLabels } from "../../data/skyLabelsI18n";
import {
  SMALL_BODIES,
  calculateSmallBodyRaDec,
  calculateSatLookAngles,
  getLiveZenithConstellationStatus,
} from "../../utils/skyCalculations";
import { useSkyActivation, cachedSatellites, cachedSmallBodies } from "../../hooks/useSkyActivation";

const OBSERVER_LAT = 55.7558; // Moscow
const OBSERVER_LON = 37.6173;
const DOME_RADIUS = 60;
const MAX_SATELLITES = 70;
const MAX_TRAIL_POINTS = 6;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const SIDEREAL_DAY_MS = 86164.0905;
// Celestial pole direction for Moscow: azimuth 0 (north), altitude = latitude.
const POLE_AXIS = new THREE.Vector3(
  0,
  Math.sin(OBSERVER_LAT * DEG2RAD),
  -Math.cos(OBSERVER_LAT * DEG2RAD)
).normalize();

interface NetworkBackground3DProps {
  zoomFactor?: number;
  warpProgress?: number;
  isEcoMode?: boolean;
  ecoMode?: boolean;
  onSkyStatusChange?: (status: string) => void;
  language?: string;
}

interface ProjectedObject {
  id: string;
  type: "STAR" | "PLANET" | "SATELLITE" | "COMET" | "ASTEROID";
  x: number;
  y: number;
  size: number;
  titleRu: string;
  subtitleRu?: string;
  techInfo?: string;
  constellationCode?: string;
}

// alt/az (deg) -> point on the celestial sphere around the observer:
// az=0 (north) -> -Z, alt=90 (zenith) -> +Y, az=90 (east) -> +X
function altAzToVec3(altDeg: number, azDeg: number, radius = DOME_RADIUS): THREE.Vector3 {
  const alt = altDeg * DEG2RAD;
  const az = azDeg * DEG2RAD;
  return new THREE.Vector3(
    radius * Math.cos(alt) * Math.sin(az),
    radius * Math.sin(alt),
    -radius * Math.cos(alt) * Math.cos(az)
  );
}

interface StarPoint {
  id: string;
  nameEn: string;
  mag: number;
  constellationCode?: string;
  pos: THREE.Vector3;
}

interface PlanetPoint {
  id: keyof SkyLabels;
  pos: THREE.Vector3;
  color: string;
  nameRu: string;
  alt: number;
}

interface SmallBodyPoint {
  id: string;
  nameRu: string;
  type: "COMET" | "ASTEROID";
  pos: THREE.Vector3;
  alt: number;
}

interface SkyData {
  stars: StarPoint[];
  starPositions: Float32Array;
  starColors: Float32Array;
  linePositions: Float32Array;
  planets: PlanetPoint[];
  smallBodies: SmallBodyPoint[];
  milkyWayPositions: Float32Array;
  milkyWayColors: Float32Array;
}

const PLANET_DEFS: { body: Astronomy.Body; id: keyof SkyLabels; color: string }[] = [
  { body: Astronomy.Body.Sun, id: "sun", color: "#FEF08A" },
  { body: Astronomy.Body.Moon, id: "moon", color: "#F3F4F6" },
  { body: Astronomy.Body.Venus, id: "venus", color: "#FFFBEB" },
  { body: Astronomy.Body.Mars, id: "mars", color: "#FF6B6B" },
  { body: Astronomy.Body.Jupiter, id: "jupiter", color: "#FDE68A" },
  { body: Astronomy.Body.Saturn, id: "saturn", color: "#FEF08A" },
];

function useSkyData(language: string): SkyData | null {
  const [data, setData] = useState<SkyData | null>(null);

  useEffect(() => {
    const now = new Date();
    const observer = new Astronomy.Observer(OBSERVER_LAT, OBSERVER_LON, 0.05);

    const stars: StarPoint[] = [];
    const starPositions: number[] = [];
    const starColors: number[] = [];
    const starIdToIndex = new Map<string, number>();

    for (const star of REAL_STARS) {
      try {
        const horiz = Astronomy.Horizon(now, observer, star.ra, star.dec, "normal");
        if (horiz.altitude <= -15) continue;
        // Slight radius jitter gives a subtle depth parallax as the dome rotates.
        const radius = DOME_RADIUS * (0.94 + Math.random() * 0.06);
        const pos = altAzToVec3(horiz.altitude, horiz.azimuth, radius);
        stars.push({
          id: star.id,
          nameEn: star.nameEn,
          mag: star.mag,
          constellationCode: star.constellationCode,
          pos,
        });
        starPositions.push(pos.x, pos.y, pos.z);
        starIdToIndex.set(star.id, starPositions.length / 3 - 1);
        const brightness = Math.max(0.35, Math.min(1, 1.15 - star.mag * 0.22));
        const color = new THREE.Color().setHSL(0.6, 0.18, brightness);
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
        linePositions.push(
          starPositions[i1 * 3], starPositions[i1 * 3 + 1], starPositions[i1 * 3 + 2],
          starPositions[i2 * 3], starPositions[i2 * 3 + 1], starPositions[i2 * 3 + 2]
        );
      }
    }

    const planets: PlanetPoint[] = [];
    for (const p of PLANET_DEFS) {
      try {
        const eq = Astronomy.Equator(p.body, now, observer, true, true);
        const horiz = Astronomy.Horizon(now, observer, eq.ra, eq.dec, "normal");
        if (horiz.altitude > -10) {
          planets.push({
            id: p.id,
            pos: altAzToVec3(horiz.altitude, horiz.azimuth),
            color: p.color,
            nameRu: `${getSkyLabel(p.id, language)} // ${getSkyLabel((p.id + "Desc") as keyof SkyLabels, language)}`,
            alt: horiz.altitude,
          });
        }
      } catch {
        // ignore
      }
    }

    const smallBodies: SmallBodyPoint[] = [];
    const bodiesToUse = cachedSmallBodies && cachedSmallBodies.length > 0 ? cachedSmallBodies : SMALL_BODIES;
    for (const sb of bodiesToUse) {
      try {
        const eq = calculateSmallBodyRaDec(sb, now);
        const horiz = Astronomy.Horizon(now, observer, eq.ra, eq.dec, "normal");
        if (horiz.altitude > -8) {
          smallBodies.push({
            id: sb.id,
            nameRu: `${getRussianName(sb.nameEn, language)} // ${getSkyLabel(sb.type === "COMET" ? "comet" : "asteroid", language)}`,
            type: sb.type,
            pos: altAzToVec3(horiz.altitude, horiz.azimuth),
            alt: horiz.altitude,
          });
        }
      } catch {
        // ignore
      }
    }

    // Milky Way band along the galactic plane (J2000 equatorial transformation)
    const MILKYWAY_COUNT = 2600;
    const mwPositions = new Float32Array(MILKYWAY_COUNT * 3);
    const mwColors = new Float32Array(MILKYWAY_COUNT * 3);
    const alphaNGP = 192.8595 * DEG2RAD;
    const decNGP = 27.1284 * DEG2RAD;
    const lonNGP = 122.932 * DEG2RAD;
    const tempColor = new THREE.Color("#FFFFFF");
    for (let i = 0; i < MILKYWAY_COUNT; i++) {
      const lon = Math.random() * Math.PI * 2;
      let lat = (Math.random() * 2 - 1) * 0.42;
      lat *= Math.sign(lat) * Math.abs(lat); // bias toward the plane
      const sinDec = Math.sin(lat) * Math.sin(decNGP) + Math.cos(lat) * Math.cos(decNGP) * Math.sin(lon - lonNGP);
      const dec = Math.asin(Math.min(1, Math.max(-1, sinDec)));
      const cosDec = Math.cos(dec);
      const cosRaDiff = (Math.cos(lat) * Math.cos(lon - lonNGP)) / cosDec;
      const sinRaDiff = (Math.cos(lat) * Math.sin(decNGP) * Math.sin(lon - lonNGP) - Math.sin(lat) * Math.cos(decNGP)) / cosDec;
      const raDiff = Math.atan2(sinRaDiff, cosRaDiff);
      const raHours = (((alphaNGP + raDiff) * RAD2DEG) % 360 + 360) % 360 / 15;
      const decDeg = dec * RAD2DEG;
      try {
        const horiz = Astronomy.Horizon(now, observer, raHours, decDeg, "normal");
        if (horiz.altitude > -8) {
          const pos = altAzToVec3(horiz.altitude, horiz.azimuth, DOME_RADIUS * 0.97);
          mwPositions[i * 3] = pos.x;
          mwPositions[i * 3 + 1] = pos.y;
          mwPositions[i * 3 + 2] = pos.z;
          const strength = Math.max(0, 1 - Math.abs(lat) / 0.42);
          tempColor.set("#9DB8FF").multiplyScalar(0.15 + strength * 0.5);
          mwColors[i * 3] = tempColor.r;
          mwColors[i * 3 + 1] = tempColor.g;
          mwColors[i * 3 + 2] = tempColor.b;
        } else {
          // hide below horizon: park the point away from the camera with zero brightness
          mwPositions[i * 3] = 0;
          mwPositions[i * 3 + 1] = DOME_RADIUS;
          mwPositions[i * 3 + 2] = 0;
          mwColors[i * 3] = 0;
          mwColors[i * 3 + 1] = 0;
          mwColors[i * 3 + 2] = 0;
        }
      } catch {
        // ignore
      }
    }

    setData({
      stars,
      starPositions: new Float32Array(starPositions),
      starColors: new Float32Array(starColors),
      linePositions: new Float32Array(linePositions),
      planets,
      smallBodies,
      milkyWayPositions: mwPositions,
      milkyWayColors: mwColors,
    });
  }, [language]);

  return data;
}

function CameraRig({ fov }: { fov: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    camera.rotation.set(0.55, 0, 0); // tilt the view up toward the sky dome
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [fov, camera]);
  return null;
}

/**
 * Renders the celestial sphere as a 3D dome around the camera and publishes
 * screen-projected objects every frame for the hover tooltip system.
 */
function SkyObjects({
  skyData,
  language,
  onProjected,
}: {
  skyData: SkyData;
  language: string;
  onProjected: (objects: ProjectedObject[]) => void;
}) {
  const { camera, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const rotQuat = useRef(new THREE.Quaternion());
  const startTime = useRef(Date.now());
  const projector = useRef(new THREE.Vector3());

  // Satellite dynamic buffers (mutated in place each frame)
  const satTargets = useRef(new Float32Array(MAX_SATELLITES * 3));
  const satCurrent = useRef(new Float32Array(MAX_SATELLITES * 3));
  const satActive = useRef(0);
  const satNames = useRef<string[]>([]);
  const satAltAz = useRef<{ alt: number; az: number }[]>([]);
  const satTrails = useRef<THREE.Vector3[][]>([]);
  const satGeomRef = useRef<THREE.BufferGeometry>(null);
  const trailGeomRef = useRef<THREE.BufferGeometry>(null);
  const trailPts = useRef(new Float32Array(MAX_SATELLITES * MAX_TRAIL_POINTS * 3));
  const trailCount = useRef(0);
  const initDone = useRef(false);

  useSkyActivation(false);

  // Recomputed satellites from cached TLE every 2.5s
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const recompute = () => {
      const now = new Date();
      const future = new Date(now.getTime() + 2500);
      const sats = cachedSatellites || [];
      const visible: { index: number; alt: number; az: number }[] = [];
      for (let i = 0; i < sats.length; i++) {
        const look = calculateSatLookAngles(sats[i].satrec, now, OBSERVER_LAT, OBSERVER_LON);
        if (look && look.altitude > 3) {
          visible.push({ index: i, alt: look.altitude, az: look.azimuth });
        }
      }
      visible.sort((a, b) => b.alt - a.alt);

      const nextTargets = new Float32Array(MAX_SATELLITES * 3);
      const nextNames: string[] = [];
      const nextAltAz: { alt: number; az: number }[] = [];
      let count = 0;
      for (const item of visible) {
        if (count >= MAX_SATELLITES) break;
        const sat = sats[item.index];
        const futureLook = calculateSatLookAngles(sat.satrec, future, OBSERVER_LAT, OBSERVER_LON);
        const v1 = altAzToVec3(item.alt, item.az, DOME_RADIUS * 0.92);
        const v2 = futureLook ? altAzToVec3(futureLook.altitude, futureLook.azimuth, DOME_RADIUS * 0.92) : v1.clone();
        const pos = v1.lerp(v2, 0.7);
        nextTargets[count * 3] = pos.x;
        nextTargets[count * 3 + 1] = pos.y;
        nextTargets[count * 3 + 2] = pos.z;
        nextNames.push(getRussianName(sat.name, language));
        nextAltAz.push({ alt: item.alt, az: item.az });
        count++;
      }

      satTargets.current = nextTargets;
      satActive.current = count;
      satNames.current = nextNames;
      satAltAz.current = nextAltAz;

      if (!initDone.current) {
        satCurrent.current.set(nextTargets);
        initDone.current = true;
      }
    };
    recompute();
    interval = setInterval(recompute, 2500);
    return () => clearInterval(interval);
  }, [language]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    // Sidereal rotation around the celestial pole (smooth diurnal motion)
    const elapsed = Date.now() - startTime.current;
    const angle = (elapsed / SIDEREAL_DAY_MS) * Math.PI * 2;
    rotQuat.current.setFromAxisAngle(POLE_AXIS, angle);
    group.quaternion.copy(rotQuat.current);

    // Interpolate satellite positions
    const cur = satCurrent.current;
    const tgt = satTargets.current;
    const count = satActive.current;
    for (let i = 0; i < count * 3; i++) {
      cur[i] += (tgt[i] - cur[i]) * 0.12;
    }

    // Update trails buffer
    let tp = 0;
    for (let i = 0; i < count; i++) {
      const trail = satTrails.current[i];
      if (!trail) continue;
      trail.push(new THREE.Vector3(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]));
      if (trail.length > MAX_TRAIL_POINTS) trail.shift();
      for (const p of trail) {
        trailPts.current[tp++] = p.x;
        trailPts.current[tp++] = p.y;
        trailPts.current[tp++] = p.z;
      }
    }
    trailCount.current = tp / 3;
    if (trailGeomRef.current) {
      const attr = trailGeomRef.current.attributes.position as THREE.BufferAttribute | undefined;
      if (attr) attr.needsUpdate = true;
      trailGeomRef.current.setDrawRange(0, trailCount.current);
    }
    if (satGeomRef.current) {
      const attr = satGeomRef.current.attributes.position as THREE.BufferAttribute | undefined;
      if (attr) attr.needsUpdate = true;
      satGeomRef.current.setDrawRange(0, count);
    }

    // Project interactive objects to screen coordinates for hover tooltips
    const objects: ProjectedObject[] = [];
    const screenW = size.width;
    const screenH = size.height;

    const push = (
      id: string,
      type: ProjectedObject["type"],
      pos: THREE.Vector3,
      sizePx: number,
      titleRu: string,
      subtitleRu?: string,
      techInfo?: string,
      constellationCode?: string
    ) => {
      projector.current.copy(pos).applyQuaternion(group.quaternion).project(camera);
      if (projector.current.z > 1 || projector.current.z < -1) return;
      objects.push({
        id,
        type,
        x: (projector.current.x * 0.5 + 0.5) * screenW,
        y: (-projector.current.y * 0.5 + 0.5) * screenH,
        size: sizePx,
        titleRu,
        subtitleRu,
        techInfo,
        constellationCode,
      });
    };

    for (const star of skyData.stars) {
      push(
        star.id,
        "STAR",
        star.pos,
        Math.max(7, Math.min(15, (2.7 - star.mag * 0.42) * 4)),
        getRussianName(star.nameEn || star.id, language),
        star.constellationCode
          ? `${getSkyLabel("constellation", language)}: ${getRussianName(star.constellationCode, language) || star.constellationCode}`
          : undefined,
        `${getSkyLabel("magnitude", language)}: ${star.mag.toFixed(2)}m`,
        star.constellationCode
      );
    }

    for (const p of skyData.planets) {
      push(
        p.id,
        "PLANET",
        p.pos,
        11,
        p.nameRu,
        undefined,
        `${getSkyLabel("altitude", language)}: ${p.alt.toFixed(1)}°`
      );
    }

    for (const sb of skyData.smallBodies) {
      push(
        sb.id,
        sb.type,
        sb.pos,
        8,
        sb.nameRu,
        undefined,
        `${getSkyLabel("keplerianOrbitAlt", language)}: ${sb.alt.toFixed(1)}°`
      );
    }

    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]);
      const altAz = satAltAz.current[i];
      push(
        `sat_${i}`,
        "SATELLITE",
        pos,
        10,
        satNames.current[i] || `SAT-${i}`,
        undefined,
        `${getSkyLabel("orbit", language)}: ${altAz?.alt.toFixed(1)}° // ${getSkyLabel("az", language)}: ${altAz?.az.toFixed(0)}°`
      );
    }

    onProjected(objects);
  });

  return (
    <group ref={groupRef}>
      {/* Stars */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[skyData.starPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[skyData.starColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.34}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Constellation lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[skyData.linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8B8F9C" transparent opacity={0.14} depthWrite={false} />
      </lineSegments>

      {/* Milky Way band */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[skyData.milkyWayPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[skyData.milkyWayColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.55}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Planets / Sun / Moon */}
      {skyData.planets.map((p) => (
        <mesh key={p.id} position={p.pos}>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.95} />
        </mesh>
      ))}

      {/* Comets & Asteroids */}
      {skyData.smallBodies.map((sb) => (
        <group key={sb.id} position={sb.pos}>
          {sb.type === "COMET" && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[
                    new Float32Array([
                      0, 0, 0,
                      sb.pos.x * 0.05, sb.pos.y * 0.05, sb.pos.z * 0.05,
                      sb.pos.x * 0.1, sb.pos.y * 0.1, sb.pos.z * 0.1,
                    ]),
                    3,
                  ]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#7DD3FC" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
            </line>
          )}
          <mesh>
            <sphereGeometry args={sb.type === "COMET" ? [0.42, 10, 10] : [0.28, 8, 8]} />
            <meshBasicMaterial color={sb.type === "COMET" ? "#38BDF8" : "#94A3B8"} transparent opacity={0.9} />
          </mesh>
        </group>
      ))}

      {/* Satellite trails */}
      <points frustumCulled={false}>
        <bufferGeometry ref={trailGeomRef}>
          <bufferAttribute attach="attributes-position" args={[trailPts.current, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#FDE68A"
          size={0.28}
          sizeAttenuation
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Satellites */}
      <points frustumCulled={false}>
        <bufferGeometry ref={satGeomRef}>
          <bufferAttribute attach="attributes-position" args={[satCurrent.current, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#FFF7E0"
          size={0.5}
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function NetworkBackground3D({
  zoomFactor = 1.0,
  warpProgress = 0,
  isEcoMode,
  ecoMode,
  onSkyStatusChange,
  language = "ru",
}: NetworkBackground3DProps) {
  const skyData = useSkyData(language);
  const [hoveredItem, setHoveredItem] = useState<ProjectedObject | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const projectedObjectsRef = useRef<ProjectedObject[]>([]);
  const activeEcoMode = isEcoMode ?? ecoMode ?? false;

  // Live zenith constellation status (same cadence as the 2D background)
  useEffect(() => {
    if (!onSkyStatusChange || activeEcoMode) return;
    const updateSkyStatus = () => {
      try {
        onSkyStatusChange(getLiveZenithConstellationStatus(new Date(), language));
      } catch {
        // ignore
      }
    };
    updateSkyStatus();
    const interval = setInterval(updateSkyStatus, 60000);
    return () => clearInterval(interval);
  }, [onSkyStatusChange, activeEcoMode, language]);

  // Global mousemove hover — identical behaviour to the 2D background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const targetElem = document.elementFromPoint(e.clientX, e.clientY);
      if (targetElem) {
        const closestLanding = targetElem.closest("#core-landing-page, #legal-modal-content");
        if (closestLanding) {
          if (hoveredItem !== null) {
            setHoveredItem(null);
            document.body.style.cursor = "";
          }
          return;
        }
      }
      const objects = projectedObjectsRef.current;
      let found: ProjectedObject | null = null;
      let minDist = 16;
      for (const obj of objects) {
        const dx = e.clientX - obj.x;
        const dy = e.clientY - obj.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          found = obj;
        }
      }
      if (found) {
        setHoveredItem(found);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        document.body.style.cursor = "pointer";
      } else {
        if (hoveredItem !== null) {
          setHoveredItem(null);
          document.body.style.cursor = "";
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "";
    };
  }, [hoveredItem]);

  const handleProjected = (objects: ProjectedObject[]) => {
    projectedObjectsRef.current = objects;
  };

  const effFov = 105 / Math.sqrt(zoomFactor || 1);

  return (
    <div
      className="absolute inset-0 w-full h-full bg-[#0A0A0B] pointer-events-none overflow-hidden"
      id="network-background-container"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 0], fov: effFov, near: 0.1, far: 160 }}
        gl={{ antialias: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: false }}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <CameraRig fov={effFov} />
        {skyData && <SkyObjects skyData={skyData} language={language} onProjected={handleProjected} />}
      </Canvas>

      {hoveredItem && (
        <div
          className="fixed z-50 px-3.5 py-2 rounded-xl bg-[#12141A]/95 backdrop-blur-md border border-[#3B82F6]/50 text-[#F5F5F0] pointer-events-none transition-all duration-75 flex flex-col gap-0.5 animate-fade-in"
          style={{
            left: Math.min(window.innerWidth - 250, tooltipPos.x + 16),
            top: Math.max(16, Math.min(window.innerHeight - 90, tooltipPos.y - 14)),
          }}
          id="celestial-tooltip"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
            <span className="font-mono text-xs font-bold text-[#2DD4BF] tracking-wider uppercase">
              {hoveredItem.titleRu}
            </span>
          </div>
          {hoveredItem.subtitleRu && (
            <span className="font-sans text-[11px] text-gray-300">
              {hoveredItem.subtitleRu}
            </span>
          )}
          {hoveredItem.techInfo && (
            <span className="font-mono text-[10px] text-gray-500">
              {hoveredItem.techInfo}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
