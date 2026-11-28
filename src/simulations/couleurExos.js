// Exercices de calcul (REA) du chapitre BTS « Aspect : couleur » : tirages purs, testés par couleurExos.test.mjs.
//  • tirageLab  : C*, angle de teinte h et écart ΔE*ab d'un lot (sim 247)
//  • tirageXyy  : distances et pureté d'excitation sur le diagramme de chromaticité (sim 248)
//  • tirageFiltres : absorbance, absorbance totale, transmittance et part absorbée de deux filtres en série (sim 299)
// Chaque tirage reçoit une fonction `tire(tableau)` et renvoie { intro, questions, retenir }.
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const sg = n => (n < 0 ? '−' : '') + Math.abs(n);     // entier signé avec le vrai signe moins
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };

// ───────────── sim 247 : coordonnées L*a*b* d'un lot ─────────────
const CIBLES = [[45, 7, -24], [60, 32, 18], [35, -18, 12], [70, -25, 35], [50, 45, 25], [80, 5, -8], [55, 20, -30], [40, -30, -10]];
export const chromaH = (a, b) => ({ C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180 / Math.PI) + 360) % 360 });
export function tirageLab(tire) {
  const [Lc, ac, bc] = tire(CIBLES);
  const dL = tire([-3, -2, -1, 1, 2, 3]), da = tire([-5, -4, -3, 3, 4, 5]), db = tire([-5, -4, -3, 3, 4, 5]);
  const L = Lc + dL, a = ac + da, b = bc + db;
  const { C, h } = chromaH(a, b), C1 = arr(C, 1), dE = Math.sqrt(dL * dL + da * da + db * db);
  const intro = `Un spectrocolorimètre mesure un lot de peinture et sa cible : cible L* = ${sg(Lc)}, a* = ${sg(ac)}, b* = ${sg(bc)} ; lot L* = ${sg(L)}, a* = ${sg(a)}, b* = ${sg(b)}. On étudie le lot.`;
  const q1 = { id: 'lc0', type: 'num', unite: '', vrai: C, tolRel: 0.05, csMin: 2,
    q: `Calculez le chroma C* du lot, C* = sqrt(a*² + b*²) (sans unité, 3 chiffres significatifs).`,
    aide: 'C* est la longueur du vecteur (a*, b*) : racine carrée de la somme des carrés de a* et de b*. L* n’intervient pas.',
    pieges: [[Math.abs(a) + Math.abs(b), 'Vous avez additionné |a*| et |b*| : C* est la racine de la somme des carrés (théorème de Pythagore).'], [a * a + b * b, 'Il manque la racine carrée : vous avez calculé a*² + b*².'], [Math.sqrt(L * L + a * a + b * b), 'Vous avez inclus L* : le chroma ne dépend que de a* et b*.']],
    expl: `C* = sqrt(a*² + b*²) = sqrt((${d(a, 0)})² + (${d(b, 0)})²) = sqrt(${d(a * a + b * b, 0)}) ≈ ${d(C, 1)}.` };
  const q2 = { id: 'lc1', type: 'num', unite: '°', vrai: h, tolRel: 0.05, csMin: 2,
    q: `Calculez l’angle de teinte h du lot, entre 0° et 360°, mesuré depuis l’axe +a* (3 chiffres significatifs).`,
    aide: 'h = arctan(b* / a*), à ajuster selon le quadrant : si a* < 0, ajoutez 180° ; si a* > 0 et b* < 0, ajoutez 360° pour rester entre 0° et 360°.',
    pieges: [[Math.atan2(a, b) * 180 / Math.PI, 'Vous avez inversé a* et b* : h = arctan(b* / a*), mesuré depuis l’axe +a*.'], [Math.atan(b / a) * 180 / Math.PI, 'La calculatrice donne un angle entre −90° et 90° : corrigez selon le signe de a* et de b* pour obtenir h entre 0° et 360°.'], [Math.atan(b / a) * 180 / Math.PI + 180, 'Le quadrant n’est pas le bon : regardez les signes de a* et de b*.']],
    expl: `h = arctan(b* / a*) avec a* = ${d(a, 0)} et b* = ${d(b, 0)}, dans le bon quadrant : h ≈ ${d(h, 1)}°.` };
  const q3 = { id: 'lc2', type: 'num', unite: '', vrai: dE, tolRel: 0.05, csMin: 2,
    q: `Calculez l’écart de couleur ΔE*ab entre le lot et la cible, ΔE*ab = sqrt(ΔL*² + Δa*² + Δb*²) avec Δ = lot − cible (sans unité, 2 chiffres significatifs).`,
    aide: 'Calculez d’abord les trois écarts ΔL*, Δa* et Δb* (lot moins cible), puis la racine de la somme de leurs carrés.',
    pieges: [[Math.abs(dL) + Math.abs(da) + Math.abs(db), 'Vous avez additionné les écarts : ΔE*ab est la racine de la somme des carrés.'], [dL * dL + da * da + db * db, 'Il manque la racine carrée : vous avez calculé ΔL*² + Δa*² + Δb*².'], [Math.hypot(da, db), 'Vous avez oublié ΔL* : l’écart de luminosité compte dans ΔE*ab.']],
    expl: `ΔL* = ${d(dL, 0)}, Δa* = ${d(da, 0)}, Δb* = ${d(db, 0)} ; ΔE*ab = sqrt(${dL * dL} + ${da * da} + ${db * db}) = sqrt(${dL * dL + da * da + db * db}) ≈ ${d(dE, 1)}.` };
  void C1;
  const qs = [q1, q2, q3]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['C* = sqrt(a*² + b*²) : la distance à l’axe des gris, mesure de l’intensité de la couleur.', 'h = arctan(b* / a*), à placer dans le bon quadrant (entre 0° et 360°).', 'ΔE*ab = sqrt(ΔL*² + Δa*² + Δb*²) : on additionne les carrés des écarts, pas les écarts.'] };
}

// ───────────── sim 248 : pureté d'excitation sur le diagramme xy ─────────────
const BLANC = { x: 0.313, y: 0.329 };       // D65
const LIEU = { 480: [0.0913, 0.1327], 500: [0.0082, 0.5384], 520: [0.0743, 0.8338], 540: [0.2296, 0.7543], 560: [0.3731, 0.6245], 580: [0.5125, 0.4866], 590: [0.5752, 0.4242], 600: [0.6270, 0.3725], 620: [0.6915, 0.3083] };
export function tirageXyy(tire) {
  const lam = tire(Object.keys(LIEU).map(Number)), [xD, yD] = LIEU[lam], p = tire([0.3, 0.4, 0.5, 0.6, 0.7]);
  const xP = arr(BLANC.x + p * (xD - BLANC.x), 3), yP = arr(BLANC.y + p * (yD - BLANC.y), 3);
  const xDa = arr(xD, 3), yDa = arr(yD, 3);
  const WP = arr(Math.hypot(xP - BLANC.x, yP - BLANC.y), 3), WD = arr(Math.hypot(xDa - BLANC.x, yDa - BLANC.y), 3), pur = WP / WD;
  const nbx = v => d(v, 3);
  const intro = `Sur le diagramme de chromaticité CIE 1931, une couleur P a pour coordonnées (x ; y) = (${nbx(xP)} ; ${nbx(yP)}). Le blanc de référence D65 est W = (${nbx(BLANC.x)} ; ${nbx(BLANC.y)}). La droite qui part de W et passe par P coupe le lieu spectral en D, de longueur d’onde dominante ${lam}${NB}nm : D = (${nbx(xDa)} ; ${nbx(yDa)}).`;
  const q1 = { id: 'xy0', type: 'num', unite: '', vrai: Math.hypot(xP - BLANC.x, yP - BLANC.y), tolRel: 0.06, csMin: 2,
    q: `Calculez la distance WP entre le blanc W et la couleur P (sans unité, 2 chiffres significatifs).`,
    aide: 'Distance entre deux points : racine de (Δx)² + (Δy)², avec Δx = x(P) − x(W) et Δy = y(P) − y(W).',
    pieges: [[Math.abs(xP - BLANC.x) + Math.abs(yP - BLANC.y), 'Vous avez additionné les écarts : la distance est la racine de la somme des carrés.'], [Math.hypot(xP, yP), 'Vous avez calculé la distance à l’origine : il faut les écarts entre P et W.']],
    expl: `WP = sqrt((${nbx(xP)} − ${nbx(BLANC.x)})² + (${nbx(yP)} − ${nbx(BLANC.y)})²) = sqrt(${d((xP - BLANC.x) ** 2 + (yP - BLANC.y) ** 2, 4)}) ≈ ${d(WP, 3)}.` };
  const q2 = { id: 'xy1', type: 'num', unite: '', vrai: Math.hypot(xDa - BLANC.x, yDa - BLANC.y), tolRel: 0.06, csMin: 2,
    q: `Calculez la distance WD entre le blanc W et le point D du lieu spectral (sans unité, 2 chiffres significatifs).`,
    aide: 'Même méthode que pour WP, avec les coordonnées de D à la place de celles de P.',
    pieges: [[Math.abs(xDa - BLANC.x) + Math.abs(yDa - BLANC.y), 'Vous avez additionné les écarts : la distance est la racine de la somme des carrés.'], [Math.hypot(xDa, yDa), 'Vous avez calculé la distance à l’origine : il faut les écarts entre D et W.']],
    expl: `WD = sqrt((${nbx(xDa)} − ${nbx(BLANC.x)})² + (${nbx(yDa)} − ${nbx(BLANC.y)})²) ≈ ${d(WD, 3)}.` };
  const q3 = { id: 'xy2', type: 'num', unite: '', vrai: pur, tolRel: 0.06, csMin: 2,
    q: `Avec WP = ${d(WP, 3)} et WD = ${d(WD, 3)}, calculez la pureté d’excitation de la couleur P (sans unité, 2 chiffres significatifs).`,
    aide: 'La pureté d’excitation est le rapport frac(WP|WD) : 0 au blanc, 1 sur le lieu spectral.',
    pieges: [[WD / WP, 'Le rapport est inversé : la pureté vaut frac(WP|WD), donc moins de 1 pour une couleur à l’intérieur du diagramme.'], [WD - WP, 'Un rapport est un quotient, pas une différence.']],
    expl: `Pureté = frac(WP|WD) = ${d(WP, 3)} / ${d(WD, 3)} ≈ ${d(pur, 2)}.` };
  const qs = [q1, q2, q3]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['Distance entre deux points du diagramme : sqrt((Δx)² + (Δy)²).', 'Pureté d’excitation = frac(WP|WD) : 0 pour le blanc, 1 pour une lumière monochromatique du lieu spectral.'] };
}

// ───────────── sim 299 : deux filtres en série (absorbance et transmittance) ─────────────
export function tirageFiltres(tire) {
  const T1 = tire([0.8, 0.63, 0.5, 0.4, 0.25]), T2 = tire([0.79, 0.5, 0.32, 0.2, 0.1]);
  const A1 = -Math.log10(T1), A2 = -Math.log10(T2), A1r = arr(A1, 3), A2r = arr(A2, 3), At = A1r + A2r, Tt = 10 ** (-At), Tvrai = T1 * T2;
  const part = arr(Tvrai, 3);
  const intro = `Un filtre jaune puis un filtre cyan sont placés l’un derrière l’autre devant une lampe blanche. À une longueur d’onde donnée, leurs transmittances valent T₁ = ${d(T1, 2)} et T₂ = ${d(T2, 2)}. On néglige les réflexions sur les faces des filtres.`;
  const q1 = { id: 'fi0', type: 'num', unite: '', vrai: A1, tolRel: 0.05, csMin: 2,
    q: `Calculez l’absorbance A₁ du premier filtre, A₁ = −log₁₀(T₁) (sans unité, 2 chiffres significatifs).`,
    aide: 'Utilisez le logarithme décimal (touche log de la calculatrice), pas le logarithme népérien (ln).',
    pieges: [[-Math.log(T1), 'Vous avez utilisé le logarithme népérien (ln) : l’absorbance se définit avec le logarithme décimal.'], [1 - T1, 'Vous avez calculé la part absorbée 1 − T : l’absorbance est −log₁₀(T).'], [T1, 'C’est la transmittance : l’absorbance vaut −log₁₀(T).']],
    expl: `A₁ = −log₁₀(${d(T1, 2)}) ≈ ${d(A1, 3)}.` };
  const q2 = { id: 'fi1', type: 'num', unite: '', vrai: At, tolRel: 0.05, csMin: 2,
    q: `Avec A₁ = ${d(A1r, 3)} et A₂ = ${d(A2r, 3)} (valeurs données), calculez l’absorbance totale A de l’ensemble des deux filtres (sans unité, 2 chiffres significatifs).`,
    aide: 'Les absorbances de filtres successifs s’additionnent.',
    pieges: [[A1r * A2r, 'Vous avez multiplié les absorbances : ce sont les transmittances qui se multiplient, les absorbances s’additionnent.'], [(A1r + A2r) / 2, 'Vous avez fait la moyenne : la lumière traverse les deux filtres, les absorbances s’additionnent.']],
    expl: `A = A₁ + A₂ = ${d(A1r, 3)} + ${d(A2r, 3)} = ${d(At, 3)}.` };
  const q3 = { id: 'fi2', type: 'num', unite: '', vrai: Tt, tolRel: 0.06, csMin: 2,
    q: `Avec A = ${d(At, 3)}, calculez la transmittance T de l’ensemble, T = 10^(−A) (sans unité, 2 chiffres significatifs).`,
    aide: 'T = 10 puissance moins A : touche 10ˣ de la calculatrice avec la valeur négative −A.',
    pieges: [[10 ** At, 'Vous avez oublié le signe moins : T = 10^(−A), toujours inférieure à 1.'], [1 - At, 'Vous avez calculé 1 − A : la transmittance se déduit de l’absorbance par 10^(−A).'], [At, 'C’est l’absorbance : la transmittance vaut 10^(−A).']],
    expl: `T = 10^(−${d(At, 3)}) ≈ ${d(Tt, 2)}, ce qui est bien T₁ × T₂ = ${d(T1, 2)} × ${d(T2, 2)} = ${d(Tvrai, 2)}.` };
  const q4 = { id: 'fi3', type: 'num', unite: '%', vrai: (1 - part) * 100, tolRel: 0.06, csMin: 2,
    q: `Avec T = ${d(part, 3)}, quel pourcentage de la lumière envoyée est absorbé par l’ensemble des deux filtres (2 chiffres significatifs) ?`,
    aide: 'La lumière qui n’est pas transmise est absorbée (on néglige les réflexions) : part absorbée = 1 − T.',
    pieges: [[part * 100, 'C’est le pourcentage transmis : la part absorbée est le complément, 1 − T.'], [(1 - T1) * 100 + (1 - T2) * 100, 'Vous avez additionné les parts absorbées de chaque filtre : le second filtre ne reçoit que la lumière transmise par le premier.']],
    expl: `Part absorbée = 1 − ${d(part, 3)} = ${d(1 - part, 3)}, soit ${d((1 - part) * 100, 1)}${NB}%.` };
  const qs = [q1, q2, q3, q4]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['Absorbance A = −log₁₀(T) ; transmittance T = 10^(−A).', 'Deux filtres en série : les absorbances s’additionnent, les transmittances se multiplient (T = T₁ × T₂).', 'Part de lumière absorbée = 1 − T (réflexions négligées).'] };
}
