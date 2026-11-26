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

const INIT = { el: 'Fe', E: 9, w: 20, courbe: false, vitesse: 'lent' };
export function useTiragesX(init) {
  const [t, setT] = useState(() => ({ ...INIT, ...init, etat: X.etatVide() }));
  const [lecture, setLecture] = useState(false);
  const el = element(t.el);
  const lancer = k => setT(s => ({ ...s, etat: X.lancer(s.etat, element(s.el), s, k, Math.random) }));
  const regler = patch => setT(s => ({ ...s, ...patch, etat: ['el', 'E', 'w'].some(c => c in patch && patch[c] !== s[c]) ? X.etatVide() : s.etat }));
  const effacer = () => setT(s => ({ ...s, etat: X.etatVide() }));
  const reinit = cfg => { setLecture(false); setT({ ...INIT, ...cfg, etat: X.etatVide() }); };
  const plein = t.etat.nEnv >= X.MAX_ATOMES;
  const periode = t.vitesse === 'lent' ? 2400 : t.vitesse === 'normal' ? 1300 : 60;
  useEffect(() => {
    if (!lecture || plein) return undefined;
    const id = setInterval(() => setT(s => ({ ...s, etat: X.lancer(s.etat, element(s.el), s, s.vitesse === 'rapide' ? 4 : 1, Math.random) })), periode);
    return () => clearInterval(id);
  }, [lecture, plein, periode]);
  const anime = t.etat.lot === 1 && !reduitMouvement();
  return { t, el, lancer, regler, effacer, reinit, lecture: lecture && !plein, setLecture, plein, anime };
}
