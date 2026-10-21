import { useState, useEffect, useRef } from "react";

// Outils non visuels des simulations d'électricité (couleurs Okabe-Ito, tirage, animation).
export const VERT = '#15803d', ORANGE = '#b45309', BLEU = '#0072b2', VERMILLON = '#d55e00', VIOLET = '#7b2d8e', GRIS = '#475569';
export const alea = l => l[Math.floor(Math.random() * l.length)];
export function usePhase(actif = true) {
  const [ph, setPh] = useState(0), acc = useRef(0);
  useEffect(() => {
    if (!actif) return undefined;
    let id, last = performance.now();
    const boucle = t => { acc.current += (t - last) / 1000; last = t; setPh(acc.current); id = requestAnimationFrame(boucle); };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [actif]);
  return ph;
}
// Points régulièrement espacés le long d'une ligne brisée, qui avancent à la vitesse v (px/s) ; v < 0 : sens inverse
export function pointsSurFil(pts, v, ph, esp = 24) {
  const seg = []; let tot = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); tot += l; }
  const dec = ((v * ph) % esp + esp) % esp, res = [];
  for (let s = dec; s < tot; s += esp) {
    let d = s, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const u = seg[i] ? d / seg[i] : 0;
    res.push([pts[i][0] + u * (pts[i + 1][0] - pts[i][0]), pts[i][1] + u * (pts[i + 1][1] - pts[i][1])]);
  }
  return res;
}
