// Sélection du parcours par compétence (type, niveau, enseignement, chapitre, difficulté, exercice), lue et écrite dans l'adresse de la page : voir ParcoursCompetence.jsx
export const SEL_VIDE = { type: '', niv: '', ens: '', ch: '', st: '', dif: '', ex: '' };

export function lireSelection() {
  try {
    const p = new URLSearchParams(window.location.search);
    return { type: p.get('type') || '', niv: p.get('niv') || '', ens: p.get('ens') || '', ch: p.get('ch') || '', st: p.get('st') || '', dif: p.get('dif') || '', ex: p.get('ex') || '' };
  } catch { return { ...SEL_VIDE }; }
}
// L'adresse suit la sélection (remplace l'entrée d'historique : le bouton « précédent » du navigateur quitte l'atelier, comme avant)
export function ecrireSelection(sel) {
  try {
    const u = new URL(window.location.href);
    ['type', 'niv', 'ens', 'ch', 'st', 'dif', 'ex'].forEach(k => { if (sel[k]) u.searchParams.set(k, sel[k]); else u.searchParams.delete(k); });
    window.history.replaceState(null, '', u.toString());
  } catch { /* adresse non modifiable */ }
}
