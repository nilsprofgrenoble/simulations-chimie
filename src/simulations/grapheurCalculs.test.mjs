import { compilerFormule, evaluerColonnes, regressionParabole, regressionExponentielle, ajuster, echelleLog, penteLocale, penteFonction, serieDe } from './grapheurCalculs.js';
let ok = 0; const q = (c, m) => { if (!c) { console.error('ÉCHEC : ' + m); process.exit(1); } ok++; };
const pres = (a, b, t, m) => q(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${m} : ${a} ≠ ${b}`);
const ev = (f, v = {}) => { const c = compilerFormule(f, Object.keys(v)); q(c.ok, f + ' : ' + c.erreur); return c.evaluer(v); };

// Formules
pres(ev('2+3*4'), 14, 1e-12, 'priorité'); pres(ev('(2+3)*4'), 20, 1e-12, 'parenthèses');
pres(ev('-2^2'), -4, 1e-12, 'moins unaire et puissance'); pres(ev('2^3^2'), 512, 1e-12, 'puissance associative à droite');
pres(ev('2^-1'), 0.5, 1e-12, 'puissance négative'); pres(ev('10/4'), 2.5, 1e-12, 'division');
pres(ev('1,5*2'), 3, 1e-12, 'virgule décimale'); pres(ev('2,5e-3*1000'), 2.5, 1e-12, 'notation e');
pres(ev('-log(A)', { A: 0.1 }), 1, 1e-12, 'log décimal'); pres(ev('ln(exp(2))'), 2, 1e-12, 'ln exp');
pres(ev('sqrt(U^2+V^2)', { U: 3, V: 4 }), 5, 1e-12, 'sqrt'); pres(ev('2×π'), 2 * Math.PI, 1e-12, 'pi et ×');
pres(ev('m*g*h', { m: 2, g: 9.8, h: 3 }), 58.8, 1e-12, 'variables'); pres(ev('t_1 + t', { t_1: 1, t: 2 }), 3, 1e-12, 'nom avec _');
pres(ev('A − 1', { A: 5 }), 4, 1e-12, 'signe moins typographique');
for (const mauvais of ['', '2+', '(2', '2 $ 3', 'foo(2)', 'x+1', '2 3']) q(!compilerFormule(mauvais, ['A']).ok, 'doit refuser « ' + mauvais + ' »');
q(!compilerFormule('process.exit(1)', []).ok && !compilerFormule('constructor', []).ok, 'aucune exécution de code');
// colonnes calculées : division par zéro et cellules vides → NaN
const cols = [{ nom: 'T', unite: '' }, { nom: 'A', unite: '', formule: '-log(T)' }, { nom: 'B', unite: '', formule: '1/(T-1)' }, { nom: 'C', unite: '', formule: 'D*2' }];
const r = evaluerColonnes(cols, [['0,1'], ['1'], ['']]);
pres(r.valeurs[1][0], 1, 1e-12, 'colonne calculée'); q(Number.isNaN(r.valeurs[2][1]), 'division par zéro → NaN'); q(Number.isNaN(r.valeurs[1][2]), 'cellule vide → NaN');
q(r.erreurs[3].includes('D'), 'colonne inconnue signalée');
const sd = serieDe(r.valeurs, 0, 1); q(sd.x.length === 2 && sd.lig[1] === 1, 'séries : lignes incomplètes ignorées');

// Parabole : données exactes
let x = [0, 1, 2, 3, 4, 5, 6], y = x.map(v => 2 * v * v - 3 * v + 1);
let p = regressionParabole(x, y);
pres(p.p[0], 2, 1e-10, 'a'); pres(p.p[1], -3, 1e-10, 'b'); pres(p.p[2], 1, 1e-10, 'c'); q(p.sr < 1e-8, 'sr nul');
// x grand devant son étendue (stabilité)
x = [1000, 1001, 1002, 1003, 1004]; y = x.map(v => 0.5 * (v - 1002) ** 2 + 7);
p = regressionParabole(x, y); pres(p.f(1002), 7, 1e-6, 'stabilité x grand'); pres(p.p[0], 0.5, 1e-6, 'a stabilité');
q(regressionParabole([1, 2, 3], [1, 4, 9]) === null, 'moins de 4 points refusé');

// Exponentielles : récupération exacte
x = [0, 1, 2, 3, 4, 5, 6, 8]; y = x.map(v => 5 * Math.exp(-0.4 * v));
let e = regressionExponentielle(x, y, false);
pres(e.A, 5, 1e-6, 'A'); pres(e.k, -0.4, 1e-6, 'k'); pres(e.tau, 2.5, 1e-6, 'tau');
y = x.map(v => 12 - 12 * Math.exp(-v / 2.5));            // charge d'un condensateur : 12 (1 − e^(−t/τ))
e = regressionExponentielle(x, y, true);
pres(e.y0, 12, 1e-6, 'asymptote'); pres(e.A, -12, 1e-6, 'amplitude'); pres(e.tau, 2.5, 1e-6, 'tau charge');
// x décalé (t0 grand) : le résultat doit rester juste
x = [100, 101, 102, 103, 104, 105]; y = x.map(v => 3 * Math.exp(-0.7 * (v - 100)));
e = regressionExponentielle(x, y, false); pres(e.k, -0.7, 1e-6, 'k décalé'); pres(e.f(102), 3 * Math.exp(-1.4), 1e-6, 'f décalé');
// croissance
x = [0, 1, 2, 3, 4, 5]; y = x.map(v => 0.2 * Math.exp(0.9 * v)); e = regressionExponentielle(x, y, false); pres(e.k, 0.9, 1e-6, 'croissance');
q(ajuster('affine', [1, 2, 3, 4], [2, 4, 6, 8.1]).f(5) > 9.9, 'affine au même format');
q(ajuster('inconnu', [1, 2], [1, 2]) === null, 'modèle inconnu');

// Échelle log
const l = echelleLog(3, 800); q(l.min === 0 && l.max === 3, 'bornes log'); q(l.graduations.some(g => g.v === 5 && !g.principale) && l.graduations.some(g => g.v === 100 && g.principale), 'graduations 1-2-5');
q(echelleLog(0, 5) === null && echelleLog(-1, 5) === null, 'log refuse ≤ 0');
// Tangente
pres(penteLocale([0, 1, 2, 3], [0, 1, 4, 9], 1), 2, 1e-12, 'pente locale (x²) en 1 = (4−0)/2'); pres(penteFonction(v => v * v, 3), 6, 1e-6, 'dérivée');
console.log(`grapheurCalculs : ${ok} vérifications réussies`);
