// Test : node (après bundle esbuild, voir la procédure habituelle) — parcours aléatoires du scénario « Une journée au labo »
import assert from 'node:assert';
import * as J from './laboJournee.js';

// 1. Données de référence cohérentes avec le sujet (référence Vinnapas, remplacement par l'Orgal)
const eOk = d => ({ f: { regle: 'ok', coadis: 0.525, dpnb: d } });
const pO = J.prop(eOk(3));
const pFiche = J.prop(eOk(3), { ph: 'fiche' });
assert(pFiche.lambda < 0.8 && pO.lambda >= 0.8, 'les prises d\'huile des fiches donnent une peinture non mate, les mesurées une mate');
assert(pO.ES > 50 && pO.lambda >= 0.8 && pO.COV < 30, 'la formule juste respecte le cahier des charges');
assert(J.tmffOk(eOk(3)) && !J.tmffOk(eOk(0)) && !J.tmffOk(eOk(1)), 'sans (ou presque) coalescent, la TMFF de l\'Orgal dépasse 5 °C');
assert(!J.covOk(eOk(10)) && J.covOk(eOk(3)), '10 g de coalescent font dépasser 30 g/L');
assert(J.dpnbOk(3) && !J.dpnbOk(0) && !J.dpnbOk(10));
assert(J.coutKg(J.formule(eOk(3))) < 4.5, 'coût Orgal < 4,5 €/kg');
assert(Math.abs(J.prop(eOk(3)).ES - J.prop({ f: {} }, {}).ES) < 5);
const refP = J.prop({ f: {} }); void refP;
const pN = J.prop({ f: { regle: 'naif' } });
assert(Math.abs(pN.ES - pO.ES) > 2, 'la formule naïve change l\'extrait sec');

// 2. Intégrité du graphe : parcours aléatoires (réponses justes ou fausses aux calculs)
let graine = 12345; const rnd = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };
const fins = {}, longueurs = [];
for (let partie = 0; partie < 6000; partie++) {
  let e = J.etatInitial(), pas = 0;
  const biais = rnd();       // certains parcours sont « sérieux » (choix 0 plus fréquent)
  while (!J.estFin(e.scene)) {
    if (++pas > 400) throw new Error('boucle infinie, scène : ' + e.scene);
    const sc = J.SCENES[e.scene], t0 = e.t;
    if (sc.calcul) {
      const juste = rnd() < 0.6 + 0.3 * biais;
      const r = J.valider(e, juste ? J.SCENES[e.scene].calcul.vrai(e) : 1e6);
      e = r.etat;
    } else {
      const ch = J.choixDe(e, sc);
      assert(ch.length > 0, 'scène sans issue : ' + e.scene);
      const i = rnd() < biais * 0.55 ? 0 : Math.floor(rnd() * ch.length);
      e = J.choisir(e, ch[i]);
    }
    assert(e.t >= t0, 'le temps recule');
  }
  fins[e.scene] = (fins[e.scene] || 0) + 1; longueurs.push(pas);
  const b = J.bilan(e); assert.strictEqual(b.length, 8);
  b.forEach(x => assert(['ok', 'moyen', 'ko', 'nd'].includes(x.niveau)));
  J.texteDe(e);
}
console.log('Fins atteintes :', fins);
longueurs.sort((a, b) => a - b); console.log('Nombre d\'écrans par partie (hasard) : médiane', longueurs[longueurs.length >> 1], ', max', longueurs.at(-1));

// 3. Parcours scénarisés : chaque fin doit être atteignable
const jouer = () => {
  let e = J.etatInitial();
  const go = sub => { const ch = J.choixDe(e); const c = ch.find(x => x.t.includes(sub)); assert(c, `choix introuvable « ${sub} » en ${e.scene} (${ch.map(x => x.t.slice(0, 30)).join(' | ')})`); e = J.choisir(e, c); };
  const calc = () => { e = J.valider(e, J.SCENES[e.scene].calcul.vrai(e)).etat; };
  return { get e() { return e; }, set e(v) { e = v; }, go, calc };
};
function debut(g, o = {}) {
  g.go('Parcourir'); g.go('fiches techniques'); g.go('Continuer');
  g.go(o.alerte === 'tot' ? "J'en parle" : o.alerte === 'tard' ? 'plus tard' : 'Je ne dis rien');
  if (o.alerte === 'tot') g.go('Retourner');
  g.go('La formule et la fiche'); g.go('Revenir au dossier'); g.go("J'ai de quoi");
  g.go(o.plan === 'solo' ? 'tout moi-même' : o.plan === 'mp' ? 'prises d\'huile des poudres' : 'Je formule d');
  if (o.plan === 'solo') g.go('Je me mets');
}
function formulation(g, o = {}) {
  if (o.naif) { g.go('La masse de dispersion de résine'); g.go('Je teste quand même'); }
  else { g.go('La masse de polymère'); g.calc(); g.calc(); }
  if (o.courbe) { g.go('courbe de défloculation'); g.e = J.essaiCourbe(J.essaiCourbe(J.essaiCourbe(J.essaiCourbe(g.e, 0.13), 0.17), 0.21), 0.30); g.go('Retenir 0,19'); g.go('Passer'); } else { g.go('La dose de dispersant'); g.calc(); }
  const d = o.dpnb ?? 3; if (o.banc) { g.go('pré-essai'); g.e = J.essaiBanc(J.essaiBanc(g.e, 0), 3); g.go('Retenir ' + d + ' g'); g.go('Passer à la suite'); } else if (d === 3) { g.go('Calculer la dose'); g.calc(); } else g.go(d === 0 ? 'Rien :' : d === 1 ? 'Ajouter 1 g' : 'Mettre 10 g');
  if (o.stock === 'ignore') { g.go('On l\'utilise comme ça'); g.go(o.insiste ? 'Je n\'ai pas le temps' : 'Tu as raison'); if (o.insiste) return; g.go('fût neuf'); }
  else if (o.stock === 'tamise') { g.go('Je contrôle le fût'); g.go('Tamiser'); }
  else { g.go('Je contrôle le fût'); g.go('fût neuf'); }
  if (o.rate) { g.go('Je mets tout'); g.go('Tout refaire'); } else g.go('Je suis la fiche');
  g.go(o.trace === false ? 'noterai ça' : 'Je note maintenant');
}
function travaille(g, o = {}) {
  const dem = o.dem || ['Lucas : Prises', 'Inès : Extrait', 'Lucas : Profil', 'Lucas : Pouvoir', 'Lucas : Brillance', 'Lucas : Température', 'M. Perrin'];
  const client = () => { if (g.e.scene === 'client') { const ch = J.choixDe(g.e); g.go(o.mens ? 'devrait aller' : ch[0].t.slice(0, 20)); } };
  for (const k of dem) { client(); if (g.e.scene === 'fin_perdue') break; if (g.e.cmd.huile && k.includes('Prises')) continue; g.go('Demander à ' + k); }
  client(); if (!J.estFin(g.e.scene) && g.e.scene === 'labo') g.go('Mettre un échantillon');
  for (let i = 0; i < 90; i++) {
    const e = g.e; if (J.estFin(e.scene)) return e;
    if (e.scene === 'client') { const ch = J.choixDe(e); g.go(o.mens ? 'devrait aller' : ch[0].t.slice(0, 20)); continue; }
    if (e.scene === 'res_cout' || e.scene === 'res_huile') { g.calc(); continue; }
    if (e.scene === 'coalescent') { g.go('Calculer la dose'); continue; }
    if (e.scene === 'calcDpnb') { g.calc(); continue; }
    if (e.scene === 'fabrication') { g.go('Je suis la fiche'); continue; }
    if (e.scene === 'cahier') { g.go('Je note maintenant'); continue; }
    if (e.scene === 'res_tmff') { g.go(J.tmffOk(e) ? 'Retourner' : o.corrige ? 'Corriger la dose' : 'Je garde'); continue; }
    if (e.scene === 'res_es') { g.go(e.f.regle === 'ok' && J.covOk(e) ? 'Retourner' : 'garde cette formule'.length && (e.f.regle === 'ok' ? 'Je garde' : 'garde cette formule')); continue; }
    if (e.scene.startsWith('res_')) { g.e = J.choisir(e, J.choixDe(e)[0]); continue; }
    if (e.scene === 'labo') {
      const ch = J.choixDe(e), lire = ch.find(c => c.t.startsWith('📄'));
      const fini = (o.corrige ? ['es', 'rheo', 'masq', 'tmff'] : ['es', 'rheo', 'masq', 'tmff', 'cout', 'huile', 'brill']).every(k => e.f['mes_' + k]) && e.f.clientFait;
      if (fini || e.t > (o.stop ?? 9999)) { g.go('Rédiger le rapport'); break; }
      if (lire) { g.e = J.choisir(e, lire); continue; }
      const dem2 = ['Température', 'Extrait', 'Profil', 'Pouvoir'].map(k => ch.find(c => c.t.startsWith('Demander à') && c.t.includes(k))).find(Boolean); if (dem2 && o.corrige && !fini) { g.e = J.choisir(e, dem2); continue; }
      g.go('Attendre'); continue;
    }
    throw new Error('scène inattendue ' + e.scene);
  }
  if (g.e.scene === 'rapport') g.go(o.stab || 'Non démontrable');
  if (g.e.scene === 'verdict') g.go('Écouter');
  return g.e;
}
const cas = {};
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 }); cas.fin_excellent = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tot', plan: 'mp' }); formulation(g, { dpnb: 3 }); cas.plan_mp = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tard' }); formulation(g, { dpnb: 3, trace: false, rate: true, stock: 'tamise' }); cas.fin_bon = travaille(g, { stop: 380 }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 }); cas.fin_promesse = travaille(g, { stab: 'Stable 30 mois' }); }
{ const g = jouer(); debut(g, { alerte: 'nul' }); formulation(g, { dpnb: 3 }); cas.fin_cloque = travaille(g, { mens: true }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { naif: true }); g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.fin_naif = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 }); g.go('Demander à Inès : Extrait'); g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.fin_incomplet = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3, stock: 'ignore', insiste: true }); cas.fin_matiere = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 }); cas.fin_ecart = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 10 }); cas.fin_ecart_cov = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 1 }); cas.corrige = travaille(g, { corrige: true, dem: ['Lucas : Température', 'Inès : Extrait', 'Lucas : Profil', 'Lucas : Pouvoir', 'M. Perrin'] }); }
{ const g = jouer(); debut(g, { alerte: 'tot', plan: 'solo' }); formulation(g, { dpnb: 3 }); cas.solo = travaille(g, { stop: 400 }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 }); for (let i = 0; i < 40 && g.e.scene !== 'fin_perdue'; i++) g.go(g.e.scene === 'client' ? 'Je confirme' : 'Attendre'); cas.fin_perdue = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 });
  for (const k of ['Demander à Inès : Extrait', 'Demander à Lucas : Profil', 'Demander à Lucas : Pouvoir']) g.go(k);
  for (let i = 0; i < 80 && !(g.e.t >= 515 && g.e.f.mes_es && g.e.f.mes_rheo && g.e.f.mes_masq && g.e.f.clientFait); i++) {
    const e = g.e, l = J.choixDe(e).find(c => c.t.startsWith('📄'));
    if (e.scene === 'client') g.go('Je confirme'); else if (e.scene.startsWith('res_')) g.e = J.choisir(e, J.choixDe(e)[0]); else if (l) g.e = J.choisir(e, l); else g.go('Attendre');
  }
  g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.retard_ou_autre = g.e; }
const lis = {}; for (const [k, e] of Object.entries(cas)) lis[k] = `${e.scene} à ${J.hhmm(e.t)} (${J.bilan(e).map(b => b.niveau[0]).join('')})`; console.log(lis);
assert.strictEqual(cas.fin_excellent.scene, 'fin_excellent', 'parcours idéal → excellent');
assert.strictEqual(cas.plan_mp.scene, 'fin_excellent', 'plan matières premières → excellent');
assert.strictEqual(cas.fin_bon.scene, 'fin_bon');
assert.strictEqual(cas.fin_ecart.scene, 'fin_ecart'); assert.strictEqual(cas.fin_ecart_cov.scene, 'fin_ecart');
assert(['fin_excellent', 'fin_bon', 'fin_retard'].includes(cas.corrige.scene), 'corriger le coalescent après la TMFF permet de finir : ' + cas.corrige.scene);
assert(J.dpnbOk(cas.corrige.f.dpnb), 'la dose corrigée est bonne');
for (const k of ['fin_promesse', 'fin_cloque', 'fin_naif', 'fin_incomplet', 'fin_matiere', 'fin_perdue']) assert.strictEqual(cas[k].scene, k);
assert.strictEqual(cas.retard_ou_autre.scene, 'fin_retard');

// 3. Station banc TMFF : paramètre caché, essais, débrief
import * as S from './stationsModele.js';
for (let g0 = 1; g0 <= 300; g0++) {
  const sec = S.secretsDe(g0);
  assert(sec.eff >= S.EFF_MIN && sec.eff <= S.EFF_MAX, 'efficacité cachée dans la plage');
  assert(J.dpnbOk(3, sec.eff), '3 g (6 % du polymère sec) restent dans la fenêtre quelle que soit l\'efficacité du lot : ' + sec.eff);
}
{
  const sec = S.secretsDe(42);
  let e = { ...J.etatInitial(), scene: 'stationBanc', f: { regle: 'ok', coadis: 0.525, graine: sec.graine, eff: sec.eff } };
  assert.deepStrictEqual(J.essaiBanc(e, 3).f.banc, J.essaiBanc(e, 3).f.banc, 'lecture reproductible');
  for (const g of [0, 2, 4, 6, 3, 3]) e = J.essaiBanc(e, g);
  assert.strictEqual(e.f.banc.length, 6); assert.strictEqual(J.essaiBanc(e, 5).f.banc.length, 6, 'plafond d\'essais');
  assert.strictEqual(e.t, 30, '5 min par essai');
  const pente = S.penteMesuree(e.f.banc);
  assert(pente && Math.abs(pente.efficacite - sec.eff) < 1, 'la régression retrouve l\'efficacité cachée : ' + JSON.stringify(pente) + ' vs ' + sec.eff);
  assert(J.indiceBanc(J.indiceBanc(e)).f.indB === 2);
  const c = J.choixDe(e).find(x => x.g === 3), n = J.choisir(e, c);
  assert.strictEqual(n.scene, 'debriefBanc'); assert.strictEqual(n.f.dpnb, 3);
  const deb = J.SCENES.debriefBanc.debrief(n);
  assert(deb.length >= 4 && deb[0].ok === true && deb[1].ok === true, 'débrief : TMFF et COV conformes');
  const mauvais = J.SCENES.debriefBanc.debrief(J.choisir({ ...e, f: { ...e.f, banc: [] } }, J.choixDe(e).find(x => x.g === 0)));
  assert(mauvais[0].ok === false && /Remède|Pour corriger|À faire|Pour rattraper/.test(mauvais[0].t) && mauvais.some(l => /aucun essai/.test(l.t)), 'débrief d\'une erreur : cause, effet, remède');
  assert.strictEqual(J.SCENES.debriefBanc.choix(n)[0].vers, 'stock');
  assert(J.resume(n).length === 6);
}
// parcours scripté passant par le banc
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3, banc: true }); const fin = travaille(g, {}); assert(['fin_excellent', 'fin_bon'].includes(fin.scene), 'parcours par le banc : ' + fin.scene); assert(fin.f.preEssai && fin.f.banc.length === 2); }

// 4. Station courbe de défloculation
for (let g0 = 1; g0 <= 300; g0++) { const sec = S.secretsDe(g0); assert(sec.dem >= S.DEM_MIN && sec.dem <= S.DEM_MAX); assert(J.dispOk({ coadis: 0.525, dem: sec.dem }), 'la dose de la fiche (0,175 %) suffit pour tout lot : ' + sec.dem); assert(!J.dispOk({ coadis: 0.2, dem: sec.dem }), 'la dose de départ (0,067 %) est insuffisante'); }
{
  const ref = S.COURBE_REF;
  for (const [x, a, b] of ref) { const v = S.viscoVraie(x, 1); assert(Math.abs(v[0] - a) < 1e-6 && Math.abs(v[1] - b) < 1e-6, 'la courbe passe par les points de référence'); }
  assert.strictEqual(S.viscoVraie(0.06, 1), null, 'hors gamme sous 0,094 %');
  let prec = Infinity; for (let x = 0.095; x < 0.7; x += 0.01) { const v = S.viscoVraie(x, 1)[0]; assert(v <= prec + 1e-9, 'décroissante'); prec = v; }
  const sec = S.secretsDe(7);
  let e = { ...J.etatInitial(), scene: 'stationCourbe', f: { regle: 'ok', graine: sec.graine, dem: sec.dem } };
  for (const x of [0.06, 0.11, 0.15, 0.19, 0.25, 0.30, 0.40, 0.55, 0.21]) e = J.essaiCourbe(e, x);
  assert.strictEqual(e.f.courbe.length, 8, 'plafond de points'); assert.strictEqual(e.t, 16);
  assert.strictEqual(e.f.courbe[0].v258, null);
  const bon = J.choisir(e, J.choixDe(e).find(c => c.x === 0.21));
  assert.strictEqual(bon.scene, 'debriefCourbe'); assert(Math.abs(bon.f.coadis - 0.63) < 1e-9);
  const d = J.SCENES.debriefCourbe.debrief(bon); assert.strictEqual(d[0].ok, true); assert(d.every(l => l.t && l.t.length > 10));
  const bas = J.SCENES.debriefCourbe.debrief(J.choisir({ ...e, f: { ...e.f, courbe: [] } }, J.choixDe(e).find(c => c.x === 0.06)));
  assert.strictEqual(bas[0].ok, false); assert(/Remède|Pour corriger|À faire|Pour rattraper/.test(bas[0].t)); assert(bas.some(l => /aucun point/.test(l.t)));
  assert.strictEqual(J.choisir(e, J.choixDe(e).find(c => c.x === 0.55)).f.dispPct, 0.55);
  assert.strictEqual(J.SCENES.debriefCourbe.debrief(J.choisir(e, J.choixDe(e).find(c => c.x === 0.55)))[0].ok, null, 'surdosage : à nuancer');
}
{ const g = jouer(); debut(g, { alerte: 'tot' }); g.go('La masse de polymère'); g.calc(); g.calc(); g.go('courbe de défloculation'); g.e = J.essaiCourbe(J.essaiCourbe(J.essaiCourbe(g.e, 0.15), 0.19), 0.30); g.go('Retenir 0,19'); assert.strictEqual(g.e.scene, 'debriefCourbe'); g.go('Passer'); assert.strictEqual(g.e.scene, 'coalescent'); assert(J.dispOk(g.e.f)); }

// 5. Station prises d'huile
for (let g0 = 1; g0 <= 300; g0++) { const sec = S.secretsDe(g0); assert(sec.ph.tio2 >= 24 && sec.ph.tio2 <= 26 && sec.ph.caco3 >= 28.8 && sec.ph.caco3 <= 31.2, 'prises d\'huile du lot dans ± 4 %'); }
{
  const sec = S.secretsDe(11);
  let e = { ...J.etatInitial(), scene: 'stationHuile', f: { regle: 'ok', ph: sec.ph, graine: sec.graine } };
  const vrai = J.phVrai(e, 'tio2'), huileFin = vrai / 100 * 10;
  assert.strictEqual(S.etatPate(S.rapportPate(huileFin, vrai)).cle, 'fin');
  let r = J.conclureHuile(e, 'tio2', huileFin * 0.5); assert(!r.ok && r.etat === e, 'trop tôt : rien n\'est consommé');
  r = J.conclureHuile(e, 'tio2', huileFin * 1.2); assert(!r.ok && r.etat.t === 6 && /Remède|Pour corriger|À faire|Pour rattraper/.test(r.message), 'trop tard : 8 min perdues');
  e = r.etat;
  r = J.conclureHuile(e, 'tio2', huileFin); assert(r.ok); e = r.etat;
  r = J.conclureHuile(e, 'tio2', huileFin * 1.02); assert(r.ok); e = r.etat;
  r = J.conclureHuile(e, 'caco3', J.phVrai(e, 'caco3') / 10); assert(r.ok); e = r.etat;
  const T = J.huileRetenue(e, 'tio2'); assert.strictEqual(T.n, 2); assert(Math.abs(T.ph - vrai) < 0.06 * vrai);
  const n = J.choisir(e, J.choixDe(e)[0]);
  assert.strictEqual(n.scene, 'res_huile'); assert(n.cmd.huile.lu); assert(n.f.huileMoi);
  assert(Math.abs(J.prop(n, { ph: 'mesuree' }).lambda - 0.85) < 0.08, 'λ avec les mesures de l\'élève ≈ 0,85');
  const d = J.SCENES.res_huile.debrief(n); assert(d.length >= 4 && d[0].ok === true);
  assert.deepStrictEqual(J.SCENES.res_huile.debrief({ f: {} }), [], 'pas de débrief pour la mesure déléguée');
  assert(typeof J.texteDe(n) === 'string' && /toi-même/.test(J.texteDe(n)));
}

// 6. Station CPG : technique, étalonnage, dosage, conclusion
for (let g0 = 1; g0 <= 200; g0++) { const sec = S.secretsDe(g0); assert(sec.rf >= 0.85 && sec.rf <= 1.15); }
{
  const sec = S.secretsDe(5);
  let e = { ...J.etatInitial(), scene: 'dpnbTech', f: { regle: 'ok', coadis: 0.525, dpnb: 3, fabrique: true, graine: sec.graine, rf: sec.rf, ph: sec.ph, eff: 3 } };
  const imp = J.choisir(e, J.choixDe(e).find(c => /CLHP/.test(c.t)));
  assert.strictEqual(imp.scene, 'dpnbImpasse'); assert.strictEqual(imp.t, 5); assert(/chromophore/.test(J.texteDe(imp)));
  const ok = J.choisir(imp, J.choixDe(imp)[0]); const cpg = J.choisir(ok, J.choixDe(ok).find(c => /CPG|phase gazeuse/.test(c.t)));
  assert.strictEqual(cpg.scene, 'stationCpg'); assert.strictEqual(cpg.f.impasses, 1);
  let x = cpg;
  assert.strictEqual(J.injecterEchantillon(x), x, 'pas d\'injection sans préparation');
  for (const c of [0.25, 0.5, 1, 1.5, 2, 3]) x = J.injecterEtalon(x, c);
  x = J.preparerEchantillon(x); x = J.injecterEchantillon(x); x = J.injecterEchantillon(x);
  assert.strictEqual(x.t, imp.t + 6 * 2 + 4 + 2 * 2);
  const cov = J.covDe(x);
  const R = J.resultatCpg(x); assert(R.dos && R.dos.dansDomaine, 'dosage dans le domaine');
  assert(Math.abs(R.cov - cov) < 3 * R.U && R.U < 0.4 * cov, 'COV mesuré compatible avec la valeur calculée, incertitude raisonnable : ' + R.cov + ' ± ' + R.U + ' vs ' + cov);
  const sans = J.resultatCpg(J.choisirModeCpg(x, 'externe'));
  assert(sans.D.residRel > R.D.residRel, 'l\'étalon interne réduit la dispersion des résidus');
  assert.strictEqual(J.recuperation(x), null);
  let xc = J.injecterControle(J.injecterControle(x)); assert.strictEqual(J.injecterControle(xc), xc, 'plafond');
  const rc = J.recuperation(xc); assert(rc && Math.abs(rc.taux - 100) < 8, 'la solution de contrôle est retrouvée à ± 8 % : ' + (rc && rc.taux));
  assert(J.SCENES.debriefCpg.debrief(J.choisir(xc, J.choixDe(xc)[0])).some(l => /Justesse : la solution/.test(l.t)));
  assert(J.SCENES.debriefCpg.debrief(J.choisir(x, J.choixDe(x)[0])).some(l => /Justesse non vérifiée/.test(l.t)));
  const ch = J.choixDe(x); assert.strictEqual(ch.length, 3);
  for (const c of ch) { const n = J.choisir(x, c); assert.strictEqual(n.scene, 'debriefCpg'); assert(J.SCENES.debriefCpg.debrief(n).every(l => l.t.length > 10)); }
  const u = J.SCENES.debriefCpg.debrief(J.choisir(x, ch.find(c => c.concl === 'u'))); assert(u.some(l => /expression complète/.test(l.t)));
  const f = J.SCENES.debriefCpg.debrief(J.choisir(x, ch.find(c => c.concl === 'faux'))); assert(f.some(l => l.ok === false && /contredit/.test(l.t)));
  assert.strictEqual(J.choixDe({ ...e, scene: 'stationCpg' })[0].vers, 'labo', 'sans résultat : abandon possible');
}

// 7. Parcours « tout faire » : les quatre stations, puis rapport : la journée doit rester jouable
{
  const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3, banc: true, courbe: true });
  const t1 = g.e.t;
  g.go('Mesurer moi-même'); let e = g.e;
  for (const [k, m] of [['tio2', 2.5], ['caco3', 3.0]]) { const r = J.conclureHuile(e, k, J.phVrai(e, k) / 10); assert(r.ok); e = r.etat; void m; }
  g.e = e; g.go('Consigner'); g.calc();
  g.go('Doser le DPnB'); g.go('phase gazeuse'); e = g.e;
  for (const c of [0.25, 0.5, 1, 2, 3]) e = J.injecterEtalon(e, c);
  e = J.injecterEchantillon(J.preparerEchantillon(e)); e = J.injecterEchantillon(e); g.e = e;
  g.go('± '); g.go('Retourner');
  g.e = { ...g.e, cmd: { ...g.e.cmd } };
  console.log('Tout faire : fabriqué vers', J.hhmm(t1), '; après stations', J.hhmm(g.e.t));
  assert(g.e.f.mes_huile && g.e.f.mes_dpnb && g.e.f.preEssai && g.e.f.dispCourbe);
  const fin = travaille(g, { dem: ['Inès : Extrait', 'Lucas : Profil', 'Lucas : Pouvoir', 'Lucas : Brillance', 'Lucas : Température', 'M. Perrin'] });
  console.log('Tout faire : fin', fin.scene, J.hhmm(fin.t), J.bilan(fin).map(b => b.niveau[0]).join(''));
  assert(['fin_excellent', 'fin_bon'].includes(fin.scene), 'le parcours complet doit aboutir à une bonne fin : ' + fin.scene);
}
console.log('OK : une journée au labo');

// 8. Dossier : documents vus + variation des formulations
{
  let e = J.etatInitial(); assert.deepStrictEqual(J.docsVus(e), ['cdc']);
  e = J.aller(e, 'docRef'); assert(J.docsVus(e).includes('formule') && J.docsVus(e).includes('fabrication') && J.docsVus(e).includes('cdc'));
  assert.deepStrictEqual(J.docsVus({ f: {} }), ['cdc'], 'ancienne sauvegarde sans vus');
  const L = ['a', 'b', 'c'], vus = new Set(Array.from({ length: 30 }, (_, g) => J.vari({ f: { graine: g } }, 'x', L)));
  assert(vus.size > 1, 'les formulations varient selon la partie');
  assert.strictEqual(J.vari({ f: { graine: 5 } }, 'x', L), J.vari({ f: { graine: 5 } }, 'x', L), 'stable pour une même partie');
}
console.log('OK : dossier et variations');
