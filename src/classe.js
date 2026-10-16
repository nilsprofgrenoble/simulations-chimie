// ═══════════════════════════════════════════════════════════════════════════
//  VIE DE CLASSE : pseudos et prouesses de la semaine (logique pure, sans React ni réseau).
//
//  Le pseudo d'un élève = deux numéros (adjectif, nom) enregistrés sur le serveur (supabase/05-vie-de-classe.sql).
//  ⚠️ NE JAMAIS retirer ni réordonner un élément des deux listes ci-dessous : les numéros déjà
//  enregistrés pointeraient vers autre chose. On peut seulement AJOUTER à la fin (64 de chaque au maximum).
// ═══════════════════════════════════════════════════════════════════════════

// [masculin, féminin]
export const ADJECTIFS = [
  ['Curieux', 'Curieuse'], ['Rapide', 'Rapide'], ['Malin', 'Maligne'], ['Brillant', 'Brillante'], ['Lumineux', 'Lumineuse'],
  ['Vif', 'Vive'], ['Audacieux', 'Audacieuse'], ['Patient', 'Patiente'], ['Rusé', 'Rusée'], ['Joyeux', 'Joyeuse'],
  ['Tenace', 'Tenace'], ['Stable', 'Stable'], ['Précis', 'Précise'], ['Rayonnant', 'Rayonnante'], ['Explosif', 'Explosive'],
  ['Magnétique', 'Magnétique'], ['Fluide', 'Fluide'], ['Cosmique', 'Cosmique'], ['Pétillant', 'Pétillante'], ['Électrique', 'Électrique'],
  ['Solide', 'Solide'], ['Mystérieux', 'Mystérieuse'], ['Espiègle', 'Espiègle'], ['Vaillant', 'Vaillante'], ['Malicieux', 'Malicieuse'],
  ['Studieux', 'Studieuse'], ['Dynamique', 'Dynamique'], ['Futé', 'Futée'], ['Radieux', 'Radieuse'], ['Agile', 'Agile'],
  ['Persévérant', 'Persévérante'], ['Inventif', 'Inventive'],
];
// [nom, genre, pictogramme]
export const NOMS = [
  ['Électron', 'm', '⚡'], ['Proton', 'm', '➕'], ['Neutron', 'm', '⚪'], ['Photon', 'm', '💡'], ['Quark', 'm', '🔹'], ['Ion', 'm', '✨'],
  ['Atome', 'm', '⚛️'], ['Cristal', 'm', '💎'], ['Prisme', 'm', '🔺'], ['Aimant', 'm', '🧲'], ['Laser', 'm', '🔦'], ['Volcan', 'm', '🌋'],
  ['Éprouvette', 'f', '🧪'], ['Pipette', 'f', '💧'], ['Molécule', 'f', '🔬'], ['Étincelle', 'f', '🎇'], ['Comète', 'f', '☄️'], ['Aurore', 'f', '🌌'],
  ['Fusée', 'f', '🚀'], ['Lentille', 'f', '🔍'], ['Bulle', 'f', '🔵'], ['Flamme', 'f', '🔥'], ['Galaxie', 'f', '🌀'], ['Orbite', 'f', '🪐'],
  ['Vague', 'f', '🌊'], ['Bobine', 'f', '🧵'], ['Boussole', 'f', '🧭'], ['Fiole', 'f', '⚗️'], ['Éclipse', 'f', '🌗'], ['Nébuleuse', 'f', '🌠'],
  ['Burette', 'f', '📏'], ['Pile', 'f', '🔋'],
];

export const pseudoValide = (adj, nom) => Number.isInteger(adj) && Number.isInteger(nom) && adj >= 0 && adj < ADJECTIFS.length && nom >= 0 && nom < NOMS.length;
export function pseudo(adj, nom) {
  if (!pseudoValide(adj, nom)) return { texte: 'Anonyme', icone: '❔' };
  const [n, genre, icone] = NOMS[nom];
  return { texte: `${n} ${ADJECTIFS[adj][genre === 'f' ? 1 : 0]}`, icone };
}
// Quelques propositions au hasard, sans doublon (alea : fonction renvoyant un nombre dans [0, 1[, pour pouvoir tester)
export function propositions(n = 4, alea = Math.random, exclure = []) {
  const vus = new Set(exclure.map(([a, b]) => `${a}-${b}`)), L = [];
  while (L.length < n) {
    const a = Math.floor(alea() * ADJECTIFS.length), b = Math.floor(alea() * NOMS.length), k = `${a}-${b}`;
    if (!vus.has(k)) { vus.add(k); L.push([a, b]); }
  }
  return L;
}

// ── Prouesses : mêmes seuils et mêmes règles que la fonction SQL « classe_semaine » ──
export const PROUESSES = [
  { code: 'cinq', icone: '🌟', titre: 'Série de 5', regle: '5 exercices réussis cette semaine', cible: 5 },
  { code: 'sans_aide', icone: '🧠', titre: 'Sans coup de pouce', regle: '3 exercices réussis sans voir la correction', cible: 3 },
  { code: 'premier_coup', icone: '🎯', titre: 'Du premier coup', regle: '3 exercices réussis du premier coup', cible: 3 },
  { code: 'regulier', icone: '📅', titre: 'Régularité', regle: 'des réussites sur 3 jours différents', cible: 3 },
];
export const MAX_PAR_ELEVE = 5;       // plafond de la contribution d'un élève à l'objectif de classe

export function lundiDe(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()), j = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - j);
  return x;
}
const jourCle = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Avancée de l'élève (lui seul la voit) cette semaine : { cinq: 3, sans_aide: 1, ... , reussis }
export function progressionSemaine(lignes, maintenant = new Date()) {
  const debut = lundiDe(maintenant).getTime();
  const parCle = new Map(), jours = new Set();
  for (const l of lignes) {
    if (!l.reussi || /^sim:/.test(l.cle)) continue;
    const t = new Date(l.maj || l.debut).getTime();
    if (!(t >= debut)) continue;
    jours.add(jourCle(new Date(t)));
    const p = parCle.get(l.cle) || { sc: false, pc: false };
    if (l.corrections_vues === 0) p.sc = true;
    if (l.corrections_vues === 0 && l.essais <= 1) p.pc = true;
    parCle.set(l.cle, p);
  }
  const v = [...parCle.values()];
  return { reussis: v.length, cinq: v.length, sans_aide: v.filter(p => p.sc).length, premier_coup: v.filter(p => p.pc).length, regulier: jours.size };
}
