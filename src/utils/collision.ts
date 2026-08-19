import * as THREE from "three";

/* Prints and separates overlapping planets. Orbiting bodies on disjoint rings
   never touch, so this is a watchdog: if a future config ever overlaps two
   orbits, the console reports the clash and pushes the pair apart instead of
   letting them visually merge. */
export type Collidable = {
  name: string;
  /** The node that carries the orbit position (a Group/Mesh position). */
  mesh: THREE.Object3D;
  radius: number;
};

export function checkCollisions(planets: Collidable[]): void {
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      const distance = p1.mesh.position.distanceTo(p2.mesh.position);
      const minDistance = p1.radius + p2.radius;

      if (distance < minDistance) {
        console.warn(`[cosmos] COLLISION: ${p1.name} <-> ${p2.name}`);
        console.warn(`[cosmos]    distance: ${distance.toFixed(2)}, min: ${minDistance.toFixed(2)}`);

        const pushDir = new THREE.Vector3()
          .subVectors(p1.mesh.position, p2.mesh.position)
          .normalize();
        const pushAmount = (minDistance - distance) / 2 + 0.5;
        p1.mesh.position.add(pushDir.clone().multiplyScalar(pushAmount));
        p2.mesh.position.sub(pushDir.multiplyScalar(pushAmount));
      }
    }
  }
}