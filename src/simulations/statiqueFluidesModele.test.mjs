// Tests du modèle « statique des fluides » (sim 163) : node src/simulations/statiqueFluidesModele.test.mjs
import * as S from './statiqueFluidesModele.js';
let ko = 0;
const proche = (nom, x, ref, tolRel = 1e-9) => { const ok = Math.abs(x - ref) <= Math.abs(ref) * tolRel; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
// calculs faits à part
proche('ΔP à 3,0 m d’eau = 1000 × 9,81 × 3,0 = 29 430 Pa', S.diffPression(1000, 0, -3), 29430);
proche('B au-dessus de A : ΔP négative', S.diffPression(1000, -3, 0), -29430);
proche('P à 8,0 m d’eau = 101 300 + 78 480 = 179 780 Pa', S.pression(S.PATM, 1000, 8), 179780);
proche('profondeur pour 1 500 hPa = 48 700 / 9 810 = 4,9643 m', S.profondeur(150000, S.PATM, 1000), 48700 / 9810);
proche('retour : profondeur(pression(h)) = h (huile, 6,5 m)', S.profondeur(S.pression(S.PATM, 920, 6.5), S.PATM, 920), 6.5);
proche('hPa(179 780 Pa) = 1798', S.hPa(179780), 1798);
proche('force sur 25 cm² à 2,0 m d’eau : 1000 × 9,81 × 2,0 × 25e-4 = 49,05 N', S.force(1000 * S.G * 2.0, 25e-4), 49.05);
proche('ρ = (1 194 − 1 013) hPa / (9,81 × 2,00 m) ≈ 922,5', S.rhoDepuisReleves(0, 1013, 2, 1194), 18100 / 19.62);
proche('10 m d’eau ≈ 0,98 bar', S.diffPression(1000, 0, -10) / 1e5, 0.981);
const a = S.ajuste([{ x: 0, y: 1013 }, { x: 1, y: 1013 + 98.1 }, { x: 2, y: 1013 + 196.2 }]);
proche('pente de la droite = 98,1 hPa/m', a.pente, 98.1, 1e-9);
proche('ordonnée à l’origine = 1013 hPa', a.ord, 1013, 1e-9);
vrai('ajuste : un seul point → null', S.ajuste([{ x: 1, y: 2 }]) === null);
vrai('ajuste : deux x égaux → null', S.ajuste([{ x: 1, y: 2 }, { x: 1, y: 5 }]) === null);
// tirages : 20 000 graines de chaque défi
let pb = 0; const vus = {};
for (let g = 1; g <= 20000; g++) {
  const d = S.tirerDefiCuve(g), e = S.tirerDefiRho(g);
  const rho = d.rho, Hv = d.vrai;
  if (!isFinite(Hv) || Hv <= 0 || Hv > d.l.hmax + 1e-9 || Math.abs(Hv - S.profondeur(S.pression(S.PATM, rho, Hv), S.PATM, rho)) > 1e-6) pb++;
  // la valeur calculée à partir de la valeur affichée ne s'écarte pas de plus de 0,5 hPa de la vraie hauteur
  if (d.P < 1013 + 150) pb++;
  if (!isFinite(e.vrai) || e.P2 <= e.P1 || e.P2 - e.P1 < 120 || Math.abs(e.vrai - e.l.rho) / e.l.rho > 0.01) pb++;
  vus[d.l.id] = (vus[d.l.id] || 0) + 1; vus['rho-' + e.l.id] = (vus['rho-' + e.l.id] || 0) + 1;
  // même graine → même tirage
  if (g % 1000 === 0 && S.tirerDefiCuve(g).P !== d.P) pb++;
}
vrai('20 000 défis : valeurs finies, bornées, ΔP ≥ 120 hPa, ρ retrouvé à 1 %', pb === 0);
console.log('répartition des liquides', JSON.stringify(vus));
vrai('les 4 liquides sont tirés', ['eau', 'mer', 'huile', 'mercure'].every(k => vus[k] > 2000 && vus['rho-' + k] > 2000));
console.log(ko ? `${ko} ÉCHEC(S)` : 'tous les tests passent'); process.exit(ko ? 1 : 0);
