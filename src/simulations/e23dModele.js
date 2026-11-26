// Modèle PUR de la vue 3D d'une élimination (E2 ou E1) : H (porté par Cβ) et Br (porté par Cα) sont de part et d'autre de la liaison C–C (anti-périplanaires).
// Aucune dépendance à React ni à three.js : testé par e23dModele.test.mjs. Géométrie schématique ; pas de calcul d'énergie.
// Repère : la liaison Cβ–Cα est sur l'axe x (Cβ en x < 0). H pointe vers +y, Br vers −y. Le plan de l'alcène formé est le plan (x, z).
// E2 : une seule étape (H arraché pendant que Br part). E1 : Br part d'abord (carbocation plan sur Cα), puis la base arrache H.
export const seg = (u, a, b) => { const t = Math.min(1, Math.max(0, (u - a) / (b - a))); return t * t * (3 - 2 * t); };
const DX = 0.8, LCH = 1.0, LR = 1.5, R3 = Math.sqrt(8) / 3;      // R3 : composante perpendiculaire d'une liaison tétraédrique
const norm = v => { const n = Math.hypot(...v); return v.map(t => t / n); };
const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const add = (a, b, k = 1) => a.map((x, i) => x + k * b[i]);
const phi = (sx, deg) => { const a = deg * Math.PI / 180; return [sx / 3, R3 * Math.cos(a), R3 * Math.sin(a)]; };   // direction tétraédrique, φ mesuré depuis +y

// t = { g : approche de la base, fa / fb : aplatissement des R de Cα / Cβ, d : départ de Br, opCH, opBr, opBH : opacité des liaisons, opPi : liaison π }
function construire(t) {
  const cb = [-DX, 0, 0], ca = [DX, 0, 0];
  const dirH = phi(-1, 0), dirBr = phi(1, 180);
  const plan = (sx, sz) => [sx * 0.5, 0, sz * Math.sqrt(3) / 2];     // direction trigonale dans le plan (x, z)
  const rb = [[phi(-1, 120), plan(-1, 1)], [phi(-1, 240), plan(-1, -1)]].map(([a, p]) => norm(mix(a, p, t.fb)));
  const rc = [[phi(1, 60), plan(1, 1)], [phi(1, 300), plan(1, -1)]].map(([a, p]) => norm(mix(a, p, t.fa)));
  const H = add(cb, dirH, LCH + 0.7 * t.g);                    // H s'éloigne un peu de Cβ quand la base l'attire
  const base = add(H, [0, 1, 0], 2.8 - 1.8 * t.g);              // la base arrive d'en haut, du côté de H
  const br = add(ca, dirBr, 1.9 + 1.8 * t.d);
  return { cb, ca, H, base, br, rb: rb.map(v => add(cb, v, LR)), rc: rc.map(v => add(ca, v, LR)), dirsB: rb, dirsC: rc,
    opCH: t.opCH, opBr: t.opBr, opBH: t.opBH, opPi: t.opPi, fa: t.fa, fb: t.fb, f: Math.max(t.fa, t.fb), g: t.g, dirH, dirBr,
    brParti: t.opBr < 0.5, baseLiee: t.opBH > 0.5 };
}

export function etat(u) {            // E2
  const g = seg(u, 0.1, 0.6), f = seg(u, 0.3, 0.8), d = seg(u, 0.35, 0.9);
  return construire({ g, fa: f, fb: f, d, opCH: 1 - seg(u, 0.3, 0.6), opBr: 1 - seg(u, 0.3, 0.6), opBH: seg(u, 0.3, 0.65), opPi: f });
}

export function etatE1(u) {          // E1 : 1re étape (0 → 0,5) : Br part, carbocation plan ; 2e étape (0,55 → 1) : la base arrache H
  const d = seg(u, 0.05, 0.4), fa = seg(u, 0.15, 0.45), g = seg(u, 0.55, 0.9), fb = seg(u, 0.6, 0.95);
  return construire({ g, fa, fb, d, opCH: 1 - seg(u, 0.65, 0.9), opBr: 1 - seg(u, 0.1, 0.3), opBH: seg(u, 0.65, 0.92), opPi: fb });
}
