// Tests du modèle et de la géométrie de la simulation 199 (2GT) : node src/simulations/imageLentille2gtModele.test.mjs
// Le tracé des rayons est CALCULÉ : on vérifie ici, sur des centaines de configurations tirées au hasard, que les trois rayons se coupent EXACTEMENT
// au point image, que les rayons passent par F, F′ et O, que Thalès est respecté, et que les schémas du parcours n'ont aucun chevauchement d'étiquettes.
import * as M from './imageLentille2gtModele.js';
import * as G from './imageLentille2gtGeometrie.js';
let ko = 0, n = 0;
const vrai = (nom, c) => { n++; if (!c) { ko++; console.log(`✗ ${nom}`); } };
const proche = (nom, x, ref, tol = 1e-9) => vrai(`${nom} : ${x} ≈ ${ref}`, Math.abs(x - ref) <= tol);
const alea = (a, b) => a + Math.random() * (b - a);

// ---------- valeurs calculées à la main ----------
{
  const c = M.construction(12, 4, 2);       // objet à 12 cm, f′ = 4 cm, AB = 2 cm
  proche('OA′ = 6 cm', c.image.OAp, 6); proche('A′B′ = 1 cm', c.image.hImg, 1); proche('γ = 0,5', c.image.gamma, 0.5); vrai('renversée', c.image.renversee);
  const c8 = M.construction(8, 4, 2); proche('2f′ : OA′ = 8 cm', c8.image.OAp, 8); proche('2f′ : A′B′ = 2 cm', c8.image.hImg, 2); proche('2f′ : γ = 1', c8.image.gamma, 1);
  const c6 = M.construction(6, 4, 2); proche('objet à 6 cm : OA′ = 12 cm', c6.image.OAp, 12); proche('A′B′ = 4 cm', c6.image.hImg, 4); proche('γ = 2', c6.image.gamma, 2);
  proche('R3 : hauteur sur la lentille (d = 12) = −1 cm', c.r3.yL, -1); proche('R3 (d = 6) : hauteur sur la lentille = −4 cm', c6.r3.yL, -4);
  const l20 = M.ligneTable(20), l40 = M.ligneTable(40);
  proche('d = 20 : OA′ = 5', l20.OAp, 5); proche('d = 20 : A′B′ = 0,5', l20.hImg, 0.5); proche('d = 40 : OA′ ≈ 4,444', l40.OAp, 40 * 4 / 36);
  const cn = M.construction(3, 4, 2); vrai('objet entre O et F : pas d’image réelle', cn.image === null && cn.nature === 'virtuelle');
  const cf = M.construction(4, 4, 2); vrai('objet en F : image à l’infini', cf.image === null && cf.nature === 'infini' && cf.r3 === null);
  vrai('zones', M.zoneObjet(12, 4) === 'loin' && M.zoneObjet(8, 4) === 'deuxf' && M.zoneObjet(6, 4) === 'proche' && M.zoneObjet(3, 4) === 'entre' && M.zoneObjet(4, 4) === 'foyer');
}

// ---------- propriétés géométriques sur 1 000 configurations ----------
let pire = 0;
for (let i = 0; i < 1000; i++) {
  const f = alea(1.5, 8), d = f + alea(0.2, 40), h = alea(0.5, 4), c = M.construction(d, f, h);
  const { r1, r2, r3, image } = c, x = image.OAp;
  // les trois rayons se coupent au point image
  const y1 = M.ordonnee(r1.apres, x), y2 = M.ordonnee(r2.apres, x), y3 = M.ordonnee(r3.apres, x);
  pire = Math.max(pire, Math.abs(y1 - y2), Math.abs(y1 - y3), Math.abs(y2 - image.B[1]));
  vrai(`R1, R2, R3 concourants (d=${d}, f=${f})`, Math.abs(y1 - y2) < 1e-9 && Math.abs(y1 - y3) < 1e-9 && Math.abs(y1 - image.B[1]) < 1e-9);
  // R1 : parallèle à l'axe avant la lentille, passe par F′ après
  vrai('R1 horizontal avant', Math.abs(r1.avant[0][1] - r1.avant[1][1]) < 1e-12 && Math.abs(r1.yL - h) < 1e-12);
  vrai('R1 passe par F′', Math.abs(M.ordonnee(r1.apres, f)) < 1e-9);
  // R2 : passe par O et n'est pas dévié (même pente avant et après)
  vrai('R2 passe par O', Math.abs(r2.avant[1][0]) < 1e-12 && Math.abs(r2.avant[1][1]) < 1e-12 && Math.abs(M.ordonnee(r2.apres, 0)) < 1e-12);
  const penteAvant = (r2.avant[1][1] - r2.avant[0][1]) / (r2.avant[1][0] - r2.avant[0][0]);
  vrai('R2 non dévié', Math.abs(penteAvant - r2.apres.u[1] / r2.apres.u[0]) < 1e-12);
  // R3 : passe par F avant la lentille, horizontal après
  const [p0, p1] = r3.avant; const pente3 = (p1[1] - p0[1]) / (p1[0] - p0[0]);
  vrai('R3 passe par F', Math.abs(p0[1] + pente3 * (-f - p0[0])) < 1e-9);
  vrai('R3 horizontal après', r3.apres.u[1] === 0 && Math.abs(r3.yL - image.B[1]) < 1e-9);
  // Thalès : A′B′ / AB = OA′ / OA ; et accord avec le cours de 1re (1/OA′ − 1/OA = 1/f′), utilisé seulement ici pour vérifier
  vrai('Thalès', Math.abs(M.grandissementHauteurs(c) - M.grandissementThales(c)) < 1e-9);
  vrai('conjugaison de 1re vérifiée', Math.abs(1 / image.OAp + 1 / d - 1 / f) < 1e-9);
  vrai('image renversée, réelle', image.renversee && image.OAp > 0);
  // sens de variation : objet plus loin, image plus petite
  const c2 = M.construction(d + 1, f, h); vrai('objet plus loin ⇒ image plus petite et plus proche de F′', c2.image.hImg < image.hImg && c2.image.OAp < image.OAp && c2.image.OAp > f);
}
console.log(`écart maximal de concours des trois rayons : ${pire.toExponential(2)} cm (limite 1e-9)`);

// ---------- échelle identique en longueur et en hauteur, point O au centre ----------
for (const m of [G.MISE_SCENE, G.MISE_CARTE]) {
  const o = G.px(m, 0, 0), x1 = G.px(m, 1, 0), y1 = G.px(m, 0, 1);
  proche('échelle horizontale = verticale', Math.hypot(x1[0] - o[0], x1[1] - o[1]), Math.hypot(y1[0] - o[0], y1[1] - o[1]), 1e-9);
  vrai('fenêtre dans le viewBox', G.px(m, -M.X_MAX, 0)[0] >= 0 && G.px(m, M.X_MAX, 0)[0] <= m.w && G.px(m, 0, M.Y_MAX)[1] >= 0 && G.px(m, 0, -M.Y_MAX)[1] <= m.h);
}

// ---------- scènes du parcours : aucune étiquette ne chevauche un rayon, l'axe, la lentille, une flèche ou une autre étiquette ----------
const T = { 1: 'complet', 2: 'complet', 3: 'complet' };
const PT = ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'];
const SCENES = [
  ['étape 1', { d: 8, points: ['A', 'B', 'O', 'F', 'Fp'] }], ['étape 2', { d: 8, rayons: { 1: 'avant' }, candidats: 1, points: ['A', 'B', 'O', 'F', 'Fp'] }],
  ['étape 3', { d: 8, rayons: { 1: 'complet', 2: 'avant' }, candidats: 2, points: ['A', 'B', 'O', 'F', 'Fp'] }], ['étape 4', { d: 8, rayons: { 1: 'complet', 2: 'complet', 3: 'avant' }, candidats: 3, points: ['A', 'B', 'O', 'F', 'Fp'] }],
  ['étapes 5-6 (d=8)', { d: 8, rayons: T, image: true, ecran: true, points: PT }],
  ['étapes 7-8 et 10 (d=6)', { d: 6, rayons: T, image: true, ecran: true, points: PT }],
  ['étape 9 (d=8)', { d: 8, rayons: T, image: true, ecran: true, points: PT }],
  ['étape 11 (d=12, 2F)', { d: 12, rayons: T, image: true, ecran: true, deuxF: true, points: PT }],
  ['étape 11 (d=8, 2F)', { d: 8, rayons: T, image: true, ecran: true, deuxF: true, points: PT }],
  ['étape 11 (d=6, 2F)', { d: 6, rayons: T, image: true, ecran: true, deuxF: true, points: PT }],
  ['étape 13 (d=12)', { d: 12, rayons: T, image: true, ecran: true, points: PT }],
  ['défi lire d=3 f=2', { f: 2, d: 3, rayons: T, image: true, points: PT }],
];
const verifierScene = (nom, o, mise = G.MISE_SCENE, strict = true) => {
  const S = G.construireScene(o, mise);
  if (strict) vrai(`${nom} : aucune étiquette en conflit (${S.conflits.join(', ')})`, S.conflits.length === 0);
  // flèches de rayons : jamais sur une autre flèche ni sur une étiquette
  const fl = S.els.rayons.map(r => ({ x0: r.mid[0] - 6, x1: r.mid[0] + 6, y0: r.mid[1] - 6, y1: r.mid[1] + 6 }));
  for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) {
    const a = fl[i], b = fl[j]; if (strict) vrai(`${nom} : flèches ${i} et ${j} séparées`, !(a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1));
  }
  for (const e of S.etiquettes) if (strict && !e.boite.fixe) vrai(`${nom} : étiquette ${e.txt} près de son point (${Math.round(e.dist)} px) ou reliée par un trait`, e.dist <= 25 || !!e.lien);
  for (const e of S.etiquettes) { const b = e.boite; if (strict) vrai(`${nom} : étiquette ${e.txt} dans le schéma`, b.x0 >= 0 && b.x1 <= mise.w && b.y0 >= 0 && b.y1 <= mise.h); }
  return S;
};
for (const [nom, o] of SCENES) verifierScene(nom, { f: 4, h: 2, ...o });
// exploration : f′ ∈ {2, 3, 4, 5}, d de 1 à 14,5 par pas de 0,5 : on compte les conflits (le schéma reste lisible dans presque tous les cas)
let total = 0, conflits = 0;
for (const f of [2, 3, 4, 5]) for (let d = 1; d <= 14.5; d += 0.5) {
  total++; const S = verifierScene(`explo f=${f} d=${d}`, { f, h: 2, d, rayons: T, image: true, ecran: true, points: ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'] }, G.MISE_SCENE, false);
  if (S.conflits.length) { conflits++; console.log(`  (exploration) conflit f′=${f} OA=${d} : ${S.conflits.join(', ')}`); }
}
console.log(`exploration : ${total} configurations, ${conflits} avec une étiquette en conflit`);
vrai('exploration : au plus 5 % de configurations avec un conflit d’étiquette', conflits <= total * 0.05);

// cartes (viewBox de 300) : configurations utilisées
for (const [nom, o] of [['carte rayons', { d: 12, rayons: T }], ['carte image', { d: 12, rayons: T, image: true, ecran: true, points: ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'] }], ['carte thalès', { d: 12, rayons: T, image: true, points: ['A', 'B', 'O', 'Ap', 'Bp'] }]])
  verifierScene(nom, { f: 4, h: 2, ...o }, G.MISE_CARTE);

// ---------- candidats : un seul bon tracé ; ce tracé est bien le rayon exact ----------
for (const id of [1, 2, 3]) {
  const bons = G.CANDIDATS[id].filter(c => c.bon); vrai(`rayon ${id} : un seul tracé correct`, bons.length === 1 && bons[0].lettre === G.LETTRE_BONNE[id]);
  vrai(`rayon ${id} : lettres a, b, c, d`, G.CANDIDATS[id].map(c => c.lettre).join('') === 'abcd');
  const c = M.construction(12, 4, 2), r = M.rayonDe(c, id), bon = bons[0], u = G.construireScene({ d: 12, rayons: { [id]: 'avant' }, candidats: id }).els.candidats;
  vrai(`rayon ${id} : 4 tracés candidats dans la fenêtre`, u.length === 4);
  // le tracé « correct » a la direction exacte du rayon après la lentille
  const dirBon = r.apres.u, cand = u.find(x => x.lettre === bon.lettre);
  proche(`rayon ${id} : tracé correct colinéaire au rayon`, cand.u[0] * dirBon[1] - cand.u[1] * dirBon[0], 0, 1e-9);
  // les trois autres sont différents
  for (const x of u) if (x.lettre !== bon.lettre) vrai(`rayon ${id} : tracé ${x.lettre} différent du bon`, Math.abs(x.u[0] * dirBon[1] - x.u[1] * dirBon[0]) > 1e-6);
}

// ---------- défis ----------
{
  const tol = M.TOL_DEFI; let nL = 0, nT = 0;
  for (let i = 0; i < 20000; i++) {
    const d = M.tirerDefiThales(); nT++;
    vrai('thalès : valeur finie et positive', isFinite(d.vrai) && d.vrai > 0);
    vrai('thalès : bonne réponse acceptée', M.reponseThalesJuste(d, d.vrai));
    vrai('thalès : arrondi à 2 CS accepté', M.reponseThalesJuste(d, M.arrondiSig(d.vrai, 2)));
    // valeurs recopiées ou inversées refusées
    for (const [nom, v] of [['AB', d.AB], ['OA', d.OA], ['OA′', d.OAp], ['inverse', d.variante === 'gamma' ? 1 / d.gamma : d.AB * d.OA / d.OAp], ['produit AB×OA′', d.AB * d.OAp], ['somme', d.AB + d.OAp]])
      if (M.reponseThalesJuste(d, v)) { vrai(`thalès : « ${nom} » = ${v} accepté pour ${d.vrai} (${JSON.stringify(d)})`, false); break; }
    if (M.reponseThalesJuste(d, d.variante === 'gamma' ? d.hImg : d.gamma)) vrai('thalès : γ confondu avec A′B′', false);
  }
  for (let i = 0; i < 5000; i++) {
    const d = M.tirerDefiLire(); nL++; const c = M.construction(d.d, d.f);
    vrai('lire : image dans le schéma', c.image.OAp <= M.X_MAX - 0.5 && c.image.hImg <= M.LENS_H - 0.4);
    vrai('lire : bonne distance acceptée', M.reponseDistanceJuste(d.vraiOAp, d.vraiOAp) && M.reponseHauteurJuste(d.vraiAB, d.vraiAB));
    vrai('lire : OA recopié refusé', !M.reponseDistanceJuste(d.vraiOAp, d.d) || Math.abs(d.d - d.vraiOAp) < 0.5);
    vrai('lire : f′ recopié refusé pour OA′', !M.reponseDistanceJuste(d.vraiOAp, d.f));
    vrai('lire : AB recopié refusé pour A′B′ (si l’image n’a pas la même taille)', Math.abs(d.vraiAB - M.H_OBJ) < 0.5 || !M.reponseHauteurJuste(d.vraiAB, M.H_OBJ));
  }
  console.log(`défis : ${nT} tirages Thalès et ${nL} tirages Lire contrôlés (tolérance ${tol * 100} % ; lecture à ±0,5 cm)`);
  // scènes des défis « lire » : étiquettes sans conflit
  for (const cfg of M.CONFIGS_DEFI_LIRE) verifierScene(`défi lire f=${cfg.f} d=${cfg.d}`, { f: cfg.f, h: 2, d: cfg.d, rayons: T, image: true, ecran: false, points: ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'] });
}
// ---------- espaces insécables : aucun « nombre + espace ordinaire + unité » dans les fichiers de la simulation ----------
import fs from 'fs';
for (const f of ['ImageLentille2gt.jsx', 'ImageLentille2gtFiches.jsx', 'ImageLentille2gtScenes.jsx', 'imageLentille2gtQcm.js', 'imageLentille2gtModele.js', 'imageLentille2gtGeometrie.js']) {
  const t = fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, ''), m = t.match(/[0-9] (cm|mm|°|%)(?![\p{L}\d])/gu);
  vrai(`${f} : aucun chiffre suivi d'un espace ordinaire et d'une unité (code 160 attendu) ${m ? m.slice(0, 3) : ''}`, !m);
}
vrai('NB est bien U+00A0', M.NB.charCodeAt(0) === 160);
// ---------- aria-label neutre dans le parcours : la description détaillée (sens, OA′, A′B′) n'est donnée qu'en exploration ----------
{ const c = M.construction(6); const det = G.descriptionScene({ d: 6, f: 4, h: 2, rayons: T, image: true }, c); vrai('description détaillée donne bien les valeurs (exploration)', /renversée/.test(det)); }
console.log(`${n} contrôles, ${ko} échec(s)`);
if (ko) process.exit(1);
