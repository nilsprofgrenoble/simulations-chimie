import * as M from './uvVisModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// λmax du modèle = valeur tabulée (±1 nm) et ε(λmax) = valeur tabulée (à 0,5 % près, le maximum balayé au nm)
for (const k of M.ORDRE) {
  const sp = M.ESPECES[k], lm = M.lambdaMaxModele(k);
  ok(Math.abs(lm - sp.lambdaMax) <= 1, `${k} : λmax du modèle ${lm} ≠ tabulée ${sp.lambdaMax}`);
  ok(proche(M.epsilon(k, sp.lambdaMax), sp.eps, 1e-9), `${k} : ε(λmax) = eps`);
  ok(M.epsilon(k, lm) <= sp.eps * 1.005, `${k} : le maximum du modèle ne dépasse pas ε tabulée de plus de 0,5 %`);
  // la concentration par défaut donne une absorbance raisonnable (0,3 à 1) ; cMax permet de dépasser A = 2,5 et reste dans le plafond de la plage
  const A0 = M.aTheorique(k, sp.lambdaMax, M.enMolL(k, sp.cDefaut)), A1 = M.aTheorique(k, sp.lambdaMax, M.enMolL(k, sp.cMax));
  ok(A0 > 0.4 && A0 < 0.8 && A1 > 2.5 && A1 < 4, `${k} : A(cDefaut) = ${A0}, A(cMax) = ${A1}`);
  ok(sp.cDefaut <= sp.cMax && sp.pas > 0, `${k} : curseur`);
}
// loi de Beer-Lambert : proportionnalité de A à c et à l, dans le domaine de validité
const k = 'tartrazine', lm = M.ESPECES[k].lambdaMax;
ok(proche(M.aTheorique(k, lm, 2e-5) * 2, M.aTheorique(k, lm, 4e-5)), 'A proportionnelle à c');
ok(proche(M.aTheorique(k, lm, 2e-5, 2) , 2 * M.aTheorique(k, lm, 2e-5, 1)), 'A proportionnelle à l');
ok(proche(M.aTheorique(k, lm, 2e-5), 2.7e4 * 1 * 2e-5), 'A = ε l c : 0,54');
ok(proche(M.concentration(0.54, 2.7e4), 2e-5), 'c = A/(ε l)');
// écart à la linéarité (modèle de lumière parasite) : faible dans le domaine, net au-delà ; jamais au-dessus de la droite ; plafond
ok(Math.abs(M.ecartRelatif(1.0)) < 0.02 && Math.abs(M.ecartRelatif(1.5)) < 0.03 && Math.abs(M.ecartRelatif(1.5)) > 0.02, 'écart ≈ 2,5 % à A = 1,5');
ok(Math.abs(M.ecartRelatif(2)) > 0.04 && Math.abs(M.ecartRelatif(2)) < 0.07, 'écart ≈ 6 % à A = 2');
ok(Math.abs(M.ecartRelatif(3)) > 0.15, 'écart net à A = 3');
ok(Math.abs(M.ecartRelatif(0.3)) < 0.005, 'quasi linéaire aux petites A');
let prec = -1; for (let A = 0; A <= 6; A += 0.05) { const m = M.aMesuree(A); ok(m <= A + 1e-12 && m >= prec - 1e-12, 'mesurée ≤ théorique, croissante'); prec = m; }
ok(M.aMesuree(100) < 2.6, 'plafond de l’absorbance mesurée (lumière parasite 0,3 %)');
ok(M.aMesuree(0) === 0, 'A(0) = 0');
// spectre : A mesurée maximale à λmax, nulle loin des bandes, et le même λmax quelle que soit c (λmax caractérise l'espèce)
for (const e of M.ORDRE) { const sp = M.ESPECES[e]; for (const x of [10, 40, 100]) { const c = M.enMolL(e, x * sp.cDefaut / 20); const pts = M.spectre(e, c, 1, 1); const best = pts.reduce((a, b) => (b[1] > a[1] ? b : a)); ok(best[0] >= sp.lambdaMax - 3 && best[0] <= sp.lambdaMax + 3 || M.aTheorique(e, sp.lambdaMax, c) > 2.2, `${e} : λmax stable avec c`); } }
ok(M.absorbance('cafeine', 600, 1e-4) < 1e-3, 'caféine : rien dans le visible (incolore)');
ok(M.absorbance('paracetamol', 600, 1e-4) < 1e-3, 'paracétamol : rien dans le visible (incolore)');
ok(M.absorbance('tartrazine', 427, 2e-5) > 20 * M.absorbance('tartrazine', 650, 2e-5), 'tartrazine : absorbe le violet-bleu, pas le rouge');
// couleurs : les espèces incolores n'ont ni couleur ni lumière absorbée
ok(M.ESPECES.cafeine.rgb === null && M.ESPECES.paracetamol.rgb === null && M.ESPECES.tartrazine.rgb !== null, 'couleurs');
// conversions d'unités
ok(proche(M.enMolL('tartrazine', 20), 2e-5) && proche(M.depuisMolL('cuivre', 0.012), 12), 'unités');
ok(M.epsTexte(2.7e4) === '2,7×10⁴' && M.epsTexte(55) === '55' && M.epsTexte(1e5) === '1,0×10⁵', `epsTexte : ${M.epsTexte(1e5)}`);
// défis : 3 000 tirages
for (let t = 0; t < 3000; t++) {
  const d = M.tirageDefiIdentification(), L = d.candidates.map(x => M.ESPECES[x].lambdaMax);
  ok(d.candidates.length === 4 && d.candidates.includes(d.inconnue), 'défi 1 : inconnue parmi les candidates');
  ok(L.every((x, i) => i === 0 || x - L[i - 1] >= 25), 'défi 1 : λmax candidates espacées d’au moins 25 nm (lecture au curseur faisable)');
  const lm1 = M.lambdaMaxModele(d.inconnue); ok(Math.abs(lm1 - M.ESPECES[d.inconnue].lambdaMax) <= 1, 'défi 1 : λmax lue = tabulée ±1 nm');
  ok(d.Apic >= 0.35 && d.Apic <= 1.05, 'défi 1 : pic lisible, A < 1,5');
  const e = M.tirageDefiConcentration(), sp = M.ESPECES[e.esp];
  ok(e.aLue >= 0.2 && e.aLue <= 1.2, `défi 2 : A lue dans le domaine de validité (${e.aLue})`);
  ok(M.aTheorique(e.esp, sp.lambdaMax, e.cDil) <= 1.2, 'défi 2 : A théorique ≤ 1,2');
  ok(sp.dilutions.includes(e.F) && (e.esp !== 'cuivre' || e.F === 1), 'défi 2 : dilution réaliste (aucune pour le complexe du cuivre)');
  ok(e.attendue <= (sp.unite === 'mmol/L' ? 25 : 1200), `défi 2 : concentration initiale réaliste (${e.attendue} ${sp.unite})`);
  // l'élève qui lit A (3 décimales), calcule c = A/(εl) puis arrondit à 2 chiffres significatifs reste dans la tolérance de 6 % (pire cas d'arrondi ≈ 5 %)
  const arr = Number(e.attendue.toPrecision(2));
  ok(Math.abs(arr - e.attendue) / e.attendue <= 0.06, `défi 2 : arrondi à 2 chiffres hors tolérance (${arr} / ${e.attendue})`);
  // la valeur « vraie » physique (A théorique) reste aussi dans la tolérance : écart ≤ 1,5 % dû à la lumière parasite
  const vraie = M.depuisMolL(e.esp, e.cDil) * e.F; ok(Math.abs(vraie - e.attendue) / vraie <= 0.02, 'défi 2 : A affichée cohérente avec la concentration vraie');
}
// pire cas d'arrondi à 2 chiffres significatifs : 5 % (script de contrôle de la tolérance de 6 %)
let pire = 0; for (let x = 1.0; x < 10; x += 0.0007) { const r = Number(x.toPrecision(2)); pire = Math.max(pire, Math.abs(r - x) / x); } ok(pire < 0.06 && pire > 0.04, `pire arrondi 2 chiffres : ${pire}`);
console.log(`uvVisModele : ${n} contrôles réussis (pire arrondi à 2 chiffres significatifs : ${(pire * 100).toFixed(2)} %)`);
