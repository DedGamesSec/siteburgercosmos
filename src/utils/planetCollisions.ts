/* ---- Screen-space planet collision resolution (item 10, hardened for the
   item-11 size curve) ----
   Pure, DOM-free helper used by the solar-system block. Every body provides
   its screen-space centre (orbit position) and its rendered radius; when two
   discs overlap (or get closer than `padding`), positions are corrected by
   moving bodies ALONG their own orbit (constant orbit radius, only the angle
   changes), so each planet stays exactly on its own circle.

   The resolver uses a full-circle azimuth search: for each overlapping body it
   finds the orbit angle that minimises the squared clearance deficit against
   every other body and walks toward it. This escapes the failure mode of a
   pure greedy two-body push — when a planet is squeezed between two neighbours
   A and B, any one-sided nudge it can try immediately worsens one of the two
   overlaps, so a plain "push away from this pair" gets stuck in a local
   equilibrium and leaves a visible overlap (this showed as −40..−100px residual
   during real Jupiter/Mars/Venus-style conjunctions over the test years).
   Nothing here touches positions/state; callers feed the result back into the
   shared layout. */

export interface PlanetPosition {
  id: string;
  /** Screen-space x (px), relative to the orbit centre (the Sun). */
  x: number;
  /** Screen-space y (px), relative to the orbit centre (the Sun). */
  y: number;
  /** Rendered radius of the disc (px) — half of `sizePx`. */
  r: number;
}

/** How far two discs must stay apart (px) — sum of radii plus breathing room. */
export function minPlanetDist(a: PlanetPosition, b: PlanetPosition, padding = 8): number {
  return a.r + b.r + padding;
}

const TWO_PI = Math.PI * 2;
/** Azimuths probed per body per pass; 36 gives 10° resolution everywhere. */
const SAMPLES = 36;
/** Angular walk per pass toward the best azimuth (rad) — small enough not to
    overshoot past a clear slot, large enough to make progress fast. */
const WALK_STEP = 0.14;
/** Iteration cap. Conjunction windows need deep walks, but a full escape is
    always found well before this; the loop also breaks early on stability. */
const MAX_PASSES = 500;

/**
 * Resolve overlapping planet discs by moving the smaller member of each pair
 * along its orbit. Returns a NEW array (originals are untouched); the planets
 * keep their orbit radii, so the correction is a pure angular deviation.
 */
export function resolvePlanetCollisions(positions: PlanetPosition[], padding = 8): PlanetPosition[] {
  const out = positions.map((p) => ({ ...p }));
  if (out.length < 2) return out;

  // Orbit radius per body — recovered from its screen position (a planet never
  // leaves its own circle, so hypot(x,y) is stable across the resolution).
  const orbitR: number[] = out.map((p) => Math.hypot(p.x, p.y));

  const violationAt = (i: number, ang: number): number => {
    const x = orbitR[i] * Math.cos(ang);
    const y = orbitR[i] * Math.sin(ang);
    let v = 0;
    for (let j = 0; j < out.length; j++) {
      if (j === i) continue;
      const dx = out[j].x - x;
      const dy = out[j].y - y;
      const d = Math.hypot(dx, dy);
      const need = out[i].r + out[j].r + padding;
      if (d < need) {
        const deficit = need - d;
        v += deficit * deficit;
      }
    }
    return v;
  };

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      const cur = Math.atan2(out[i].y, out[i].x);
      if (orbitR[i] <= 1e-8 || violationAt(i, cur) < 1e-9) continue;
      // Full-circle search for the azimuth that clears every neighbour.
      let best = cur;
      let bestV = Infinity;
      for (let s = 0; s < SAMPLES; s++) {
        const a = (s / SAMPLES) * TWO_PI;
        const v = violationAt(i, a);
        if (v < bestV) {
          bestV = v;
          best = a;
        }
      }
      // Walk along the short way from the current angle to the best one.
      const delta = ((best - cur + Math.PI * 3) % TWO_PI) - Math.PI;
      const step = Math.max(0.004, Math.min(WALK_STEP, Math.abs(delta)));
      const next = cur + Math.sign(delta) * step;
      out[i].x = orbitR[i] * Math.cos(next);
      out[i].y = orbitR[i] * Math.sin(next);
      moved = true;
    }
    if (!moved) break;
  }
  return out;
}