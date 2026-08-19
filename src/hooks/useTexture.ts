import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

function neutralTexture(color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Local texture loading with sRGB colour space and a visible fallback
   (promt3 item 7): if the map is missing or fails, it logs and a neutral-
   coloured canvas texture is used instead of a black mesh. No suspense — the
   mesh renders immediately and swaps when the map arrives. */
export function useTexture(src: string, fallbackColor = "#3a2e26"): THREE.Texture {
  const fallback = useMemo(() => neutralTexture(fallbackColor), [fallbackColor]);
  const [map, setMap] = useState<THREE.Texture>(fallback);
  useEffect(() => {
    let alive = true;
    setMap(fallback);
    const tex = new THREE.TextureLoader().load(
      src,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        if (alive) setMap(t);
      },
      undefined,
      (err) => console.error(`[cosmos] texture error: ${src}`, err)
    );
    return () => {
      alive = false;
      tex.dispose();
    };
  }, [src, fallback]);
  return map;
}