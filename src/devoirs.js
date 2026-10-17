// ═══════════════════════════════════════════════════════════════════════════
//  DEVOIRS ASSIGNÉS : logique pure (sans React ni réseau). Les devoirs sont dans la table « devoirs » (supabase/06-devoirs.sql) ;
//  « fait » n'y est jamais enregistré : on le déduit des séances de la table « activites ».
//
//  Hypothèses de travail (explicites, discutables) :
//   • un exercice est FAIT pour un devoir s'il a été réussi APRÈS la création du devoir (un exercice réussi le mois dernier
//     ne compte pas : le devoir demande de le refaire). C'est voulu pour des devoirs de révision ; pour un devoir
//     « à découvrir », ça ne change rien ;
//   • la date limite est valable jusqu'à la fin du jour indiqué (heure du navigateur) ;
//   • un devoir peut viser seulement certains élèves (devoir.eleves = liste d'identifiants, supabase/07) : les autres ne le voient
//     pas (règle du serveur) et ne comptent pas dans « N élèves ont tout fait » ;
//   • un devoir peut contenir des SIMULATIONS (clé « sim:<id> »). Une simulation est FAITE quand l'élève a (1) cumulé au moins
//     SEUIL_GUIDE_S secondes en parcours guidé, avec une séance depuis la création du devoir, et (2) réussi, depuis la création du
//     devoir, au moins un des défis de cette simulation (si elle en a). Le site ne sait pas « où en est » l'élève dans le parcours
//     guidé : le temps actif en mode guidé est un indicateur, pas une preuve. Mesure faite dans le navigateur de l'élève :
//     c'est une aide à l'organisation, pas une évaluation ;
//   • un devoir est TERMINÉ quand tous ses exercices sont faits, même après la date limite (il est alors « fait en retard »).
// ═══════════════════════════════════════════════════════════════════════════

import { DEFIS } from './suivi';

export const MAX_EXOS = 40;
export const CLE_VALIDE = /^([0-9]{1,3}:[A-Za-z0-9._:-]{1,70}|sim:[0-9]{1,3})$/;      // identique à la règle du serveur
export const SEUIL_GUIDE_S = 300;           // 5 minutes de parcours guidé

const MS_JOUR = 86400000;
const t = x => new Date(x).getTime();

export const estCleSim = cle => typeof cle === 'string' && /^sim:[0-9]{1,3}$/.test(cle);
// Clés des défis déclarés par la simulation « id » (rempli quand les simulations sont chargées)
export const defisDeSim = id => DEFIS.filter(d => String(d.sim) === String(id)).map(d => d.cle);

const reussiApres = (lignes, cle, depuis) => lignes.some(l => l.cle === cle && l.reussi && t(l.maj || l.debut) >= t(depuis));

// Où en est l'élève sur une simulation d'un devoir : { guideS, guideOk, defis, defiOk, fait }
export function detailSim(lignes, cle, depuis, defisDe = defisDeSim) {
  const id = cle.slice(4), guide = lignes.filter(l => l.cle === `sim:${id}:guide`);
  const guideS = guide.reduce((s, l) => s + (l.duree_s || 0), 0);
  const guideOk = guideS >= SEUIL_GUIDE_S && guide.some(l => t(l.maj || l.debut) >= t(depuis));
  const defis = defisDe(id), defiOk = defis.length === 0 || defis.some(k => reussiApres(lignes, k, depuis));
  return { guideS, guideOk, defis, defiOk, fait: guideOk && defiOk };
}

// L'exercice (ou la simulation) « cle » est-il fait, pour un devoir créé à « depuis », d'après les séances « lignes » ?
export const estFait = (lignes, cle, depuis, defisDe) => (estCleSim(cle) ? detailSim(lignes, cle, depuis, defisDe).fait : reussiApres(lignes, cle, depuis));

// Avancement d'UN élève sur un devoir
export function avancement(devoir, lignes, defisDe) {
  const faits = devoir.cles.map(cle => estFait(lignes, cle, devoir.cree_le, defisDe));
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
// Un devoir peut viser toute la classe (devoir.eleves absent) ou seulement quelques élèves (liste d'identifiants internes)
export const estCible = (devoir, userId) => !Array.isArray(devoir.eleves) || devoir.eleves.includes(userId);

export function suiviClasse(devoir, tous, lignes) {
  const eleves = tous.filter(e => estCible(devoir, e.user_id));
  const lignesDe = new Map();
  for (const l of lignes) { if (!lignesDe.has(l.user_id)) lignesDe.set(l.user_id, []); lignesDe.get(l.user_id).push(l); }
  const parEleve = eleves.map(e => ({ eleve: e, ...avancement(devoir, lignesDe.get(e.user_id) || []) }));
  return { parEleve, termines: parEleve.filter(x => x.termine).length, effectif: eleves.length };
}

// Parmi « items » (éléments du catalogue), ceux qu'au moins un des élèves « eleves » n'a pas encore réussis.
// Les simulations restent toujours (un devoir demande de les refaire après sa création).
export function nonReussisParAuMoinsUn(items, eleves, lignes) {
  const reussis = new Map();
  for (const l of lignes) if (l.reussi) { if (!reussis.has(l.user_id)) reussis.set(l.user_id, new Set()); reussis.get(l.user_id).add(l.cle); }
  return items.filter(i => i.comp === 'SIM' || eleves.some(e => !reussis.get(e.user_id)?.has(i.cle)));
}
