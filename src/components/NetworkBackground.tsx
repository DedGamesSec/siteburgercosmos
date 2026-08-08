import React, { Suspense, lazy } from "react";
import NetworkBackground2D from "./NetworkBackground2D";
import { useDeviceCapability } from "../hooks/useDeviceCapability";

const NetworkBackground3D = lazy(() => import("./three/NetworkBackground3D"));

interface NetworkBackgroundProps {
  zoomFactor?: number;
  warpProgress?: number;
  isEcoMode?: boolean;
  ecoMode?: boolean;
  onSkyStatusChange?: (status: string) => void;
  language?: string;
}

export default function NetworkBackground(props: NetworkBackgroundProps) {
  const { canRender3D } = useDeviceCapability();
  const activeEcoMode = props.isEcoMode ?? props.ecoMode ?? false;

  const use3D = canRender3D && !activeEcoMode;

  if (!use3D) {
    return <NetworkBackground2D {...props} />;
  }

  return (
    <Suspense fallback={<NetworkBackground2D {...props} />}>
      <NetworkBackground3D {...props} />
    </Suspense>
  );
}
