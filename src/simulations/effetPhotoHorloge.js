import { useState, useEffect } from 'react';

export const T_FIGE = 1.0;     // instant des images fixes : photons en vol, électrons déjà éjectés
// ---------- horloge de l'animation ----------
// Renvoie le temps (s). Pause : le temps est conservé. window.__T_ANIM__ (réservé aux contrôles automatiques) fige le temps.
export function useHorloge(actif = true) {
  const [t, setT] = useState(T_FIGE);
  useEffect(() => {
    if (!actif) return undefined;
    let raf = 0, dernier = performance.now();
    const boucle = now => { if (now - dernier >= 30) { const dt = Math.min(0.1, (now - dernier) / 1000); dernier = now; setT(v => v + dt); } raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [actif]);
  return typeof window !== 'undefined' && window.__T_ANIM__ != null ? window.__T_ANIM__ : t;
}
