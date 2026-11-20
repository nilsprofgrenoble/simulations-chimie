// Typographie française de la simulation 202 : jamais d'espace ordinaire entre un nombre et son unité (m, mm, kg, C, %), ni d'unité collée au chiffre.
// Les commentaires (//) ne sont pas contrôlés ; les lignes tok(...) non plus : l’aide NBSP() de noyauAtome2gtExos.js y remplace toutes les espaces par des insécables. Usage : node src/simulations/noyauAtome2gtTypo.test.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
let ko = 0, n = 0;
const vrai = (nom, c) => { n++; if (!c) { ko++; console.log(`✗ ${nom}`); } };
const U = '(?:kg|mm|km|cm|m|C|%)(?![a-zA-Zéèêùàç])';
const SUPC = '[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]';
const MAUVAIS = [[new RegExp(`${SUPC} (?:kg|mm|km|cm|m|C|%)(?![a-zA-Zéèêùàç])`), 'espace ordinaire entre un exposant et l’unité'], [new RegExp(`${SUPC}(?:kg|mm|km|cm|m|C|%)(?![a-zA-Zéèêùàç])`), 'unité collée à l’exposant'], [/(?<![\d,.])\d{1,3} \d{3}(?!\d)/, 'millier (1 à 3 chiffres + 3 chiffres) avec espace ordinaire'], [new RegExp(`\\d ${U}`), 'espace ordinaire avant l’unité'], [new RegExp(`\\d(?:kg|mm|km|cm|C|%)(?![a-zA-Zéèêùàç])`), 'unité collée au chiffre'], ];
for (const f of ['NoyauAtome2gt.jsx', 'noyauAtome2gtQcm.js', 'NoyauAtome2gtFiches.jsx', 'NoyauAtome2gtScenes.jsx', 'noyauAtome2gtExos.js', 'noyauAtome2gtModele.js']) {
  const L = fs.readFileSync(dir + f, 'utf8').split('\n');
  L.forEach((l0, i) => { let l = l0.replace(/\\u00a0|\{NB\}/g, "\u00a0").replace(/\s\/\/ .*$/, "").replace(/(viewBox|points|d|transform|strokeDasharray)="[^"]*"/g, ""); if (l.trim().startsWith("//") || /maxWidth/.test(l) || /\btok\(/.test(l)) return; for (const [re, nom] of MAUVAIS) { const m = l.match(re); if (m) vrai(`${f}:${i + 1} : ${nom} « ${l.slice(Math.max(0, m.index - 18), m.index + 14).trim()} »`, false); } });
}
// bloc REA
const R = fs.readFileSync(dir + 'AtelierRealiserBanque.jsx', 'utf8').split('\n');
const a = R.findIndex(l => l.includes('function genNoyau2GT')), b = R.findIndex((l, i) => i > a && l.startsWith('function '));
for (let i = a; i < b; i++) { R[i] = R[i].replace(/\\u00a0|\{NB\}/g, "\u00a0"); } for (let i = a; i < b; i++) for (const [re, nom] of MAUVAIS) { const m = R[i].match(re); if (m && !R[i].trim().startsWith('//')) vrai(`REA:${i + 1} : ${nom} « ${R[i].slice(Math.max(0, m.index - 18), m.index + 14).trim()} »`, false); }
vrai("détecte « 5 m »", MAUVAIS.some(([r]) => r.test("5 m")));
vrai("détecte « 5kg »", MAUVAIS.some(([r]) => r.test("5kg")));
vrai("détecte « 1 800 »", MAUVAIS.some(([r]) => r.test("environ 1 800 fois")));
vrai("détecte « 10⁻¹⁹ C »", MAUVAIS.some(([r]) => r.test("10⁻¹⁹ C")));
vrai("accepte les espaces insécables", !MAUVAIS.some(([r]) => r.test("1\u00a0800 fois et 10⁻¹⁹\u00a0C et 5\u00a0m")));
console.log(ko ? `${ko} échec(s)` : `Tout est correct (${n} contrôles)`);
process.exit(ko ? 1 : 0);
