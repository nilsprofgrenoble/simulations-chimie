// Modèle du jeu « Laser Maze » (sim 290) : tracé d'un rayon lumineux avec miroirs plans, lames et prismes.
// Hypothèses (rappelées dans le jeu) : faisceau très fin et monochromatique (pas de dispersion), miroirs parfaits,
// à une interface transparente on suit le seul rayon réfracté (la faible partie réfléchie est négligée), sauf en réflexion totale.
// Repère : x vers la droite, y vers le BAS (repère de l'écran) ; les angles sont en degrés, 0° = vers la droite, sens horaire à l'écran.

export const LARGEUR = 800, HAUTEUR = 500;
export const MATERIAUX = { eau: { nom: 'Eau', n: 1.33 }, verre: { nom: 'Verre', n: 1.5 }, diamant: { nom: 'Diamant', n: 2.42 } };

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
  (niv.miroirs || []).forEach(m => { angles[m.id] = m.a0; });
  (niv.blocs || []).forEach(b => { angles[b.id] = b.a0; mats[b.id] = b.mat; });
  return { angles, mats };
}

// Tracé complet : points du rayon, événements (pour l'affichage des angles) et « atteint » si la cible est touchée
export function tracer(niv, reglage) {
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
    return { b, n: MATERIAUX[reglage.mats[b.id]].n, aretes };
  });
  let atteint = false;
  for (let pas = 0; pas < 40; pas++) {
    let best = null;
    const essai = (t, info) => { if (t !== null && (!best || t < best.t)) best = { t, ...info }; };
    miroirs.forEach(({ m, s }) => essai(coupeSegment(p, d, s), { type: 'miroir', m, s }));
    (niv.murs || []).forEach(s => essai(coupeSegment(p, d, s), { type: 'mur' }));
    BORDS.forEach(s => essai(coupeSegment(p, d, s), { type: 'mur' }));
    blocs.forEach(bl => bl.aretes.forEach(ar => essai(coupeSegment(p, d, ar.s), { type: 'bloc', bl, ar })));
    essai(coupeCercle(p, d, niv.cible), { type: 'cible' });
    if (!best) break;
    p = [p[0] + d[0] * best.t, p[1] + d[1] * best.t];
    pts.push(p);
    if (best.type === 'mur') break;
    if (best.type === 'cible') { atteint = true; break; }
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
  return { points: pts, evts, atteint };
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
];

// Étoiles selon le nombre d'ajustements (gestes) : 3 si ≤ par, 2 si ≤ 2×par, 1 sinon
export const etoiles = (niv, gestes) => gestes <= niv.par ? 3 : gestes <= 2 * niv.par ? 2 : 1;
