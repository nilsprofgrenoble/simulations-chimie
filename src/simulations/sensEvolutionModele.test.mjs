// Test node du modèle de la sim 293 : node src/simulations/sensEvolutionModele.test.mjs
import * as M from './sensEvolutionModele.js';
let n = 0, ko = 0;
const ok = (c, msg) => { n++; if (!c) { ko++; console.log('ÉCHEC :', msg); } };
const proche = (a, b, t, msg) => ok(Math.abs(a - b) <= t, `${msg} : ${a} ≠ ${b}`);

// --- log K des paires ---
const lk = (a, b) => M.paire(a, b).logK;
proche(lk('zn', 'cu'), 2 * 1.10 / 0.06, 1e-9, 'log K Zn/Cu');
proche(lk('cu', 'ag'), 2 * 0.46 / 0.06, 1e-9, 'log K Cu/Ag');
proche(lk('fe', 'ag'), 0.5, 1e-9, 'log K Fe/Ag');
proche(lk('cu', 'fe'), 2 * 0.43 / 0.06, 1e-9, 'log K Cu/Fe');
proche(M.H2O2.logK, 36.667, 1e-3, 'log K H2O2');
// équations
ok(M.equationTexte(M.paire('ag', 'cu'), false) === '2 Ag⁺ + Cu ⇌ 2 Ag + Cu²⁺', 'équation Ag/Cu : ' + M.equationTexte(M.paire('ag', 'cu'), false));
ok(M.equationTexte(M.paire('ag', 'fe'), false) === 'Ag⁺ + Fe²⁺ ⇌ Ag + Fe³⁺', 'équation Ag/Fe : ' + M.equationTexte(M.paire('ag', 'fe'), false));
ok(M.equationTexte(M.paire('zn', 'fe'), false) === '2 Fe³⁺ + Zn ⇌ 2 Fe²⁺ + Zn²⁺', 'équation Zn/Fe : ' + M.equationTexte(M.paire('zn', 'fe'), false));
ok(M.paire('zn', 'cu').N === 2 && M.paire('ag', 'cu').a === 2 && M.paire('ag', 'cu').b === 1, 'N, a, b');

// --- Qr du parcours : Ag⁺ 0,10 et Cu²⁺ 0,10 → Qr = 0,10 / 0,01 = 10 ---
const pAg = M.paire(...M.GUIDE.ag);
proche(M.quotient(pAg, M.GUIDE.agC), 10, 1e-9, 'Qr Ag/Cu');
ok(M.sens(pAg, M.GUIDE.agC) === 'direct', 'sens Ag/Cu');
const pInv = M.paire(...M.GUIDE.inv);
proche(M.quotient(pInv, M.GUIDE.invC), 100, 1e-6, 'Qr inverse');
ok(M.sens(pInv, M.GUIDE.invC) === 'inverse', 'sens inverse');
const E = M.potentiels(pInv, M.GUIDE.invC);
proche(E.E2 /* Fe³⁺/Fe²⁺ */, 0.77, 1e-12, 'E Fe');
proche(E.E1 /* Ag⁺/Ag */, 0.80 + 0.06 * Math.log10(0.01), 1e-12, 'E Ag = 0,68');

// --- lien Nernst ↔ Qr : E1 − E2 = (0,06 / N) log(K / Qr), sur de nombreux tirages ---
const CONCS = [1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1];
let verifs = 0;
for (const [a, b] of M.PAIRES) {
  const p = M.paire(a, b);
  for (let i = 0; i < 400; i++) {
    const c = Object.fromEntries(p.dissoutes.map(e => [e, CONCS[Math.floor(Math.random() * CONCS.length)]]));
    const d = M.ecartE(p, c), th = M.PENTE / p.N * (p.logK - M.logQ(p, c));
    proche(d, th, 1e-9, `lien E/Qr ${a}${b}`); verifs++;
    ok((d > 0) === (M.sens(p, c) === 'direct') || Math.abs(d) < 1e-9, 'signe de E1 − E2 = sens');
  }
}

// --- évolution jusqu'à l'équilibre : Qr final = K, bilan de matière, solides en excès ---
let evols = 0;
for (const [a, b] of M.PAIRES) {
  const p = M.paire(a, b);
  for (let i = 0; i < 300; i++) {
    const c0 = Object.fromEntries(p.dissoutes.map(e => [e, CONCS[Math.floor(Math.random() * CONCS.length)]]));
    const ev = M.evolution(p, c0);
    proche(M.logQ(p, ev.fin), p.logK, 1e-6, `Qr final = K ${a}${b} ${JSON.stringify(c0)}`);
    ok(Object.values(ev.fin).every(v => v > 0 && isFinite(v)), 'concentrations finales > 0');
    // bilan de matière : chaque dissoute varie de coef × x
    for (const s of p.especes) if (!s.solide) {
      const attendu = c0[s.e] + s.coef * ev.x;
      ok(Math.abs(ev.fin[s.e] - attendu) <= 1e-9 * Math.max(1, c0[s.e]) + 1e-12, `bilan ${s.e} : ${ev.fin[s.e]} vs ${attendu}`);
    }
    // le sens annoncé est celui de l'évolution (x du bon signe)
    ok(ev.sens === 'direct' ? ev.x > 0 : ev.sens === 'inverse' ? ev.x < 0 : ev.x === 0, 'signe de x');
    // trajectoire : Qr monotone de Qr0 vers K
    let prec = M.etatTau(ev, 0).logQ; proche(prec, M.logQ(p, c0), 1e-9, 'τ = 0');
    for (let k = 1; k <= 40; k++) {
      const e = M.etatTau(ev, k / 40);
      ok(ev.sens === 'direct' ? e.logQ >= prec - 1e-9 : e.logQ <= prec + 1e-9, 'Qr monotone');
      prec = e.logQ;
    }
    proche(M.etatTau(ev, 1).logQ, p.logK, 1e-6, 'τ = 1'); evols++;
  }
}
// cas du parcours : Ag⁺ + Cu, [Ag⁺] 0,10 : tout l'argent est consommé (K = 10^15,3)
const ev1 = M.evolution(pAg, M.GUIDE.agC);
ok(ev1.fin['Ag⁺'] < 1e-7 && Math.abs(ev1.fin['Cu²⁺'] - 0.15) < 1e-6, `fin Ag/Cu : ${JSON.stringify(ev1.fin)}`);
const ev2 = M.evolution(pInv, M.GUIDE.invC);
ok(ev2.sens === 'inverse' && ev2.fin['Ag⁺'] > 0.010, 'inverse : Ag⁺ augmente');
// équilibre exact
const cEq = { 'Ag⁺': 0.1, 'Fe²⁺': 0.1, 'Fe³⁺': 0.1 * 0.1 * Math.pow(10, 0.5) };
ok(M.sens(pInv, cEq) === 'equilibre', 'équilibre');

// --- défis ---
for (let i = 0; i < 3000; i++) {
  const d = M.tirageDefiK(); ok(d.p.logK > 0.4, 'défi K : log K > 0'); ok(d.ids.length === 2 && d.ids[0] !== d.ids[1], 'défi K : deux couples');
  const t = M.tirageDefiSens();
  ok(Math.abs(t.p.logK - M.logQ(t.p, t.c)) >= 0.4 || (t.ids[0] === 'cu' && t.ids[1] === 'zn'), 'défi sens : écart suffisant');
  ok(Object.values(t.c).every(v => v >= 1e-3 && v <= 1), 'défi sens : concentrations');
}
// proportion d'inverses et pire cas d'arrondi de log K (E° au centivolt → l'élève qui arrondit à 2 chiffres significatifs doit réussir)
let inv = 0; for (let i = 0; i < 2000; i++) if (M.sens(...(() => { const t = M.tirageDefiSens(); return [t.p, t.c]; })()) === 'inverse') inv++;
ok(inv > 700 && inv < 1300, `part de sens inverse : ${inv}/2000`);
for (const [a, b] of M.PAIRES) { const v = M.paire(a, b).logK, arr = Number(v.toPrecision(2)); ok(Math.abs(arr - v) <= M.tolLogK(v), `arrondi log K ${a}${b} : ${v} → ${arr}, tol ${M.tolLogK(v)}`); }

console.log(`${n} vérifications, ${ko} échec(s) ; ${verifs} liens E/Qr, ${evols} évolutions.`);
process.exit(ko ? 1 : 0);
