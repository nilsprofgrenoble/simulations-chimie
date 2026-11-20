// Styles et couleurs communs aux schémas de la simulation 196 (corps pur ou mélange) : A = or (jaune), B = bleu, C = rose, D = vert (autre gaz).
export const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 10 });
export const GOLD = { fond: '#fde68a', trait: '#b45309' };       // entité A
export const BLEU = { fond: '#bfdbfe', trait: '#1d4ed8' };       // entité B
export const ROSE = { fond: '#fecaca', trait: '#b91c1c' };       // entité C
// Mêmes positions pour le corps pur et le mélange : seules les couleurs changent (boîte de 100 × 100)
export const VERT = { fond: '#bbf7d0', trait: '#15803d' };       // entité D
export const POS12 = [[18, 18], [50, 14], [82, 20], [16, 50], [48, 46], [84, 52], [20, 82], [52, 80], [82, 84], [34, 32], [66, 34], [34, 66]];
export const PUR = POS12.map(([x, y]) => [x, y, GOLD]);
export const MEL = POS12.map(([x, y], i) => [x, y, [BLEU, BLEU, ROSE, BLEU, BLEU, BLEU, BLEU, ROSE, BLEU, VERT, BLEU, BLEU][i]]);
