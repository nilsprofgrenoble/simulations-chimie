// Sim 243 : Microémulsions, types de Winsor et effet du sel (BTS Formulation). Modèle QUALITATIF.
// Système du TP : eau salée + toluène + mélange actif SDS/butanol. Volumes en fractions du volume total.
export const SALINITE_MIN = 1, SALINITE_MAX = 12, SAL_OPT = 7;     // % massique de NaCl par rapport à l'eau (optimum illustratif)
export const LARGEUR = 2;                                          // demi-largeur du domaine triphasique (illustratif)
export const A_MIN = 6, A_IV = 30;                                 // teneur en mélange actif (%) : TP ≈ 6 % ; Winsor IV au-delà de A_IV (illustratif)
export const MASSE_EAU = 12, MG_PAR_POUR_CENT = 120;               // 12 g d'eau ; 1 % de sel = 120 mg
export const masseSel = s => MASSE_EAU * s / 100;                 // g
const borne = (x, a, b) => Math.max(a, Math.min(b, x));

// Volumes des phases (fractions) : huile en excès o, eau en excès e, microémulsion m (somme = 1)
export function etat(S, a = A_MIN, opt = SAL_OPT) {
  const s1 = opt - LARGEUR, s2 = opt + LARGEUR;
  let o, e;
  if (S < s1) { o = 0.35 + 0.15 * borne((s1 - S) / (s1 - SALINITE_MIN), 0, 1); e = 0; }
  else if (S < opt) { o = 0.35; e = 0.35 * (S - s1) / (opt - s1); }
  else if (S <= s2) { o = 0.35 * (s2 - S) / (s2 - opt); e = 0.35; }
  else { o = 0; e = 0.35 + 0.15 * borne((S - s2) / (SALINITE_MAX - s2), 0, 1); }
  const k = borne(1 - (a - A_MIN) / (A_IV - A_MIN), 0, 1);       // le mélange actif supplémentaire réduit les excès
  o *= k; e *= k;
  const m = 1 - o - e;
  let type = a >= A_IV ? 'IV' : S <= s1 ? 'I' : S >= s2 ? 'II' : 'III';
  const micro = type === 'IV' ? (S < opt - 0.5 ? 'H/E' : S > opt + 0.5 ? 'E/H' : 'bicontinue') : type === 'I' ? 'H/E' : type === 'II' ? 'E/H' : 'bicontinue';
  return { o, e, m, type, micro, S, a };
}
export const rapportR = (S, opt = SAL_OPT) => S < opt - 0.5 ? '< 1' : S > opt + 0.5 ? '> 1' : '≈ 1';
export const NOM_TYPE = { I: 'Winsor I', II: 'Winsor II', III: 'Winsor III', IV: 'Winsor IV' };
export const DESC_TYPE = { I: 'microémulsion H/E + huile en excès', II: 'microémulsion E/H + eau en excès', III: 'microémulsion bicontinue + huile en excès + eau en excès', IV: 'une seule phase : la microémulsion' };
// Optimum : les deux excès ont le même volume
export const estOptimum = (S, opt = SAL_OPT) => { const x = etat(S, A_MIN, opt); return x.type === 'III' && Math.abs(x.o - x.e) < 0.04; };
// Série des 12 flacons du TP (salinité 1 à 12 %)
export const serie = (opt = SAL_OPT) => Array.from({ length: 12 }, (_, i) => etat(i + 1, A_MIN, opt));
export const flaconOptimum = (opt = SAL_OPT) => { let b = 1, d = 1e9; serie(opt).forEach((x, i) => { const dd = Math.abs(x.o - x.e) + (x.type === 'III' ? 0 : 1); if (dd < d) { d = dd; b = i + 1; } }); return b; };

// Défis
export function tirageOptimum(rng = Math.random) { const opt = 4 + Math.floor(rng() * 6) + (rng() - 0.5) * 0.5; return { opt, vrai: flaconOptimum(opt) }; }
export const ACTIONS = { plus: 'ajouter du sel', moins: 'retirer du sel (diluer la phase aqueuse)', ok: 'rien : on est à la formulation optimale' };
export function tirageDiagnostic(rng = Math.random) {
  for (;;) {
    const S = SALINITE_MIN + Math.floor(rng() * 12) + (rng() < 0.5 ? 0 : 0.5);
    const x = etat(S);
    if (x.type === 'IV') continue;
    const vrai = estOptimum(S) ? 'ok' : S < SAL_OPT ? 'plus' : 'moins';
    return { S, x, type: x.type, vrai };
  }
}
export const verifieDiagnostic = (d, type, action) => type === d.type && action === d.vrai;
