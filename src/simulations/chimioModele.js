// Chimiosélectivité : un réactif transforme un groupe fonctionnel en laissant un autre intact (résultats classiques de cours).
// Chaque substrat porte deux groupes A et B ; chaque réactif indique le nouveau texte du groupe transformé (null = inchangé).
export const SUBSTRATS = {
  cetoester: { cle: 'cetoester', nom: '4-oxopentanoate d\'éthyle', gA: 'cétone', gB: 'ester',
    avant: [{ t: 'CH₃–' }, { t: 'C(=O)', g: 'A' }, { t: '–CH₂CH₂–' }, { t: 'C(=O)OEt', g: 'B' }],
    reactifs: {
      NaBH4: { cle: 'NaBH4', nom: 'NaBH₄ dans l\'éthanol, 0 °C', court: 'NaBH₄', eff: { A: 'CH(OH)', B: null }, produit: '4-hydroxypentanoate d\'éthyle',
        pourquoi: 'NaBH₄ est un réducteur doux : il réduit les aldéhydes et les cétones, mais pas les esters, moins électrophiles (le doublet de l\'oxygène voisin du C=O est délocalisé).' },
      LiAlH4: { cle: 'LiAlH4', nom: 'LiAlH₄ dans l\'éther, puis hydrolyse', court: 'LiAlH₄', eff: { A: 'CH(OH)', B: 'CH₂OH' }, produit: 'pentane-1,4-diol',
        pourquoi: 'LiAlH₄ est un réducteur beaucoup plus puissant : il réduit aussi l\'ester, donc la réaction n\'est pas chimiosélective.' },
      H2Pd: { cle: 'H2Pd', nom: 'H₂ sur Pd/C (1 bar, 25 °C)', court: 'H₂/Pd', eff: { A: null, B: null }, produit: 'aucune réaction notable',
        pourquoi: 'Dans ces conditions douces, H₂/Pd réduit les liaisons C=C, pas les groupes C=O.' },
    } },
  alcenone: { cle: 'alcenone', nom: 'hex-5-én-2-one', gA: 'cétone', gB: 'alcène',
    avant: [{ t: 'CH₃–' }, { t: 'C(=O)', g: 'A' }, { t: '–CH₂CH₂–' }, { t: 'CH=CH₂', g: 'B' }],
    reactifs: {
      NaBH4: { cle: 'NaBH4', nom: 'NaBH₄ dans l\'éthanol, 0 °C', court: 'NaBH₄', eff: { A: 'CH(OH)', B: null }, produit: 'hex-5-én-2-ol',
        pourquoi: 'L\'ion hydrure attaque le carbone électrophile du C=O ; la liaison C=C, non polarisée, n\'est pas attaquée.' },
      LiAlH4: { cle: 'LiAlH4', nom: 'LiAlH₄ dans l\'éther, puis hydrolyse', court: 'LiAlH₄', eff: { A: 'CH(OH)', B: null }, produit: 'hex-5-én-2-ol',
        pourquoi: 'Les hydrures réduisent le groupe C=O ; une double liaison C=C isolée n\'est pas réduite.' },
      H2Pd: { cle: 'H2Pd', nom: 'H₂ sur Pd/C (1 bar, 25 °C)', court: 'H₂/Pd', eff: { A: null, B: 'CH₂–CH₃' }, produit: 'hexan-2-one',
        pourquoi: 'H₂ est activé à la surface du métal et s\'additionne sur C=C ; le groupe C=O n\'est pas réduit dans ces conditions. La sélectivité est inversée par rapport aux hydrures.' },
    } },
  aminophenol: { cle: 'aminophenol', nom: '4-aminophénol', gA: 'phénol (–OH)', gB: 'amine (–NH₂)',
    avant: [{ t: 'HO', g: 'A' }, { t: '–C₆H₄–' }, { t: 'NH₂', g: 'B' }],
    reactifs: {
      Ac2O: { cle: 'Ac2O', nom: 'anhydride éthanoïque (1 éq.), eau, 25 °C', court: 'Ac₂O (1 éq.)', eff: { A: null, B: 'NHCOCH₃' }, produit: 'N-(4-hydroxyphényl)éthanamide (paracétamol)',
        pourquoi: 'Le doublet de l\'azote est plus nucléophile que celui de l\'oxygène du phénol : l\'amine est acylée de préférence (synthèse du paracétamol).' },
      Ac2Oexc: { cle: 'Ac2Oexc', nom: 'anhydride éthanoïque en excès, pyridine, 80 °C', court: 'Ac₂O (excès, chauffage)', eff: { A: 'OCOCH₃', B: 'NHCOCH₃' }, produit: 'éthanoate de 4-acétamidophényle',
        pourquoi: 'Un excès de réactif et un chauffage permettent d\'acyler aussi le phénol : la sélectivité disparaît.' },
    } },
};
export const COUPLES = Object.values(SUBSTRATS).flatMap(s => Object.keys(s.reactifs).map(r => [s.cle, r]));
export function bilan(sub, re) {
  const S = SUBSTRATS[sub], R = S.reactifs[re];
  const touches = ['A', 'B'].filter(g => R.eff[g] !== null);
  const nb = touches.length;
  return { S, R, touches, nb, chimiosel: nb === 1, apres: S.avant.map(p => (p.g && R.eff[p.g] !== null) ? { t: R.eff[p.g], g: p.g, modif: true } : p) };
}
export const nomGroupe = (sub, g) => g === 'A' ? SUBSTRATS[sub].gA : SUBSTRATS[sub].gB;
