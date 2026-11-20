// Tests du modèle « changement d'état » 2GT (sim 195) : node src/simulations/changementEtat2gtModele.test.mjs
import * as M from './changementEtat2gtModele.js';
let ko = 0;
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const proche = (nom, x, ref, tol) => vrai(`${nom} : ${x} ≈ ${ref}`, Math.abs(x - ref) <= Math.abs(ref) * tol);

// équations (écrites à la main)
vrai('fusion de l’eau', M.equation('eau', 'fusion') === 'H₂O(s) → H₂O(l)');
vrai('solidification de l’eau', M.equation('eau', 'solidification') === 'H₂O(l) → H₂O(s)');
vrai('vaporisation de l’eau', M.equation('eau', 'vaporisation') === 'H₂O(l) → H₂O(g)');
vrai('liquéfaction de l’eau', M.equation('eau', 'liquefaction') === 'H₂O(g) → H₂O(l)');
vrai('sublimation du diazote', M.equation('diazote', 'sublimation') === 'N₂(s) → N₂(g)');
vrai('condensation solide de l’éthanol', M.equation('ethanol', 'condensation') === 'C₂H₆O(g) → C₂H₆O(s)');
vrai('équation sans états', M.equation('eau', 'fusion', { etats: false }) === 'H₂O → H₂O');
// inverses et sens du transfert
const paires = [['fusion', 'solidification'], ['vaporisation', 'liquefaction'], ['sublimation', 'condensation']];
for (const [a, b] of paires) { vrai(`inverse de ${a}`, M.inverse(a).id === b && M.inverse(b).id === a); vrai(`sens opposés ${a}/${b}`, M.sens(a) === 'endo' && M.sens(b) === 'exo'); }
vrai('six changements', M.CHANGEMENTS.length === 6);
// énergie : calculs faits à la main
proche('E fusion de 2,0 kg de glace = 668 kJ', M.energie(2.0, M.L('eau', 'fusion')), 668, 1e-12);
proche('E fusion de 1,5 kg de glace = 501 kJ', M.energie(1.5, 334), 501, 1e-12);
proche('E vaporisation de 20 g d’eau = 45,2 kJ', M.energie(0.020, 2260), 45.2, 1e-12);
proche('E fusion glaçon 20 g = 6,68 kJ', M.energie(0.020, 334), 6.68, 1e-12);
proche('E vaporisation de 0,50 kg d’éthanol = 420 kJ', M.energie(0.50, M.L('ethanol', 'vaporisation')), 420, 1e-12);
proche('m pour 1 670 kJ d’eau fondue = 5,0 kg', M.masseDepuisEnergie(1670, 334), 5.0, 1e-3);
vrai('L identique pour deux changements inverses', M.L('eau', 'fusion') === M.L('eau', 'solidification') && M.L('eau', 'vaporisation') === M.L('eau', 'liquefaction'));
vrai('pas de L pour la sublimation', M.L('eau', 'sublimation') === null && M.T('eau', 'condensation') === null);
vrai('températures de changement d’état de l’eau', M.T('eau', 'fusion') === 0 && M.T('eau', 'liquefaction') === 100);
vrai('la vaporisation demande plus que la fusion pour tous les corps', M.LISTE_CORPS.every(c => c.Lvap > c.Lfus));
proche('rapport Lvap / Lfus de l’eau ≈ 6,8', 2260 / 334, 6.77, 5e-3);
// proportionnalité : masse transformée
proche('masse transformée : 167 kJ sur 1,0 kg de glace', M.masseTransformee(167, 1.0, 334), 0.5, 1e-3);
vrai('masse transformée bornée par m', M.masseTransformee(1e6, 1.0, 334) === 1.0 && M.masseTransformee(-5, 1.0, 334) === 0);
// affichage
vrai('nombreFR millier avec espace insécable', M.nombreFR(2260) === `2${M.NB}260` || M.nombreFR(2260).replace(/\s/g, '') === '2260');
vrai('nombreFR virgule', M.nombreFR(6.68) === '6,68');
// défi 1 : sur 20 000 tirages, la bonne valeur est acceptée, la valeur recopiée du cours et les erreurs de facteur sont refusées
let nE = 0, nM = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirerDefiEnergie();
  if (!isFinite(d.vrai) || d.vrai <= 0) { vrai('valeur non finie', false); break; }
  if (!M.reponseJusteEnergie(d, d.vrai)) { vrai('bonne réponse refusée', false); break; }
  // arrondi à 2 chiffres significatifs d'un élève
  if (!M.reponseJusteEnergie(d, M.arrondiSig(d.vrai, 2))) { vrai(`arrondi à 2 CS refusé : ${d.vrai}`, false); break; }
  if (d.variante === 'E') {
    nE++;
    if (M.reponseJusteEnergie(d, d.L)) { vrai(`L recopié accepté (m = ${d.m})`, false); break; }
    if (M.reponseJusteEnergie(d, d.m)) { vrai('m recopié accepté', false); break; }
    if (M.reponseJusteEnergie(d, d.m + d.L)) { vrai('somme acceptée', false); break; }
    if (M.reponseJusteEnergie(d, d.m * d.L * 1000) || M.reponseJusteEnergie(d, d.L / d.m)) { vrai('erreur de facteur acceptée', false); break; }
  } else {
    nM++;
    if (M.reponseJusteEnergie(d, d.E) || M.reponseJusteEnergie(d, d.L)) { vrai('E ou L recopié accepté', false); break; }
    if (M.reponseJusteEnergie(d, d.E * d.L)) { vrai('produit accepté', false); break; }
  }
}
vrai(`défi 1 : ${nE} tirages E et ${nM} tirages m contrôlés`, nE > 1000 && nM > 1000);
// défi 2
const s = M.tirerSituation();
vrai('défi 2 : bonne réponse acceptée', (() => { const v = M.verifierSituation(s, { chid: s.chid, sens: M.sens(s.chid) }); return v.nomOk && v.sensOk; })());
vrai('défi 2 : sens inverse refusé', !M.verifierSituation(s, { chid: s.chid, sens: M.sens(s.chid) === 'endo' ? 'exo' : 'endo' }).sensOk);
vrai('défi 2 : toutes les situations ont un changement connu et une équation', M.SITUATIONS.every(x => M.changement(x.chid) && M.equation(x.cid, x.chid).includes('→')));
console.log(ko ? `${ko} échec(s)` : 'Tout est correct');
process.exit(ko ? 1 : 0);
