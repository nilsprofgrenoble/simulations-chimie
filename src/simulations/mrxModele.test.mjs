// node src/simulations/mrxModele.test.mjs
// Vérifie par programme, pour chaque mécanisme et chaque acte : conservation des atomes et de la charge, validité des schémas de Lewis
// (carbone à 4 liaisons, octet, charges formelles), flèches courbes qui partent d'un doublet ou d'une liaison existants et qui redonnent exactement l'état « après ».
import assert from 'node:assert/strict';
import * as M from './mrxModele.js';

const L = 420, H = 235;
const comptes = etat => { const c = {}; for (const a of Object.values(etat.atomes)) c[a.el] = (c[a.el] || 0) + 1; return JSON.stringify(Object.fromEntries(Object.entries(c).sort())); };
const chargeTotale = etat => Object.keys(etat.atomes).reduce((s, id) => s + M.chargeFormelle(etat, id), 0);

for (const m of M.MECANISMES) {
  m.actes.forEach((a, i) => {
    const nom = `${m.id} acte ${i + 1}`;
    for (const cote of ['avant', 'apres']) {
      const e = M.erreursEtat(a[cote]);
      assert.deepEqual(e, [], `${nom} ${cote} : ${e.join(' ; ')}`);
      // dessin : dans le cadre, atomes non superposés
      const ids = Object.keys(a[cote].atomes);
      for (const id of ids) { const t = a[cote].atomes[id]; assert.ok(t.x >= 18 && t.x <= L - 18 && t.y >= 18 && t.y <= H - 18, `${nom} ${cote} : ${id} hors cadre (${t.x}, ${t.y})`); }
      for (let p = 0; p < ids.length; p++) for (let q = p + 1; q < ids.length; q++) {
        const u = a[cote].atomes[ids[p]], v = a[cote].atomes[ids[q]];
        assert.ok(Math.hypot(u.x - v.x, u.y - v.y) >= 36, `${nom} ${cote} : ${ids[p]} et ${ids[q]} trop proches`);
      }
    }
    // atomes et charge conservés
    assert.equal(comptes(a.avant), comptes(a.apres), `${nom} : atomes non conservés`);
    assert.equal(chargeTotale(a.avant), chargeTotale(a.apres), `${nom} : charge non conservée`);
    // les flèches redonnent l'état « après »
    assert.deepEqual(M.ecartsAvecApres(a), [], `${nom} : flèches ≠ état après`);
    // chaque flèche part d'un doublet ou d'une liaison présents ; arrivée = atome existant
    for (const f of a.fleches) {
      if (f.de.lp) { assert.ok(a.avant.atomes[f.de.lp].lp.length > f.de.k, `${nom} : pas de doublet ${f.de.k} sur ${f.de.lp}`); }
      else assert.ok(M.ordreEntre(a.avant, ...f.de.liaison) >= 1, `${nom} : pas de liaison ${f.de.liaison}`);
      assert.ok(a.avant.atomes[f.vers.atome], `${nom} : arrivée inconnue`);
    }
    // une flèche par doublet déplacé : nombre de flèches = nombre de doublets qui changent de rôle (ici 1 ou 2)
    assert.ok(a.fleches.length >= 1 && a.fleches.length <= 2, `${nom} : nombre de flèches`);
    // lacunes déclarées sur un carbone à 3 liaisons chargé +
    (a.avant.lacunes || []).forEach(l => assert.ok(M.chargeFormelle(a.avant, l.atome) === 1 && a.avant.atomes[l.atome].el === 'C', `${nom} : lacune sur un atome non carbocation`));
    // delta : seulement sur des atomes existants
    Object.keys(a.avant.delta || {}).forEach(id => assert.ok(a.avant.atomes[id], `${nom} : delta sur atome inconnu`));
    // le site accepteur δ+ ou chargé + existe pour l'arrivée d'une flèche issue d'un doublet
    for (const f of a.fleches) if (f.de.lp) {
      const t = f.vers.atome, delta = (a.avant.delta || {})[t], q = M.chargeFormelle(a.avant, t), lac = (a.avant.lacunes || []).some(l => l.atome === t);
      assert.ok(delta === '+' || q > 0 || lac, `${nom} : l'arrivée ${t} n'est ni δ+, ni chargée +, ni lacunaire`);
    }
    // espèces citées par donneur / accepteur
    const fs = a.avant.especes.map(x => x.f);
    assert.ok(fs.includes(a.donneur) && fs.includes(a.accepteur), `${nom} : donneur/accepteur absents de l'acte`);
  });
  // continuité entre actes : un réactif d'un acte qui n'est pas un réactif du mécanisme est produit par un acte précédent
  const an = M.analyserMecanisme(m);
  an.actes.forEach(a => { assert.ok(M.conserve(a.react, a.prod), `${m.id} : acte non équilibré`); });
  assert.ok(M.conserve(an.reactifs, an.produits), `${m.id} : bilan non équilibré`);
}

// bilans attendus
const bil = id => M.equationBilan(M.TOUS_MECANISMES.find(m => m.id === id));
assert.equal(bil('subst-Br'), 'HO⁻ + CH₃Br → CH₃OH + Br⁻');
assert.equal(bil('subst-Cl'), 'HO⁻ + CH₃Cl → CH₃OH + Cl⁻');
assert.equal(bil('hydratation'), 'C₂H₄ + H₂O → C₂H₅OH');
assert.equal(bil('hydratation-propene'), 'C₃H₆ + H₂O → C₃H₇OH');
assert.equal(bil('eau-oxygenee-iodure'), `2${M.NB}H₂O₂ → 2${M.NB}H₂O + O₂`);
const a = id => M.analyserMecanisme(M.TOUS_MECANISMES.find(m => m.id === id));
assert.deepEqual(a('hydratation').intermediaires, ['C₂H₅⁺', 'C₂H₅OH₂⁺']); assert.deepEqual(a('hydratation').catalyseurs, ['H₃O⁺']);
assert.deepEqual(a('hydratation-propene').intermediaires, ['C₃H₇⁺', 'C₃H₇OH₂⁺']); assert.deepEqual(a('hydratation-propene').catalyseurs, ['H₃O⁺']);
assert.deepEqual(a('eau-oxygenee-iodure').intermediaires, ['IO⁻']); assert.deepEqual(a('eau-oxygenee-iodure').catalyseurs, ['I⁻']);
assert.deepEqual(a('subst-Br').intermediaires, []); assert.deepEqual(a('subst-Br').catalyseurs, []);
// mécanismes en formules : atomes et charge conservés (déjà testé ci-dessus par conserve) ; formules lisibles
assert.deepEqual(M.parseFormule('C₃H₇OH₂⁺'), { atomes: { C: 3, H: 9, O: 1 }, charge: 1 });
assert.deepEqual(M.parseFormule('SO₄²⁻'), { atomes: { S: 1, O: 4 }, charge: -2 });

// continuité du mécanisme dessiné d'hydratation : l'état « après » d'un acte = les réactifs du suivant (mêmes formules)
{
  const m = M.mecaParId('hydratation');
  for (let i = 0; i + 1 < m.actes.length; i++) {
    const prod = m.actes[i].apres.especes.map(e => e.f), react = m.actes[i + 1].avant.especes.map(e => e.f);
    const intermed = prod.filter(f => react.includes(f));
    assert.ok(intermed.length >= 1, `acte ${i + 1} → ${i + 2} : aucune espèce commune`);
  }
}
// tous les atomes qui servent de départ ou d'arrivée ont un nom lisible pour les menus (ou un repli)
// justification des sens : la flèche de liaison vers l'atome le plus électronégatif (substitution)
for (const X of ['Br', 'Cl']) { assert.ok(M.ELECTRONEG[X] > M.ELECTRONEG.C && M.ELECTRONEG.O > M.ELECTRONEG.C); }

// vérification des flèches : réponse juste acceptée, variantes fausses refusées avec un message
for (const m of M.MECANISMES) for (const ac of m.actes) {
  assert.ok(M.verifierFleches(ac, ac.fleches).ok, `${m.id} ${ac.id} : réponse juste refusée`);
  assert.ok(!M.verifierFleches(ac, []).ok);
  if (ac.fleches.length > 1) {
    const un = M.verifierFleches(ac, [ac.fleches[0]]); assert.ok(!un.ok && un.messages.length, `${m.id} ${ac.id} : une seule flèche`);
    const inv = M.verifierFleches(ac, [ac.fleches[1], ac.fleches[0]]); assert.ok(inv.ok, 'ordre indifférent');
  }
  // flèche inversée
  const f0 = ac.fleches[0], inverse = { de: f0.de.lp ? { liaison: [f0.de.lp, f0.vers.atome] } : { lp: f0.vers.atome, k: 0 }, vers: { atome: f0.de.lp || f0.de.liaison[0] } };
  const rv = M.verifierFleches(ac, [inverse]); assert.ok(!rv.ok && rv.messages.length >= 1, `${m.id} ${ac.id} : inverse sans message`);
}

// tirages du défi « mécanisme » : une seule bonne réponse, options distinctes, jamais la plus longue, bilan équilibré, 5000 tirages
const vus = {};
const statsLong = {};
for (let k = 0; k < 5000; k++) {
  const t = M.tirageMecanisme(k * 7919 + 13);
  vus[t.mecaId] = (vus[t.mecaId] || 0) + 1;
  assert.ok(t.Q.length === 4, `tirage ${k} : q4 absente pour ${t.mecaId}`);
  const an = M.analyserMecanisme(t.meca);
  for (const q of t.Q) {
    if (q.type === 'qcm') {
      assert.equal(new Set(q.options).size, q.options.length, `${t.mecaId}/${q.id} : doublons`);
      assert.ok(q.options.length === 4 && q.bonne >= 0 && q.bonne < 4);
      const lg = q.options.map(o => o.length); assert.ok(lg[q.bonne] < Math.max(...lg), `${t.mecaId}/${q.id} : la bonne réponse est la plus longue`);
      assert.ok(!/undefined|NaN|\[object/.test(JSON.stringify(q)));
      const st = (statsLong[q.id] ||= { n: 0, courte: 0, longue: 0, mid: 0 }); st.n++;
      const rangC = lg.filter(l => l < lg[q.bonne]).length; if (rangC === 0) st.courte++; else st.mid++;
      // espèces des options : uniquement celles du mécanisme (ou la même sans sa charge)
      if (q.id === 'inter' || q.id === 'cata' || q.id === 'bilan') {
        const sp = new Set(); an.actes.forEach(a => [...a.react, ...a.prod].forEach(x => { sp.add(x.f); sp.add(x.f.replace(/[²³]?[⁺⁻]$/, '')); }));
        for (const o of q.options) for (const tok of o.split(/ \+ | → | et |, /)) { const f = tok.replace(/^\d\u00a0/, '').trim(); if (/^aucun/.test(f)) continue; assert.ok(sp.has(f), `${t.mecaId}/${q.id} : espèce « ${f} » étrangère au mécanisme dans « ${o} »`); }
      }
    } else assert.equal(q.vrai, an.actes.length);
  }
  // la bonne option de la Q4 est le bilan équilibré, les autres ne sont pas le bilan
  const q4 = t.Q[3]; assert.equal(q4.options[q4.bonne], M.equationBilan(t.meca));
  q4.options.forEach((o, i) => { if (i !== q4.bonne) assert.notEqual(o, q4.options[q4.bonne]); });
  // Q2 / Q3 : la bonne option correspond bien aux listes calculées
  const txt = l => (l.length ? l.join(' et ') : null);
  const o2 = t.Q[1].options[t.Q[1].bonne]; assert.equal(o2, txt([...an.intermediaires].sort()) || 'aucun intermédiaire');
  const o3 = t.Q[2].options[t.Q[2].bonne]; assert.equal(o3, txt([...an.catalyseurs].sort()) || 'aucun catalyseur');
}
assert.equal(Object.keys(vus).length, M.TOUS_MECANISMES.length, 'tous les mécanismes sont tirés');

// tirage du défi « flèches »
for (let k = 0; k < 2000; k++) {
  const t = M.tirageFleches(k * 31 + 5);
  assert.notEqual(`${t.A.meca.id}${t.A.num}`, `${t.B.meca.id}${t.B.num}`);
  assert.equal(new Set(t.role.options).size, t.role.options.length);
  assert.equal(t.role.options[t.role.bonne], t.A.acte.donneur);
  assert.ok(t.role.options.length >= 3);
}
for (const [id, st] of Object.entries(statsLong)) { console.log(`  longueur ${id} : bonne la plus courte ${Math.round(100 * st.courte / st.n)} %`); assert.ok(st.courte / st.n <= 0.6, `${id} : bonne réponse trop souvent la plus courte`); }
// atomes équivalents : n'importe quel H de H3O+ (ou de l'éthyloxonium) est accepté, à condition de rester cohérent
for (const [mid, num] of [['hydratation', 0], ['hydratation', 2]]) {
  const acte = M.mecaParId(mid).actes[num], g = acte.equivalents[0];
  for (const h of g) {
    const att = acte.fleches.map(f => JSON.parse(JSON.stringify(f).replaceAll(`"${g[0]}"`, `"${h}"`)));
    assert.ok(M.verifierFleches(acte, att).ok, `${mid} acte ${num + 1} : H équivalent ${h} refusé`);
    assert.ok(M.verifierFleches(acte, [att[0]]).ok === false && !M.normaliserTracees(acte, [att[0]]).incoherent);
  }
  const autre = g[1];
  const incoh = JSON.parse(JSON.stringify(acte.fleches)); incoh.forEach(f => { if (f.de.liaison) f.de.liaison = f.de.liaison.map(x => (x === g[0] ? autre : x)); });
  assert.ok(M.normaliserTracees(acte, incoh).incoherent, `${mid} : deux H différents doivent être refusés`);
  assert.ok(M.verifierFleches(acte, incoh).messages[0].includes('même atome'));
}
console.log('mrxModele : OK (mécanismes dessinés, actes, flèches, bilans, 5000 tirages du défi mécanisme, 2000 du défi flèches)');
