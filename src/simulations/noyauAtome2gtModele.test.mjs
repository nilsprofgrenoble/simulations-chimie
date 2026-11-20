// Tests du modèle de la simulation 202 (noyau de l'atome) : grandeurs, éléments, dessins d'atomes (nombres exacts de particules, aucun chevauchement), défis.
// Usage : node src/simulations/noyauAtome2gtModele.test.mjs
import * as M from './noyauAtome2gtModele.js';
let ko = 0, n = 0;
const vrai = (nom, c) => { n++; if (!c) { ko++; console.log(`✗ ${nom}`); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// grandeurs
vrai('rapport des tailles : exactement 100 000', M.RAPPORT_TAILLES === 100000);
vrai('rapport des masses : 1 833 (environ 1 800)', Math.abs(M.RAPPORT_MASSES - 1833.2) < 0.5 && Number(M.RAPPORT_MASSES.toPrecision(2)) === 1800);
vrai('charge de 3 protons : 4,80 × 10⁻¹⁹ C', proche(M.chargeNoyauC(3), 4.8e-19));
vrai('masse de 6 électrons : 5,47 × 10⁻³⁰ kg (3 chiffres significatifs)', M.sciFR(M.masseElectrons(6)) === `5,47${M.NB}×${M.NB}10⁻³⁰`);
vrai('rapport masse de l’atome de carbone / 6 électrons ≈ 3 640', Math.abs(M.M_ATOME_C12 / 5.47e-30 - 3638) < 2);
vrai('agrandissement : une bille de 1 cm → atome de 1 km', proche(M.atomeAgrandiM(10), 1000) && M.longueurFR(M.atomeAgrandiM(10)) === `1${M.NB}km`);
vrai('agrandissement : un grain de sable → 100 m', proche(M.atomeAgrandiM(1), 100) && M.longueurFR(M.atomeAgrandiM(1)) === `100${M.NB}m`);
vrai('agrandissement : un ballon de 22 cm → 22 km', M.longueurFR(M.atomeAgrandiM(220)) === `22${M.NB}km`);
vrai('agrandissement : ping-pong → 4 km', M.longueurFR(M.atomeAgrandiM(40)) === `4${M.NB}km`);
// typographie
vrai('nombreFR : milliers avec espace insécable', M.nombreFR(100000) === `100${M.NB}000` && M.nombreFR(1833) === `1${M.NB}833` && M.nombreFR(1.5, 1) === '1,5');
vrai('sciFR : 1,67 × 10⁻²⁷ avec espaces insécables', M.sciFR(1.67e-27) === `1,67${M.NB}×${M.NB}10⁻²⁷`);
vrai('sciFR : pas d’espace ordinaire', !/ /.test(M.sciFR(9.11e-31)) && !/ /.test(M.longueurFR(5000)) && !/ /.test(M.nombreFR(123456)));

// éléments
vrai('18 éléments, Z = 1 à 18 dans l’ordre', M.ELEMENTS.length === 18 && M.ELEMENTS.every((e, i) => e.Z === i + 1));
vrai('symboles uniques', new Set(M.SYMBOLES).size === 18);
vrai('A ≥ Z et N = A − Z', M.ELEMENTS.every(e => e.A >= e.Z && e.N === e.A - e.Z && Number.isInteger(e.A)));
const REF = { H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35, Ar: 40 };
vrai('nombres de masse des noyaux courants', M.ELEMENTS.every(e => REF[e.s] === e.A));
vrai('articles : l’azote, le carbone, d’hélium, de sodium', M.element(7).le === 'l’azote' && M.element(6).le === 'le carbone' && M.element(2).deNom === 'd’hélium' && M.element(11).deNom === 'de sodium');
vrai('zaxTexte : ²³₁₁Na', M.zaxTexte(M.element(11)) === '²³₁₁Na');
vrai('compo du chlore : 17 protons, 18 neutrons, 17 électrons', (c => c.Z === 17 && c.N === 18 && c.electrons === 17 && c.A === 35)(M.compo(17)));
vrai('les électrons pèsent moins de 0,1 % de l’atome (Z ≤ 18)', M.ELEMENTS.every(e => M.partMasseElectrons(e.Z, e.A) < 0.001));

// dessins : nombres exacts de particules, aucun chevauchement
for (const e of M.ELEMENTS) {
  const a = M.atome(e.Z, e.A), p = a.noyau.filter(x => x.type === 'proton').length, nn = a.noyau.filter(x => x.type === 'neutron').length;
  vrai(`${e.s} : ${e.Z} protons dessinés`, p === e.Z);
  vrai(`${e.s} : ${e.N} neutrons dessinés`, nn === e.N);
  vrai(`${e.s} : ${e.Z} électrons dessinés`, a.electrons.length === e.Z);
  vrai(`${e.s} : A = ${e.A} disques dans le noyau`, a.noyau.length === e.A);
  let dmin = Infinity;
  for (let i = 0; i < a.noyau.length; i++) for (let j = i + 1; j < a.noyau.length; j++) dmin = Math.min(dmin, Math.hypot(a.noyau[i].x - a.noyau[j].x, a.noyau[i].y - a.noyau[j].y));
  vrai(`${e.s} : disques du noyau sans chevauchement (distance mini ${dmin.toFixed(2)} ≥ ${2 * M.RP})`, a.noyau.length < 2 || dmin >= 2 * M.RP - 1e-9);
  let emin = Infinity;
  for (let i = 0; i < a.electrons.length; i++) for (let j = i + 1; j < a.electrons.length; j++) emin = Math.min(emin, Math.hypot(a.electrons[i].x - a.electrons[j].x, a.electrons[i].y - a.electrons[j].y));
  vrai(`${e.s} : électrons sans chevauchement (distance mini ${emin.toFixed(2)})`, a.electrons.length < 2 || emin >= 2 * M.RE * 1.3);
  vrai(`${e.s} : électrons hors du noyau`, a.electrons.every(x => Math.hypot(x.x, x.y) >= a.rNoyau + M.RE + 8));
  vrai(`${e.s} : tout est dans le nuage`, a.electrons.every(x => Math.hypot(x.x, x.y) + M.RE <= a.rNuage) && a.noyau.every(x => Math.hypot(x.x, x.y) + M.RP <= a.rNoyau + 1e-9));
  vrai(`${e.s} : le noyau dessiné ne dépasse pas le tiers du diamètre du nuage (${(a.rNoyau / a.rNuage).toFixed(3)})`, a.rNoyau / a.rNuage <= 1 / 3 + 1e-9);
  const m = new Set(a.noyau.slice(0, Math.min(6, a.noyau.length)).map(x => x.type));
  vrai(`${e.s} : protons et neutrons mêlés (pas tous les protons d’un côté)`, e.N === 0 || e.Z === 1 || m.size === 2 || a.noyau.length < 4);
}
// défis
for (let k = 0; k < 500; k++) {
  const d = M.tirerDefiZax(null), r = M.reponseZax(d, { Z: String(d.Z), A: String(d.A), s: d.s });
  vrai('défi ZAX : bonne réponse acceptée', r.ok);
  vrai('défi ZAX : A = Z + N', d.A === d.Z + d.N);
  vrai('défi ZAX : A seul refusé si faux', !M.reponseZax(d, { Z: String(d.Z), A: String(d.N), s: d.s }).ok || d.N === d.A);
  vrai('défi ZAX : Z et A échangés refusés', d.Z === d.A || !M.reponseZax(d, { Z: String(d.A), A: String(d.Z), s: d.s }).ok);
  const d2 = M.tirerDefiCompo(d), r2 = M.reponseCompo(d2, { p: String(d2.Z), n: String(d2.A - d2.Z), e: String(d2.Z) });
  vrai('défi compo : bonne réponse acceptée', r2.ok);
  vrai('défi compo : A recopié refusé pour les neutrons', d2.A === d2.N || !M.reponseCompo(d2, { p: String(d2.Z), n: String(d2.A), e: String(d2.Z) }).ok);
  vrai('défi compo : tirage différent du précédent', d2.Z !== d.Z);
}
console.log(ko ? `${ko} échec(s) sur ${n}` : `Tout est correct (${n} contrôles)`);
process.exit(ko ? 1 : 0);
