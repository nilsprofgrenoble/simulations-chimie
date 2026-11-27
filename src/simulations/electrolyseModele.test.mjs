import * as M from './electrolyseModele.js';
import { QCM_PARCOURS as QQ } from './electrolyseQcm.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-3) => Math.abs(a - b) <= t * Math.max(1e-9, Math.abs(b));
const G = M.ACCU_GUIDE;
// parcours : pile zinc-cuivre déjà utilisée, tension à vide 1,09 V, Q_r = 3,0
const e0 = M.etat(G, 0);
ok(e0.plus === 'cu' && e0.moins === 'zn' && proche(e0.E, 1.086, 2e-3), 'tension à vide ' + e0.E);
ok(proche(10 ** e0.logQr, 3.0), 'Qr initial 3');
// intensités affichées dans le parcours
ok(M.intensite(G, 0) === -0.22, 'I à 0 V ' + M.intensite(G, 0));
ok(M.intensite(G, 0.6) === -0.10, 'I à 0,60 V ' + M.intensite(G, 0.6));
ok(M.intensite(G, 1.6) === 0.10, 'I à 1,60 V ' + M.intensite(G, 1.6));
ok(M.intensite(G, 1.1) === 0, 'I à 1,10 V ' + M.intensite(G, 1.1));
// charge 1 h à 0,10 A : 360 C, n(e⁻) = 3,73e-3 mol, Zn déposé 1,87e-3 mol ; Qr 3,0 → 1,9 ; zinc plus lourd, cuivre plus léger
const h1 = M.fonctionner(G, 1.6, 1);
ok(proche(h1.Q, 360) && proche(h1.ne, 360 / 96500), 'charge 1 h');
ok(proche(h1.mM - 1.7, 360 / 2 / 96500 * 65.4) && proche(2.3 - h1.mP, 360 / 2 / 96500 * 63.5), 'masses 1 h');
ok(proche(10 ** h1.logQr, 1.91, 5e-3) && h1.logQr < e0.logQr, 'Qr diminue ' + 10 ** h1.logQr);
ok(h1.E > e0.E, 'tension à vide remonte pendant la charge');
// valeurs des étapes numériques : 30 min à 0,10 A
ok(proche(M.charge(0.10, 1800), 180) && proche(M.nMetal(180, 2), 9.326e-4), 'étapes Q et n(Zn)');
// recharge complète (965 C) à 0,10 A : 9 650 s = 2,68 h ; état final = pile neuve 0,10 / 0,10
ok(proche(M.dureePour(965, 0.10) / 3600, 2.681), 'durée de recharge');
const neuve = M.fonctionner(G, 1.6, 965 / 0.10 / 3600);
ok(proche(neuve.cM, 0.10) && proche(neuve.cP, 0.10) && proche(10 ** neuve.logQr, 1), 'retour à la pile neuve');
// sens spontané : Qr augmente
const d1 = M.fonctionner(G, 0.6, 1); ok(d1.sens === 'spontane' && d1.logQr > e0.logQr && d1.mM < 1.7, 'pile qui débite');
// bornes : charge jusqu'à épuisement des ions Zn²⁺ (1,5e-2 mol, cuivre 2,3 g = 3,6e-2 mol) ; décharge jusqu'à Cu²⁺ épuisé
ok(e0.limitantCharge === 'ion' && proche(e0.xiMaxCharge, 0.030), 'limitant en charge');
const fin = M.fonctionner(G, 1.6, 50); ok(fin.arret && fin.cM === 0 && isFinite(fin.E), 'arrêt de la charge');
const finD = M.fonctionner(G, 0, 50); ok(finD.arret && finD.E === 0, 'pile usée');
// dureeMax cohérente
ok(proche(M.dureeMax(G, 1.6), 0.030 * 96500 / 0.10 / 3600), 'durée max');
// toutes les paires, toutes les tensions : masses positives, conservation du métal total
for (const [p, q] of M.PAIRES) for (const UG of M.UG_LISTE) for (const t of [0, 0.5, 2, 10, 40]) for (const c of [0.05, 0.10, 0.20]) {
  const a = { g: { id: p, c, m: 2.0 }, d: { id: q, c: 0.10, m: 2.0 } }, s = M.fonctionner(a, UG, t);
  ok(s.mM >= -1e-12 && s.mP >= -1e-12 && s.cM >= -1e-12 && s.cP >= -1e-12, 'positivité ' + p + q + UG + ' ' + t);
  const A = M.METAUX[s.moins], C = M.METAUX[s.plus];
  ok(proche(s.nIonM + s.nMetM, s.nIonM0 + s.nMetM0, 1e-9) && proche(s.nIonP + s.nMetP, s.nIonP0 + s.nMetP0, 1e-9), 'conservation');
  ok(Math.sign(s.I) !== 1 || s.logQr <= M.etat(a, 0).logQr + 1e-12, 'forcé : Qr diminue');
  ok(A.z > 0 && C.z > 0, 'z');
}
// défis
for (let k = 0; k < 4000; k++) {
  const d = M.tirageDefiSens();
  ok(Math.abs(d.UG - d.E) >= 0.25 && (d.sens === 'force') === (M.intensite(d.a, d.UG) > 0), 'défi sens');
  const q = M.tirageDefiQuantite();
  ok(q.nDep > 0 && q.nDep < 0.10 * 0.1 && q.mDiss < 2.0, 'défi quantité réaliste');
}
// QCM du parcours : la bonne réponse (index 'bonne') n'est jamais la plus longue (égalité comprise) ni strictement la plus courte
for (const [k, v] of Object.entries(QQ)) {
  const L = v.options.map(o => [...o].length), b = L[v.bonne], autres = L.filter((_, i) => i !== v.bonne);
  ok(b < Math.max(...autres), `QCM ${k} : la bonne est la plus longue`);
  ok(b >= Math.min(...autres), `QCM ${k} : la bonne est strictement la plus courte`);
}
console.log(`electrolyseModele : ${n} contrôles réussis`);
