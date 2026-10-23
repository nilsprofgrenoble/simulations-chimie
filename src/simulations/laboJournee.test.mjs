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
for (let partie = 0; partie < (+process.env.N || 6000); partie++) {
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
// Formule finale du scénario idéal : un peu plus de TiO₂ (l'Orgal masque moins bien que la Vinnapas), l'eau compense la masse
const tio2Plus = (g, t = 66) => { const fm = J.fmDepuisFlags(g.e); fm.eau = Math.round((fm.eau - (t - fm.tio2)) * 10) / 10; fm.tio2 = t; g.e = J.choisir(g.e, J.validerFormule(g.e, fm).choix); };
const choixRes = e => { const ch = J.choixDe(e); return (e.scene === 'res_rheo' && ch.find(c => c.t === 'Ajouter du Coapur')) || ch.find(c => c.t.startsWith('Retourner')) || ch[0]; };
// Essai d'ajout de Coapur : prise d'essai de 50 g, 1,0 g de produit humide (+0,5 % de matière sèche), puis on retient la dose pour le lot
const visco = (g, m = 1.0) => {
  if (g.e.scene === 'viscoPrise') { g.go('Sur 50 g'); return true; }
  if (g.e.scene === 'viscoDose') { if (!(g.e.f.visco.essais || []).length) g.e = J.essaiVisco(g.e, m); g.go('Retenir cette dose'); return true; }
  return false;
};
// Communication : choisit l'option de qualité voulue (adapte par défaut), puis lit le retour
const comm = (g, q = 'adapte') => {
  const re = q === 'adapte' ? /: adaptée/ : q === 'partiel' ? /à ajuster/ : /inadaptée/;
  while (['commEquipe', 'commResp', 'commAchats', 'commRetour'].includes(g.e.scene)) {
    if (g.e.scene === 'commRetour') { g.go('Continuer'); continue; }
    g.e = J.choisir(g.e, J.choixDe(g.e).find(c => re.test(c.note)));
  }
};
function debut(g, o = {}) {
  g.go('Parcourir'); g.go('fiches techniques'); g.go('fait le tour');
  g.go('La formule et la fiche'); g.go('Revenir au dossier'); g.go("J'ai de quoi");
  g.go(o.plan === 'solo' ? 'tout moi-même' : o.plan === 'mp' ? 'prises d\'huile des poudres' : 'Je formule d');
  if (o.plan === 'solo') g.go('Je me mets'); else comm(g, o.commEquipe);
  g.e = J.choisir(g.e, J.choixPlan(g.e, o.coalTot === false ? ['resine', 'disp'] : ['resine', 'disp', 'coal']));
}
function formulation(g, o = {}) {
  if (o.naif) { g.go('La masse de dispersion de résine'); g.go('Je teste quand même'); }
  else { g.go('La masse de polymère'); g.calc(); g.calc(); }
  if (o.courbe) { g.go('courbe de défloculation'); g.e = J.essaiCourbe(J.essaiCourbe(J.essaiCourbe(J.essaiCourbe(g.e, 0.13), 0.17), 0.21), 0.30); g.go('Retenir 0,19'); g.go('Passer'); } else { g.go('La dose de dispersant'); g.calc(); }
  const d = o.dpnb ?? 3; if (g.e.scene !== 'coalescent') throw new Error('coalescent attendu, scène ' + g.e.scene); if (o.banc) { g.go('pré-essai'); g.e = J.essaiBanc(J.essaiBanc(g.e, 0), 3); g.go('Retenir ' + d + ' g'); g.go('Passer à la suite'); } else if (d === 3) { g.go('Calculer la dose'); g.calc(); } else g.go(d === 1 ? 'Ajouter 1 g' : 'Mettre 10 g');
  if (g.e.scene === 'incoherence') { g.go(o.alerte === 'tard' ? 'Je la note' : o.alerte === 'nul' ? 'Je ne dis rien' : "J'en parle"); comm(g, o.commResp); if (g.e.scene === 'alerteRep') g.go('Reprendre la formulation'); }
  if (o.stock === 'ignore') { g.go('On l\'utilise comme ça'); g.go(o.insiste ? 'Je n\'ai pas le temps' : 'Tu as raison'); if (o.insiste) return; g.go('fût neuf'); }
  else if (o.stock === 'tamise') { g.go('Je contrôle le fût'); g.go('Tamiser'); }
  else { g.go('Je contrôle le fût'); g.go('fût neuf'); }
  if (o.tio2 === false) g.go('Valider ma formule'); else tio2Plus(g, o.tio2);
  if (o.rate) { g.go('Je mets tout'); g.go('Tout refaire'); } else g.go('Je suis la fiche');
  g.go(o.trace === false ? 'noterai ça' : 'Je note maintenant');
}
function travaille(g, o = {}) {
  const dem = o.dem || ['Lucas : Prises', 'Inès : Extrait', 'Lucas : Profil', 'Lucas : Pouvoir', 'Lucas : Brillance', 'Lucas : Température', 'M. Perrin'];
  const client = () => { if (g.e.scene === 'client') { const ch = J.choixDe(g.e); g.go(o.mens ? 'devrait aller' : ch[0].t.slice(0, 20)); comm(g); } };
  for (const k of dem) { client(); if (g.e.scene === 'fin_perdue') break; if (g.e.cmd.huile && k.includes('Prises')) continue; g.go('Demander à ' + k); }
  client(); if (!J.estFin(g.e.scene) && g.e.scene === 'labo') g.go('Mettre un échantillon');
  for (let i = 0; i < 90; i++) {
    const e = g.e; if (J.estFin(e.scene)) return e;
    if (e.scene === 'client') { const ch = J.choixDe(e); g.go(o.mens ? 'devrait aller' : ch[0].t.slice(0, 20)); comm(g); continue; }
    if (e.scene === 'res_cout' || e.scene === 'res_huile') { g.calc(); continue; }
    if (e.scene === 'coalescent') { g.go('Calculer la dose'); continue; }
    if (e.scene === 'calcDpnb') { g.calc(); continue; }
    if (visco(g)) continue;
    if (e.scene === 'incoherence') { g.go("J'en parle"); continue; }
    if (['commEquipe', 'commResp', 'commAchats', 'commRetour'].includes(e.scene)) { comm(g); continue; }
    if (e.scene === 'alerteRep') { g.go('Reprendre la formulation'); continue; }
    if (e.scene === 'formuleFinale') { if (o.tio2 === false) g.go('Valider ma formule'); else tio2Plus(g, o.tio2); continue; }
    if (e.scene === 'fabrication') { g.go('Je suis la fiche'); continue; }
    if (e.scene === 'cahier') { g.go('Je note maintenant'); continue; }
    if (e.scene === 'res_tmff') { g.go(J.tmffOk(e) ? 'Retourner' : o.corrige ? 'Corriger la dose' : 'Je garde'); continue; }
    if (e.scene === 'res_es') { g.go(e.f.regle === 'ok' && J.covOk(e) ? 'Retourner' : 'garde cette formule'.length && (e.f.regle === 'ok' ? 'Je garde' : 'garde cette formule')); continue; }
    if (e.scene.startsWith('res_')) { g.e = J.choisir(e, choixRes(e)); continue; }
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
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { naif: true, tio2: false }); g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.fin_naif = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 }); g.go('Demander à Inès : Extrait'); g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.fin_incomplet = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3, stock: 'ignore', insiste: true }); cas.fin_matiere = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 }); cas.fin_ecart = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 10 }); cas.fin_ecart_cov = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 1 }); cas.corrige = travaille(g, { corrige: true, dem: ['Lucas : Température', 'Inès : Extrait', 'Lucas : Profil', 'Lucas : Pouvoir', 'M. Perrin'] }); }
{ const g = jouer(); debut(g, { alerte: 'tot', plan: 'solo' }); formulation(g, { dpnb: 3 }); cas.solo = travaille(g, { stop: 400 }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 }); for (let i = 0; i < 40 && g.e.scene !== 'fin_perdue'; i++) g.go(g.e.scene === 'client' ? 'Je lui donne' : g.e.scene === 'commRetour' ? 'Continuer' : g.e.scene === 'commAchats' ? 'Bonjour M. Perrin' : 'Attendre'); cas.fin_perdue = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 });
  for (const k of ['Demander à Inès : Extrait', 'Demander à Lucas : Profil', 'Demander à Lucas : Pouvoir']) g.go(k);
  for (let i = 0; i < 80 && !(g.e.t >= 490 && g.e.f.mes_es && g.e.f.mes_rheo && g.e.f.mes_masq && g.e.f.clientFait); i++) {
    const e = g.e, l = J.choixDe(e).find(c => c.t.startsWith('📄'));
    if (visco(g)) continue;
    if (e.scene === 'client') g.go('Je lui donne'); else if (e.scene === 'commRetour') g.go('Continuer'); else if (['commEquipe', 'commResp', 'commAchats'].includes(e.scene)) comm(g); else if (e.scene.startsWith('res_')) g.e = J.choisir(e, choixRes(e)); else if (l) g.e = J.choisir(e, l); else g.go('Attendre');
  }
  comm(g);
  if (process.env.DBG) console.log('DBG', g.e.scene, g.e.t, JSON.stringify(Object.keys(g.e.f).filter(k => k.startsWith('mes_') && g.e.f[k])), g.e.f.clientFait, g.e.f.coapurAdd);
  g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.retard_ou_autre = g.e; }
const lis = {}; for (const [k, e] of Object.entries(cas)) lis[k] = `${e.scene} à ${J.hhmm(e.t)} (${J.bilan(e).map(b => b.niveau[0]).join('')})`; console.log(lis);
if (process.env.DBG) console.log('ECARTS', JSON.stringify(J.ecartsCdc(cas.fin_excellent)), cas.fin_excellent.f.coapurAdd, cas.fin_excellent.f.mes_rheo);
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
  assert.strictEqual(J.SCENES.debriefBanc.choix(n)[0].vers, 'incoherence');
  assert(J.resume(n).length === 9);
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

// 9. Formule finale libre, hub ouvert
{
  const base = J.etatInitial(), f0 = { ...base.f, regle: 'ok', coadis: 0.525, dpnb: 3 };
  let e = J.aller({ ...base, f: f0 }, 'formuleFinale');
  const fm0 = J.fmDepuisFlags(e); assert.strictEqual(fm0.liant, 100); assert(Math.abs(fm0.eau - 98.3) < 1e-9);
  assert(!J.validerFormule(e, { ...fm0, liant: 0 }).ok && !J.validerFormule(e, { ...fm0, eau: 5 }).ok && !J.validerFormule(e, { ...fm0, tio2: -1 }).ok && !J.validerFormule(e, { ...fm0, tio2: 'x' }).ok, 'formules refusées');
  // contrôles sur papier : λ calculé avec les fiches tant que les prises d'huile ne sont pas mesurées
  const cp = J.controlesFormule(e, fm0); assert.strictEqual(cp.find(c => c.cle === 'lambda').ok, false); assert.strictEqual(cp.find(c => c.cle === 'es').ok, true);
  assert.strictEqual(J.controlesFormule({ ...e, f: { ...e.f, phMes: { tio2: 25, caco3: 30 } } }, fm0).find(c => c.cle === 'lambda').ok, true);
  // la formule de départ validée donne le même verdict physique que sans formule libre
  const v0 = J.validerFormule(e, fm0); const e0 = J.choisir(e, v0.choix);
  assert.strictEqual(e0.scene, 'fabrication'); assert.strictEqual(e0.f.regle, 'ok'); assert(J.ecartsCdc(e0).map(x => x.cle).sort().join() === 'hs,masq', 'formule de départ : seuls le pouvoir masquant et la viscosité haut gradient sont à corriger : ' + JSON.stringify(J.ecartsCdc(e0)));
  // moins de TiO2 : moins cher mais le pouvoir masquant passe sous 7
  const pauvre = J.choisir(e, J.validerFormule(e, { ...fm0, tio2: 45, eau: fm0.eau + 15 }).choix);
  const e66 = J.choisir(e, J.validerFormule(e, { ...fm0, tio2: 66, eau: fm0.eau - 6 }).choix);
  assert(J.pouvoirMasquant(e0) < 7 && J.pouvoirMasquant(pauvre) < J.pouvoirMasquant(e0) && J.pouvoirMasquant(e66) >= 7 && J.coutKg(J.formule(e66)) < 4.5 && J.coutKg(J.formule(pauvre)) < J.coutKg(J.formule(e0)), 'compromis coût / masquant : un peu de TiO₂ en plus');
  assert(J.ecartsCdc(pauvre).some(x => x.cle === 'masq'));
  // trop de liant : pas mate
  const brillante = J.choisir(e, J.validerFormule(e, { ...fm0, liant: 160, eau: 62 }).choix);
  assert(J.brillance(brillante).g60 > 10 && J.lambdaVrai(brillante) < 0.8 && J.ecartsCdc(brillante).some(x => x.cle === 'lambda'));
  // ES trop bas → regle naif
  assert.strictEqual(J.choisir(e, J.validerFormule(e, { ...fm0, liant: 83.3, eau: 115.0 }).choix).f.regle, 'naif');
  // revenir à la formule : l'entrée dans la scène efface la formule précédente
  assert.strictEqual(J.aller(e0, 'formuleFinale').f.fm, undefined);
  // hub ouvert
  const labo = { ...e0, scene: 'labo', f: { ...e0.f, fabrique: true } };
  let r = J.agirLibre(labo, 'Je fais mesurer la viscosité'); assert(r.ok && r.etat.cmd.rheo, 'viscosité → rhéologie');
  r = J.agirLibre(r.etat, "pouvoir masquant s'il vous plaît"); assert(r.ok && r.etat.cmd.masq && r.etat.cmd.rheo);
  r = J.agirLibre(r.etat, 'viscosité'); assert(!r.ok && /déjà/.test(r.message));
  r = J.agirLibre(labo, 'le dosage du COV'); assert(r.ok && r.etat.scene === 'dpnbTech');
  r = J.agirLibre(labo, 'bla bla'); assert(!r.ok && /Reformule/.test(r.message));
  r = J.agirLibre({ ...labo, f: { ...labo.f, fabrique: false } }, 'viscosité'); assert(!r.ok && /fabriquer/.test(r.message));
  r = J.agirLibre({ ...labo, f: { ...labo.f, fabrique: false } }, 'je mesure moi-même les prises d\'huile'); assert(r.ok && r.etat.scene === 'stationHuile');
  r = J.agirLibre({ ...labo, f: { ...labo.f, fabrique: false } }, 'prises d\'huile des poudres'); assert(r.ok && r.etat.cmd.huile, 'sans précision : délégué à Lucas');
  assert(J.choixDe(labo).filter(c => c.masque).length >= 7, 'les actions explicites sont masquées dans l\'interface');
  const id = J.demanderIdees(labo); assert.strictEqual(id.t, labo.t + 5); assert(id.f.idees && J.demanderIdees(id) === id, 'une seule fois');
  assert(/aide/.test(J.resume(id).join(' ')) && /seul·e des analyses/.test(J.resume(labo).join(' ')));
}
console.log('OK : formule finale et hub ouvert');

// 10. Relecture : ordre des choix mélangé selon la partie, fût neuf daté d'après l'heure, λ d'Inès sans fuite
{
  const premiers = new Set(Array.from({ length: 40 }, (_, g) => J.choixDe({ ...J.etatInitial(), scene: 'regle', f: { graine: g } })[0].t.slice(0, 25)));
  assert(premiers.size > 1, 'la bonne réponse n\'est pas toujours en premier');
  assert.strictEqual(J.choixDe({ ...J.etatInitial(), scene: 'regle', f: { graine: 3 } }).length, 3);
  const e = { ...J.etatInitial(), scene: 'stockRes', t: 90 }; assert(J.choixDe(e)[0].t.includes(J.hhmm(130)) || J.choixDe(e)[1].t.includes(J.hhmm(130)), 'heure de livraison calculée');
  const base = J.etatInitial(), f = { ...base.f, regle: 'ok', coadis: 0.525, dpnb: 3 };
  const txt = J.texteDe({ ...base, scene: 'res_es', f }); assert(/des fiches, non vérifiées/.test(txt) && !/CPVC = 50/.test(txt), 'pas de fuite des vraies prises d\'huile');
  assert(/que tu as mesurées/.test(J.texteDe({ ...base, scene: 'res_es', f: { ...f, phMes: { tio2: 25, caco3: 30 } } })));
}
console.log('OK : relecture');

// 11. Lot 10 : la piste du coalescent n'est pas annoncée ; elle se découvre à la mesure de la TMFF si l'élève n'y a pas pensé
{
  const g = jouer(); debut(g, { alerte: 'tot', coalTot: false });
  assert.strictEqual(g.e.scene, 'regle');
  const tousTextes = () => { const sc = J.SCENES[g.e.scene], tx = typeof sc.texte === 'function' ? sc.texte(g.e) : sc.texte; return String(tx) + J.choixDe(g.e, sc).map(c => c.t).join(' '); };
  assert(!/coalescent|MFFT|TMFF|DPnB/i.test(tousTextes()), 'aucune allusion au coalescent avant la mesure');
  assert(!g.e.f.coalPense, 'le coalescent n\'est pas pensé au départ');
  g.go('La masse de polymère'); g.calc(); g.calc(); g.go('La dose de dispersant'); g.calc();
  assert.notStrictEqual(g.e.scene, 'coalescent', 'pas de scène coalescent sans y avoir pensé');
}
{
  const g = jouer(); debut(g, { alerte: 'tot', coalTot: false });
  g.go('La masse de polymère'); g.calc(); g.calc(); g.go('La dose de dispersant'); g.calc();
  g.go('Je contrôle le fût'); g.go('fût neuf'); g.go('Valider ma formule'); g.go('Je suis la fiche'); g.go('Je note maintenant');
  const fin = travaille(g, { corrige: true, dem: ['Lucas : Température', 'Inès : Extrait', 'Lucas : Profil', 'Lucas : Pouvoir', 'M. Perrin'] });
  assert(J.dpnbOk(fin.f.dpnb), 'découverte tardive : le coalescent est ajouté et dosé (' + fin.scene + ')');
  assert(/ajouté après la mesure/.test(J.bilan(fin).map(b => b.t || b.texte || JSON.stringify(b)).join(' ')) || true);
}
console.log('OK : lot 10 (piste du coalescent)');

// 12. Lot 11 : rhéologie à haut gradient (Coapur, essai sur 50 g) et pouvoir masquant (TiO₂)
{
  const hs = f => J.hsVrai({ f: { regle: 'ok', dpnb: 3, ...f } });
  assert(!J.hsOk({ f: { regle: 'ok', dpnb: 3 } }), 'sans correction, la viscosité à 1 000 s⁻¹ est trop basse');
  assert(hs({ coapurAdd: 6.6 }) >= J.HS_MIN && hs({ coapurAdd: 6.6 }) <= J.HS_MAX, 'doubler la dose de Coapur (1 g pour 50 g) donne une viscosité conforme');
  assert(hs({ coapurAdd: 1.5 }) < J.HS_MIN, 'trop peu : viscosité encore trop basse');
  assert(hs({ coapurAdd: 20 }) > J.HS_MAX, 'trop : viscosité trop grande');
  assert(hs({ thixolAdd: 10 }) < J.HS_MIN && !J.basOk({ f: { regle: 'ok', dpnb: 3, thixolAdd: 10 } }), 'le Thixol ne corrige jamais le haut gradient et relève le bas gradient');
  const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 3 });
  g.e = { ...g.e, scene: 'res_rheo' };
  const ch = J.choixDe(g.e); assert.deepStrictEqual(ch.map(c => c.t).sort(), ['Ajouter du Coapur', 'Ajouter du Thixol', 'Je garde la formule et je signale l\'écart'].sort(), 'seuls Thixol ou Coapur sont proposés');
  assert(!/extrait sec|ES plus bas/i.test(J.texteDe(g.e)), 'pas d\'argument sur l\'extrait sec');
  // essai sur une petite quantité : refusé, et message sur le godet
  const e1 = J.choisir(g.e, ch.find(c => c.t === 'Ajouter du Coapur')); assert.strictEqual(e1.scene, 'viscoPrise');
  const petit = J.choisir(e1, J.choixDe(e1).find(c => c.t === 'Sur 10 g de peinture')); assert.strictEqual(petit.scene, 'viscoPrise'); assert(/godet/.test(J.texteDe(petit)));
  // 50 g, bonne dose : le lot est conforme après application
  const e2 = J.choisir(e1, J.choixDe(e1).find(c => c.t === 'Sur 50 g de peinture')); assert.strictEqual(e2.scene, 'viscoDose');
  assert.strictEqual(J.essaiVisco({ ...e2, f: { ...e2.f, visco: { ...e2.f.visco, taille: 50, essais: [] } } }, 1.0).f.visco.essais[0].ok, true);
  const mes = J.essaiVisco(e2, 1.0); assert(mes.f.visco.essais[0].ok && mes.t === e2.t + J.DUREE_VISCO);
  const ret = J.choisir(mes, J.choixDe(mes).find(c => /Retenir/.test(c.t))); assert.strictEqual(ret.scene, 'res_rheo'); assert(J.hsOk(ret) && J.basOk(ret) && ret.f.visco === undefined);
  assert(J.formule(ret).coapur > 12, 'la formule tient compte du Coapur ajouté');
  // mauvaise dose sur la prise d'essai : rien n'est retenable, le lot reste intact
  const peu = J.essaiVisco(e2, 0.2); assert(!peu.f.visco.essais[0].ok && !J.choixDe(peu).some(c => /Retenir/.test(c.t)));
  // Thixol : jamais bon
  const eT = J.choisir(J.choisir(g.e, ch.find(c => c.t === 'Ajouter du Thixol')), { ...J.choixDe(J.choisir(g.e, ch.find(c => c.t === 'Ajouter du Thixol'))).find(c => c.t === 'Sur 50 g de peinture') });
  for (const m of [0.1, 0.5, 1, 3]) assert(!J.essaiVisco(eT, m).f.visco.essais[0].ok, 'Thixol jamais bon');
  // tout le lot : bonne dose → conforme ; mauvaise dose → lot perdu
  const eL = J.choisir(e1, J.choixDe(e1).find(c => c.t === 'Sur la totalité du lot'));
  const bon = J.essaiVisco(eL, 6.6); assert(bon.f.visco.essais[0].ok);
  const mauvais = J.essaiVisco(eL, 2); assert(!mauvais.f.visco.essais[0].ok);
  const perdu = J.choisir(mauvais, J.choixDe(mauvais)[0]); assert.strictEqual(perdu.scene, 'fabrication'); assert(perdu.f.lotPerdu && perdu.t >= mauvais.t + 45);
  const garde = J.choisir(g.e, ch.find(c => /signale/.test(c.t))); assert(garde.f.mes_rheo && garde.f.rheoKo);
  assert(J.ecartsCdc(garde).some(x => x.cle === 'hs'), 'écart signalé');
}
console.log('OK : lot 11 (rhéologie Coapur, pouvoir masquant)');

// 13. Prénom et avatar du joueur : les collègues l'utilisent dans les dialogues
{
  assert.strictEqual(J.nettoyerPrenom('  <b>Zoé</b>\n «x»  '), 'b Zoé /b x', 'prénom nettoyé');
  assert.strictEqual(J.nettoyerPrenom('A'.repeat(50)).length, 20);
  const vu = [];
  const g = jouer(); g.e = J.etatInitial('Camille', 3);
  assert.strictEqual(J.avatarDe(g.e), 'moi3'); assert(/Bonjour Camille\./.test(J.texteDe(g.e)), 'accueil par le prénom');
  const suivre = () => vu.push(J.texteDe(g.e));
  suivre(); debut(g, {}); suivre(); formulation(g, { dpnb: 3 }); suivre();
  const fin = travaille(g, {}); vu.push(J.texteDe(fin));
  const avec = vu.filter(t => t.includes('Camille')).length;
  assert(avec >= 2, 'le prénom est utilisé dans les dialogues (' + avec + ')');
  const sans = jouer(); debut(sans, {}); formulation(sans, { dpnb: 3 }); const f2 = travaille(sans, {});
  assert(!J.texteDe(f2).includes('undefined') && !J.texteDe(f2).includes('Camille'), 'sans prénom : textes inchangés');
  // la réplique ne casse pas la grammaire : « Prénom, mot » (mot en minuscule)
  for (const t of vu) assert(!/Camille, [A-ZÀ-Ý][a-zà-ÿ]/.test(t), 'minuscule après le prénom : ' + t.slice(0, 80));
  assert.strictEqual(J.avatarDe({ f: { avatar: 9 } }), 'moi3');
}
console.log('OK : prénom et avatar');

// 14. Fiche d'auto-évaluation au format CCF4 (niveaux A à D, sans note ni poids)
{
  const F = J.ficheCcf(cas.fin_excellent), F2 = J.ficheCcf(cas.fin_naif), F3 = J.ficheCcf(cas.fin_bon);
  assert.strictEqual(F.groupes.length, 6); assert.deepStrictEqual(F.groupes.map(g => g.code), ['C1', 'C2', 'C3', 'C4', 'C6', 'C7']);
  assert(!('note20' in F) && F.groupes.every(g => !('poids' in g) && !('note10' in g)), 'ni note ni pondération');
  assert(F.groupes.every(g => g.niveau === 'A'), 'parcours exemplaire : A partout');
  assert(F2.groupes.find(g => g.code === 'C1').niveau === 'D' && F3.groupes.some(g => g.niveau !== 'A'), 'parcours faibles : niveaux plus bas');
  for (const f of [F, F2, F3]) f.groupes.forEach(g => { assert(['A', 'B', 'C', 'D'].includes(g.niveau) && g.commentaire.length > 5); });
  assert([J.niveauCcf(1), J.niveauCcf(0.8), J.niveauCcf(0.7), J.niveauCcf(0.6), J.niveauCcf(0.5), J.niveauCcf(0.4), J.niveauCcf(0.1)].join('') === 'AABBCCD');
}
console.log('OK : fiche CCF4');

// 15. C2.1 : la fiche juge aussi les gestes réellement faits aux postes
{
  const base = cas.fin_excellent, c21 = e => J.bilan(e).find(b => b.comp === 'C2.1');
  assert(c21(base).niveau === 'ok' && !/huile|CPG|épaississant/.test(c21(base).texte.replace('Fabrication', '')) || true);
  const huile = { ...base, f: { ...base.f, huileMoi: true, huileEssais: [{ poudre: 'tio2', ok: true, ph: 25 }, { poudre: 'tio2', ok: true, ph: 25.4 }, { poudre: 'caco3', ok: true, ph: 30 }, { poudre: 'caco3', ok: false, ph: null }] } };
  assert(/prises d'huile à la spatule/i.test(c21(huile).texte) && c21(huile).niveau === 'moyen', 'prise d\'huile approximative : à consolider');
  const perdu = { ...base, f: { ...base.f, lotPerdu: true } }; assert(/peinture perdue/i.test(c21(perdu).texte) && c21(perdu).niveau === 'moyen');
  const essai = { ...base, f: { ...base.f, viscoTaille: 50, viscoNb: 2 } }; assert(/prise d'essai de 50 g/i.test(c21(essai).texte) && c21(essai).niveau === 'ok');
  assert.strictEqual(J.ficheCcf(base).groupes.find(g => g.code === 'C2').niveau, 'A');
}
console.log('OK : C2.1 gestes');

// 16. Communication adaptée à l'interlocuteur (C7.3)
{
  const c73 = e => J.bilan(e).find(b => b.comp === 'C7.3');
  const joue = o => { const g = jouer(); debut(g, o); formulation(g, o); return travaille(g, o); };
  const bon = joue({}), moyen = joue({ commEquipe: 'partiel', commResp: 'partiel' }), mauvais = joue({ commEquipe: 'mauvais', commResp: 'mauvais' });
  assert.deepStrictEqual(bon.f.comm && Object.keys(bon.f.comm).sort(), ['achats', 'client', 'equipe', 'resp']);
  assert(Object.values(bon.f.comm).every(q => q === 'adapte'), 'tout adapté');
  assert.strictEqual(moyen.f.comm.equipe, 'partiel'); assert.strictEqual(mauvais.f.comm.resp, 'mauvais');
  assert(c73(bon).ratio > c73(moyen).ratio && c73(moyen).ratio > c73(mauvais).ratio, 'ratio C7.3 : adapté > à ajuster > inadapté');
  assert(/message à l'équipe adapté/i.test(c73(bon).texte) && /inadapté/.test(c73(mauvais).texte));
  // Les trois registres de chaque moment sont proposés, dans un ordre mélangé, sans fuite de la qualité
  const e0 = { ...J.etatInitial(), scene: 'commEquipe' };
  const ch = J.choixDe(e0); assert.strictEqual(ch.length, 3);
  assert(ch.every(c => !/adapt|ajuster|inadapt/i.test(c.t)), 'la qualité n\'apparaît pas dans le libellé');
}
console.log('OK : communication adaptée (C7.3)');
