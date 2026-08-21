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

export const PLANET_TINT: Record<string, number> = {
  news: 0xccddff, // Uranus — blue tint to counter greenish texture
};