// Modèle de la simulation 160 « Couleurs » (1G spé PC, Ondes et signaux, partie « Couleurs »).
// MODÈLE SIMPLIFIÉ À TROIS BANDES : toute lumière est décrite par trois intensités (rouge R, vert V, bleu B), chacune entre 0 et 1.
// Les vrais spectres sont continus (400 à 800 nm) ; on les résume par trois zones. Un objet opaque est décrit par la part de
// chaque bande qu'il diffuse (0 = tout absorbé, 1 = tout diffusé) ; un filtre ou un verre, par la part qu'il transmet.
// Sans React : testé par couleursModele.test.mjs.

export const NOM_BANDE = ['rouge', 'vert', 'bleu'];
export const COULEURS = {
  noir: [0, 0, 0], rouge: [1, 0, 0], vert: [0, 1, 0], bleu: [0, 0, 1],
  jaune: [1, 1, 0], cyan: [0, 1, 1], magenta: [1, 0, 1], blanc: [1, 1, 1],
};

const borne = x => Math.max(0, Math.min(1, x));
export const rgb = c => `rgb(${c.map(x => Math.round(255 * borne(x))).join(',')})`;

// Synthèse additive : les intensités s'ajoutent (plafonnées à 1)
export const additif = (...lumieres) => [0, 1, 2].map(i => borne(lumieres.reduce((s, l) => s + l[i], 0)));
// Synthèse soustractive, objet ou filtre : bande par bande, la lumière reçue est multipliée par la part diffusée ou transmise
export const traverse = (lumiere, filtre) => [0, 1, 2].map(i => lumiere[i] * filtre[i]);
export const absorbe = (lumiere, objet) => [0, 1, 2].map(i => lumiere[i] * (1 - objet[i]));
// Couleur complémentaire (modèle à trois bandes) : celle qui, ajoutée en lumière, donne du blanc
export const complementaire = c => c.map(x => 1 - x);

// Nom de la couleur perçue pour des intensités quelconques (teinte et saturation)
export function nomCouleur(c) {
  const [r, g, b] = c.map(borne), v = Math.max(r, g, b), m = Math.min(r, g, b);
  if (v < 0.15) return 'noir';
  const s = (v - m) / v;
  if (s < 0.2) return v >= 0.85 ? 'blanc' : 'gris';
  let h;
  if (v === r) h = 60 * (((g - b) / (v - m) + 6) % 6);
  else if (v === g) h = 60 * ((b - r) / (v - m) + 2);
  else h = 60 * ((r - g) / (v - m) + 4);
  if (h < 20 || h >= 340) return s < 0.7 ? 'rose' : 'rouge';
  if (h < 40) return 'orange';
  if (h < 80) return 'jaune';
  if (h < 160) return 'vert';
  if (h < 200) return 'cyan';
  if (h < 260) return 'bleu';
  return s < 0.7 ? 'rose' : 'magenta';
}

// Liste des bandes présentes (intensité > 5 %), ex. « rouge et vert »
export const bandesPresentes = (c, seuil = 0.05) => [0, 1, 2].filter(i => c[i] > seuil);
export function listeBandes(c, vide = 'aucune') {
  const n = bandesPresentes(c).map(i => NOM_BANDE[i]);
  if (!n.length) return vide;
  return n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} et ${n[n.length - 1]}`;
}

// Lumières (sources), objets opaques et objets transparents
export const LUMIERES = [
  { id: 'blanche', nom: 'lumière blanche', court: 'blanche', v: COULEURS.blanc },
  { id: 'rouge', nom: 'lumière rouge', court: 'rouge', v: COULEURS.rouge },
  { id: 'verte', nom: 'lumière verte', court: 'verte', v: COULEURS.vert },
  { id: 'bleue', nom: 'lumière bleue', court: 'bleue', v: COULEURS.bleu },
  { id: 'jaune', nom: 'lumière jaune', court: 'jaune', v: COULEURS.jaune },
  { id: 'cyan', nom: 'lumière cyan', court: 'cyan', v: COULEURS.cyan },
  { id: 'magenta', nom: 'lumière magenta', court: 'magenta', v: COULEURS.magenta },
];
export const lumiere = id => LUMIERES.find(l => l.id === id);

export const OBJETS = [
  { id: 'tomate', nom: 'une tomate', court: 'tomate', forme: 'rond', v: COULEURS.rouge },
  { id: 'citron', nom: 'un citron', court: 'citron', forme: 'citron', v: COULEURS.jaune },
  { id: 'concombre', nom: 'un concombre', court: 'concombre', forme: 'long', v: COULEURS.vert },
  { id: 'bleuet', nom: 'un bleuet', court: 'bleuet', forme: 'fleur', v: COULEURS.bleu },
  { id: 'ballon-cyan', nom: 'un ballon cyan', court: 'ballon cyan', forme: 'ballon', v: COULEURS.cyan },
  { id: 'ballon-magenta', nom: 'un ballon magenta', court: 'ballon magenta', forme: 'ballon', v: COULEURS.magenta },
  { id: 'papier', nom: 'une feuille de papier blanc', court: 'feuille blanche', forme: 'feuille', v: COULEURS.blanc },
  { id: 'ardoise', nom: 'une ardoise noire', court: 'ardoise noire', forme: 'ardoise', v: COULEURS.noir },
];
export const objet = id => OBJETS.find(o => o.id === id);

export const VERRES = [
  { id: 'filtre-jaune', nom: 'un filtre jaune', court: 'filtre jaune', v: COULEURS.jaune },
  { id: 'filtre-cyan', nom: 'un filtre cyan', court: 'filtre cyan', v: COULEURS.cyan },
  { id: 'filtre-magenta', nom: 'un filtre magenta', court: 'filtre magenta', v: COULEURS.magenta },
  { id: 'verre-rouge', nom: 'un verre rouge', court: 'verre rouge', v: COULEURS.rouge },
  { id: 'verre-vert', nom: 'un verre vert', court: 'verre vert', v: COULEURS.vert },
  { id: 'verre-bleu', nom: 'un verre bleu', court: 'verre bleu', v: COULEURS.bleu },
  { id: 'verre-incolore', nom: 'un verre incolore', court: 'verre incolore', v: COULEURS.blanc },
];
export const verre = id => VERRES.find(v => v.id === id);

// Bilan complet d'un éclairage : lumière reçue, absorbée, renvoyée (diffusée ou transmise) et couleur perçue
export function bilan(lum, propriete) {
  const renvoyee = traverse(lum, propriete), abs = absorbe(lum, propriete);
  return { recue: lum, absorbee: abs, renvoyee, couleur: nomCouleur(renvoyee), nomRecue: nomCouleur(lum) };
}

// Couleur perçue (nom) d'une lumière sur un objet : usage dans les défis et exercices
export const couleurPercue = (lum, obj) => nomCouleur(traverse(lum, obj));

// Phrases de synthèse de l'exploration
export function phrase(lum, propriete, transparent) {
  const b = bilan(lum, propriete);
  if (!bandesPresentes(lum).length) return 'Aucune lumière n’est envoyée : on ne voit rien (noir).';
  const verbe = transparent ? 'transmet' : 'diffuse', sujet = transparent ? 'Le verre' : 'L’objet';
  return `${sujet} reçoit : ${listeBandes(lum)}. Il absorbe : ${listeBandes(b.absorbee)}. Il ${verbe} : ${listeBandes(b.renvoyee)}. Couleur perçue : ${b.couleur}.`;
}

// Défi « rendre un objet noir » : les lumières (de LUMIERES) sous lesquelles l'objet paraît noir
export const lumieresNoires = obj => LUMIERES.filter(l => couleurPercue(l.v, obj.v || obj) === 'noir');

// Défi au-delà du programme : doser trois lampes (pourcentages entiers multiples de 10) pour approcher une couleur cible
export const CIBLES = [
  { id: 'orange', nom: 'orange', v: [100, 50, 0] }, { id: 'rose', nom: 'rose', v: [100, 50, 50] }, { id: 'violet', nom: 'violet', v: [50, 0, 100] },
  { id: 'turquoise', nom: 'turquoise', v: [0, 100, 50] }, { id: 'gris', nom: 'gris', v: [50, 50, 50] }, { id: 'citron-vert', nom: 'vert citron', v: [50, 100, 0] },
];
export const TOL_DOSAGE = 10;   // écart maximal accepté sur chaque lampe, en points de pourcentage
export const dosageJuste = (reglage, cible, tol = TOL_DOSAGE) => reglage.every((x, i) => Math.abs(x - cible[i]) <= tol);
