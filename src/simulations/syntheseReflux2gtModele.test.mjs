// Tests du modèle de la simulation 204 (synthèse et reflux). Usage : node src/simulations/syntheseReflux2gtModele.test.mjs
import * as M from './syntheseReflux2gtModele.js';
import { LEGENDES } from './syntheseReflux2gtGeometrie.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };

// équation : atomes conservés, 7 C, 16 H, 3 O de chaque côté
const g = M.atomes(M.EQUATION.reactifs), d = M.atomes(M.EQUATION.produits);
ok(JSON.stringify(g) === JSON.stringify(d) && g.C === 7 && g.H === 16 && g.O === 3, `équation non ajustée ${JSON.stringify(g)} ${JSON.stringify(d)}`);
ok(M.equationAjustee(), 'equationAjustee');

// assemblage : ordre imposé, aucune pièce posée trop tôt, une seule suite complète
let m = M.MONTAGE_VIDE;
for (const id of ['refrigerant', 'pince', 'ballon', 'chauffe']) { const r = M.essaiPiece(m, id); ok(!r.ok && r.montage === m && r.message.length > 20, `pièce ${id} posée trop tôt`); }
for (const id of M.ORDRE_PIECES) { const r = M.essaiPiece(m, id); ok(r.ok, `pièce ${id} refusée dans l'ordre`); m = r.montage; ok(!M.essaiPiece(m, id).ok, 'pose en double'); }
ok(M.montageComplet(m), 'montage complet');
ok(M.PIECES.every(p => p.prerequis.every(r => M.ORDRE_PIECES.indexOf(r) < M.ORDRE_PIECES.indexOf(p.id))), 'prérequis dans l’ordre');
// aucune permutation d'ordre ne passe sans respecter les prérequis : on compte les ordres valides
const perm = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perm([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
let valides = 0;
for (const o of perm(M.ORDRE_PIECES)) { let mm = M.MONTAGE_VIDE, bon = true; for (const id of o) { const r = M.essaiPiece(mm, id); if (!r.ok) { bon = false; break; } mm = r.montage; } if (bon) valides++; }
ok(valides === 1, `ordres valides : ${valides}`);

// diagnostic : toutes les combinaisons sont définies et cohérentes
const eaux = ['aucune', 'bas', 'haut'], bool = [false, true]; let nbC = 0;
for (const refrigerant of bool) for (const eau of eaux) for (const bouchon of bool) for (const pierre of bool) for (const pince of bool) for (const marche of bool) {
  const x = M.diagnostic({ ...M.MONTAGE_CORRECT, refrigerant, eau, bouchon, pierre, pince, marche }); nbC++;
  ok(x && ['aucune', 'sechappent', 'partiel', 'retombent'].includes(x.vapeurs), `vapeurs ${JSON.stringify(x)}`);
  if (!marche) ok(x.vapeurs === 'aucune' && x.ebullition === 'aucune', 'éteint : pas de vapeurs ni d’ébullition');
  if (!refrigerant && marche) ok(x.vapeurs === 'sechappent', 'sans réfrigérant : les vapeurs s’échappent');
  if (marche && refrigerant && bouchon) ok(x.pression === true, 'bouché : la pression monte');
  if (!bouchon) ok(!x.pression, 'ouvert : pas de pression');
  if (marche && refrigerant && !bouchon && eau === 'bas') ok(x.vapeurs === 'retombent', 'montage correct : reflux');
  if (!pierre && marche) ok(x.ebullition === 'saccadee', 'sans pierre ponce : à-coups');
  ok(x.maintien === (pince || !refrigerant), 'maintien');
}
ok(M.diagnostic(M.MONTAGE_CORRECT).vapeurs === 'retombent', 'montage correct');

// défis du montage : les fautes tirées sont celles du montage, la vérification est exacte, le tirage change
let aucune = 0, une = 0, deux = 0;
for (let t = 0; t < 3000; t++) {
  const df = M.tirerDefiMontage(), df2 = M.tirerDefiMontage(df);
  ok(df && df2 && df.cle !== df2.cle, 'défi suivant identique');
  ok(JSON.stringify(M.fautesDe(df.montage).sort()) === JSON.stringify([...df.fautes].sort()), `fautes ${df.cle}`);
  ok(!(df.fautes.includes('eauHaut') && df.fautes.includes('sansEau')), 'fautes incompatibles');
  ok(M.verifierMontage(df, df.fautes).ok && M.reponseJusteMontage(df, df.fautes), 'bonne réponse refusée');
  if (df.fautes.length) { ok(!M.verifierMontage(df, []).ok, 'réponse vide acceptée'); ok(!M.verifierMontage(df, [...df.fautes, M.IDS_FAUTES.find(f => !df.fautes.includes(f))]).ok, 'faute en trop acceptée'); }
  ({ 0: aucune, 1: une, 2: deux }[df.fautes.length] !== undefined) && (df.fautes.length === 0 ? aucune++ : df.fautes.length === 1 ? une++ : deux++);
}
ok(aucune > 200 && une > 800 && deux > 800, `répartition ${aucune}/${une}/${deux}`);
ok(M.IDS_FAUTES.every(f => M.FAUTES[f] && M.CONSEQUENCE[f] && M.FAUTES[f].length > 5), 'phrases des fautes');

// courbes : même limite, la chaude est plus rapide
ok(M.esterFormé(0, 1) === 0, 'départ à zéro');
for (let t = 1; t <= M.COURBE.tMax; t++) ok(M.esterFormé(t, M.COURBE.tau.chaud) > M.esterFormé(t, M.COURBE.tau.froid), 'la courbe chauffée est au-dessus');
ok(Math.abs(M.esterFormé(1000, 1) - M.esterFormé(1000, 4)) < 1e-9 && Math.abs(M.esterFormé(1000, 1) - M.COURBE.A) < 1e-9, 'même limite finale');
ok(M.COURBE.tau.froid * 3 > M.COURBE.tMax * 0.8, 'la courbe froide n’est pas finie à tMax (elle monte encore)');

// CCM : écarts, verdicts
for (const e of [1, 2]) {
  const sp = Object.keys(M.ESPECES_CCM), ds = sp.map(s => M.dist(s, e));
  for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) {
    const same = (sp[i] === 'ester' && sp[j] === 'ester'); if (!same && ds[i] !== ds[j] && !(M.ESPECES_CCM[sp[i]].meme === M.ESPECES_CCM[sp[j]].meme)) ok(Math.abs(ds[i] - ds[j]) >= 3 || ds[i] === ds[j], `écart faible ${sp[i]}/${sp[j]} éluant ${e}`);
  }
  ok(M.nbTaches(M.ECHANTILLONS.brut.especes, e) === 2, `brut : 2 taches (éluant ${e})`);
  ok(M.nbTaches(M.ECHANTILLONS.pur.especes, e) === 1 && M.nbTaches(M.ECHANTILLONS.nat.especes, e) === 1, 'pur et nat : 1 tache');
  ok(M.verdictComparaison('pur', 'nat', e) === 'probable', `pur/nat ${e}`);
  ok(M.verdictComparaison('brut', 'nat', e) === 'melange', `brut/nat ${e}`);
  ok(M.verdictComparaison('autre', 'nat', e) === 'diff', `autre/nat ${e}`);
  const bt = M.taches(M.ECHANTILLONS.brut.especes, e); ok(Math.abs(bt[0].d - bt[1].d) >= 3, 'taches du brut distinctes d’au moins 3 mm');
  const au = M.dist('butyle', e), es = M.dist('ester', e); ok(Math.abs(au - es) >= 3, `autre/ester ${Math.abs(au - es)} mm`);
  for (const x of M.taches(['ester', 'alcool', 'butyle'], e)) ok(x.d > 3 && x.d < M.FRONT - 3, 'tache dans la plaque');
}
let cles = new Set(), bons = { probable: 0, diff: 0, melange: 0 };
for (let t = 0; t < 1500; t++) { const x = M.tirerDefiIdentite(); cles.add(x.cle); bons[x.bonne]++; ok(M.reponseJusteIdentite(x, x.bonne) && !M.reponseJusteIdentite(x, 'prouve'), '« prouvé » n’est jamais la bonne réponse'); const y = M.tirerDefiIdentite(x); ok(y.cle !== x.cle, 'défi identique'); }
ok(cles.size === 6 && bons.probable > 300 && bons.diff > 300 && bons.melange > 300, `défis identité ${[...cles]} ${JSON.stringify(bons)}`);
ok(Object.values(M.CHOIX_IDENTITE).length === 4 && new Set(Object.values(M.CHOIX_IDENTITE)).size === 4, 'choix distincts');
ok(!/est identique|sont identiques\b(?!.*prouv)/.test(M.MESSAGES_IDENTITE.probable) && /peut être identique/.test(M.MESSAGES_IDENTITE.probable) && /cet éluant/.test(M.MESSAGES_IDENTITE.probable), 'réserve sur l’identité');

// légendes imposées + espaces insécables avant les unités dans les textes du modèle
ok(M.legendesExistent(), 'légendes requises présentes');
const exact = { ballon: 'ballon', chauffe: 'chauffe-ballon', sortie: 'sortie d’eau', entree: 'entrée d’eau', support: 'support' };
for (const [k, v] of Object.entries(exact)) ok(JSON.stringify(LEGENDES[k]).includes(v), `légende ${k}`);
ok(JSON.stringify(LEGENDES.refrigerant).includes('réfrigérant') && JSON.stringify(LEGENDES.refrigerant).includes('à eau'), 'légende réfrigérant à eau');
const tous = JSON.stringify([M.FAUTES, M.CONSEQUENCE, M.MESSAGES_IDENTITE, M.CHOIX_IDENTITE, M.PIECES, M.ECHANTILLONS, M.ELUANTS, M.ESPECES_CCM]);
ok(!/\d (°C|mL|g|L|h|min|mm|cm)(?![\wéè])/.test(tous), 'espace ordinaire avant une unité dans le modèle');
ok(M.cmFR(25).includes(M.NB + 'cm') && M.cmFR(25) === `2,5${M.NB}cm`, 'cmFR');
console.log(`${n} contrôles : tout est correct (${nbC} combinaisons de montage, ${valides} ordre valide)`);
