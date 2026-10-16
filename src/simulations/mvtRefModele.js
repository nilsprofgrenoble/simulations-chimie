// ====================================================
//  SIM 56 — RÉFÉRENTIEL ET MOUVEMENT (2GT) : modèle
//  Les positions sont fournies par un modèle exact (ce n'est pas une mesure) ; on les « photographie »
//  à intervalles Δt, dans le référentiel de son choix. Tous les référentiels sont en TRANSLATION les uns par
//  rapport aux autres (le programme de seconde ne traite pas la rotation).
//  Pour chaque scène : des référentiels (origine O(t) et vitesse V(t) dans le repère « sol »), des objets
//  (position et vitesse exactes dans le repère « sol »).
//  Position dans un référentiel F : r_F(t) = r_sol(t) − O_F(t) ; vitesse : v_F(t) = v_sol(t) − V_F(t).
// ====================================================

export const G = 9.8;

const nul = () => ({ x: 0, y: 0 });

// ---------- scènes ----------
const VT = 8, H0 = 1.2;                 // wagon : vitesse du train (m/s) et hauteur de lâcher (m)
const VP = 100, HP = 500;               // avion : vitesse (m/s) et altitude (m)
const LB = 0.8, OM = 4 * Math.PI;       // bâton : longueur (m) et vitesse angulaire (rad/s)
const V0_B = { x: 2.4, y: 4.0 }, P0_B = { x: 0, y: 1.0 };
const V0_F = 8, A_F = -2;               // freinage : vitesse initiale (m/s) et accélération du train (m/s²)

export const ORDRE_SCENES = ['wagon', 'avion', 'deux', 'baton', 'freinage'];

export function scene(id, params = {}) {
  if (id === 'wagon') return {
    id, titre: 'Bille lâchée dans un wagon', court: 'Wagon', icone: '🚃', T: 0.48, dts: [0.02, 0.04, 0.06, 0.12, 0.24], dtDef: 0.06,
    U: { L: 'm', V: 'm/s', T: 's' }, sigmaDef: 0.015, uniteSigma: '1,5 cm',
    frames: [
      { id: 'sol', nom: 'le quai', court: 'quai', O: nul, V: nul, galileen: true },
      { id: 'mobile', nom: 'le wagon', court: 'wagon', O: t => ({ x: VT * t, y: 0 }), V: () => ({ x: VT, y: 0 }), galileen: true },
    ],
    objets: [{ id: 'bille', nom: 'la bille', court: 'bille', col: '#2563eb',
      pos: t => ({ x: VT * t, y: H0 - 0.5 * G * t * t }), vit: t => ({ x: VT, y: -G * t }) }],
    legende: 'Une bille est lâchée, sans vitesse initiale par rapport au wagon, à 1,2 m du plancher ; le wagon roule à 8 m/s (≈ 29 km/h) en ligne droite à vitesse constante.',
  };
  if (id === 'avion') return {
    id, titre: 'Colis largué d’un avion', court: 'Avion', icone: '✈️', T: 10, dts: [0.5, 1, 2, 5], dtDef: 1,
    U: { L: 'm', V: 'm/s', T: 's' }, sigmaDef: 10, uniteSigma: '10 m',
    frames: [
      { id: 'sol', nom: 'le sol', court: 'sol', O: nul, V: nul, galileen: true },
      { id: 'mobile', nom: 'l’avion', court: 'avion', O: t => ({ x: VP * t, y: HP }), V: () => ({ x: VP, y: 0 }), galileen: true },
    ],
    objets: [
      { id: 'colis', nom: 'le colis', court: 'colis', col: '#2563eb', pos: t => ({ x: VP * t, y: HP - 0.5 * G * t * t }), vit: t => ({ x: VP, y: -G * t }) },
      { id: 'avion', nom: 'l’avion', court: 'avion', col: '#7c3aed', pos: t => ({ x: VP * t, y: HP }), vit: () => ({ x: VP, y: 0 }) },
    ],
    legende: 'Un avion vole en palier à 500 m d’altitude et à 100 m/s (360 km/h), en ligne droite. Un colis est largué : il part sans vitesse initiale par rapport à l’avion. Frottements de l’air négligés.',
  };
  if (id === 'deux') {
    const vA = params.vA ?? 20, vB = params.vB ?? 25, xB0 = -(vB - vA) * 6;   // les deux véhicules se croisent (ou se dépassent) à t = 6 s
    return {
      id, titre: 'Deux véhicules sur une route droite', court: 'Deux véhicules', icone: '🚛', T: 12, dts: [1, 2, 3, 4], dtDef: 2, vA, vB,
      U: { L: 'm', V: 'm/s', T: 's' }, sigmaDef: 2, uniteSigma: '2 m',
      frames: [
        { id: 'sol', nom: 'la route', court: 'route', O: nul, V: nul, galileen: true },
        { id: 'A', nom: 'le véhicule A', court: 'véhicule A', O: t => ({ x: vA * t, y: 0 }), V: () => ({ x: vA, y: 0 }), galileen: true },
        { id: 'B', nom: 'le véhicule B', court: 'véhicule B', O: t => ({ x: xB0 + vB * t, y: 0 }), V: () => ({ x: vB, y: 0 }), galileen: true },
      ],
      objets: [
        { id: 'A', nom: 'le véhicule A', court: 'A', col: '#c2410c', voie: 0, pos: t => ({ x: vA * t, y: 0 }), vit: () => ({ x: vA, y: 0 }) },
        { id: 'B', nom: 'le véhicule B', court: 'B', col: '#2563eb', voie: 1, pos: t => ({ x: xB0 + vB * t, y: 0 }), vit: () => ({ x: vB, y: 0 }) },
      ],
      legende: `Deux véhicules roulent en ligne droite à vitesse constante dans le référentiel de la route : A à ${vA} m/s et B à ${vB} m/s (valeurs algébriques : le signe donne le sens, positif vers la droite). Ils sont à la même position à t = 6 s. Les voies sont dessinées l’une sous l’autre pour qu’on les distingue ; les deux points sont sur la même droite.`,
    };
  }
  if (id === 'baton') {
    const th = t => 0.3 + OM * t;
    const centre = t => ({ x: P0_B.x + V0_B.x * t, y: P0_B.y + V0_B.y * t - 0.5 * G * t * t });
    const vc = t => ({ x: V0_B.x, y: V0_B.y - G * t });
    const bout = s => ({
      pos: t => { const c = centre(t); return { x: c.x + s * LB / 2 * Math.cos(th(t)), y: c.y + s * LB / 2 * Math.sin(th(t)) }; },
      vit: t => { const c = vc(t); return { x: c.x - s * LB / 2 * OM * Math.sin(th(t)), y: c.y + s * LB / 2 * OM * Math.cos(th(t)) }; },
    });
    return {
      id, titre: 'Bâton lancé en rotation', court: 'Bâton', icone: '🏑', T: 1, dts: [0.05, 0.1, 0.2, 0.25], dtDef: 0.1,
      U: { L: 'm', V: 'm/s', T: 's' }, sigmaDef: 0.01, uniteSigma: '1 cm',
      frames: [{ id: 'sol', nom: 'le sol', court: 'sol', O: nul, V: nul, galileen: true }],
      objets: [
        { id: 'centre', nom: 'le centre du bâton', court: 'centre', col: '#2563eb', pos: centre, vit: vc, th, longueur: LB },
        { id: 'boutA', nom: 'le bout rouge', court: 'bout rouge', col: '#dc2626', ...bout(1) },
        { id: 'boutB', nom: 'le bout bleu', court: 'bout bleu', col: '#0369a1', ...bout(-1) },
      ],
      legende: 'Un bâton de 80 cm est lancé en l’air en tournant sur lui-même (2 tours par seconde). Frottements de l’air négligés.',
    };
  }
  if (id === 'freinage') return {
    id, titre: 'Bille sur le plancher d’un train qui freine', court: 'Train qui freine', icone: '🚆', T: 4, dts: [0.25, 0.5, 1, 2], dtDef: 0.5, pourAllerPlusLoin: true,
    U: { L: 'm', V: 'm/s', T: 's' }, sigmaDef: 0.05, uniteSigma: '5 cm',
    frames: [
      { id: 'sol', nom: 'le quai', court: 'quai', O: nul, V: nul, galileen: true },
      { id: 'mobile', nom: 'le train qui freine', court: 'train', O: t => ({ x: V0_F * t + 0.5 * A_F * t * t, y: 0 }), V: t => ({ x: V0_F + A_F * t, y: 0 }), galileen: false },
    ],
    objets: [{ id: 'bille', nom: 'la bille', court: 'bille', col: '#2563eb', pos: t => ({ x: V0_F * t, y: 0 }), vit: () => ({ x: V0_F, y: 0 }) }],
    legende: 'Une bille est posée sur le plancher lisse d’un train qui roule à 8 m/s. Le train freine régulièrement (2 m/s²) et s’arrête en 4 s. Sans frottement, aucune force horizontale ne s’exerce sur la bille.',
  };
  throw new Error('scène inconnue : ' + id);
}

// ---------- échantillonnage : la « chronophotographie » ----------
// bruit déterministe (même valeur à chaque affichage) : pseudo-aléa fonction de la date et de l'objet
function alea(graine) { let x = Math.sin(graine * 12.9898 + 78.233) * 43758.5453; x -= Math.floor(x); return x; }
function graineDe(chaine, t, k) { let h = 7; for (let i = 0; i < chaine.length; i++) h = (h * 31 + chaine.charCodeAt(i)) % 9973; return h * 0.37 + Math.round(t * 1000) * 0.013 + k * 101.7; }
function gauss(graine) { const u = Math.max(alea(graine), 1e-9), w = alea(graine + 0.5); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); }

export function echantillonner(S, frameId, objId, dt, sigma = 0, graine = 0) {
  const F = S.frames.find(f => f.id === frameId), P = S.objets.find(o => o.id === objId);
  const n = Math.round(S.T / dt + 1e-9);
  const t = [], p = [], pv = [], ve = [];
  for (let j = 0; j <= n; j++) {
    const tj = j * dt, g = P.pos(tj), o = F.O(tj), vg = P.vit(tj), vf = F.V(tj);
    t.push(tj);
    pv.push({ x: g.x - o.x, y: g.y - o.y });                       // position « vraie » dans le référentiel F
    const nx = sigma ? sigma * gauss(graineDe(frameId + objId, tj, 1 + 1000 * graine)) : 0, ny = sigma ? sigma * gauss(graineDe(frameId + objId, tj, 2 + 1000 * graine)) : 0;
    p.push({ x: pv[j].x + nx, y: pv[j].y + ny });                  // position « pointée » (avec l'erreur de pointage)
    ve.push({ x: vg.x - vf.x, y: vg.y - vf.y });                   // vitesse exacte dans F (connue seulement parce que les positions viennent d'un modèle)
  }
  const v = [];                                                     // v_j ≈ M_j M_{j+1} / Δt, attaché en M_j
  for (let j = 0; j < n; j++) v.push({ x: (p[j + 1].x - p[j].x) / dt, y: (p[j + 1].y - p[j].y) / dt });
  const dv = [];                                                    // Δv_j = v_j − v_{j−1}, attaché en M_j (j = 1 … n−1)
  for (let j = 1; j < n; j++) dv.push({ x: v[j].x - v[j - 1].x, y: v[j].y - v[j - 1].y });
  return { t, p, pv, v, ve, dv, n, dt };
}

export const norme = v => Math.hypot(v.x, v.y);
// angle en degrés, 0° = vers la droite, 90° = vers le haut
export const angle = v => Math.atan2(v.y, v.x) * 180 / Math.PI;

// écart relatif entre la vitesse approchée et la vitesse exacte au point M_j
export function ecartPoint(E, j) {
  if (j < 0 || j >= E.v.length) return NaN;
  const r = norme(E.ve[j]);
  const d = norme({ x: E.v[j].x - E.ve[j].x, y: E.v[j].y - E.ve[j].y });
  return r > 1e-9 ? d / r : NaN;
}
// écart moyen sur toute la série : moyenne des ‖v_j − ve_j‖ divisée par la moyenne des ‖ve_j‖
export function ecartMoyen(E) {
  let s = 0, r = 0;
  for (let j = 0; j < E.v.length; j++) { s += norme({ x: E.v[j].x - E.ve[j].x, y: E.v[j].y - E.ve[j].y }); r += norme(E.ve[j]); }
  return r > 1e-9 ? s / r : NaN;
}

// écart moyen « attendu » : moyenne sur 60 séries de pointage indépendantes (valeur stable, sans hasard visible)
export function ecartAttendu(S, frameId, objId, dt, sigma) {
  if (!sigma) return ecartMoyen(echantillonner(S, frameId, objId, dt, 0));
  let somme = 0; const K = 60;
  for (let k = 0; k < K; k++) somme += ecartMoyen(echantillonner(S, frameId, objId, dt, sigma, k + 1));
  return somme / K;
}
// meilleur Δt de la liste proposée par la scène
export function meilleurDt(S, frameId, objId, sigma) {
  let best = null;
  S.dts.forEach(dt => { const e = ecartAttendu(S, frameId, objId, dt, sigma); if (!best || e < best.e) best = { dt, e }; });
  return best;
}

// ---------- caractérisation exacte d'un mouvement dans un référentiel ----------
export function caracteriser(S, frameId, objId) {
  const E = echantillonner(S, frameId, objId, S.T / 400, 0);
  const pts = E.pv, n = pts.length;
  const mx = pts.reduce((a, q) => a + q.x, 0) / n, my = pts.reduce((a, q) => a + q.y, 0) / n;
  let sxx = 0, syy = 0, sxy = 0, etendue = 0;
  pts.forEach(q => { sxx += (q.x - mx) ** 2; syy += (q.y - my) ** 2; sxy += (q.x - mx) * (q.y - my); });
  sxx /= n; syy /= n; sxy /= n;
  const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
  pts.forEach(q => { etendue = Math.max(etendue, Math.hypot(q.x - pts[0].x, q.y - pts[0].y)); });
  const vit = E.ve.map(norme), vmax = Math.max(...vit), vmin = Math.min(...vit);
  let traj, mvt;
  if (etendue < 1e-6) traj = 'immobile'; else if (l2 <= 1e-6 * Math.max(l1, 1e-12)) traj = 'rectiligne'; else traj = 'courbe';
  if (vmax < 1e-6) mvt = 'immobile';
  else if (vmax - vmin <= 0.01 * vmax) mvt = 'uniforme';
  else {
    let croit = true, decroit = true;
    for (let j = 1; j < vit.length; j++) { if (vit[j] < vit[j - 1] - 1e-9) croit = false; if (vit[j] > vit[j - 1] + 1e-9) decroit = false; }
    mvt = croit ? 'accelere' : decroit ? 'ralenti' : 'quelconque';
  }
  return { traj, mvt, vmoy: vit.reduce((a, b) => a + b, 0) / vit.length };
}

// variation de vitesse exacte entre deux dates (même valeur dans deux référentiels en translation uniforme)
export function dvExact(S, frameId, objId, t0, t1) {
  const F = S.frames.find(f => f.id === frameId), P = S.objets.find(o => o.id === objId);
  const a = P.vit(t0), b = P.vit(t1), fa = F.V(t0), fb = F.V(t1);
  return { x: (b.x - fb.x) - (a.x - fa.x), y: (b.y - fb.y) - (a.y - fa.y) };
}
