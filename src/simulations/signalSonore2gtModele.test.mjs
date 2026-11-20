// Tests du modèle « signal sonore » 2GT : node src/simulations/signalSonore2gtModele.test.mjs
import * as M from './signalSonore2gtModele.js';
let ko = 0;
const proche = (nom, x, ref, tolRel) => { const ok = Math.abs(x - ref) <= Math.abs(ref) * tolRel + 1e-12; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const plat = t => t.replace(/ /g, ' ');

// relations calculées à part, à la main
proche('T = 4 ms → f = 250 Hz', M.frequenceHz(4), 250, 1e-12);
proche('T = 2,5 ms → f = 400 Hz', M.frequenceHz(2.5), 400, 1e-12);
proche('T = 0,05 ms → f = 20 000 Hz', M.frequenceHz(0.05), 20000, 1e-12);
proche('f = 125 Hz → T = 8 ms', M.periodeMs(125), 8, 1e-12);
proche('4 ms = 0,004 s', M.secondesDepuisMs(4), 0.004, 1e-12);
proche('f = 1 / 0,004 s = 250 Hz', M.frequenceDepuisSecondes(0.004), 250, 1e-12);
proche('12,5 ms pour 5 motifs → T = 2,5 ms', M.periodeDepuisMotifs(12.5, 5), 2.5, 1e-12);
vrai('domaine 5 Hz : infrason', M.domaine(5) === 'infrason');
vrai('domaine 19,9 Hz : infrason', M.domaine(19.9) === 'infrason');
vrai('domaine 20 Hz : audible', M.domaine(20) === 'audible');
vrai('domaine 440 Hz : audible', M.domaine(440) === 'audible');
vrai('domaine 20 kHz : audible', M.domaine(20000) === 'audible');
vrai('domaine 50 kHz : ultrason', M.domaine(50000) === 'ultrason');
vrai('compareLa 220 Hz : plus grave', M.compareLa(220).includes('plus grave'));
vrai('compareLa 880 Hz : plus aigu', M.compareLa(880).includes('plus aigu'));
vrai('compareLa 440 Hz : même hauteur', M.compareLa(440).includes('même hauteur'));
vrai('jouable : 100 Hz oui, 50 Hz non, 10 kHz non', M.jouable(100) && !M.jouable(50) && !M.jouable(10000));

// formes : périodiques, de valeur maximale 1, centrées sur zéro
for (const f of M.FORMES) {
  let max = 0, somme = 0, N = 4000;
  for (let i = 0; i < N; i++) { const v = M.motif(f.id, i / N); max = Math.max(max, Math.abs(v)); somme += v; }
  proche(`${f.id} : valeur maximale 1`, max, 1, 1e-6);
  vrai(`${f.id} : moyenne nulle`, Math.abs(somme / N) < 1e-3);
  vrai(`${f.id} : périodique (u(t + T) = u(t))`, [0.13, 0.37, 0.61, 0.86].every(p => Math.abs(M.tension(f.id, 0.8, 2.5, p * 2.5 + 7 * 2.5, 0.3) - M.tension(f.id, 0.8, 2.5, p * 2.5, 0.3)) < 1e-9));
}
proche('sinus : sommet à T/4 (phase 0,25)', M.phaseSommet('sinus'), 0.25, 1e-3);
proche('sinus : u au sommet = A', M.tension('sinus', 0.8, 4, 1), 0.8, 1e-9);        // sommets à 1, 5, 9 ms pour T = 4 ms
proche('sinus : u à 5 ms = A', M.tension('sinus', 0.8, 4, 5), 0.8, 1e-9);
vrai('sinus : u à 3 ms = −A (creux)', Math.abs(M.tension('sinus', 0.8, 4, 3) + 0.8) < 1e-9);
vrai('triangle : u(T/4) = A', Math.abs(M.tension('triangle', 0.5, 4, 1) - 0.5) < 1e-9);
vrai('carré : ±A', Math.abs(M.tension('carre', 0.5, 4, 1) - 0.5) < 1e-9 && Math.abs(M.tension('carre', 0.5, 4, 3) + 0.5) < 1e-9);
// timbre : même T, formes différentes ; amplitude : proportionnelle à A
vrai('même période, formes différentes', M.tension('violon', 1, 5, 1.1) !== M.tension('clarinette', 1, 5, 1.1));
proche('amplitude proportionnelle', M.tension('clarinette', 0.9, 5, 1.3), 3 * M.tension('clarinette', 0.3, 5, 1.3), 1e-9);

// échelles
vrai('baseAuto(4 ms) = 1 ms par carreau', M.baseAuto(4) === 1);
vrai('baseAuto(5 ms) = 2 ms par carreau', M.baseAuto(5) === 2);
vrai('baseAuto(0,025 ms) = 0,01', M.baseAuto(0.025) === 0.01);
vrai('baseAuto(200 ms) = 50', M.baseAuto(200) === 50);
for (const T of M.PERIODES) { const b = M.baseAuto(T), n = 10 * b / T; if (!(n >= 2.49 && n <= 12.5)) { ko++; console.log(`✗ baseAuto(${T}) montre ${n} motifs`); } }
vrai('périodes de l’exploration : fréquences rondes', M.PERIODES.every(T => Math.abs(M.frequenceHz(T) - Math.round(M.frequenceHz(T))) < 1e-9));

// écriture des nombres
vrai('nbLisible 0,004', M.nbLisible(0.004) === '0,004');
vrai('nbLisible 250', M.nbLisible(250) === '250');
vrai('nbLisible 40 000 (espace insécable)', M.nbLisible(40000) === `40${M.NB}000`);
vrai('nbLisible 0,0025', M.nbLisible(0.0025) === '0,0025');
vrai('nbLisible 2,5', M.nbLisible(2.5) === '2,5');
vrai('fTexte 2500 Hz = 2,5 kHz', plat(M.fTexte(2500)) === '2,5 kHz');
vrai('fTexte 440 Hz', plat(M.fTexte(440)) === '440 Hz');
vrai('fTexte 50 kHz', plat(M.fTexte(50000)) === '50 kHz');

// défis : cohérence sur de nombreux tirages
for (let i = 0; i < 3000; i++) {
  const d = M.tirerDefiLire();
  if (Math.abs(d.T * d.f - 1000) > 1e-6 || d.vrai !== d.T || !M.BASES.concat([0.1]).includes(d.base) || ![2, 4, 5].includes(d.k) || Math.abs(d.T - d.k * d.base) > 1e-9) { ko++; console.log('✗ défi lire incohérent', d); break; }
  const n = 10 * d.base / d.T;
  if (!(n >= 2 && n <= 5)) { ko++; console.log('✗ défi lire : nombre de motifs à l’écran', d); break; }
  if (d.A * 1 > 1.4) { ko++; console.log('✗ défi lire : amplitude trop grande', d); break; }
}
for (let i = 0; i < 3000; i++) {
  const d = M.tirerDefiRegler();
  const pas = d.Tvrai / M.T_PAS;
  if (Math.abs(pas - Math.round(pas)) > 1e-6 || d.Tvrai < M.T_MIN || d.Tvrai > M.T_MAX || Math.abs(M.frequenceHz(d.Tvrai) - d.f) > 1e-6) { ko++; console.log('✗ défi régler : T cible non atteignable', d); break; }
  // le réglage de départ n'est jamais accepté d'avance
  if (Math.abs(M.ecartRelatif(M.frequenceHz(M.T_DEPART), d.f)) <= M.toleranceRegler) { ko++; console.log('✗ défi régler : départ déjà accepté', d); break; }
}
// défi régler : tous les cibles sont atteignables avec le curseur (T = k × 0,05), et seul le voisinage immédiat est accepté
for (const f of M.CIBLES_F) {
  const acceptes = [];
  for (let T = M.T_MIN; T <= M.T_MAX + 1e-9; T += M.T_PAS) if (Math.abs(M.ecartRelatif(M.frequenceHz(T), f)) <= M.toleranceRegler) acceptes.push(Number(T.toFixed(2)));
  if (!acceptes.length || !acceptes.some(t => Math.abs(t - M.periodeMs(f)) < 1e-6)) { ko++; console.log('✗ défi régler : cible non atteignable', f, acceptes); }
}
console.log(ko ? `${ko} ÉCHEC(S)` : 'Tous les tests passent.');
process.exit(ko ? 1 : 0);
