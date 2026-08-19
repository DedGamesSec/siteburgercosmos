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
  download: { orbitSpeed: 4.15, rotationSpeed: 0.005, axialTilt: 0.03 },
  comparison: { orbitSpeed: 1.62, rotationSpeed: -0.002, axialTilt: 177.4 },
  roadmap: { orbitSpeed: 0.53, rotationSpeed: 0.009, axialTilt: 25.2 },
  tech: { orbitSpeed: 0.084, rotationSpeed: 0.02, axialTilt: 3.1 },
  about: { orbitSpeed: 0.034, rotationSpeed: 0.018, axialTilt: 26.7 },
  news: { orbitSpeed: 0.012, rotationSpeed: 0.011, axialTilt: 97.8 },
  "how-it-works": { orbitSpeed: 0.006, rotationSpeed: 0.012, axialTilt: 28.3 },
};

/* Mercury completes one orbit in ORBIT_CYCLE seconds at 1.0×; the rest scale
   down from there keeping the real ordering. */
export const ORBIT_CYCLE = 60;

export const SUN_RADIUS = 44;