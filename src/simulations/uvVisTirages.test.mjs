// Tirages des exercices « uvv- » : relit le texte AFFICHÉ, refait le calcul, compare à la réponse attendue (3 000 tirages) ;
// vérifie pièges hors tolérance, tolérances au pire cas d'arrondi, longueur des options de QCM (parcours + ANA + VAL + libellés S'APP).
// Usage : node src/simulations/uvVisTirages.test.mjs   (charge les banques .jsx via le serveur de Vite en mode SSR)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); srv.close().then(() => process.exit(1)); throw new Error(m); } };
try {
  const R = await srv.ssrLoadModule('/src/simulations/AtelierRealiserBanque.jsx');
  const A = await srv.ssrLoadModule('/src/simulations/AtelierAnalyserBanque.js');
  const V = await srv.ssrLoadModule('/src/simulations/AtelierValiderBanque.js');
  const D = await srv.ssrLoadModule('/src/simulations/AtelierDonneesBanque.js');
  const Q = await srv.ssrLoadModule('/src/simulations/uvVisQcm.js');
  const fam = R.FAMILLES.find(f => f.id === 'uvv-calcul');
  const txt = x => x == null || x === false ? '' : typeof x === 'string' || typeof x === 'number' ? String(x) : Array.isArray(x) ? x.map(txt).join('') : x.props ? txt(x.props.children) : '';
  const num = s => Number(String(s).replace(/\s| /g, '').replace(',', '.'));
  const SUPI = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
  const sci = (m, e) => num(m) * Math.pow(10, Number([...e].map(c => SUPI[c]).join('')));
  const re = {
    A: /A = ([\d,]+)/, l: /([\d,]+) cm/, eps: /ε = ([\d,]+)×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, c: /c = ([\d,]+) µmol\/L/, F: /diluée? (\d+) fois/, M: /M = (\d+) g\/mol/,
  };
  const r2 = x => Number(x.toPrecision(2)), r3 = x => Number(x.toPrecision(3));
  let pireTol = 0;
  for (let t = 0; t < 3000; t++) {
    const e = fam.gen(), [q1, q2, q3, q4, q5] = e.questions, T = e.questions.map(q => txt(q.q).replace(/[\u00a0\u202f]/g, ' '));
    ok(e.questions.length === 5 && T.every(s => !/_|\^|\//.test(s.replace(/mol\/L|mg\/L|g\/mol|g\/L|\/L|µmol\/L/g, ''))), 'texte affiché : pas de « _ », « ^ » ni « / » (hors unités)');
    // 1 : c = A/(ε l)
    let A_ = num(T[0].match(re.A)[1]), l_ = num(T[0].match(/([\d,]+) cm/)[1]), m = T[0].match(re.eps), e_ = sci(m[1], m[2]);
    ok(Math.abs(A_ / (e_ * l_) * 1e6 - q1.vrai) < 1e-9 * q1.vrai, `q1 : ${T[0]}`);
    // 2 : A = ε l c
    const c2 = num(T[1].match(/c = ([\d,]+) µmol/)[1]); l_ = num(T[1].match(/([\d,]+) cm/)[1]); m = T[1].match(re.eps); e_ = sci(m[1], m[2]);
    ok(Math.abs(e_ * l_ * c2 * 1e-6 - q2.vrai) < 1e-9 * q2.vrai && q2.vrai <= 1.3 && q2.vrai >= 0.2, `q2 : ${T[1]} (A = ${q2.vrai})`);
    // 3 : c = F A/(ε l)
    const F3 = num(T[2].match(/diluée (\d+) fois/)[1]); A_ = num(T[2].match(re.A)[1]); l_ = num(T[2].match(/cuve de ([\d,]+) cm/)[1]); m = T[2].match(re.eps); e_ = sci(m[1], m[2]);
    ok(Math.abs(F3 * A_ / (e_ * l_) * 1e6 - q3.vrai) < 1e-9 * q3.vrai, `q3 : ${T[2]}`);
    // 4 : ε = A/(l c), A dans le domaine de validité
    const c4 = num(T[3].match(/c = ([\d,]+) µmol/)[1]); l_ = num(T[3].match(/cuve de ([\d,]+) cm/)[1]); A_ = num(T[3].match(re.A)[1]);
    ok(Math.abs(A_ / (l_ * c4 * 1e-6) - q4.vrai) < 1e-9 * q4.vrai && A_ >= 0.1 && A_ <= 1.2, `q4 : ${T[3]}`);
    // 5 : c massique = F A M/(ε l)
    const F5 = num(T[4].match(/diluée (\d+) fois/)[1]); A_ = num(T[4].match(re.A)[1]); const M5 = num(T[4].match(re.M)[1]); m = T[4].match(re.eps); e_ = sci(m[1], m[2]);
    ok(Math.abs(F5 * A_ * M5 * 1e3 / e_ - q5.vrai) < 1e-9 * q5.vrai, `q5 : ${T[4]}`);
    // pièges hors de 1,5 × tolérance ; tolérances : arrondi à 2 chiffres (et un intermédiaire à 3 chiffres pour les chaînes) dans la tolérance
    for (const q of e.questions) {
      ok(q.tolRel >= 0.05 && q.pieges.length >= 2, `${q.id} : tolérance ≥ 5 % et au moins 2 pièges (${q.pieges.length})`);
      for (const [v] of q.pieges) ok(isFinite(v) && Math.abs(v - q.vrai) / q.vrai > 1.5 * q.tolRel, `${q.id} : piège ${v} trop proche de ${q.vrai}`);
      const arr = Math.abs(r2(q.vrai) - q.vrai) / q.vrai; pireTol = Math.max(pireTol, arr); ok(arr <= q.tolRel, `${q.id} : arrondi à 2 chiffres hors tolérance`);
    }
        const chain3 = r2(r3(num(T[2].match(re.A)[1]) / (sci(...T[2].match(re.eps).slice(1, 3)) * num(T[2].match(/cuve de ([\d,]+) cm/)[1])) * 1e6) * F3);
    ok(Math.abs(chain3 - q3.vrai) / q3.vrai <= q3.tolRel, 'q3 : chaîne arrondie hors tolérance');
  }
  // S'APP : les deux variantes se construisent, les données utiles sont dans le texte, la solution est cohérente
  const sapp = D.ENONCES.find(x => x.id === 'uvv-sapp-dosage');
  for (let t = 0; t < 2000; t++) {
    const p = sapp.gen();
    for (const q of [0, 1]) {
      const b = sapp.build(p, q), cp = p.A / (p.col.eps * p.l) * 1e6;
      ok(b.utiles.every(u => b.tokens[u] && b.texte.some(x => x && x.t === u)), `S'APP q${q} : données utiles citées dans l’énoncé`);
      ok(Math.abs(b.solution.val - (q === 0 ? cp : cp * p.F)) < 1e-9 * cp * 20, 'S\'APP : solution');
      ok(b.cherche.bonne && b.cherche.faux.length === 3 && p.A <= 1.0, 'S\'APP : grandeur cherchée et A dans le domaine');
    }
  }
  // QCM : la bonne réponse n'est jamais la plus longue ; elle n'est pas systématiquement la plus courte (texte rendu, indices et fractions aplatis)
  const rendu = s => String(s).replace(/frac\(([^|]*)\|([^)]*)\)/g, (_, a, b) => (a.length > b.length ? a : b)).replace(/_/g, '');
  const lots = [];
  for (const [k, v] of Object.entries(Q.QCM_PARCOURS)) lots.push([`parcours.${k}`, v.options.map(rendu), v.bonne]);
  for (const x of A.PROBLEMES ? [] : []) void x;
  for (const x of A.default ?? []) void x;
  const anaListe = Object.values(A).filter(Array.isArray).flat().filter(x => x && typeof x.id === 'string' && x.id.startsWith('uvv-') && x.options);
  for (const x of anaListe) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  for (const x of V.PLAUSIBLES.filter(y => y.id.startsWith('uvv-'))) lots.push([x.id, x.options.map(o => rendu(o[0])), x.options.findIndex(o => o[1])]);
  let courtes = 0; const mauvais = [];
  for (const [nom, opts, b] of lots) {
    const L = opts.map(o => o.length), max = Math.max(...L), min = Math.min(...L);
    if (!(L[b] < max)) mauvais.push(`${nom} : la bonne réponse est la plus longue (${L.join(', ')}, bonne = ${b})`);
    if (!(max - min <= 40 || max / min < 1.7)) mauvais.push(`${nom} : options déséquilibrées (${L.join(', ')})`);
    if (L[b] === min && nom !== 'parcours.identifier') {   // exception : noms propres, longueur imposée par le nom du colorant
      courtes++; mauvais.push(`${nom} : bonne réponse la plus courte (${L.join(', ')}, bonne = ${b})`); }
  }
  ok(mauvais.length === 0, '\n' + mauvais.join('\n'));
  console.log(`  ${lots.length} QCM contrôlés (parcours + ANA + VAL) ; bonne réponse la plus courte dans ${courtes} cas`);
  console.log('  QCM libellés S\'APP : « cherche.bonne » vs « faux » (longueurs)', ['0', '1'].map(q => { const b = sapp.build(sapp.gen(), Number(q)); return [b.cherche.bonne, ...b.cherche.faux].map(s => s.length).join('/'); }).join(' | '));
  console.log(`OK uvVisTirages : ${n} contrôles ; pire arrondi à 2 chiffres : ${(pireTol * 100).toFixed(2)} %`);
} finally { await srv.close(); }
