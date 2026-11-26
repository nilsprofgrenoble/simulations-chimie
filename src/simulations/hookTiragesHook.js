// Hook des tirages de la simulation 304 : état cumulé, file de lecture (un photon à la fois = animé ; paquets = non animé), démonstration d'un scénario seul.
import { useState, useEffect } from "react";
import * as X from "./hookTirages";
import * as M from "./hookModele";
import { reduitMouvement } from "./hookHorloge";

const INIT = { mol: 'propanone', mode: 'hasard', sigma: 1715, courbe: false, vitesse: 'lent' };
const CAD_LOT = { 10: { periode: 1300, par: 1 }, 100: { periode: 260, par: 1 }, 1000: { periode: 100, par: 10 } };
const CAD_LECTURE = { lent: { periode: 5000, par: 1 }, normal: { periode: 3000, par: 1 }, rapide: { periode: 100, par: 5 } };
export function useTiragesIR(molInit) {
  const [t, setT] = useState(() => ({ ...INIT, mol: molInit ?? INIT.mol, etat: X.etatVide() }));
  const [play, setPlay] = useState(null);
  const [rejeu, setRejeu] = useState(0);
  const [demo, setDemo] = useState(null), [manuel, setManuel] = useState(null), [vitDemo, setVitDemo] = useState('lent');
  const mol = M.MOLECULES[t.mol];
  const tirer = k => setT(s => ({ ...s, etat: X.lancer(s.etat, M.MOLECULES[s.mol], s, k, Math.random) }));
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
    if ('mol' in patch || 'mode' in patch) { setPlay(null); quitterDemo(); }
    setT(s => ({ ...s, ...patch, etat: ['mol', 'mode'].some(c => c in patch && patch[c] !== s[c]) ? X.etatVide() : s.etat }));
  };
  const effacer = () => { quitterDemo(); setPlay(null); setT(s => ({ ...s, etat: X.etatVide() })); };
  const rejouer = () => (demo ? jouerScenario(demo.sc) : setRejeu(r => r + 1));
  const plein = t.etat.nEnv >= X.MAX_PHOTONS;
  const actif = !!play && !plein, periode = play?.periode, par = play?.par;
  useEffect(() => {
    if (!actif) return undefined;
    const id = setInterval(() => { tirer(par); setPlay(p => (p && p.restant - par > 0 ? { ...p, restant: p.restant - par } : null)); }, periode);
    return () => clearInterval(id);
  }, [actif, periode, par]);
  const anime = t.etat.lot === 1 && !reduitMouvement();
  const dureeAnim = actif && par === 1 ? Math.round(periode * 0.88) : t.vitesse === 'lent' ? 4500 : 2800;
  const dureeDemo = { normal: 4500, lent: 10000, tres: 22000 }[vitDemo];
  return { t, mol, rejeu, rejouer, demo, manuel, setManuel, vitDemo, setVitDemo, dureeDemo, jouerScenario, quitterDemo, lancer, regler, effacer, lecture: actif, restant: play?.restant ?? 0, basculeLecture, plein, anime, dureeAnim };
}
