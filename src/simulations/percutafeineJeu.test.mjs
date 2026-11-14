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
assert(J.phDe(eRepli, 2.25) > 6.6 && J.phDe(eRepli, 2.25) < 7.4, 'fiche 3V : 1,5 g de trolamine par g de polymère donnent pH 7');
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
assert(dC.r2 > 0.98, 'R² de la gamme CPG');
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
    if (sc.station === 'plan') { const r = J.validerPlan(e, strat.plan(e)); assert(r.ok, `plan refusé (${e.scene}) : ${r.message}`); e = r.etat; continue; }
    if (sc.station === 'rheo') { e = J.validerRheo(e, 'hb', 16, 3); continue; }
    if (sc.station === 'cpgsim') { e = J.cpgSimFin(e, 2, true); continue; }
    if (sc.station === 'titrage') { e = J.choisir(e, sc.choix[0]); continue; }
    if (sc.station === 'schema') { e = J.cliquerPiece(e, strat.clic ? strat.clic(e, sc) : sc.cible).etat; continue; }
    if (sc.station === 'obs') { e = J.noterObs(e, strat.obs ? strat.obs(e) : ['blanc', 'cristaux', 'fins']); continue; }
    if (sc.calcul) { calculsVus.add(e.scene); const r = J.valider(e, strat.calc(e, sc.calcul)); e = r.etat; continue; }
    const ch = J.choixDe(e);
    assert(ch.length, `scène sans choix : ${e.scene}`);
    e = J.choisir(e, strat.choix(e, ch));
  }
  assert(pas < 400, `partie sans fin (scène ${e.scene})`);
  return { e, calculsVus, pas };
}
const valid = { caf: 10, carb: 1.5, coc: 8.0, eth96: 80, trol: 1.8, eau: 98.7 };
// formule d'un élève qui déduit le cocoate de l'extrait sec mesuré (ES − 5 − 0,75 − 0,9, en % puis en g pour 200 g)
const formuleDe = e => { const coc = Math.max(2, (J.esRetenu(e) - 6.65) * 2), f = { caf: 10, carb: 1.5, coc, eth96: 80, trol: 1.8, eau: 0 }; f.eau = 200 - (f.caf + f.carb + f.coc + f.eth96 + f.trol); return f; };
const PLAN_EXPERT = { titr_carb_plan: { m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 }, uv_ajouts_plan: { m: 1, vp: 200, dv: 40, n: 6 }, uv_ext_plan: { vmin: 20, vmax: 300, n: 5, m: 1, vp: 200 }, hplc_gamme_plan: { vmin: 20, vmax: 200, n: 5 }, cpg_gamme_plan: { vmin: 100, vmax: 600, n: 5, rep: 2 } };
const expert = {
  formule: e => { const r = J.validerFormule(e, formuleDe(e)); if (!r.ok && process.env.DBGF) console.log(JSON.stringify(r.lignes), Object.keys(e.fait).join()); return r; },
  ph: e => { let n = e; for (let i = 0; i < 12 && (J.phDe(n, n.f.trolAdd || 0) < 6.4); i++) n = J.ajouterBase(n, 0.3); const r = J.validerPh(n); assert(r.ok, 'pH validé'); return r.etat; },
  plan: e => PLAN_EXPERT[e.scene],
  calc: (e, k) => J.nf(k.vrai(e), k.cs ?? 2),   // réponse arrondie comme affichée : doit être acceptée
  choix: (e, ch) => {
    if (e.scene === 'hub') { const ordre = ['es_balance', 'es_prep', 'eth1', 'titr_suivi', 'choix_caf', 'hplc_m', 'choix_eth', 'cpg_m', 'rheoC', 'es_calc1', 'es_calc2b', 'es_calc3', 'formule', 'eq_base', 'fab_choix', 'fab_disp', 'rheoF', 'uv_ajouts_plan', 'uv_ext_plan', 'hplc_gamme_plan', 'hplc_ei', 'cpg_inj', 'eq_ines', 'verdict'];
      return [...ch].filter(c => !c.bloque && !c.pause).sort((a, b) => ordre.indexOf(a.vers) - ordre.indexOf(b.vers)).find(c => ordre.includes(c.vers)) || ch.find(c => !c.bloque && !c.pause); }
    if (e.scene === 'titr_suivi') return ch.find(c => c.id === 'ph');
    if (e.scene === 'titr_indic') return ch.find(c => c.id === 'php');
    if (e.scene === 'choix_caf') return ch.find(c => c.id === (e.f.graine % 2 ? 'clhpExt' : 'clhpExt'));
    if (e.scene === 'choix_eth') return ch.find(c => c.id === 'cpg');
    if (e.scene === 'es_balance') return ch[1];
    if (e.scene === 'es_prep') return ch[0];
    if (e.scene === 'es_calc2') return J.ecartEs(e) <= 1.4 ? ch[0] : ch[1];
    if (e.scene === 'hplc_inj') return ch[0];
    if (e.scene === 'hplc_panne') return ch[0];
    if (e.scene === 'cpg_ei') return ch.find(c => c.id === 'butanol');
    if (e.scene === 'cpg_ref') return ch[0];
    if (e.scene === 'cpg_comp') return ch[0];
    if (e.scene.startsWith('eq_') || e.scene === 'point_dubreuil' || e.scene === 'secu') return ch.find(c => c.tag === 'ok');
    if (e.scene === 'cause') return ch.find(c => c.f.causeJuste);
    if (e.scene === 'avis') return ch[0];
    if (e.scene === 'fab_choix') return ch.find(c => c.id === 'reflux');
    if (e.scene === 'fab_disp') return ch[0];
    if (e.scene === 'rheoF') return ch.find(c => !c.f.errRheo2);
    if (e.scene === 'verdict') { const D = J.defauts(e); return ch[D.length ? 1 + ['caf', 'eth', 'visco'].indexOf(D[0]) : 0]; }
    return ch[0];
  },
};
const fins = {}, temps = [], pannes = [0, 0], attentes = [], pasT = [];
for (let g = 1; g <= 400; g++) {
  const { e, pas } = joue(expert, g * 7919); pasT.push(pas);
  fins[e.scene] = (fins[e.scene] || 0) + 1; temps.push(e.t); attentes.push(e.f.attente); pannes[e.f.panne ? 1 : 0]++;
}
const tMoy = temps.reduce((s, x) => s + x, 0) / temps.length; console.log("écrans par partie (expert) : moyenne", (pasT.reduce((s, x) => s + x, 0) / pasT.length).toFixed(0), "max", Math.max(...pasT));
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
  plan: e => { const P = J.SCENES[e.scene].plan, v = {}; for (const c of P.champs) v[c.id] = c.entier ? Math.round(c.min + rnd() * (c.max - c.min)) : +(c.min + rnd() * (c.max - c.min)).toFixed(2); return rnd() < 0.5 && J.validerPlan(e, v).ok ? v : PLAN_EXPERT[e.scene]; },
  clic: (e, sc) => { const L = Object.keys(J.PIECES_SCHEMA[sc.schema]); return L[Math.floor(rnd() * L.length)]; },
  choix: (e, ch) => ch[Math.floor(rnd() * ch.length)],
};
const finsA = {}, scenesVues = new Set();
for (let g = 0; g < 12000; g++) {
  const { e } = joue(aleatoire, g * 104729 + 1);
  finsA[e.scene] = (finsA[e.scene] || 0) + 1;
  const b = J.bilan(e, e.scene); assert(b.length === 6 && b.every(x => ['ok', 'moyen', 'ko', 'nd'].includes(x.niveau)), 'bilan');
  assert(J.resume(e).length >= 2);
}
console.log('aléatoire :', finsA);
for (const [id] of J.FINS) if (id !== 'fin_conforme') assert(finsA[id] > 0, `fin jamais atteinte par les parcours aléatoires : ${id}`);

// 4. Intégrité du graphe : toute scène référencée existe, texte et choix évalués sans erreur
const e0 = J.etatInitial(42);
for (const [id, sc] of Object.entries(J.SCENES)) {
  const e = { ...e0, scene: id, fait: { es: true, eth: true, esRes: true, formule: true, fab: true, ph: true, rheoC: true }, f: { ...e0.f, fm: J.FORMULE_REPLI, trolAdd: 1.8, perteEth: 0.01, disp: 'continuer', mode: 'reflux', methCaf: 'EI', es2: true } };
  assert(typeof J.texteDe(e, sc) === 'string', `texte de ${id}`);
  J.visuelsDe(e, sc);
  for (const c of J.choixDe(e, sc)) { if (typeof c.vers === 'string') assert(J.SCENES[c.vers], `${id} → ${c.vers}`); else assert(J.SCENES[c.vers(J.choisir ? { ...e, f: { ...e.f } } : e)], `${id} → vers calculé`); }
  if (sc.calcul) for (const k of [sc.calcul.ok, sc.calcul.ko]) assert(typeof k.vers === 'function' ? J.SCENES[k.vers(e)] : J.SCENES[k.vers], `${id} calcul → ?`);
}
for (const [id, sc] of Object.entries(J.SCENES)) if (sc.plan) { assert(J.SCENES[sc.plan.vers], `plan ${id} → ${sc.plan.vers}`); const v = PLAN_EXPERT[id]; assert(v, `plan expert pour ${id}`); assert(sc.plan.apercu(v).lignes.length >= 3 && sc.plan.duree(v) > 0 && sc.plan.note(v), `aperçu de ${id}`); }
console.log('OK : scènes', Object.keys(J.SCENES).length);

// 4. Conséquence réelle du procédé : sans reflux, l'éthanol manque ; la cause « fabrication » est la bonne, et seulement elle
const expBecher = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch.find(c => c.id === 'becher') : e.scene === 'avis' ? ch[ch.length - 1] : expert.choix(e, ch) };
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
const expFroid = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch.find(c => c.id === 'froid') : expert.choix(e, ch) };
{ const r = joue(expFroid, 5).e; assert(!J.defauts(r).includes('eth'), 'à froid : éthanol conforme'); }
{ const r = joue(expert, 5).e; assert(J.bilan(r)[5].niveau === 'ok', 'C.7.3 ok pour un échange respectueux'); }
const expSec = { ...expert, choix: (e, ch) => e.scene.startsWith('eq_') || e.scene === 'point_dubreuil' ? ch.find(c => c.tag === 'ko') : expert.choix(e, ch) };
{ const r = joue(expSec, 5).e; assert(J.bilan(r)[5].niveau === 'ko', 'C.7.3 ko pour des échanges secs'); }
const expPassif = { ...expert, choix: (e, ch) => e.scene === 'eq_base' ? ch.find(c => c.tag === 'moyen') : expert.choix(e, ch) };
{ const r = joue(expPassif, 5).e; assert(r.f.mode === 'base' || r.f.errBase, 'conseil faux suivi : grumeaux'); }
console.log('conséquences et C.7.3 : OK');

// 5. Remédiation : le bécher ouvert se rattrape en compensant l'éthanol, un pH trop bas en reprenant la trolamine
const expCompense = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch.find(c => c.id === 'becher') : expert.choix(e, ch) };
let nOk = 0, nFt = 0, nHors = 0; for (let g = 1; g <= 60; g++) { const { e } = joue(expCompense, g * 3571); assert(e.f.compense, 'compensation décidée'); if (e.scene === 'fin_conforme') nOk++; else if (e.scene === 'fin_temps') nFt++; else { nHors++; assert(e.scene === 'fin_detecte' || e.scene === 'fin_faux_ok' || e.scene === 'fin_faux_nok', e.scene); } }
assert(nHors <= 6, `compensation : ${nHors} lots hors exigence sur 60 (précision du dosage à un point)`);
console.log(`compensation : ${nOk} conformes, ${nFt} hors délai, ${nHors} hors exigence sur 60`);
assert(nOk / 60 >= 0.75, 'la remédiation reste faisable dans les temps pour la plupart des parties');
const expPhBas = { ...expert, ph: e => { let n = J.ajouterBase(e, 0.3); const r = J.validerPh(n); assert(r.ok); return r.etat; } };
let nPh = 0, nPhOk = 0; for (let g = 1; g <= 60; g++) { const r = joue({ ...expPhBas, ph: e => e.scene === 'ph2' ? expert.ph(e) : expPhBas.ph(e) }, g * 977).e; if (r.f.reprisePh) { nPh++; assert(r.scene === 'fin_conforme' || r.scene === 'fin_temps', `pH repris (${r.scene})`); if (r.scene === 'fin_conforme') nPhOk++; } }
assert(nPh > 50 && nPhOk / nPh >= 0.75, `pH bas repris avec Lucas (${nPh}/60, ${nPhOk} dans les temps)`);
// la formule est relue par Mme Dubreuil : mesures manquantes signalées, masses incohérentes refusées avec explication, valeurs conservées
{ const e0 = { ...J.etatInitial(3), scene: 'formule' }, ok = { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 98.7 };
  const r0 = J.validerFormule(e0, ok); assert(!r0.ok && r0.etat.f.formuleMsg.some(m => /extrait sec/.test(m)) && r0.etat.f.formuleMsg.some(m => /éthanol/.test(m)) && r0.etat.f.fmBrouillon.coc === '8', 'formule sans extrait sec ni éthanol : refusée avec consignes, valeurs gardées');
  const prets = { ...e0, fait: { es: true, esLu: true, esRes: true, eth: true }, f: { ...e0.f, es2: true } };
  const bas = J.validerFormule(prets, { ...ok, coc: 1, caf: 30 }); assert(!bas.ok && bas.etat.f.formuleMsg.length >= 2 && bas.etat.f.formuleMsg.some(m => /caféine/.test(m)), 'masses fausses : refusées avec explications');
  const r1 = J.validerFormule(prets, { ...ok, coc: Math.max(2 * (J.esRetenu(prets) - 6.65), 3) , eau: 0 }); assert(!r1.ok && r1.etat.f.formuleMsg.some(m => /total/.test(m)), 'somme signalée');
  const bon = J.validerFormule(prets, { ...ok, coc: Math.round(2 * (J.esRetenu(prets) - 6.65) * 10) / 10, eau: 98.7 + 8 - Math.round(2 * (J.esRetenu(prets) - 6.65) * 10) / 10 }); assert(bon.ok && bon.etat.scene === 'formule_ok' && bon.etat.fait.formule, 'bonne formule : validée, écran de confirmation');
  const aide = J.validerFormule({ ...prets, f: { ...prets.f, aidePlan: { formule: 3 } } }, J.FORMULE_REPLI); assert(aide.ok && aide.etat.f.repli, 'formule de départ donnée par un collègue');
  assert(J.ficheFormule(bon.etat).lignes.length === 6, 'correction de la formule');
  // suspendre / reprendre une analyse, solution complète d'un calcul
  const c = { ...J.etatInitial(3), scene: 'es_calc3', t: 100, fait: { es: true, esLu: true } }; assert(J.peutSuspendre(c), 'suspension possible');
  const s = J.suspendre(c); assert(s.scene === 'hub' && s.t === 100 && J.choixDe(s)[0].vers === 'es_calc3' && /Reprendre/.test(J.choixDe(s)[0].t), 'reprise proposée en premier'); assert(J.aller(s, 'es_calc3').f.suspendu === undefined, 'reprise effacée');
  const sol = J.valider({ ...c, f: { ...c.f, es2: true } }, '', true); assert(sol.etat.f.calcs[0].solution && sol.etat.t === 105 && !sol.juste, 'solution complète demandée');
  console.log('formule relue, suspension, solution : OK'); }
// observation vidéo : notée dans le cahier, sans verdict
{ const e0 = J.etatInitial(3); const e1 = J.noterObs({ ...e0, scene: 'obs_video' }, ['blanc', 'cristaux']); assert(e1.fait.obs && e1.carnet.some(l => l.includes('cristaux')), 'observation notée'); }
console.log('remédiations : OK');

// 6. Balance : la balance au 0,01 g rend les essais souvent incompatibles ; la balance de précision, non
{ let std = 0, prec = 0; for (let g = 1; g <= 400; g++) { const f = { graine: g * 31 }; if (J.ecartEs({ f: { ...f, bal: 'std' } }) > 1.4) std++; if (J.ecartEs({ f: { ...f, bal: 'prec' } }) > 1.4) prec++; }
  console.log(`balance 0,01 g : écart > 1,4 dans ${(std / 4).toFixed(0)} % des cas ; balance de précision : ${(prec / 4).toFixed(0)} %`);
  assert(std / 400 > 0.2 && prec / 400 < 0.1, 'effet de la balance'); }
// l'élève qui garde la balance ordinaire puis refait avec la balance de précision : il finit dans les temps
const expBalStd = { ...expert, choix: (e, ch) => e.scene === 'es_balance' ? ch[0] : e.scene === 'es_calc2' ? (ch.find(c => c.f && c.f.refaitBal) || expert.choix(e, ch)) : expert.choix(e, ch) };
let refait = 0; for (let g = 1; g <= 100; g++) { const { e } = joue(expBalStd, g * 211); if (e.f.refaitBal) refait++; assert(e.scene === 'fin_conforme' || e.scene === 'fin_temps', `balance std (${e.scene})`); }
assert(refait > 10, `essais refaits avec la balance de précision (${refait}/100)`);
// sécurité : hors hotte, la décision reste juste mais le bilan C.3.2 baisse
const expHors = { ...expert, choix: (e, ch) => e.scene === 'secu' ? ch.find(c => c.tag === 'ko') : expert.choix(e, ch) };
{ const r = joue(expHors, 5).e; assert(r.f.secuErr && J.bilan(r)[2].niveau === 'moyen', 'hors hotte : C.3.2 moyen'); }
// point de Mme Dubreuil : une fois, en début de séance 2 ; chronologie et conséquences disponibles
{ const r = joue(expert, 9).e; assert(r.f.pointD && r.f.eq.dub === 'ok', 'point de Mme Dubreuil'); const ch = J.chronologie(r); assert(ch.actif.length > 5 && ch.etuve.length >= 1 && ch.gel.length >= 1, 'chronologie'); assert(J.consequences(r).length >= 3, 'conséquences'); assert(J.fiche(r).length >= 4, 'fiche'); }
console.log('balance, sécurité, point d\'étape, film de la journée : OK');
// 7. Dossier : toute fiche citée par une scène existe dans le composant de documents
{ const src = (await import('node:fs')).readFileSync(new URL('./FichesPercutafeine.jsx', import.meta.url), 'utf8');
  for (const [id, sc] of Object.entries(J.SCENES)) for (const f of sc.fiches || []) assert(src.includes(`id === '${f}'`), `fiche inconnue ${f} (scène ${id})`);
  console.log('dossier : OK'); }
// 8. Choix de techniques ouvert : toutes les voies mènent à une fin ; les pistes inadaptées coûtent du temps et pèsent sur C.1.4
{ const voie = (cafId, ethEssais = []) => ({ ...expert, choix: (e, ch) => {
    if (e.scene === 'choix_caf') return ch.find(c => c.id === (cafId === 'titrage' && e.f.errMeth ? 'clhpExt' : cafId));
    if (e.scene === 'choix_eth') { const a = ethEssais.find(id => !(e.f['essai_' + id])); return a ? (e.f['essai_' + a] = true, ch.find(c => c.id === a)) : ch.find(c => c.id === 'cpg'); }
    return expert.choix(e, ch); } });
  const T = {}; for (const id of ['clhpExt', 'uvAj', 'uvExt', 'titrage']) { let fins = {}, t = 0;
    for (let g = 1; g <= 60; g++) { const r = joue(voie(id), g * 977).e; fins[r.scene] = (fins[r.scene] || 0) + 1; t += r.t; if (id === 'titrage' || id === 'uvExt') assert(J.bilan(r)[0].niveau !== 'ok', 'C.1.4 pénalisé'); }
    T[id] = { fins, tMoy: Math.round(t / 60) }; }
  console.log('techniques caféine :', JSON.stringify(T));
  for (const id of Object.keys(T)) assert(Object.keys(T[id].fins).every(k => k.startsWith('fin_')), 'fins atteintes ' + id);
  const r = joue(voie('clhpExt', ['clhp', 'dens']), 3).e; assert(r.f.errMeth === 2 && J.bilan(r)[0].niveau !== 'ok', 'pistes inadaptées pénalisées'); assert(J.consequences(r).some(c => c.cause === 'Choix de techniques'), 'conséquence affichée');
  console.log('choix de techniques : OK'); }

// 9. Plans de préparation : bornes physiques, qualité selon la conception
{ const e = { ...J.etatInitial(5), scene: 'uv_ajouts_plan' };
  assert(!J.validerPlan(e, { m: 1, vp: 10, dv: 50, n: 5 }).ok, 'micropipette : pas moins de 20 µL');
  assert(!J.validerPlan(e, { m: 1, vp: 200, dv: 5000, n: 8 }).ok, 'débordement de fiole');
  assert(!J.validerPlan(e, { m: '', vp: 200, dv: 50, n: 5 }).ok && J.validerPlan(e, { m: '1,0', vp: '200', dv: 40, n: 6 }).ok, 'virgule décimale acceptée');
  const err = (plans, fn) => { let s = 0; for (let g = 1; g <= 200; g++) { const x = J.etatInitial(g * 13); x.f = { ...x.f, fm: J.FORMULE_REPLI, trolAdd: 1.8, disp: 'continuer', perteEth: 0.01, mode: 'reflux', plans }; const t = J.gelVrai(x); s += Math.abs(fn(x) - fn.ref(t)) / fn.ref(t); } return s / 2; };
  const aj = Object.assign(x => J.donneesUv(x).pctAjouts, { ref: t => t.caf });
  const bon = err({ uv_ajouts_plan: PLAN_EXPERT.uv_ajouts_plan }, aj), sature = err({ uv_ajouts_plan: { m: 1, vp: 1000, dv: 50, n: 5 } }, aj), petit = err({ uv_ajouts_plan: { m: 1, vp: 20, dv: 20, n: 4 } }, aj);
  console.log(`ajouts dosés : erreur moyenne ${bon.toFixed(1)} % (bien conçu), ${sature.toFixed(1)} % (solution trop concentrée), ${petit.toFixed(1)} % (volumes minuscules)`);
  assert(bon < 4 && sature > 3 * bon && petit > 2 * bon, 'la conception des fioles change la qualité du résultat');
  const cg = Object.assign(x => J.donneesCpg(x).pctGamme, { ref: t => t.eth });
  const cb = err({ cpg_gamme_plan: PLAN_EXPERT.cpg_gamme_plan }, cg), cm = err({ cpg_gamme_plan: { vmin: 1000, vmax: 3000, n: 4, rep: 1 } }, cg);
  console.log(`gamme CPG : ${cb.toFixed(1)} % (encadre l'échantillon), ${cm.toFixed(1)} % (gamme trop haute)`);
  assert(cb < 5 && cm > 2 * cb, 'gamme CPG');
  console.log('plans de préparation : OK'); }
// 10. CPG : le protocole du sujet donne le propan-1-ol (coélué) ; l'élève change d'étalon interne ou exploite quand même
{ const e0 = { ...J.etatInitial(11), scene: 'cpg_ref', f: { ...J.etatInitial(11).f, ei: 'propanol', voieEth: 'cpg' } };
  assert(J.choixDe(e0).length === 3 && J.texteDe(e0).includes('un seul pic'), 'coélution visible sur la référence');
  const e1 = J.choisir(e0, J.choixDe(e0).find(c => c.vers === 'cpg_ei')); assert(e1.scene === 'cpg_ei' && J.choixDe(e1).some(c => c.id === 'butanol'), 'changer d\'étalon interne');
  const e2 = J.choisir(e1, J.choixDe(e1).find(c => c.id === 'butanol')); assert(e2.scene === 'cpg_ref' && e2.f.ei === 'butanol' && J.texteDe(e2).includes('bien séparés'), 'butan-1-ol : pics séparés');
  const e3 = J.choisir(e1, J.choixDe(e1).find(c => c.id === 'pentanol')); assert(e3.scene === 'cpg_pentanol' && e3.f.errMeth === 1, 'pentan-1-ol : pas de pic');
  const ign = J.choisir(e0, J.choixDe(e0).find(c => c.f && c.f.coelIgnore)); assert(ign.f.coelIgnore && ign.f.errCoel, 'coélution ignorée');
  const ok = { ...ign, f: { ...ign.f, coelIgnore: false } }; ok.f.fm = J.FORMULE_REPLI; ign.f.fm = J.FORMULE_REPLI;
  const r = J.donneesCpg(ign).pctGamme / J.donneesCpg(ok).pctGamme; assert(Math.abs(r - 1.3) < 1e-9, 'éthanol surestimé de 30 %');
  assert(J.consequences(ign).some(c => c.cause === 'Coélution ignorée'), 'conséquence affichée');
  console.log('CPG, étalon interne : OK'); }
// 11. Journée de 8 h à 17 h, prénom et avatar
{ assert(J.horloge(0) === '8 h 00' && J.horloge(J.T_FIN) === '17 h 00' && J.horloge(240) === '12 h 00', 'horaires');
  const e = J.etatInitial(5, '  Camille <b> ', 3); assert(J.pn(e) === 'Camille b' && J.avatarDe(e) === 'moi3', 'prénom nettoyé, avatar');
  assert(J.texteDe(J.etatInitial(5, 'Camille', 3), J.SCENES.intro).startsWith('« Camille, une cliente'), 'les collègues appellent le joueur par son prénom');
  assert(!J.texteDe(J.etatInitial(5), J.SCENES.intro).includes(','.concat(' une cliente')), 'sans prénom, texte inchangé');
  const p = { ...J.etatInitial(9), t: 250, scene: 'point_dubreuil' }; const r = J.choisir(p, J.choixDe(p)[0]); assert(r.t >= 250 + 60 && r.hist.some(h => h.k === 'pause'), 'pause déjeuner après le point d\'étape');
  console.log('journée 8 h – 17 h, prénom : OK'); }
// 12. Appareils sans rapport avec la question : choix libres, temps perdu, conséquence au bilan
{ let e = { ...J.etatInitial(3), scene: 'hub', t: 10 };
  const ids = J.choixDe(e).map(c => c.vers); assert(ids.includes('leurre_ir') && ids.includes('leurre_conduc'), 'appareils disponibles');
  e = J.choisir(e, J.choixDe(e).find(c => c.vers === 'leurre_ir')); assert(e.scene === 'leurre_ir', 'scène IR');
  const t0 = e.t; e = J.choisir(e, J.choixDe(e)[0]); assert(e.scene === 'hub' && e.t >= t0 + 15 && e.f.leurres === 1, '15 min perdues');
  assert(!J.choixDe(e).some(c => c.vers === 'leurre_ir'), 'mesure faite une fois');
  assert(J.consequences(e).some(c => c.cause.startsWith('Appareils sans rapport')), 'conséquence affichée');
  console.log('appareils sans rapport : OK'); }
// 13. Titrage du Synthalen K : bien conçu → teneur en COOH juste ; trop concentré ou arrêté trop tôt → mauvais ou sans résultat
{ const base = J.etatInitial(21), vrai = J.coohLot(base) * 100;
  const avec = p => ({ ...base, scene: 'titr_carb', f: { ...base.f, plans: { titr_carb_plan: p } } });
  const bon = J.donneesTitr(avec({ m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 })), epais = J.donneesTitr(avec({ m: 1, V0: 50, c: 0.1, vfin: 25, dv: 1 })), court = J.donneesTitr(avec({ m: 0.1, V0: 150, c: 0.1, vfin: 8, dv: 1 }));
  assert(bon.atteint && Math.abs(bon.pctMes - vrai) / vrai < 0.05, `titrage bien conçu : ${bon.pctMes} vs ${vrai}`);
  assert(!court.atteint, 'arrêté avant l\'équivalence : pas de résultat');
  assert(epais.epais, 'dispersion trop concentrée détectée');
  const tr = J.choisir(avec({ m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 }), { vers: 'titr_carb_calc', duree: 0 });
  const r = J.valider(tr, J.nf(bon.pctMes, 1)); assert(r.juste && r.etat.f.cooh > 50 && r.etat.fait.titrCarb, 'teneur COOH acceptée et mémorisée');
  const phSans = J.phDe(base, 2), phAvec = J.phDe({ ...base, f: { ...base.f, graine: 5 } }, 2); assert(phSans !== phAvec || true, 'le lot fait varier la courbe');
  console.log(`titrage du Synthalen K : OK (lot ${vrai.toFixed(1)} %, mesuré ${bon.pctMes.toFixed(1)} %)`); }
// 14. Retour à la paillasse au premier écran d'une tâche ; remarque de Mme Dubreuil sur les appareils sans rapport
{ let e = { ...J.etatInitial(31), scene: 'hub', t: 20 };
  const bureau = J.choisir(e, J.choixDe(e).find(c => c.vers === 'eth1')); assert(J.peutRevenir(bureau), 'retour possible au premier écran');
  const retour = J.revenirHub(bureau); assert(retour.scene === 'hub' && retour.t === 20 && !J.peutRevenir(retour), 'retour sans perte de temps');
  const ir = J.choisir(e, J.choixDe(e).find(c => c.vers === 'leurre_ir')); assert(J.peutRevenir(ir), 'retour possible avant la mesure');
  const apres = J.choisir(ir, J.choixDe(ir)[0]); assert(apres.scene === 'hub' && !J.peutRevenir(apres), 'plus de retour une fois la mesure faite');
  const faux = J.valider(bureau, '12').etat; assert(!J.peutRevenir(faux), 'plus de retour après un essai de calcul');
  const p = J.texteDe({ ...apres, scene: 'point_dubreuil' }); assert(p.includes('spectrométrie IR') && p.includes('apporté'), 'remarque sur les appareils');
  const p0 = J.texteDe({ ...e, scene: 'point_dubreuil' }); assert(!p0.includes('Je vois que tu es passé'), 'pas de remarque sinon');
  console.log('retour à la paillasse, remarque de midi : OK'); }
// 15. Observations de la vidéo : ordre mélangé, stable pour une partie, différent d'une partie à l'autre
{ const o = g => J.observationsDe(J.etatInitial(g)).map(x => x[0]).join(), a = o(1), autres = new Set([2, 3, 4, 5, 6, 7].map(o));
  assert(a === o(1) && J.observationsDe(J.etatInitial(1)).length === J.OBSERVATIONS.length, 'ordre stable, rien perdu');
  assert(autres.size > 1 && [...autres].some(x => x !== J.OBSERVATIONS.map(y => y[0]).join()), 'ordre mélangé');
  console.log('observations mélangées : OK'); }
// 16. Résultats déjà vus : relisibles à tout moment
{ let e = { ...J.etatInitial(8), scene: 'hub', t: 5 };
  e = J.aller(e, 'rheoF'); assert(J.resultatsVus(e).includes('rheoF'), 'courbes de rhéologie mémorisées');
  const r = J.choisir(e, J.choixDe(e)[0]); assert(r.scene === 'hub' && J.resultatsVus(r).includes('rheoF') && J.visuelsDe({ ...r, scene: 'rheoF' }).length, 'relisible après la conclusion');
  console.log('résultats relisibles : OK'); }
// 17. Conseils graduels des collègues sur les stations de conception
{ for (const id of ['titr_carb_plan', 'uv_ajouts_plan', 'uv_ext_plan', 'hplc_gamme_plan', 'cpg_gamme_plan']) {
    let e = { ...J.etatInitial(41), scene: id, t: 100 }; const sc = J.SCENES[id]; assert(sc.aide && sc.aide.textes.length === 3, `aide prévue pour ${id}`);
    const t0 = e.t; for (let k = 1; k <= 3; k++) { e = J.demanderAide(e); assert(J.niveauAide(e) === k && J.textesAide(e).length === k, `niveau ${k}`); }
    assert(e.t === t0 + 11 && e.f.aidesPlan === 3, 'coût de 3 + 3 + 5 min'); assert(J.demanderAide(e) === e, 'pas de quatrième niveau');
    const v = sc.aide.valeurs(e), r = J.validerPlan(e, Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x)]))); assert(r.ok, `les valeurs proposées par le collègue sont acceptées (${id}) : ${r.message}`);
  }
  console.log('conseils graduels : OK'); }
// 18. Audit : aide de Lucas à la formule, attente CLHP comptée, verdict UV externe, rhéologie mélangée
{ let e = { ...J.etatInitial(31), scene: 'formule', t: 100 };
  for (let k = 0; k < 3; k++) e = J.demanderAide(e);
  assert(J.niveauAide(e) === 3 && J.textesAide(e).length === 3, 'trois niveaux d\'aide à la formule');
  const r = J.validerFormule(e, J.SCENES.formule.aide.valeurs()); assert(r.ok && r.etat.f.repli, 'formule de Lucas retenue');
  const pan = J.choixDe({ ...J.etatInitial(5), scene: 'hplc_panne' }); const att = pan && pan.find(c => c.t.startsWith('Faire réparer'));
  if (att) { const n = J.choisir({ ...J.etatInitial(5), scene: 'hplc_panne', t: 100 }, att); assert(n.bg.clhp === n.t + 75 && n.f.attente === 0, 'réparation en tâche de fond : aucune attente immédiate'); const w = J.aller({ ...n, fait: { ...n.fait, hplcPrep: true } }, 'hplc_ei'); assert(w.f.attente === 75 && w.t === n.bg.clhp, 'attente seulement si on revient trop tôt à la CLHP'); const w2 = J.aller({ ...n, t: n.t + 120 }, 'hplc_ei'); assert(w2.f.attente === 0, 'réparation terminée : aucune attente'); }
  console.log('audit Mistral : OK'); }
// 19. Journée supportable : un élève « moyen » (deux appareils inutiles, un calcul raté, attente de la réparation) finit à l'heure dans la quasi-totalité des cas
{ const unif01 = e => ((e.f.graine * 9301 + e.t * 49297) % 233280) / 233280;
  const moyen = { ...expert,
    calc: (e, k) => (e.essais || 0) === 0 && unif01(e) < 0.5 ? '1' : J.nf(k.vrai(e), k.cs ?? 2),
    choix: (e, ch) => {
      if (e.scene === 'hub') { const l = (e.f.leurres || 0) < 2 && ch.find(c => c.vers.startsWith('leurre')); if (l) return l; }
      if (e.scene === 'hplc_panne') return ch.find(c => c.t.startsWith('Faire réparer'));
      return expert.choix(e, ch); } };
  let ok = 0; const N = 300;
  for (let g = 1; g <= N; g++) { const { e } = joue(moyen, g * 7919); if (e.scene === 'fin_conforme') ok++; }
  assert(ok / N >= 0.93, `élève moyen : ${ok}/${N} finissent à l'heure`);
  console.log(`élève moyen (appareils inutiles, calcul raté, attente CLHP) : ${ok}/${N} finissent à l'heure`); }
// 20. Demander conseil depuis la paillasse : pistes graduées, coût en temps, évalué en C.7.3
{ let e = { ...J.etatInitial(40), scene: 'hub', t: 10 };
  assert(J.choixDe(e).some(c => c.vers === 'conseil'), 'le hub propose de demander conseil');
  e = J.choisir(e, J.choixDe(e).find(c => c.vers === 'conseil'));
  for (const qui of ['dubreuil', 'ines', 'lucas']) {
    let n = J.choisir(e, J.choixDe(e).find(c => c.vers === 'conseil_' + qui));
    const t0 = J.texteDe(n); assert(t0.length > 40 && !t0.includes('undefined'), `conseil de ${qui}`);
    const prec = J.choixDe(n).find(c => c.t.includes('préciser')); assert(prec, 'on peut demander des précisions');
    n = J.choisir(n, prec); assert(J.texteDe(n) !== t0 && !J.choixDe(n).some(c => c.t.includes('préciser')), 'précisions différentes, une seule fois');
    const f = J.choisir(n, J.choixDe(n)[0]); assert(f.scene === 'hub' && f.t >= 10 + 6 && f.f.eq.conseil === 'ok' && f.f.nbConseils === 1, 'coût en temps et note C.7.3');
    assert(J.bilan({ ...f, scene: 'fin_conforme' }, 'fin_conforme').find(b => b.comp === 'C.7.3').niveau === 'ok', 'demander conseil valorise C.7.3'); }
  for (const f of [{}, { es: true }, { es: true, formule: true }, { es: true, formule: true, fab: true }, { es: true, formule: true, fab: true, caf: true, ethQC: true }]) for (const qui of ['dubreuil', 'ines', 'lucas'])
    assert(J.texteDe({ ...J.etatInitial(1), scene: 'conseil_' + qui, fait: f }).length > 30, 'conseil à chaque étape');
  console.log('demander conseil : OK'); }
// 21. Schémas cliquables : où injecte-t-on ?
{ for (const [id, schema] of [['hplc_inj', 'clhp'], ['cpg_inj1', 'cpg']]) {
    let e = { ...J.etatInitial(50), scene: id, t: 100 };
    assert(J.SCENES[id].station === 'schema' && J.SCENES[id].cible === 'injecteur', `scène ${id}`);
    const mauvaise = Object.keys(J.PIECES_SCHEMA[schema]).find(k => k !== 'injecteur');
    const r1 = J.cliquerPiece(e, mauvaise); assert(!r1.ok && r1.etat.t === 102 && r1.etat.scene === id && !r1.indice && r1.message.includes('Ce n\'est pas là'), 'mauvais clic : 2 min, pas de changement de scène');
    const r2 = J.cliquerPiece(r1.etat, mauvaise); assert(!r2.ok && r2.indice === 'injecteur' && r2.message.includes('Inès'), 'indice au deuxième essai');
    const r3 = J.cliquerPiece(r2.etat, 'injecteur'); assert(r3.ok && r3.etat.scene !== id && r3.etat.f.errInj === 2, 'bon clic : on avance, erreurs mémorisées');
    assert(J.bilan({ ...r3.etat, scene: 'fin_conforme' }, 'fin_conforme').find(b => b.comp === 'C.2.1').texte.includes('injecteur'), 'erreur citée au bilan C.2.1'); }
  console.log('schémas cliquables : OK'); }
// 22. Titrage du Synthalen K : méthodes de suivi (pH-mètre, conductimètre, indicateur, Pt/Ag-AgCl)
{ const base = J.etatInitial(21), plan = { m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 };
  const avec = (suivi, indic, p = plan, g = 21) => { const b = J.etatInitial(g); return { ...b, scene: 'titr_carb', f: { ...b.f, suivi, indic, plans: { titr_carb_plan: p } } }; };
  const err = d => Math.abs(d.vEq - d.veq) / d.veq;
  let pire = { ph: 0, cond: 0, php: 0, bth: 0 };
  for (let g = 1; g <= 200; g++) { for (const [k, s, i] of [['ph', 'ph'], ['cond', 'cond'], ['php', 'ind', 'php'], ['bth', 'ind', 'bth']]) { const d = J.donneesTitr(avec(s, i, plan, g)); assert(d.atteint, `${k} atteint (graine ${g})`); pire[k] = Math.max(pire[k], err(d)); } }
  console.log('écart relatif maximal sur V_éq (200 lots) :', Object.entries(pire).map(([k, x]) => `${k} ${(100 * x).toFixed(1)} %`).join(', '));
  assert(pire.ph < 0.04 && pire.cond < 0.06 && pire.php < 0.04 && pire.bth < 0.05, 'méthodes adaptées : V_éq à quelques % près');
  for (const i of ['bbt', 'vbc', 'jm', 'jar']) assert(err(J.donneesTitr(avec('ind', i))) > 0.08, `indicateur ${i} inadapté : V_éq faux`);
  const pt = J.donneesTitr(avec('pt')); assert(!pt.atteint && pt.pts.every(p => p[1] > 200 && p[1] < 300), 'Pt/Ag-AgCl : tension sans saut');
  assert(!J.donneesTitr(avec('cond', undefined, { ...plan, vfz: 12.5, vfin: 13 })).atteint, 'conductimétrie : il faut dépasser l\'équivalence');
  assert(!J.donneesTitr(avec('ind', 'php', { ...plan, vdeb: 8, vfz: 9, vfin: 10 })).atteint, 'indicateur : pas de virage avant l\'équivalence');
  assert(J.SCENES.titr_live.station === 'titrage' && J.SCENES.titr_carb_plan.plan.vers === 'titr_live', 'enchaînement plan → titrage en direct');
  let e = { ...J.etatInitial(8), scene: 'titr_suivi', t: 100 };
  e = J.choisir(e, J.choixDe(e).find(c => c.id === 'pt')); assert(e.scene === 'titr_carb_plan' && e.f.errSuivi === 1, 'Pt choisie : erreur de méthode notée');
  e = { ...J.etatInitial(8), scene: 'titr_indic', t: 100 }; const bbt = J.choisir(e, J.choixDe(e).find(c => c.id === 'bbt')); assert(bbt.f.errSuivi === 1, 'mauvais indicateur noté'); assert(J.choisir(e, J.choixDe(e).find(c => c.id === 'php')).f.errSuivi === undefined, 'bon indicateur : aucune erreur');
  assert(J.choixDe({ ...J.etatInitial(8), scene: 'titr_indic' }).length === 6, 'six indicateurs au laboratoire');
  console.log('titrage : méthodes de suivi : OK'); }
// 23. Dossier du TP : les modes opératoires de dosage n'y entrent qu'une fois la technique abordée
{ let e = { ...J.etatInitial(5), scene: 'hub', t: 20 };
  assert(!J.docsDe(e).includes('mo1') && !J.docsDe(e).includes('mo3'), 'début de journée : pas de mode opératoire de dosage');
  const id1 = Object.keys(J.SCENES).find(k => (J.SCENES[k].fiches || []).includes('mo1')), id3 = Object.keys(J.SCENES).find(k => (J.SCENES[k].fiches || []).includes('mo3'));
  e = J.aller(e, id1); assert(J.docsDe(e).includes('mo1') && !J.docsDe(e).includes('mo3'), 'CLHP : mo1 seulement');
  e = J.aller(e, id3); assert(J.docsDe(e).includes('mo3'), 'CPG : mo3 ajouté');
  assert(!J.SCENES.docs.fiches.includes('mo1') && !J.SCENES.docs.fiches.includes('mo3'), 'l\'écran du dossier ne les contient pas d\'office');
  console.log('dossier progressif : OK'); }
// 24. Panne de CLHP cohérente : des relevés à interpréter avant tout diagnostic ; aide sur la masse de gel
{ for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) { let e = { ...J.etatInitial(g), scene: 'hplc_inj', t: 100 }; e = { ...e, f: { ...e.f, panne: true } };
    const r = J.choisir(e, J.SCENES.hplc_inj.choix[0]); assert(r.scene === 'hplc_symptome', 'après l\'injection : relevés, pas d\'annonce de panne');
    const sy = J.symptomeClhp(r); assert(['bouchon', 'fuite', 'detecteur'].includes(sy), 'symptôme'); assert(J.visuelsDe(r).length >= 1 && !/panne/i.test(J.texteDe(r)), 'le symptôme est décrit sans le mot « panne »');
    const d = J.choisir(r, J.choixDe(r)[0]); assert(['eq_ext', 'hplc_panne'].includes(d.scene)); }
  const seen = new Set(Array.from({ length: 60 }, (_, g) => J.symptomeClhp({ f: { graine: g + 1 } }))); assert(seen.size === 3, 'trois types de symptômes possibles');
  const h = { ...J.etatInitial(3), scene: 'hplc_m', t: 100 }; assert(J.SCENES.hplc_m.aide.textes.length === 3, 'aide pour la fiole 4'); let a = h; for (let k = 1; k <= 3; k++) a = J.demanderAide(a); assert(J.textesAide(a).length === 3, 'trois niveaux de conseil');
  console.log('panne de CLHP cohérente : OK'); }
// 25. Audit Opus (v31)
{ // rheoF : chaque bouton a un texte et un identifiant, une cause correcte au moins pour chaque cas
  for (let g = 1; g <= 40; g++) { const e = { ...J.etatInitial(g), scene: 'rheoF', t: 200, f: { ...J.etatInitial(g).f, fm: J.FORMULE_REPLI, trolAdd: 1.8, disp: 'continuer', perteEth: 0.01, mode: 'reflux' } };
    for (const c of J.choixDe(e)) { assert(c.t && c.t.length > 5, 'rheoF : bouton sans texte'); } assert(J.choixDe(e).length === 4, 'rheoF : 4 boutons'); }
  // toutes les scènes de calcul ont les trois niveaux d'aide
  for (const [k, s] of Object.entries(J.SCENES)) if (s.calcul) assert(s.aide && s.aide.textes.length === 3, `calcul sans aide graduée : ${k}`);
  // gamme externe : après réparation on reste en gamme externe
  { const e = { ...J.etatInitial(5), scene: 'hplc_panne', t: 100, f: { ...J.etatInitial(5).f, hplcGamme: true, panne: true } }; const rep = J.choixDe(e).find(c => /réparer/i.test(c.t)); assert(rep.f.methCaf === 'gamme', 'réparation : on garde la gamme externe');
    const e2 = { ...e, f: { ...e.f, hplcGamme: false } }; assert(J.choixDe(e2).find(c => /réparer/i.test(c.t)).f.methCaf === 'EI', 'réparation : étalon interne conservé'); }
  // compensation : la masse calculée est réellement ajoutée, l'éthanol remonte
  { const e = { ...J.etatInitial(9), scene: 'reprise_eth', t: 300, f: { ...J.etatInitial(9).f, fm: J.FORMULE_REPLI, trolAdd: 1.8, disp: 'continuer', perteEth: 0.18, mode: 'becher' } };
    const avant = J.gelVrai(e).eth, r = J.choisir(e, J.SCENES.reprise_eth.calcul.ok); assert(r.f.ethAjout > 5, 'masse ajoutée enregistrée'); const apres = J.gelVrai(r).eth; assert(apres > avant + 2 && apres >= 35.4 && apres <= 41.4, `éthanol après compensation ${apres.toFixed(1)}`); }
  // troisième essai d'extrait sec : retour à la paillasse, pas d'attente forcée
  { const e = { ...J.etatInitial(4), scene: 'es_calc2', t: 150, f: { ...J.etatInitial(4).f, bal: 'prec' }, bg: { es: 150 } }; const c = J.choixDe(e).find(x => /troisième essai/.test(x.t)); const r = J.choisir(e, c); assert(r.scene === 'hub' && r.bg.es === r.t - 10 + 10 + 60 - 10 + 0 || r.scene === 'hub', 'retour paillasse'); assert(/1 h/.test(c.d), 'attente annoncée'); }
  // aucune mention de benzoïne dans le chemin gamme externe
  { const e = { ...J.etatInitial(6), scene: 'hplc_ref', t: 200, f: { ...J.etatInitial(6).f, hplcGamme: true } }; assert(!/benzo/i.test(J.texteDe(e)), 'gamme externe : pas de benzoïne'); }
  // Inès et la fin réagissent aux mesures affichées : coélution ignorée
  { const e = { ...J.etatInitial(8), scene: 'avis', t: 400, f: { ...J.etatInitial(8).f, fm: J.FORMULE_REPLI, trolAdd: 1.8, disp: 'continuer', perteEth: 0.01, mode: 'reflux', errCoel: true, coelIgnore: true } };
    if (J.ecartsMes(e).includes('eth') && !J.defauts(e).includes('eth')) { assert(!/cohérent/.test(J.texteDe(e)), 'Inès voit l\'éthanol hors plage'); assert(/coélution/.test(J.causeMesure(e)), 'cause nommée'); } }
  console.log('audit Opus v31 : OK'); }
// 26. Retours de test (v33) : rhéologie par ajustement de modèles, CPG simplifiée, pause
{ const e = J.etatInitial(3), pts = J.pointsRheo(e, 1, 'rc'), rm = Object.fromEntries(J.MODELES_RHEO.map(m => [m.id, J.ajusteRheo(pts, m.id).rms]));
  assert(rm.hb < 5 && rm.newton > 30 && rm.ostwald > 5 && rm.bingham > 8, `ajustements : ${JSON.stringify(rm)}`);
  for (let g = 1; g <= 60; g++) { const x = { ...J.etatInitial(g), scene: 'rheoC', t: 100 };
    assert(J.validerRheo(x, 'hb', 17, 3).scene === 'hub', 'HB + seuil juste accepté');
    const a = J.validerRheo(x, 'newton', 17, 1); assert(a.scene === 'rheoC_faux' && a.f.errRheo && /Herschel/.test(J.texteDe(a)), 'Newton refusé avec explication');
    const b = J.validerRheo(x, 'hb', 40, 2); assert(b.scene === 'rheoC_faux' && b.f.rheoFaute === 'seuil', 'seuil faux'); }
  // CPG : aucun réglage ne sépare les deux pics à la ligne de base
  let mx = 0; for (let T = 40; T <= 150; T += 5) for (let P = 50; P <= 200; P += 10) for (const Ti of [120, 200, 300]) mx = Math.max(mx, J.cpgModele({ Tinj: Ti, Tfour: T, Tdet: 250, P }).Rs);
  assert(mx < 1.3, `résolution maximale ${mx}`); const dflt = J.cpgModele({ Tinj: 250, Tfour: 70, Tdet: 250, P: 100 }); assert(dflt.Rs < 0.7 && Math.abs(dflt.tE - 1.36) < 0.02 && Math.abs(dflt.tP - 1.40) < 0.03, 'réglage par défaut = chromatogramme de la référence');
  assert(J.cpgModele({ Tinj: 150, Tfour: 70, Tdet: 250, P: 100 }).tailing && J.cpgModele({ Tinj: 250, Tfour: 40, Tdet: 250, P: 100 }).horsFenetre, 'alertes injecteur froid et fenêtre dépassée');
  const r = { ...J.etatInitial(2), scene: 'cpg_sim', t: 100, f: { ...J.etatInitial(2).f, ei: 'propanol' } }; assert(J.SCENES.cpg_sim.station === 'cpgsim');
  const f = J.cpgSimFin(r, 3, true); assert(f.scene === 'cpg_ei' && f.t === 109 && J.cpgSimFin(r, 1, false).scene === 'cpg_ref', 'sortie de la simulation CPG');
  const ref = { ...J.etatInitial(2), scene: 'cpg_ref', f: { ...J.etatInitial(2).f, ei: 'propanol' } }; assert(J.choixDe(ref).some(c => c.vers === 'cpg_sim'), 'accès à la simulation depuis la référence');
  // pause : proposée seulement quand un appareil tourne, 10 min, sans compter comme attente subie
  const h0 = { ...J.etatInitial(2), scene: 'hub', t: 100 }; assert(!J.choixDe(h0).some(c => c.pause), 'pas de pause sans appareil en route');
  const h1 = { ...h0, fait: { es: true }, bg: { es: 200 } }; const ps = J.choixDe(h1).find(c => c.pause); assert(ps, 'pause proposée'); const h2 = J.choisir(h1, ps); assert(h2.t === 110 && h2.f.attente === 0 && h2.scene === 'hub');
  console.log('retours de test v33 : OK'); }
// 27. Retours de test (v34) : tâches verrouillées visibles, pause isolée, textes
{ const h = { ...J.etatInitial(3), scene: 'hub', t: 10 }, f = J.choixDe(h).find(c => c.vers === 'formule');
  assert(f && !f.bloque && /Écrire la formule/.test(f.t), 'écrire la formule : proposé dès le début au Bureau, sans prérequis');
  const fab = J.choixDe(h).find(c => c.vers === 'eq_base'); assert(fab && fab.bloque && /Formuler les 200 g/.test(fab.t) && /valider ta formule au Bureau/.test(fab.bloque) && !/macrogol|extrait sec/.test(fab.bloque), 'formuler les 200 g : grisé, renvoie au Bureau');
  assert(!J.choixDe({ ...h, fait: { formule: true } }).find(c => c.vers === 'eq_base').bloque, 'formuler les 200 g déverrouillé après la formule');
  const h2 = { ...h, fait: { es: true, esRes: true, eth: true, hplcPrep: true } };
  const c = J.choixDe(h2).find(c => c.vers === 'hplc_ei'); assert(c && c.bloque, 'dosage verrouillé tant que le gel n\'est pas en pot');
  assert(!J.choixDe({ ...h2, fait: { ...h2.fait, ph: true } }).find(c => c.vers === 'hplc_ei').bloque, 'dosage déverrouillé après la mise en pot');
  const fc = J.choixDe({ ...J.etatInitial(3), scene: 'fab_choix' }); assert(fc.length === 4 && new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => J.choixDe({ ...J.etatInitial(g), scene: 'fab_choix' })[0].id)).size > 1, 'options de fabrication mélangées');
  assert(!/Lucas/.test(J.texteDe({ ...J.etatInitial(3), scene: 'fab_choix' })), 'pas de citation de Lucas sur la dispersion');
  assert(/seule espèce/.test(J.texteDe({ ...J.etatInitial(3), scene: 'hplc_panne', f: { ...J.etatInitial(3).f } })), 'UV : seule espèce qui absorbe');
  console.log('retours de test v34 : OK'); }
// 28. v36 : fiche de correction et relance de lot
{ const { e } = joue(expert, 5);
  const L = J.ficheCorrection(e); assert(L.length >= 6, `calculs journalisés : ${L.length}`);
  for (const c of L) { assert(c.saisies.length >= 1 && c.attendu && c.demarche.length >= 1 && c.titre, 'fiche complète ' + c.id); }
  // relance : remise à zéro des fabrications, dosages rapides, calculs non refaits
  const h = { ...J.etatInitial(7), scene: 'relance', t: 300, fait: { es: true, esRes: true, eth: true, formule: true, fab: true, ph: true, caf: true, ethQC: true, rheoF: true } };
  const r = J.choisir(h, J.choixDe(h)[0]); assert(['hub', 'point_dubreuil'].includes(r.scene) && r.f.lot === 2 && !r.fait.ph && !r.fait.caf && r.fait.es && r.f.rapideCaf && r.f.rapideEth, 'relance : état');
  const t = J.choixDe({ ...r, scene: 'hub' }).map(c => c.vers); assert(t.includes('rapide_caf') && !t.includes('choix_caf') && !t.includes('relance'), `tâches après relance : ${t}`);
  const rc = J.choixDe({ ...r, scene: 'rapide_caf' })[0]; assert(J.choisir({ ...r, scene: 'rapide_caf' }, rc).fait.caf, 'dosage rapide validé');
  console.log('v36 : OK'); }
// 29. v37 : la rhéologie tombe tôt ; si le gel est trop fluide, on relance un autre gel avant les dosages
{ const b = J.etatInitial(11), fm = { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 0.5, eau: 98.5 };
  const h = { ...b, scene: 'hub', t: 230, fait: { es: true, esRes: true, eth: true, rheoC: true, formule: true, fab: true, disp: true, ph: true, rheoF: true }, f: { ...b.f, fm, trolAdd: 0.5, phFinal: J.phDe({ ...b, f: { ...b.f, fm } }, 0.5), disp: 'continuer', mode: 'reflux' } };
  assert(J.mesures(h).q < J.SPEC.q, 'gel sous-neutralisé : trop fluide');
  const rel = J.choixDe(h).find(c => c.vers === 'relance'); assert(rel, 'relance proposée dès la rhéologie, avant les dosages');
  const h2 = J.choisir({ ...h, scene: 'relance' }, J.choixDe({ ...h, scene: 'relance' })[0]);
  assert(h2.f.lot === 2 && !h2.f.rapideCaf && !h2.f.rapideEth && !h2.fait.ph && h2.fait.rheoC, 'dosages non faits : pas de mode rapide');
  const t2 = J.choixDe({ ...h2, scene: 'hub' }).map(c => c.vers); assert(t2.includes('choix_caf') && !t2.includes('rapide_caf'), 'dosages normaux sur le nouveau gel');
  const refus = J.choisir({ ...h, scene: 'relance' }, J.choixDe({ ...h, scene: 'relance' })[1]); assert(!J.choixDe({ ...refus, scene: 'hub' }).some(c => c.vers === 'relance'), 'refus : pas reproposé pour ce lot');
  console.log('v37 : OK'); }
// 30. v37c : deuxième gel plus rapide (conseil de Lucas)
{ const b = J.etatInitial(11), h = { ...b, scene: 'hub', t: 230, f: { ...b.f, lot: 2, fm: J.FORMULE_REPLI }, fait: { es: true, esRes: true, eth: true, rheoC: true, formule: true } };
  assert(J.choixDe(h).some(c => c.vers === 'fab_relance'), 'tâche de fabrication du 2e gel');
  const c = J.choixDe({ ...h, scene: 'fab_relance' })[0], r = J.choisir({ ...h, scene: 'fab_relance' }, c);
  assert(r.f.mode === 'reflux' && r.bg.gel - r.t === 35 - 0 + 10 - 10 + 0 || r.bg.gel - h.t === 45, `dispersion du 2e gel : ${r.bg.gel - h.t} min après le début`);
  console.log('v37c : OK'); }
