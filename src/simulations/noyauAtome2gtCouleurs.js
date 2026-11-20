// Couleurs et styles communs aux schémas de la simulation 202 (noyau de l'atome) : un code visuel constant dans les scènes, les cartes et l'exploration.
// proton = rouge (+), neutron = gris, électron = bleu (−) ; bleu = donnée, orange = grandeur à repérer, vert = bon, rouge = piège.
export const PART = {
  proton: { fond: '#ef4444', trait: '#991b1b' },
  neutron: { fond: '#cbd5e1', trait: '#475569' },
  electron: { fond: '#60a5fa', trait: '#1d4ed8' },
};
export const NUAGE = { fond: '#dbeafe', trait: '#60a5fa' };
export const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
