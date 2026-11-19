// Couleurs de la simulation 146 (Tensioactifs)
export const COUL = { tete: '#0369a1', queue: '#b45309', eau: '#e0f2fe', air: '#f8fafc', huile: '#fef3c7', txt: '#0f172a', gris: '#64748b' };
const TETE_CLASSE = { 'non ionique': '#15803d', anionique: '#b91c1c', cationique: '#0369a1', 'amphotère': '#7c3aed' };
export const teteDe = classe => TETE_CLASSE[classe] ?? COUL.tete;
