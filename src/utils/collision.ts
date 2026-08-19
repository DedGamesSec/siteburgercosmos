import * as THREE from "three";

/* Runtime collision watchdog (promt3 item 6). The orbits are perfect
   concentric circles that can never cross, so this only trips while two of
   the oversized design spheres are aligned on neighbouring rings (a transient
   "conjunction"). Warnings are de-duplicated (one per contact, released when
   the pair pulls apart) so a slow outer pair can't spam the console during a
   long alignment, and the gentle push only nudges the current frame — the
   orbit loop restores exact ring positions on the next tick. */
export type Collidable = {
  name: string;
  /** The node that carries the orbit position (a Group/Mesh position). */
  mesh: THREE.Object3D;
  radius: number;
};

const contacting = new Set<string>();

export function checkCollisions(planets: Collidable[]): void {
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      const distance = p1.mesh.position.distanceTo(p2.mesh.position);
      const minDistance = p1.radius + p2.radius + 2; // +2 buffer (promt3 item 6)
      const key = `${p1.name}\u0000${p2.name}`;

      if (distance < minDistance) {
        if (!contacting.has(key)) {
          contacting.add(key);
          console.warn(
            `[cosmos] COLLISION: ${p1.name} <-> ${p2.name} (distance ${distance.toFixed(1)}px < ${minDistance.toFixed(1)}px)`
          );
        }

        const pushDir = new THREE.Vector3()
          .subVectors(p1.mesh.position, p2.mesh.position)
          .normalize();
        const push = (minDistance - distance) / 2 + 0.5;
        p1.mesh.position.add(pushDir.clone().multiplyScalar(push));
        p2.mesh.position.sub(pushDir.multiplyScalar(push));
      } else if (distance > minDistance + 4) {
        // Encounter over — allow the next close approach to warn again.
        contacting.delete(key);
      }
    }
  }
}