// ═══════════════════════════════════════════════════════════════════════════
//  « MON PROFIL » PAR ÉTAPES : logique pure (sans React ni réseau).
//
//  Idée : un élève qui arrive ne voit qu'une chose (sa première simulation) ; le reste de l'espace apparaît au fil de sa progression.
//   • Étape 0 : rien de réussi, aucun parcours guidé terminé → seulement le bloc « Mon profil » et un bouton vers la 1re simulation.
//   • Étape 1 : un parcours guidé terminé (ou un exercice réussi) → niveau « Novice », jauge, à revoir, « Ma classe » pas à pas.
//   • Étape 2 : niveau 2 atteint (3 étoiles) → compétences, objectifs, détail des résultats.
//   • Badges et régularité : seulement après SEUIL_BADGES_MIN minutes de travail : ils s'ajoutent
//     quand l'élève maîtrise déjà le site, pour ne pas l'encombrer au début.
//  Hypothèses : « parcours guidé terminé » = au moins SEUIL_GUIDE_S secondes de temps actif en mode guidé sur une simulation (c'est un
//  indicateur, pas une preuve) ; le temps passé sert ici à DÉBLOQUER l'affichage, jamais à attribuer des étoiles.
//  Pour revenir à l'ancien affichage : mettre PROFIL_PAR_ETAPES à false.
// ═══════════════════════════════════════════════════════════════════════════
import { SEUIL_GUIDE_S, estCleSim, detailSim, defisDeSim, estFait } from './devoirs';
import { estDefi } from './suivi';

export const PROFIL_PAR_ETAPES = true;
export const SEUIL_BADGES_MIN = 45;
export const NIVEAU_COMPETENCES = 2;
export const TAILLE_LOT = 3;           // nombre d'exercices proposés d'un coup dans « Ma classe »

// Simulations dont le parcours guidé a été suivi assez longtemps : [id, …]
export function parcoursGuidesFaits(lignes) {
  const s = new Map();
  for (const l of lignes || []) { const m = /^sim:([0-9]{1,3}):guide$/.exec(l.cle || ''); if (m) s.set(m[1], (s.get(m[1]) || 0) + (l.duree_s || 0)); }
  return [...s].filter(([, t]) => t >= SEUIL_GUIDE_S).map(([id]) => id);
}

export const tempsTotalMin = lignes => (lignes || []).reduce((t, l) => t + (l.duree_s || 0), 0) / 60;

// A : résultat de analyser() (src/carnet.js)
export function etapeEleve(A, lignes) {
  const demarre = parcoursGuidesFaits(lignes).length > 0 || A.stat.reussis > 0 || A.total > 0;
  if (!demarre) return 0;
  return A.niveau.n >= NIVEAU_COMPETENCES ? 2 : 1;
}

// Les badges n'apparaissent qu'après un certain temps de travail (même si un badge est déjà obtenu : le premier l'est dès le 1er exercice)
export const badgesVisibles = (A, lignes) => tempsTotalMin(lignes) >= SEUIL_BADGES_MIN;

// Les étapes d'un devoir pour un élève, dans l'ordre : pour chaque simulation, son parcours guidé, puis son défi, puis les défis
// du devoir qui s'y rattachent ; ensuite les autres exercices, dans l'ordre choisi par le professeur.
// étape : { type: 'guide' | 'defi' | 'exo', cle, sim?, fait, guideS?, defis? }
export function etapesDevoir(devoir, lignes, defisDe = defisDeSim) {
  const depuis = devoir.cree_le, cles = devoir.cles || [];
  const sims = cles.filter(estCleSim), autres = cles.filter(c => !estCleSim(c));
  const etapes = [], placees = new Set();
  for (const cle of sims) {
    const id = cle.slice(4), d = detailSim(lignes, cle, depuis, defisDe);
    etapes.push({ type: 'guide', cle, sim: id, fait: d.guideOk, guideS: d.guideS });
    if (d.defis.length) etapes.push({ type: 'defi', cle, sim: id, fait: d.defiOk, defis: d.defis });
    for (const k of autres) if (d.defis.includes(k) && !placees.has(k)) { placees.add(k); etapes.push({ type: 'defi', cle: k, sim: id, fait: estFait(lignes, k, depuis, defisDe), unique: true }); }
  }
  for (const k of autres) if (!placees.has(k)) etapes.push({ type: estDefi(k) ? 'defi' : 'exo', cle: k, fait: estFait(lignes, k, depuis, defisDe) });
  return etapes;
}

// Ce qu'on montre : les étapes faites, puis la prochaine seule (parcours guidé, défi) ou un lot d'exercices ; le reste reste verrouillé.
export function fenetreEtapes(etapes, lot = TAILLE_LOT) {
  const faites = etapes.filter(e => e.fait), restantes = etapes.filter(e => !e.fait);
  if (!restantes.length) return { faites, visibles: [], verrouillees: 0 };
  const visibles = [restantes[0]];
  if (restantes[0].type === 'exo') for (const e of restantes.slice(1)) { if (e.type === 'exo' && visibles.length < lot) visibles.push(e); else break; }
  return { faites, visibles, verrouillees: restantes.length - visibles.length };
}

// La prochaine simulation à ouvrir d'après les devoirs (parcours guidé pas encore fait), ou null
export function prochaineSimulation(devoirs, lignes, trier) {
  for (const { d } of trier(devoirs || [], lignes || [])) {
    const e = etapesDevoir(d, lignes || []).find(x => !x.fait && x.sim);
    if (e) return { sim: e.sim, devoir: d };
  }
  return null;
}
