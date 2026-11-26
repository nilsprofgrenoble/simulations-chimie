// Horloge d'animation de la simulation 304 : phase (radians) qui avance à la fréquence f (Hz) tant que `actif` est vrai.
import { useEffect, useRef, useState } from "react";
export const reduitMouvement = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function usePhase(f, actif, phase0 = Math.PI / 2) {
  const [ph, setPh] = useState(phase0);
  const fRef = useRef(f);
  useEffect(() => { fRef.current = f; }, [f]);
  useEffect(() => {
    if (!actif) return undefined;
    let id, prev = null;
    const boucle = ts => { if (prev != null) setPh(p => p + 2 * Math.PI * fRef.current * Math.min(0.05, (ts - prev) / 1000)); prev = ts; id = requestAnimationFrame(boucle); };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [actif]);
  return ph;
}
