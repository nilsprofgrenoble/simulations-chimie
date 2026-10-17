// ═══════════════════════════════════════════════════════════════════════════
//  SYNTHÈSE PROFESSEUR : quelques chiffres pour savoir, en 10 secondes, où en est la classe (logique pure, sans React).
//
//  Hypothèses (affichées au professeur) :
//   • une activité = une séance enregistrée par le navigateur de l'élève sur le site (exercice, défi ou temps de simulation) ;
//     le travail fait hors du site ou sur un autre appareil non connecté n'est PAS vu ;
//   • « actif » = au moins une séance dans les 7 derniers jours ; « à relancer » = aucune séance depuis 14 jours (ou jamais) ;
//   • « exercices réussis » = couples (élève, exercice) réussis dans les 7 jours, sans compter deux fois le même exercice.
// ═══════════════════════════════════════════════════════════════════════════
const MS_JOUR = 86400000;
export const JOURS_ACTIF = 7;
export const JOURS_RELANCE = 14;

// eleves : [{ user_id, identifiant }] ; lignes : séances de la classe { user_id, cle, reussi, maj|debut }
export function syntheseClasse(eleves, lignes, maintenant = new Date()) {
  const now = maintenant.getTime(), t = l => new Date(l.maj || l.debut).getTime();
  const derniere = new Map(), reussis = new Set();
  for (const l of lignes) {
    const x = t(l);
    if (!Number.isFinite(x)) continue;
    if (!(derniere.get(l.user_id) >= x)) derniere.set(l.user_id, x);
    if (l.reussi && typeof l.cle === 'string' && !l.cle.startsWith('sim:') && x >= now - JOURS_ACTIF * MS_JOUR) reussis.add(`${l.user_id}|${l.cle}`);
  }
  const connus = new Set(eleves.map(e => e.user_id));
  const actifs = eleves.filter(e => derniere.get(e.user_id) >= now - JOURS_ACTIF * MS_JOUR);
  const aRelancer = eleves
    .filter(e => !(derniere.get(e.user_id) >= now - JOURS_RELANCE * MS_JOUR))
    .map(e => ({ identifiant: e.identifiant, jamais: !derniere.has(e.user_id), jours: derniere.has(e.user_id) ? Math.floor((now - derniere.get(e.user_id)) / MS_JOUR) : null }))
    .sort((a, b) => (b.jours ?? Infinity) - (a.jours ?? Infinity) || a.identifiant.localeCompare(b.identifiant));
  return { effectif: eleves.length, actifs: actifs.length, reussis: [...reussis].filter(k => connus.has(k.split('|')[0])).length, aRelancer };
}
