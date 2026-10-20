// Couleurs de l'habillage du site (en-tête, accueil, pied de page, logo). Un seul accent, pour tous les boutons d'action.
// Pour changer la couleur du logo et des boutons : modifiez ACCENT.
export const ACCENT = '#25628f';          // bleu sourd (logo, boutons d'action, niveau actif)
export const ACCENT_CLAIR = '#e8f0f6';    // fond d'un élément actif
export const TEXTE = '#0f172a';
export const TEXTE2 = '#334155';
export const BORDURE = '#cbd5e1';
// Fond des blocs : blanc très légèrement dégradé
export const FOND_BLOC = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)';
// Style d'un bloc (« lame ») : fond clair légèrement dégradé, bordure fine, ombre douce
export const LAME = { background: FOND_BLOC, borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', textAlign: 'left' };
