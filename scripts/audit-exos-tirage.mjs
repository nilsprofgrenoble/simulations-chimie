// Tire un exercice par case (niveau, chapitre, compétence) du catalogue pour l'audit des exercices.
// Usage : node scripts/audit-exos-tirage.mjs  → écrit audit/SUIVI_EXOS.md (les statuts déjà saisis sont conservés).
// Graine fixe : le tirage est reproductible. Pour un autre tirage : node scripts/audit-exos-tirage.mjs 42
import fs from 'node:fs';

const graine = Number(process.argv[2] || 28);
let a = graine;
const alea = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// lecture CSV (séparateur « ; », champs entre guillemets possibles, retours à la ligne dans les champs)
function lireCsv(txt) {
  const lignes = []; let champ = '', ligne = [], q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { champ += '"'; i++; } else q = false; } else champ += c; }
    else if (c === '"') q = true;
    else if (c === ';') { ligne.push(champ); champ = ''; }
    else if (c === '\n') { ligne.push(champ.replace(/\r$/, '')); lignes.push(ligne); ligne = []; champ = ''; }
    else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
}
const tab = lireCsv(fs.readFileSync('public/catalogue.csv', 'utf8').replace(/^\uFEFF/, ''));
const cols = tab[0];
const lignes = tab.slice(1).filter(v => v.length > 5).map(v => Object.fromEntries(cols.map((c, i) => [c, v[i] ?? '']))).filter(x => x.type === 'exercice');

const cases = new Map();
for (const x of lignes) {
  const k = [x.niveau, x.chapitre, x.competence].join('|');
  if (!cases.has(k)) cases.set(k, []);
  cases.get(k).push(x);
}

// statuts déjà saisis (colonne « Statut »), conservés d'un tirage à l'autre
const fichier = 'audit/SUIVI_EXOS.md';
const statuts = new Map();
if (fs.existsSync(fichier)) {
  for (const l of fs.readFileSync(fichier, 'utf8').split('\n')) {
    const c = l.split('|').map(s => s.trim());
    if (c.length > 7 && /^[A-Z]+\d+$/.test(c[1])) statuts.set(c[1], c[6]);
  }
}

const ordre = ['2GT', '1G', 'TG', 'TSTL', 'BTS'];
const rang = n => { const i = ordre.indexOf(n.split(' ')[0]); return i < 0 ? 9 : i; };
const cles = [...cases.keys()].sort((p, q) => {
  const [n1, c1, k1] = p.split('|'), [n2, c2, k2] = q.split('|');
  return rang(n1) - rang(n2) || c1.localeCompare(c2, 'fr') || k1.localeCompare(k2, 'fr');
});

const sortie = [];
for (const k of cles) {
  const [niveau, chapitre, competence] = k.split('|');
  const pool = cases.get(k);
  // si un exercice de cette case a déjà un statut, on le garde (suivi continu)
  const deja = pool.find(x => statuts.has(x.code));
  const x = deja || pool[Math.floor(alea() * pool.length)];
  sortie.push(`| ${x.code} | ${niveau} | ${chapitre.slice(0, 55)} | ${competence} | ${x.titre.replace(/\|/g, '/').slice(0, 70)} | ${statuts.get(x.code) || 'à faire'} | ${pool.length} |`);
}

const entete = `# Suivi de l'audit des exercices (un exercice par niveau × chapitre × compétence)

Protocole : audit/PROTOCOLE_EXOS.md. Tirage généré par \`node scripts/audit-exos-tirage.mjs\` (graine ${graine}).
Statuts : à faire / audité / corrigé / faux positif. Dernière colonne : nombre d'exercices de la case (pour juger de l'importance d'un défaut).
Rapports : un fichier par chapitre dans audit/rapports-exos/.

| Code | Niveau | Chapitre | Compétence | Titre | Statut | Exos dans la case |
|---|---|---|---|---|---|---|
`;
fs.writeFileSync(fichier, entete + sortie.join('\n') + '\n');
console.log(`${sortie.length} exercices à auditer, écrits dans ${fichier}`);
