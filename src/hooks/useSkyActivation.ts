import { useEffect } from "react";
import { parseTLEs, fetchSmallBodyElements, SMALL_BODIES, type LiveSatellite, type SmallBodyDef } from "../utils/skyCalculations";

// Session-scoped cache for satellites and small bodies
export let cachedSatellites: LiveSatellite[] | null = null;
export let cachedSmallBodies: SmallBodyDef[] = SMALL_BODIES;
export let isFetchingTLEs = false;
export let isFetchingSmallBodies = false;

export function useSkyActivation(activeEcoMode: boolean = false) {
  useEffect(() => {
    if (activeEcoMode) return;

    // Both fetches are deferred off the critical window of the intro flight:
    // satellites aren't rendered until the flight approaches Earth (p~0.8) and
    // small bodies are only drawn in the background layers, so nothing needs
    // them during the first seconds of the page. Racing a 12k-satellite
    // download + parse against the WebGL boot is what froze the opening frames.
    const tleTimer = setTimeout(() => {
      if (cachedSatellites === null && !isFetchingTLEs) {
        isFetchingTLEs = true;
        const fetchTLEs = async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);
            const res = await fetch(
              "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (res.ok) {
              const text = await res.text();
              cachedSatellites = await parseTLEs(text);
            } else {
              cachedSatellites = [];
            }
          } catch {
            cachedSatellites = [];
          }
          isFetchingTLEs = false;
        };
        fetchTLEs();
      }
    }, 2500);

    const smallBodyTimer = setTimeout(() => {
      if (!isFetchingSmallBodies && cachedSmallBodies === SMALL_BODIES) {
        isFetchingSmallBodies = true;
        fetchSmallBodyElements().then((bodies) => {
          if (bodies && bodies.length > 0) {
            cachedSmallBodies = bodies;
          }
          isFetchingSmallBodies = false;
        }).catch(() => {
          isFetchingSmallBodies = false;
        });
      }
    }, 2500);

    return () => {
      clearTimeout(tleTimer);
      clearTimeout(smallBodyTimer);
    };
  }, [activeEcoMode]);

  return {
    cachedSatellites,
    cachedSmallBodies,
  };
}
