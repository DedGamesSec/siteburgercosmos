import type { PlanetData } from "../ExplorePagesSection";

/* Shared types + kinematics for the orbiting 3D solar system.

   The 7 site planets ride their blue orbit rings exactly where the layout's
   CSS pixels expect: each ring radius `radiusPx` equals the ring div radius
   (radiusPct * ORBIT_SCALE * min(w,h)/2) and spheres are `sizePx` wide, so
   planet <-> ring alignment survives at every container size. */

export type PageRef = { id: string; labelKey: string };
export type PlanetItem = { page: PageRef; data: PlanetData; radiusPx: number };
export type HoverPt = { x: number; y: number };

/* Per-planet kinematics (7 planets, no Earth):
   · orbitSpeed — RELATIVE orbital cadence (Mercury fastest, Neptune slowest,
     same ratios the design brief uses: Mercury 4.15 … Neptune 0.006);
   · rotationSpeed — relative axial spin (sign = retrograde for Venus/Uranus);
   · axialTilt — real inclination (°), Uranus on its side, Venus upside-down.
   No eccentricity: orbits are perfect concentric circles (see promt3 item 5),
   which is what guarantees the rings can never cross each other. */
export type PlanetMotion = { orbitSpeed: number; rotationSpeed: number; axialTilt: number };

export const PLANET_MOTION: Record<string, PlanetMotion> = {
  download: { orbitSpeed: 4.152, rotationSpeed: 0.017, axialTilt: 0.03 }, // Mercury
  comparison: { orbitSpeed: 1.622, rotationSpeed: -0.004, axialTilt: 177.4 }, // Venus (retrograde)
  roadmap: { orbitSpeed: 0.532, rotationSpeed: 0.009, axialTilt: 25.2 }, // Mars
  tech: { orbitSpeed: 0.084, rotationSpeed: 0.008, axialTilt: 3.1 }, // Jupiter (spin slowed for visual comfort)
  about: { orbitSpeed: 0.034, rotationSpeed: 0.018, axialTilt: 26.7 }, // Saturn
  news: { orbitSpeed: 0.012, rotationSpeed: 0.011, axialTilt: 97.8 }, // Uranus (on its side)
  "how-it-works": { orbitSpeed: 0.006, rotationSpeed: 0.012, axialTilt: 28.3 }, // Neptune
};

/* Mercury completes one orbit in ORBIT_CYCLE seconds at 1.0×; the rest scale
   down from there keeping the real ordering. */
export const ORBIT_CYCLE = 60;

export const SUN_RADIUS = 38;

/* Daily VISUAL radius of every planet (px). Real proportions: the shadow of
   a body is a tiny fraction of its orbit, so neighbour radius sums stay well
   below every ring gap (smallest gap Uranus->Neptune = 0.06·ORBIT_SCALE·H/2
   ≈ 25px) and the runtime guard can never trip. The interactive hit area is
   much larger (data.sizePx) and lives on an invisible hover shell (Planet). */
export const PLANET_VISUAL_RADIUS: Record<string, number> = {
  download: 14, // Mercury
  comparison: 18, // Venus
  roadmap: 15, // Mars
  tech: 32, // Jupiter
  about: 28, // Saturn
  news: 18, // Uranus
  "how-it-works": 16, // Neptune
};

export const PLANET_TINT: Record<string, number> = {};

export interface RingLayer {
  inner: number;
  outer: number;
  color: string;
  opacity: number;
  textured?: boolean;
  arcPosition?: number;   // Neptune arc center (radians)
  arcWidth?: number;      // Neptune arc width (radians)
  arcBrightness?: number; // Neptune arc brightness multiplier
}

export const PLANET_RINGS: Record<string, RingLayer[]> = {
  tech: [ // Jupiter — faint dust rings (brightened)
    { inner: 1.15, outer: 1.5, color: "#b0a090", opacity: 0.35 },
    { inner: 1.55, outer: 1.85, color: "#a09080", opacity: 0.25 },
  ],
  about: [ // Saturn — C Ring + B Ring + Cassini division (A Ring removed)
    { inner: 1.1, outer: 1.3, color: "#7a6a5a", opacity: 0.35 },
    { inner: 1.35, outer: 1.9, color: "#c4b896", opacity: 0.62 },
    { inner: 1.95, outer: 2.0, color: "#2a2012", opacity: 0.7 },
  ],
  news: [ // Uranus — light blue rings with dark stripe details
    { inner: 1.15, outer: 1.35, color: "#7a9aaa", opacity: 0.5 },
    { inner: 1.4, outer: 1.6, color: "#8aacbc", opacity: 0.45 },
    { inner: 1.62, outer: 1.65, color: "#2a4a5a", opacity: 0.3 },
    { inner: 1.65, outer: 1.85, color: "#6a8a9a", opacity: 0.4 },
    { inner: 1.9, outer: 2.2, color: "#9abccc", opacity: 0.55 },
    { inner: 2.22, outer: 2.25, color: "#2a4a5a", opacity: 0.3 },
    { inner: 2.25, outer: 2.55, color: "#7a9aaa", opacity: 0.4 },
    { inner: 2.6, outer: 2.8, color: "#6a8a9a", opacity: 0.3 },
  ],
  "how-it-works": [ // Neptune — dark rings with arcs (brightened)
    { inner: 1.15, outer: 1.5, color: "#4a6aaa", opacity: 0.4 },
    { inner: 1.55, outer: 1.75, color: "#3a5a8a", opacity: 0.35, arcPosition: 0, arcWidth: Math.PI / 3, arcBrightness: 4.0 },
    { inner: 1.8, outer: 1.95, color: "#5a7aaa", opacity: 0.3, arcPosition: Math.PI, arcWidth: Math.PI / 4, arcBrightness: 3.0 },
    { inner: 2.0, outer: 2.3, color: "#4a6aaa", opacity: 0.25 },
  ],
};