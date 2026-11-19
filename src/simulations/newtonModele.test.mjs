import * as M from './newtonModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// somme de vecteurs, a = ΣF / m : même direction et même sens que ΣF (m > 0)
{ const F = [{ x: 6, y: 0 }, { x: -2, y: 0 }], S = M.somme(F), a = M.acceleration(F, 2);
  ok(S.x === 4 && S.y === 0 && a.x === 2 && a.y === 0, 'ΣF = 4 N, a = 2 m/s² pour m = 2 kg'); }
// chariot sur un rail : équilibre vertical R = P − T sin α, donc ΣF vertical nul
for (const alpha of [0, 15, 20, 30, 40]) for (const T of [0, 3, 6, 10]) {
  const F = M.forcesRail({ m: 2, T, alpha, f: 2 }), S = M.somme(F);
  ok(Math.abs(S.y) < 1e-9, 'équilibre vertical du chariot'); ok(proche(S.x, T * Math.cos(M.rad(alpha)) - 2), 'ΣF horizontale'); ok(F[1].y >= 0, 'réaction positive');
}
// parcours : chariot de 2,0 kg, T = 6,0 N, f = 2,0 N : ΣFx = 4,0 N, ax = 2,0 m/s², R = P = 19,6 N
{ const b = M.bilan('rail', { m: 2, T: 6, alpha: 0, f: 2 }); ok(proche(b.S.x, 4) && proche(b.a.x, 2) && proche(b.forces[1].y, 19.6) && Math.abs(b.a.y) < 1e-9, 'chariot du parcours'); }
// masse suspendue 0,50 kg, T = 6,0 N : ΣFy = 1,1 N, ay = +2,2 m/s² (vers le haut)
{ const b = M.bilan('fil', { m: 0.5, T: 6 }); ok(proche(b.S.y, 1.1) && proche(b.a.y, 2.2), 'masse suspendue du parcours'); }
// cabine de 800 kg : de 0 à 1,6 m/s en 2,0 s : a = 0,80 m/s², ΣF = 640 N, T = 8 480 N
{ const a = M.accDepuisVitesses(0, 1.6, 2.0); ok(proche(a, 0.8), 'a cabine'); ok(proche(800 * a, 640), 'ΣF cabine'); ok(proche(M.filDepuisA({ m: 800, ay: a }), 8480), 'T cabine'); }
// parachutiste de 80 kg à vitesse constante : f = P = 784 N, ΣF = 0, a = 0
{ const b = M.bilan('chute', { m: 80, f: M.chuteDepuisA({ m: 80, ay: 0 }) }); ok(proche(b.forces[1].y, 784) && M.quasiNul(b.S) && M.quasiNul(b.a), 'équilibre du parachutiste'); }
// sens inverse puis sens direct : retrouve l'accélération choisie
for (const m of [1, 2, 5]) for (const alpha of [0, 20, 40]) for (const f of [0, 2, 5]) for (const ax of [0, 1, 3]) {
  const T = M.railDepuisA({ m, alpha, f, ax }); ok(T >= 0, 'T ≥ 0'); ok(proche(M.bilan('rail', { m, T, alpha, f }).a.x, ax), 'aller-retour chariot'); }
for (const ay of [-4, -2, 0, 2, 4]) { ok(proche(M.bilan('fil', { m: 0.7, T: M.filDepuisA({ m: 0.7, ay }) }).a.y, ay), 'aller-retour fil'); ok(proche(M.bilan('chute', { m: 70, f: M.chuteDepuisA({ m: 70, ay }) }).a.y, ay), 'aller-retour chute'); }
// freinage d'une cabine qui monte : v de 2,0 à 0 m/s, a < 0 (vers le bas) alors que la vitesse est vers le haut, T < P
{ const a = M.accDepuisVitesses(2.0, 0, 2.5), T = M.filDepuisA({ m: 800, ay: a }); ok(a < 0 && T < 800 * M.G, 'freinage en montée : a vers le bas, T < P'); }
// défi 1 : 30 000 tirages, tolérance 7 % tenue par un élève qui arrondit
let pire1 = 0, pire2 = 0; const types = new Set();
for (let i = 0; i < 30000; i++) {
  const d = M.tirageDefiAcc(); types.add(d.type);
  ok(isFinite(d.vrai) && Math.abs(d.vrai) >= 0.4, 'a finie et non négligeable');
  ok(Math.abs(M.somme(d.forces).y - (d.composante === 'y' ? d.S.y : 0)) < 1e-9, 'composante cohérente');
  const e = M.pireEcartDefi1(d); pire1 = Math.max(pire1, e); ok(e <= 0.07, `tolérance défi 1 : ${e} (${JSON.stringify(d)})`);
}
ok(types.has('rail') && types.has('fil') && types.has('cabine'), 'les trois situations du défi 1 sont tirées');
// défi 2 : 30 000 tirages
const types2 = new Set();
for (let i = 0; i < 30000; i++) {
  const d = M.tirageDefiForces(); types2.add(d.type);
  ok(isFinite(d.vrai) && d.vrai > 0, 'force positive'); ok(d.type !== 'rail' || d.a > 0, 'chariot qui accélère');
  if (d.type === 'cabine') ok(d.a !== 0 && Math.abs(d.a) <= 1.3, 'accélération de cabine raisonnable');
  const e = M.pireEcartDefi2(d); pire2 = Math.max(pire2, e); ok(e <= 0.06, `tolérance défi 2 : ${e} (${JSON.stringify(d)})`);
}
ok(types2.has('rail') && types2.has('cabine'), 'les deux situations du défi 2 sont tirées');
// critère d'équilibre unique (bandeau, mesures et message de l'exploration) : somme négligeable devant le poids (0,5 %)
ok(M.estEquilibre({ x: 0, y: 0 }, 1.5) && M.estEquilibre({ x: 1e-14, y: -1e-14 }, 80), 'somme nulle : équilibre');
ok(!M.estEquilibre(M.somme(M.forcesFil({ m: 0.5, T: 5.0 })), 0.5), 'masse suspendue T = 5,0 N (P = 4,9 N) : pas d’équilibre (ΣF_y = 0,10 N)');
ok(M.estEquilibre(M.somme(M.forcesFil({ m: 0.5, T: 0.5 * M.G })), 0.5), 'T = P : équilibre');
for (const alpha of [0, 5, 10, 20, 30, 40]) for (const f of [0, 0.5, 1, 2.5, 5]) {   // « Mettre à l'équilibre » du chariot : T = f / cos α, sans arrondi
  const T = f / Math.cos(M.rad(alpha)); ok(M.estEquilibre(M.somme(M.forcesRail({ m: 1.5, T, alpha, f })), 1.5), `équilibre du chariot α = ${alpha}°, f = ${f} N`); ok(T <= 10, 'T dans la plage du curseur');
}
console.log('newtonModele : tous les tests passent (' + n + ' contrôles ; pire écart défi 1 : ' + (100 * pire1).toFixed(1) + ' %, défi 2 : ' + (100 * pire2).toFixed(1) + ' %)');
