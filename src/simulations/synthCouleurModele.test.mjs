// Tests du modèle « Synthèse additive et soustractive » : node src/simulations/synthCouleurModele.test.mjs
import * as S from './synthCouleurModele.js';
let ok = 0, ko = 0;
const t = (nom, cond, info = '') => { if (cond) ok++; else { ko++; console.log('ÉCHEC :', nom, info); } };
const proche = (a, b, tol) => Math.abs(a - b) <= tol;
const C = S.C;

// --- lumières : étalonnage et sommes ---
const w = S.chroma(S.spectreRVB(1, 1, 1));
t('les trois lampes à fond donnent le blanc D65', proche(w.x, 0.3127, 0.001) && proche(w.y, 0.3290, 0.001) && proche(w.Y, 100, 0.01), JSON.stringify(w));
t('étalonnage positif', S.ETALONNAGE.R > 0 && S.ETALONNAGE.V > 0 && S.ETALONNAGE.B > 0);
t('lampes éteintes : aucune lumière', S.luminance(S.spectreRVB(0, 0, 0)) === 0);
const sR = S.spectreRVB(0.6, 0, 0), sV = S.spectreRVB(0, 0.4, 0), sRV = S.spectreRVB(0.6, 0.4, 0);
t('le spectre d\'un mélange est la somme des spectres', S.somme(sR, sV).every((v, i) => proche(v, sRV[i], 1e-9)));
const xyz = S.xyzLumiere;
t('XYZ additif (loi de Grassmann)', ['X', 'Y', 'Z'].every(k => proche(xyz(sRV)[k], xyz(sR)[k] + xyz(sV)[k], 1e-9)));
const cnt = S.chroma(S.spectreRVB(1, 1, 0));
t('rouge + vert : jaune (dominante entre 560 et 590 nm)', (() => { const l = C.lireChromaticite(cnt.x, cnt.y); return l.dominante > 560 && l.dominante < 590; })());
const cm = S.chroma(S.spectreRVB(1, 0, 1)), lm = C.lireChromaticite(cm.x, cm.y);
t('rouge + bleu : magenta (pourpre, pas de dominante)', lm.pourpre === true, JSON.stringify(lm));
const cc = S.chroma(S.spectreRVB(0, 1, 1)), lc = C.lireChromaticite(cc.x, cc.y);
t('vert + bleu : cyan (dominante entre 480 et 510 nm)', lc.dominante > 480 && lc.dominante < 510, JSON.stringify(lc));
// complémentaire : jaune (R + V) + bleu = blanc
t('jaune (R+V à fond) + bleu à fond = blanc', (() => { const c = S.chroma(S.spectreRVB(1, 1, 1)); return proche(c.x, 0.3127, 0.002); })());

// --- cônes ---
t('cônes : maxima vers 580, 550 et 450 nm (approximation)', (() => { const pk = k => S.LAMBDAS[S.CONES[k].indexOf(1)]; return pk('L') >= 570 && pk('L') <= 590 && pk('M') >= 540 && pk('M') <= 560 && pk('S') >= 440 && pk('S') <= 460; })());
t('cônes : valeurs entre 0 et 1', ['L', 'M', 'S'].every(k => S.CONES[k].every(v => v >= 0 && v <= 1)));
const dw = S.reponses(S.spectreRVB(1, 1, 1));
t('blanc : réponses L, M, S égales (100)', proche(dw.L, 100, 0.5) && proche(dw.M, 100, 0.5) && proche(dw.S, 100, 0.5), JSON.stringify(dw));

// --- métamères de lumière : jaune monochromatique ≡ rouge + vert ---
const e = S.equivalentRV(S.JAUNE.lam, S.JAUNE.Y);
t('jaune équivalent : réglages r, v dans [0 ; 1]', e.r > 0 && e.r < 1 && e.v > 0 && e.v < 1, `${e.r} ${e.v}`);
t('jaune équivalent : mêmes réponses L et M', proche(e.mono.L, e.mix.L, 1e-6) && proche(e.mono.M, e.mix.M, 1e-6));
t('jaune équivalent : réponse S faible dans les deux cas (< 3 % de L)', e.mono.S < 0.03 * e.mono.L && e.mix.S < 0.03 * e.mono.L, JSON.stringify(e));
const mono = S.spectreMono(S.JAUNE.lam, S.JAUNE.Y), mix = S.spectreRVB(e.r, e.v, 0);
t('jaune équivalent : les spectres sont très différents', (() => { let d = 0, n = 0; for (let i = 0; i < mono.length; i++) { d += Math.abs(mono[i] - mix[i]); n += mono[i]; } return d / n > 1; })());
const cmono = S.chroma(mono), cmix = S.chroma(mix);
t('jaune équivalent : couleurs presque identiques (écart x, y < 0,01)', proche(cmono.x, cmix.x, 0.01) && proche(cmono.y, cmix.y, 0.01), `${JSON.stringify(cmono)} ${JSON.stringify(cmix)}`);
t('jaune équivalent : même luminance (à 3 % près)', proche(cmono.Y, cmix.Y, 0.03 * cmono.Y));

// --- deutéranope : deux lumières de même réponse L, de réponses M très différentes ---
const d = S.paireDeuteranope();
t('deutéranope : même réponse L', proche(d.co.L, d.cg.L, 1e-6));
t('deutéranope : réponse M au moins deux fois plus grande pour le vert', d.cg.M > 2 * d.co.M, JSON.stringify(d));
t('deutéranope : réponses S négligeables (< 2 % de L)', d.co.S < 0.02 * d.co.L && d.cg.S < 0.02 * d.co.L);
const xo = S.chroma(d.orange), xg = S.chroma(d.vert);
t('deutéranope : pour un œil normal, couleurs très différentes (écart de x > 0,1)', Math.abs(xo.x - xg.x) > 0.1, `${xo.x} ${xg.x}`);

// --- filtres ---
const Tj = S.transmittance({ jaune: 0.5 }), Tc = S.transmittance({ cyan: 0.5 }), Tjc = S.transmittance({ jaune: 0.5, cyan: 0.5 });
t('filtres en série : T = produit des transmittances', Tjc.every((v, i) => proche(v, Tj[i] * Tc[i], 1e-12)));
t('absorbances additives', S.absorbance({ jaune: 0.5, cyan: 0.5 }).every((v, i) => proche(v, S.absorbance({ jaune: 0.5 })[i] + S.absorbance({ cyan: 0.5 })[i], 1e-12)));
t('filtre : T entre 0 et 1', Tjc.every(v => v > 0 && v <= 1));
t('sans pigment, T = 1', S.transmittance({}).every(v => v === 1));
t('filtre jaune : absorbe le bleu, laisse passer le rouge', Tj[S.LAMBDAS.indexOf(450)] < 0.35 && Tj[S.LAMBDAS.indexOf(650)] > 0.9);
t('filtre cyan : absorbe le rouge, laisse passer le bleu', Tc[S.LAMBDAS.indexOf(650)] < 0.35 && Tc[S.LAMBDAS.indexOf(450)] > 0.85);
const lJC = (() => { const x = S.xyFiltre(Tjc); return C.lireChromaticite(x.x, x.y); })();
t('jaune puis cyan : lumière verte (dominante 520 à 570 nm)', lJC.dominante > 520 && lJC.dominante < 570, JSON.stringify(lJC));

// --- Kubelka-Munk ---
t('K/S nul : réflectance 1', S.reflKM(0) === 1);
t('réflectance KM entre 0 et 1', [0.01, 0.1, 1, 10, 100].every(k => S.reflKM(k) > 0 && S.reflKM(k) < 1));
t('KM décroissante avec K/S', S.reflKM(0.5) < S.reflKM(0.2));
t('réciproque K/S ↔ R', [0.05, 0.4, 3].every(k => proche(S.ksDe(S.reflKM(k)), k, 1e-9)));
t('K/S additif : mélange = somme pondérée', (() => { const a = S.ksMelange({ jaune: 0.3 }), b = S.ksMelange({ cyan: 0.2 }), ab = S.ksMelange({ jaune: 0.3, cyan: 0.2 }); return ab.every((v, i) => proche(v, a[i] + b[i], 1e-12)); })());
t('le blanc diminue K/S (pigment blanc = diffusion seulement)', S.ksMelange({ jaune: 0.5, blanc: 0.5 }).every((v, i) => v < S.ksMelange({ jaune: 0.5 })[i]));
const lab = c => S.labPeinture(S.reflPeinture(c));
const dom = c => { const l = lab(c); return Math.atan2(l.b, l.a) * 180 / Math.PI; };
t('jaune seul : teinte jaune (h entre 60° et 110°)', (() => { const h = (dom({ jaune: 0.5 }) + 360) % 360; return h > 60 && h < 110; })());
t('magenta seul : a* > 40 et b* < 0', lab({ magenta: 0.5 }).a > 40 && lab({ magenta: 0.5 }).b < 0);
t('cyan seul : a* < 0 et b* < 0', lab({ cyan: 0.5 }).a < 0 && lab({ cyan: 0.5 }).b < 0);
t('jaune + cyan : vert (a* < −25, b* > 15)', lab({ jaune: 0.5, cyan: 0.5 }).a < -25 && lab({ jaune: 0.5, cyan: 0.5 }).b > 15);
t('jaune + magenta : rouge (a* > 30, b* > 10)', lab({ jaune: 0.5, magenta: 0.5 }).a > 30 && lab({ jaune: 0.5, magenta: 0.5 }).b > 10);
t('cyan + magenta : bleu-violet (a* > 20, b* < −40)', lab({ cyan: 0.5, magenta: 0.5 }).a > 20 && lab({ cyan: 0.5, magenta: 0.5 }).b < -40);
t('les trois pigments : presque neutre et sombre (C* < 8, L* < 60)', (() => { const l = lab({ jaune: 0.4, magenta: 0.4, cyan: 0.4 }); return Math.hypot(l.a, l.b) < 8 && l.L < 60; })());
t('sans pigment : blanc (L* = 100)', proche(lab({}).L, 100, 0.01));
t('le mélange est plus sombre que chaque pigment (L*)', lab({ jaune: 0.5, cyan: 0.5 }).L < Math.min(lab({ jaune: 0.5 }).L, lab({ cyan: 0.5 }).L));
t('ajouter du blanc éclaircit et désature', (() => { const a = lab({ jaune: 0.5, cyan: 0.5 }), b = lab({ jaune: 0.5, cyan: 0.5, blanc: 0.5 }); return b.L > a.L && Math.hypot(b.a, b.b) < Math.hypot(a.a, a.b); })());
t('la moyenne des réflectances donne un vert bien plus pâle que Kubelka-Munk', (() => { const a = S.labPeinture(S.reflMoyenne({ jaune: 0.5, cyan: 0.5 })), b = lab({ jaune: 0.5, cyan: 0.5 }); return Math.hypot(a.a, a.b) < 0.6 * Math.hypot(b.a, b.b) && a.L > b.L + 8; })());
t('moyenne : un seul pigment = sa réflectance', S.reflMoyenne({ jaune: 0.5 }).every((v, i) => proche(v, S.reflPeinture({ jaune: 0.5 })[i], 1e-12)));
const rj = S.reflPeinture({ jaune: 0.5 });
t('réflectance du jaune : faible vers 450 nm, élevée vers 650 nm', rj[S.LAMBDAS.indexOf(450)] < 0.3 && rj[S.LAMBDAS.indexOf(650)] > 0.7);
t('mélange : un pigment de plus ne peut que diminuer la réflectance', S.reflPeinture({ jaune: 0.5, cyan: 0.2 }).every((v, i) => v <= S.reflPeinture({ jaune: 0.5 })[i] + 1e-12));

// --- défis ---
const seq = (() => { let k = 0.137; return () => (k = (k * 9301 + 0.49297) % 1); })();
for (let i = 0; i < 60; i++) {
  const a = S.tirageAppariement(seq), cc = S.chroma(S.spectreRVB(a.r, a.v, a.b));
  t('défi appariement : cible atteinte par ses propres réglages', proche(cc.x, a.x, 1e-12) && a.Y > 5 && [a.r, a.v, a.b].every(v => v >= 0 && v <= 1));
  const r = S.tirageRecette(seq), l = S.labPeinture(S.reflPeinture(r.recette));
  t('défi recette : cible atteinte par sa propre recette (ΔE = 0)', C.deltaE76(l, r.lab) < 1e-9 && Object.values(r.recette).every(v => v >= 0 && v <= 1));
  t('défi recette : deux pigments au moins', Object.entries(r.recette).filter(([k, v]) => k !== 'blanc' && v >= 0.2).length === 2);
}

console.log(`${ok} vérifications réussies, ${ko} échec(s).`);
process.exit(ko ? 1 : 0);
