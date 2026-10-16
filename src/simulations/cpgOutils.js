// Outils partagés par les simulations CPG (sim 54) et CPG/SM (sim 55)
import { useState, useEffect } from "react";

export function useLargeur(ref) {
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const maj = () => setW(Math.max(280, Math.floor(el.getBoundingClientRect().width)));
    maj();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', maj); return () => window.removeEventListener('resize', maj); }
    const ro = new ResizeObserver(maj);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function pasTemps(d) { return [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find(s => d / s <= 8) || 100; }
export function grille(a, xa, xb) {
  const ts = [];
  for (let i = 0; i <= 500; i++) ts.push(xa + (xb - xa) * i / 500);
  a.pics.forEach(m => {
    const g = Math.max(xa, m.tr - 5 * m.sigma - 5 * m.tauF), d = Math.min(xb, m.tr + 5 * m.sigma + 6 * m.tauQ);
    for (let i = 0; i <= 160 && d > g; i++) ts.push(g + (d - g) * i / 160);
  });
  return ts.sort((x, y) => x - y);
}
