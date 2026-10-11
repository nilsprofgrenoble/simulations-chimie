// ====================================================
//  ATELIER « CE RÉSULTAT EST-IL VRAISEMBLABLE ? » — BANQUE
// ====================================================
// Un énoncé, le calcul d'un élève et son résultat. Selon la variante tirée, le résultat est correct ou contient une erreur typique
// (unité non convertie, formule inversée, signe, °C et K mélangés, trop de chiffres significatifs…).
// L'élève doit : 1. juger (vraisemblable, invraisemblable, ou plausible mais mal écrit) ; 2. justifier avec un repère ;
// 3. diagnostiquer l'erreur ; 4. donner la valeur correcte. Aucune dépendance à React : testable seul.

const tire = t => t[Math.floor(Math.random() * t.length)];
export const mulberry32 = a => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const nb = (x, d = null) => (d == null
  ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: 3 })
  : Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })).replace(/-/g, '−');
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
// nombre lisible : écriture décimale entre 10⁻² et 10⁶, scientifique au-delà
export const fm = (x, sig = 3) => {
  const ax = Math.abs(x);
  if (ax === 0) return '0';
  if (ax >= 1e6 || ax < 1e-2) {
    const e = Math.floor(Math.log10(ax)), m = x / 10 ** e;
    const ex = String(e).replace('-', '⁻').replace(/\d/g, c => SUP[+c]);
    return `${Number(m.toPrecision(sig)).toLocaleString('fr-FR', { maximumSignificantDigits: sig }).replace(/-/g, '−')}×10${ex}`;
  }
  return Number(x.toPrecision(sig)).toLocaleString('fr-FR', { maximumSignificantDigits: sig }).replace(/-/g, '−');
};

export const VERDICTS = {
  ok: 'Résultat vraisemblable',
  absurde: 'Résultat invraisemblable (valeur absurde ou très improbable)',
  forme: 'Valeur plausible, mais mal écrite (chiffres significatifs)',
};
export const CAUSES = {
  aucune: 'Aucune erreur : le calcul est correct',
  conv: 'Oubli ou erreur de conversion d’unité',
  formule: 'Formule fausse ou mal utilisée (inversée, terme oublié, somme au lieu de différence…)',
  signe: 'Erreur de signe ou d’exposant',
  temp: 'Mélange de °C et de K dans un écart de température',
  sigfig: 'Trop de chiffres significatifs dans l’écriture du résultat',
};
export const COMPETENCES = ['Juger un ordre de grandeur', 'Justifier avec un repère', 'Diagnostiquer l’erreur', 'Corriger le résultat'];
const GENERIQUES = [
  'Un résultat est toujours vraisemblable s’il est écrit avec une unité.',
  'La calculatrice ne se trompe jamais : le résultat est donc correct.',
  'Le résultat est positif, donc il est forcément bon.',
  'Rien ne permet de juger sans refaire entièrement le calcul.',
  'Le résultat est trop long à écrire pour être juste.',
];

// ── Items ──  v(p) : variantes { cle: { cause, calc, res, arg, piege? } } ; val(p) : valeur correcte
export const ITEMS = [
  { id: 'piscine', domaine: 'Statique des fluides', titre: 'Pression au fond d’une piscine',
    repere: '1 bar ≈ 10 m d’eau · pression atmosphérique ≈ 1 bar · pression relative : on ne compte pas la pression de l’air.',
    gen: () => ({ h: tire([2, 3, 4]) }),
    enonce: p => `Une piscine contient de l’eau (ρ = 1000 kg·m⁻³ ; g = 9,81 N·kg⁻¹) sur une profondeur de ${p.h} m. Un élève calcule la pression relative (par rapport à l’atmosphère) au fond de la piscine.`,
    val: p => ({ val: 1000 * 9.81 * p.h, u: 'Pa' }),
    v: p => { const P = 1000 * 9.81 * p.h, P1 = P * 100, P3 = 1000 * p.h / 9.81; return {
      ok: { cause: 'aucune', calc: `P = ρ·g·h = 1000 × 9,81 × ${p.h} = ${fm(P)} Pa`, res: `P = ${fm(P)} Pa`,
        arg: `${fm(P)} Pa ≈ ${nb(P / 1e5, 2)} bar au-dessus de l’atmosphère : cohérent avec « 10 m d’eau ≈ 1 bar ».`, piege: 'Une pression au fond d’une piscine doit valoir environ 1 bar (la pression atmosphérique).' },
      conv: { cause: 'conv', calc: `P = ρ·g·h = 1000 × 9,81 × ${p.h * 100} = ${fm(P1)} Pa`, res: `P = ${fm(P1)} Pa`,
        arg: `${fm(P1)} Pa ≈ ${nb(P1 / 1e5, 1)} bar : il faudrait ${nb(p.h * 100)} m d’eau, or la piscine n’a que ${p.h} m de profondeur.`, piege: 'Au fond d’une piscine, la pression est toujours énorme.' },
      formule: { cause: 'formule', calc: `P = ρ·h / g = 1000 × ${p.h} / 9,81 = ${fm(P3)} Pa`, res: `P = ${fm(P3)} Pa`,
        arg: `${fm(P3)} Pa ≈ ${nb(P3 / 1e5, 3)} bar : ${p.h} m d’eau pèsent bien davantage (≈ ${nb(P / 1e5, 2)} bar).`, piege: 'Une pression relative proche de 0 est normale pour de l’eau.' } }; } },

  { id: 'conduite', domaine: 'Transport des fluides', titre: 'Vitesse de l’eau dans une conduite',
    repere: 'vitesses usuelles de l’eau dans une canalisation : 0,5 à 3 m·s⁻¹ · vitesse du son dans l’air : 340 m·s⁻¹ · 1 h = 3 600 s.',
    gen: () => { for (;;) { const D = tire([40, 50, 63, 80]), Q = tire([9, 12, 18, 24]), v = Q / 3600 / (Math.PI * (D / 1000) ** 2 / 4); if (v > 0.5 && v < 3.2) return { D, Q }; } },
    enonce: p => `Une pompe refoule de l’eau dans une conduite de diamètre intérieur ${p.D} mm, avec un débit volumique de ${p.Q} m³·h⁻¹. Un élève calcule la vitesse moyenne de l’eau.`,
    val: p => ({ val: p.Q / 3600 / (Math.PI * (p.D / 1000) ** 2 / 4), u: 'm·s⁻¹' }),
    v: p => { const S = Math.PI * (p.D / 1000) ** 2 / 4, v = p.Q / 3600 / S, v1 = p.Q / S, v3 = p.Q / 3600 * S; return {
      ok: { cause: 'aucune', calc: `S = π·D²/4 = ${fm(S)} m² ; v = Q/S = (${p.Q}/3600) / ${fm(S)} = ${fm(v)} m·s⁻¹`, res: `v = ${fm(v)} m·s⁻¹`,
        arg: `${fm(v)} m·s⁻¹ est dans l’intervalle usuel pour de l’eau dans une canalisation (environ 0,5 à 3 m·s⁻¹).`, piege: 'Une vitesse de l’eau en m·s⁻¹ doit être très grande, comme un jet.' },
      conv: { cause: 'conv', calc: `S = π·D²/4 = ${fm(S)} m² ; v = Q/S = ${p.Q} / ${fm(S)} = ${fm(v1)} m·s⁻¹`, res: `v = ${fm(v1)} m·s⁻¹`,
        arg: `${fm(v1)} m·s⁻¹ dépasse largement la vitesse du son dans l’air (340 m·s⁻¹) : impossible pour de l’eau dans une conduite.`, piege: 'Une pompe puissante peut très bien donner cette vitesse.' },
      formule: { cause: 'formule', calc: `S = π·D²/4 = ${fm(S)} m² ; v = Q × S = (${p.Q}/3600) × ${fm(S)} = ${fm(v3)} m·s⁻¹`, res: `v = ${fm(v3)} m·s⁻¹`,
        arg: `${fm(v3)} m·s⁻¹ : l’eau mettrait plusieurs jours pour avancer d’un mètre, alors qu’elle est refoulée par une pompe.`, piege: 'Plus la conduite est fine, plus l’eau doit être lente.' } }; } },

  { id: 'pompe', domaine: 'Transport des fluides', titre: 'Puissance hydraulique d’une pompe',
    repere: 'radiateur électrique : 1 000 W · moteur de pompe d’atelier : 0,5 à 5 kW · 1 h = 3 600 s.',
    gen: () => ({ Q: tire([10, 20, 30]), H: tire([15, 20, 30]) }),
    enonce: p => `Une pompe élève de l’eau (ρ = 1000 kg·m⁻³ ; g = 9,81 N·kg⁻¹) avec un débit de ${p.Q} m³·h⁻¹, sur une hauteur manométrique de ${p.H} m. Un élève calcule la puissance hydraulique P = ρ·g·Q·H.`,
    val: p => ({ val: 1000 * 9.81 * p.Q / 3600 * p.H, u: 'W' }),
    v: p => { const P = 1000 * 9.81 * p.Q / 3600 * p.H, P1 = P * 3600, P3 = (p.Q / 3600) * p.H / (1000 * 9.81); return {
      ok: { cause: 'aucune', calc: `P = ρ·g·Q·H = 1000 × 9,81 × (${p.Q}/3600) × ${p.H} = ${fm(P)} W`, res: `P = ${fm(P)} W`,
        arg: `${fm(P)} W : entre quelques centaines de watts et quelques kilowatts, l’ordre de grandeur des moteurs de pompes d’atelier (un radiateur électrique : 1 000 W).`, piege: 'Une pompe qui élève de l’eau consomme forcément des mégawatts.' },
      conv: { cause: 'conv', calc: `P = ρ·g·Q·H = 1000 × 9,81 × ${p.Q} × ${p.H} = ${fm(P1)} W`, res: `P = ${fm(P1)} W`,
        arg: `${fm(P1)} W ≈ ${nb(P1 / 1e6, 1)} MW : la puissance d’une installation industrielle, pas d’une pompe qui déplace ${p.Q} m³·h⁻¹.`, piege: 'Une pompe est toujours moins puissante qu’une ampoule.' },
      formule: { cause: 'formule', calc: `P = Q·H / (ρ·g) = (${p.Q}/3600) × ${p.H} / (1000 × 9,81) = ${fm(P3)} W`, res: `P = ${fm(P3)} W`,
        arg: `${fm(P3)} W : bien moins qu’un millième de watt pour élever ${p.Q} m³ d’eau de ${p.H} m chaque heure : absurde.`, piege: 'Une puissance se compte forcément en kilowatts.' } }; } },

  { id: 'paroi', domaine: 'Transferts thermiques', titre: 'Pertes thermiques d’un mur',
    repere: 'radiateur électrique : 1 000 W · ampoule : 10 à 60 W · veilleuse : 1 W · écart en kelvins = écart en °C (mais jamais 273 à ajouter dans un écart).',
    gen: () => ({ e: tire([15, 20, 25, 30]), L: tire([3, 4, 5, 6]), Ti: tire([19, 20, 21]), Te: tire([-5, -2, 0, 2, 5]) }),
    enonce: p => `Un mur de brique (λ = 0,25 W·m⁻¹·K⁻¹) mesure ${p.L} m de long, 2,5 m de haut et ${p.e} cm d’épaisseur. L’air est à ${p.Ti} °C à l’intérieur et à ${p.Te} °C à l’extérieur. Un élève calcule la puissance thermique perdue à travers ce mur, P = λ·S·ΔT / e.`,
    val: p => ({ val: 0.25 * p.L * 2.5 * (p.Ti - p.Te) / (p.e / 100), u: 'W' }),
    v: p => { const S = p.L * 2.5, dT = p.Ti - p.Te, P = 0.25 * S * dT / (p.e / 100), P1 = P / 100, dT2 = p.Ti + 273 - p.Te, P2 = 0.25 * S * dT2 / (p.e / 100); return {
      ok: { cause: 'aucune', calc: `S = ${p.L} × 2,5 = ${nb(S)} m² ; ΔT = ${p.Ti} − (${p.Te}) = ${dT} K ; P = 0,25 × ${nb(S)} × ${dT} / ${nb(p.e / 100)} = ${fm(P)} W`, res: `P = ${fm(P)} W`,
        arg: `${fm(P)} W : de l’ordre de quelques centaines de watts pour un mur de ${nb(S)} m², soit moins qu’un radiateur de 1 000 W : cohérent.`, piege: 'Un mur ne perd quasiment aucune puissance : moins d’1 W.' },
      conv: { cause: 'conv', calc: `S = ${p.L} × 2,5 = ${nb(S)} m² ; ΔT = ${dT} K ; P = 0,25 × ${nb(S)} × ${dT} / ${p.e} = ${fm(P1)} W`, res: `P = ${fm(P1)} W`,
        arg: `${nb(P1, 2)} W : moins qu’une veilleuse pour un mur de ${nb(S)} m² entre ${p.Ti} °C et ${p.Te} °C : beaucoup trop peu.`, piege: 'Un mur de brique est un très bon isolant : il ne laisse presque rien passer.' },
      temp: { cause: 'temp', calc: `S = ${p.L} × 2,5 = ${nb(S)} m² ; ΔT = (${p.Ti} + 273) − (${p.Te}) = ${dT2} K ; P = 0,25 × ${nb(S)} × ${dT2} / ${nb(p.e / 100)} = ${fm(P2)} W`, res: `P = ${fm(P2)} W`,
        arg: `${fm(P2)} W : plus que plusieurs radiateurs, pour un seul mur. L’écart de température est de ${dT} K, pas de ${dT2} K.`, piege: 'Les pertes d’un mur sont toujours de plusieurs kilowatts en hiver.' } }; } },

  { id: 'echangeur', domaine: 'Transferts thermiques', titre: 'Température de sortie de l’eau froide dans un échangeur',
    repere: 'la chaleur passe spontanément du chaud vers le froid : l’eau froide se réchauffe, mais ne peut pas dépasser la température d’entrée de l’eau chaude.',
    gen: () => { for (;;) {
      const p = { qc: tire([0.2, 0.3, 0.4]), Tce: tire([70, 80, 90]), Tcs: tire([50, 55, 60]), qf: tire([0.3, 0.5]), Tfe: tire([10, 15, 20]) };
      const Tfs = p.Tfe + p.qc * (p.Tce - p.Tcs) / p.qf, T2 = p.Tfe + p.qf * (p.Tce - p.Tcs) / p.qc;
      if (Tfs < p.Tcs - 3 && T2 > p.Tce + 2) return p; } },
    enonce: p => `Dans un échangeur, de l’eau chaude (débit ${nb(p.qc, 2)} kg·s⁻¹) entre à ${p.Tce} °C et sort à ${p.Tcs} °C. De l’eau froide (débit ${nb(p.qf, 2)} kg·s⁻¹) entre à ${p.Tfe} °C. Les pertes sont négligées et les deux fluides ont la même capacité thermique massique. Un élève calcule la température de sortie de l’eau froide.`,
    val: p => ({ val: p.Tfe + p.qc * (p.Tce - p.Tcs) / p.qf, u: '°C' }),
    v: p => { const Tfs = p.Tfe + p.qc * (p.Tce - p.Tcs) / p.qf, T2 = p.Tfe + p.qf * (p.Tce - p.Tcs) / p.qc, T3 = p.Tfe - p.qc * (p.Tce - p.Tcs) / p.qf; return {
      ok: { cause: 'aucune', calc: `T_fs = T_fe + q_c·(T_ce − T_cs) / q_f = ${p.Tfe} + ${nb(p.qc, 2)} × ${p.Tce - p.Tcs} / ${nb(p.qf, 2)} = ${fm(Tfs)} °C`, res: `T_fs = ${fm(Tfs)} °C`,
        arg: `${fm(Tfs)} °C est comprise entre ${p.Tfe} °C (entrée froide) et ${p.Tce} °C (entrée chaude) : l’eau froide se réchauffe sans dépasser l’eau chaude.`, piege: 'La sortie froide devrait être égale à la sortie chaude.' },
      formule: { cause: 'formule', calc: `T_fs = T_fe + q_f·(T_ce − T_cs) / q_c = ${p.Tfe} + ${nb(p.qf, 2)} × ${p.Tce - p.Tcs} / ${nb(p.qc, 2)} = ${fm(T2)} °C`, res: `T_fs = ${fm(T2)} °C`,
        arg: `${fm(T2)} °C dépasse la température d’entrée de l’eau chaude (${p.Tce} °C) : impossible, l’eau froide ne peut pas devenir plus chaude que l’eau qui la chauffe.`, piege: 'Plus l’eau froide est chaude en sortie, meilleur est l’échangeur : tout est possible.' },
      signe: { cause: 'signe', calc: `T_fs = T_fe − q_c·(T_ce − T_cs) / q_f = ${p.Tfe} − ${nb(p.qc, 2)} × ${p.Tce - p.Tcs} / ${nb(p.qf, 2)} = ${fm(T3)} °C`, res: `T_fs = ${fm(T3)} °C`,
        arg: `L’eau froide sortirait à ${fm(T3)} °C, plus froide qu’à l’entrée (${p.Tfe} °C), alors qu’elle reçoit de la chaleur : elle doit se réchauffer.`, piege: 'Une température négative est impossible pour de l’eau liquide.' } }; } },

  { id: 'bouilloire', domaine: 'Transferts thermiques', titre: 'Rendement d’une bouilloire',
    repere: 'conservation de l’énergie : rendement η toujours ≤ 100 % · une bouilloire garde l’essentiel de l’énergie : η ≈ 80 à 95 % · c_eau = 4 180 J·kg⁻¹·K⁻¹.',
    gen: () => { const m = tire([0.8, 1, 1.2]), th0 = tire([15, 18, 20, 22]), eta = tire([0.85, 0.88, 0.92]); const Q = m * 4180 * (100 - th0); return { m, th0, t: Math.round(Q / (2000 * eta)) }; },
    enonce: p => `Une bouilloire de puissance électrique 2000 W porte ${nb(p.m, 1)} kg d’eau de ${p.th0} °C à 100 °C en ${p.t} s (c = 4180 J·kg⁻¹·K⁻¹). Un élève calcule son rendement η = énergie reçue par l’eau / énergie électrique consommée.`,
    val: p => ({ val: 100 * p.m * 4180 * (100 - p.th0) / (2000 * p.t), u: '%' }),
    v: p => { const Q = p.m * 4180 * (100 - p.th0), E = 2000 * p.t, eta = 100 * Q / E, e1 = 100 * (Q / 1000) / E, Qs = p.m * 4180 * (100 + p.th0), e3 = 100 * Qs / E; return {
      ok: { cause: 'aucune', calc: `Q = m·c·(100 − ${p.th0}) = ${fm(Q)} J ; E = P·t = 2000 × ${p.t} = ${fm(E)} J ; η = Q/E = ${nb(eta, 1)} %`, res: `η = ${nb(eta, 1)} %`,
        arg: `η < 100 % : une bouilloire perd un peu d’énergie vers l’air et la structure, mais en garde l’essentiel.`, piege: 'Un rendement doit forcément être très faible, bien inférieur à 50 %.' },
      conv: { cause: 'conv', calc: `Q = m·c·(100 − ${p.th0}) = ${nb(Q / 1000, 1)} kJ ; E = ${fm(E)} J ; η = ${nb(Q / 1000, 1)} / ${fm(E)} = ${fm(e1)} %`, res: `η = ${fm(e1)} %`,
        arg: `η = ${fm(e1)} % signifierait que presque toute l’énergie électrique est perdue : or la bouilloire chauffe bien l’eau.`, piege: 'Un rendement supérieur à 100 % est possible avec une résistance chauffante.' },
      formule: { cause: 'formule', calc: `Q = m·c·(100 + ${p.th0}) = ${fm(Qs)} J ; E = ${fm(E)} J ; η = Q/E = ${nb(e3, 1)} %`, res: `η = ${nb(e3, 1)} %`,
        arg: `η = ${nb(e3, 1)} % > 100 % : l’eau recevrait plus d’énergie que la bouilloire n’en consomme, ce qui viole la conservation de l’énergie.`, piege: 'Une résistance chauffante peut avoir un rendement supérieur à 100 %.' } }; } },

  { id: 'can', domaine: 'Chaîne de mesure', titre: 'Quantum d’un convertisseur',
    repere: 'un CAN de n bits distingue 2ⁿ valeurs : 8 bits → 256 ; 10 bits → 1 024 ; 12 bits → 4 096 ; 16 bits → 65 536 · quantum = étendue / 2ⁿ.',
    gen: () => ({ n: tire([8, 10, 12, 16]), vmin: 0, vmax: tire([3.3, 5]) }),
    enonce: p => `Un CAN de ${p.n} bits a une plage d’entrée de ${nb(p.vmin)} V à ${nb(p.vmax)} V. Un élève calcule son quantum (la plus petite variation de tension qu’il distingue).`,
    val: p => ({ val: (p.vmax - p.vmin) / 2 ** p.n * 1000, u: 'mV' }),
    v: p => { const E = p.vmax - p.vmin, q = E / 2 ** p.n; return {
      ok: { cause: 'aucune', calc: `q = (V_max − V_min) / 2ⁿ = ${nb(E)} / ${2 ** p.n} = ${fm(q * 1000)} mV`, res: `q = ${fm(q * 1000)} mV`,
        arg: `${fm(q * 1000)} mV est très petit devant l’étendue de ${nb(E)} V : ${nb(2 ** p.n)} niveaux se partagent la plage, d’où un pas fin.`, piege: 'Le quantum devrait être de l’ordre de grandeur de l’étendue (quelques volts).' },
      formule: { cause: 'formule', calc: `q = (V_max − V_min) / n = ${nb(E)} / ${p.n} = ${fm(E / p.n)} V`, res: `q = ${fm(E / p.n)} V`,
        arg: `Un quantum de ${fm(E / p.n)} V sur ${nb(E)} V ne donnerait que ${p.n} niveaux, alors qu’un CAN de ${p.n} bits en distingue ${nb(2 ** p.n)}.`, piege: 'Plus il y a de bits, plus le quantum est grand.' },
      conv: { cause: 'conv', calc: `q = (V_max − V_min) / 2ⁿ = ${nb(E)} / ${2 ** p.n} = ${fm(q * 1000)} V`, res: `q = ${fm(q * 1000)} V`,
        arg: `${nb(2 ** p.n)} niveaux de ${fm(q * 1000)} V feraient ${fm(q * 1000 * 2 ** p.n)} V, bien plus que l’étendue de ${nb(E)} V : le résultat est en mV, pas en V.`, piege: 'Un quantum se donne toujours en volts, jamais en millivolts.' } }; } },

  { id: 'aspirine', domaine: 'Dosage', titre: 'Masse d’acide dans un comprimé d’aspirine',
    repere: 'un comprimé d’aspirine « 500 » contient de l’ordre de 500 mg d’acide acétylsalicylique · la masse d’un composant ne peut pas dépasser la masse du comprimé entier · 1 g = 1 000 mg.',
    gen: () => { const mt = tire([0.48, 0.5, 0.52]), VA = 20, c0 = mt / 180 / 0.1; return { mc: tire([0.55, 0.6, 0.65]), VA, VE: Math.round(c0 * VA / 0.1 * 10) / 10 }; },
    enonce: p => `Un comprimé d’aspirine de masse totale ${nb(p.mc, 2)} g est broyé et dissous dans une fiole jaugée de 100 mL. On titre ${p.VA} mL de cette solution par de la soude à 0,100 mol·L⁻¹ : l’équivalence est obtenue pour ${nb(p.VE, 1)} mL (M = 180 g·mol⁻¹ pour l’acide acétylsalicylique, AH). Un élève calcule la masse d’AH dans le comprimé.`,
    val: p => ({ val: 0.1 * p.VE / p.VA * 0.1 * 180, u: 'g' }),
    v: p => { const c0 = 0.1 * p.VE / p.VA, m = c0 * 0.1 * 180; const tout = {
      ok: { cause: 'aucune', calc: `c₀ = c_B·V_E / V_A = 0,100 × ${nb(p.VE, 1)} / ${p.VA} = ${fm(c0)} mol·L⁻¹ ; m = c₀·V_f·M = ${fm(c0)} × 0,100 × 180 = ${nb(m, 3)} g`, res: `m = ${nb(m, 3)} g`,
        arg: `${nb(m, 3)} g est inférieur à la masse du comprimé (${nb(p.mc, 2)} g) et correspond à la dose usuelle (environ 500 mg).`, piege: 'Il devrait y avoir presque autant d’acide que la masse du comprimé entier.' },
      conv: { cause: 'conv', calc: `c₀ = ${fm(c0)} mol·L⁻¹ ; m = c₀·V_f·M = ${fm(c0)} × 100 × 180 = ${fm(m * 1000)} g`, res: `m = ${fm(m * 1000)} g`,
        arg: `${fm(m * 1000)} g d’acide dans un comprimé qui pèse ${nb(p.mc, 2)} g : impossible, un composant ne peut pas peser plus que l’ensemble.`, piege: 'Un comprimé peut contenir plusieurs centaines de grammes de principe actif.' },
      mg: { cause: 'conv', calc: `c₀ = ${fm(c0)} mol·L⁻¹ ; m = c₀·V_f·M = ${fm(c0)} × 0,100 × 180 / 1000 = ${fm(m / 1000)} g`, res: `m = ${fm(m / 1000)} g`,
        arg: `${nb(m / 1000 * 1000, 1)} mg d’acide : un comprimé d’aspirine en contient de l’ordre de 500 mg, pas quelques dixièmes de milligramme.`, piege: 'Un comprimé contient seulement des traces de principe actif.' },
      formule: { cause: 'formule', calc: `c₀ = ${fm(c0)} mol·L⁻¹ ; m = c₀·M = ${fm(c0)} × 180 = ${nb(c0 * 180, 2)} g`, res: `m = ${nb(c0 * 180, 2)} g`,
        arg: `${nb(c0 * 180, 2)} g > ${nb(p.mc, 2)} g : plus que la masse du comprimé entier (le volume de la fiole a été oublié).`, piege: 'Un comprimé contient toujours plusieurs grammes d’acide.' } }; return tout; } },

  { id: 'transmittance', domaine: 'Spectrophotométrie', titre: 'Transmittance d’une solution',
    repere: 'A = 0 → T = 100 % · A = 1 → T = 10 % · A = 2 → T = 1 % · une transmittance est toujours entre 0 et 100 %.',
    gen: () => ({ A: tire([0.25, 0.45, 0.6, 0.8]) }),
    enonce: p => `Une solution a une absorbance A = ${nb(p.A, 2)} à la longueur d’onde de travail. Un élève calcule sa transmittance T (en %) avec T = 10^(−A).`,
    val: p => ({ val: 100 * 10 ** (-p.A), u: '%' }),
    v: p => { const T = 100 * 10 ** (-p.A); return {
      ok: { cause: 'aucune', calc: `T = 10^(−A) × 100 = 10^(−${nb(p.A, 2)}) × 100 = ${nb(T, 1)} %`, res: `T = ${nb(T, 1)} %`,
        arg: `T est comprise entre 0 et 100 % : pour A = ${nb(p.A, 2)}, environ ${nb(T, 0)} % de la lumière traverse (A augmente ⇒ T diminue).`, piege: 'Plus l’absorbance est grande, plus la transmittance est grande.' },
      signe: { cause: 'signe', calc: `T = 10^(A) × 100 = 10^(${nb(p.A, 2)}) × 100 = ${fm(100 * 10 ** p.A)} %`, res: `T = ${fm(100 * 10 ** p.A)} %`,
        arg: `${fm(100 * 10 ** p.A)} % > 100 % : une transmittance ne peut pas dépasser 100 % (on ne transmet pas plus de lumière qu’on n’en envoie).`, piege: 'Une solution qui absorbe de la lumière peut très bien la renforcer.' },
      conv: { cause: 'conv', calc: `T = 10^(−A) = 10^(−${nb(p.A, 2)}) = ${fm(T / 100)} %`, res: `T = ${fm(T / 100)} %`,
        arg: `${fm(T / 100)} % signifierait que presque toute la lumière est absorbée, alors que A = ${nb(p.A, 2)} correspond à environ ${nb(T, 0)} % de lumière transmise : il manque le facteur 100.`, piege: 'Une absorbance faible donne forcément une transmittance proche de 0.' } }; } },

  { id: 'cinetique', domaine: 'Cinétique chimique', titre: 'Concentration d’un réactif au cours du temps',
    repere: 'un réactif qui disparaît : 0 ≤ [A](t) ≤ [A]₀ et [A] décroît au cours du temps · loi du 1er ordre : [A] = [A]₀·e^(−k·t).',
    gen: () => ({ c0: tire([0.1, 0.2, 0.5]), k: tire([0.005, 0.01, 0.02]), t: tire([60, 120, 200]) }),
    enonce: p => `Un réactif A, de concentration initiale ${nb(p.c0, 2)} mol·L⁻¹, disparaît selon une loi du 1er ordre de constante k = ${nb(p.k, 3)} s⁻¹. Un élève calcule sa concentration à t = ${p.t} s.`,
    val: p => ({ val: p.c0 * Math.exp(-p.k * p.t), u: 'mol·L⁻¹' }),
    v: p => { const c = p.c0 * Math.exp(-p.k * p.t), c2 = p.c0 * Math.exp(p.k * p.t), c3 = p.c0 - p.k * p.t; const o = {
      ok: { cause: 'aucune', calc: `[A] = [A]₀·e^(−k·t) = ${nb(p.c0, 2)} × e^(−${nb(p.k, 3)} × ${p.t}) = ${fm(c)} mol·L⁻¹`, res: `[A] = ${fm(c)} mol·L⁻¹`,
        arg: `[A] = ${fm(c)} mol·L⁻¹ est inférieure à [A]₀ = ${nb(p.c0, 2)} mol·L⁻¹ et positive : un réactif consommé diminue sans devenir négatif.`, piege: 'La concentration doit tomber à zéro au bout du temps t.' },
      signe: { cause: 'signe', calc: `[A] = [A]₀·e^(k·t) = ${nb(p.c0, 2)} × e^(${nb(p.k, 3)} × ${p.t}) = ${fm(c2)} mol·L⁻¹`, res: `[A] = ${fm(c2)} mol·L⁻¹`,
        arg: `${fm(c2)} mol·L⁻¹ > [A]₀ = ${nb(p.c0, 2)} mol·L⁻¹ : la concentration d’un réactif qui disparaît ne peut pas augmenter.`, piege: 'La concentration d’un réactif peut augmenter au début de la réaction.' } };
      if (c3 < 0) o.formule = { cause: 'formule', calc: `[A] = [A]₀ − k·t = ${nb(p.c0, 2)} − ${nb(p.k, 3)} × ${p.t} = ${fm(c3)} mol·L⁻¹`, res: `[A] = ${fm(c3)} mol·L⁻¹`,
        arg: `${fm(c3)} mol·L⁻¹ : une concentration ne peut pas être négative (ordre 1 : décroissance exponentielle, pas linéaire).`, piege: 'Une concentration négative signifie que la réaction est terminée.' };
      return o; } },

  { id: 'chiffres', domaine: 'Métrologie', titre: 'Vitesse d’un chariot',
    repere: 'un résultat n’est pas plus précis que les données : le nombre de chiffres significatifs du résultat est celui de la donnée la moins précise.',
    gen: () => ({ d: tire([12, 15, 18]), t: tire([3.1, 3.4, 4.2]) }),
    enonce: p => `Un chariot parcourt ${p.d} m en ${nb(p.t, 1)} s (mesures données avec 2 chiffres significatifs). Un élève calcule sa vitesse moyenne.`,
    val: p => ({ val: p.d / p.t, u: 'm·s⁻¹' }),
    v: p => { const v = p.d / p.t; return {
      ok: { cause: 'aucune', calc: `v = d / t = ${p.d} / ${nb(p.t, 1)} = ${nb(v, 1)} m·s⁻¹`, res: `v = ${nb(v, 1)} m·s⁻¹`,
        arg: `Les données ont 2 chiffres significatifs (${p.d} m ; ${nb(p.t, 1)} s) et le résultat aussi (${nb(v, 1)}) : c’est cohérent, et une vitesse de quelques m·s⁻¹ est réaliste pour un chariot.`, piege: 'Il faudrait donner tous les chiffres de la calculatrice pour être précis.' },
      sigfig: { cause: 'sigfig', calc: `v = d / t = ${p.d} / ${nb(p.t, 1)} = ${v.toFixed(9).replace('.', ',')} m·s⁻¹`, res: `v = ${v.toFixed(9).replace('.', ',')} m·s⁻¹`,
        arg: `La valeur est plausible, mais les données n’ont que 2 chiffres significatifs : le résultat ne peut pas être plus précis qu’elles.`, piege: 'Plus on donne de chiffres, plus le résultat est précis donc meilleur.' } }; } },
];

export function melange(tab, graine) {
  const a = tab.slice(); let s = (graine * 2654435761) >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// variante : clé imposée (parcours guidé) ; sinon 35 % de résultats corrects, le reste des erreurs tirées au hasard
export function nouvelItem(id, variante = null, forceP = null) {
  const it = ITEMS.find(i => i.id === id), p = forceP || it.gen(), V = it.v(p);
  const cles = Object.keys(V), fausses = cles.filter(c => c !== 'ok');
  const k = variante && V[variante] ? variante : (Math.random() < 0.35 ? 'ok' : tire(fausses)), d = V[k], graine = 1 + Math.floor(Math.random() * 99999);
  const verdict = k === 'ok' ? 'ok' : k === 'sigfig' ? 'forme' : 'absurde';
  const valeur = it.val(p);
  const vOk = Object.keys(VERDICTS), vOpts = melange(vOk, graine).map(c => ({ k: c, label: VERDICTS[c] }));
  const generiques = melange(GENERIQUES, graine + 3).slice(0, d.piege ? 2 : 3);
  const argTxt = melange([d.arg, ...(d.piege ? [d.piege] : []), ...generiques], graine + 5);
  const causeCles = ['aucune', 'conv', 'formule', 'signe', ...(d.cause === 'temp' ? ['temp'] : []), 'sigfig'];
  return { id, it, p, k, verdict, domaine: it.domaine, titre: it.titre, enonce: it.enonce(p), calc: d.calc, res: d.res, repere: it.repere, graine,
    verdictOpts: vOpts, argOpts: argTxt, argBonne: argTxt.indexOf(d.arg), causeOpts: causeCles.map(c => ({ k: c, label: CAUSES[c] })), cause: d.cause, arg: d.arg,
    valeur: { ...valeur, tol: k === 'sigfig' ? 0.03 : 0.02 } };
}
