// Hooks de la simulation 314 : tirages de photons d'un plasma (histogramme des longueurs d'onde) et animation du dernier photon dans le polychromateur.
import { useState, useEffect, useRef } from "react";
import * as M from "./icpModele";
import { reduitMouvement } from "./hookHorloge";
export { useBoucle } from "./flammeHook";

const CAD = { 10: { periode: 1300, par: 1 }, 100: { periode: 260, par: 1 }, 1000: { periode: 100, par: 10 } };
export function useTiragesIcp() {
  const [T, setT] = useState(M.T_PLASMA), [brut, setBrut] = useState(() => M.etatVide(M.T_PLASMA));
  const [play, setPlay] = useState(null), [rejeu, setRejeu] = useState(0), [demo, setDemo] = useState(null), [manuel, setManuel] = useState(null), [vitDemo, setVitDemo] = useState('lent');
  const TRef = useRef(T);
  useEffect(() => { TRef.current = T; });
  const etat = brut.T === T ? brut : M.etatVide(T);
  const tirer = k => setBrut(e => { const avant = e.T === TRef.current ? e.n : 0, nv = M.lancer(e, TRef.current, k, Math.random); return { ...nv, lotRes: nv.n - avant }; });
  const quitterDemo = () => { setDemo(null); setManuel(null); };
  const jouerScenario = sc => { setPlay(null); setManuel(null); setDemo(d => ({ sc, cle: (d?.cle ?? 0) + 1 })); };
  const lancerK = k => { quitterDemo(); if (k === 1) { setPlay(null); tirer(1); return; } const c = CAD[k]; tirer(c.par); setPlay(k - c.par > 0 ? { restant: k - c.par, ...c } : null); };
  const regler = nouvelleT => { setPlay(null); quitterDemo(); setT(nouvelleT); };
  const effacer = () => { quitterDemo(); setPlay(null); setBrut(M.etatVide(TRef.current)); };
  const rejouer = () => (demo ? jouerScenario(demo.sc) : setRejeu(r => r + 1));
  const plein = etat.n >= M.MAX_PHOTONS, actif = !!play && !plein, periode = play?.periode, par = play?.par;
  useEffect(() => {
    if (!actif) return undefined;
    const id = setInterval(() => { tirer(par); setPlay(p => (p && p.restant - par > 0 ? { ...p, restant: p.restant - par } : null)); }, periode);
    return () => clearInterval(id);
  }, [actif, periode, par]);
  const anime = etat.lot === 1 && !reduitMouvement();
  const dureeAnim = actif && par === 1 ? Math.round(periode * 0.88) : 3200;
  const dureeDemo = { normal: 4500, lent: 10000, tres: 22000 }[vitDemo];
  return { T, etat, rejeu, rejouer, demo, manuel, setManuel, vitDemo, setVitDemo, dureeDemo, jouerScenario, quitterDemo, lancer: lancerK, regler, effacer, plein, anime, dureeAnim, lecture: actif, restant: play?.restant ?? 0 };
}

// ---------- légende de l'animation d'un photon dans le polychromateur ----------
export function legendeIcp(ph, p) {
  if (!ph) return 'Cliquez sur « 1 photon » : un photon émis par le plasma va traverser le polychromateur.';
  const r = M.raie(ph.s), L = `${Math.round(ph.lam)}${' '}nm`;
  if (p < 0.4) return `1. Un photon émis par un atome de ${r.nom} entre dans le polychromateur par la fente.`;
  if (p < 0.95) return `2. Le réseau dévie le photon (θ ≈ ${Math.round(M.angleReseau(ph.lam))}° pour ${L}) : plus λ est grande, plus l’angle est grand.`;
  return `3. Il arrive sur le pixel de ${L} : un coup est compté pour le ${r.nom}.`;
}
export const texteEvenementIcp = d => (!d ? 'rien tiré pour l’instant' : `dernier photon détecté : ${M.raie(d.s).nom} (${Math.round(d.lam)}${' '}nm)`);
