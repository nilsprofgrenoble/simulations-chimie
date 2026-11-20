// Typographie française de la simulation 201 : une espace insécable (code 160) avant chaque unité (° nm cm), jamais une espace ordinaire
// ni rien du tout (« 50° », « 50 ° » avec espace ordinaire, « 650 nm » avec espace ordinaire). Les commentaires (//) ne sont pas contrôlés.
// Usage : node src/simulations/prisme2gtTypo.test.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
let ko = 0, n = 0;
const vrai = (nom, c) => { n++; if (!c) { ko++; console.log(`✗ ${nom}`); } };
const NB = String.fromCharCode(160);
const MAUVAIS = [[/\d°/, 'chiffre collé au °'], [/\d °/, 'espace ordinaire avant °'], [/\d (nm|cm)(?![a-zA-Zéèêù])/, 'espace ordinaire avant nm/cm'], [/\d(nm|cm)(?![a-zA-Zéèêù])/, 'chiffre collé à nm/cm'], [/\d (°C|%)/, 'espace ordinaire avant °C ou %']];
function controler(fichier, debut = null, fin = null) {
  const L = fs.readFileSync(dir + fichier, 'utf8').split('\n');
  let a = 0, b = L.length;
  if (debut) { a = L.findIndex(l => l.includes(debut)); b = L.findIndex((l, i) => i > a && l.startsWith(fin)); }
  let nb160 = 0;
  for (let i = a; i < b; i++) {
    const l = L[i]; if (l.trim().startsWith('//')) continue;
    nb160 += [...l].filter(c => c === NB).length;
    for (const [re, nom] of MAUVAIS) { const m = l.match(re); if (m) { const k = m.index; vrai(`${fichier}:${i + 1} : ${nom} « ${l.slice(Math.max(0, k - 18), k + 14).trim()} »`, false); } }
  }
  vrai(`${fichier} : des espaces insécables (code 160) sont présentes (${nb160})`, nb160 > 0 || fichier.includes('Scenes') || fichier.includes('Dispo'));
}
for (const f of ['Prisme2gt.jsx', 'prisme2gtQcm.js', 'Prisme2gtFiches.jsx', 'Prisme2gtScenes.jsx']) controler(f);
controler('AtelierAnalyserBanque.js', "id: 'prisme2gt-ana-laser'", '];');
controler('AtelierValiderBanque.js', "id: 'prisme2gt-val-colore'", '];');
// textes affichés dans les schémas (étiquettes) : contrôlés par prisme2gtDispo.test.mjs ; ici, les constantes du modèle
import('./prisme2gtModele.js').then(M => {
  vrai('degFR : espace insécable avant le °', M.degFR(49.65) === `49,7${NB}°` && M.degFR(49.65).charCodeAt(4) === 160);
  console.log(ko ? `${ko} échec(s)` : `Tout est correct (${n} contrôles)`);
  process.exit(ko ? 1 : 0);
});
