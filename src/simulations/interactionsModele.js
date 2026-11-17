// Modèle pur de la mini-simulation « Pourquoi un plan d'expériences ? » (idée d'interaction), sans interface.
// Un « scénario » est un petit plan 2² : réponse sans A ni B (base), avec A seul, avec B seul, avec A et B ensemble.
// Les scénarios de football sont des chiffres INVENTÉS pour illustrer ; ceux de chimie viennent des TP réels (moyennes arrondies au dixième).
//   vinaigrette : note du jury moyennée sur les 4 essais de chaque case du plan 2⁴ (amidon Ultratech U, amidon Novation N, niveaux bas / haut) ;
//   rouge à lèvres : note du jury de la candelilla pure, de l'huile de ricin pure et de leur mélange à parts égales (plan de mélange).

export const r1 = x => Math.round(x * 10 + (x < 0 ? -1e-9 : 1e-9)) / 10;

export const SCEN = {
  vedettes: { id: 'vedettes', titre: 'Deux attaquants vedettes', unite: 'buts / match', dec: 1, base: 0.8, A: 2.1, B: 2.3, AB: 1.6, cA: 'A', cB: 'B', nomA: 'l’attaquant A', nomB: 'l’attaquant B',
    etiq: [['ni A', 'ni B'], ['A', 'seul'], ['B', 'seul'], ['A et B', 'ensemble']], imag: true },
  moyens: { id: 'moyens', titre: 'Deux joueurs moyens', unite: 'buts / match', dec: 1, base: 0.8, A: 1.0, B: 1.1, AB: 2.4, cA: 'C', cB: 'D', nomA: 'le joueur C', nomB: 'le joueur D',
    etiq: [['ni C', 'ni D'], ['C', 'seul'], ['D', 'seul'], ['C et D', 'ensemble']], imag: true },
  vinaigrette: { id: 'vinaigrette', titre: 'Vinaigrette : deux amidons', unite: '/ 10', dec: 1, base: 2.4, A: 5.1, B: 7.6, AB: 7.1, cA: 'U', cB: 'N', nomA: 'l’amidon Ultratech (U)', nomB: 'l’amidon Novation (N)',
    etiq: [['U bas', 'N bas'], ['U haut', 'N bas'], ['U bas', 'N haut'], ['U haut', 'N haut']], imag: false },
};

export const additif = s => r1(s.A + s.B - s.base);          // réponse prévue si les effets de A et de B s'additionnent
export const effetA = s => r1(s.A - s.base);
export const effetB = s => r1(s.B - s.base);
export const interaction = s => r1(s.AB - additif(s));         // mesuré − prévu additif
export const verdict = (i, tol = 0.05) => (Math.abs(i) <= tol ? 'aucune' : i > 0 ? 'synergie' : 'antagonisme');

// Rouge à lèvres (plan de mélange) : deux corps purs et leur mélange à parts égales
export const ROUGE = { A: 5, B: 2, AB: 8 };
export const moyenneRouge = r => (r.A + r.B) / 2;
export const ecartRouge = r => r1(r.AB - moyenneRouge(r));

// Défi : plan 2² tiré au hasard
export function tirage(rnd = Math.random) {
  const pick = t => t[Math.floor(rnd() * t.length)];
  for (;;) {
    const base = pick([1, 1.5, 2, 2.5, 3]), a = pick([0.5, 1, 1.5, 2, 2.5]), b = pick([0.5, 1, 1.5, 2, 2.5]), it = pick([-2, -1.5, -1, 0, 1, 1.5, 2]);
    const s = { base, A: r1(base + a), B: r1(base + b), AB: r1(base + a + b + it) };
    if (s.AB >= 0 && s.AB <= 10) return s;
  }
}

// Format français : virgule décimale, vrai signe moins
export const nf = (v, d = 1) => Number(v).toFixed(d).replace(/^-(0(\.0*)?)$/, '$1').replace('.', ',').replace('-', '−');
