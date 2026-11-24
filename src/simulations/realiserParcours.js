// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS « REA » : les exercices de l'atelier 36 rangés par TYPE d'exercice, puis par niveau et chapitre.
//  Parcours de l'élève : REA → un type (convertir des unités, effectuer un calcul…) → (pour « effectuer un calcul ») son niveau, puis son chapitre → la liste → l'exercice.
//  Source des niveaux et des chapitres : src/chapitres.js (champ « domaine » de chaque famille d'exercices). Aucun exercice n'est modifié ici : on ne fait que les ranger et les nommer.
//  Pur (sans React) : testé par realiserParcours.test.mjs.
// ═══════════════════════════════════════════════════════════════════════════
import { CHAPITRES, NIVEAUX_CHAPITRES } from '../chapitres.js';

// Les types, dans l'ordre conseillé. « filtre: niveau » : le type contient beaucoup d'exercices rattachés à un chapitre du programme.
export const TYPES_REA = [
  { id: 'unites', nom: 'Convertir des unités', but: 'km/h en m/s, mm en m, cm³ en L… sans se tromper.' },
  { id: 'chiffres', nom: 'Chiffres significatifs et arrondi', but: 'Combien de chiffres garder dans un résultat, et comment arrondir.' },
  { id: 'calculatrice', nom: 'Utiliser la calculatrice', but: 'Saisir une expression, utiliser log, exp et racine.' },
  { id: 'isoler', nom: 'Isoler une grandeur', but: 'Transformer une formule pour calculer la grandeur cherchée.' },
  { id: 'calcul', nom: 'Effectuer un calcul', but: 'Appliquer les formules d’un chapitre : à choisir par niveau puis par chapitre.', filtre: 'niveau' },
  { id: 'vecteurs', nom: 'Calculer avec des vecteurs', but: 'Sommes et différences de vecteurs (forces, vitesses).' },
  { id: 'courbe', nom: 'Tracer une courbe', but: 'Placer les points d’un tableau et tracer la courbe.' },
];

// Types qui ne se déduisent pas du champ « domaine » : (« Vitesses » a un chapitre mais c'est d'abord une conversion)
const TYPE_PAR_ID = {
  simple: 'unites', prefixes: 'unites', puissances: 'unites', composees: 'unites', mixte: 'unites', vitesses: 'unites',
  cs: 'chiffres', fonctions: 'calculatrice', calculatrice: 'calculatrice', isoler: 'isoler',
  'vecteur-somme': 'vecteurs', 'vecteur-difference': 'vecteurs', 'trace-courbe': 'courbe',
};
export const typeDe = f => TYPE_PAR_ID[f.id] || 'calcul';

// « Titrage direct du diiode : équivalence, concentration (1re spé) » → titre « Titrage direct du diiode », détail « équivalence, concentration »
const TAG_NIVEAU = /\s*\((?:2GT|1G|1re spé|TG|TSTL|terminale STL|BTS|seconde)\)\s*$/;
export function titreCourt(titre) {
  const net = titre.replace(TAG_NIVEAU, '').trim();
  const i = net.indexOf(' : ');
  return i < 0 ? { court: net, detail: '' } : { court: net.slice(0, i).trim(), detail: net.slice(i + 3).trim() };
}

// Une entrée par famille d'exercices : { id, cle, type, titre, detail, niveaux: ['1G'], chapitres: ['1g-champ'] }
// Ordre des exercices transversaux : du plus simple au plus complexe (les exercices de chapitre gardent l'ordre de la banque, après eux)
const ORDRE_TRANSVERSAL = ['simple', 'prefixes', 'puissances', 'composees', 'vitesses', 'mixte'];
const rang = id => { const i = ORDRE_TRANSVERSAL.indexOf(id); return i < 0 ? 1000 : i; };
export function construireItems(familles) {
  return [...familles].sort((a, b) => rang(a.id) - rang(b.id)).map(f => {
    const chs = f.domaine ? CHAPITRES.filter(c => c.domaines.includes(f.domaine)) : [];
    const { court, detail } = titreCourt(f.titre);
    return { id: f.id, cle: `36:${f.id}`, type: typeDe(f), titre: court, detail, niveaux: [...new Set(chs.map(c => c.niveau))], chapitres: chs.map(c => c.id) };
  });
}

export const itemsDuType = (items, type) => items.filter(i => i.type === type);
export const niveauxDuType = (items, type) => NIVEAUX_CHAPITRES.map(n => ({ ...n, n: itemsDuType(items, type).filter(i => i.niveaux.includes(n.key)).length })).filter(n => n.n > 0);
// Chapitres d'un niveau qui contiennent des exercices du type, dans l'ordre du programme : [{ chap, n }]
export const chapitresDuNiveauType = (items, type, niv) => CHAPITRES.filter(c => c.niveau === niv)
  .map(c => ({ chap: c, n: itemsDuType(items, type).filter(i => i.chapitres.includes(c.id)).length })).filter(x => x.n > 0);
// Exercices d'une sélection { type, niv, ch } (tout niveau si niv vide, tout chapitre si ch vide)
export function filtrer(items, { type, niv, ch }) {
  return itemsDuType(items, type).filter(i => (!niv || i.niveaux.includes(niv)) && (!ch || i.chapitres.includes(ch)));
}
