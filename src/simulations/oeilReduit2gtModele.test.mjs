// Test du modèle de la simulation 200 « L'œil réduit » : géométrie des rayons (calculée, jamais dessinée), Thalès, netteté, défauts, défis.
import * as M from './oeilReduit2gtModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const alea = (a, b) => a + Math.random() * (b - a);
let pireB = 0, pireF = 0, pireTache = 0, pireTh = 0;
for (let t = 0; t < 2000; t++) {
  const D = alea(150, 200000), AB = alea(5, 0.16 * D), f = alea(15, 18), L = alea(15.5, 18.5), dp = alea(2, 6);
  const R = M.rayons(AB, D, f, L, dp);
  ok(R.liste.length === 3, 'trois rayons');
  for (const r of R.liste) {
    // 1. chaque rayon part bien de B (avant la lentille)
    pireB = Math.max(pireB, Math.abs(r.yAvant(-D) - AB));
    // 2. chaque rayon passe par B′ après la lentille (calculé par la loi de la lentille mince, indépendamment de la position de B′)
    const e = Math.abs(r.yApres(R.Bp[0]) - R.Bp[1]); pireF = Math.max(pireF, e / Math.max(1, Math.abs(R.Bp[1])));
  }
  const c = R.liste.find(r => r.id === 'centre');
  ok(Math.abs(c.pIn - c.pOut) < 1e-15, 'le rayon central n’est pas dévié');
  ok(Math.abs(c.y(0)) < 1e-12, 'le rayon central passe par O');
  // 3. le rayon parallèle à l'axe sort par F′
  const yl = alea(0.5, 3), p = M.rayonParallele(yl, f);
  ok(Math.abs(p.y(f)) < 1e-12, 'le rayon parallèle passe par F′');
  // 4. image renversée, Thalès : |A′B′| ÷ AB = OA′ ÷ OA
  ok(R.Bp[1] < 0, 'image renversée');
  pireTh = Math.max(pireTh, Math.abs(Math.abs(R.Bp[1]) / AB - R.OAp / D));
  // 5. la tache sur la rétine : écart des impacts des deux rayons de bord (objet sur l'axe : AB = 0 pour comparer à la formule)
  const R0 = M.rayons(0, D, f, L, dp), h = R0.liste.find(r => r.id === 'haut'), b = R0.liste.find(r => r.id === 'bas');
  pireTache = Math.max(pireTache, Math.abs(Math.abs(M.impactRetine(h, L) - M.impactRetine(b, L)) - M.tacheRetine(D, f, L, dp)));
  // 6. netteté : la focale « nette » donne l'image exactement sur la rétine ; la tache est alors nulle
  const fn = M.focaleNette(D, L);
  ok(Math.abs(M.positionImage(D, fn) - L) < 1e-9 * L, 'focaleNette');
  ok(M.netteRetine(D, fn, L) && M.tacheRetine(D, fn, L, dp) < 1e-9, 'nette à la focale nette');
  // 7. image nette : hauteur sur la rétine = AB × L ÷ D (Thalès, mêmes unités)
  const Rn = M.rayons(AB, D, fn, L, dp);
  ok(Math.abs(Math.abs(Rn.Bp[1]) - M.hauteurImage(AB, D, L)) < 1e-9 * Math.max(1, AB), 'hauteur de l’image nette');
  for (const r of Rn.liste) ok(Math.abs(r.yApres(L) - Rn.Bp[1]) < 1e-9 * Math.max(1, Math.abs(Rn.Bp[1])), 'les trois rayons arrivent au même point de la rétine quand l’image est nette');
}
ok(pireB < 1e-9, `rayons issus de B : ${pireB}`);
ok(pireF < 1e-9, `rayons concourants en B′ : ${pireF}`);
ok(pireTh < 1e-12, `Thalès : ${pireTh}`);
ok(pireTache < 1e-9, `tache : ${pireTache}`);
// exemples du parcours
ok(Math.abs(M.hauteurImage(6000, 50000) - 2.04) < 1e-12, 'arbre de 6,0 m à 50 m : 2,04 mm');
ok(Math.abs(M.hauteurImage(4000, 20000) - 3.4) < 1e-12, 'exemple poteau : 3,4 mm');
ok(Math.abs(M.hauteurImage(40, 250) - 2.72) < 1e-12, 'bougie de 40 mm à 250 mm : 2,72 mm');
// œil normal : au repos net pour l'arbre à 50 m, flou pour la bougie à 25 cm, net à f′ ≈ 15,9 mm
ok(M.netteRetine(50000, M.F_REPOS), 'arbre net au repos');
ok(!M.netteRetine(250, M.F_REPOS), 'bougie à 25 cm floue au repos');
ok(M.ecartRetine(250, M.F_REPOS) > 1, 'image derrière la rétine');
ok(Math.abs(M.focaleNette(250) - 15.9) < 0.02, 'f′ pour 25 cm ≈ 15,9 mm');
ok(M.focaleNette(250) < M.F_REPOS && M.focaleNette(400) > M.focaleNette(250), 'plus l’objet est proche, plus f′ est petite');
ok(M.peutAccommoder(250) && M.peutAccommoder(50000), 'œil normal : voit net à 25 cm et à 50 m');
// défauts : myope net de près seulement, hypermétrope net de loin seulement (en accommodant)
const my = M.DEFAUTS.myope.L, hy = M.DEFAUTS.hypermetrope.L;
ok(!M.peutAccommoder(50000, my) && M.peutAccommoder(250, my), 'myope : pas net de loin, net de près');
ok(M.peutAccommoder(50000, hy) && !M.peutAccommoder(250, hy), 'hypermétrope : net de loin (en accommodant), pas à 25 cm');
ok(!M.netteRetine(50000, M.F_REPOS, my) && !M.netteRetine(50000, M.F_REPOS, hy), 'défauts : floue au repos pour un objet lointain');
// situations de l'exploration : rayons peu inclinés
for (const s of M.SITUATIONS) ok(M.OBJETS[s.objet].AB / s.D <= 0.16 + 1e-12, `pente trop forte : ${s.id}`);
// défis
for (let t = 0; t < 3000; t++) {
  const d = M.tirerDefiImage();
  ok(isFinite(d.vrai) && d.vrai > 0 && M.reponseJusteImage(d, d.vrai), 'défi image : bonne réponse');
  ok((d.variante === 'image' ? d.AB / d.D : d.Ap / 17) <= 0.16 + 0.006, `défi image : rayons trop inclinés (pente ${d.variante === 'image' ? d.AB / d.D : d.Ap / 17})`);
  if (d.variante === 'image') {
    const arr = Number(d.vrai.toPrecision(2)); ok(M.reponseJusteImage(d, arr), `arrondi à 2 CS refusé : ${d.vrai}`);
    ok(!M.reponseJusteImage(d, d.AB * 17 / d.D * 1000), 'facteur 1 000 accepté');                // AB en m, D en m, L en mm : 6 × 17 ÷ 50 = 0,12 mm ... piège sans conversion
    ok(!M.reponseJusteImage(d, d.AB), 'recopier AB accepté'); ok(!M.reponseJusteImage(d, 17), 'recopier 17 accepté');
  } else { ok(M.reponseJusteImage(d, d.vrai), 'objet'); ok(!M.reponseJusteImage(d, d.Ap), 'recopier A′B′ accepté'); ok(!M.reponseJusteImage(d, d.D), 'recopier D'); }
  const s = M.tirerSituationNette();
  ok(s.nette === (s.D >= 6000), `netteté et distance : ${s.D}`);
  ok(M.OBJETS[s.objet].AB / s.D <= 0.16 + 1e-12, `défi net ou flou : rayons trop inclinés (${s.objet} à ${s.D} mm)`);
  const v = M.verifierSituationNette(s, { nette: s.nette ? 'oui' : 'non', action: s.nette ? 'rien' : 'bomber' }); ok(v.netteOk && v.actionOk, 'vérification');
}
console.log(`oeilReduit2gtModele : ${n} contrôles OK (écart rayons/B′ ${pireF.toExponential(1)}, passage par B ${pireB.toExponential(1)}, Thalès ${pireTh.toExponential(1)}, tache ${pireTache.toExponential(1)})`);
