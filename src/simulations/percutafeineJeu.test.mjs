// Test : node src/simulations/percutafeineJeu.test.mjs — cohérence chimique et intégrité du graphe de « Contre-typage de la Percutaféine »
import assert from 'node:assert';
import * as J from './percutafeineJeu.js';

// 1. Données de référence cohérentes avec le TP
assert(Math.abs(J.ETH_PUR_COM - 38.4) < 1e-9, '4 g d\'éthanol à 96 % pour 10 g de gel = 38,4 % d\'éthanol pur');
assert(Math.abs(J.ES_COM - 10.65) < 1e-9, 'extrait sec théorique du commercial : 10,65 %');
assert(Math.abs(J.FORMULE_REPLI.eth96 * 0.96 / 200 * 100 - 38.4) < 1e-9, 'la formule de repli donne 38,4 % d\'éthanol pur');
const eRepli = J.etatInitial(7); eRepli.f.fm = J.FORMULE_REPLI; eRepli.f.trolAdd = 1.8; eRepli.f.disp = 'continuer'; eRepli.f.perteEth = 0.01; eRepli.f.mode = 'reflux';
const gRef = J.gelVrai(eRepli);
assert(Math.abs(gRef.caf - 5.0) < 0.1 && gRef.eth > 37.5 && gRef.eth < 38.5, `gel de référence : caféine ${gRef.caf}, éthanol ${gRef.eth}`);
assert(J.phDe(eRepli, 1.8) > 5.5 && J.phDe(eRepli, 1.8) < 6.2, 'avec ≈ 1,8 g de trolamine, le pH est voisin de 6');
assert(J.phDe(eRepli, 0) < 3.5 && J.phDe(eRepli, 0.5) < 5.0, 'peu de base : le gel est acide');
assert(J.defauts(eRepli).length === 0, 'le gel de référence respecte le cahier des charges');
const eOuvert = { ...eRepli, f: { ...eRepli.f, perteEth: 0.18, mode: 'becher' } };
assert(J.defauts(eOuvert).includes('eth'), 'un bécher chauffé à l\'air libre fait perdre trop d\'éthanol');
const eGrum = { ...eRepli, f: { ...eRepli.f, disp: 'grumeaux' } };
assert(J.defauts(eGrum).includes('visco'), 'des grumeaux donnent un gel trop fluide');
// l'effet de matrice UV : l'étalonnage externe surestime d'environ 38 %
const dUv = J.donneesUv(eRepli);
assert(dUv.pctExt > dUv.pctAjouts * 1.25 && Math.abs(dUv.pctAjouts - gRef.caf) < 0.4, `ajouts dosés ${dUv.pctAjouts}, externe ${dUv.pctExt}`);
// la CLHP à l'étalon interne et le CPG redonnent le gel
assert(Math.abs(J.donneesHplc(eRepli).pct - gRef.caf) < 0.2, 'CLHP : caféine');
const dC = J.donneesCpg(eRepli);
assert(Math.abs(dC.pctGamme - gRef.eth) < 4 && Math.abs(dC.pctSimple - gRef.eth) < 6, `CPG : gamme ${dC.pctGamme}, simple ${dC.pctSimple}`);
assert(dC.r2 > 0.99, 'R² de la gamme CPG');
// l'extrait sec : écart de deux essais le plus souvent sous 2,8 S_r
let ok = 0; for (let g = 1; g <= 400; g++) if (J.ecartEs({ f: { graine: g } }) <= 1.4) ok++;
assert(ok / 400 > 0.9 && ok / 400 < 1, `écart ES compatible dans ${ok / 4} % des parties`);

// 2. Un agent expert : doit toujours conclure « conforme » dans les temps
const REPONSE = { 3: 0 };
function joue(strat, graine) {
  let e = J.etatInitial(graine), pas = 0;
  const calculsVus = new Set();
  while (!J.estFin(e.scene) && pas++ < 400) {
    const sc = J.SCENES[e.scene];
    if (sc.station === 'formule') {
      const r = strat.formule(e);
      e = r.etat; continue;
    }
    if (sc.station === 'ph') { e = strat.ph(e); continue; }
    if (sc.station === 'obs') { e = J.noterObs(e, strat.obs ? strat.obs(e) : ['blanc', 'cristaux', 'fins']); continue; }
    if (sc.calcul) { calculsVus.add(e.scene); const r = J.valider(e, strat.calc(e, sc.calcul)); e = r.etat; continue; }
    const ch = J.choixDe(e);
    assert(ch.length, `scène sans choix : ${e.scene}`);
    e = J.choisir(e, strat.choix(e, ch));
  }
  assert(pas < 400, `partie sans fin (scène ${e.scene})`);
  return { e, calculsVus };
}
const valid = { caf: 10, carb: 1.5, coc: 8.0, eth96: 80, trol: 1.8, eau: 98.7 };
// formule d'un élève qui déduit le cocoate de l'extrait sec mesuré (ES − 5 − 0,75 − 0,9, en % puis en g pour 200 g)
const formuleDe = e => { const coc = Math.max(2, (J.esRetenu(e) - 6.65) * 2), f = { caf: 10, carb: 1.5, coc, eth96: 80, trol: 1.8, eau: 0 }; f.eau = 200 - (f.caf + f.carb + f.coc + f.eth96 + f.trol); return f; };
const expert = {
  formule: e => J.validerFormule(e, formuleDe(e)),
  ph: e => { let n = e; for (let i = 0; i < 12 && (J.phDe(n, n.f.trolAdd || 0) < 5.6); i++) n = J.ajouterBase(n, 0.3); const r = J.validerPh(n); assert(r.ok, 'pH validé'); return r.etat; },
  calc: (e, k) => J.nf(k.vrai(e), k.cs ?? 2),   // réponse arrondie comme affichée : doit être acceptée
  choix: (e, ch) => {
    if (e.scene === 'hub') { const ordre = ['es_prep', 'eth1', 'hplc_m', 'cpg_ei', 'rheoC', 'es_calc1', 'formule', 'eq_base', 'fab_choix', 'fab_disp', 'rheoF', 'uv_ajouts', 'uv_ext', 'hplc_ei', 'cpg_inj', 'eq_ines', 'verdict'];
      return [...ch].sort((a, b) => ordre.indexOf(a.vers) - ordre.indexOf(b.vers)).find(c => ordre.includes(c.vers)) || ch[0]; }
    if (e.scene === 'es_prep') return ch[0];
    if (e.scene === 'es_calc2') return J.ecartEs(e) <= 1.4 ? ch[0] : ch[1];
    if (e.scene === 'hplc_inj') return ch[0];
    if (e.scene === 'hplc_panne') return ch[0];
    if (e.scene === 'cpg_ei') return ch[1];
    if (e.scene === 'cpg_comp') return ch[0];
    if (e.scene.startsWith('eq_')) return ch.find(c => c.tag === 'ok');
    if (e.scene === 'cause') return ch.find(c => c.f.causeJuste);
    if (e.scene === 'avis') return ch[0];
    if (e.scene === 'fab_choix' || e.scene === 'fab_disp') return ch[0];
    if (e.scene === 'rheoC') return ch[0];
    if (e.scene === 'rheoF') return ch.find(c => !c.f.errRheo2);
    if (e.scene === 'verdict') { const D = J.defauts(e); return ch[D.length ? 1 + ['caf', 'eth', 'visco'].indexOf(D[0]) : 0]; }
    return ch[0];
  },
};
const fins = {}, temps = [], pannes = [0, 0], attentes = [];
for (let g = 1; g <= 400; g++) {
  const { e } = joue(expert, g * 7919);
  fins[e.scene] = (fins[e.scene] || 0) + 1; temps.push(e.t); attentes.push(e.f.attente); pannes[e.f.panne ? 1 : 0]++;
}
const tMoy = temps.reduce((s, x) => s + x, 0) / temps.length;
console.log("expert :", fins, `durée moyenne ${tMoy.toFixed(0)} min`, `max ${Math.max(...temps)}`, "pannes", pannes, `attente moyenne ${(attentes.reduce((s, x) => s + x, 0) / attentes.length).toFixed(0)} min`);
assert((fins.fin_conforme || 0) >= 380, `l'expert doit conclure « conforme » (${fins.fin_conforme} / 400)`);
assert(Math.max(...temps) < J.T_FIN, 'l\'expert finit dans les temps');
assert(pannes[1] > 150 && pannes[0] > 100, 'la panne de CLHP survient dans une partie sur deux environ');

// 3. Parcours aléatoires : toujours une fin, toutes les fins atteignables
let graine = 12345; const rnd = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
const aleatoire = {
  formule: e => rnd() < 0.5 ? J.validerFormule(e, formuleDe(e)) : (e.f.fTent || 0) >= 2 ? J.validerFormule(e, valid, true) : J.validerFormule(e, { caf: 11, carb: 3, coc: 2, eth96: 60, trol: 1, eau: 100 }),
  ph: e => { let n = e; const k = Math.floor(rnd() * 8); for (let i = 0; i < k; i++) n = J.ajouterBase(n, 0.3); const r = J.validerPh(n); if (r.ok) return r.etat; n = J.ajouterBase(n, 0.5); for (let i = 0; i < 12 && J.phDe(n, n.f.trolAdd) < 5.0; i++) n = J.ajouterBase(n, 0.3); const r2 = J.validerPh(n); assert(r2.ok); return r2.etat; },
  calc: (e, k) => rnd() < 0.6 ? J.nf(k.vrai(e), k.cs ?? 2) : String(Math.round(rnd() * 100)),
  choix: (e, ch) => ch[Math.floor(rnd() * ch.length)],
};
const finsA = {}, scenesVues = new Set();
for (let g = 0; g < 4000; g++) {
  const { e } = joue(aleatoire, g * 104729 + 1);
  finsA[e.scene] = (finsA[e.scene] || 0) + 1;
  const b = J.bilan(e, e.scene); assert(b.length === 6 && b.every(x => ['ok', 'moyen', 'ko', 'nd'].includes(x.niveau)), 'bilan');
  assert(J.resume(e).length >= 2);
}
console.log('aléatoire :', finsA);
for (const [id] of J.FINS) assert(finsA[id] > 0, `fin jamais atteinte par les parcours aléatoires : ${id}`);

// 4. Intégrité du graphe : toute scène référencée existe, texte et choix évalués sans erreur
const e0 = J.etatInitial(42);
for (const [id, sc] of Object.entries(J.SCENES)) {
  const e = { ...e0, scene: id, fait: { es: true, eth: true, esRes: true, formule: true, fab: true, ph: true, rheoC: true }, f: { ...e0.f, fm: J.FORMULE_REPLI, trolAdd: 1.8, perteEth: 0.01, disp: 'continuer', mode: 'reflux', methCaf: 'EI', es2: true } };
  assert(typeof J.texteDe(e, sc) === 'string', `texte de ${id}`);
  J.visuelsDe(e, sc);
  for (const c of J.choixDe(e, sc)) { if (typeof c.vers === 'string') assert(J.SCENES[c.vers], `${id} → ${c.vers}`); else assert(J.SCENES[c.vers(J.choisir ? { ...e, f: { ...e.f } } : e)], `${id} → vers calculé`); }
  if (sc.calcul) for (const k of [sc.calcul.ok, sc.calcul.ko]) assert(typeof k.vers === 'function' ? J.SCENES[k.vers(e)] : J.SCENES[k.vers], `${id} calcul → ?`);
}
console.log('OK : scènes', Object.keys(J.SCENES).length);

// 4. Conséquence réelle du procédé : sans reflux, l'éthanol manque ; la cause « fabrication » est la bonne, et seulement elle
const expBecher = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch[1] : e.scene === 'avis' ? ch[ch.length - 1] : expert.choix(e, ch) };
let nDet = 0, nB = 0;
for (let g = 1; g <= 100; g++) {
  const { e } = joue(expBecher, g * 6571);
  nB++; if (e.scene === 'fin_detecte' && e.f.decl === 'eth') nDet++;
  assert(J.defauts(e).includes('eth'), 'le bécher ouvert fait manquer de l\'éthanol');
}
assert(nDet === nB, `bécher ouvert, bon diagnostic et bonne cause : ${nDet}/${nB}`);
// l'élève qui accuse la mauvaise cause n'obtient pas la fin « détecte »
{ let e = joue(expBecher, 99).e; assert(e.scene === 'fin_detecte'); }
const expMauvaise = { ...expBecher, choix: (e, ch) => e.scene === 'cause' ? ch.find(c => !c.f.causeJuste) : expBecher.choix(e, ch) };
assert(joue(expMauvaise, 99).e.scene === 'fin_mauvaise_cause', 'mauvaise cause → fin_mauvaise_cause');
// froid : long mais sans défaut ; conseils de collègues : bilan C.7.3
const expFroid = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch[2] : expert.choix(e, ch) };
{ const r = joue(expFroid, 5).e; assert(!J.defauts(r).includes('eth'), 'à froid : éthanol conforme'); }
{ const r = joue(expert, 5).e; assert(J.bilan(r)[5].niveau === 'ok', 'C.7.3 ok pour un échange respectueux'); }
const expSec = { ...expert, choix: (e, ch) => e.scene.startsWith('eq_') ? ch.find(c => c.tag === 'ko') : expert.choix(e, ch) };
{ const r = joue(expSec, 5).e; assert(J.bilan(r)[5].niveau === 'ko', 'C.7.3 ko pour des échanges secs'); }
const expPassif = { ...expert, choix: (e, ch) => e.scene === 'eq_base' ? ch.find(c => c.tag === 'moyen') : expert.choix(e, ch) };
{ const r = joue(expPassif, 5).e; assert(r.f.mode === 'base' || r.f.errBase, 'conseil faux suivi : grumeaux'); }
console.log('conséquences et C.7.3 : OK');

// 5. Remédiation : le bécher ouvert se rattrape en compensant l'éthanol, un pH trop bas en reprenant la trolamine
const expCompense = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch[1] : expert.choix(e, ch) };
for (let g = 1; g <= 60; g++) { const { e } = joue(expCompense, g * 3571); assert(e.f.compense && e.scene === 'fin_conforme', `compensation → conforme (${e.scene})`); assert(e.t < J.T_FIN, 'compensation dans les temps'); }
const expPhBas = { ...expert, ph: e => { let n = J.ajouterBase(e, 0.3); const r = J.validerPh(n); assert(r.ok); return r.etat; } };
let nPh = 0; for (let g = 1; g <= 60; g++) { const r = joue({ ...expPhBas, ph: e => e.scene === 'ph2' ? expert.ph(e) : expPhBas.ph(e) }, g * 977).e; if (r.f.reprisePh) { nPh++; assert(r.scene === 'fin_conforme', `pH repris → conforme (${r.scene})`); } }
assert(nPh > 50, `pH bas repris avec Lucas (${nPh}/60)`);
// la formule n'est jamais jugée : une formule pauvre en macrogol est acceptée telle quelle
{ const e0 = J.etatInitial(3); const r = J.validerFormule(e0, { caf: 10, carb: 1.5, coc: 2, eth96: 80, trol: 1.8, eau: 104.7 }); assert(r.ok && r.lignes.length === 0, 'formule non jugée'); }
{ const e0 = J.etatInitial(3); const r1 = J.validerFormule(e0, { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 190 }); assert(!r1.ok && r1.lignes.length === 1, 'somme signalée'); assert(J.validerFormule(r1.etat, { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 190 }).ok, 'puis acceptée'); }
// observation vidéo : notée dans le cahier, sans verdict
{ const e0 = J.etatInitial(3); const e1 = J.noterObs({ ...e0, scene: 'obs_video' }, ['blanc', 'cristaux']); assert(e1.fait.obs && e1.carnet.some(l => l.includes('cristaux')), 'observation notée'); }
console.log('remédiations : OK');
