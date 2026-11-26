// Modèle du jeu « Laser Maze » (sim 290) : tracé d'un rayon lumineux avec miroirs plans, lames et prismes.
// Hypothèses (rappelées dans le jeu) : faisceau très fin ; chaque rayon est monochromatique, l'indice dépend de la longueur d'onde
// (dispersion, modèle simple en 1/λ², volontairement EXAGÉRÉE pour qu'elle se voie), la lumière blanche est un faisceau de 7 rayons colorés ; miroirs parfaits,
// à une interface transparente on suit le seul rayon réfracté (la faible partie réfléchie est négligée), sauf en réflexion totale.
// Repère : x vers la droite, y vers le BAS (repère de l'écran) ; les angles sont en degrés, 0° = vers la droite, sens horaire à l'écran.

export const LARGEUR = 800, HAUTEUR = 500;
// n = indice à 589 nm ; disp = intensité (exagérée) de la dispersion : n(λ) = n + disp × ((589/λ)² − 1)
export const MATERIAUX = { eau: { nom: 'Eau', n: 1.33, disp: 0.06 }, verre: { nom: 'Verre', n: 1.5, disp: 0.10 }, diamant: { nom: 'Diamant', n: 2.42, disp: 0.2 } };
export const LAMBDA_REF = 589;
export const indice = (mat, lambda = LAMBDA_REF) => MATERIAUX[mat].n + MATERIAUX[mat].disp * ((LAMBDA_REF / lambda) ** 2 - 1);
export const LAMBDAS_BLANC = [430, 470, 510, 550, 590, 630, 670];
export const LASERS = [{ nom: 'Rouge', lambda: 650 }, { nom: 'Vert', lambda: 532 }, { nom: 'Bleu', lambda: 450 }];
export const nomCouleur = l => (l < 450 ? 'violet' : l < 495 ? 'bleu' : l < 570 ? 'vert' : l < 590 ? 'jaune' : l < 620 ? 'orange' : 'rouge');
// couleur d'affichage (teinte approchée, foncée pour rester visible sur fond clair)
export const teinteLambda = l => `hsl(${Math.round(270 * (1 - (Math.min(700, Math.max(400, l)) - 400) / 300))} 90% 42%)`;

const rad = d => d * Math.PI / 180;
const deg = r => r * 180 / Math.PI;
const EPS = 1e-6;

// Segment d'un miroir (centre, longueur, angle d'orientation)
export function segmentMiroir(m, angle) {
  const a = rad(angle), dx = Math.cos(a) * m.len / 2, dy = Math.sin(a) * m.len / 2;
  return [m.x - dx, m.y - dy, m.x + dx, m.y + dy];
}

// Sommets d'un bloc transparent tourné de « angle » autour de son centre de gravité
export function sommetsBloc(b, angle) {
  let loc;
  if (b.type === 'lame') { const w = b.w / 2, h = b.h / 2; loc = [[-w, -h], [w, -h], [w, h], [-w, h]]; }
  else { const c = b.c; loc = [[-c / 3, -c / 3], [2 * c / 3, -c / 3], [-c / 3, 2 * c / 3]]; }   // prisme rectangle isocèle : angle droit en haut à gauche
  const a = rad(angle), ca = Math.cos(a), sa = Math.sin(a);
  return loc.map(([x, y]) => [b.x + x * ca - y * sa, b.y + x * sa + y * ca]);
}

// Intersection du rayon (p, d) avec le segment [a, b] : retourne t (distance) ou null
function coupeSegment(p, d, s) {
  const [x1, y1, x2, y2] = s, ex = x2 - x1, ey = y2 - y1;
  const den = d[0] * ey - d[1] * ex;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((x1 - p[0]) * ey - (y1 - p[1]) * ex) / den;
  const u = ((x1 - p[0]) * d[1] - (y1 - p[1]) * d[0]) / den;
  return t > EPS && u >= -1e-9 && u <= 1 + 1e-9 ? t : null;
}
function coupeCercle(p, d, c) {
  const fx = p[0] - c.x, fy = p[1] - c.y, b = fx * d[0] + fy * d[1], q = fx * fx + fy * fy - c.r * c.r, disc = b * b - q;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > EPS ? t : (-b + Math.sqrt(disc) > EPS && q < 0 ? EPS * 2 : null);
}

const BORDS = [[0, 0, LARGEUR, 0], [LARGEUR, 0, LARGEUR, HAUTEUR], [LARGEUR, HAUTEUR, 0, HAUTEUR], [0, HAUTEUR, 0, 0]];

// Réglage initial d'un niveau : angles des miroirs et blocs, matériau des blocs
export function reglageInitial(niv) {
  const angles = {}, mats = {};
  const lambda = niv.source.choix ? niv.source.lambda0 : (niv.source.lambda || LAMBDA_REF);
  (niv.miroirs || []).forEach(m => { angles[m.id] = m.a0; });
  (niv.blocs || []).forEach(b => { angles[b.id] = b.a0; mats[b.id] = b.mat; });
  return { angles, mats, lambda };
}

// Tracé d'UN rayon monochromatique de longueur d'onde « lambda » : points, événements et cibles atteintes (une cible à bande de longueurs d'onde
// absorbe tous les rayons mais ne compte que ceux de sa bande)
export function tracerRayon(niv, reglage, lambda) {
  const cibles = niv.cibles || [niv.cible], atteintes = cibles.map(() => false);
  const pts = [[niv.source.x, niv.source.y]], evts = [];
  let p = [niv.source.x, niv.source.y], d = [Math.cos(rad(niv.source.a)), Math.sin(rad(niv.source.a))];
  const miroirs = (niv.miroirs || []).map(m => ({ m, s: segmentMiroir(m, reglage.angles[m.id]) }));
  const blocs = (niv.blocs || []).map(b => {
    const v = sommetsBloc(b, reglage.angles[b.id]), cx = v.reduce((a, q) => a + q[0], 0) / v.length, cy = v.reduce((a, q) => a + q[1], 0) / v.length;
    const aretes = v.map((q, i) => {
      const r = v[(i + 1) % v.length], ex = r[0] - q[0], ey = r[1] - q[1], l = Math.hypot(ex, ey);
      let nx = ey / l, ny = -ex / l;
      if (nx * ((q[0] + r[0]) / 2 - cx) + ny * ((q[1] + r[1]) / 2 - cy) < 0) { nx = -nx; ny = -ny; }   // normale sortante
      return { s: [q[0], q[1], r[0], r[1]], n: [nx, ny] };
    });
    return { b, n: indice(reglage.mats[b.id], lambda), aretes };
  });
  for (let pas = 0; pas < 40; pas++) {
    let best = null;
    const essai = (t, info) => { if (t !== null && (!best || t < best.t)) best = { t, ...info }; };
    miroirs.forEach(({ m, s }) => essai(coupeSegment(p, d, s), { type: 'miroir', m, s }));
    (niv.murs || []).forEach(s => essai(coupeSegment(p, d, s), { type: 'mur' }));
    BORDS.forEach(s => essai(coupeSegment(p, d, s), { type: 'mur' }));
    blocs.forEach(bl => bl.aretes.forEach(ar => essai(coupeSegment(p, d, ar.s), { type: 'bloc', bl, ar })));
    cibles.forEach((c, k) => essai(coupeCercle(p, d, c), { type: 'cible', k }));
    if (!best) break;
    p = [p[0] + d[0] * best.t, p[1] + d[1] * best.t];
    pts.push(p);
    if (best.type === 'mur') break;
    if (best.type === 'cible') { const c = cibles[best.k]; if (!c.bande || (lambda >= c.bande[0] && lambda <= c.bande[1])) atteintes[best.k] = true; break; }
    if (best.type === 'miroir') {
      const a = rad(reglage.angles[best.m.id]), n = [-Math.sin(a), Math.cos(a)], dn = d[0] * n[0] + d[1] * n[1];
      evts.push({ type: 'miroir', id: best.m.id, nom: best.m.nom, i: deg(Math.acos(Math.min(1, Math.abs(dn)))), pt: p, nor: n });
      d = [d[0] - 2 * dn * n[0], d[1] - 2 * dn * n[1]];
      continue;
    }
    // interface d'un bloc transparent : loi de Snell-Descartes
    const { bl, ar } = best, dn = d[0] * ar.n[0] + d[1] * ar.n[1];
    const entre = dn < 0, n1 = entre ? 1 : bl.n, n2 = entre ? bl.n : 1;
    const cosi = Math.abs(dn), sini = Math.sqrt(Math.max(0, 1 - cosi * cosi)), sint = n1 / n2 * sini;
    const i1 = deg(Math.asin(Math.min(1, sini)));
    if (sint > 1) {   // réflexion totale
      evts.push({ type: 'totale', id: bl.b.id, nom: bl.b.nom, i: i1, n1, n2, limite: deg(Math.asin(n2 / n1)), pt: p, nor: ar.n });
      d = [d[0] - 2 * dn * ar.n[0], d[1] - 2 * dn * ar.n[1]];
    } else {
      const cost = Math.sqrt(1 - sint * sint), k = n1 / n2, sg = entre ? -1 : 1;   // N : normale dirigée dans le sens de propagation
      const N = [sg * ar.n[0], sg * ar.n[1]];
      evts.push({ type: 'refraction', id: bl.b.id, nom: bl.b.nom, entre, i1, i2: deg(Math.asin(sint)), n1, n2, pt: p, nor: ar.n });
      d = [k * d[0] + (cost - k * cosi) * N[0], k * d[1] + (cost - k * cosi) * N[1]];
    }
  }
  return { lambda, points: pts, evts, atteintes };
}

// Tracé complet : un rayon (laser) ou sept (lumière blanche). « points » et « evts » sont ceux du rayon suivi (celui dont la couleur est la plus proche
// de la cible colorée, sinon le rayon central) ; « atteint » = toutes les cibles touchées par au moins un rayon de la bonne couleur.
export function tracer(niv, reglage) {
  const cibles = niv.cibles || [niv.cible];
  const lambdas = niv.source.blanc ? LAMBDAS_BLANC : [reglage.lambda ?? niv.source.lambda ?? LAMBDA_REF];
  const rayons = lambdas.map(l => tracerRayon(niv, reglage, l));
  const atteintes = cibles.map((_, k) => rayons.some(r => r.atteintes[k]));
  const b0 = cibles[0].bande, vise = b0 ? (b0[0] + b0[1]) / 2 : LAMBDA_REF;
  const suivi = rayons.reduce((a, r) => (Math.abs(r.lambda - vise) < Math.abs(a.lambda - vise) ? r : a));
  return { points: suivi.points, evts: suivi.evts, lambdaSuivi: suivi.lambda, rayons, atteintes, atteint: atteintes.every(Boolean) };
}

// Niveaux. Chaque niveau : consigne courte, « savoir » rappelé, éléments réglables et cible.
export const NIVEAUX = [
  { id: 1, titre: 'Premier rebond', icone: '🪞',
    consigne: "Oriente le miroir pour que le laser touche la cible.",
    savoir: "Loi de la réflexion : l'angle d'incidence i est égal à l'angle de réflexion r (mesurés par rapport à la normale au miroir).",
    source: { x: 70, y: 250, a: 0 }, cible: { x: 420, y: 430, r: 24 }, murs: [],
    miroirs: [{ id: 'm1', nom: 'Miroir 1', x: 420, y: 250, len: 120, a0: 100 }], blocs: [], par: 3 },
  { id: 2, titre: 'Double rebond', icone: '🔁',
    consigne: "Deux miroirs : à toi de trouver les bons angles.",
    savoir: "À chaque miroir, i = r. Le rayon réfléchi repart du côté de la normale opposé au rayon incident.",
    source: { x: 70, y: 430, a: -20 }, cible: { x: 690, y: 380, r: 30 }, murs: [[520, 250, 520, 500]],
    miroirs: [{ id: 'm1', nom: 'Miroir 1', x: 330, y: 335, len: 120, a0: 70 }, { id: 'm2', nom: 'Miroir 2', x: 520, y: 175, len: 120, a0: 20 }], blocs: [], par: 5 },
  { id: 3, titre: 'Contourner le mur', icone: '🧱',
    consigne: "Le mur absorbe la lumière : fais passer le laser par en dessous.",
    savoir: "Un miroir à 45° d'un rayon horizontal le renvoie à 90°. Pour les autres angles, appuie-toi sur i = r.",
    source: { x: 70, y: 140, a: 0 }, cible: { x: 610, y: 120, r: 46 }, murs: [[390, 0, 390, 270], [300, 270, 390, 270], [520, 150, 520, 270]],
    miroirs: [{ id: 'm1', nom: 'Miroir 1', x: 230, y: 140, len: 120, a0: 100 }, { id: 'm2', nom: 'Miroir 2', x: 230, y: 350, len: 120, a0: 10 }, { id: 'm3', nom: 'Miroir 3', x: 480, y: 350, len: 120, a0: 80 }], blocs: [], par: 8 },
  { id: 4, titre: 'La lame de verre', icone: '🔍',
    consigne: "Incline la lame de verre pour décaler le laser vers la cible.",
    savoir: "Réfraction : n₁ sin i₁ = n₂ sin i₂. Le rayon qui sort d'une lame à faces parallèles est parallèle au rayon d'entrée, mais décalé.",
    source: { x: 70, y: 300, a: 0 }, cible: { x: 640, y: 252, r: 22 }, murs: [],
    miroirs: [], blocs: [{ id: 'b1', nom: 'Lame de verre', type: 'lame', x: 330, y: 300, w: 170, h: 150, mat: 'verre', a0: 0, choix: false }], par: 3 },
  { id: 5, titre: 'Le prisme magique', icone: '🔺',
    consigne: "Fais renvoyer le laser vers le haut, en choisissant le bon matériau et la bonne orientation du prisme.",
    savoir: "Réflexion totale : elle apparaît quand la lumière passe d'un milieu plus réfringent à un moins réfringent avec i > angle limite, sin i_lim = n₂/n₁.",
    source: { x: 70, y: 280, a: 0 }, cible: { x: 387, y: 80, r: 26 }, murs: [],
    miroirs: [], blocs: [{ id: 'b1', nom: 'Prisme', type: 'prisme', c: 170, x: 330, y: 280, mat: 'eau', a0: 25, choix: true }], par: 4 },
  { id: 6, titre: 'Choisis ta couleur', icone: '🌈',
    consigne: "La cible bleue ne réagit qu'à la lumière bleue : choisis la bonne couleur de laser, puis oriente le prisme.",
    savoir: "Une couleur correspond à une longueur d'onde dans le vide (violet ≈ 400 nm, vert ≈ 530 nm, rouge ≈ 700 nm). L'indice du verre dépend de la longueur d'onde : plus λ est courte, plus n est grand et plus le rayon est dévié.",
    source: { x: 70, y: 370, a: 0, choix: true, lambda0: 650 }, cibles: [{ x: 700, y: 156, r: 11, bande: [440, 495], nom: 'bleue' }], murs: [],
    miroirs: [], blocs: [{ id: 'b1', nom: 'Prisme', type: 'prisme', c: 170, x: 300, y: 370, mat: 'verre', a0: 60, choix: false }], par: 3 },
  { id: 7, titre: 'Lumière blanche', icone: '🌟',
    consigne: "La lumière blanche contient toutes les couleurs. Fais en sorte que seule la lumière verte touche la cible verte.",
    savoir: "La lumière blanche est un mélange de longueurs d'onde. Dans un prisme, chaque couleur est déviée différemment (dispersion) : le faisceau s'étale en spectre. Le violet est le plus dévié, le rouge le moins.",
    source: { x: 70, y: 370, a: 0, blanc: true }, cibles: [{ x: 640, y: 214, r: 9, bande: [500, 570], nom: 'verte' }], murs: [],
    miroirs: [], blocs: [{ id: 'b1', nom: 'Prisme', type: 'prisme', c: 170, x: 300, y: 370, mat: 'verre', a0: 60, choix: false }], par: 3 },
  { id: 8, titre: 'Deux cibles, un prisme', icone: '🎆',
    consigne: "Touche la cible violette ET la cible rouge avec un seul faisceau de lumière blanche. Choisis le bon matériau : il faut que le spectre soit assez étalé !",
    savoir: "La dispersion dépend du matériau : plus elle est forte, plus l'écart entre le violet et le rouge est grand. Dans les verres réels, n varie de quelques centièmes entre le violet et le rouge (ici, l'écart est volontairement exagéré).",
    source: { x: 70, y: 370, a: 0, blanc: true }, cibles: [{ x: 700, y: 135, r: 9, bande: [400, 460], nom: 'violette' }, { x: 700, y: 197, r: 9, bande: [620, 700], nom: 'rouge' }], murs: [],
    miroirs: [], blocs: [{ id: 'b1', nom: 'Prisme', type: 'prisme', c: 170, x: 300, y: 370, mat: 'eau', a0: 60, choix: true }], par: 4 },
];

// Étoiles selon le nombre d'ajustements (gestes) : 3 si ≤ par, 2 si ≤ 2×par, 1 sinon
export const etoiles = (niv, gestes) => gestes <= niv.par ? 3 : gestes <= 2 * niv.par ? 2 : 1;
