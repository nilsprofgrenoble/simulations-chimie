// Hook des tirages de la simulation 301 (état cumulé, lecture automatique).
import { useState, useEffect } from "react";
import * as X from "./fluoTirages";

export function useTirages(init) {
  const [t, setT] = useState(() => ({ mode: 'emission', mol: 'A', lamExc: 350, lamEm: 450, courbe: false, ...init, etat: X.etatVide() }));
  const [lecture, setLecture] = useState(false);
  const lancer = k => setT(s => ({ ...s, etat: X.lancer(s.etat, X.MOLS_T[s.mol], s, k, Math.random) }));
  const regler = patch => setT(s => ({ ...s, ...patch, etat: ['mode', 'mol', 'lamExc', 'lamEm'].some(c => c in patch && patch[c] !== s[c]) ? X.etatVide() : s.etat }));
  const effacer = () => setT(s => ({ ...s, etat: X.etatVide() }));
  const reinit = cfg => { setLecture(false); setT({ mode: 'emission', mol: 'A', lamExc: 350, lamEm: 450, courbe: false, ...cfg, etat: X.etatVide() }); };
  const plein = t.etat.nEnv >= X.MAX_PHOTONS;
  useEffect(() => { if (!lecture || plein) return undefined; const id = setInterval(() => setT(s => ({ ...s, etat: X.lancer(s.etat, X.MOLS_T[s.mol], s, 3, Math.random) })), 100); return () => clearInterval(id); }, [lecture, plein]);
  return { t, lancer, regler, effacer, reinit, lecture: lecture && !plein, setLecture, plein };
}

