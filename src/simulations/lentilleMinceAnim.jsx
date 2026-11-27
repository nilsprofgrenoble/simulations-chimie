/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useCallback } from "react";
import { reduitMouvement } from "./hookHorloge";

// ====================================================
//  Animation de la lentille mince (sim 115) : lumière qui circule le long des trois rayons, tracé pas à pas.
//  Deux vues :
//    « boucle » : un photon par rayon part de B et file vers l'écran ; les trois arrivent en même temps (principe de Fermat)
//                 et tombent au même point si l'écran est sur l'image nette, en trois points séparés sinon ;
//    « pas »    : on trace un rayon après l'autre (①, ②, ③), puis l'image apparaît ; curseur d'instant et ralenti.
//  Calcul pur (chemins, coupe d'une ligne brisée) séparé du dessin ; l'horloge a la même interface que useLecture (exploAnim).
// ====================================================

export const T_BOUCLE = 3.2;      // durée d'un aller (s à vitesse ×1)
export const T_RAYON = 2.6;       // durée du tracé d'un rayon en vue « pas à pas »
export const T_FIN = 1.6;         // durée de l'apparition de l'image en vue « pas à pas »

// longueur d'une ligne brisée de points [x, y]
export const longueur = pts => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

// portion de la ligne brisée comprise entre l'origine et la fraction u (0..1) de sa longueur : { pts, pointe }
export function coupe(pts, u) {
  const L = longueur(pts), cible = Math.max(0, Math.min(1, u)) * L;
  const sortie = [pts[0]]; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= cible - 1e-9) {
      const f = seg > 0 ? (cible - acc) / seg : 0;
      const q = [pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + f * (pts[i][1] - pts[i - 1][1])];
      sortie.push(q); return { pts: sortie, pointe: q };
    }
    acc += seg; sortie.push(pts[i]);
  }
  return { pts: sortie, pointe: pts[pts.length - 1] };
}

// durée totale de la vue « pas à pas » pour n rayons
export const dureePas = n => n * T_RAYON + T_FIN;
// fraction (0..1) du rayon k tracée à l'instant t en vue « pas à pas »
export const fractionRayon = (t, k) => Math.max(0, Math.min(1, (t - k * T_RAYON) / T_RAYON));

// Horloge : boucle (t revient à 0) ou lecture unique (s'arrête à T). Même interface que useLecture de exploAnim.
export function useHorloge(T, boucle) {
  const [t, setT] = useState(0), [joue, setJoue] = useState(() => !reduitMouvement()), [vit, setVit] = useState(1), [touche, setTouche] = useState(false);
  const tRef = useRef(0);
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => {
    if (!joue) return undefined;
    let id, prev = null;
    const f = ts => {
      if (prev != null) {
        const y = tRef.current + Math.min(0.05, (ts - prev) / 1000) * vit;
        if (boucle) { tRef.current = y % T; setT(tRef.current); }
        else if (y >= T) { tRef.current = T; setT(T); setJoue(false); return; }
        else { tRef.current = y; setT(y); }
      }
      prev = ts; id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [joue, vit, boucle, T]);
  const demarrer = useCallback(() => { tRef.current = 0; setT(0); setJoue(true); setTouche(true); }, []);
  const reset = useCallback(() => { setJoue(false); tRef.current = 0; setT(0); }, []);
  const poser = useCallback(v => { tRef.current = v; setT(v); }, []);
  return { t, setT: poser, joue, setJoue, vit, setVit, fin: !boucle && t >= T - 1e-9, demarrer, reset, touche, setTouche };
}

// Couche dessinée dans le banc : photons (vue boucle) ou rayons tracés progressivement (vue pas à pas).
// chemins : [{ pts: [[x, y], …] en pixels du schéma, c: couleur }] ; lum : { t, mode } ; virtuelle : dessine les prolongements en pointillés à la fin du tracé.
export function CouchePhotons({ chemins, lum, prolongements = [] }) {
  if (!lum) return null;
  const n = chemins.length, k0 = lum.k || 1;
  if (lum.mode === 'pas') {
    const fini = lum.t >= n * T_RAYON;
    return (
      <g pointerEvents="none">
        {chemins.map((ch, k) => {
          const u = fractionRayon(lum.t, k);
          if (u <= 0) return null;
          const { pts, pointe } = coupe(ch.pts, u);
          return (
            <g key={k}>
              <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={ch.c} strokeWidth={2.6 * k0} strokeLinejoin="round" strokeLinecap="round"/>
              {u < 1 && <g><circle cx={pointe[0]} cy={pointe[1]} r={13 * k0} fill={ch.c} opacity="0.22"/><circle cx={pointe[0]} cy={pointe[1]} r={6.5 * k0} fill={ch.c} stroke="#fff" strokeWidth={2 * k0}/></g>}
            </g>);
        })}
        {fini && prolongements.map((p, k) => <line key={`p${k}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke={p.c} strokeWidth={1.8 * k0} strokeDasharray="5 4"/>)}
      </g>);
  }
  const u = (lum.t / T_BOUCLE) % 1, vol = Math.min(u / 0.8, 1), impact = u > 0.8 ? (u - 0.8) / 0.2 : 0;
  return (
    <g pointerEvents="none">
      {chemins.map((ch, k) => {
        const { pointe } = coupe(ch.pts, vol);
        const fin = ch.pts[ch.pts.length - 1];
        return (
          <g key={k}>
            {impact === 0 && [3, 2, 1].map(j => { const q = coupe(ch.pts, Math.max(0, vol - 0.035 * j)).pointe; return <circle key={j} cx={q[0]} cy={q[1]} r={(6.5 - j * 1.3) * k0} fill={ch.c} opacity={0.5 - j * 0.12}/>; })}
            {impact === 0 && <g><circle cx={pointe[0]} cy={pointe[1]} r={13 * k0} fill={ch.c} opacity="0.22"/><circle cx={pointe[0]} cy={pointe[1]} r={6.5 * k0} fill={ch.c} stroke="#fff" strokeWidth={2 * k0}/></g>}
            {impact > 0 && <circle cx={fin[0]} cy={fin[1]} r={(5 + 20 * impact) * k0} fill="none" stroke={ch.c} strokeWidth={3 * k0} opacity={1 - impact}/>}
          </g>);
      })}
    </g>);
}

export const ETAPES_PAS = (nature, nRayons) => {
  const tous = [
    [1, 'Le rayon parallèle à l’axe ressort en passant par F′.'],
    [2, 'Le rayon qui passe par O n’est pas dévié.'],
    [3, nature === 'virtuelle' ? 'Le rayon dirigé vers F ressort parallèle à l’axe.' : 'Le rayon qui passe par F ressort parallèle à l’axe.'],
  ].slice(0, nRayons);
  const dernier = nature === 'virtuelle'
    ? 'Les rayons ne se coupent pas : leurs prolongements (pointillés) se coupent en B′, sommet de l’image virtuelle.'
    : 'Les rayons se coupent en B′ : c’est le sommet de l’image réelle.';
  return [...tous, [4, dernier]];
};
