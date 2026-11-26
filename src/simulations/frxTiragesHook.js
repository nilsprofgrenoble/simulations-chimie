// Hooks des tirages de la simulation 302 : progression d'une animation et état cumulé des atomes irradiés.
import { useState, useEffect, useRef } from "react";
import * as X from "./frxTirages";
import { element } from "./frxModele";
import { reduitMouvement } from "./hookHorloge";

// Progression p de 0 à 1 de l'animation d'un événement (recommence à chaque nouvelle `cle`). Sans animation (mouvement réduit, tirages rapides) : p = 1 tout de suite.
export function useProgres(cle, duree, anime) {
  const [s, setS] = useState({ cle, p: 0 });
  const dRef = useRef(duree);
  useEffect(() => { dRef.current = duree; }, [duree]);
  useEffect(() => {
    if (!anime || cle === 0) return undefined;
    let id, t0 = null;
    const boucle = ts => { if (t0 == null) t0 = ts; const p = Math.min(1, (ts - t0) / dRef.current); setS({ cle, p }); if (p < 1) id = requestAnimationFrame(boucle); };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [cle, anime]);
  return !anime || cle === 0 ? 1 : s.cle === cle ? s.p : 0;
}

const INIT = { el: 'Fe', E: 9, w: 100, courbe: false, vitesse: 'lent' };
// Cadence de lecture : atomes lancés par tick (par) toutes les `periode` ms. Un atome à la fois = animation ; un paquet = pas d'animation individuelle.
const CAD_LOT = { 10: { periode: 1300, par: 1 }, 100: { periode: 260, par: 1 }, 1000: { periode: 100, par: 10 } };
const CAD_LECTURE = { lent: { periode: 5000, par: 1 }, normal: { periode: 3000, par: 1 }, rapide: { periode: 100, par: 5 } };
export function useTiragesX(init) {
  const [t, setT] = useState(() => ({ ...INIT, ...init, etat: X.etatVide() }));
  const [play, setPlay] = useState(null);                       // { restant, periode, par } ou null
  const [rejeu, setRejeu] = useState(0);
  const [demo, setDemo] = useState(null), [manuel, setManuel] = useState(null), [vitDemo, setVitDemo] = useState('lent');   // démonstration d'un scénario seul
  const el = element(t.el);
  const tirer = k => setT(s => ({ ...s, etat: X.lancer(s.etat, element(s.el), s, k, Math.random) }));
  const quitterDemo = () => { setDemo(null); setManuel(null); };
  const jouerScenario = sc => { setPlay(null); setManuel(null); setDemo(d => ({ sc, cle: (d?.cle ?? 0) + 1 })); };
  const lancer = k => {
    quitterDemo();
    if (k === 1) { setPlay(null); tirer(1); return; }
    const c = CAD_LOT[k]; tirer(c.par); setPlay(k - c.par > 0 ? { restant: k - c.par, ...c } : null);
  };
  const basculeLecture = () => { quitterDemo(); setPlay(p => (p ? null : { restant: Infinity, ...CAD_LECTURE[t.vitesse] })); };
  const arreter = () => setPlay(null);
  const regler = patch => {
    if ('vitesse' in patch) setPlay(p => (p && p.restant === Infinity ? { restant: Infinity, ...CAD_LECTURE[patch.vitesse] } : p));
    setT(s => ({ ...s, ...patch, etat: ['el', 'E', 'w'].some(c => c in patch && patch[c] !== s[c]) ? X.etatVide() : s.etat }));
  };
  const effacer = () => { quitterDemo(); setPlay(null); setT(s => ({ ...s, etat: X.etatVide() })); };
  const reinit = cfg => { setPlay(null); setT({ ...INIT, ...cfg, etat: X.etatVide() }); };
  const rejouer = () => (demo ? jouerScenario(demo.sc) : setRejeu(r => r + 1));
  const plein = t.etat.nEnv >= X.MAX_ATOMES;
  const actif = !!play && !plein, periode = play?.periode, par = play?.par;
  useEffect(() => {
    if (!actif) return undefined;
    const id = setInterval(() => { tirer(par); setPlay(p => (p && p.restant - par > 0 ? { ...p, restant: p.restant - par } : null)); }, periode);
    return () => clearInterval(id);
  }, [actif, periode, par]);
  const anime = t.etat.lot === 1 && !reduitMouvement();
  const dureeAnim = actif && par === 1 ? Math.round(periode * 0.88) : t.vitesse === 'lent' ? 4500 : 2800;
  const dureeDemo = { normal: 4500, lent: 10000, tres: 22000 }[vitDemo];
  return { demo, manuel, setManuel, vitDemo, setVitDemo, dureeDemo, jouerScenario, quitterDemo, t, el, rejeu, rejouer, lancer, regler, effacer, reinit, lecture: actif, restant: play?.restant ?? 0, basculeLecture, arreter, plein, anime, dureeAnim };
}
