import { chapitresDeSim, chapitresDuDomaine } from "./chapitres";

// Logique pure (sans React ni réseau) : à quels niveaux appartient un exercice ou un défi ?
// Niveaux auxquels appartient un exercice ou un défi (vide : thème transversal ou inconnu, valable pour tous)
export function niveauxDe(item) {
  const ch = item.comp === 'DÉFI' ? chapitresDeSim(Number(item.sim)) : chapitresDuDomaine(item.domaine);
  return new Set(ch.map(c => c.niveau));
}
// L'élément convient-il à ces niveaux ? (niveaux : Set non vide)
export const convientAuxNiveaux = (item, niveaux) => { const n = niveauxDe(item); return n.size === 0 || [...n].some(x => niveaux.has(x)); };

// Niveau le plus fréquent parmi les exercices et défis réussis (ex æquo : tous les niveaux à égalité)
export function niveauxDepuisReussites(items, d) {
  const nb = {};
  items.filter(i => d(i.cle).reussi).forEach(i => { const n = niveauxDe(i); if (n.size === 1) n.forEach(x => { nb[x] = (nb[x] || 0) + 1; }); });
  const max = Math.max(0, ...Object.values(nb));
  return max > 0 ? new Set(Object.keys(nb).filter(k => nb[k] === max)) : null;
}

