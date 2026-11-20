// Tests du modèle de la simulation 203 « Transformation nucléaire » (2GT) : dessin des noyaux (nombres exacts de protons et de neutrons, aucun recouvrement),
// conservation de A et de Z dans les réactions nucléaires, atomes et charge dans les écritures chimiques, formules identiques dans les écritures physiques,
// isotopes, défis (tirages). Usage : node src/simulations/nucleaire2gtModele.test.mjs
import * as M from './nucleaire2gtModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };

// symboles et noms
ok(M.symbole({ Z: 6, A: 12 }) === '¹²₆C' && M.symbole({ Z: 92, A: 235 }) === '²³⁵₉₂U' && M.symbole({ Z: 0, A: 1 }) === '¹₀n', 'symbole ZAX');
ok(M.nomNoyau({ Z: 6, A: 14 }) === 'carbone 14' && M.nomNoyau({ Z: 0, A: 1 }) === 'neutron', 'noms');
ok(M.sontIsotopes({ Z: 6, A: 12 }, { Z: 6, A: 14 }) && !M.sontIsotopes({ Z: 6, A: 14 }, { Z: 7, A: 14 }) && !M.sontIsotopes({ Z: 6, A: 12 }, { Z: 6, A: 12 }), 'isotopes');
for (const Z of M.Z_LISTE) { ok(M.ELEMENTS[Z], `élément ${Z}`); for (const A of M.ISOTOPES[Z]) ok(A >= Z && A <= 3 * Z + 3 + (Z === 1 ? 2 : 0) + (Z > 80 ? 200 : 0), `A plausible ${Z}-${A}`); }
// quelques valeurs connues
ok(M.ISOTOPES[6].join() === '12,13,14' && M.ISOTOPES[1].join() === '1,2,3' && M.ISOTOPES[92].join() === '234,235,238', 'isotopes du carbone, de l’hydrogène, de l’uranium');

// dessin des noyaux : exactement Z protons et A − Z neutrons, aucun recouvrement, tout dans le rayon R
let pireDist = Infinity;
const cas = []; for (const Z of M.Z_LISTE) for (const A of M.ISOTOPES[Z]) cas.push([Z, A]); cas.push([0, 1], [38, 94], [54, 140], [36, 92], [56, 141]);
for (const [Z, A] of cas) {
  const { pts, R } = M.nucleons(Z, A);
  ok(pts.length === A, `${Z}-${A} : ${A} nucléons dessinés`);
  ok(pts.filter(p => p.proton).length === Z, `${Z}-${A} : exactement ${Z} protons`);
  ok(pts.filter(p => !p.proton).length === A - Z, `${Z}-${A} : exactement ${A - Z} neutrons`);
  let dmin = Infinity; for (let i = 0; i < A; i++) for (let j = i + 1; j < A; j++) dmin = Math.min(dmin, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
  if (A > 1) { ok(dmin >= 2.0, `${Z}-${A} : nucléons qui se recouvrent (distance ${dmin})`); pireDist = Math.min(pireDist, dmin); }
  ok(pts.every(p => Math.hypot(p.x, p.y) + 1 <= R + 1e-9), `${Z}-${A} : tout dans le rayon`);
  ok(Math.abs(pts.reduce((a, p) => a + p.x, 0)) < 1e-6 && Math.abs(pts.reduce((a, p) => a + p.y, 0)) < 1e-6, `${Z}-${A} : noyau centré`);
  // protons et neutrons mélangés : pas tous les protons dans la moitié extérieure (pour les noyaux ayant les deux sortes)
  if (Z > 0 && A - Z > 0 && A >= 4) {
    const tri = [...pts].sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y)), moitie = tri.slice(0, Math.ceil(A / 2));
    const pIn = moitie.filter(p => p.proton).length; ok(pIn >= Math.floor(Z / 2) - 1 && pIn <= Math.ceil(Z / 2) + 1, `${Z}-${A} : protons répartis (${pIn} sur ${Z} dans la moitié centrale)`);
  }
}
const r12 = M.nucleons(6, 12).R, r235 = M.nucleons(92, 235).R; ok(r235 > r12, 'un noyau lourd est plus gros');

// réactions nucléaires : conservation de A et de Z (vérifiée par le modèle, jamais demandée à l'élève)
for (const r of Object.values(M.REACTIONS)) {
  const b = M.bilan(r); ok(b.ok, `${r.id} : conservation de A et de Z (${JSON.stringify(b)})`);
  ok(M.reactionTexte(r).includes('→'), 'texte de la réaction');
  for (const x of [...r.gauche, ...r.droite]) ok(M.ELEMENTS[x.Z] && x.A >= Math.max(1, x.Z), `${r.id} : élément connu ${x.Z}-${x.A}`);
}
ok(M.reactionTexte(M.REACTIONS.dt) === '²₁H + ³₁H → ⁴₂He + ¹₀n', 'écriture deutérium-tritium : ' + M.reactionTexte(M.REACTIONS.dt));
ok(M.neutronsProduits(M.REACTIONS.fissionSr) === 2 && M.neutronsConsommes(M.REACTIONS.fissionSr) === 1, 'fission Sr : 2 neutrons produits, 1 consommé');
ok(M.neutronsProduits(M.REACTIONS.fissionKr) === 3, 'fission Kr : 3 neutrons produits');
ok(M.neutronsProduits(M.REACTIONS.dt) === 1, 'fusion DT : 1 neutron produit');
// la fission commence par l'uranium 235 ; la fusion produit de l'hélium
for (const r of Object.values(M.REACTIONS)) {
  if (r.type === 'fission') ok(r.gauche[0].Z === 92 && r.gauche[0].A === 235 && r.droite.length >= 3, `${r.id} : uranium 235 qui se casse`);
  if (r.type === 'fusion') ok(r.droite[0].Z === 2 && r.gauche.every(x => x.Z === 1) , `${r.id} : hydrogène vers hélium`);
}
// ce qui change : une réaction nucléaire change les éléments ; les noyaux d'arrivée ne sont pas ceux de départ
for (const r of Object.values(M.REACTIONS)) { const g = new Set(r.gauche.filter(x => x.Z > 0).map(M.cle)), d = new Set(r.droite.filter(x => x.Z > 0).map(M.cle)); ok([...g].every(k => !d.has(k)), `${r.id} : les noyaux (neutron exclu) changent`); }

// écritures chimiques : atomes et charge conservés ; écritures physiques : même formule des deux côtés
for (const [id, r] of Object.entries(M.ECRITURES)) {
  const b = M.bilanChimique(r), phys = M.estPhysique(r);
  ok(b.ok, `${id} : atomes et charge conservés ${JSON.stringify(b)}`);
  if (['vapo', 'sublim', 'vapoN2'].includes(id)) ok(phys, `${id} : transformation physique (même formule)`); else ok(!phys, `${id} : transformation chimique (formules différentes)`);
  ok(M.ecritureTexte(r).includes('→') && !/undefined/.test(M.ecritureTexte(r)), `${id} : texte`);
}
ok(M.ecritureTexte(M.ECRITURES.methane) === 'CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(g)', 'méthane : ' + M.ecritureTexte(M.ECRITURES.methane));

// situations : nature, écriture cohérente avec la nature
const parNature = { physique: 0, chimique: 0, nucleaire: 0 };
for (const s of M.SITUATIONS) {
  parNature[s.nature]++;
  ok(M.nature(s.nature) && s.texte && s.pourquoi, `${s.id} : champs`);
  if (s.ecriture) { ok(M.ECRITURES[s.ecriture], `${s.id} : écriture connue`); ok(s.nature === 'physique' ? M.estPhysique(M.ECRITURES[s.ecriture]) : s.nature === 'chimique' && !M.estPhysique(M.ECRITURES[s.ecriture]), `${s.id} : écriture et nature`); }
  if (s.reaction) { ok(M.REACTIONS[s.reaction] && s.nature === 'nucleaire', `${s.id} : réaction nucléaire`); }
  ok(!/\d [°%]/.test(s.texte), `${s.id} : espace insécable`);
}
ok(parNature.physique >= 5 && parNature.chimique >= 5 && parNature.nucleaire >= 5, 'au moins 5 situations de chaque nature : ' + JSON.stringify(parNature));
ok(new Set(M.SITUATIONS.map(s => s.id)).size === M.SITUATIONS.length, 'identifiants uniques');
ok(M.CONSERVE.physique.molecules && !M.CONSERVE.chimique.molecules && M.CONSERVE.chimique.noyaux && !M.CONSERVE.nucleaire.noyaux, 'ce qui est conservé');

// défi 1 : isotopes
for (let k = 0; k < 4000; k++) {
  const d = M.tirerDefiIsotopes(k % 2 ? null : undefined);
  ok(d.candidats.length === 6 && new Set(d.candidats.map(M.cle)).size === 6, 'défi isotopes : 6 candidats distincts');
  ok(d.bonnes.size >= 1 && d.bonnes.size <= 3, 'défi isotopes : 1 à 3 bonnes réponses');
  ok(d.candidats.every(x => M.ISOTOPES[x.Z].includes(x.A)), 'défi isotopes : noyaux réels');
  ok(![...d.bonnes].some(c2 => c2 === M.cle(d.cible)) && d.candidats.every(x => M.cle(x) !== M.cle(d.cible)), 'défi isotopes : la cible n’est pas dans la liste');
  const vrais = d.candidats.filter(x => M.sontIsotopes(x, d.cible)).map(M.cle);
  ok(vrais.length === d.bonnes.size && vrais.every(c2 => d.bonnes.has(c2)), 'défi isotopes : bonnes réponses = isotopes de la cible');
  ok(M.verifierIsotopes(d, [...d.bonnes]).ok && !M.verifierIsotopes(d, []).ok, 'défi isotopes : vérification');
  const faux = d.candidats.find(x => !d.bonnes.has(M.cle(x))); ok(!M.verifierIsotopes(d, [...d.bonnes, M.cle(faux)]).ok, 'défi isotopes : un intrus est refusé');
}
// le piège « même A, autre élément » apparaît souvent quand il existe
let avecPiege = 0, possible = 0;
for (let k = 0; k < 2000; k++) { const d = M.tirerDefiIsotopes(); const existe = M.Z_LISTE.some(z => z !== d.cible.Z && z <= 18 && M.ISOTOPES[z].includes(d.cible.A)); if (existe) { possible++; if (d.candidats.some(x => x.A === d.cible.A && x.Z !== d.cible.Z)) avecPiege++; } }
ok(possible === 0 || avecPiege === possible, 'le noyau de même A est toujours présent quand il existe');
console.log(`nucleaire2gtModele : ${n} contrôles ; distance minimale entre nucléons ${pireDist.toFixed(3)} ; ${cas.length} noyaux dessinés`);
