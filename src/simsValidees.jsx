import { useState, useEffect } from 'react';
import { useSession, estEleve, toutLire } from './serveur';
import { SEUIL_GUIDE_S } from './devoirs';

// ════════════════════════════════════════════════════════════════════════════
//  SIMULATIONS DÉJÀ TRAVAILLÉES par l'élève connecté (marque verte dans les menus).
//  Une simulation compte comme travaillée si l'élève y a passé au moins SEUIL_GUIDE_S secondes en parcours guidé
//  (la règle des devoirs) OU s'il a réussi un de ses défis. Lu sur le serveur : la marque appartient au compte, pas à l'appareil.
// ════════════════════════════════════════════════════════════════════════════
const VIDE = new Set();
let memoire = { uid: null, ensemble: VIDE };

export function simsValidees(lignes) {
  const guide = new Map(), ok = new Set();
  (lignes || []).forEach(l => {
    const cle = String(l.cle || '');
    let m = /^sim:([0-9]{1,3}):guide$/.exec(cle);
    if (m) { guide.set(m[1], (guide.get(m[1]) || 0) + (l.duree_s || 0)); return; }
    m = /^([0-9]{1,3}):defi\./.exec(cle);
    if (m && l.reussi) ok.add(m[1]);
  });
  guide.forEach((s, id) => { if (s >= SEUIL_GUIDE_S) ok.add(id); });
  return ok;
}

// `rafraichir` : toute valeur qui change quand il faut relire (navigation, ouverture du menu…)
export function useSimsValidees(rafraichir) {
  const sess = useSession();
  const eleve = estEleve(sess), uid = sess?.user?.id;
  const [ensemble, setEnsemble] = useState(() => (eleve && memoire.uid === uid ? memoire.ensemble : VIDE));
  useEffect(() => {
    if (!eleve) return undefined;
    let actif = true;
    toutLire('activites?select=cle,reussi,duree_s').then(l => {
      const e = simsValidees(l);
      memoire = { uid, ensemble: e };
      if (actif) setEnsemble(e);
    }).catch(() => {});
    return () => { actif = false; };
  }, [eleve, uid, rafraichir]);
  return eleve ? ensemble : VIDE;
}

// Petite pastille verte « déjà travaillée »
export function PastilleFaite({ taille = 20 }) {
  return (
    <span role="img" aria-label="Déjà travaillée" title="Déjà travaillée : parcours guidé ou défi validé"
      style={{ flex: 'none', width: taille, height: taille, borderRadius: '50%', background: '#1f9d6b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={taille * 0.6} height={taille * 0.6} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>);
}
