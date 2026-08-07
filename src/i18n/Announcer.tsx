import React, { useEffect, useRef, useState } from "react";

// A tiny aria-live announcer shared across the app. Components call
// announce(text) to surface non-visual state changes to assistive tech.
let currentHandler: ((text: string) => void) | null = null;

export function announce(text: string) {
  currentHandler?.(text);
}

export default function Announcer() {
  const [message, setMessage] = useState<string>("");
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentHandler = (text) => setMessage(text);
    return () => {
      currentHandler = null;
    };
  }, []);

  return (
    <div
      ref={liveRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="aria-live-region"
    >
      {message}
    </div>
  );
}