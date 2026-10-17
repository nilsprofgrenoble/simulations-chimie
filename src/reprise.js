// ═══════════════════════════════════════════════════════════════════════════
//  « À REPRENDRE EN CLASSE » (professeur) : les exercices sur lesquels la classe a le plus buté sur une période.
//  Logique pure, sans React ni réseau. Les données viennent des séances déjà enregistrées (table « activites »).
//
//  Hypothèses de travail (explicites, discutables) :
//   • on ne regarde que les élèves qui ont TRAVAILLÉ l'exercice pendant la période : un exercice que personne n'a ouvert
//     n'est pas « difficile », il est « non traité » (à part) ;
//   • un élève est « en difficulté » sur un exercice si, sur la période, son meilleur résultat est : jamais réussi (« bloqué »),
//     ou réussi seulement après avoir regardé la correction (« correction vue »), ou réussi mais après 3 essais ou plus (« beaucoup d'essais ») ;
//   • un exercice est « à reprendre » si au moins 2 élèves y sont en difficulté ET au moins 25 % de ceux qui l'ont travaillé :
//     un seul élève en difficulté relève de l'aide individuelle, pas du cours collectif ;
//   • classement : d'abord le nombre d'élèves en difficulté, puis la proportion.
//  Les résultats viennent du navigateur des élèves : c'est une aide à la décision, pas une mesure exacte.
// ═══════════════════════════════════════════════════════════════════════════
import { etoilesSeance } from './carnet.js';

const MS_JOUR = 86400000;
export const SEUIL_ELEVES = 2;
export const SEUIL_PROPORTION = 0.25;

// Difficulté d'UN élève sur UN exercice à partir de ses séances de la période : 'bloque' | 'correction' | 'essais' | null (pas de difficulté)
export function difficulteEleve(seances) {
  const etoiles = seances.map(etoilesSeance), best = Math.max(0, ...etoiles);
  if (best === 0) return 'bloque';
  if (best === 1) return 'correction';
  const essaisMin = Math.min(...seances.filter(l => l.reussi && l.corrections_vues === 0).map(l => l.essais));
  return essaisMin >= 3 ? 'essais' : null;
}

// eleves : [{ user_id, identifiant }] ; lignes : séances de la classe ; items : exercices et défis du site ;
// jours : taille de la période (null = tout) ; renvoie { aReprendre, nonTraites, travailles }
export function aReprendreEnClasse(eleves, lignes, items, jours = 7, maintenant = new Date(), max = 5) {
  const depuis = jours ? maintenant.getTime() - jours * MS_JOUR : -Infinity;
  const ident = new Map(eleves.map(e => [e.user_id, e.identifiant]));
  const parExo = new Map();                                    // cle → Map(user_id → séances)
  for (const l of lignes) {
    if (typeof l.cle !== 'string' || l.cle.startsWith('sim:') || !ident.has(l.user_id)) continue;
    if (!(new Date(l.maj || l.debut).getTime() >= depuis)) continue;
    if (!parExo.has(l.cle)) parExo.set(l.cle, new Map());
    const m = parExo.get(l.cle);
    if (!m.has(l.user_id)) m.set(l.user_id, []);
    m.get(l.user_id).push(l);
  }
  const res = [];
  for (const item of items) {
    const m = parExo.get(item.cle);
    if (!m) continue;
    const qui = { bloque: [], correction: [], essais: [] };
    for (const [uid, seances] of m) { const d = difficulteEleve(seances); if (d) qui[d].push(ident.get(uid)); }
    const nbDiff = qui.bloque.length + qui.correction.length + qui.essais.length, travailles = m.size;
    if (nbDiff >= SEUIL_ELEVES && nbDiff / travailles >= SEUIL_PROPORTION) res.push({ item, travailles, nbDiff, proportion: nbDiff / travailles, qui });
  }
  res.sort((a, b) => b.nbDiff - a.nbDiff || b.proportion - a.proportion);
  const nonTraites = items.filter(i => !parExo.has(i.cle));
  return { aReprendre: res.slice(0, max), autres: Math.max(0, res.length - max), nonTraites: nonTraites.length, travailles: parExo.size };
}
