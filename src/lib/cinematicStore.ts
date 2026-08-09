import { useSyncExternalStore } from "react";

export const cinematicProgressRef: { current: number } = { current: 0 };

const listeners = new Set<() => void>();

export function subscribeCinematic(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCinematicProgress(): number {
  return cinematicProgressRef.current;
}

export function setCinematicProgressValue(value: number): void {
  if (value === cinematicProgressRef.current) return;
  cinematicProgressRef.current = value;
  listeners.forEach((l) => l());
}

export function useCinematicProgress(): number {
  return useSyncExternalStore(subscribeCinematic, getCinematicProgress);
}
