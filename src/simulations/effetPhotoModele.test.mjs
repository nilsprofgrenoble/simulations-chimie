// Test du modèle « Effet photoélectrique » (sim 240) : node src/simulations/effetPhotoModele.test.mjs
import * as M from './effetPhotoModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b);
const r2 = x => Number(x.toPrecision(2));
ok(proche(M.energieDeLambdaEV(500), 2.4863, 1e-3), 'photon de 500 nm : 2,49 eV');
ok(proche(M.H * M.C / 500e-9, 3.978e-19, 1e-3), 'photon de 500 nm : 3,98×10⁻¹⁹ J');
ok(proche(M.energiePhotonEV(M.nu14DeLambda(400)), M.energieDeLambdaEV(400)), 'E = hν = hc/λ');
ok(proche(M.energieDeLambdaEV(400) * 400, 1243, 2e-3) && Math.abs(M.energieDeLambdaEV(400) * 400 - 1240) < 5, 'E(eV) × λ(nm) ≈ 1240');
ok(proche(M.nuSeuil14(2.3), 5.5505, 1e-3) && Math.round(100 * M.nuSeuil14(2.3)) === 555, 'ν0 du potassium ≈ 5,55×10¹⁴ Hz');
ok(proche(M.lambdaSeuilNm(2.3), 540.4, 2e-3), 'λ0 du potassium ≈ 540 nm');
ok(proche(M.ecMaxEV(M.nuSeuil14(2.3) + 1, 2.3), M.energiePhotonEV(1), 1e-9), 'Ec,max croît de h Δν : 1×10¹⁴ Hz = 0,414 eV');
ok(M.ecMaxEV(5, 2.3) === 0 && !M.ejecte(5, 2.3) && M.ejecte(6, 2.3), 'sous le seuil : aucun électron');
ok(M.ecMaxEV(M.nu14DeLambda(355), 2.3) > 1.15 && M.ecMaxEV(M.nu14DeLambda(355), 2.3) < 1.25, 'photon de 355 nm sur le potassium : ≈ 1,2 eV');
ok(M.domaineLumiere(300).nom.startsWith('ultraviolet') && M.domaineLumiere(500).nom === 'vert' && M.domaineLumiere(650).nom === 'rouge' && M.domaineLumiere(900).nom.startsWith('infrarouge'), 'domaines');
ok([300, 380, 400, 450, 500, 550, 600, 650, 700, 750, 900].every(l => /^(rgb\(\d+,\d+,\d+\)|#[0-9a-f]{6})$/.test(M.couleurLumiere(l))), 'couleurs');
// ordre des seuils : le césium est le plus sensible
ok(M.METAUX.every((m, k) => k === 0 || M.nuSeuil14(m.W) > M.nuSeuil14(M.METAUX[k - 1].W)), 'métaux classés par seuil croissant');
let p1 = 0, p2 = 0, p3 = 0;
for (let k = 0; k < 3000; k++) {
  const a = M.tirageDirect(), b = M.tirageInconnu();
  ok(proche(a.rep2, M.energieDeLambdaEV(a.lam) - a.W) && a.rep2 >= 0.6, 'tirage direct');
  ok(a.rep3 > 4 && a.rep3 < 12.5, 'seuil direct plausible');
  // tolérances : Ec avec E arrondi à 2 CS, ±0,06 eV ou 10 %
  const Er = r2(a.rep1), dEc = Math.abs(Er - a.W - a.rep2); p1 = Math.max(p1, dEc / Math.max(0.1 * a.rep2, 0.06));
  ok(dEc <= Math.max(0.1 * a.rep2, 0.06), `Ec avec E arrondi : ${Er} − ${a.W} contre ${a.rep2}`);
  ok(proche(b.rep1 - b.Ec, b.rep2) && b.rep2 >= 1.8, 'tirage inconnu');
  const Wr = r2(b.rep1) - b.Ec, dW = Math.abs(Wr - b.rep2); p2 = Math.max(p2, dW / Math.max(0.08 * b.rep2, 0.06));
  ok(dW <= Math.max(0.08 * b.rep2, 0.06), `W avec E arrondi : ${Wr} contre ${b.rep2}`);
  const nuR = M.nuSeuil14(Wr), dn = Math.abs(nuR - b.rep3) / b.rep3; p3 = Math.max(p3, dn / 0.08);
  ok(dn <= 0.08, `ν0 depuis W arrondi : ${nuR} contre ${b.rep3}`);
}
console.log(`${n} contrôles OK ; marges (1 = limite) : Ec ${p1.toFixed(2)}, W ${p2.toFixed(2)}, ν0 ${p3.toFixed(2)}`);
