// Transposition de carbocation (migration 1,2 d'un hydrure ou d'un méthyle) lors de l'addition de HBr.
// Énergies (kJ/mol, réactifs = 0) : ORDRES DE GRANDEUR cohérents avec regioModele.js. Proportions : ordres de grandeur expérimentaux.
export const CAS = {
  hydrure: { cle: 'hydrure', alcene: '3-méthylbut-1-ène', groupe: 'H', migrant: 'un atome d\'hydrogène (hydrure H⁻)',
    cationS: 'cation 3-méthylbutan-2-yle (secondaire)', cationT: 'cation 2-méthylbutan-2-yle (tertiaire)',
    produitA: '2-bromo-3-méthylbutane', produitB: '2-bromo-2-méthylbutane', pctA: 40, pctB: 60,
    E: { cs: 60, etS: 75, ct: 50, et2a: 70, et2b: 60, p: -65 } },
  methyle: { cle: 'methyle', alcene: '3,3-diméthylbut-1-ène', groupe: 'CH₃', migrant: 'un groupe méthyle (CH₃)',
    cationS: 'cation 3,3-diméthylbutan-2-yle (secondaire)', cationT: 'cation 2,3-diméthylbutan-2-yle (tertiaire)',
    produitA: '2-bromo-3,3-diméthylbutane', produitB: '2-bromo-2,3-diméthylbutane', pctA: 20, pctB: 80,
    E: { cs: 60, etS: 80, ct: 48, et2a: 70, et2b: 58, p: -65 } },
};
// Profil de chaque voie à partir du carbocation secondaire (étape 1 commune déjà effectuée). Points [x, énergie, nom].
export function voie(cas, v) {
  const E = CAS[cas].E;
  return v === 'A'
    ? [[0, E.cs, 'cation secondaire'], [0.35, E.et2a, 'ET (capture)'], [1, E.p, 'produit']]
    : [[0, E.cs, 'cation secondaire'], [0.2, E.etS, 'ET (migration)'], [0.4, E.ct, 'cation tertiaire'], [0.65, E.et2b, 'ET (capture)'], [1, E.p, 'produit']];
}
export function energie(pts, x) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, e0] = pts[i], [x1, e1] = pts[i + 1];
    if (x <= x1 || i === pts.length - 2) { const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0))); return e0 + (e1 - e0) * (1 - Math.cos(Math.PI * t)) / 2; }
  }
}
export const barriereMigration = c => CAS[c].E.etS - CAS[c].E.cs;
export const gainStabilite = c => CAS[c].E.cs - CAS[c].E.ct;
