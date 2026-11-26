// Modèle PUR de la base / du nucléophile dessiné atome par atome en 3D : HO⁻ (O + H), H₂O (O + 2 H), tBuO⁻ (O + groupe tBu).
// Aucune dépendance à React ni à three.js : testé par baseAtomes.test.mjs.
// O : position de l'oxygène ; a : direction qui s'éloigne de la cible (carbone attaqué ou H arraché) ; p : direction perpendiculaire à a.
// lie ∈ [0, 1] : avancement de la liaison de O avec la cible. À 0, la molécule est libre ; à 1, c'est la molécule liée (H₂O, H₃O⁺, R–OH, R–OH₂⁺, tBuOH).
// Les liaisons O–cible sont dessinées par la scène ; ce modèle fournit les atomes de la base et leur charge.
export const L_OH = 0.9, L_OTBU = 1.4;
const rad = d => d * Math.PI / 180;
const dirAng = (a, p, beta, sgn = 1) => a.map((x, i) => x * Math.cos(beta) + sgn * p[i] * Math.sin(beta));
const pos = (O, d, L) => O.map((x, i) => x + L * d[i]);

// angleFinal : angle (en °) entre a et la liaison O–H une fois la liaison formée : 75,5° donne H–O–H = 104,5° (H₂O formée) quand la cible est un H ;
// ≈ 71° donne C–O–H ≈ 109° quand la cible est un carbone.
export function atomesBase(re, O, a, p, lie, angleFinal = 75.5) {
  const l = Math.min(1, Math.max(0, lie)), atomes = [], liaisons = [];
  if (re === 'HO') {
    const b = rad(angleFinal) * l;                                  // O–H libre : colinéaire avec la cible (angle 0), puis plié
    atomes.push({ el: 'H', p: pos(O, dirAng(a, p, b), L_OH) }); liaisons.push([-1, 0]);
  } else if (re === 'H2O') {
    const b = rad(52.25 + (68 - 52.25) * l);                        // H–O–H libre : 104,5° ; lié (H₃O⁺ ou oxonium) : plus pyramidal
    for (const s of [1, -1]) { atomes.push({ el: 'H', p: pos(O, dirAng(a, p, b, s), L_OH) }); liaisons.push([-1, atomes.length - 1]); }
  } else {
    const b = rad(60) * l;
    atomes.push({ el: 'tBu', p: pos(O, dirAng(a, p, b), L_OTBU) }); liaisons.push([-1, 0]);
  }
  const charge = re === 'H2O' ? (l > 0.5 ? '+' : null) : (l < 0.5 ? '−' : null);
  const nom = re === 'HO' ? (l > 0.5 ? 'H₂O' : 'HO⁻') : re === 'H2O' ? (l > 0.5 ? 'H₃O⁺' : 'H₂O') : (l > 0.5 ? 'tBuOH' : 'tBuO⁻');
  return { atomes, liaisons, charge, nom };
}
