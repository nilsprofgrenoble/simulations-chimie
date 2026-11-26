// ====================================================
//  MODÈLE « POTENTIEL D'UN COUPLE : ESH ET RELATION DE NERNST » (sim 292, TSTL SPCL, partie Oxydo-réduction).
//  Programme : définir l'ESH comme demi-pile de référence ; déterminer le potentiel d'un couple par la relation de Nernst, la composition
//  étant donnée ; prévoir l'influence des concentrations sur le potentiel.
//  Relation utilisée (convention de la fiche de synthèse du chapitre 4) : à 25 °C, E = E° + (0,06 / n) × log( [Ox] × [H⁺]^β / [Red] ),
//  les solides valant 1 (leur « concentration » n'a pas de sens) et le dihydrogène de l'ESH étant à 1 bar.
//  Hypothèses de travail (rappelées dans la simulation) : 25 °C ; 0,06 V est un arrondi de (R T / F) ln 10 = 0,0592 V ; activités assimilées aux
//  concentrations (solutions diluées) ; tension mesurée à vide (aucun courant, voltmètre de grande résistance) ; ESH idéale à 0,00 V ;
//  potentiels standards tabulés à 25 °C ; la relation n'a de sens que si les deux espèces du couple sont présentes ; potentiel de jonction du pont salin négligé.
// ====================================================
export const PENTE_NERNST = 0.06;          // V (à 25 °C, convention de la fiche)
export const E_ESH = 0.00;                 // V, par convention
export const C_MIN = 1e-3, C_MAX = 1;      // mol/L : plage des concentrations proposées

// Couples. `beta` : exposant de [H⁺] dans le quotient. `oxSolide` / `redSolide` : espèce solide (valeur 1 dans le quotient).
export const COUPLES = {
  cu: { id: 'cu', nom: 'Cu²⁺ / Cu', ox: 'Cu²⁺', red: 'Cu', n: 2, E0: 0.34, beta: 0, redSolide: true, electrode: 'cuivre', demi: 'Cu²⁺(aq) + 2 e⁻ ⇄ Cu(s)' },
  zn: { id: 'zn', nom: 'Zn²⁺ / Zn', ox: 'Zn²⁺', red: 'Zn', n: 2, E0: -0.76, beta: 0, redSolide: true, electrode: 'zinc', demi: 'Zn²⁺(aq) + 2 e⁻ ⇄ Zn(s)' },
  ag: { id: 'ag', nom: 'Ag⁺ / Ag', ox: 'Ag⁺', red: 'Ag', n: 1, E0: 0.80, beta: 0, redSolide: true, electrode: 'argent', demi: 'Ag⁺(aq) + e⁻ ⇄ Ag(s)' },
  fe: { id: 'fe', nom: 'Fe³⁺ / Fe²⁺', ox: 'Fe³⁺', red: 'Fe²⁺', n: 1, E0: 0.77, beta: 0, electrode: 'platine', demi: 'Fe³⁺(aq) + e⁻ ⇄ Fe²⁺(aq)' },
  mn: { id: 'mn', nom: 'MnO₄⁻ / Mn²⁺', ox: 'MnO₄⁻', red: 'Mn²⁺', n: 5, E0: 1.51, beta: 8, electrode: 'platine', demi: 'MnO₄⁻(aq) + 8 H⁺(aq) + 5 e⁻ ⇄ Mn²⁺(aq) + 4 H₂O(l)' },
};
export const ORDRE_COUPLES = ['cu', 'zn', 'ag', 'fe', 'mn'];
// potentiels standards de la fiche (tableau 3.2), pour l'échelle des potentiels
export const ECHELLE = [
  { nom: 'H₂O₂ / H₂O', E0: 1.78 }, { nom: 'MnO₄⁻ / Mn²⁺', E0: 1.51 }, { nom: 'Ag⁺ / Ag', E0: 0.80 }, { nom: 'Cu²⁺ / Cu', E0: 0.34 }, { nom: 'H⁺ / H₂ (ESH)', E0: 0.00 }, { nom: 'Zn²⁺ / Zn', E0: -0.76 },
];

export const log10 = x => Math.log(x) / Math.LN10;
// quotient de la relation de Nernst (concentrations en mol/L, pH pour [H⁺] = 10^-pH)
export function quotient(c, cOx, cRed = 1, pH = 0) {
  const ox = c.oxSolide ? 1 : cOx, red = c.redSolide ? 1 : cRed, h = Math.pow(10, -pH * c.beta);
  return ox * h / red;
}
export const potentiel = (c, cOx, cRed = 1, pH = 0) => c.E0 + PENTE_NERNST / c.n * log10(quotient(c, cOx, cRed, pH));
export const penteDecade = c => PENTE_NERNST / c.n;                     // V par décade de [Ox] (ou de rapport Ox/Red)
export const penteParPH = c => -PENTE_NERNST * c.beta / c.n;            // V par unité de pH
// fem de la pile ESH | couple (tension à vide) : fem = E(couple) − E(ESH)
export const fem = (c, cOx, cRed, pH) => potentiel(c, cOx, cRed, pH) - E_ESH;
// nombre de points colorés dessinés pour une concentration (1 à 6, échelle logarithmique sur 1 mmol/L → 1 mol/L)
export const nbPoints = cc => Math.max(1, Math.min(6, Math.round(1 + 5 * (log10(Math.max(cc, 1e-9)) + 3) / 3)));

// ---------- parcours guidé ----------
export const CUIVRE = COUPLES.cu, ZINC = COUPLES.zn, FER = COUPLES.fe, PERMANGANATE = COUPLES.mn;
export const C_PREDIRE = 0.010;                       // mol/L : [Cu²⁺] après dilution (lecture du voltmètre)
export const C_NERNST = 5.0e-3;                       // mol/L : [Cu²⁺] du calcul guidé
export const FE_OX = 0.10, FE_RED = 0.010;            // mol/L : Fe³⁺ et Fe²⁺ du calcul avec un rapport
export const MN_OX = 0.020, MN_RED = 0.020, MN_PH = 1; // MnO₄⁻, Mn²⁺ (mol/L) et pH du calcul avec H⁺
export const CONC_DROITE = [1, 0.1, 0.01, 0.001];     // mol/L : points de la droite E = f(log c) du parcours (Cu²⁺/Cu)
export const pointsDroite = (c, cs = CONC_DROITE) => cs.map(x => ({ c: x, logc: log10(x), E: potentiel(c, x) }));

// ---------- défis ----------
const CONCS = [1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5];
const tire = l => l[Math.floor(Math.random() * l.length)];
// défi 1 : calculer le potentiel d'un couple à partir de la composition
export function tirageDefiCalcul() {
  const id = tire(['cu', 'zn', 'ag', 'fe', 'mn']), c = COUPLES[id];
  const cOx = tire(CONCS); let cRed = 1, pH = 0;
  if (id === 'fe') { do { cRed = tire(CONCS); } while (cRed === cOx); }
  if (id === 'mn') { cRed = tire(CONCS); pH = tire([0, 1, 2, 3]); }
  return { id, cOx, cRed, pH, E: potentiel(c, cOx, cRed, pH) };
}
// défi 2 : concentration inconnue en Cu²⁺, Zn²⁺ ou Ag⁺ à partir de la fem à vide d'une pile avec l'ESH (lue au millivolt)
export function tirageDefiInconnue() {
  const id = tire(['cu', 'zn', 'ag']), c = COUPLES[id], cx = tire(CONCS), Emes = Number(potentiel(c, cx).toFixed(3));
  return { id, c: cx, Emes };
}
export const concDepuisE = (c, E) => Math.pow(10, (E - c.E0) * c.n / PENTE_NERNST);

// ---------- affichage (notation française) ----------
export const fr = (v, d = 2) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const sciTexte = c => { if (c >= 0.1) return fr(c, c >= 1 ? 1 : 2); const e = Math.floor(log10(c) + 1e-9), m = c / Math.pow(10, e); return `${fr(m, 1)}×10${[...String(e)].map(x => (x === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[x])).join('')}`; };
export const concTexte = c => sciTexte(c);
