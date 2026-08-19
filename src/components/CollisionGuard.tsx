import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { PlanetItem } from "./cosmos/config";
import { checkCollisions, type Collidable } from "../utils/collision";

/* Runtime collision watchdog (promt3 item 6). Perfectly circular, concentric
   orbits can never cross, so this only trips if a planet is ever nudged off
   its ring; when a pair overlaps it warns and pushes the two bodies apart.
   Hoisted (not re-created on each parent render) so the R3F subtree never
   remounts when the speed slider changes. */
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
      if (mesh) ready.push({ name: data.name.en, radius: data.sizePx / 2, mesh });
    }
    if (ready.length === planets.length) checkCollisions(ready);
  });
  return null;
}