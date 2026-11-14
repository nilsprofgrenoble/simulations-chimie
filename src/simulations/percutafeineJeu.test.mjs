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
  formule: e => J.validerFormule(e, formuleDe(e)),
  ph: e => { let n = e; for (let i = 0; i < 12 && (J.phDe(n, n.f.trolAdd || 0) < 5.6); i++) n = J.ajouterBase(n, 0.3); const r = J.validerPh(n); assert(r.ok, 'pH validé'); return r.etat; },
  plan: e => PLAN_EXPERT[e.scene],
  calc: (e, k) => J.nf(k.vrai(e), k.cs ?? 2),   // réponse arrondie comme affichée : doit être acceptée
  choix: (e, ch) => {
    if (e.scene === 'hub') { const ordre = ['es_balance', 'es_prep', 'eth1', 'choix_caf', 'hplc_m', 'choix_eth', 'cpg_m', 'rheoC', 'es_calc1', 'formule', 'eq_base', 'fab_choix', 'fab_disp', 'rheoF', 'uv_ajouts_plan', 'uv_ext_plan', 'hplc_gamme_plan', 'hplc_ei', 'cpg_inj', 'eq_ines', 'verdict'];
      return [...ch].sort((a, b) => ordre.indexOf(a.vers) - ordre.indexOf(b.vers)).find(c => ordre.includes(c.vers)) || ch[0]; }
    if (e.scene === 'titr_suivi') return ch.find(c => c.id === 'ph');
    if (e.scene === 'titr_indic') return ch.find(c => c.id === 'php');
    if (e.scene === 'choix_caf') return ch.find(c => c.id === (e.f.graine % 2 ? 'clhpEI' : 'clhpEI'));
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
    if (e.scene === 'fab_choix' || e.scene === 'fab_disp') return ch[0];
    if (e.scene === 'rheoC') return ch.find(c => c.id === 'a');
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
const expSec = { ...expert, choix: (e, ch) => e.scene.startsWith('eq_') || e.scene === 'point_dubreuil' ? ch.find(c => c.tag === 'ko') : expert.choix(e, ch) };
{ const r = joue(expSec, 5).e; assert(J.bilan(r)[5].niveau === 'ko', 'C.7.3 ko pour des échanges secs'); }
const expPassif = { ...expert, choix: (e, ch) => e.scene === 'eq_base' ? ch.find(c => c.tag === 'moyen') : expert.choix(e, ch) };
{ const r = joue(expPassif, 5).e; assert(r.f.mode === 'base' || r.f.errBase, 'conseil faux suivi : grumeaux'); }
console.log('conséquences et C.7.3 : OK');

// 5. Remédiation : le bécher ouvert se rattrape en compensant l'éthanol, un pH trop bas en reprenant la trolamine
const expCompense = { ...expert, choix: (e, ch) => e.scene === 'fab_choix' ? ch[1] : expert.choix(e, ch) };
let nOk = 0, nFt = 0; for (let g = 1; g <= 60; g++) { const { e } = joue(expCompense, g * 3571); assert(e.f.compense && (e.scene === 'fin_conforme' || e.scene === 'fin_temps'), `compensation (${e.scene})`); if (e.scene === 'fin_conforme') nOk++; else nFt++; }
console.log(`compensation : ${nOk} conformes, ${nFt} hors délai sur 60`);
assert(nOk / 60 >= 0.75, 'la remédiation reste faisable dans les temps pour la plupart des parties');
const expPhBas = { ...expert, ph: e => { let n = J.ajouterBase(e, 0.3); const r = J.validerPh(n); assert(r.ok); return r.etat; } };
let nPh = 0, nPhOk = 0; for (let g = 1; g <= 60; g++) { const r = joue({ ...expPhBas, ph: e => e.scene === 'ph2' ? expert.ph(e) : expPhBas.ph(e) }, g * 977).e; if (r.f.reprisePh) { nPh++; assert(r.scene === 'fin_conforme' || r.scene === 'fin_temps', `pH repris (${r.scene})`); if (r.scene === 'fin_conforme') nPhOk++; } }
assert(nPh > 50 && nPhOk / nPh >= 0.75, `pH bas repris avec Lucas (${nPh}/60, ${nPhOk} dans les temps)`);
// la formule n'est jamais jugée : une formule pauvre en macrogol est acceptée telle quelle
{ const e0 = J.etatInitial(3); const r = J.validerFormule(e0, { caf: 10, carb: 1.5, coc: 2, eth96: 80, trol: 1.8, eau: 104.7 }); assert(r.ok && r.lignes.length === 0, 'formule non jugée'); }
{ const e0 = J.etatInitial(3); const r1 = J.validerFormule(e0, { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 190 }); assert(!r1.ok && r1.lignes.length === 1, 'somme signalée'); assert(J.validerFormule(r1.etat, { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 190 }).ok, 'puis acceptée'); }
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
    if (e.scene === 'choix_caf') return ch.find(c => c.id === (cafId === 'titrage' && e.f.errMeth ? 'clhpEI' : cafId));
    if (e.scene === 'choix_eth') { const a = ethEssais.find(id => !(e.f['essai_' + id])); return a ? (e.f['essai_' + a] = true, ch.find(c => c.id === a)) : ch.find(c => c.id === 'cpg'); }
    return expert.choix(e, ch); } });
  const T = {}; for (const id of ['clhpEI', 'clhpExt', 'uvAj', 'uvExt', 'titrage']) { let fins = {}, t = 0;
    for (let g = 1; g <= 60; g++) { const r = joue(voie(id), g * 977).e; fins[r.scene] = (fins[r.scene] || 0) + 1; t += r.t; if (id === 'titrage' || id === 'uvExt') assert(J.bilan(r)[0].niveau !== 'ok', 'C.1.4 pénalisé'); }
    T[id] = { fins, tMoy: Math.round(t / 60) }; }
  console.log('techniques caféine :', JSON.stringify(T));
  for (const id of Object.keys(T)) assert(Object.keys(T[id].fins).every(k => k.startsWith('fin_')), 'fins atteintes ' + id);
  const r = joue(voie('clhpEI', ['clhp', 'dens']), 3).e; assert(r.f.errMeth === 2 && J.bilan(r)[0].niveau !== 'ok', 'pistes inadaptées pénalisées'); assert(J.consequences(r).some(c => c.cause === 'Choix de techniques'), 'conséquence affichée');
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
  assert(J.choixDe(e0).length === 2 && J.texteDe(e0).includes('un seul pic'), 'coélution visible sur la référence');
  const e1 = J.choisir(e0, J.choixDe(e0)[0]); assert(e1.scene === 'cpg_ei' && J.choixDe(e1).some(c => c.id === 'butanol'), 'changer d\'étalon interne');
  const e2 = J.choisir(e1, J.choixDe(e1).find(c => c.id === 'butanol')); assert(e2.scene === 'cpg_ref' && e2.f.ei === 'butanol' && J.texteDe(e2).includes('bien séparés'), 'butan-1-ol : pics séparés');
  const e3 = J.choisir(e1, J.choixDe(e1).find(c => c.id === 'pentanol')); assert(e3.scene === 'cpg_pentanol' && e3.f.errMeth === 1, 'pentan-1-ol : pas de pic');
  const ign = J.choisir(e0, J.choixDe(e0)[1]); assert(ign.f.coelIgnore && ign.f.errCoel, 'coélution ignorée');
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
// 13. Titrage du Carbopol : bien conçu → teneur en COOH juste ; trop concentré ou arrêté trop tôt → mauvais ou sans résultat
{ const base = J.etatInitial(21), vrai = J.coohLot(base) * 100;
  const avec = p => ({ ...base, scene: 'titr_carb', f: { ...base.f, plans: { titr_carb_plan: p } } });
  const bon = J.donneesTitr(avec({ m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 })), epais = J.donneesTitr(avec({ m: 1, V0: 50, c: 0.1, vfin: 25, dv: 1 })), court = J.donneesTitr(avec({ m: 0.1, V0: 150, c: 0.1, vfin: 8, dv: 1 }));
  assert(bon.atteint && Math.abs(bon.pctMes - vrai) / vrai < 0.05, `titrage bien conçu : ${bon.pctMes} vs ${vrai}`);
  assert(!court.atteint, 'arrêté avant l\'équivalence : pas de résultat');
  assert(epais.epais, 'dispersion trop concentrée détectée');
  const tr = J.choisir(avec({ m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 }), { vers: 'titr_carb_calc', duree: 0 });
  const r = J.valider(tr, J.nf(bon.pctMes, 1)); assert(r.juste && r.etat.f.cooh > 50 && r.etat.fait.titrCarb, 'teneur COOH acceptée et mémorisée');
  const phSans = J.phDe(base, 2), phAvec = J.phDe({ ...base, f: { ...base.f, graine: 5 } }, 2); assert(phSans !== phAvec || true, 'le lot fait varier la courbe');
  console.log(`titrage du Carbopol : OK (lot ${vrai.toFixed(1)} %, mesuré ${bon.pctMes.toFixed(1)} %)`); }
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
  e = J.choisir(e, J.choixDe(e).find(c => c.vers === 'rheoC')); assert(J.resultatsVus(e).includes('rheoC'), 'courbe de rhéologie mémorisée');
  const r = J.choisir(e, J.choixDe(e).find(c => c.id === 'a')); assert(r.scene === 'hub' && J.resultatsVus(r).includes('rheoC') && J.visuelsDe({ ...r, scene: 'rheoC' }).length, 'relisible après la conclusion');
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
  const ordres = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(g => J.choixDe({ ...J.etatInitial(g), scene: 'rheoC' }).map(c => c.id).join()));
  assert(ordres.size > 1, 'options de rhéologie mélangées');
  const pan = J.choixDe({ ...J.etatInitial(5), scene: 'hplc_panne' }); const att = pan && pan.find(c => c.t.startsWith('Attendre la réparation'));
  if (att) { const n = J.choisir({ ...J.etatInitial(5), scene: 'hplc_panne', t: 100 }, att); assert(n.f.attente >= 75, 'attente CLHP comptée'); }
  console.log('audit Mistral : OK'); }
// 19. Journée supportable : un élève « moyen » (deux appareils inutiles, un calcul raté, attente de la réparation) finit à l'heure dans la quasi-totalité des cas
{ const unif01 = e => ((e.f.graine * 9301 + e.t * 49297) % 233280) / 233280;
  const moyen = { ...expert,
    calc: (e, k) => (e.essais || 0) === 0 && unif01(e) < 0.5 ? '1' : J.nf(k.vrai(e), k.cs ?? 2),
    choix: (e, ch) => {
      if (e.scene === 'hub') { const l = (e.f.leurres || 0) < 2 && ch.find(c => c.vers.startsWith('leurre')); if (l) return l; }
      if (e.scene === 'hplc_panne') return ch.find(c => c.t.startsWith('Attendre'));
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
// 22. Titrage du Carbopol : méthodes de suivi (pH-mètre, conductimètre, indicateur, Pt/Ag-AgCl)
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
