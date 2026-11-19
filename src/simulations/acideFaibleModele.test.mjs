// Test du modèle « Acide faible : α, Ka, pKa » (sim 138, TSTL PCM) : node src/simulations/acideFaibleModele.test.mjs
import * as M from './acideFaibleModele.js';

let n = 0, ko = 0;
const verif = (ok, msg) => { n++; if (!ok) { ko++; console.error('ÉCHEC :', msg); } };
const proche = (a, b, tol) => Math.abs(a - b) <= Math.abs(b) * tol;

// ───────────── 1. Tous les acides × toutes les concentrations : cohérence physique de l'état final exact ─────────────
let maxEcartKaPH = 0, maxEcartAlpha = 0;
for (const id of M.ORDRE) for (const C of M.CONC) {
  const ac = M.ACIDES[id], e = M.etat(ac, C), m = M.mesure(id, C);
  const tag = `${id} C=${C}`;
  verif(proche(e.A + e.AH, ac.fort ? C : C, 1e-9) || ac.fort, `${tag} : conservation de la matière A + AH = C`);
  verif(Math.abs(e.A + e.AH - C) < 1e-12 * Math.max(1, C) + 1e-15 || ac.fort, `${tag} : A + AH = C (absolu)`);
  verif(e.alpha > 0 && e.alpha <= 1, `${tag} : 0 < α ≤ 1`);
  verif(Math.abs(e.h - (e.A + e.HO)) < 1e-9 * e.h, `${tag} : charge h = [A⁻] + [HO⁻]`);
  verif(e.pH > 0.9 && e.pH < 7, `${tag} : pH acide`);
  if (ac.fort) {
    verif(e.alpha === 1 && e.AH === 0, `${tag} : acide fort, α = 1`);
    verif(Math.abs(e.pH - M.pHFort(C)) < 2e-4, `${tag} : pH acide fort = −log C (écart ${Math.abs(e.pH - M.pHFort(C))})`);
    verif(m.pH === M.arrondiPH(M.pHFort(C)) || Math.abs(m.pH - M.arrondiPH(M.pHFort(C))) < 0.011, `${tag} : pH affiché acide fort`);
    continue;
  }
  verif(e.alpha < 1, `${tag} : acide faible, α < 1`);
  verif(e.pH > M.pHFort(C), `${tag} : acide faible, pH > −log C`);
  // Ka « vrai » retrouvé exactement avec l'état exact : Ka = [A⁻][H₃O⁺]/[AH]
  verif(proche(e.A * e.h / e.AH, ac ? M.kaDe(ac.pKa) : 0, 1e-9), `${tag} : Ka = [A⁻][H₃O⁺]/[AH] (état exact)`);
  verif(proche(M.kaDepuisAlpha(C, e.alpha), M.kaDe(ac.pKa), 1e-3), `${tag} : Ka = α²C/(1−α) (autoprotolyse négligée : écart < 0,1 %)`);
  verif(proche(M.alphaDepuisKa(C, M.kaDe(ac.pKa)), e.alpha, 0.006), `${tag} : α de la formule du second degré proche de α exact`);
  // Ce que l'élève retrouve avec le pH affiché (2 décimales) : [H₃O⁺], α, Ka, pKa
  const ecKa = Math.abs(m.Ka / M.kaDe(ac.pKa) - 1), ecAl = Math.abs(m.alpha / e.alpha - 1);
  maxEcartKaPH = Math.max(maxEcartKaPH, ecKa); maxEcartAlpha = Math.max(maxEcartAlpha, ecAl);
  verif(ecKa < 0.06, `${tag} : Ka estimé avec le pH affiché à moins de 6 % du vrai (écart ${(100 * ecKa).toFixed(1)} %)`);
  verif(ecAl < 0.03, `${tag} : α estimé avec le pH affiché à moins de 3 % du vrai (écart ${(100 * ecAl).toFixed(1)} %)`);
  verif(Math.abs(m.pKa - ac.pKa) < 0.03, `${tag} : pKa retrouvé à 0,03 près (${m.pKa.toFixed(3)})`);
  verif(m.AH > 0 && m.AH < C, `${tag} : 0 < [AH] < C`);
  verif(proche(m.A + m.AH, C, 1e-12), `${tag} : conservation de la matière avec les grandeurs déduites du pH affiché`);
}
console.log(`Écart maximal sur Ka estimé : ${(100 * maxEcartKaPH).toFixed(2)} % ; sur α : ${(100 * maxEcartAlpha).toFixed(2)} %`);

// ───────────── 2. Effet de la dilution : α augmente quand C diminue, pour chaque acide faible (monotonie stricte sur toute la liste) ─────────────
for (const id of M.FAIBLES) {
  let prec = 0;
  for (const C of M.CONC) { const a = M.etat(M.ACIDES[id], C).alpha; verif(a > prec, `${id} : α croît quand C décroît (${C})`); prec = a; }
  // et Ka reste constant : le Ka exact ne dépend pas de C
  const kas = M.CONC.map(C => { const e = M.etat(M.ACIDES[id], C); return e.A * e.h / e.AH; });
  verif(Math.max(...kas) / Math.min(...kas) < 1 + 1e-9, `${id} : Ka indépendant de C`);
}
// Dilution par 10 : α augmente d'un facteur compris entre 1 et √10·(1+ε) pour un acide très faible, et reste < 1
for (const id of M.FAIBLES) for (let i = 0; i + 3 < M.CONC.length; i++) {
  const a1 = M.etat(M.ACIDES[id], M.CONC[i]).alpha, a2 = M.etat(M.ACIDES[id], M.CONC[i + 3]).alpha;
  verif(a2 > a1 && a2 < 1, `${id} : dilution ×(C ${M.CONC[i]} → ${M.CONC[i + 3]}) augmente α`);
}

// ───────────── 3. Effet du pKa : à même C, pKa plus petit ⇒ α plus grand ⇒ pH plus bas ⇒ acide plus fort ─────────────
for (const C of M.CONC) {
  const ordre = M.FAIBLES.map(id => ({ id, e: M.etat(M.ACIDES[id], C) }));
  for (let i = 0; i + 1 < ordre.length; i++) {
    verif(ordre[i].e.alpha > ordre[i + 1].e.alpha, `C=${C} : α(${ordre[i].id}) > α(${ordre[i + 1].id})`);
    verif(ordre[i].e.pH < ordre[i + 1].e.pH, `C=${C} : pH(${ordre[i].id}) < pH(${ordre[i + 1].id})`);
  }
}

// ───────────── 4. Situation du parcours guidé : valeurs écrites dans les énoncés ─────────────
{
  const { ac, C, autre, Cautre, Cdilue } = M.PARCOURS;
  const m = M.mesure(ac, C);
  verif(m.pH === 3.12, `parcours : pH benzoïque 0,010 = 3,12 (${m.pH})`);
  verif(M.pHFort(C).toFixed(2) === '2.00', 'parcours : −log 0,010 = 2,00');
  verif(proche(m.h, 7.585e-4, 0.002), `parcours : [H₃O⁺] = 7,6×10⁻⁴ (${m.h})`);
  verif(Number(m.h.toPrecision(2)) === 7.6e-4, 'parcours : [H₃O⁺] à 2 chiffres significatifs = 7,6×10⁻⁴');
  verif(Number(m.AH.toPrecision(2)) === 0.0092, `parcours : [AH] = 9,2×10⁻³ (${m.AH})`);
  verif(Math.abs(m.AH / C - 1) > 0.06, 'parcours : [AH] diffère de C₀ de plus de 6 % (la soustraction compte)');
  verif(Number(m.alpha.toPrecision(2)) === 0.076, `parcours : α = 0,076 (${m.alpha})`);
  verif(Number(m.Ka.toPrecision(2)) === 6.2e-5, `parcours : Ka = 6,2×10⁻⁵ (${m.Ka})`);
  verif(m.pKa.toFixed(2) === '4.21', `parcours : pKa estimé = 4,21 (${m.pKa})`);
  verif(M.nbTransformees(m.alpha) === 8, 'parcours : 8 molécules sur 100');
  // un élève qui arrondit à 2 chiffres significatifs à chaque étape reste dans les tolérances du parcours (α 6 %, [AH] 6 %, Ka 8 %, pKa 1 %)
  { const h2 = Number(m.h.toPrecision(2)), AH2 = Number((C - h2).toPrecision(2)), al2 = Number((h2 / C).toPrecision(2)), ka2 = h2 * h2 / AH2;
    verif(Math.abs(AH2 / m.AH - 1) < 0.06 && Math.abs(al2 / m.alpha - 1) < 0.06 && Math.abs(ka2 / m.Ka - 1) < 0.08, 'parcours : chaîne arrondie à 2 chiffres significatifs dans les tolérances');
    for (const k of [6.2e-5, 6.3e-5, ka2]) verif(Math.abs(-Math.log10(k) - m.pKa) < 0.042 * 1, `parcours : pKa depuis Ka = ${k} dans 1 % de la valeur attendue`); }
  const m2 = M.mesure(autre, Cautre);
  verif(m2.pH === 2.53 && Number(m2.alpha.toPrecision(2)) === 0.30, `parcours : autre acide pH 2,53 α 0,30 (${m2.pH} ${m2.alpha})`);
  verif(Math.abs(Number((M.hDepuisPH(m2.pH)).toPrecision(2)) / Cautre / m2.alpha - 1) < 0.06, 'parcours : α de l’autre acide avec [H₃O⁺] arrondi à 2 chiffres significatifs dans 6 %');
  const md = M.mesure(ac, Cdilue);
  verif(md.pH === 3.65 && Number(md.alpha.toPrecision(2)) === 0.22, `parcours : benzoïque dilué pH 3,65 α 0,22 (${md.pH} ${md.alpha})`);
  verif(md.alpha / m.alpha > 2.5 && md.alpha / m.alpha < 3.5, 'parcours : dilution ×10 multiplie α par ≈ 3');
  // Ka estimé aux quatre concentrations de l'étape sur la constance : tous voisins de 6,3×10⁻⁵ à 6 % près
  for (const c of [0.010, 0.0050, 0.0020, 0.0010]) verif(proche(M.mesure(ac, c).Ka, 6.3e-5, 0.06), `parcours : Ka estimé à C₀ = ${c} voisin de 6,3×10⁻⁵ (${M.mesure(ac, c).Ka})`);
  // compar : à C₀ = 0,010, l'acide chloroéthanoïque a le plus petit pKa, le plus grand α et le plus petit pH
  const t3 = ['c6h5', 'clch2', 'c2h5'].map(i => M.mesure(i, 0.010));
  verif(t3[1].alpha > t3[0].alpha && t3[0].alpha > t3[2].alpha && t3[1].pH < t3[0].pH && t3[0].pH < t3[2].pH, 'parcours : classement des trois acides à C₀ = 0,010');
}

// ───────────── 5. Défis : 5 000 tirages de chaque type ─────────────
{
  let nbMeme = 0, ecartMemeMax = 0, ecartDiffMin = Infinity;
  const vus = new Set();
  for (let i = 0; i < 5000; i++) {
    const t = M.tirageInconnu();
    vus.add(t.acId + t.C);
    verif(M.dansLeDomaine(t.acId, t.C), 'défi 1 : domaine de validité');
    verif(t.alpha >= 0.01 && t.alpha <= 0.8, `défi 1 : α dans [0,01 ; 0,8] (${t.alpha})`);
    // la réponse attendue vient du pH AFFICHÉ
    verif(proche(t.alpha, M.alphaDepuisPH(t.C, t.pH), 1e-12) && proche(t.Ka, M.kaDepuisPH(t.C, t.pH), 1e-12), 'défi 1 : réponses calculées avec le pH affiché');
    // un élève qui arrondit à 2 chiffres significatifs à chaque étape reste dans la tolérance (α : 5 % ; Ka : 10 %)
    const h2 = Number(M.hDepuisPH(t.pH).toPrecision(2)), al2 = Number((h2 / t.C).toPrecision(2)), AH2 = Number((t.C - h2).toPrecision(2)), ka2 = h2 * h2 / AH2;
    verif(Math.abs(al2 / t.alpha - 1) <= 0.05, `défi 1 : α arrondi à chaque étape dans 5 % (${al2} vs ${t.alpha})`);
    verif(Math.abs(ka2 / t.Ka - 1) <= 0.10, `défi 1 : Ka arrondi à chaque étape dans 10 % (${ka2} vs ${t.Ka})`);
    const p = M.tiragePaire();
    verif(M.dansLeDomaine(p.s1.acId, p.s1.C) && M.dansLeDomaine(p.s2.acId, p.s2.C), 'défi 2 : domaine de validité');
    const r = p.s2.Ka / p.s1.Ka;
    if (p.meme) { nbMeme++; ecartMemeMax = Math.max(ecartMemeMax, Math.abs(r - 1)); verif(p.s1.acId === p.s2.acId && p.s1.C !== p.s2.C, 'défi 2 : même acide, concentrations différentes'); verif(Math.abs(r - 1) < 0.12, `défi 2 : même acide, Ka voisins (${r})`); }
    else { ecartDiffMin = Math.min(ecartDiffMin, Math.max(r, 1 / r)); verif(p.s1.acId !== p.s2.acId, 'défi 2 : acides différents'); verif(Math.max(r, 1 / r) > 3, `défi 2 : acides différents, Ka très différents (${r})`); }
    verif(p.s1.KaAff === Number(p.s1.Ka.toPrecision(2)), 'défi 2 : Ka₁ affiché à 2 chiffres significatifs');
  }
  console.log(`Défi 1 : ${vus.size} situations distinctes ; défi 2 : ${nbMeme} « même acide » sur 5000, écart maximal de Ka ${(100 * ecartMemeMax).toFixed(1)} %, rapport minimal de Ka pour acides différents ${ecartDiffMin.toFixed(1)}`);
  verif(vus.size === M.CANDIDATS.length, 'défi 1 : toutes les situations sont tirées');
  verif(nbMeme > 1000 && nbMeme < 4000, 'défi 2 : les deux cas (même acide / acides différents) sont équilibrés');
}

// ───────────── 6. Formules de la fiche : tableau d'avancement et Ka = α²C/(1−α) ─────────────
for (const Ka of [1e-3, 6.3e-5, 1.3e-5]) for (const C of [0.1, 0.01, 0.001]) {
  const al = M.alphaDepuisKa(C, Ka);
  verif(proche(M.kaDepuisAlpha(C, al), Ka, 1e-9), `α²C/(1−α) = Ka (Ka=${Ka}, C=${C})`);
}

console.log(`${n} vérifications, ${ko} échec(s).`);
if (ko) process.exit(1);
