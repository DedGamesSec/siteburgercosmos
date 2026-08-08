import { useEffect, useState } from "react";

export interface DeviceCapability {
  /** True when the device can run the 3D WebGL hero scene */
  canRender3D: boolean;
  /** True when prefers-reduced-motion is active */
  prefersReducedMotion: boolean;
  /** True when the device is a weak Android (low cores / no GPU memory) */
  isLowEnd: boolean;
  /** True on coarse pointers (mobile / tablet) */
  isCoarsePointer: boolean;
  /** WebGL support flag (false = no WebGL at all) */
  webgl: boolean;
  /** Number of CPU cores, clamped (0 when unknown) */
  cores: number;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}

function detectLowEnd(): boolean {
  const cores = navigator.hardwareConcurrency || 0;
  if (cores > 0 && cores < 4) return true;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (memory && memory <= 2) return true;
  return false;
}

export function useDeviceCapability(): DeviceCapability {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webgl, setWebgl] = useState<boolean>(() =>
    typeof window === "undefined" ? false : detectWebGL()
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 0 : 0;
  const isLowEnd = detectLowEnd();
  const isCoarsePointer =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  return {
    canRender3D: webgl && !isLowEnd && !prefersReducedMotion,
    prefersReducedMotion,
    isLowEnd,
    isCoarsePointer,
    webgl,
    cores,
  };
}
