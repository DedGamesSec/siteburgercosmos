// three >= r160 no longer ships type declarations for its example loaders.
// This ambient module types the GLTFLoader surface used by the planet scene
// (ExplorerPagesSection) with `moduleResolution: bundler`.

declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  import type * as THREE from "three";

  export interface GLTF {
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
  }

  export class GLTFLoader {
    constructor(manager?: unknown);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): void;
  }
}