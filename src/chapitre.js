// ═══════════════════════════════════════════════════════════════════════════
//  CHAPITRE EN COURS : quels exercices montrer en priorité à un élève, et lequel lui conseiller (logique pure).
//
//  Hypothèses (affichées à l'élève) :
//   • un exercice appartient à un « thème » du programme (le champ « domaine ») ; le chapitre en cours d'une classe
//     est un à trois thèmes choisis par le professeur ;
//   • les exercices de calcul (REA) n'ont pas de thème : ils servent à tous les chapitres et sont proposés à part ;
//   • le « niveau » d'un élève n'est pas une étiquette : on le déduit de ses étoiles (0 à 3 par exercice). On conseille
//     d'abord un exercice jamais réussi, dans la compétence où l'élève a le moins avancé DANS CE CHAPITRE ; s'il a tout
//     réussi, on conseille celui où il a le moins d'étoiles (pour viser les 3 étoiles).
// ═══════════════════════════════════════════════════════════════════════════
export const MAX_CHAPITRES = 3;
export const ORDRE_COMP = ["S'APP", 'ANA', 'REA'];

// Exercices à thème du chapitre (hors calcul REA, transversal)
export const exosDuChapitre = (exos, chapitres) => (chapitres?.length ? exos.filter(e => e.comp !== 'REA' && chapitres.includes(e.domaine)) : []);
export const exosCalcul = exos => exos.filter(e => e.comp === 'REA');

// exosChap : exercices du chapitre ; etoilesDe(cle) → 0 (pas réussi) à 3
// Renvoie { exo, raison: 'nouveau' | 'ameliorer', etoiles } ou null si tout est à 3 étoiles (ou chapitre vide)
export function prochainExercice(exosChap, etoilesDe) {
  if (!exosChap.length) return null;
  const parComp = new Map();
  for (const e of exosChap) { if (!parComp.has(e.comp)) parComp.set(e.comp, []); parComp.get(e.comp).push(e); }
  const rang = c => { const i = ORDRE_COMP.indexOf(c); return i < 0 ? 99 : i; };
  const bilan = [...parComp.entries()].map(([comp, L]) => ({
    comp, L, ratio: L.reduce((s, e) => s + etoilesDe(e.cle), 0) / (3 * L.length), restants: L.filter(e => etoilesDe(e.cle) === 0),
  })).sort((a, b) => a.ratio - b.ratio || rang(a.comp) - rang(b.comp));
  const aFaire = bilan.find(b => b.restants.length);
  if (aFaire) return { exo: aFaire.restants[0], raison: 'nouveau', etoiles: 0 };
  const ameliorables = exosChap.filter(e => etoilesDe(e.cle) < 3).sort((a, b) => etoilesDe(a.cle) - etoilesDe(b.cle));
  return ameliorables.length ? { exo: ameliorables[0], raison: 'ameliorer', etoiles: etoilesDe(ameliorables[0].cle) } : null;
}

// Avancée dans le chapitre : { total, reussis, etoiles, max }
export function avancementChapitre(exosChap, etoilesDe) {
  const et = exosChap.map(e => etoilesDe(e.cle));
  return { total: exosChap.length, reussis: et.filter(x => x > 0).length, etoiles: et.reduce((s, x) => s + x, 0), max: 3 * exosChap.length };
}
