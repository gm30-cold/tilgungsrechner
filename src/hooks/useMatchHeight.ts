// Hilfs-Hook: misst die Höhe eines Referenz-Elements mit einem ResizeObserver
// und gibt sie als number zurück. Damit kann eine andere Komponente ihre
// eigene Höhe an die gemessene koppeln.

import { useEffect, useRef, useState } from "react";

export function useMatchHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, height };
}
