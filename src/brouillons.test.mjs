// Les jeux et outils en préparation (src/brouillons.js) ne doivent apparaître nulle part où un enseignant non administrateur peut les voir.
// Lancé par scripts/controle.sh (tous les src/*.test.mjs) : node src/brouillons.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIMS_BROUILLON, JEUX_BROUILLON, OUTILS_BROUILLON } from './brouillons.js';
import { aAdressePropre, SANS_ADRESSE_PROPRE } from './slugs.js';
import { lireSimulations } from '../scripts/lireSimulations.mjs';

const sims = lireSimulations();
const app = readFileSync(new URL('./App.jsx', import.meta.url), 'utf8');

// 1. chaque numéro de la liste existe, et c'est une page « hors chapitres » (niveau COMPTE), sinon elle apparaîtrait dans un menu de niveau
for (const id of SIMS_BROUILLON) {
  const s = sims.find(x => x.id === id);
  assert.ok(s, `brouillon ${id} : simulation introuvable dans App.jsx`);
  assert.equal(s.niveau, 'COMPTE', `brouillon ${id} (${s.label}) : doit être de niveau COMPTE (hors menus des niveaux)`);
}
assert.equal(new Set(SIMS_BROUILLON).size, SIMS_BROUILLON.length, 'numéro en double dans src/brouillons.js');
assert.ok(JEUX_BROUILLON.every(id => !OUTILS_BROUILLON.includes(id)), 'un numéro ne peut être à la fois jeu et outil');

// 2. aucune page statique ni ligne du plan du site (aAdressePropre est ce qu'utilise vite.config.js)
for (const id of SIMS_BROUILLON) assert.ok(SANS_ADRESSE_PROPRE.has(id) && !aAdressePropre(id), `brouillon ${id} : ne doit pas avoir d'adresse propre`);

// 3. le catalogue public (téléchargeable par tous) ne les liste pas
const lignes = readFileSync(new URL('../public/catalogue.csv', import.meta.url), 'utf8').split('\n').map(l => l.split(';'));
for (const id of SIMS_BROUILLON) {
  assert.ok(!lignes.some(c => c[0] === 'simulation' && c[1] === `sim${id}`), `brouillon ${id} : présent dans public/catalogue.csv (lancer node scripts/catalogue.mjs)`);
  assert.ok(!lignes.some(c => c[2] && c[2].endsWith(`?sim=${id}`)), `brouillon ${id} : lien présent dans public/catalogue.csv`);
}

// 4. l'application : l'outil n'est dans le menu « Outils » que par la liste commune, et son accès direct est refusé hors administrateur
assert.ok(/OUTILS_ADMIN_IDS\s*=\s*OUTILS_BROUILLON/.test(app), 'App.jsx doit prendre OUTILS_ADMIN_IDS dans src/brouillons.js');
assert.ok(/!adminConnecte && OUTILS_ADMIN_IDS\.includes\(activeIdBrut\)/.test(app), 'App.jsx : l\'accès direct aux outils en préparation doit être refusé hors administrateur');
assert.ok(/m\.key !== "OUTILS" \|\| admin/.test(app), 'App.jsx : le menu « Outils » doit être réservé à l\'administrateur');

console.log('brouillons : OK');
