// Tests du modèle « vitesse volumique et loi d'ordre 1 » (sim 122) : node src/simulations/vitesseOrdre1Modele.test.mjs
import * as M from './vitesseOrdre1Modele.js';

let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref} (± ${tol})`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };

const A = { type: 'A', c0: 40.0, k: 0.150 }, B = { type: 'B', c0: 40.0, k: 0.150 };

// ---- calculs faits à part : c(t) = 40 e^(−0,15 t) ; t½ = ln 2 / 0,15 = 4,62098 min
proche('t½ de A', M.th1(A), 4.62098, 1e-4);
proche('c(0) = c0', M.conc(A, 0), 40, 1e-9);
proche('c(4)', M.conc(A, 4), 21.9525, 1e-3);
proche('c(6)', M.conc(A, 6), 16.2628, 1e-3);
proche('c(t½) = c0/2', M.conc(A, M.th1(A)), 20, 1e-9);
proche('c(10)', M.conc(A, 10), 8.9254, 1e-3);
proche('c(12)', M.conc(A, 12), 6.6119, 1e-3);

// ---- vitesse volumique v = k c
proche('v(4)', M.vit(A, 4), 3.2929, 1e-3);
proche('v(12)', M.vit(A, 12), 0.99179, 1e-4);
proche('v/c constant (t = 4)', M.vit(A, 4) / M.conc(A, 4), 0.150, 1e-9);
proche('v/c constant (t = 12)', M.vit(A, 12) / M.conc(A, 12), 0.150, 1e-9);
// v est bien −dc/dt (dérivée numérique)
const h = 1e-6;
proche('v = −dc/dt (A, t = 7)', -(M.conc(A, 7 + h) - M.conc(A, 7 - h)) / (2 * h), M.vit(A, 7), 1e-6);
proche('v = −dc/dt (B, t = 7)', -(M.conc(B, 7 + h) - M.conc(B, 7 - h)) / (2 * h), M.vit(B, 7), 1e-6);

// ---- tangentes : A(0 ; cA) et B(tB ; 0)
let T = M.tangente(A, 4);
proche('tangente t=4 : cA', T.cA, 35.124, 1e-2); proche('tangente t=4 : tB', T.tB, 10.6667, 1e-3);
proche('pente = cA / tB = v (t=4)', T.cA / T.tB, T.v, 1e-9);
T = M.tangente(A, 12);
proche('tangente t=12 : cA', T.cA, 18.5106, 1e-2); proche('tangente t=12 : tB', T.tB, 18.6667, 1e-3);

// ---- demi-réactions : durées constantes pour l'ordre 1, doublées pour B
for (const n of [1, 2, 3, 4]) proche(`A : durée de la demi-réaction n°${n}`, M.dureeDemi(A, n), 4.62098, 1e-5);
proche('B : 1ʳᵉ demi-réaction', M.dureeDemi(B, 1), 4.62098, 1e-5);
proche('B : 2ᵉ demi-réaction', M.dureeDemi(B, 2), 9.24196, 1e-5);
proche('B : 3ᵉ demi-réaction', M.dureeDemi(B, 3), 18.48392, 1e-3);
proche('B : instant où c = 10', M.tempsPour(B, 10), 13.86294, 1e-4);
proche('B : c(13,863) = 10', M.conc(B, 13.8629), 10, 1e-3);
proche('A : instant où c = 10', M.tempsPour(A, 10), 9.24196, 1e-3);
proche('A : temps pour diviser c par 8', M.tempsPour(A, 5) + (M.tempsPour(A, 40 / 8) - M.tempsPour(A, 5)), 3 * 4.62098, 1e-5);

// ---- ln(c/c°), c° = 1 mol/L
proche('ln(c0/c°)', M.lnc(40), -3.2189, 1e-3);
proche('ln c(10 min)', M.lnc(M.conc(A, 10)), -4.7189, 1e-3);
const reg = M.ajustementLn(M.serie(A, 0, 1), 0.5);
proche('pente de ln c = −k (données idéales)', reg.pente, -0.150, 2e-3);
vrai('droite parfaite (r² ≈ 1) pour A', reg.r2 > 0.9999);
const regB = M.ajustementLn(M.serie(B, 0, 1), 0.5);
vrai('B : ln c n’est pas une droite (r² < 0,97)', regB.r2 < 0.97);

// ---- séries : reproductibilité et bruit
const s1 = M.serie(A, 0.4, 7), s2 = M.serie(A, 0.4, 7), s3 = M.serie(A, 0.4, 8);
vrai('même graine → même série', s1.every((p, i) => p.cm === s2[i].cm));
vrai('graine différente → série différente', s1.some((p, i) => p.cm !== s3[i].cm));
vrai('41 points de 0 à 20 min', s1.length === 41 && s1[40].t === 20);
vrai('aucune mesure négative', M.serie(A, 1.0, 3).every(p => p.cm >= 0));
vrai('série idéale = modèle arrondi à 0,1', M.serie(A, 0, 1).every(p => Math.abs(p.cm - p.c) <= 0.05 + 1e-9));
let somme = 0, somme2 = 0, N = 0;
for (let g = 1; g <= 200; g++) for (const p of M.serie(A, 0.4, g).slice(0, 20)) { const e = p.cm - p.c; somme += e; somme2 += e * e; N++; }
proche('bruit centré (moyenne ≈ 0)', somme / N, 0, 0.02);
proche('écart-type du bruit ≈ 0,4', Math.sqrt(somme2 / N), 0.4, 0.02);

// ---- vitesse estimée par sécante
const id = M.serie(A, 0, 1);
proche('sécante dt = 2 centrée en 5 min (idéal)', M.vitesseFenetre(id, 5, 2).v, (22.0 - 16.3) / 2, 0.06);
proche('sécante dt = 2 : proche de la tangente en 5 min', M.vitesseFenetre(id, 5, 2).v, M.vit(A, 5), 0.06);
vrai('sécante impossible hors de la plage', M.vitesseFenetre(id, 1, 4) === null && M.vitesseFenetre(id, 19.5, 2) === null);
proche('incertitude √2 σ / dt (σ = 0,4 ; dt = 4)', M.incertitudeVitesse(0.4, 4), 0.1414, 1e-3);
proche('biais de sécante k=0,15 ; dt = 4', M.biaisSecante(0.15, 4), 0.01507, 1e-4);
proche('biais de sécante k=0,15 ; dt = 8', M.biaisSecante(0.15, 8), 0.0607, 1e-3);
proche('biais de sécante k=0,15 ; dt = 1', M.biaisSecante(0.15, 1), 0.00094, 1e-4);

// ---- instant de demi-réaction lu sur la série
proche('instant c = 20 (série idéale)', M.instantNiveau(id, 20), 4.62, 0.15);

console.log(ko ? `\n${ko} échec(s)` : '\nTous les tests passent.');
process.exit(ko ? 1 : 0);
