// ═══════════════════════════════════════════════════════════════════════════
//  DEVOIRS ASSIGNÉS : logique pure (sans React ni réseau). Les devoirs sont dans la table « devoirs » (supabase/06-devoirs.sql) ;
//  « fait » n'y est jamais enregistré : on le déduit des séances de la table « activites ».
//
//  Hypothèses de travail (explicites, discutables) :
//   • un exercice est FAIT pour un devoir s'il a été réussi APRÈS la création du devoir (un exercice réussi le mois dernier
//     ne compte pas : le devoir demande de le refaire). C'est voulu pour des devoirs de révision ; pour un devoir
//     « à découvrir », ça ne change rien ;
//   • la date limite est valable jusqu'à la fin du jour indiqué (heure du navigateur) ;
//   • un devoir est TERMINÉ quand tous ses exercices sont faits, même après la date limite (il est alors « fait en retard »).
// ═══════════════════════════════════════════════════════════════════════════

export const MAX_EXOS = 12;
export const CLE_VALIDE = /^[0-9]{1,3}:[A-Za-z0-9._:-]{1,70}$/;      // identique à la règle du serveur

const MS_JOUR = 86400000;
const t = x => new Date(x).getTime();

// L'exercice « cle » est-il fait, pour un devoir créé à « depuis », d'après les séances « lignes » ?
export const estFait = (lignes, cle, depuis) => lignes.some(l => l.cle === cle && l.reussi && t(l.maj || l.debut) >= t(depuis));

// Avancement d'UN élève sur un devoir
export function avancement(devoir, lignes) {
  const faits = devoir.cles.map(cle => estFait(lignes, cle, devoir.cree_le));
  const nb = faits.filter(Boolean).length;
  return { faits, nb, total: devoir.cles.length, termine: nb === devoir.cles.length };
}

// Fin de la date limite (« YYYY-MM-DD » → ce jour-là à 23 h 59 min 59 s, heure locale) ; null si pas de date limite
export function finEcheance(echeance) {
  if (!echeance) return null;
  const [a, m, j] = String(echeance).slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, j, 23, 59, 59);
}

// Libellé et « ton » de l'échéance : retard, urgent (aujourd'hui ou demain), ok, aucune
export function infoEcheance(echeance, maintenant = new Date(), termine = false) {
  const fin = finEcheance(echeance);
  if (!fin) return { texte: 'sans date limite', ton: 'aucune', jours: null };
  const d0 = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()).getTime();
  const d1 = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate()).getTime();
  const jours = Math.round((d1 - d0) / MS_JOUR);
  if (termine) return { texte: jours < 0 ? 'terminé (après la date limite)' : 'terminé à temps', ton: 'ok', jours };
  if (jours < 0) return { texte: jours === -1 ? 'en retard depuis hier' : `en retard de ${-jours} jours`, ton: 'retard', jours };
  if (jours === 0) return { texte: 'à rendre aujourd’hui', ton: 'urgent', jours };
  if (jours === 1) return { texte: 'à rendre demain', ton: 'urgent', jours };
  return { texte: `à rendre dans ${jours} jours`, ton: 'ok', jours };
}

// Ordre d'affichage côté élève : à faire d'abord (en retard, puis par date limite), puis sans date, puis terminés
export function trierPourEleve(devoirs, lignes) {
  const L = devoirs.map(d => ({ d, a: avancement(d, lignes) }));
  const rang = ({ d, a }) => (a.termine ? 3 : d.echeance ? 0 : 1);
  return L.sort((x, y) => rang(x) - rang(y) || (finEcheance(x.d.echeance) || 0) - (finEcheance(y.d.echeance) || 0) || t(y.d.cree_le) - t(x.d.cree_le));
}

// Résumé côté professeur : par élève, et combien ont tout fait. eleves : [{ user_id, identifiant }]
export function suiviClasse(devoir, eleves, lignes) {
  const lignesDe = new Map();
  for (const l of lignes) { if (!lignesDe.has(l.user_id)) lignesDe.set(l.user_id, []); lignesDe.get(l.user_id).push(l); }
  const parEleve = eleves.map(e => ({ eleve: e, ...avancement(devoir, lignesDe.get(e.user_id) || []) }));
  return { parEleve, termines: parEleve.filter(x => x.termine).length, effectif: eleves.length };
}
