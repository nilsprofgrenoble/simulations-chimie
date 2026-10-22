// Test : node (après bundle esbuild, voir la procédure habituelle) — parcours aléatoires du scénario « Une journée au labo »
import assert from 'node:assert';
import * as J from './laboJournee.js';

// 1. Données de référence cohérentes avec le sujet
const pO = J.prop({ f: { regle: 'ok', coadis: 0.525, dpnb: 0 } });
const pFiche = J.prop({ f: { regle: 'ok', coadis: 0.525, dpnb: 0 } }, { ph: 'fiche' });
assert(pFiche.lambda < 0.8 && pO.lambda >= 0.8, 'les prises d\'huile des fiches donnent une peinture non mate, les mesurées une mate');
assert(pO.ES > 50 && pO.lambda >= 0.8 && pO.COV < 30, 'la formule juste respecte le cahier des charges');
assert(Math.abs(J.coutKg(J.FORMULE_ORGAL) - 4.1) < 0.2, 'coût de la référence ≈ 4,1 €/kg');
assert(J.coutKg(J.formule({ f: { regle: 'ok', coadis: 0.525, dpnb: 0 } })) < 4.5, 'coût Vinnapas < 4,5 €/kg');
const pN = J.prop({ f: { regle: 'naif' } });
assert(Math.abs(pN.ES - 51.8) > 2, 'la formule naïve change l\'extrait sec');

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
  if (o.naif) { g.go('La masse de dispersion'); g.go('Je teste quand même'); }
  else { g.go('La masse de polymère'); g.calc(); g.calc(); }
  g.go('La dose de dispersant'); g.calc(); g.go(o.dpnb === 5 ? 'Garder 5 g' : o.dpnb === 2 ? 'réduire à 2 g' : 'Le supprimer');
  if (o.stock === 'ignore') { g.go('On l\'utilise comme ça'); g.go(o.insiste ? 'Je n\'ai pas le temps' : 'Tu as raison'); if (o.insiste) return; g.go('fût neuf'); }
  else if (o.stock === 'tamise') { g.go('Je contrôle le fût'); g.go('Tamiser'); }
  else { g.go('Je contrôle le fût'); g.go('fût neuf'); }
  if (o.rate) { g.go('Je mets tout'); g.go('Tout refaire'); } else g.go('Je suis la fiche');
  g.go(o.trace === false ? 'noterai ça' : 'Je note maintenant');
}
function travaille(g, o = {}) {
  const dem = o.dem || ['Lucas : Prises', 'Inès : Extrait', 'Inès : pH', 'Lucas : Profil', 'Lucas : Pouvoir', 'Lucas : Brillance', 'Lucas : Température', 'M. Perrin'];
  const client = () => { if (g.e.scene === 'client') { const ch = J.choixDe(g.e); g.go(o.mens ? 'devrait aller' : ch[0].t.slice(0, 20)); } };
  for (const k of dem) { client(); if (g.e.scene === 'fin_perdue') break; if (g.e.cmd.huile && k.includes('Prises')) continue; g.go('Demander à ' + k); }
  client(); if (!J.estFin(g.e.scene) && g.e.scene === 'labo') g.go('Mettre un échantillon');
  for (let i = 0; i < 90; i++) {
    const e = g.e; if (J.estFin(e.scene)) return e;
    if (e.scene === 'client') { const ch = J.choixDe(e); g.go(o.mens ? 'devrait aller' : ch[0].t.slice(0, 20)); continue; }
    if (e.scene === 'res_cout' || e.scene === 'res_huile') { g.calc(); continue; }
    if (e.scene === 'res_ph') { g.go('Remonter le pH'); continue; }
    if (e.scene === 'res_es') { g.go(e.f.regle === 'ok' ? 'Retourner' : 'garde cette formule'); continue; }
    if (e.scene.startsWith('res_')) { g.e = J.choisir(e, J.choixDe(e)[0]); continue; }
    if (e.scene === 'labo') {
      const ch = J.choixDe(e), lire = ch.find(c => c.t.startsWith('📄'));
      const fini = ['es', 'rheo', 'masq', 'tmff', 'cout', 'huile', 'ph', 'brill'].every(k => e.f['mes_' + k]) && e.f.clientFait;
      if (fini || e.t > (o.stop ?? 9999)) { g.go('Rédiger le rapport'); break; }
      if (lire) { g.e = J.choisir(e, lire); continue; }
      g.go('Attendre'); continue;
    }
    throw new Error('scène inattendue ' + e.scene);
  }
  if (g.e.scene === 'rapport') g.go(o.stab || 'Non démontrable');
  if (g.e.scene === 'verdict') g.go('Écouter');
  return g.e;
}
const cas = {};
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 }); cas.fin_excellent = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tot', plan: 'mp' }); formulation(g, { dpnb: 0 }); cas.plan_mp = travaille(g, {}); }
{ const g = jouer(); debut(g, { alerte: 'tard' }); formulation(g, { dpnb: 5, trace: false, rate: true, stock: 'tamise' }); cas.fin_bon = travaille(g, { stop: 380 }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 }); cas.fin_promesse = travaille(g, { stab: 'Stable 30 mois' }); }
{ const g = jouer(); debut(g, { alerte: 'nul' }); formulation(g, { dpnb: 0 }); cas.fin_cloque = travaille(g, { mens: true }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { naif: true, dpnb: 0 }); g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.fin_naif = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 }); g.go('Demander à Inès : Extrait'); g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.fin_incomplet = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0, stock: 'ignore', insiste: true }); cas.fin_matiere = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot', plan: 'solo' }); formulation(g, { dpnb: 0 }); cas.solo = travaille(g, { stop: 400 }); }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 }); for (let i = 0; i < 40 && g.e.scene !== 'fin_perdue'; i++) g.go(g.e.scene === 'client' ? 'Je confirme' : 'Attendre'); cas.fin_perdue = g.e; }
{ const g = jouer(); debut(g, { alerte: 'tot' }); formulation(g, { dpnb: 0 });
  for (const k of ['Demander à Inès : Extrait', 'Demander à Lucas : Profil', 'Demander à Lucas : Pouvoir']) g.go(k);
  for (let i = 0; i < 80 && !(g.e.t >= 470 && g.e.f.mes_es && g.e.f.mes_rheo && g.e.f.mes_masq && g.e.f.clientFait); i++) {
    const e = g.e, l = J.choixDe(e).find(c => c.t.startsWith('📄'));
    if (e.scene === 'client') g.go('Je confirme'); else if (e.scene.startsWith('res_')) g.e = J.choisir(e, J.choixDe(e)[0]); else if (l) g.e = J.choisir(e, l); else g.go('Attendre');
  }
  g.go('Rédiger le rapport'); g.go('Non démontrable'); g.go('Écouter'); cas.retard_ou_autre = g.e; }
const lis = {}; for (const [k, e] of Object.entries(cas)) lis[k] = `${e.scene} à ${J.hhmm(e.t)} (${J.bilan(e).map(b => b.niveau[0]).join('')})`; console.log(lis);
assert.strictEqual(cas.fin_excellent.scene, 'fin_excellent', 'parcours idéal → excellent');
assert.strictEqual(cas.plan_mp.scene, 'fin_excellent', 'plan matières premières → excellent');
assert.strictEqual(cas.fin_bon.scene, 'fin_bon');
for (const k of ['fin_promesse', 'fin_cloque', 'fin_naif', 'fin_incomplet', 'fin_matiere', 'fin_perdue']) assert.strictEqual(cas[k].scene, k);
assert.strictEqual(cas.retard_ou_autre.scene, 'fin_retard');
console.log('OK : une journée au labo');
