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
export const ORDRE_COMP = ["S'APP", 'ANA', 'REA', 'VAL'];

// Exercices à thème du chapitre (hors calcul REA, transversal)
// chap : un chapitre (champs domaines, hors, ajouts : voir chapitres.js) ou, par compatibilité, la simple liste de ses domaines
export const cleDans = (cle, liste) => liste.some(r => cle === r || cle.startsWith(`${r}.`));
export const exosDuChapitre = (exos, chap) => {
  const c = Array.isArray(chap) ? { domaines: chap } : (chap || {});
  if (!c.domaines?.length) return [];
  const hors = c.hors || [], ajouts = c.ajouts || [], audela = c.audela || [];
  return exos.filter(e => e.comp !== 'REA' && !cleDans(e.cle, hors) && !cleDans(e.cle, audela) && (c.domaines.includes(e.domaine) || cleDans(e.cle, ajouts)));
};
// Exercices « au-delà du programme » du chapitre (champ audela de chapitres.js) : gardés, signalés, rangés à part pour l'élève qui veut aller plus loin
export const exosAuDela = (exos, chap) => {
  const audela = (chap && chap.audela) || [];
  return audela.length ? exos.filter(e => cleDans(e.cle, audela)) : [];
};
export const exosCalcul = exos => exos.filter(e => e.comp === 'REA');

// exosChap : exercices du chapitre ; etoilesDe(cle) → 0 (pas réussi) à 3
// Renvoie { exo, raison: 'nouveau' | 'ameliorer', etoiles } ou null si tout est à 3 étoiles (ou chapitre vide)
// hasard (facultatif, renvoie un nombre dans [0 ; 1[) : parmi les exercices jamais réussis de même niveau, on en tire un au sort (variations d'un sous-thème)
export function prochainExercice(exosChap, etoilesDe, hasard) {
  if (!exosChap.length) return null;
  const parComp = new Map();
  for (const e of exosChap) { if (!parComp.has(e.comp)) parComp.set(e.comp, []); parComp.get(e.comp).push(e); }
  const rang = c => { const i = ORDRE_COMP.indexOf(c); return i < 0 ? 99 : i; };
  const bilan = [...parComp.entries()].map(([comp, L]) => ({
    comp, L, ratio: L.reduce((s, e) => s + etoilesDe(e.cle), 0) / (3 * L.length), restants: L.filter(e => etoilesDe(e.cle) === 0).sort((a, b) => (a.niveau || 0) - (b.niveau || 0)),
  })).sort((a, b) => a.ratio - b.ratio || rang(a.comp) - rang(b.comp));
  const aFaire = bilan.find(b => b.restants.length);
  if (aFaire) {
    const r = aFaire.restants, ex = hasard ? r.filter(e => (e.niveau || 0) === (r[0].niveau || 0)) : [r[0]];
    return { exo: ex[hasard ? Math.floor(hasard() * ex.length) : 0], raison: 'nouveau', etoiles: 0 };
  }
  const ameliorables = exosChap.filter(e => etoilesDe(e.cle) < 3).sort((a, b) => etoilesDe(a.cle) - etoilesDe(b.cle));
  return ameliorables.length ? { exo: ameliorables[0], raison: 'ameliorer', etoiles: etoilesDe(ameliorables[0].cle) } : null;
}

// Avancée dans le chapitre : { total, reussis, etoiles, max }
export function avancementChapitre(exosChap, etoilesDe) {
  const et = exosChap.map(e => etoilesDe(e.cle));
  return { total: exosChap.length, reussis: et.filter(x => x > 0).length, etoiles: et.reduce((s, x) => s + x, 0), max: 3 * exosChap.length };
}
