import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { PlanetItem } from "./cosmos/config";
import { PLANET_VISUAL_RADIUS } from "./cosmos/config";
import { checkCollisions, type Collidable } from "../utils/collision";

/* Runtime collision watchdog (promt3 item 6 / promt4 item 3). Perfectly
   circular, concentric orbits can never cross, and the planets are drawn at
   REAL sizes (PLANET_VISUAL_RADIUS — neighbour radius sums stay below every
   ring gap), so this can never trip; it stays as a safety net in case a body
   is ever nudged off its ring. */
export default function CollisionGuard({
  planets,
  registry,
}: {
  planets: PlanetItem[];
  registry: MutableRefObject<Map<string, THREE.Group>>;
}) {
  useFrame(() => {
    const ready: Collidable[] = [];
    for (const { page, data } of planets) {
      const mesh = registry.current.get(page.id);
      if (mesh) ready.push({ name: data.name.en, radius: PLANET_VISUAL_RADIUS[page.id] ?? data.sizePx / 2, mesh });
    }
    if (ready.length === planets.length) checkCollisions(ready);
  });
  return null;
}