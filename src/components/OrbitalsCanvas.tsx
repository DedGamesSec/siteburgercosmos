import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LanguageCode } from "../i18n/languages";
import * as Astronomy from "astronomy-engine";
import { resolvePlanetCollisions } from "../utils/planetCollisions";
import type { PlanetData } from "./ExplorePagesSection";

/* ---- Item 13: the orbital section is flat 2D — this component owns the
   whole "solar system canvas": starfield background, comets, orbit rings,
   the Sun disc, the planet discs and their hover card. The parent keeps only
   the section skeleton (header copy, hint / attribution row, mobile card
   list). Everything positional lives here so there is exactly ONE place that
   computes a planet's screen coordinates. ---- */

type PageRef = { id: string; labelKey: string };

type OrbitalsCanvasProps = {
  planets: Array<{ page: PageRef; data: PlanetData }>;
  language: LanguageCode;
  pageNames: Record<string, string>;
  ecoMode: boolean;
  motionless: boolean;
  /** Warp burst in VIEWPORT coordinates (the parent owns the navigation
      trigger and has no access to this container's rect); translated down to
      the solar container here so the flash lands on the click point. */
  warp: { x: number; y: number; key: number } | null;
  /** Navigate with the warp burst; fire-and-forget from the planet's click. */
  onNavigate: (id: string, e?: React.MouseEvent) => void;
  renderOverlayCard: (page: PageRef, planet: PlanetData) => React.ReactNode;
};

/* Multiplier applied to every orbit so the whole system sits a touch closer
   together and no planet reaches the very edges of the block. */
const ORBIT_SCALE = 0.92;

/* ---- Real heliocentric position lookup (astronomy-engine) ----
   Each page maps to one planet; its current position on the orbit is its real
   heliocentric ecliptic longitude for the moment the section is shown. */
const BODY_BY_PAGE: Record<string, Astronomy.Body> = {
  "how-it-works": Astronomy.Body.Neptune,
  tech: Astronomy.Body.Jupiter,
  roadmap: Astronomy.Body.Mars,
  about: Astronomy.Body.Saturn,
  comparison: Astronomy.Body.Venus,
  news: Astronomy.Body.Uranus,
  download: Astronomy.Body.Mercury,
};

function helioLongitude(body: Astronomy.Body, date: Date): number {
  try {
    const ecl = Astronomy.Ecliptic(Astronomy.HelioVector(body, date));
    return ((ecl.elon % 360) + 360) % 360;
  } catch {
    return 0;
  }
}

/* ---- Layered living Sun (shared granulated surface canvas) ----
   The surface is uniformly bright (no baked radial gradient — a gradient
   physically rotates with a sphere's UV wrap and caused the periodic
   "yellowing"). The static darker limb lives on the 2D disc's base layers,
   not in this turning texture. Generated once and cached. */
let sunSurfaceCache: HTMLCanvasElement | null = null;
function buildSunSurface(): HTMLCanvasElement {
  if (sunSurfaceCache) return sunSurfaceCache;
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFE9A8";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 340; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const x = size / 2 + Math.cos(a) * rr * size * 0.42;
    const y = size / 2 + Math.sin(a) * rr * size * 0.42;
    const rad = 1.5 + Math.random() * 5;
    const hot = Math.random() > 0.5;
    ctx.globalAlpha = 0.05 + Math.random() * 0.11;
    ctx.fillStyle = hot ? "#FFF8E0" : "#B45309";
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  sunSurfaceCache = c;
  return c;
}

/* Optional Saturn-style ring overlay (SVG), shared by the 2D discs. */
export const PlanetRings = ({ color, size, lit = false }: { color: string; size: number; lit?: boolean }) => (
  <>
    <svg
      viewBox="0 0 120 60"
      width={size * 1.7}
      height={size * 0.9}
      fill="none"
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] pointer-events-none ${lit ? "ring-lit" : ""}`}
      style={{ "--ring-glow": color } as React.CSSProperties}
    >
      <ellipse cx="60" cy="30" rx="56" ry="16" stroke={color} strokeWidth="3" opacity="0.95" />
      <ellipse cx="60" cy="30" rx="48" ry="11" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
    <svg
      viewBox="0 0 120 60"
      width={size * 1.7}
      height={size * 0.9}
      fill="none"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[18deg] pointer-events-none"
    >
      <path d="M 16 37 Q 60 58 104 37" stroke={color} strokeWidth="2.5" opacity="0.75" fill="none" />
    </svg>
  </>
);

/* Flat 2D planet disc: real NASA-based surface texture, optional SVG ring
   overlay and a fake-volume shading. The disc IS the hit area (the parent
   wraps it in the interactive button), so visual and hit zone can never
   drift apart. */
export const PlanetDisc = ({
  planet,
  size,
  ring = false,
  className = "",
  spin = false,
  lit = false,
}: {
  planet: { color: string; textureUrl: string };
  size: number;
  ring?: boolean;
  className?: string;
  spin?: boolean;
  lit?: boolean;
}) => (
  <span
    className={`relative inline-flex items-center justify-center ${className}`}
    style={{ width: size * 1.25, height: size * 1.25 }}
    aria-hidden="true"
  >
    {ring && <PlanetRings color={planet.color} size={size} lit={lit} />}
    <span
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none ${lit ? "planet-halo-on" : "planet-halo"}`}
      style={{
        width: size * 1.45,
        height: size * 1.45,
        background: `radial-gradient(circle, ${planet.color}55 0%, ${planet.color}1f 45%, ${planet.color}00 70%)`,
      }}
    />
    <span className="relative block rounded-full overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.55)]" style={{ width: size, height: size }}>
      <span
        className={`absolute inset-0 ${spin ? "planet-spin" : ""}`}
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}${planet.textureUrl})`,
          backgroundSize: planet.textureUrl.includes("mars") ? "200% 118%" : "cover",
          backgroundPosition: "center",
        }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </span>
  </span>
);

/* Deterministic pseudo-random starfield layers. Item 9 — denser sky (~190
   stars), a fifth medium, few are large/bright constellation anchors. Three
   depth layers move at different parallax speeds. */
const STAR_COUNT = 190;
const DEEP_STAR_COUNT = 160;
const NEAR_STAR_COUNT = 42;
const SHOOTING_STARS = [
  { top: "12%", left: "4%", dist: "44vw", dur: 17, delay: 3 },
  { top: "34%", left: "52%", dist: "40vw", dur: 21, delay: 11 },
  { top: "58%", left: "10%", dist: "38vw", dur: 19, delay: 19 },
];

/* Rare comets on a truly random 30-60s cadence; a comet flies once with its
   own tail/speed and is unmounted after ITS OWN duration (item 11). */
type CometFx = {
  key: number;
  top: string;
  left: string;
  ang: string;
  dist: string;
  len: string;
  dur: string;
  durMs: number;
};
const rand = (min: number, max: number) => min + Math.random() * (max - min);
function makeComet(key: number): CometFx {
  const durMs = rand(3800, 5200);
  return {
    key,
    top: `${Math.round(rand(8, 82))}%`,
    left: `${Math.round(rand(-14, 18))}%`,
    ang: `${Math.round(rand(-62, -24))}deg`,
    dist: `${Math.round(rand(520, 920))}px`,
    len: `${Math.round(rand(90, 190))}px`,
    dur: `${(durMs / 1000).toFixed(1)}s`,
    durMs,
  };
}

export default function OrbitalsCanvas(props: OrbitalsCanvasProps) {
  const { planets, language, pageNames, ecoMode, motionless, warp, onNavigate, renderOverlayCard } = props;

  const solarRef = useRef<HTMLDivElement>(null);
  const starLayerRef = useRef<HTMLDivElement>(null);
  const starDeepRef = useRef<HTMLDivElement>(null);
  const starNearRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [solarW, setSolarW] = useState(0);
  const [solarH, setSolarH] = useState(0);

  const hideCard = () => {
    setHoveredPageId(null);
    setCardPos(null);
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const hideCardIfLeavingPlanet = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const pad = 60;
      if (
        e.clientX >= r.left - pad &&
        e.clientX <= r.right + pad &&
        e.clientY >= r.top - pad &&
        e.clientY <= r.bottom + pad
      ) {
        return;
      }
    }
    hideCard();
  };
  const hideCardIfLeavingCard = (e: React.PointerEvent) => {
    const rt = e.relatedTarget;
    if (cardRef.current && rt instanceof Node && cardRef.current.contains(rt)) return;
    hideCard();
  };

  // Current real heliocentric position of every planet, computed on mount.
  const [positions, setPositions] = useState<Record<string, number>>(() => {
    const now = new Date();
    const map: Record<string, number> = {};
    for (const [id, body] of Object.entries(BODY_BY_PAGE)) map[id] = helioLongitude(body, now);
    return map;
  });

  // Measure the solar container so orbit radii are exact pixels (item 12:
  // use the SMALLER of width/height so circular orbits always fit).
  useEffect(() => {
    const el = solarRef.current;
    if (!el) return;
    const update = () => {
      setSolarW(el.clientWidth);
      setSolarH(el.clientHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Comet scheduler: one comet every ~35-65s — 4-5s flight + random 30-60s gap.
  useEffect(() => {
    if (motionless) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = (ms: number) => {
      timer = setTimeout(step, ms);
    };
    const step = () => {
      if (!alive) return;
      const c = makeComet(Date.now());
      setComet(c);
      timer = setTimeout(() => {
        if (alive) setComet(null);
        later(rand(30000, 60000));
      }, c.durMs + 200);
    };
    later(rand(4000, 9000));
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      setComet(null);
    };
  }, [motionless]);

  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ x: number; y: number } | null>(null);
  const [comet, setComet] = useState<CometFx | null>(null);

  // Warp comes in viewport coordinates; translate it into this container's
  // coordinate space once when it fires (its 320ms flight is too short to
  // matter if the page scrolls mid-flash).
  const [warpLocal, setWarpLocal] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!warp) {
      setWarpLocal(null);
      return;
    }
    const el = solarRef.current;
    if (!el) {
      setWarpLocal(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setWarpLocal({ x: warp.x - r.left, y: warp.y - r.top });
  }, [warp]);

  // Deterministic pseudo-random star fields.
  const stars = useMemo(() => {
    type Star = { left: number; top: number; size: number; delay: number; opacity: number; bright: boolean };
    const arr: Star[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = rnd();
      const bright = r > 0.93;
      const size = bright ? 2.2 + rnd() * 1.8 : 0.6 + rnd() * (r > 0.7 ? 2.2 : 1.1);
      const opacity = bright ? 0.65 + rnd() * 0.35 : 0.15 + rnd() * 0.55;
      arr.push({ left: rnd() * 100, top: rnd() * 100, size, delay: rnd() * 6, opacity, bright });
    }
    return arr;
  }, []);

  const deepStars = useMemo(() => {
    type Star = { left: number; top: number; size: number; delay: number; opacity: number };
    const arr: Star[] = [];
    let seed = 31;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < DEEP_STAR_COUNT; i++) {
      arr.push({ left: rnd() * 100, top: rnd() * 100, size: 0.6 + rnd() * 0.9, delay: rnd() * 7, opacity: 0.08 + rnd() * 0.22 });
    }
    return arr;
  }, []);

  const nearStars = useMemo(() => {
    type Star = { left: number; top: number; size: number; delay: number; opacity: number; bright: boolean };
    const arr: Star[] = [];
    let seed = 47;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < NEAR_STAR_COUNT; i++) {
      const bright = rnd() > 0.7;
      arr.push({
        left: rnd() * 100,
        top: rnd() * 100,
        size: bright ? 2.4 + rnd() * 1.6 : 1.2 + rnd() * 1.4,
        delay: rnd() * 6,
        opacity: bright ? 0.6 + rnd() * 0.35 : 0.2 + rnd() * 0.4,
        bright,
      });
    }
    return arr;
  }, []);

  const halfW = solarW / 2;
  const halfH = solarH / 2;
  const orbitHalf = Math.min(halfW, halfH) || 1;

  // Single source of truth: real heliocentric angles -> screen discs ->
  // collision resolver -> final angles. Only this component renders planets.
  const resolvedAngles = useMemo(() => {
    const angles: Record<string, number> = {};
    if (halfW <= 0) return angles;
    const circles = planets.map(({ page, data }) => {
      const rad = ((positions[page.id] ?? 0) * Math.PI) / 180;
      const R = data.radiusPct * ORBIT_SCALE * orbitHalf;
      return { id: page.id, x: Math.cos(rad) * R, y: Math.sin(rad) * R, r: data.sizePx / 2 };
    });
    for (const c of resolvePlanetCollisions(circles, 8)) {
      const orbitR = Math.hypot(c.x, c.y);
      angles[c.id] = orbitR > 0 ? (Math.atan2(c.y, c.x) * 180) / Math.PI : 0;
    }
    return angles;
  }, [planets, positions, orbitHalf]);

  const sunSurfaceUrl = useMemo(() => (typeof document !== "undefined" ? buildSunSurface().toDataURL() : ""), []);

  // Card layout: opened outwards from the planet, clamped to the container.
  const computeCardPos = (px: number, py: number, cW: number, cH: number, planetRadius = 0) => {
    const CARD_W = 340;
    const CARD_H = 540;
    const gap = 36 + planetRadius * 1.15;
    const fitsRight = px + gap + CARD_W <= cW - 18;
    const fitsLeft = px - gap - CARD_W >= 18;
    let left: number;
    if (fitsRight && (!fitsLeft || px <= cW - px)) {
      left = px + gap;
    } else {
      left = px - gap - CARD_W;
    }
    left = Math.max(18, Math.min(left, cW - CARD_W - 18));
    const top = Math.max(18, Math.min(py - CARD_H / 2, cH - CARD_H - 18));
    return { x: left, y: top };
  };

  // Hover leaves the planets completely frozen — only the card, dimming and
  // label tint react (item 7). Nothing moves from its orbit point.
  const handlePlanetEnter = (id: string, e: React.MouseEvent<HTMLElement>) => {
    setHoveredPageId(id);
    const cont = solarRef.current;
    if (!cont) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cRect = cont.getBoundingClientRect();
    const px = rect.left - cRect.left + rect.width / 2;
    const py = rect.top - cRect.top + rect.height / 2;
    const planet = planets.find((p) => p.page.id === id)?.data;
    const pos = computeCardPos(px, py, cRect.width, cRect.height, planet ? planet.sizePx / 2 : 0);
    setCardPos(pos);
  };

  const hoveredPlanet = hoveredPageId ? planets.find((p) => p.page.id === hoveredPageId) : null;

  return (
    <>
      {/* ---- Full-bleed decorative starfield + comets (covers the section's
           drop region: absolute against the component's static wrapper). ---- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div ref={starDeepRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out">
          {deepStars.map((s, i) => (
            <span
              key={`deep-${i}`}
              className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"}`}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  opacity: s.opacity,
                  boxShadow: "0 0 3px rgba(255,255,255,0.4)",
                  animationDelay: `${s.delay}s`,
                  "--star-base": s.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div ref={starLayerRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out">
          <div
            className={`absolute w-[420px] h-[240px] rounded-full ${motionless ? "" : "nebula-drift"}`}
            style={{
              left: "18%",
              top: "22%",
              background: "radial-gradient(ellipse, rgba(120,110,220,0.16) 0%, rgba(120,110,220,0) 70%)",
              filter: "blur(30px)",
            }}
          />
          <div
            className={`absolute w-[380px] h-[220px] rounded-full ${motionless ? "" : "nebula-drift-slow"}`}
            style={{
              left: "58%",
              top: "58%",
              background: "radial-gradient(ellipse, rgba(60,170,220,0.13) 0%, rgba(60,170,220,0) 70%)",
              filter: "blur(34px)",
            }}
          />
          {stars.map((s, i) => (
            <span
              key={i}
              className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"} ${s.bright ? "star-bright" : ""}`}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  opacity: s.opacity,
                  boxShadow: s.bright ? "0 0 8px 2px rgba(255,255,255,0.45)" : "0 0 4px rgba(255,255,255,0.5)",
                  animationDelay: `${s.delay}s`,
                  "--star-base": s.opacity,
                } as React.CSSProperties
              }
            />
          ))}
          {!motionless &&
            SHOOTING_STARS.map((ss, i) => (
              <span
                key={`shoot-${i}`}
                className="shooting-star star-shooting"
                style={
                  {
                    "--star-top": ss.top,
                    "--star-left": ss.left,
                    "--star-dist": ss.dist,
                    "--star-dur": `${ss.dur}s`,
                    "--star-delay": `${ss.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
        </div>

        <div ref={starNearRef} className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out">
          {nearStars.map((s, i) => (
            <span
              key={`near-${i}`}
              className={`absolute rounded-full bg-white ${motionless ? "" : "star-twinkle"} ${s.bright ? "star-bright" : ""}`}
              style={
                {
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  opacity: s.opacity,
                  boxShadow: s.bright ? "0 0 8px 2px rgba(255,255,255,0.45)" : "0 0 4px rgba(255,255,255,0.5)",
                  animationDelay: `${s.delay}s`,
                  "--star-base": s.opacity,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {comet && (
          <div
            key={comet.key}
            className="comet"
            style={
              {
                top: comet.top,
                left: comet.left,
                "--comet-ang": comet.ang,
                "--comet-dist": comet.dist,
                "--comet-len": comet.len,
                animationDuration: comet.dur,
              } as React.CSSProperties
            }
          />
        )}
      </div>

      {/* ---- Desktop Solar System block ---- */}
      <div
        ref={parallaxRef}
        className="relative hidden lg:block w-full"
        onMouseLeave={() => {
          hideCard();
        }}
        onMouseMove={(e) => {
          if (motionless) return;
          const el = parallaxRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
          const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
          const deep = starDeepRef.current;
          if (deep) deep.style.transform = `translate(${(-nx * 3).toFixed(2)}px, ${(-ny * 2.5).toFixed(2)}px)`;
          const layer = starLayerRef.current;
          if (layer) layer.style.transform = `translate(${(-nx * 10).toFixed(2)}px, ${(-ny * 8).toFixed(2)}px)`;
          const near = starNearRef.current;
          if (near) near.style.transform = `translate(${(-nx * 17).toFixed(2)}px, ${(-ny * 14).toFixed(2)}px)`;
        }}
      >
        <div ref={solarRef} className="relative aspect-square w-full max-w-[920px] mx-auto">
          {planets.map(({ page, data }) => {
            const lit = hoveredPageId === page.id;
            return (
              <div
                key={`ring-${page.id}`}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82F6]/[0.08] pointer-events-none transition-[opacity,border-color] duration-500 ${lit && !motionless ? "orbit-ignite" : ""}`}
                style={{
                  width: `${data.radiusPct * ORBIT_SCALE * 100}%`,
                  height: `${data.radiusPct * ORBIT_SCALE * 100}%`,
                  borderColor: lit ? `${data.color}66` : undefined,
                  opacity: lit ? (motionless ? 0.9 : 0.75) : undefined,
                  "--orbit-color": lit ? data.color : undefined,
                } as React.CSSProperties}
              />
            );
          })}

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none">
            <div
              className={`relative rounded-full ${motionless ? "" : "sun-breathe"}`}
              style={{
                width: 88,
                height: 88,
                background:
                  "radial-gradient(circle at 50% 42%, #FFE9A8 0%, #FFC36B 26%, #F59E0B 58%, #B45309 100%)",
                boxShadow:
                  "0 0 40px rgba(251,191,36,0.55), 0 0 90px rgba(245,158,11,0.35), 0 0 140px rgba(245,158,11,0.18)",
              }}
            >
              <span
                className={`absolute inset-0 rounded-full ${motionless ? "" : "sun-surface-rot"}`}
                style={{
                  backgroundImage: `url(${sunSurfaceUrl})`,
                  backgroundSize: "cover",
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {solarW > 0 &&
            planets.map(({ page, data }, i) => {
              const active = hoveredPageId === page.id;
              const dimmed = !ecoMode && hoveredPageId !== null && !active;
              const color = data.color;
              const angleDeg = resolvedAngles[page.id] ?? positions[page.id] ?? 0;
              const rad = (angleDeg * Math.PI) / 180;
              const R = data.radiusPct * ORBIT_SCALE * orbitHalf;
              const x = Math.cos(rad) * R;
              const y = Math.sin(rad) * R;
              return (
                <div key={page.id} className="absolute z-[30]" style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}>
                  <div className="absolute -translate-x-1/2 -translate-y-1/2">
                    <motion.button
                      type="button"
                      className="flex flex-col items-center gap-1.5 cursor-pointer outline-none"
                      animate={{ opacity: dimmed ? 0.35 : 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      onMouseEnter={(e) => {
                        handlePlanetEnter(page.id, e);
                      }}
                      onMouseLeave={hideCardIfLeavingPlanet}
                      onFocus={() => {
                        setHoveredPageId(page.id);
                      }}
                      onClick={(e) => onNavigate(page.id, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onNavigate(page.id);
                        }
                      }}
                      aria-label={pageNames[page.labelKey]}
                      aria-expanded={active}
                    >
                      <motion.span
                        className={`rounded-full flex items-center justify-center border transition-all ${motionless ? "" : "planet-breathe"}`}
                        animate={{ scale: active ? 1.05 : 1 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        style={{
                          width: data.sizePx + 16,
                          height: data.sizePx + 16,
                          borderColor: `${color}38`,
                          backgroundColor: "#0A0A0B80",
                          "--breathe-delay": `${(i * 0.9) % 6}s`,
                        } as React.CSSProperties}
                      >
                        <PlanetDisc planet={data} size={data.sizePx} ring={data.hasRings} spin={false} lit={active} />
                      </motion.span>
                      <span
                        className="font-mono text-[9px] tracking-widest uppercase whitespace-nowrap"
                        style={{
                          color: active ? color : "#8B8F9C",
                          textShadow: active ? `0 0 12px ${color}` : undefined,
                        }}
                      >
                        {data.name[language]}
                      </span>
                    </motion.button>
                  </div>
                </div>
              );
            })}

          <AnimatePresence>
            {!ecoMode && hoveredPlanet && cardPos && (
              <motion.div
                key={hoveredPageId}
                ref={cardRef}
                className="absolute z-30 w-[340px] max-w-[calc(100%-36px)] rounded-3xl border bg-[#0A0A0B]/95 backdrop-blur-md p-5 shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
                style={{ left: cardPos.x, top: cardPos.y, borderColor: `${hoveredPlanet.data.color}55` }}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onPointerLeave={hideCardIfLeavingCard}
              >
                {renderOverlayCard(hoveredPlanet.page, hoveredPlanet.data)}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {warp && warpLocal && (
              <motion.div
                key={warp.key}
                className="pointer-events-none absolute z-[50]"
                style={{ left: warpLocal.x, top: warpLocal.y }}
                initial={{ opacity: 0.9, scale: 0.15 }}
                animate={{ opacity: 0, scale: 4.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
              >
                <div className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-[#3B82F6] shadow-[0_0_18px_rgba(59,130,246,0.9)]" />
                <div className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}