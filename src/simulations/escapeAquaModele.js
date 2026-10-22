// ====================================================
//  MISSION AQUA : mini escape game centré sur le chapitre « Transport des fluides » (TSTL).
//  Même principe que Kepler (voir escapeKeplerModele.js) : une épreuve = le défi principal d'une simulation (clé « <id>:defi.principal »),
//  seules comptent les réussites obtenues après le début de la partie. Trois modules en parallèle → code à 3 chiffres → pompe principale (épreuve finale).
// ====================================================
export const DUREE_MIN = 35;
export const MALUS_INDICE_S = 120;
export const MALUS_CODE_S = 60;
export const ID_AQUA = 80;
export const CLE_PARTIE_AQUA = 'escape-aqua-v1';
export const cleDefi = sim => `${sim}:defi.principal`;

export const MODULES = [
  { id: 'manometre', sim: 26, nom: 'Manomètre du réservoir', court: 'Manomètre', base: 2,
    panne: 'Le manomètre du réservoir de tête ne donne plus de valeurs fiables : impossible de savoir quel liquide il contient ni sur quelle hauteur.',
    mission: 'Étalonnez le manomètre : exploitez les mesures de pression pour retrouver le liquide et la hauteur.',
    valider: 'Dans l’onglet Défi : lis l’énoncé, réponds aux questions puis clique « Vérifier ». C’est réussi quand toutes les réponses sont justes.',
    indices: ['Place les points P = f(h) sur le graphique : ils sont alignés. L’ordonnée à l’origine est la pression atmosphérique.',
      'La pente de la droite vaut ρ·g : divise-la par g = 9,81 pour obtenir ρ. Pour la hauteur H, résous P = Patm + ρ·g·H.'] },
  { id: 'cuve', sim: 27, nom: 'Cuve de remplissage', court: 'Cuve', base: 6,
    panne: 'Le débitmètre de la cuve de remplissage est en panne : il faut retrouver les débits à partir d’une pesée.',
    mission: 'Calculez les débits massique et volumique à partir de la masse recueillie et de la durée de remplissage.',
    valider: 'Dans l’onglet Défi : lis l’énoncé, réponds aux questions puis clique « Vérifier ». C’est réussi quand toutes les réponses sont justes.',
    indices: ['Qm = m / Δt : convertis la masse en kg et la durée en s avant de calculer (ou écris les unités dans le calcul).',
      'ρ = d × 1 000 kg·m⁻³, puis Qv = Qm / ρ. Convertis enfin dans l’unité demandée.'] },
  { id: 'canalisation', sim: 28, nom: 'Raccord de canalisations', court: 'Tuyaux', base: 5,
    panne: 'Un raccord réduit le diamètre de la canalisation : la vitesse de l’eau y a changé et personne ne sait de combien.',
    mission: 'Calculez les sections et les vitesses d’écoulement dans les deux tuyaux.',
    valider: 'Dans l’onglet Défi : lis l’énoncé, réponds aux questions puis clique « Vérifier ». C’est réussi quand toutes les réponses sont justes.',
    indices: ['S = π·D² / 4, avec D en mètres : attention aux millimètres.',
      'v = Qv / S : le tuyau le plus étroit a la vitesse la plus grande. Qm = ρ·Qv.'] },
];

export const CONTROLE = { id: 'pompe', sim: 17, nom: 'Pompe principale', court: 'Pompe',
  panne: 'Les trois capteurs sont rétablis. Il reste à calculer le point de fonctionnement du circuit avant de relancer la pompe.',
  mission: 'Résolvez l’exercice complet du circuit hydraulique, en trois étapes, sans révéler de réponse.',
  valider: 'Dans l’onglet Défi (exercices) : choisis un niveau (Facile suffit), puis réponds aux trois étapes. C’est réussi quand l’étape 3 est juste, sans aucune réponse révélée.',
  indices: ['Écris la relation de Bernoulli entre deux points : P + ½·ρ·v² + ρ·g·z = constante (fluide parfait, sans pompe ni pertes).',
    'Commence par la carte d’identité de chaque point (P, z, v). Attention : une réponse « révélée » annule le défi.'] };

export const chiffre = (i, groupe = 0) => (MODULES[i].base + groupe * (2 * i + 3)) % 10;
export const codeAttendu = (groupe = 0) => MODULES.map((_, i) => chiffre(i, groupe)).join('');
export const nouvellePartie = (mode, groupe, maintenant = Date.now()) => ({ debut: maintenant, mode, groupe, indices: {}, codeEssais: 0, codeOkAt: null, fin: null });
export const reparee = (partie, horo, sim) => !!partie && (horo?.[cleDefi(sim)] ?? 0) >= partie.debut;
export const nbReparees = (partie, horo) => MODULES.filter(m => reparee(partie, horo, m.sim)).length;
export const controleReussi = (partie, horo) => !!partie?.codeOkAt && (horo?.[cleDefi(CONTROLE.sim)] ?? 0) >= partie.codeOkAt;
export const nbIndices = partie => Object.values(partie?.indices || {}).reduce((s, n) => s + n, 0);
export const malus = partie => !partie || partie.mode !== 'classe' ? 0 : MALUS_INDICE_S * nbIndices(partie) + MALUS_CODE_S * (partie.codeEssais || 0);
export const ecoule = (partie, maintenant) => Math.max(0, Math.floor(((partie.fin ?? maintenant) - partie.debut) / 1000));
export const restant = (partie, maintenant) => DUREE_MIN * 60 - ecoule(partie, maintenant) - malus(partie);
export const mmss = s => { const a = Math.abs(Math.round(s)); return `${s < 0 ? '−' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };
