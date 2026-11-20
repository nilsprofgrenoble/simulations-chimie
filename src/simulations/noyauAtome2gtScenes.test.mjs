// Scènes de la simulation 202 rendues côté serveur : pour chaque élément (Z de 1 à 18), le nombre de particules dessinées
// (data-particule) vaut Z protons, A−Z neutrons, Z électrons ; chaque scène a un aria-label neutre (pas de chiffre de réponse).
// Usage : node src/simulations/noyauAtome2gtScenes.test.mjs
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../..', import.meta.url));
const srv = await createServer({ root: racine, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
let n = 0, ko = 0; const ok = (c, m) => { n++; if (!c) { ko++; console.log('✗', m); } };
try {
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const S = await srv.ssrLoadModule('/src/simulations/NoyauAtome2gtScenes.jsx');
  const M = await srv.ssrLoadModule('/src/simulations/noyauAtome2gtModele.js');
  const html = (C, p = {}) => renderToStaticMarkup(React.createElement(C, p));
  const cnt = (h, t) => (h.match(new RegExp(`data-particule="${t}"`, 'g')) || []).length;
  for (const e of M.ELEMENTS) {
    for (const vue of ['atome', 'zoom']) {
      const h = html(S.SceneExplore, { Z: e.Z, vue });
      ok(cnt(h, 'proton') === e.Z, `${e.s} ${vue} : protons ${cnt(h, 'proton')} ≠ ${e.Z}`);
      ok(cnt(h, 'neutron') === e.A - e.Z, `${e.s} ${vue} : neutrons ${cnt(h, 'neutron')} ≠ ${e.A - e.Z}`);
      if (vue === 'atome') ok(cnt(h, 'electron') === e.Z, `${e.s} : électrons ${cnt(h, 'electron')} ≠ ${e.Z}`);
    }
    for (const C of [S.SceneNoyau, S.SceneDefiNoyau, S.SceneDefiZax]) {
      let h; try { h = html(C, { Z: e.Z, nom: e.nom }); } catch (err) { ok(false, `${C.name} ${e.s} : ${err.message}`); continue; }
      ok(/role="img"/.test(h) && /aria-label="[^"]+"/.test(h), `${C.name} ${e.s} : role img + aria-label`);
    }
  }
  for (const C of [S.SceneEchelle, S.SceneAtomeNoyau, S.SceneBille, S.SceneMasses, S.SceneMasseAtome, S.SceneCharges, S.SceneAtomeNeutre, S.SceneLireZax, S.SceneBilan]) {
    const h = html(C); const al = (h.match(/aria-label="([^"]*)"/) || [])[1] || '';
    ok(h.includes('<svg') && al.length > 10, `${C.name} : svg et aria-label`);
    ok(!/NaN|undefined/.test(h), `${C.name} : NaN/undefined dans le rendu`);
    console.log(C.name.padEnd(18), al);
  }
} finally { await srv.close(); }
console.log(ko ? `${ko} échec(s)` : `Tout est correct (${n} contrôles)`); process.exit(ko ? 1 : 0);
