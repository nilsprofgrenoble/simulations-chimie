// ═══════════════════════════════════════════════════════════════════════════
//  VIE DE CLASSE : pseudos et prouesses de la semaine (logique pure, sans React ni réseau).
//
//  Le pseudo d'un élève = deux numéros (adjectif, nom) enregistrés sur le serveur (supabase/05-vie-de-classe.sql).
//  ⚠️ NE JAMAIS retirer ni réordonner un élément des deux listes ci-dessous : les numéros déjà
//  enregistrés pointeraient vers autre chose. On peut seulement AJOUTER à la fin (256 de chaque au maximum, voir supabase/15-pseudos-plus.sql).
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
  ['Fougueux', 'Fougueuse'], ['Téméraire', 'Téméraire'], ['Farceur', 'Farceuse'], ['Câlin', 'Câline'], ['Tonitruant', 'Tonitruante'],
  ['Rêveur', 'Rêveuse'], ['Pressé', 'Pressée'], ['Courageux', 'Courageuse'], ['Intrépide', 'Intrépide'], ['Zen', 'Zen'],
  ['Flegmatique', 'Flegmatique'], ['Impatient', 'Impatiente'], ['Fantasque', 'Fantasque'], ['Facétieux', 'Facétieuse'], ['Bondissant', 'Bondissante'],
  ['Surexcité', 'Surexcitée'], ['Fier', 'Fière'], ['Sage', 'Sage'], ['Fidèle', 'Fidèle'], ['Chanceux', 'Chanceuse'],
  ['Déchaîné', 'Déchaînée'], ['Majestueux', 'Majestueuse'], ['Philosophe', 'Philosophe'], ['Joueur', 'Joueuse'], ['Enjoué', 'Enjouée'],
  ['Débrouillard', 'Débrouillarde'], ['Fabuleux', 'Fabuleuse'], ['Légendaire', 'Légendaire'], ['Épatant', 'Épatante'], ['Éclatant', 'Éclatante'],
  ['Savant', 'Savante'], ['Danseur', 'Danseuse'],
  // Ajouts (supabase/15-pseudos-plus.sql) : plus incisifs, plus drôles
  ['Ravageur', 'Ravageuse'], ['Foudroyant', 'Foudroyante'], ['Implacable', 'Implacable'], ['Machiavélique', 'Machiavélique'], ['Diabolique', 'Diabolique'],
  ['Infernal', 'Infernale'], ['Insolent', 'Insolente'], ['Effronté', 'Effrontée'], ['Culotté', 'Culottée'], ['Cinglant', 'Cinglante'],
  ['Mordant', 'Mordante'], ['Acide', 'Acide'], ['Corrosif', 'Corrosive'], ['Volatil', 'Volatile'], ['Inflammable', 'Inflammable'],
  ['Instable', 'Instable'], ['Radioactif', 'Radioactive'], ['Supersonique', 'Supersonique'], ['Surpuissant', 'Surpuissante'], ['Démesuré', 'Démesurée'],
  ['Redoutable', 'Redoutable'], ['Impétueux', 'Impétueuse'], ['Sournois', 'Sournoise'], ['Narquois', 'Narquoise'], ['Pince-sans-rire', 'Pince-sans-rire'],
  ['Moqueur', 'Moqueuse'], ['Taquin', 'Taquine'], ['Gouailleur', 'Gouailleuse'], ['Cabotin', 'Cabotine'], ['Hilarant', 'Hilarante'],
  ['Déjanté', 'Déjantée'], ['Barjo', 'Barjo'], ['Foufou', 'Fofolle'], ['Loufoque', 'Loufoque'], ['Siphonné', 'Siphonnée'],
  ['Allumé', 'Allumée'], ['Survolté', 'Survoltée'], ['Enragé', 'Enragée'], ['Hargneux', 'Hargneuse'], ['Bagarreur', 'Bagarreuse'],
  ['Costaud', 'Costaud'], ['Balèze', 'Balèze'], ['Indestructible', 'Indestructible'], ['Increvable', 'Increvable'], ['Invincible', 'Invincible'],
  ['Imbattable', 'Imbattable'], ['Insaisissable', 'Insaisissable'], ['Imprévisible', 'Imprévisible'], ['Incontrôlable', 'Incontrôlable'], ['Inépuisable', 'Inépuisable'],
  ['Irrésistible', 'Irrésistible'], ['Incandescent', 'Incandescente'], ['Brûlant', 'Brûlante'], ['Glacial', 'Glaciale'], ['Givré', 'Givrée'],
  ['Bouillant', 'Bouillante'], ['Saturé', 'Saturée'], ['Concentré', 'Concentrée'], ['Sublime', 'Sublime'], ['Magistral', 'Magistrale'],
  ['Monumental', 'Monumentale'], ['Titanesque', 'Titanesque'], ['Gargantuesque', 'Gargantuesque'], ['Spectaculaire', 'Spectaculaire'], ['Phénoménal', 'Phénoménale'],
  ['Stratosphérique', 'Stratosphérique'], ['Interstellaire', 'Interstellaire'], ['Quantique', 'Quantique'], ['Atomique', 'Atomique'], ['Nucléaire', 'Nucléaire'],
  ['Thermonucléaire', 'Thermonucléaire'], ['Exothermique', 'Exothermique'], ['Ondulant', 'Ondulante'], ['Oscillant', 'Oscillante'], ['Vibrant', 'Vibrante'],
  ['Tourbillonnant', 'Tourbillonnante'], ['Frénétique', 'Frénétique'], ['Turbulent', 'Turbulente'], ['Orageux', 'Orageuse'], ['Tempétueux', 'Tempétueuse'],
  ['Fracassant', 'Fracassante'], ['Détonant', 'Détonante'], ['Pétaradant', 'Pétaradante'], ['Crépitant', 'Crépitante'], ['Scintillant', 'Scintillante'],
  ['Fulgurant', 'Fulgurante'], ['Époustouflant', 'Époustouflante'], ['Ébouriffant', 'Ébouriffante'], ['Pétulant', 'Pétulante'], ['Intraitable', 'Intraitable'],
  ['Inflexible', 'Inflexible'], ['Sans-gêne', 'Sans-gêne'],
];
// [nom, genre, pictogramme]
export const NOMS = [
  ['Électron', 'm', '⚡'], ['Proton', 'm', '➕'], ['Neutron', 'm', '⚪'], ['Photon', 'm', '💡'], ['Quark', 'm', '🔹'], ['Ion', 'm', '✨'],
  ['Atome', 'm', '⚛️'], ['Cristal', 'm', '💎'], ['Prisme', 'm', '🔺'], ['Aimant', 'm', '🧲'], ['Laser', 'm', '🔦'], ['Volcan', 'm', '🌋'],
  ['Éprouvette', 'f', '🧪'], ['Pipette', 'f', '💧'], ['Molécule', 'f', '🔬'], ['Étincelle', 'f', '🎇'], ['Comète', 'f', '☄️'], ['Aurore', 'f', '🌌'],
  ['Fusée', 'f', '🚀'], ['Lentille', 'f', '🔍'], ['Bulle', 'f', '🔵'], ['Flamme', 'f', '🔥'], ['Galaxie', 'f', '🌀'], ['Orbite', 'f', '🪐'],
  ['Vague', 'f', '🌊'], ['Bobine', 'f', '🧵'], ['Boussole', 'f', '🧭'], ['Fiole', 'f', '⚗️'], ['Éclipse', 'f', '🌗'], ['Nébuleuse', 'f', '🌠'],
  ['Burette', 'f', '📏'], ['Pile', 'f', '🔋'],
  ['Bécher', 'm', '🥛'], ['Erlenmeyer', 'm', '🧫'], ['Spatule', 'f', '🥄'], ['Mole', 'f', '🧮'], ['Paillasse', 'f', '🧑‍🔬'], ['Blouse', 'f', '🥼'],
  ['Sodium', 'm', '🧂'], ['Hélium', 'm', '🎈'], ['Néon', 'm', '🪧'], ['Argon', 'm', '💠'], ['Cation', 'm', '🔴'], ['Anion', 'm', '🔵'],
  ['Catalyseur', 'm', '⏩'], ['Précipité', 'm', '🌫️'], ['Réactif', 'm', '🧴'], ['Distillat', 'm', '💦'], ['Solvant', 'm', '🫗'], ['Éthanol', 'm', '🔥'],
  ['Ampoule', 'f', '🧊'], ['Hotte', 'f', '🌬️'], ['Thermomètre', 'm', '🌡️'], ['Ballon', 'm', '🟠'], ['Entonnoir', 'm', '🔻'], ['Pissette', 'f', '🚿'],
  ['Agitateur', 'm', '🌪️'], ['Mortier', 'm', '🏺'], ['Creuset', 'm', '🫕'], ['Chromatogramme', 'm', '🌈'], ['Bec Bunsen', 'm', '🕯️'], ['Électrode', 'f', '🔌'],
  ['Cristallisoir', 'm', '❄️'], ['Pipette jaugée', 'f', '📊'],
  // Ajouts : 60 noms de chimie (n° 64 à 123), puis 40 noms de physique (n° 124 à 163)
  ['Hydrogène', 'm', '💨'], ['Oxygène', 'm', '🫧'], ['Carbone', 'm', '⚫'], ['Azote', 'm', '🌬️'], ['Potassium', 'm', '🍌'], ['Calcium', 'm', '🦴'],
  ['Magnésium', 'm', '🎆'], ['Fer', 'm', '🔩'], ['Cuivre', 'm', '🟤'], ['Zinc', 'm', '🔘'], ['Mercure', 'm', '🪞'], ['Soufre', 'm', '🟡'],
  ['Chlore', 'm', '🏊'], ['Fluor', 'm', '🦷'], ['Lithium', 'm', '🔋'], ['Platine', 'm', '🏅'], ['Or', 'm', '🥇'], ['Argent', 'm', '🥈'],
  ['Diamant', 'm', '💎'], ['Graphite', 'm', '✏️'], ['Graphène', 'm', '🕸️'], ['Radium', 'm', '☢️'], ['Uranium', 'm', '☢️'], ['Titane', 'm', '🛠️'],
  ['Aluminium', 'm', '🥫'], ['Phosphore', 'm', '🔆'], ['Iode', 'm', '🟣'], ['Brome', 'm', '🟥'], ['Acide', 'm', '🍋'], ['Base', 'f', '🧼'],
  ['Liaison', 'f', '🔗'], ['Réaction', 'f', '💥'], ['Combustion', 'f', '🔥'], ['Oxydation', 'f', '🍎'], ['Réduction', 'f', '⬇️'], ['Fusion', 'f', '🫠'],
  ['Ébullition', 'f', '♨️'], ['Évaporation', 'f', '☁️'], ['Distillation', 'f', '⚗️'], ['Titration', 'f', '🎯'], ['Dissolution', 'f', '🧂'], ['Solution', 'f', '🫙'],
  ['Mélange', 'm', '🍹'], ['Cristallisation', 'f', '❄️'], ['Chromatographie', 'f', '🌈'], ['Électrolyse', 'f', '⚡'], ['Polymère', 'm', '🧬'], ['Enzyme', 'f', '🧬'],
  ['Isotope', 'm', '🔁'], ['Orbitale', 'f', '🌀'], ['Valence', 'f', '🤝'], ['Alcane', 'm', '🛢️'], ['Benzène', 'm', '⬡'], ['Ester', 'm', '🍓'],
  ['Pétrole', 'm', '⛽'], ['Aspirine', 'f', '💊'], ['Savon', 'm', '🧼'], ['Mousse', 'f', '🫧'], ['Émulsion', 'f', '🥗'], ['Gel', 'm', '🧊'],
  ['Newton', 'm', '🍏'], ['Joule', 'm', '🔥'], ['Watt', 'm', '💡'], ['Volt', 'm', '⚡'], ['Ampère', 'm', '🔌'], ['Ohm', 'm', '🧱'],
  ['Tesla', 'm', '🚗'], ['Pascal', 'm', '🔧'], ['Hertz', 'm', '📻'], ['Kelvin', 'm', '🥶'], ['Pendule', 'm', '🕰️'], ['Ressort', 'm', '〰️'],
  ['Levier', 'm', '🏗️'], ['Poulie', 'f', '🪢'], ['Balance', 'f', '⚖️'], ['Gravité', 'f', '🌍'], ['Inertie', 'f', '🛋️'], ['Friction', 'f', '🛷'],
  ['Accélération', 'f', '🏎️'], ['Vitesse', 'f', '🏃'], ['Onde', 'f', '📡'], ['Fréquence', 'f', '🎚️'], ['Résonance', 'f', '🎶'], ['Spectre', 'm', '🌈'],
  ['Miroir', 'm', '🪞'], ['Diode', 'f', '🔴'], ['Transistor', 'm', '📟'], ['Condensateur', 'm', '🔋'], ['Résistance', 'f', '🔌'], ['Circuit', 'm', '🛤️'],
  ['Courant', 'm', '⚡'], ['Trou noir', 'm', '🕳️'], ['Supernova', 'f', '💥'], ['Pulsar', 'm', '📡'], ['Satellite', 'm', '🛰️'], ['Astéroïde', 'm', '☄️'],
  ['Météorite', 'f', '🌠'], ['Plasma', 'm', '🔮'], ['Boson', 'm', '✴️'], ['Neutrino', 'm', '👻'],
];

// Domaine du premier mot, pour proposer des pseudos « chimie » ou « physique » : 'c', 'p' ou 'x' (les deux).
const PHYSIQUE_ANCIENS = new Set([0, 1, 2, 3, 4, 8, 9, 10, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 28, 29]);
const MIXTES_ANCIENS = new Set([6, 7, 31, 52, 61]);
export const domaineNom = i => (i < 64 ? (MIXTES_ANCIENS.has(i) ? 'x' : PHYSIQUE_ANCIENS.has(i) ? 'p' : 'c') : i < 124 ? 'c' : 'p');
export const DOMAINES = [
  { code: 'tout', libelle: 'Tout', icone: '🎲' },
  { code: 'chimie', libelle: 'Chimie', icone: '⚗️' },
  { code: 'physique', libelle: 'Physique', icone: '🔭' },
];

export const pseudoValide = (adj, nom) => Number.isInteger(adj) && Number.isInteger(nom) && adj >= 0 && adj < ADJECTIFS.length && nom >= 0 && nom < NOMS.length;
export function pseudo(adj, nom) {
  if (!pseudoValide(adj, nom)) return { texte: 'Anonyme', icone: '❔' };
  const [n, genre, icone] = NOMS[nom];
  return { texte: `${n} ${ADJECTIFS[adj][genre === 'f' ? 1 : 0]}`, icone };
}
// Quelques propositions au hasard, sans doublon (alea : fonction renvoyant un nombre dans [0, 1[, pour pouvoir tester)
export function propositions(n = 4, alea = Math.random, exclure = [], domaine = 'tout') {
  const vus = new Set(exclure.map(([a, b]) => `${a}-${b}`)), L = [];
  const noms = NOMS.map((_, i) => i).filter(i => domaine === 'tout' || domaineNom(i) === 'x' || domaineNom(i) === (domaine === 'chimie' ? 'c' : 'p'));
  while (L.length < n) {
    const a = Math.floor(alea() * ADJECTIFS.length), b = noms[Math.floor(alea() * noms.length)], k = `${a}-${b}`;
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
