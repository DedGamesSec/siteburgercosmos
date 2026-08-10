/// <reference lib="webworker" />
import * as satellite from "satellite.js";
import * as Astronomy from "astronomy-engine";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

interface WorkerInitMessage {
  type: "init";
  tleBytes: ArrayBuffer;
  earthPos: [number, number, number];
  earthR: number;
  altMin: number;
  altMax: number;
}

interface WorkerTickMessage {
  type: "tick";
  simTime: number;
}

interface WorkerSunMoonMessage {
  type: "sunmoon";
  time: number;
}

const EARTH_KM = 6371;

let recs: satellite.SatRec[] = [];
let earthPos: [number, number, number] = [0, -45, 800];
let earthR = 170;
let altMin = 200;
let altMax = 42000;

ctx.onmessage = (e: MessageEvent<WorkerInitMessage | WorkerTickMessage | WorkerSunMoonMessage>) => {
  const msg = e.data;
  if (msg.type === "init") {
    earthPos = msg.earthPos;
    earthR = msg.earthR;
    altMin = msg.altMin;
    altMax = msg.altMax;
    recs = [];
    // The main thread sends the whole catalog as one UTF-8 blob (zero-copy
    // transferable) consisting of alternating TLE "line 1" / "line 2" strings,
    // one pair per satellite. twoline2satrec needs both lines of a pair, so
    // iterate two lines at a time.
    const text = new TextDecoder().decode(msg.tleBytes);
    const lines = text.split("\n");
    for (let i = 0; i + 1 < lines.length; i += 2) {
      const line1 = lines[i];
      const line2 = lines[i + 1];
      try {
        recs.push(satellite.twoline2satrec(line1, line2));
      } catch {
        // skip invalid TLE
      }
    }
    ctx.postMessage({ type: "ready", count: recs.length });
    return;
  }

  if (msg.type === "tick") {
    if (recs.length === 0) return;
    const t = new Date(msg.simTime);
    const out = new Float32Array(recs.length * 3);
    let n = 0;
    for (let i = 0; i < recs.length; i++) {
      try {
        const pv = satellite.propagate(recs[i], t);
        const pos = pv.position;
        if (!pos || typeof pos === "boolean") continue;
        const rKm = Math.hypot(pos.x, pos.y, pos.z);
        const altKm = rKm - EARTH_KM;
        if (altKm < altMin || altKm > altMax) continue;
        // ECI/TEME frame: +z = north celestial pole. The scene frame has +y =
        // north (matching raDecDir in the main scene), so swap y/z here.
        let dx = pos.x;
        let dy = pos.z;
        let dz = pos.y;
        const len = Math.hypot(dx, dy, dz) || 1;
        dx /= len;
        dy /= len;
        dz /= len;
        const sceneR = earthR * (1.07 + (altKm / 4000) * 0.55);
        out[n * 3] = earthPos[0] + dx * sceneR;
        out[n * 3 + 1] = earthPos[1] + dy * sceneR;
        out[n * 3 + 2] = earthPos[2] + dz * sceneR;
        n++;
      } catch {
        // skip invalid TLE
      }
    }
    ctx.postMessage({ type: "positions", count: n, positions: out }, [out.buffer]);
  }

  if (msg.type === "sunmoon") {
    // Real Sun/Moon geocentric directions, computed here so the main thread never
    // blocks on the astronomy solver during the opening frames of the flight.
    const run = async () => {
      await new Promise((r) => setTimeout(r, 0));
      try {
        const t = new Date(msg.time);
        const sv = Astronomy.GeoVector(Astronomy.Body.Sun, t, false);
        const mv = Astronomy.GeoVector(Astronomy.Body.Moon, t, false);
        // Same ECI/TEME -> scene frame swap the main thread uses (z<->y).
        const toDir = (x: number, y: number, z: number) => {
          const [dx, dy, dz] = [x, z, y];
          const len = Math.hypot(dx, dy, dz) || 1;
          return [dx / len, dy / len, dz / len] as [number, number, number];
        };
        ctx.postMessage({ type: "sunmoon", sun: toDir(sv.x, sv.y, sv.z), moon: toDir(mv.x, mv.y, mv.z) });
      } catch {
        // Leave the defaults in place on the main thread.
      }
    };
    void run();
    return;
  }
};
