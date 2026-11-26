// Tirages des exercices « rpm- » : tolérances, pièges, texte, longueur des options de QCM.
// Usage : node src/simulations/radPcmTirages.test.mjs
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const E = await srv.ssrLoadModule('/src/simulations/radPcmExos.js');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  for (const id of ['rpm-loi', 'rpm-act']) {
    const fam = R.FAMILLES.find(f => f.id === id);
    let pire = 0;
    for (let t = 0; t < 4000; t++) {
      const e = fam.gen();
      ok(e.questions.length === 3, 'trois questions');
      const T = [e.intro, ...e.questions.map(q => txt(q.q)), ...e.questions.map(q => txt(q.expl)), ...e.questions.flatMap(q => [q.aide, ...q.pieges.map(p => p[1])])].join(' ');
      ok(!/_|\^|NaN|Infinity|undefined/.test(T), 'texte propre : ' + T.slice(0, 120));
      const vals = e.questions.map(q => Number(q.vrai.toPrecision(2)));
      ok(new Set(vals).size === 3, 'réponses distinctes');
      for (const q of e.questions) {
        ok(isFinite(q.vrai) && q.vrai > 0, `${q.id} : vrai > 0`);
        ok(q.tolRel >= 0.03 && q.pieges.length >= 2, `${q.id} : tolérance/pièges`);
        const arr = Math.abs(Number(q.vrai.toPrecision(2)) - q.vrai) / q.vrai; pire = Math.max(pire, arr);
        ok(arr <= q.tolRel + 1e-12 || arr <= 0.05, `${q.id} : arrondi à 2 chiffres hors tolérance (${arr}, tol ${q.tolRel})`);
        for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / q.vrai > 1.5 * q.tolRel, `${q.id} : piège ${v} trop proche de ${q.vrai} (${e.intro})`);
      }
    }
    console.log(id, 'pire arrondi 2 chiffres', pire.toFixed(4));
  }
  const rendu = s => String(s).replace(/<[^>]+>/g, '');
  const lots = [];
  for (const x of [...E.RPM_ANA, ...E.RPM_VAL]) {
    const opts = x.options.map(o => rendu(o[0])), b = x.options.findIndex(o => o[1]);
    lots.push([x.id, opts, b]);
  }
  const Q = await srv.ssrLoadModule('/src/simulations/radPcmQcm.js');
  const Qm = Q.QCM_RPM || Q.default || Object.fromEntries(Object.entries(Q).filter(([, v]) => v && v.options));
  for (const [k, v] of Object.entries(Qm)) if (v && v.options) lots.push([`parcours.${k}`, v.options.map(o => rendu(Array.isArray(o) ? o[0] : o)), v.bonne ?? 0]);
  let mal = [];
  for (const [nom, opts, b] of lots) { const L = opts.map(o => o.length); if (!(L[b] < Math.max(...L))) mal.push(`${nom} : bonne plus longue (${L.join(',')} / ${b})`); ok(new Set(opts).size === opts.length, nom + ' doublon'); ok(opts.filter((_, i) => i === b).length === 1, nom); }
  console.log(lots.length, 'QCM contrôlés ; bonne réponse la plus longue :', mal.length ? '\n' + mal.join('\n') : 'aucune');
  console.log('OK', n, 'vérifications');
} finally { await srv.close(); }
