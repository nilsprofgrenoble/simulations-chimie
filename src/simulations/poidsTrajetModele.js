// Modèle de la simulation 250 : travail du poids, moteur, résistant ou nul selon le trajet (TSTL, PCM, Énergie mécanique).
// Un chariot roule sur un rail à cinq points remarquables A à E (profil inventé). Le poids a un travail m·g·(z départ − z arrivée) : il ne dépend que des altitudes.
// Sans frottement, la réaction du rail est perpendiculaire à la trajectoire : son travail est nul. Avec un frottement f de valeur constante opposé au mouvement : W = −f·L (L = longueur parcourue).
// Théorème de l'énergie cinétique (programme) : ΔEc = somme des travaux.
export const G = 9.8;                  // N/kg, valeur du programme et des autres simulations du site
export const F_FROTT = 1.5;            // N, frottement du rail quand il est pris en compte
export const PTS = [
  { id: 'A', x: 0, z: 1.2 }, { id: 'B', x: 1.1, z: 0 }, { id: 'C', x: 2.3, z: 0.8 }, { id: 'D', x: 3.3, z: 0.3 }, { id: 'E', x: 4.5, z: 1.2 },
];
export const pt = id => PTS.find(p => p.id === id);
// Altitude du rail à l'abscisse x : raccord en cosinus entre deux points consécutifs (tangente horizontale aux points remarquables)
export function zDe(x) {
  if (x <= PTS[0].x) return PTS[0].z;
  for (let i = 0; i < PTS.length - 1; i++) {
    const a = PTS[i], b = PTS[i + 1];
    if (x <= b.x) { const t = (x - a.x) / (b.x - a.x); return a.z + (b.z - a.z) * (1 - Math.cos(Math.PI * t)) / 2; }
  }
  return PTS[PTS.length - 1].z;
}
export const pente = x => { const h = 1e-4; return (zDe(x + h) - zDe(x - h)) / (2 * h); };
// Points du trajet de dep à arr (dans un sens ou dans l'autre) : abscisse, altitude, longueur de rail parcourue s
export function chemin(dep, arr, N = 240) {
  const x0 = pt(dep).x, x1 = pt(arr).x, pts = []; let s = 0, xp = x0, zp = zDe(x0);
  for (let i = 0; i <= N; i++) {
    const x = x0 + (x1 - x0) * i / N, z = zDe(x);
    if (i > 0) s += Math.hypot(x - xp, z - zp);
    pts.push({ x, z, s }); xp = x; zp = z;
  }
  return pts;
}
export const longueur = (dep, arr) => { const c = chemin(dep, arr); return c[c.length - 1].s; };
export const travailPoids = (m, zA, zB) => m * G * (zA - zB);          // = −m·g·(zB − zA)
export const travailFrottement = (f, L) => -f * L;
export const nature = W => (Math.abs(W) < 1e-9 ? 'nul' : W > 0 ? 'moteur' : 'résistant');
export const NATURES = ['moteur', 'nul', 'résistant'];
// Bilan d'un trajet de dep à arr (le trajet est direct : un seul sens le long du rail)
export function bilan({ m, dep, arr, frott = false }) {
  const zA = pt(dep).z, zB = pt(arr).z, L = longueur(dep, arr);
  const Wp = travailPoids(m, zA, zB), Wr = frott ? travailFrottement(F_FROTT, L) : 0;
  return { dz: zB - zA, L, Wp, Wr, somme: Wp + Wr, natureP: nature(Wp), natureR: nature(Wr), dEc: Wp + Wr };
}
// Valeurs du parcours guidé : chariot de 2,0 kg
export const PARCOURS = { m: 2.0, WAB: travailPoids(2.0, pt('A').z, pt('B').z), WBC: travailPoids(2.0, pt('B').z, pt('C').z), WAC: travailPoids(2.0, pt('A').z, pt('C').z) };
const tire = t => t[Math.floor(Math.random() * t.length)];
const PAIRES = PTS.flatMap(a => PTS.filter(b => b.id !== a.id).map(b => [a.id, b.id]));
const natPaire = ([a, b]) => nature(travailPoids(1, pt(a).z, pt(b).z));
// Défi A : trois trajets, un moteur, un résistant, un de travail nul ; avec ou sans frottement
export function tirageDefiA() {
  const parNat = n => PAIRES.filter(p => natPaire(p) === n);
  const trajets = [tire(parNat('moteur')), tire(parNat('résistant')), tire(parNat('nul'))].sort(() => Math.random() - 0.5).map(([dep, arr]) => ({ dep, arr }));
  return { type: 'signes', trajets, frott: Math.random() < 0.5 };
}
// Défi B : travail du poids pour un trajet entre deux altitudes différentes
export function tirageDefiB() {
  const [dep, arr] = tire(PAIRES.filter(p => natPaire(p) !== 'nul'));
  const m = tire([1, 2, 3, 4, 5]);
  return { type: 'calcul', m, dep, arr, W: travailPoids(m, pt(dep).z, pt(arr).z), L: longueur(dep, arr) };
}
