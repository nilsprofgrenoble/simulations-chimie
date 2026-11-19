// ====================================================
//  Modèle de la simulation 158 « Savons et amphiphilie : pourquoi un savon lave » (1G spé PC,
//  partie « Cohésion, dissolution, solubilité » : amphiphilie).
//  Modèle QUALITATIF : une entité est décrite par sa formule semi-développée, découpée en une partie « chaîne »
//  (carbones et hydrogènes, apolaire) et une partie « tête » (groupe polaire). Le caractère hydrophile, lipophile
//  ou amphiphile se déduit de ces deux parties. Aucune concentration micellaire critique (hors programme de 1G).
//  Fichier sans React : testé par savonModele.test.mjs (les formules brutes sont recalculées à partir des
//  formules semi-développées par un petit analyseur, jamais écrites à la main sans contrôle).
// ====================================================

// Masses molaires atomiques arrondies (g/mol), valeurs d'usage en première
export const MASSES = { C: 12.0, H: 1.0, O: 16.0, Na: 23.0, Cl: 35.5 };

// Seuil indicatif : une chaîne carbonée est dite « longue » (donc lipophile) à partir de 8 atomes de carbone.
// C'est une règle de choix pour la simulation, pas une loi : elle sépare ici les ions éthanoate ou l'éthanol (2 C)
// des savons usuels (11 à 17 C).
export const SEUIL_CHAINE = 8;

// tete : 'COO-' (carboxylate, chargé), 'COOH' (acide carboxylique, polaire non chargé), 'OH' (alcool), 'ions' (sel), null.
// chaine / teteTxt : parties de la formule semi-développée (la formule affichée est chaine + teteTxt).
// chaineC : nombre d'atomes de carbone de la partie apolaire (CH₃, CH₂, CH=CH).
// dbl : rang (en partant du CH₃, à partir de 0) du premier carbone d'une double liaison cis C=C, pour le dessin.
// nCH2 : nombre de groupes CH₂ de la chaîne saturée (pour les familles de savons), sinon null.
export const ENTITES = [
  { id: 'stearate', nom: 'ion stéarate (octadécanoate)', court: 'stéarate', chaine: 'CH₃–(CH₂)₁₆–', teteTxt: 'COO⁻', tete: 'COO-', chaineC: 17, nCH2: 16, brute: { C: 18, H: 35, O: 2 }, q: -1, contre: 'Na⁺' },
  { id: 'palmitate', nom: 'ion palmitate (hexadécanoate)', court: 'palmitate', chaine: 'CH₃–(CH₂)₁₄–', teteTxt: 'COO⁻', tete: 'COO-', chaineC: 15, nCH2: 14, brute: { C: 16, H: 31, O: 2 }, q: -1, contre: 'Na⁺' },
  { id: 'laurate', nom: 'ion laurate (dodécanoate)', court: 'laurate', chaine: 'CH₃–(CH₂)₁₀–', teteTxt: 'COO⁻', tete: 'COO-', chaineC: 11, nCH2: 10, brute: { C: 12, H: 23, O: 2 }, q: -1, contre: 'Na⁺' },
  { id: 'oleate', nom: 'ion oléate (octadéc-9-énoate)', court: 'oléate', chaine: 'CH₃–(CH₂)₇–CH=CH–(CH₂)₇–', teteTxt: 'COO⁻', tete: 'COO-', chaineC: 17, nCH2: null, brute: { C: 18, H: 33, O: 2 }, q: -1, contre: 'Na⁺', dbl: 8 },
  { id: 'acetate', nom: 'ion éthanoate (acétate)', court: 'éthanoate', chaine: 'CH₃–', teteTxt: 'COO⁻', tete: 'COO-', chaineC: 1, nCH2: 0, brute: { C: 2, H: 3, O: 2 }, q: -1, contre: 'Na⁺' },
  { id: 'acide-stearique', nom: 'acide stéarique (acide octadécanoïque)', court: 'acide stéarique', chaine: 'CH₃–(CH₂)₁₆–', teteTxt: 'COOH', tete: 'COOH', chaineC: 17, nCH2: 16, brute: { C: 18, H: 36, O: 2 }, q: 0, contre: null },
  { id: 'dodecanol', nom: 'dodécan-1-ol', court: 'dodécan-1-ol', chaine: 'CH₃–(CH₂)₁₀–CH₂–', teteTxt: 'OH', tete: 'OH', chaineC: 12, nCH2: null, brute: { C: 12, H: 26, O: 1 }, q: 0, contre: null },
  { id: 'dodecane', nom: 'dodécane', court: 'dodécane', chaine: 'CH₃–(CH₂)₁₀–CH₃', teteTxt: '', tete: null, chaineC: 12, nCH2: null, brute: { C: 12, H: 26 }, q: 0, contre: null },
  { id: 'ethanol', nom: 'éthanol', court: 'éthanol', chaine: 'CH₃–CH₂–', teteTxt: 'OH', tete: 'OH', chaineC: 2, nCH2: null, brute: { C: 2, H: 6, O: 1 }, q: 0, contre: null },
  { id: 'nacl', nom: 'chlorure de sodium', court: 'NaCl', chaine: '', teteTxt: 'Na⁺ + Cl⁻', tete: 'ions', chaineC: 0, nCH2: null, brute: { Na: 1, Cl: 1 }, q: 0, contre: null },
];
export const entite = id => ENTITES.find(e => e.id === id);
export const semi = e => `${e.chaine}${e.teteTxt}`;

// ---------- analyseur de formule semi-développée : « CH₃–(CH₂)₁₆–COO⁻ » → { C: 18, H: 35, O: 2 } ----------
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const chiffre = c => SUBS.indexOf(c);
export function compter(f) {
  let i = 0;
  function groupe() {
    const n = {};
    const ajoute = (s, k) => { n[s] = (n[s] || 0) + k; };
    while (i < f.length) {
      const c = f[i];
      if (c === ')') return n;
      if (c === '(') {
        i++; const g = groupe(); i++;
        let m = 0, vu = false; while (i < f.length && chiffre(f[i]) >= 0) { m = m * 10 + chiffre(f[i]); vu = true; i++; }
        for (const [s, k] of Object.entries(g)) ajoute(s, k * (vu ? m : 1));
        continue;
      }
      if (/[A-Z]/.test(c)) {
        let s = c; i++;
        if (i < f.length && /[a-z]/.test(f[i])) { s += f[i]; i++; }
        let m = 0, vu = false; while (i < f.length && chiffre(f[i]) >= 0) { m = m * 10 + chiffre(f[i]); vu = true; i++; }
        ajoute(s, vu ? m : 1); continue;
      }
      i++;   // séparateurs : – = + ⁻ ⁺ espaces
    }
    return n;
  }
  return groupe();
}
// formule brute de l'entité, comptée sur la formule semi-développée (pour NaCl : Na et Cl)
export function brute(e) {
  if (e.tete === 'ions') return { Na: 1, Cl: 1 };
  return compter(semi(e));
}
export const nbAtomes = (e, s) => brute(e)[s] || 0;
export function formuleBrute(e) {
  const b = brute(e), ordre = ['C', 'H', 'O', 'Na', 'Cl'];
  return ordre.filter(s => b[s]).map(s => s + (b[s] > 1 ? String(b[s]).split('').map(d => SUBS[+d]).join('') : '')).join('');
}
// carbones de la partie apolaire, comptés sur la formule de la chaîne
export const carbonesChaine = e => compter(e.chaine).C || 0;

// masse molaire de l'entité, ou du sel de sodium pour un carboxylate (g/mol)
export function masseMolaire(e, { sel = false } = {}) {
  const b = brute(e);
  let M = Object.entries(b).reduce((t, [s, k]) => t + MASSES[s] * k, 0);
  if (sel && e.tete === 'COO-') M += MASSES.Na;
  return M;
}

// ---------- caractère de l'entité ----------
// polaire : possède une partie polaire (groupe COO⁻, COOH, OH, ou ions) ; lipophile : possède une chaîne carbonée longue
export function classer(e) {
  const polaire = e.tete !== null;
  const longue = carbonesChaine(e) >= SEUIL_CHAINE;
  const caractere = polaire && longue ? 'amphiphile' : polaire ? 'hydrophile' : 'lipophile';
  const savon = caractere === 'amphiphile' && e.tete === 'COO-';
  // tête polaire mais non chargée : amphiphile « faible », presque insoluble dans l'eau : ce n'est pas un savon
  const faible = caractere === 'amphiphile' && !savon;
  return { polaire, longue, caractere, savon, faible };
}
export const NOM_CARACTERE = { amphiphile: 'amphiphile', hydrophile: 'hydrophile', lipophile: 'lipophile (hydrophobe)' };

// phrase de justification, d'après la structure
export function justification(e) {
  const c = classer(e), n = carbonesChaine(e);
  const tete = { 'COO-': 'un groupe COO⁻ chargé : polaire, il attire les molécules d’eau', COOH: 'un groupe COOH polaire, mais non chargé : il attire l’eau bien moins que COO⁻', OH: 'un groupe OH polaire', ions: 'deux ions qui s’entourent de molécules d’eau' }[e.tete];
  if (e.tete === 'ions') return `Pas de chaîne carbonée : ${tete}. Il est hydrophile et n’a aucune partie lipophile.`;
  if (c.caractere === 'lipophile') return `Une chaîne de ${n} atomes de carbone : les liaisons C–C et C–H sont apolaires, la chaîne est insoluble dans l’eau et soluble dans les graisses. Aucun groupe polaire : l’entité est lipophile et ne se dissout pas dans l’eau.`;
  if (c.caractere === 'hydrophile') return `Un ${tete.replace(/^un /, '')}. Mais la chaîne ne compte que ${n} atome${n > 1 ? 's' : ''} de carbone : trop courte pour être lipophile. L’entité est hydrophile, elle ne forme pas de micelles.`;
  const fin = c.savon ? 'Deux parties aux propriétés opposées : l’entité est amphiphile et c’est un savon (avec son contre-ion Na⁺).'
    : 'Deux parties aux propriétés opposées : l’entité est amphiphile, mais sa tête non chargée est peu hydrophile : elle est presque insoluble dans l’eau et ne lave pas comme un savon.';
  return `Une chaîne de ${n} atomes de carbone (apolaire, lipophile) et ${tete}. ${fin}`;
}

// ---------- tirages et calculs pour les exercices et le défi ----------
// ion carboxylate à chaîne saturée CH₃–(CH₂)ₙ–COO⁻ : nombres d'atomes et masse molaire du sel de sodium
export const carboxylate = n => ({ n, C: n + 2, H: 2 * n + 3, O: 2, M: (n + 2) * MASSES.C + (2 * n + 3) * MASSES.H + 2 * MASSES.O + MASSES.Na, Manion: (n + 2) * MASSES.C + (2 * n + 3) * MASSES.H + 2 * MASSES.O });
export const SERIE = [[10, 'laurate (dodécanoate)'], [12, 'myristate (tétradécanoate)'], [14, 'palmitate (hexadécanoate)'], [16, 'stéarate (octadécanoate)']];

// ---------- lavage : quatre stades ----------
export const STADES = [
  { id: 0, titre: 'Avant le savon', txt: 'La salissure est collée au tissu, plongé dans l’eau pure. Elle ne se dissout pas.' },
  { id: 1, titre: 'Les ions s’orientent', txt: 'Les ions se placent autour de la salissure : les chaînes apolaires s’insèrent dedans, les têtes COO⁻ restent côté eau.' },
  { id: 2, titre: 'La salissure se détache', txt: 'Sous l’effet de l’agitation, la salissure se décolle du tissu, entourée d’ions.' },
  { id: 3, titre: 'Au rinçage', txt: 'Après le rinçage, le tissu est propre : la salissure est au centre d’une micelle.' },
];

// ---------- hors programme : milieux qui gênent un savon ----------
export const MILIEUX = [
  { id: 'dure', nom: 'une eau dure (riche en ions Ca²⁺ et Mg²⁺)', bonne: 'non : les ions Ca²⁺ forment avec le savon un solide insoluble', faux: ['oui : les ions Ca²⁺ renforcent les micelles et améliorent le lavage', 'non : les ions Ca²⁺ détruisent la chaîne carbonée du savon', 'oui : les ions Ca²⁺ n’ont aucun effet sur des ions carboxylate'],
    expl: 'Les ions calcium s’associent à deux ions carboxylate pour former un sel insoluble (le « savon calcaire », qui forme un dépôt) : il reste moins d’ions carboxylate libres pour former des micelles.' },
  { id: 'acide', nom: 'une eau très acide (de pH inférieur à 4)', bonne: 'non : l’ion carboxylate capte H⁺ et devient l’acide gras insoluble', faux: ['oui : les ions H⁺ renforcent la charge négative de la tête COO⁻', 'non : les ions H⁺ cassent la chaîne carbonée en petits morceaux', 'oui : les ions H⁺ attirent la chaîne apolaire vers l’eau'],
    expl: 'Dans une solution acide, l’ion R–COO⁻ capte un ion H⁺ et devient l’acide R–COOH : sa tête n’est plus chargée, il est presque insoluble dans l’eau et ne forme plus de micelles.' },
  { id: 'salee', nom: 'une eau très salée (Na⁺ et Cl⁻ en grande quantité)', bonne: 'moins bien : le savon devient moins soluble et se sépare de l’eau', faux: ['mieux : les ions Na⁺ en excès rendent le savon plus soluble', 'moins bien : les ions Cl⁻ détruisent les têtes COO⁻ du savon', 'aussi bien : le sel ne change rien à la solubilité du savon'],
    expl: 'Quand l’eau contient beaucoup d’ions Na⁺ et Cl⁻, le savon (sel de sodium) devient moins soluble : il se sépare en partie de l’eau (c’est le « relargage », utilisé pour isoler le savon fabriqué).' },
  { id: 'douce', nom: 'une eau douce, de pH proche de 7 et peu minéralisée', bonne: 'oui : l’eau douce et neutre laisse les ions carboxylate libres', faux: ['non : seule une eau très salée permet aux savons de laver', 'non : seule une eau acide permet aux savons de former des micelles', 'oui : mais seulement si l’eau contient beaucoup d’ions Ca²⁺'],
    expl: 'Dans une eau douce de pH voisin de 7, les ions carboxylate restent dissous et libres : ils forment des micelles et le savon lave normalement.' },
];
export const milieu = id => MILIEUX.find(m => m.id === id);
