// ====================================================
//  MODÈLE « ACIDE FAIBLE : COEFFICIENT DE DISSOCIATION, CONSTANTE D'ACIDITÉ Ka ET pKa » (sim 138, TSTL, enseignement PCM,
//  thème « Transformation de la matière », partie « Réactions acido-basiques en solution aqueuse »).
//  Réutilise acidesBasesModele.js (sim 85) SANS le modifier : le pH « mesuré » est calculé exactement (conservation de la charge,
//  autoprotolyse comprise), alors que les formules du cours (que l'élève utilise) sont les formules simples de la fiche de synthèse.
//  Hypothèses de travail (rappelées dans un panneau de la simulation) :
//   - 25 °C ; Ke = 1,0·10⁻¹⁴ ; activités ≈ concentrations / c° (c° = 1 mol/L) : solutions diluées (0,0010 ≤ C ≤ 0,10 mol/L) ;
//   - monoacides seulement : AH + H₂O ⇌ A⁻ + H₃O⁺, de constante Ka = [A⁻]·[H₃O⁺] / ([AH]·c°) ; l'acide fort est totalement transformé ;
//   - pour les calculs de l'élève : [A⁻] = [H₃O⁺] (l'autoprotolyse de l'eau est négligée : valable si [H₃O⁺] ≫ 10⁻⁷ mol/L, ici pH ≤ 5,8)
//     et conservation de la matière C = [AH] + [A⁻] ;
//   - pH-mètre idéal affichant 2 décimales : les réponses attendues sont calculées à partir du pH AFFICHÉ ;
//   - pKa : valeurs usuelles à 25 °C arrondies au dixième (données, non à retrouver).
//  Unités : concentrations en mol/L ; Ka, α et le pH sans unité.
// ====================================================
import { KE, pH as pHExact, concH, fractions } from './acidesBasesModele.js';

export { KE };

// ---------- les acides de la simulation (aucun n'est un acide des documents du Moodle) ----------
export const ACIDES = {
  hbr:   { id: 'hbr',   fort: true,  nom: 'acide bromhydrique',    AH: 'HBr',        A: 'Br⁻',        pKa: null },
  clch2: { id: 'clch2', fort: false, nom: 'acide chloroéthanoïque', AH: 'ClCH₂COOH', A: 'ClCH₂COO⁻', pKa: 2.9 },
  c6h5:  { id: 'c6h5',  fort: false, nom: 'acide benzoïque',       AH: 'C₆H₅COOH',   A: 'C₆H₅COO⁻',   pKa: 4.2 },
  c2h5:  { id: 'c2h5',  fort: false, nom: 'acide propanoïque',     AH: 'C₂H₅COOH',   A: 'C₂H₅COO⁻',   pKa: 4.9 },
  hclo:  { id: 'hclo',  fort: false, nom: 'acide hypochloreux',    AH: 'HClO',       A: 'ClO⁻',       pKa: 7.5 },
};
export const ORDRE = ['hbr', 'clch2', 'c6h5', 'c2h5', 'hclo'];
export const FAIBLES = ['clch2', 'c6h5', 'c2h5', 'hclo'];

// Concentrations apportées proposées (mol/L), de la plus grande à la plus petite : chaque ligne est une dilution de la précédente
export const CONC = [0.10, 0.050, 0.020, 0.010, 0.0050, 0.0020, 0.0010];

export const kaDe = pKa => 10 ** -pKa;
export const pKaDe = Ka => -Math.log10(Ka);
export const arrondiPH = pH => Math.round(pH * 100) / 100;                    // un pH-mètre affiche 2 décimales

// ---------- état final « réel » (calcul exact) d'une solution de l'acide `ac` de concentration apportée C ----------
export function etat(ac, C) {
  if (ac.fort) {
    const pH = pHExact({ C: 0, pKas: [], ca: C }), h = concH(pH);
    return { pH, h, A: C, AH: 0, HO: KE / h, alpha: 1, Ka: null, pKa: null, C };
  }
  const pH = pHExact({ C, pKas: [ac.pKa] }), h = concH(pH), f = fractions(h, [ac.pKa]);
  return { pH, h, A: C * f[1], AH: C * f[0], HO: KE / h, alpha: f[1], Ka: kaDe(ac.pKa), pKa: ac.pKa, C };
}

// ---------- formules du cours (celles de l'élève) ----------
export const pHFort = C => -Math.log10(C);                                    // acide fort : pH = −log C0
export const hDepuisPH = pH => 10 ** -pH;                                     // [H₃O⁺] = 10^(−pH)  (c° = 1 mol/L)
export const pHDepuisH = h => -Math.log10(h);
export const alphaDepuisPH = (C, pH) => hDepuisPH(pH) / C;                    // α = [A⁻] / C0 = [H₃O⁺] / C0
export const AHDepuisPH = (C, pH) => C - hDepuisPH(pH);                       // conservation de la matière : [AH] = C0 − [A⁻]
export const kaDepuisPH = (C, pH) => { const h = hDepuisPH(pH); return h * h / (C - h); };   // Ka = [H₃O⁺]² / (C0 − [H₃O⁺])
export const kaDepuisAlpha = (C, alpha) => alpha * alpha * C / (1 - alpha);   // Ka = α²·C0 / (1 − α)
export const alphaDepuisKa = (C, Ka) => (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / (2 * C);   // racine de α²·C0 + Ka·α − Ka = 0
export const nbTransformees = alpha => Math.round(100 * alpha);               // schéma : molécules transformées sur 100 (arrondi à l'unité)

// ---------- mesure affichée par le pH-mètre et grandeurs que l'élève en déduit ----------
export function mesure(acId, C) {
  const ac = ACIDES[acId], e = etat(ac, C), pH = arrondiPH(e.pH);
  if (ac.fort) return { acId, C, pH, fort: true, h: C, alpha: 1, AH: 0, Ka: null, pKa: null, reel: e };
  const h = hDepuisPH(pH), AH = C - h, Ka = h * h / AH;
  return { acId, C, pH, fort: false, h, A: h, AH, alpha: h / C, Ka, pKa: pKaDe(Ka), reel: e };
}

// L'acide est-il dans le domaine de validité des formules du cours ? (autoprotolyse négligeable, solution diluée)
export const dansLeDomaine = (acId, C) => { const e = etat(ACIDES[acId], C); return C >= 0.0010 && C <= 0.10 && e.pH <= 5.8; };

// ---------- situations du parcours guidé (toutes calculées par le modèle, jamais écrites à la main) ----------
export const PARCOURS = { ac: 'c6h5', C: 0.010, autre: 'clch2', Cautre: 0.010, Cdilue: 0.0010 };

// ---------- défis à valeurs aléatoires ----------
const tire = (t, alea) => t[Math.floor(alea() * t.length)];
const candidats = [];
for (const id of FAIBLES) for (const C of CONC) {
  if (!dansLeDomaine(id, C)) continue;
  const m = mesure(id, C);
  if (m.alpha >= 0.01 && m.alpha <= 0.8) candidats.push({ id, C });
}
export const CANDIDATS = candidats;

// Défi 1 : acide inconnu, on donne C0 et le pH ; il faut α et Ka (2 chiffres significatifs)
export function tirageInconnu(alea = Math.random) {
  const { id, C } = tire(candidats, alea), m = mesure(id, C);
  return { type: 'inconnu', acId: id, C, pH: m.pH, alpha: m.alpha, Ka: m.Ka, h: m.h };
}

// Défi 2 : deux solutions, même acide ou acides différents ? On donne Ka de la solution 1 ; il faut Ka de la solution 2 puis conclure
const paires = [];
for (const a of candidats) for (const b of candidats) {
  if (a === b) continue;
  if (a.id === b.id) { const r = a.C / b.C; if (Math.abs(r - 10) < 1e-9 || Math.abs(r - 5) < 1e-9) paires.push({ a, b, meme: true }); }
  else if (Math.abs(ACIDES[a.id].pKa - ACIDES[b.id].pKa) >= 0.7 - 1e-9) paires.push({ a, b, meme: false });
}
export const PAIRES = paires;
export const arrondiCS = (x, cs = 2) => Number(Number(x).toPrecision(cs));
const pairesMeme = paires.filter(p => p.meme), pairesDiff = paires.filter(p => !p.meme);
export function tiragePaire(alea = Math.random) {
  const p = tire(alea() < 0.5 ? pairesMeme : pairesDiff, alea), m1 = mesure(p.a.id, p.a.C), m2 = mesure(p.b.id, p.b.C);
  return { type: 'paire', meme: p.meme, s1: { acId: p.a.id, C: p.a.C, pH: m1.pH, Ka: m1.Ka, KaAff: arrondiCS(m1.Ka, 2) }, s2: { acId: p.b.id, C: p.b.C, pH: m2.pH, Ka: m2.Ka } };
}
