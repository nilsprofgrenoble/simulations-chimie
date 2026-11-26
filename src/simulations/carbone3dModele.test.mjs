// Test du modèle de la vue 3D d'un carbone : node src/simulations/carbone3dModele.test.mjs
import assert from 'node:assert';
import * as M from './chiraliteModele.js';
import * as V from './carbone3dModele.js';

let n = 0;
const ok = (c, msg) => { n++; assert(c, msg); };

// rotation aléatoire reproductible
let graine = 12345;
const alea = () => { graine = (graine * 1664525 + 1013904223) % 4294967296; return graine / 4294967296; };
const rotAlea = () => {
  const u = [alea() - 0.5, alea() - 0.5, alea() - 0.5]; const l = Math.hypot(...u); const a = alea() * 2 * Math.PI;
  const [x, y, z] = u.map(t => t / l), c = Math.cos(a), s = Math.sin(a), k = 1 - c;
  return [[c + x * x * k, x * y * k - z * s, x * z * k + y * s], [y * x * k + z * s, c + y * y * k, y * z * k - x * s], [z * x * k - y * s, z * y * k + x * s, c + z * z * k]];
};

let nVueAxe = 0, nAleatoire = 0, nDevant = 0;
for (const m of M.CATALOGUE) {
  for (const c of M.centresAsym(m)) {
    for (const orient of ['bas', 'haut']) {
      for (const aff of M.toutesLesAff(m, c, orient)) {
        const conf = M.configuration(m.g, c, aff);
        // 1. vue dans l'axe : n°4 exactement derrière, lettre lue = lettre calculée par le produit mixte
        const R = V.matriceVueAxe(m.g, c, aff);
        const l = V.lecture(m.g, c, aff, R);
        ok(l.derriere, `${m.id}: n°4 derrière dans la vue dans l'axe`);
        ok(Math.abs(l.z4 + 1) < 1e-9, `${m.id}: n°4 exactement derrière (z = −1)`);
        ok(l.lettre === conf, `${m.id} ${conf}: lettre lue dans l'axe = ${l.lettre}`);
        ok(l.sens === M.sensDansLAxe(m.g, c, aff), `${m.id}: sens identique à sensDansLAxe`);
        nVueAxe++;
      }
      // 2. orientations quelconques : si le n°4 est derrière, la lettre lue est toujours la bonne ; sinon, la lecture est à l'envers
      for (let k = 0; k < 40; k++) {
        const aff = M.toutesLesAff(m, c, orient)[Math.floor(alea() * 24)];
        const conf = M.configuration(m.g, c, aff);
        const l = V.lecture(m.g, c, aff, rotAlea());
        if (l.derriere) { ok(l.lettre === conf, `${m.id}: rotation aléatoire, n°4 derrière, lettre ${l.lettre} ≠ ${conf}`); nAleatoire++; }
        else if (l.z4 > 0.02) { ok((l.sens === 'horaire' ? 'R' : 'S') === M.inverse(conf), `${m.id}: n°4 devant, le sens lu donne la lettre inverse`); nDevant++; }
      }
      // 3. flèche 1 → 2 → 3 : deux arcs consécutifs, tournant dans le sens de la lecture, dont les extrémités sont alignées sur les groupes 1, 2, 3
      const aff = M.toutesLesAff(m, c, orient)[3];
      const f = V.fleche123(m.g, c, aff);
      ok(f && f.arcs.length === 2, 'deux arcs');
      ok(Math.hypot(...f.arcs[0][f.arcs[0].length - 1].map((x, i) => x - f.arcs[1][0][i])) < 1e-9, 'les deux arcs se raccordent');
      const R = V.matriceVueAxe(m.g, c, aff);
      const proj = p => M.projeter(R, p);
      const a0 = proj(f.arcs[0][0]), a1 = proj(f.arcs[0][f.arcs[0].length - 1]), a2 = proj(f.arcs[1][f.arcs[1].length - 1]);
      const aire = (a1[0] - a0[0]) * (a2[1] - a0[1]) - (a2[0] - a0[0]) * (a1[1] - a0[1]);
      ok((aire < 0 ? 'horaire' : 'antihoraire') === M.sensDansLAxe(m.g, c, aff), `${m.id}: la flèche tourne dans le sens de la lecture`);
      ok(proj(f.axe)[2] > 0.999, 'l\'axe de la flèche pointe vers l\'observateur dans la vue dans l\'axe');
    }
  }
}
// carbone non asymétrique : pas de lecture
const prop = M.parId('propan2ol');
ok(V.lecture(prop.g, prop.centres[0], M.toutesLesAff(prop, prop.centres[0])[0], [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) === null, 'propan-2-ol : pas de lecture R/S');
ok(V.fleche123(prop.g, prop.centres[0], M.toutesLesAff(prop, prop.centres[0])[0]) === null, 'propan-2-ol : pas de flèche');
ok(nVueAxe > 100 && nAleatoire > 500 && nDevant > 100, `couverture : ${nVueAxe} vues dans l'axe, ${nAleatoire} rotations n°4 derrière, ${nDevant} n°4 devant`);
console.log(`carbone3dModele : ${n} vérifications OK (${nVueAxe} vues dans l'axe, ${nAleatoire} rotations aléatoires avec n°4 derrière, ${nDevant} avec n°4 devant)`);
