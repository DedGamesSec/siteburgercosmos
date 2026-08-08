import React, { useEffect, useRef, useState } from "react";
import * as Astronomy from "astronomy-engine";
import { REAL_STARS, CONSTELLATION_LINES, getStarDistanceLy, type RealStar } from "../data/realStarCatalog";
import { STAR_NAMES_RU, getRussianName } from "../data/starNamesRu";
import { getSkyLabel } from "../data/skyLabelsI18n";
import {
  SMALL_BODIES,
  calculateSmallBodyRaDec,
  calculateSatLookAngles,
  getLiveZenithConstellationStatus
} from "../utils/skyCalculations";
import { useSkyActivation, cachedSatellites, cachedSmallBodies } from "../hooks/useSkyActivation";

// True 3D scene: a real perspective camera flies through the star field.
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const VERTICAL_FOV_DEG = 115;      // perspective lens vertical field of view
const CAMERA_AMP_LY = 0.9;         // virtual observer drift amplitude (light years)
const NEAR_PLANE = 0.15;           // perspective near clip plane (ly)
const PLANET_DOME_LY = 150;        // planets / sun / moon sit on a distant celestial shell
const SMALLBODY_DOME_LY = 40;      // comets / asteroids: mid shell
const SAT_LAYER_LY = 5;            // satellites: near foreground layer
const STAR_REF_DEPTH_LY = 60;      // reference depth (ly) for star apparent size
const PROJECTION_MARGIN = 160;     // px margin to still draw slightly off-screen points

interface NetworkBackgroundProps {
  zoomFactor?: number;
  warpProgress?: number;
  isEcoMode?: boolean;
  ecoMode?: boolean; // alias compatibility
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

export default function NetworkBackground({
  zoomFactor = 1.0,
  warpProgress = 0,
  isEcoMode,
  ecoMode,
  onSkyStatusChange,
  language = "ru"
}: NetworkBackgroundProps) {
  const activeEcoMode = isEcoMode ?? ecoMode ?? false;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotionMode = activeEcoMode || prefersReducedMotion;

  useSkyActivation(reducedMotionMode);
  const [hoveredItem, setHoveredItem] = useState<ProjectedObject | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const projectedObjectsRef = useRef<ProjectedObject[]>([]);
  const hoveredConstellationRef = useRef<string | null>(null);
  const moonGlowMultiplierRef = useRef<number>(1.0);
  const sunAltitudeRef = useRef<number>(-20);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncPreference);
    };
  }, []);

  // 1. Calculate Moon Phase Multiplier every 5 minutes (0.85 at new moon, 1.15 at full moon)
  useEffect(() => {
    const calcMoonPhase = () => {
      try {
        const phaseAngle = Astronomy.MoonPhase(new Date());
        moonGlowMultiplierRef.current = 0.85 + 0.3 * ((1 - Math.cos(phaseAngle * (Math.PI / 180))) / 2);
      } catch {
        moonGlowMultiplierRef.current = 1.0;
      }
    };
    calcMoonPhase();
    const interval = setInterval(calcMoonPhase, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Update live zenith constellation status every 1 minute
  useEffect(() => {
    if (!onSkyStatusChange || reducedMotionMode) return;

    const updateSkyStatus = () => {
      try {
        const status = getLiveZenithConstellationStatus(new Date(), language);
        onSkyStatusChange(status);
      } catch {
        // ignore
      }
    };
    updateSkyStatus();
    const interval = setInterval(updateSkyStatus, 60000);
    return () => clearInterval(interval);
  }, [onSkyStatusChange, reducedMotionMode, language]);

  // Handle global mousemove for interactive Stellarium tooltips
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Avoid triggering tooltips if user is hovering over solid landing page or interactive buttons
      const targetElem = document.elementFromPoint(e.clientX, e.clientY);
      if (targetElem) {
        const closestLanding = targetElem.closest("#core-landing-page, #legal-modal-content");
        if (closestLanding) {
          if (hoveredConstellationRef.current !== null || hoveredItem !== null) {
            hoveredConstellationRef.current = null;
            setHoveredItem(null);
            document.body.style.cursor = "";
          }
          return;
        }
      }

      const objects = projectedObjectsRef.current;
      let found: ProjectedObject | null = null;
      let minDist = 16; // hover threshold in px

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const dx = e.clientX - obj.x;
        const dy = e.clientY - obj.y;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          minDist = dist;
          found = obj;
        }
      }

      if (found) {
        hoveredConstellationRef.current = found.constellationCode || null;
        setHoveredItem(found);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        document.body.style.cursor = "pointer";
      } else {
        if (hoveredConstellationRef.current !== null) {
          hoveredConstellationRef.current = null;
        }
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

  // Main canvas animation and astronomical projection loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = 1;
    let isMobile = width < 768;

    const syncCanvasSize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = width < 768;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handleResize = () => {
      syncCanvasSize();
    };
    syncCanvasSize();
    window.addEventListener("resize", handleResize);

    // Throttle heavy astronomical computations to once every 250ms while rendering smoothly at 60fps
    let lastAstroCalcTime = 0;
    const astroCalcInterval = reducedMotionMode ? 2000 : 250;

    // Throttle slower moving objects (satellites & comets/asteroids) to every 750ms for performance with 200 satellites
    let lastSlowCalcTime = 0;
    const slowCalcInterval = reducedMotionMode ? 3000 : 750;
    let prevFrameTime = performance.now();

    // True 3D scene state. Every object stores its real 3D position (light years)
    // in the local East/North/Up frame of the observer and is re-projected onto the
    // screen every frame by a real perspective camera.
    interface StarCoord {
      star: RealStar;
      xyz: { x: number; y: number; z: number };
      size: number;
      alpha: number;
      distLy: number;
    }
    let currentStarCoords: StarCoord[] = [];

    interface PlanetCoord {
      id: string;
      nameRu: string;
      color: string;
      xyz: { x: number; y: number; z: number };
      alt: number;
      size: number;
    }
    let currentPlanetCoords: PlanetCoord[] = [];

    interface BodyCoord {
      id: string;
      nameRu: string;
      type: "COMET" | "ASTEROID";
      xyz: { x: number; y: number; z: number };
      alt: number;
    }
    let currentSmallBodyCoords: BodyCoord[] = [];

    interface SatCoord {
      id: string;
      nameRu: string;
      prev3: { x: number; y: number; z: number };
      next3: { x: number; y: number; z: number };
      alt: number;
      az: number;
      trail: { x: number; y: number }[];
    }
    let currentSatCoords: SatCoord[] = [];

    // Unit direction components (east, north, up) for horizontal alt/az coordinates (deg)
    const dir3 = (altDeg: number, azDeg: number) => {
      const a = altDeg * DEG2RAD;
      const az = azDeg * DEG2RAD;
      return {
        x: Math.cos(a) * Math.sin(az),
        y: Math.cos(a) * Math.cos(az),
        z: Math.sin(a)
      };
    };

    const render = (time: number) => {
      prevFrameTime = time;

      ctx.clearRect(0, 0, width, height);
      const starDensity = reducedMotionMode ? 0.35 : isMobile ? 0.55 : 1;
      const starList = REAL_STARS.slice(0, Math.max(24, Math.floor(REAL_STARS.length * starDensity)));

      const moonGlow = moonGlowMultiplierRef.current;

      // 0. Horizon twilight glow if Sun altitude is between -6° and +6°
      const sunAlt = sunAltitudeRef.current;
      if (sunAlt >= -6 && sunAlt <= 6) {
        const twilightAlpha = 0.08 * (1 - Math.abs(sunAlt) / 6);
        if (twilightAlpha > 0.005) {
          ctx.save();
          const horizonH = Math.min(height * 0.4, 320);
          const grad = ctx.createLinearGradient(0, height - horizonH, 0, height);
          grad.addColorStop(0, "rgba(255, 180, 120, 0)");
          grad.addColorStop(1, `rgba(255, 180, 120, ${twilightAlpha.toFixed(4)})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, height - horizonH, width, horizonH);
          ctx.restore();
        }
      }

      const centerX = width / 2;
      const centerY = height / 2;

      // Fixed observer position (Moscow)
      const observerLat = 55.7558;
      const observerLon = 37.6173;
      const observer = new Astronomy.Observer(observerLat, observerLon, 0.05);

      // Simulated or real time: allow diurnal rotation to flow naturally
      const now = new Date();

      // --------------------------------------------------------------------------
      // PER-FRAME 3D PERSPECTIVE CAMERA INSIDE THE STAR FIELD
      // --------------------------------------------------------------------------
      // A virtual observer drifts a few light-years (real parallax) while slowly
      // circling the zenith, so the whole scene reads as genuine 3D space.
      const tSec = time / 1000;
      const camAmp = reducedMotionMode ? 0 : isMobile ? 0.6 : CAMERA_AMP_LY;
      const camE = camAmp * Math.sin(tSec / 31) * Math.sin(tSec / 6.5);
      const camN = camAmp * Math.cos(tSec / 41);
      const camU = camAmp * 0.5 * Math.sin(tSec / 19);

      const sweepTilt = (12 + 8 * Math.sin(tSec / 45)) * DEG2RAD; // 4°..20° from zenith
      const sweepAz = (tSec / 250) * 2 * Math.PI;                 // full circle every 250s
      const lookAlt = 90 - sweepTilt * RAD2DEG;
      const fx = Math.cos(lookAlt * DEG2RAD) * Math.sin(sweepAz);
      const fy = Math.cos(lookAlt * DEG2RAD) * Math.cos(sweepAz);
      const fz = Math.sin(lookAlt * DEG2RAD);

      // Right-handed camera basis (right, screen-up, forward)
      const rLen = Math.hypot(fx, fy);
      const rx = rLen > 1e-6 ? -fy / rLen : 1;
      const ry = rLen > 1e-6 ? fx / rLen : 0;
      const rz = 0;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;

      const focal = ((height / 2) / Math.tan((VERTICAL_FOV_DEG / 2) * DEG2RAD)) * zoomFactor;

      // Perspective projection of a 3D world point (ly) into screen coordinates
      const project = (px: number, py: number, pz: number) => {
        const dx = px - camE;
        const dy = py - camN;
        const dz = pz - camU;
        const depth = dx * fx + dy * fy + dz * fz;
        if (depth < NEAR_PLANE) return null;
        const inv = focal / depth;
        const xc = dx * rx + dy * ry + dz * rz;
        const yc = dx * ux + dy * uy + dz * uz;
        return { x: centerX + xc * inv, y: centerY - yc * inv, depth };
      };

      // Recalculate astronomical positions if interval passed or empty
      if (time - lastAstroCalcTime > astroCalcInterval || currentStarCoords.length === 0) {
        lastAstroCalcTime = time;

        // 1. Stars: real 3D positions = real sky direction × real distance (ly)
        const nextStars: StarCoord[] = [];
        for (let i = 0; i < starList.length; i++) {
          const star = starList[i];
          try {
            const horiz = Astronomy.Horizon(now, observer, star.ra, star.dec, "normal");
            if (horiz.altitude > -15) {
              const distLy = getStarDistanceLy(star.id);
              const d = dir3(horiz.altitude, horiz.azimuth);
              nextStars.push({
                star,
                xyz: { x: d.x * distLy, y: d.y * distLy, z: d.z * distLy },
                size: Math.max(1.0, Math.min(3.6, 3.3 - star.mag * 0.5)) * zoomFactor,
                alpha: Math.min(1, Math.max(0.55, 1.35 - star.mag * 0.15)),
                distLy
              });
            }
          } catch {
            // Ignore error for single star
          }
        }
        currentStarCoords = nextStars;

        // 2. Planets & Sun / Moon: distant celestial shell (kept as sky markers)
        const planets: { body: Astronomy.Body; id: string; nameRu: string; color: string; baseSize: number }[] = [
          { body: Astronomy.Body.Sun, id: "sun", nameRu: `${getSkyLabel("sun", language)} // ${getSkyLabel("sunDesc", language)}`, color: "#FEF08A", baseSize: 4.5 },
          { body: Astronomy.Body.Moon, id: "moon", nameRu: `${getSkyLabel("moon", language)} // ${getSkyLabel("moonDesc", language)}`, color: "#F3F4F6", baseSize: 4.0 },
          { body: Astronomy.Body.Venus, id: "venus", nameRu: `${getSkyLabel("venus", language)} // ${getSkyLabel("venusDesc", language)}`, color: "#FFFBEB", baseSize: 3.2 },
          { body: Astronomy.Body.Mars, id: "mars", nameRu: `${getSkyLabel("mars", language)} // ${getSkyLabel("marsDesc", language)}`, color: "#FF6B6B", baseSize: 2.6 },
          { body: Astronomy.Body.Jupiter, id: "jupiter", nameRu: `${getSkyLabel("jupiter", language)} // ${getSkyLabel("jupiterDesc", language)}`, color: "#FDE68A", baseSize: 3.0 },
          { body: Astronomy.Body.Saturn, id: "saturn", nameRu: `${getSkyLabel("saturn", language)} // ${getSkyLabel("saturnDesc", language)}`, color: "#FEF08A", baseSize: 2.5 }
        ];

        const nextPlanets: PlanetCoord[] = [];
        for (const p of planets) {
          try {
            const eq = Astronomy.Equator(p.body, now, observer, true, true);
            const horiz = Astronomy.Horizon(now, observer, eq.ra, eq.dec, "normal");
            if (p.body === Astronomy.Body.Sun) {
              sunAltitudeRef.current = horiz.altitude;
            }
            if (horiz.altitude > -10) {
              const d = dir3(horiz.altitude, horiz.azimuth);
              nextPlanets.push({
                id: p.id,
                nameRu: p.nameRu,
                color: p.color,
                xyz: { x: d.x * PLANET_DOME_LY, y: d.y * PLANET_DOME_LY, z: d.z * PLANET_DOME_LY },
                alt: horiz.altitude,
                size: p.baseSize * zoomFactor
              });
            }
          } catch {
            // Ignore
          }
        }
        currentPlanetCoords = nextPlanets;
      }

      // Recalculate slower objects (Comets, Asteroids, Satellites) every 750ms
      if (time - lastSlowCalcTime > slowCalcInterval || currentSmallBodyCoords.length === 0 || (cachedSatellites && currentSatCoords.length === 0)) {
        lastSlowCalcTime = time;

        if (!reducedMotionMode) {
          // 3. Comets & Asteroids: mid shell (40 ly)
          const nextBodies: BodyCoord[] = [];
          const bodiesToUse = cachedSmallBodies && cachedSmallBodies.length > 0 ? cachedSmallBodies : SMALL_BODIES;
          const smallBodies = bodiesToUse.slice(0, isMobile ? Math.max(4, Math.floor(bodiesToUse.length * 0.45)) : bodiesToUse.length);
          for (const sb of smallBodies) {
            try {
              const eq = calculateSmallBodyRaDec(sb, now);
              const horiz = Astronomy.Horizon(now, observer, eq.ra, eq.dec, "normal");
              if (horiz.altitude > -8) {
                const d = dir3(horiz.altitude, horiz.azimuth);
                nextBodies.push({
                  id: sb.id,
                  nameRu: `${getRussianName(sb.nameEn, language)} // ${getSkyLabel(sb.type === "COMET" ? "comet" : "asteroid", language)}`,
                  type: sb.type,
                  xyz: { x: d.x * SMALLBODY_DOME_LY, y: d.y * SMALLBODY_DOME_LY, z: d.z * SMALLBODY_DOME_LY },
                  alt: horiz.altitude
                });
              }
            } catch {
              // Ignore
            }
          }
          currentSmallBodyCoords = nextBodies;

          // 4. Satellites: near foreground layer (5 ly), prev/next 3D positions for 60fps lerp
          if (cachedSatellites && cachedSatellites.length > 0) {
            const nextSats: SatCoord[] = [];
            const futureDate = new Date(now.getTime() + slowCalcInterval);

            const satellites = cachedSatellites.slice(0, isMobile ? Math.max(24, Math.floor(cachedSatellites.length * 0.35)) : cachedSatellites.length);
            for (let i = 0; i < satellites.length; i++) {
              const sat = satellites[i];
              const look = calculateSatLookAngles(sat.satrec, now, observerLat, observerLon);
              if (look && look.altitude > -2) {
                const dCur = dir3(look.altitude, look.azimuth);
                const futureLook = calculateSatLookAngles(sat.satrec, futureDate, observerLat, observerLon) || look;
                const dNxt = dir3(futureLook.altitude, futureLook.azimuth);
                nextSats.push({
                  id: sat.id,
                  nameRu: getRussianName(sat.name, language),
                  prev3: { x: dCur.x * SAT_LAYER_LY, y: dCur.y * SAT_LAYER_LY, z: dCur.z * SAT_LAYER_LY },
                  next3: { x: dNxt.x * SAT_LAYER_LY, y: dNxt.y * SAT_LAYER_LY, z: dNxt.z * SAT_LAYER_LY },
                  alt: look.altitude,
                  az: look.azimuth,
                  trail: []
                });
              }
            }
            currentSatCoords = nextSats;
          }
        }
      }

      // --------------------------------------------------------------------------
      // PROJECT & DRAW the 3D scene
      // --------------------------------------------------------------------------
      const starMap = new Map<string, { x: number; y: number }>();
      const projectedStars: { x: number; y: number; size: number; alpha: number; sc: StarCoord }[] = [];
      const visibleInteractiveObjects: ProjectedObject[] = [];
      const rim = Math.min(width, height) * 0.5;
      const rimFade = (dx: number, dy: number) =>
        Math.min(1, Math.max(0, (rim * 1.08 - Math.hypot(dx, dy)) / (rim * 0.4)));

      // --- Stars ---
      for (let i = 0; i < currentStarCoords.length; i++) {
        const sc = currentStarCoords[i];
        const pr = project(sc.xyz.x, sc.xyz.y, sc.xyz.z);
        if (!pr) continue;
        if (pr.x < -PROJECTION_MARGIN || pr.x > width + PROJECTION_MARGIN || pr.y < -PROJECTION_MARGIN || pr.y > height + PROJECTION_MARGIN) continue;

        const depthScale = Math.min(1.9, Math.max(0.4, Math.pow(STAR_REF_DEPTH_LY / Math.max(pr.depth, 1), 0.35)));
        const size = sc.size * depthScale * (isMobile ? 1.1 : 1);
        const fade = rimFade(pr.x - centerX, pr.y - centerY);

        projectedStars.push({ x: pr.x, y: pr.y, size, alpha: sc.alpha * fade, sc });
        starMap.set(sc.star.id, { x: pr.x, y: pr.y });
        visibleInteractiveObjects.push({
          id: sc.star.id,
          type: "STAR",
          x: pr.x,
          y: pr.y,
          size,
          titleRu: getRussianName(sc.star.nameEn || sc.star.id, language),
          subtitleRu: sc.star.constellationCode
            ? `${getSkyLabel("constellation", language)}: ${getRussianName(sc.star.constellationCode, language) || sc.star.constellationCode}`
            : undefined,
          techInfo: `${getSkyLabel("magnitude", language)}: ${sc.star.mag.toFixed(2)}m // ${sc.distLy.toFixed(0)} ly`,
          constellationCode: sc.star.constellationCode
        });
      }

      // --- Planets & Sun/Moon ---
      for (const p of currentPlanetCoords) {
        const pr = project(p.xyz.x, p.xyz.y, p.xyz.z);
        if (!pr) continue;
        if (pr.x < -PROJECTION_MARGIN || pr.x > width + PROJECTION_MARGIN || pr.y < -PROJECTION_MARGIN || pr.y > height + PROJECTION_MARGIN) continue;
        visibleInteractiveObjects.push({
          id: p.id,
          type: "PLANET",
          x: pr.x,
          y: pr.y,
          size: p.size,
          titleRu: p.nameRu,
          techInfo: `${getSkyLabel("altitude", language)}: ${p.alt.toFixed(1)}°`
        });
      }

      // --- Comets & Asteroids ---
      if (!reducedMotionMode) {
        for (const sb of currentSmallBodyCoords) {
          const pr = project(sb.xyz.x, sb.xyz.y, sb.xyz.z);
          if (!pr) continue;
          if (pr.x < -PROJECTION_MARGIN || pr.x > width + PROJECTION_MARGIN || pr.y < -PROJECTION_MARGIN || pr.y > height + PROJECTION_MARGIN) continue;
          visibleInteractiveObjects.push({
            id: sb.id,
            type: sb.type,
            x: pr.x,
            y: pr.y,
            size: 2.2,
            titleRu: sb.nameRu,
            techInfo: `${getSkyLabel("keplerianOrbitAlt", language)}: ${sb.alt.toFixed(1)}°`
          });
        }
      }

      // DRAW CONSTELLATION ASTERISM LINES (3D: segments between perspective-projected stars)
      const activeConstel = hoveredConstellationRef.current;

      for (let i = 0; i < CONSTELLATION_LINES.length; i++) {
        const constel = CONSTELLATION_LINES[i];
        const isHighlighted = activeConstel === constel.code;

        ctx.save();
        if (isHighlighted) {
          ctx.strokeStyle = `rgba(45, 212, 191, ${(0.75 * moonGlow).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.shadowColor = "#2DD4BF";
          ctx.shadowBlur = 8 * moonGlow;
        } else {
          ctx.strokeStyle = `rgba(139, 143, 156, ${(0.16 * moonGlow).toFixed(3)})`;
          ctx.lineWidth = 0.65;
        }

        for (let j = 0; j < constel.lines.length; j++) {
          const [id1, id2] = constel.lines[j];
          const s1 = starMap.get(id1);
          const s2 = starMap.get(id2);
          if (s1 && s2) {
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // --- Draw Stars ---
      for (let i = 0; i < projectedStars.length; i++) {
        const st = projectedStars[i];
        const isHovered = hoveredConstellationRef.current === st.sc.star.constellationCode;

        ctx.save();
        ctx.globalAlpha = st.alpha;

        if (isHovered) {
          ctx.shadowColor = "#2DD4BF";
          ctx.shadowBlur = 10 * moonGlow;
        }

        ctx.beginPath();
        ctx.arc(st.x, st.y, isHovered ? st.size * 1.3 : st.size, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#FFFFFF" : st.sc.star.mag < 0.5 ? "#F8FAFC" : "#E2E8F0";
        ctx.fill();
        ctx.restore();
      }

      // DRAW PLANETS & SUN/MOON
      for (const p of currentPlanetCoords) {
        const pr = project(p.xyz.x, p.xyz.y, p.xyz.z);
        if (!pr) continue;
        ctx.save();
        ctx.globalAlpha = rimFade(pr.x - centerX, pr.y - centerY);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10 * moonGlow;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      // DRAW COMETS & ASTEROIDS
      if (!reducedMotionMode) {
        for (let c = 0; c < currentSmallBodyCoords.length; c++) {
          const sb = currentSmallBodyCoords[c];
          const pr = project(sb.xyz.x, sb.xyz.y, sb.xyz.z);
          if (!pr) continue;
          ctx.save();
          ctx.globalAlpha = rimFade(pr.x - centerX, pr.y - centerY);
          if (sb.type === "COMET") {
            // Draw glowing bluish tail pointing away from the scene center
            const dx = pr.x - centerX;
            const dy = pr.y - centerY;
            const len = Math.hypot(dx, dy) || 1;
            const tailX = pr.x + (dx / len) * 16;
            const tailY = pr.y + (dy / len) * 16;

            const grad = ctx.createLinearGradient(pr.x, pr.y, tailX, tailY);
            grad.addColorStop(0, "rgba(125, 211, 252, 0.85)");
            grad.addColorStop(1, "rgba(56, 189, 248, 0)");

            ctx.beginPath();
            ctx.moveTo(pr.x, pr.y);
            ctx.lineTo(tailX, tailY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Comet head
            ctx.shadowColor = "#38BDF8";
            ctx.shadowBlur = 8 * moonGlow;
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, 2.0, 0, Math.PI * 2);
            ctx.fillStyle = "#E0F2FE";
            ctx.fill();
          } else {
            // Asteroid dot
            ctx.beginPath();
            ctx.arc(pr.x, pr.y, 1.3, 0, Math.PI * 2);
            ctx.fillStyle = "#94A3B8";
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // DRAW SATELLITES (near foreground 3D layer, smooth 60fps lerp between look-angle updates)
      if (!reducedMotionMode && currentSatCoords.length > 0) {
        const satProgress = Math.min(1, (time - lastSlowCalcTime) / slowCalcInterval);
        for (let i = 0; i < currentSatCoords.length; i++) {
          const sat = currentSatCoords[i];
          const ix = sat.prev3.x + (sat.next3.x - sat.prev3.x) * satProgress;
          const iy = sat.prev3.y + (sat.next3.y - sat.prev3.y) * satProgress;
          const iz = sat.prev3.z + (sat.next3.z - sat.prev3.z) * satProgress;
          const pr = project(ix, iy, iz);
          if (!pr) {
            sat.trail = [];
            continue;
          }
          if (pr.x < -PROJECTION_MARGIN || pr.x > width + PROJECTION_MARGIN || pr.y < -PROJECTION_MARGIN || pr.y > height + PROJECTION_MARGIN) {
            sat.trail = [];
            continue;
          }

          const fade = rimFade(pr.x - centerX, pr.y - centerY);
          sat.trail.push({ x: pr.x, y: pr.y });
          if (sat.trail.length > 8) sat.trail.shift();

          // Draw fading trail
          if (sat.trail.length > 1) {
            ctx.save();
            for (let tIdx = 0; tIdx < sat.trail.length - 1; tIdx++) {
              const p = (tIdx + 1) / sat.trail.length;
              const pNext = (tIdx + 2) / sat.trail.length;
              ctx.beginPath();
              ctx.moveTo(sat.trail[tIdx].x, sat.trail[tIdx].y);
              ctx.lineTo(sat.trail[tIdx + 1].x, sat.trail[tIdx + 1].y);
              ctx.strokeStyle = `rgba(255, 230, 180, ${(pNext * 0.55 * fade).toFixed(3)})`;
              ctx.lineWidth = 1.2 * pNext;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(sat.trail[tIdx].x, sat.trail[tIdx].y, 1.2 * pNext, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 240, 210, ${(p * 0.7 * fade).toFixed(3)})`;
              ctx.fill();
            }
            ctx.restore();
          }

          // Draw satellite dot with distinct warm white hue
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 250, 240, 1)"; // warm white
          ctx.shadowColor = "#FDE68A"; // warm gold/amber
          ctx.shadowBlur = 8 * moonGlow;
          ctx.fill();
          ctx.restore();

          visibleInteractiveObjects.push({
            id: sat.id,
            type: "SATELLITE",
            x: pr.x,
            y: pr.y,
            size: 2.5,
            titleRu: sat.nameRu,
            techInfo: `${getSkyLabel("orbit", language)}: ${sat.alt.toFixed(1)}° // ${getSkyLabel("az", language)}: ${sat.az.toFixed(0)}°`
          });
        }
      }

      projectedObjectsRef.current = visibleInteractiveObjects;

      if (!reducedMotionMode) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [zoomFactor, warpProgress, reducedMotionMode, language]);

  return (
    <div
      className="absolute inset-0 w-full h-full bg-[#0A0A0B] pointer-events-none overflow-hidden"
      id="network-background-container"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 transition-opacity duration-300 pointer-events-none"
      />

      {/* Interactive Floating Tooltip */}
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
