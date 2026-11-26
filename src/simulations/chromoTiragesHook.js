// Hook des tirages de la simulation 303 : état cumulé, file de lecture (un photon à la fois = animé ; paquets = non animé), démonstration d'un scénario seul.
// L'état repart de zéro dès que le spectre change (λmax, concentration, mode) : repéré par une signature.
import { useState, useEffect, useRef } from "react";
import * as X from "./chromoTirages";
import { reduitMouvement } from "./hookHorloge";

const CAD_LOT = { 10: { periode: 1300, par: 1 }, 100: { periode: 260, par: 1 }, 1000: { periode: 100, par: 10 } };
const CAD_LECTURE = { lent: { periode: 5000, par: 1 }, normal: { periode: 3000, par: 1 }, rapide: { periode: 100, par: 5 } };
export function useTiragesUV(lam0) {
  const [t, setT] = useState({ amax: 1, mode: 'hasard', lamChoisi: 450, courbe: false, vitesse: 'lent', etat: X.etatVide('') });
  const [play, setPlay] = useState(null);
  const [rejeu, setRejeu] = useState(0);
  const [demo, setDemo] = useState(null), [manuel, setManuel] = useState(null), [vitDemo, setVitDemo] = useState('lent');
  const params = { lam0, amax: t.amax, mode: t.mode, lamChoisi: t.lamChoisi };
  const pRef = useRef(params);
  useEffect(() => { pRef.current = params; });
  const sig = X.sigDe(params);
  const etat = t.etat.sig === sig ? t.etat : X.etatVide(sig);
  const tirer = k => setT(s => ({ ...s, etat: X.lancer(s.etat, pRef.current, k, Math.random) }));
  const quitterDemo = () => { setDemo(null); setManuel(null); };
  const jouerScenario = sc => { setPlay(null); setManuel(null); setDemo(d => ({ sc, cle: (d?.cle ?? 0) + 1 })); };
  const lancer = k => {
    quitterDemo();
    if (k === 1) { setPlay(null); tirer(1); return; }
    const c = CAD_LOT[k]; tirer(c.par); setPlay(k - c.par > 0 ? { restant: k - c.par, ...c } : null);
  };
  const basculeLecture = () => { quitterDemo(); setPlay(p => (p ? null : { restant: Infinity, ...CAD_LECTURE[t.vitesse] })); };
  const regler = patch => {
    if ('vitesse' in patch) setPlay(p => (p && p.restant === Infinity ? { restant: Infinity, ...CAD_LECTURE[patch.vitesse] } : p));
    if ('amax' in patch || 'mode' in patch) { setPlay(null); quitterDemo(); }
    setT(s => ({ ...s, ...patch }));
  };
  const effacer = () => { quitterDemo(); setPlay(null); setT(s => ({ ...s, etat: X.etatVide('') })); };
  const rejouer = () => (demo ? jouerScenario(demo.sc) : setRejeu(r => r + 1));
  const plein = etat.nEnv >= X.MAX_PHOTONS;
  const actif = !!play && !plein, periode = play?.periode, par = play?.par;
  useEffect(() => {
    if (!actif) return undefined;
    const id = setInterval(() => { tirer(par); setPlay(p => (p && p.restant - par > 0 ? { ...p, restant: p.restant - par } : null)); }, periode);
    return () => clearInterval(id);
  }, [actif, periode, par]);
  const anime = etat.lot === 1 && !reduitMouvement();
  const dureeAnim = actif && par === 1 ? Math.round(periode * 0.88) : t.vitesse === 'lent' ? 4500 : 2800;
  const dureeDemo = { normal: 4500, lent: 10000, tres: 22000 }[vitDemo];
  return { t, params, etat, rejeu, rejouer, demo, manuel, setManuel, vitDemo, setVitDemo, dureeDemo, jouerScenario, quitterDemo, lancer, regler, effacer, lecture: actif, restant: play?.restant ?? 0, basculeLecture, plein, anime, dureeAnim };
}
