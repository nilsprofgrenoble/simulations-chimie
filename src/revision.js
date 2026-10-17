// ═══════════════════════════════════════════════════════════════════════════
//  « À REVOIR AUJOURD'HUI » : révision espacée (boîtes de Leitner simplifiées), logique pure sans React ni réseau.
//
//  Hypothèses de travail (explicites, discutables) :
//   • on ne retient bien que ce qu'on retravaille à des moments de plus en plus espacés ; l'intervalle grandit
//     quand l'élève réussit bien (2 ou 3 étoiles), et repart court quand il échoue ou réussit seulement avec la correction ;
//   • on raisonne par JOUR (fuseau du navigateur) : plusieurs séances le même jour comptent pour une, la meilleure ;
//   • seuls les exercices DÉJÀ RÉUSSIS au moins une fois sont proposés : « terminer ce qu'on a commencé » reste
//     dans « Mes prochains objectifs » ;
//   • pas plus de 5 propositions par jour, pour que ça reste faisable.
//  Aucun enregistrement supplémentaire : tout est déduit des séances déjà stockées (table « activites »).
// ═══════════════════════════════════════════════════════════════════════════
import { etoilesSeance } from './carnet.js';

export const INTERVALLES = [1, 3, 7, 16, 35];     // jours avant la prochaine révision, selon la « boîte » 0 à 4
export const MAX_PAR_JOUR = 5;
const MS_JOUR = 86400000;

const debutDeJour = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
const dateSeance = l => new Date(l.maj || l.debut).getTime();

// Statut de révision d'un exercice à partir de ses séances (toutes les lignes de la table pour cette clé).
// Renvoie null si l'exercice n'a jamais été réussi.
export function statutRevision(seances, maintenant = new Date()) {
  const jours = new Map();                          // jour → { t: dernière séance du jour, best: meilleures étoiles }
  for (const l of seances) {
    const t = dateSeance(l);
    if (!Number.isFinite(t)) continue;
    const j = debutDeJour(t), e = etoilesSeance(l), cur = jours.get(j) || { t: 0, best: 0 };
    jours.set(j, { t: Math.max(cur.t, t), best: Math.max(cur.best, e) });
  }
  const suite = [...jours.entries()].sort((a, b) => a[0] - b[0]);
  let boite = 0, dejaReussi = false;
  for (const [, j] of suite) {
    if (j.best === 0) boite = 0;                                   // échec : on repart de zéro
    else { dejaReussi = true; boite = j.best >= 2 ? Math.min(boite + 1, INTERVALLES.length - 1) : Math.max(0, boite - 1); }
  }
  if (!dejaReussi) return null;
  const [jourDernier, dernier] = suite[suite.length - 1];
  const echeance = jourDernier + INTERVALLES[boite] * MS_JOUR;
  const aujourdhui = debutDeJour(maintenant.getTime());
  const retard = Math.round((aujourdhui - echeance) / MS_JOUR);    // ≥ 0 : à revoir
  const depuis = Math.round((aujourdhui - jourDernier) / MS_JOUR);
  return { boite, echeance: new Date(echeance), retard, depuis, adevoir: retard >= 0, dernieresEtoiles: dernier.best };
}

// Texte pédagogique : pourquoi on le revoit maintenant
export function raisonRevision(s) {
  const il = s.depuis <= 0 ? 'aujourd’hui' : s.depuis === 1 ? 'hier' : `il y a ${s.depuis} jours`;
  if (s.dernieresEtoiles === 0) return `La dernière fois (${il}), tu n’as pas réussi : retente-le, c’est comme ça qu’on le retient.`;
  if (s.dernieresEtoiles === 1) return `Réussi ${il} avec la correction : refais-le sans, pour de bon.`;
  return `Réussi ${il} : le revoir maintenant, juste avant d’oublier, fixe la mémoire.`;
}

// Sélection du jour. items : exercices et défis ({ cle, … }) ; lignes : séances de l'élève.
// Priorité : les plus fragiles (boîte basse) d'abord, puis les plus en retard par rapport à leur intervalle.
export function aRevoir(items, lignes, maintenant = new Date(), max = MAX_PAR_JOUR) {
  const parCle = new Map();
  for (const l of lignes) if (typeof l.cle === 'string' && !l.cle.startsWith('sim:')) { if (!parCle.has(l.cle)) parCle.set(l.cle, []); parCle.get(l.cle).push(l); }
  const dus = [], futurs = [];
  let solides = 0, suivis = 0;
  for (const item of items) {
    const seances = parCle.get(item.cle);
    if (!seances) continue;
    const s = statutRevision(seances, maintenant);
    if (!s) continue;
    suivis++;
    if (s.boite >= 3) solides++;
    (s.adevoir ? dus : futurs).push({ item, statut: s });
  }
  dus.sort((a, b) => a.statut.boite - b.statut.boite || (b.statut.retard / INTERVALLES[b.statut.boite]) - (a.statut.retard / INTERVALLES[a.statut.boite]));
  futurs.sort((a, b) => a.statut.echeance - b.statut.echeance);
  return { liste: dus.slice(0, max), autres: Math.max(0, dus.length - max), prochaine: futurs[0]?.statut.echeance || null, solides, suivis };
}

export function dansJours(date, maintenant = new Date()) {
  const n = Math.round((debutDeJour(date.getTime()) - debutDeJour(maintenant.getTime())) / MS_JOUR);
  return n <= 0 ? 'aujourd’hui' : n === 1 ? 'demain' : `dans ${n} jours`;
}
