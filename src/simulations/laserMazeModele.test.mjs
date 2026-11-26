// Test : node src/simulations/laserMazeModele.test.mjs — physique du tracé et solvabilité de chaque niveau de « Laser Maze »
import assert from 'node:assert';
import * as M from './laserMazeModele.js';

const rad = d => d * Math.PI / 180;
const dirFinale = tr => { const n = tr.points.length, a = tr.points[n - 2], b = tr.points[n - 1]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
const vide = { source: { x: 100, y: 250, a: 0 }, cible: { x: -999, y: -999, r: 1 }, murs: [], miroirs: [], blocs: [] };

// 1. Réflexion : miroir à 45° (« \ » à l'écran) renvoie un rayon horizontal vers le bas ; i = r
{
  const niv = { ...vide, miroirs: [{ id: 'm', x: 300, y: 250, len: 100, a0: 45 }] };
  const tr = M.tracer(niv, { angles: { m: 45 }, mats: {} });
  const d = dirFinale(tr);
  assert(Math.abs(d[0]) < 1e-9 && d[1] > 0.999, 'miroir à 45° : le rayon part vers le bas');
  assert(Math.abs(tr.evts[0].i - 45) < 1e-6, 'incidence 45°');
  // angle quelconque : l'angle de sortie par rapport à la normale vaut l'angle d'incidence
  for (const a of [20, 60, 100, 130]) {
    const t2 = M.tracer(niv, { angles: { m: a }, mats: {} });
    if (t2.evts.length) {
      const dOut = dirFinale(t2), n = [-Math.sin(rad(a)), Math.cos(rad(a))];
      const cosOut = Math.abs(dOut[0] * n[0] + dOut[1] * n[1]);
      assert(Math.abs(Math.acos(cosOut) * 180 / Math.PI - t2.evts[0].i) < 1e-6, `i = r pour un miroir à ${a}°`);
    }
  }
}

// 2. Réfraction : loi de Snell-Descartes à l'entrée d'une lame de verre, et sortie parallèle à l'entrée
{
  const niv = { ...vide, blocs: [{ id: 'b', type: 'lame', x: 300, y: 250, w: 150, h: 200, mat: 'verre' }] };
  for (const a of [10, 30, 50, 70]) {
    const tr = M.tracer(niv, { angles: { b: a }, mats: { b: 'verre' } });
    const [e1, e2] = tr.evts;
    assert(e1.type === 'refraction' && e1.entre && e2.type === 'refraction' && !e2.entre, 'entrée puis sortie');
    assert(Math.abs(Math.sin(rad(e1.i1)) - 1.5 * Math.sin(rad(e1.i2))) < 1e-9, `Snell-Descartes à ${a}°`);
    const d = dirFinale(tr);
    assert(Math.abs(d[0] - 1) < 1e-9 && Math.abs(d[1]) < 1e-9, `la lame à faces parallèles ne dévie pas (sortie parallèle), a = ${a}°`);
    assert(Math.abs(e2.i2 - e1.i1) < 1e-9, 'angle de sortie = angle d’entrée');
  }
}

// 3. Réflexion totale dans le prisme : verre (n = 1,50, angle limite 41,8°) et diamant oui, eau (48,8°) non, à 45°
{
  const niv = { ...vide, source: { x: 100, y: 280, a: 0 }, blocs: [{ id: 'b', type: 'prisme', c: 170, x: 330, y: 280, mat: 'verre' }] };
  const lim = m => Math.asin(1 / M.MATERIAUX[m].n) * 180 / Math.PI;
  assert(Math.abs(lim('verre') - 41.81) < 0.01 && Math.abs(lim('eau') - 48.75) < 0.01 && Math.abs(lim('diamant') - 24.4) < 0.05, 'angles limites');
  for (const [m, tot] of [['verre', true], ['diamant', true], ['eau', false]]) {
    const tr = M.tracer(niv, { angles: { b: 0 }, mats: { b: m } });
    const t = tr.evts.find(e => e.type === 'totale');
    assert(!!t === tot, `réflexion totale avec ${m} : ${tot}`);
    if (t) { assert(Math.abs(t.i - 45) < 1e-6 && t.i > t.limite, 'i = 45° > angle limite'); const d = dirFinale(tr); assert(d[1] < -0.999, 'le rayon repart vers le haut'); }
  }
}

// 4. Chaque niveau : non résolu au départ, et résoluble (recherche exhaustive au pas de 5°, puis robustesse au degré)
const solved = (niv, ang, mats) => M.tracer(niv, { angles: ang, mats }).atteint;
for (const niv of M.NIVEAUX) {
  const r0 = M.reglageInitial(niv);
  assert(!M.tracer(niv, r0).atteint, `niveau ${niv.id} : déjà résolu au départ`);
  const ids = [...niv.miroirs, ...niv.blocs].map(e => e.id);
  const matsListes = niv.blocs.some(b => b.choix) ? Object.keys(M.MATERIAUX) : [null];
  const sols = [];
  const rec = (k, ang, mat) => {
    if (k === ids.length) { const mats = {}; niv.blocs.forEach(b => { mats[b.id] = mat || b.mat; }); if (solved(niv, ang, mats)) sols.push({ ang: { ...ang }, mats }); return; }
    const id = ids[k], isMir = niv.miroirs.some(m => m.id === id), plage = isMir ? 180 : 360;
    for (let a = 0; a < plage; a += 5) { ang[id] = a; rec(k + 1, ang, mat); }
  };
  for (const mat of matsListes) rec(0, {}, mat);
  assert(sols.length > 0, `niveau ${niv.id} : aucune solution`);
  // aucun raccourci : dans toute solution, chaque miroir (et chaque bloc) doit servir
  const utilise = s => { const ev = M.tracer(niv, { angles: s.ang, mats: s.mats }).evts; return ids.every(id => ev.some(e => e.id === id)); };
  const raccourcis = sols.filter(s => !utilise(s));
  assert(raccourcis.length === 0, `niveau ${niv.id} : ${raccourcis.length} solutions avec un élément inutile, ex. ${JSON.stringify(raccourcis[0])}`);
  // largeur de la bande de solutions (en degrés, autour d'une solution) : la meilleure solution doit tolérer au moins 2° sur chaque élément (réglage au degré près, flèches du clavier incluses)
  const bande = (s, id) => { let n = 1; for (const sgn of [1, -1]) for (let k = 1; k < 40; k++) { const a = { ...s.ang, [id]: s.ang[id] + sgn * k }; if (solved(niv, a, s.mats)) n++; else break; } return n; };
  let meilleure = null, minMeilleure = -1;
  for (const s of sols.slice(0, 400)) { const larg = {}; let mn = 99; for (const id of ids) { larg[id] = bande(s, id); mn = Math.min(mn, larg[id]); } if (mn > minMeilleure) { minMeilleure = mn; meilleure = { s, larg }; } }
  console.log(`niveau ${niv.id} « ${niv.titre} » : ${sols.length} solutions (pas de 5°) ; meilleure bande (°) :`, JSON.stringify(meilleure.larg), JSON.stringify(meilleure.s.ang), JSON.stringify(meilleure.s.mats));
  assert(minMeilleure >= 2, `niveau ${niv.id} : même la meilleure solution est trop pointue (${minMeilleure}°)`);
}
console.log('OK');
