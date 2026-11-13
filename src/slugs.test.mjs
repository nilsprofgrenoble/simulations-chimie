// Vérifie les adresses propres des simulations : node src/slugs.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lireSimulations } from '../scripts/lireSimulations.mjs';
import { slugDeLabel, slugSimulation, cheminSimulation, idDepuisChemin, simDeLUrl, aAdressePropre, SANS_ADRESSE_PROPRE } from './slugs.js';
import { referencementSimulation, resume } from './referencement.js';
import { DESCRIPTIONS } from './descriptions.js';

const sims = lireSimulations();
assert.ok(sims.length > 80, 'liste des simulations lue dans App.jsx : ' + sims.length);
const ids = new Set(sims.map(s => s.id));
assert.equal(ids.size, sims.length, 'numéro de simulation en double');

// unicité : adresses et slugs distincts pour toutes les simulations
const chemins = new Set();
for (const s of sims) {
  const c = cheminSimulation(s.id, s.label);
  assert.ok(!chemins.has(c), 'adresse en double ' + c); chemins.add(c);
  assert.match(c, /^\/sim\/\d+(-[a-z0-9]+(-[a-z0-9]+)*)?\/$/, 'adresse mal formée : ' + c);   // minuscules, chiffres, tirets : ni accent ni apostrophe
  assert.ok(c.length <= 80, 'adresse trop longue : ' + c);
  assert.equal(idDepuisChemin(c), s.id, 'aller-retour adresse → numéro : ' + c);
  assert.equal(slugSimulation(s.id, s.label), slugSimulation(s.id, s.label), 'slug non déterministe');
}

// stabilité : ces adresses sont publiées (sitemap, liens, Search Console) ; les changer par mégarde casserait des liens → mettre à jour ici en connaissance de cause
const attendu = {
  1: '/sim/1-avancement-d-une-reaction/',
  2: '/sim/2-titrage-direct/',
  5: '/sim/5-regulation-tor-p-et-pi/',
  57: '/sim/57-atomes-ions-et-molecules-la-quete-de-l-octet/',
  75: '/sim/75-rmn-du-proton-du-spectre-a-la-structure/',
};
for (const [id, c] of Object.entries(attendu)) {
  const s = sims.find(x => x.id === Number(id));
  assert.equal(cheminSimulation(s.id, s.label), c);
}

// caractères accentués et spéciaux
assert.equal(slugDeLabel('Évaporation et cristallisation'), 'evaporation-et-cristallisation');
assert.equal(slugDeLabel('L’ISS en chute libre'), 'l-iss-en-chute-libre');
assert.equal(slugDeLabel('Chaîne de mesure'), 'chaine-de-mesure');
assert.equal(slugDeLabel('RMN ¹³C et 2D : COSY et HSQC'), 'rmn-13c-et-2d-cosy-et-hsqc');
assert.equal(slugDeLabel('Cœur — œuvre ? Æ'), 'coeur-oeuvre-ae');
assert.equal(slugSimulation(7, '???'), '7', 'libellé sans lettre : le numéro seul');

// lecture de l'adresse : tolère un texte ancien ou absent, refuse le reste
assert.equal(idDepuisChemin('/sim/2-titrage-direct/'), 2);
assert.equal(idDepuisChemin('/sim/2/'), 2);
assert.equal(idDepuisChemin('/sim/2'), 2);
assert.equal(idDepuisChemin('/sim/2-ancien-nom/'), 2);
assert.equal(idDepuisChemin('/sim/'), null);
assert.equal(idDepuisChemin('/sim/abc/'), null);
assert.equal(idDepuisChemin('/'), null);
assert.equal(idDepuisChemin('/autre/2-titrage/'), null);
assert.equal(idDepuisChemin('/sim/2-titrage-direct/x/'), null);
// anciennes adresses : ?sim=N prioritaire (QR codes, cadres de récolte), sinon l'adresse propre
assert.equal(simDeLUrl({ search: '?sim=17&ex=ANA23', pathname: '/' }), 17);
assert.equal(simDeLUrl({ search: '', pathname: '/sim/2-titrage-direct/' }), 2);
assert.equal(simDeLUrl({ search: '?ex=ANA23&devoir=1', pathname: '/sim/2-titrage-direct/' }), 2);
assert.equal(simDeLUrl({ search: '?sim=5&recolte=1', pathname: '/sim/2-titrage-direct/' }), 5);
assert.ok(Number.isNaN(simDeLUrl({ search: '', pathname: '/' })));

// pages privées : pas d'adresse propre
for (const id of [39, 40, 82, 103]) assert.ok(SANS_ADRESSE_PROPRE.has(id) && !aAdressePropre(id));
for (const id of [2, 47, 104]) assert.ok(aAdressePropre(id));

// titre et description de chaque page : distincts, non vides, description ≤ ~160 caractères
const titres = new Set(), descs = new Set();
for (const s of sims.filter(x => aAdressePropre(x.id))) {
  const r = referencementSimulation(s);
  assert.ok(r.titre.endsWith(' — Paillasse virtuelle') && r.titre.length < 120, 'titre : ' + r.titre);
  assert.ok(!titres.has(r.titre), 'titre en double : ' + r.titre); titres.add(r.titre);
  assert.ok(r.description.length > 40 && r.description.length <= 190, `description (${r.description.length}) : ${s.id}`);
  assert.ok(!descs.has(r.description), 'description en double : ' + s.id); descs.add(r.description);
  assert.ok(r.adresse.startsWith('https://paillasse-virtuelle.fr/sim/') && r.adresse.endsWith('/'));
  assert.equal(r.donnees.url, r.adresse);
}
assert.equal(referencementSimulation({ id: 2, label: 'Titrage direct', niveau: '1G' }).titre, 'Titrage direct — Paillasse virtuelle');
assert.ok(resume('a'.repeat(300)).length <= 156);
// toute simulation du menu doit avoir une description rédigée (sinon texte générique, mauvais pour le référencement)
const sansDesc = sims.filter(s => aAdressePropre(s.id) && !DESCRIPTIONS[s.label]).map(s => s.id);
if (sansDesc.length) console.warn('Simulations sans description rédigée (texte générique utilisé) :', sansDesc.join(', '));
assert.ok(readFileSync(new URL('./App.jsx', import.meta.url), 'utf8').includes('cheminSimulation'), 'App.jsx doit utiliser cheminSimulation');
console.log(`OK : ${sims.length} simulations, ${chemins.size} adresses distinctes.`);
