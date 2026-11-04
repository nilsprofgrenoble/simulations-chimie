import * as M from './acidesBasesModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
const pr = (x, y, t, m) => ok(Math.abs(x - y) <= t, `${m} : ${x} vs ${y}`);
// 1 acide fort 1e-2 -> 2 ; 1e-8 -> 6,98 (eau)
pr(M.pH({ ca: 1e-2 }), 2, 1e-3, 'HCl 1e-2');
pr(M.pH({ ca: 1e-8 }), 6.978, 5e-3, 'HCl 1e-8');
pr(M.pH({}), 7, 1e-6, 'eau pure');
pr(M.pH({ cb: 1e-2 }), 12, 1e-3, 'NaOH 1e-2');
// 2 acide éthanoïque 1e-2 pKa 4,8 : approx 3,40 ; exact ~3,40
const e = M.pH({ C: 1e-2, pKas: [4.8] });
pr(e, M.pHAcideFaibleApprox(1e-2, 4.8), 0.02, 'approx acide faible concentré');
// 3 dilution : tau augmente
ok(M.tauAcide(1e-4, 4.8) > M.tauAcide(1e-2, 4.8), 'tau croît à la dilution');
pr(M.tauAcide(1e-2, 4.8), 0.0390, 0.001, 'tau 1e-2');
// 4 cas où l'approximation échoue : C=1e-6, pKa 4,8 -> exact ≠ approx
ok(Math.abs(M.pH({ C: 1e-6, pKas: [4.8] }) - M.pHAcideFaibleApprox(1e-6, 4.8)) > 0.1, 'approx échoue à forte dilution');
// 5 base faible NH3 1e-2 pKa 9,25 : approx 10,6
pr(M.pHBase(1e-2, 9.25), M.pHBaseFaibleApprox(1e-2, 9.25), 0.02, 'base faible');
// 6 tampon équimolaire : pH = pKa
pr(M.pHTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8 }), 4.8, 0.01, 'tampon équimolaire');
// 7 Henderson 
pr(M.pHTampon({ nAH: 0.002, nA: 0.02, V: 0.1, pKa: 4.8 }), 5.8, 0.01, 'tampon 10:1');
// 8 pouvoir tampon max à pH=pKa, ≈ 2,303·C/4
const b1 = M.pouvoirTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8 }); pr(b1, 2.303 * 0.2 / 4, 0.003, 'beta max');
const b2 = M.pouvoirTampon({ nAH: 0.0005, nA: 0.0195, V: 0.1, pKa: 4.8 }); ok(b2 < b1 / 3, 'beta plus faible loin du pKa');
// 9 ajout de 1e-3 mol HCl dans 100 mL : tampon vs eau
const dT = M.pHTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8, nAjout: -1e-3 }) - 4.8; ok(dT < 0 && Math.abs(dT) < 0.1, 'variation tampon faible ' + dT);
pr(M.pH({ ca: 1e-2 }) - 7, -5, 0.001, 'eau + HCl');
// 10 titrage acide fort / soude
const T = { C0: 0.1, V0: 0.02, pKas: [], Cb: 0.1, Vb: 0 };
pr(M.pHTitrage({ ...T, Vb: 0.02 }), 7, 1e-3, 'acide fort équivalence');
pr(M.pHTitrage({ ...T, Vb: 0 }), 1, 1e-3, 'acide fort début');
// 11 titrage acide faible : pH(Veq/2)=pKa, pH(Veq)>7
const F = { C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1, Vb: 0 };
pr(M.pHaDemiEquivalence(F), 4.8, 0.02, 'pKa à la demi-équivalence');
const Ve = M.volumeEquivalent(0.05, 0.02, 0.1); pr(Ve, 0.01, 1e-12, 'Veq');
ok(M.pHTitrage({ ...F, Vb: Ve }) > 8.5 && M.pHTitrage({ ...F, Vb: Ve }) < 9, 'pH équiv acide faible ' + M.pHTitrage({ ...F, Vb: Ve }));
// 12 dérivée -> équivalence
const pts = M.courbeTitrage(F, 0.02, 800); pr(M.equivalenceDerivee(pts), Ve, 6e-5, 'équivalence par dérivée');
// 13 diacide (pKa 3,1 / 4,8) : deux équivalences, charge conservée, fractions somme 1
const fr = M.fractions(1e-4, [3.1, 4.8]); pr(fr.reduce((a, b) => a + b, 0), 1, 1e-12, 'somme fractions');
pr(M.fractions(10 ** -4.8, [4.8])[0], 0.5, 1e-9, 'frac à pH = pKa');
// 14 diacide: à Veq1 pH ≈ (pKa1+pKa2)/2 (espèce amphotère)
const D = { C0: 0.05, V0: 0.02, pKas: [3.1, 4.8], Cb: 0.1, Vb: 0 };
pr(M.pHTitrage({ ...D, Vb: M.volumeEquivalent(0.05, 0.02, 0.1, 1) }), 3.95, 0.15, 'amphotère');
// 15 titrage base forte par acide, base faible par acide
pr(M.pHTitrageBase({ C0: 0.1, V0: 0.02, pKa: null, Ca: 0.1, Va: 0.02 }), 7, 1e-3, 'base forte');
const eqB = M.pHTitrageBase({ C0: 0.05, V0: 0.02, pKa: 9.25, Ca: 0.1, Va: 0.01 }); ok(eqB > 5 && eqB < 5.7, 'équiv base faible ' + eqB);
pr(M.pHTitrageBase({ C0: 0.05, V0: 0.02, pKa: 9.25, Ca: 0.1, Va: 0.005 }), 9.25, 0.02, 'pKa demi-équiv base');
// 16 indicateurs
const I = id => M.INDICATEURS.find(i => i.id === id);
const s1 = M.sautPH(T), sf = M.sautPH(F);
ok(M.convient(I('bbt'), M.phEquivalence(T)) && !M.convient(I('jm'), M.phEquivalence(T)), 'BBT seul convient acide fort');
ok(M.convient(I('php'), M.phEquivalence(F)) && !M.convient(I('bbt'), M.phEquivalence(F)), 'phénolphtaléine pour acide faible, pas BBT ' + sf);
for (const pKa of [3.75, 4.2, 4.8, 4.9]) { const q = { C0: 0.05, V0: 0.02, pKas: [pKa], Cb: 0.1, Vb: 0 }, Ve = M.volumeEquivalent(0.05, 0.02, 0.1); const e = M.equivalenceDerivee(M.courbeTitrage(q, 0.025, 500)); pr(e, Ve, 1e-4, 'dérivée pKa ' + pKa); }
pr(M.fractionBasiqueIndicateur(I('bbt'), 6.8), 0.5, 1e-9, 'indicateur mi-teinte');
// 17 constante K
pr(M.logK(3.8, 4.8) , 1, 1e-12, 'logK'); 
// 18 incertitude
const u = M.incertitudeTitrage({ Cb: 0.1, Veq: 0.0125, V0: 0.02, uCb: 0.0005 / Math.sqrt(3), uVeq: 0.00005 / Math.sqrt(3), uV0: 0.00003 / Math.sqrt(3) });
pr(u.Ca, 0.0625, 1e-9, 'Ca'); ok(u.rel > 0.003 && u.rel < 0.01, 'rel ' + u.rel);
// convientDansSaut : acide méthanoïque 0,050 mol/L titré par NaOH 0,100 mol/L (pH_eq = 8,14, hors des zones du BBT et de la phénolphtaléine)
{
  const p = { C0: 0.05, V0: 0.02, pKas: [3.75], Cb: 0.1 }, I = id => M.INDICATEURS.find(i => i.id === id);
  ok(!M.convient(I('bbt'), M.phEquivalence(p)) && !M.convient(I('php'), M.phEquivalence(p)), 'form : critère strict');
  ok(M.convientDansSaut(I('bbt'), p) && M.convientDansSaut(I('php'), p) && !M.convientDansSaut(I('jm'), p), 'form : dans le saut');
  const pe = { C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 };
  ok(!M.convientDansSaut(I('bbt'), pe) && M.convientDansSaut(I('php'), pe), 'etha : BBT hors du saut');
}
console.log(`${n} tests, ${ko} échec(s)`); process.exit(ko ? 1 : 0);
