// ═══════════════════════════════════════════════════════════════════════════
//  « MON CARNET » : étoiles, niveaux, badges et objectifs d'un élève connecté.
//  Tout est CALCULÉ à partir des lignes déjà enregistrées (table « activites » : cle, reussi, essais,
//  corrections_vues, duree_s, debut, maj). Rien de nouveau n'est stocké : aucune donnée personnelle de plus,
//  et rien ne peut être « perdu ».
//
//  Principe : on récompense la MAÎTRISE et la persévérance, jamais le temps passé.
//   • Étoiles d'une séance : 0 si non réussi · 1 si réussi · 2 si réussi sans voir la correction · 3 si en plus au premier essai.
//   • Étoiles d'un exercice : la meilleure de ses séances (on peut donc refaire un exercice pour améliorer).
//   • Ces données sont envoyées par le navigateur de l'élève : elles servent à motiver, jamais à noter.
// ═══════════════════════════════════════════════════════════════════════════

export const etoilesSeance = l => (!l.reussi ? 0 : l.corrections_vues > 0 ? 1 : l.essais <= 1 ? 3 : 2);
// à l'instant de la réussite (annonce immédiate) : mêmes règles
export const etoilesReussite = (essais, vues) => etoilesSeance({ reussi: true, essais, corrections_vues: vues });

export const COMPS = [
  { code: "S'APP", nom: 'S’approprier', court: 'S’approprier', couleur: '#0ea5e9', clair: '#e0f2fe', icone: '🔎' },
  { code: 'ANA', nom: 'Analyser', court: 'Analyser', couleur: '#7c3aed', clair: '#ede9fe', icone: '🧭' },
  { code: 'REA', nom: 'Réaliser', court: 'Réaliser', couleur: '#16a34a', clair: '#dcfce7', icone: '🧮' },
  { code: 'VAL', nom: 'Valider', court: 'Valider', couleur: '#ea580c', clair: '#ffedd5', icone: '✅', bientot: true },
  { code: 'DÉFI', nom: 'Défis des simulations', court: 'Défis', couleur: '#db2777', clair: '#fce7f3', icone: '🎯' },
];

// ── Paliers de compétence : part des étoiles possibles ──
export const PALIERS = [
  { n: 0, nom: 'À démarrer', icone: '🌰', seuil: 0 },
  { n: 1, nom: 'Découverte', icone: '🌱', seuil: 0 },
  { n: 2, nom: 'En progrès', icone: '🌿', seuil: 0.2 },
  { n: 3, nom: 'Solide', icone: '🌳', seuil: 0.45 },
  { n: 4, nom: 'Expert·e', icone: '🏆', seuil: 0.75 },
];
export function palier(etoiles, max) {
  if (!max) return { ...PALIERS[0], suivant: null, reste: 0, frac: 0 };
  const f = etoiles / max;
  const n = etoiles <= 0 ? 0 : f >= PALIERS[4].seuil ? 4 : f >= PALIERS[3].seuil ? 3 : f >= PALIERS[2].seuil ? 2 : 1;
  const suivant = n < 4 ? PALIERS[n + 1] : null;
  const cible = suivant ? Math.max(etoiles + 1, Math.ceil(suivant.seuil * max - 1e-9)) : null;
  return { ...PALIERS[n], suivant, reste: cible ? cible - etoiles : 0, frac: Math.min(1, f) };
}

// ── Niveau général : il faut 3·n·(n−1)/2 étoiles pour atteindre le niveau n (3, 9, 18, 30, 45…) ──
export const seuilNiveau = n => (3 * n * (n - 1)) / 2;
export const TITRES = ['Curieux·se', 'Apprenti·e', 'Manipulateur·rice', 'Technicien·ne', 'Analyste', 'Expert·e', 'Maître de la paillasse'];
export function niveau(total) {
  let n = 1;
  while (total >= seuilNiveau(n + 1)) n += 1;
  const debut = seuilNiveau(n), fin = seuilNiveau(n + 1);
  return { n, titre: TITRES[Math.min(n, TITRES.length) - 1], debut, fin, reste: fin - total, frac: (total - debut) / (fin - debut) };
}

// ── Semaines (lundi → dimanche), en heure locale ──
const lundi = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const cleSemaine = d => { const x = lundi(d); return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`; };
export function semaines(lignes, maintenant = new Date(), nb = 8) {
  const actives = new Set(lignes.flatMap(l => [l.debut, l.maj].filter(Boolean)).map(cleSemaine));
  const L = [], base = lundi(maintenant);
  for (let k = nb - 1; k >= 0; k--) {
    const d = new Date(base); d.setDate(d.getDate() - 7 * k);
    L.push({ debut: d, actif: actives.has(cleSemaine(d)) });
  }
  return L;
}

// ── Analyse complète ──
//  items  : [{ cle, comp, titre, ... }]  tous les exercices et défis existants
//  lignes : lignes de la table « activites » de l'élève (y compris « sim:… », pour le temps passé)
export function analyser(items, lignes, maintenant = new Date()) {
  const parCle = new Map();
  [...lignes].sort((a, b) => String(a.debut || a.maj || '').localeCompare(String(b.debut || b.maj || ''))).forEach(l => {
    if (!parCle.has(l.cle)) parCle.set(l.cle, []);
    parCle.get(l.cle).push(l);
  });
  const detail = new Map();      // cle → { etoiles, reussi, vu, sansIndice, persevere, ameliore, derniere }
  for (const [cle, seances] of parCle) {
    const etoiles = seances.map(etoilesSeance), best = Math.max(0, ...etoiles);
    let ameliore = false;
    for (let j = 1; j < etoiles.length; j++) for (let i = 0; i < j; i++) if (etoiles[i] > 0 && etoiles[j] > etoiles[i]) ameliore = true;
    detail.set(cle, {
      etoiles: best, reussi: best > 0, vu: true,
      sansIndice: seances.some(l => l.reussi && l.corrections_vues === 0),
      persevere: seances.some(l => l.reussi && l.essais >= 3),
      ameliore, derniere: seances.reduce((m, l) => (l.maj && l.maj > m ? l.maj : m), ''),
    });
  }
  const d = cle => detail.get(cle) || { etoiles: 0, reussi: false, vu: false, sansIndice: false, persevere: false, ameliore: false, derniere: '' };

  const comps = COMPS.map(c => {
    const mes = items.filter(i => i.comp === c.code);
    const etoiles = mes.reduce((t, i) => t + d(i.cle).etoiles, 0), max = 3 * mes.length;
    return { ...c, n: mes.length, reussis: mes.filter(i => d(i.cle).reussi).length, etoiles, max, palier: palier(etoiles, max) };
  });
  const connus = items.filter(i => detail.has(i.cle));
  const total = comps.reduce((t, c) => t + c.etoiles, 0);

  const sims = new Map();
  lignes.filter(l => typeof l.cle === 'string' && l.cle.startsWith('sim:')).forEach(l => { const id = l.cle.split(':')[1]; sims.set(id, (sims.get(id) || 0) + (l.duree_s || 0)); });
  const nbSims = [...sims.values()].filter(s => s >= 60).length;
  const sem = semaines(lignes, maintenant), nbSemaines = new Set(lignes.flatMap(l => [l.debut, l.maj].filter(Boolean)).map(cleSemaine)).size;

  const nb = f => connus.filter(i => f(d(i.cle))).length;
  const reussisExo = items.filter(i => i.comp !== 'DÉFI' && d(i.cle).reussi).length;
  const reussisDefi = items.filter(i => i.comp === 'DÉFI' && d(i.cle).reussi).length;
  const compsTouchees = comps.filter(c => ["S'APP", 'ANA', 'REA'].includes(c.code) && c.reussis > 0).length;
  const stat = {
    reussis: reussisExo + reussisDefi, reussisExo, reussisDefi, triples: nb(x => x.etoiles === 3), sansIndice: nb(x => x.sansIndice && x.reussi),
    perseverants: nb(x => x.persevere), ameliores: nb(x => x.ameliore), compsTouchees, nbSims, nbSemaines,
    expertes: comps.filter(c => c.palier.n === 4).length,
  };
  const BADGES = [
    { id: 'premiere', icone: '🌟', nom: 'Première étoile', desc: 'Réussir ton premier exercice', val: stat.reussis, cible: 1 },
    { id: 'sansfilet', icone: '✨', nom: 'Sans filet', desc: 'Décrocher les 3 étoiles d’un exercice', val: stat.triples, cible: 1 },
    { id: 'persev', icone: '💪', nom: 'Persévérant·e', desc: 'Réussir un exercice après 3 essais ou plus : on apprend de ses erreurs', val: stat.perseverants, cible: 1 },
    { id: 'remise', icone: '🔁', nom: 'Remise en jeu', desc: 'Refaire un exercice pour gagner une étoile de plus', val: stat.ameliores, cible: 1 },
    { id: 'sansindice', icone: '🧠', nom: 'Sans indice', desc: 'Réussir 5 exercices sans regarder la correction', val: stat.sansIndice, cible: 5 },
    { id: 'toutatouch', icone: '🧭', nom: 'Touche-à-tout', desc: 'Réussir au moins un exercice dans 3 compétences différentes', val: stat.compsTouchees, cible: 3 },
    { id: 'defis', icone: '🎯', nom: 'Chasseur·se de défis', desc: 'Réussir 3 défis de simulations', val: stat.reussisDefi, cible: 3 },
    { id: 'explorateur', icone: '🔭', nom: 'Explorateur·rice', desc: 'Passer au moins une minute sur 5 simulations différentes', val: stat.nbSims, cible: 5 },
    { id: 'regulier', icone: '📅', nom: 'Régulier·ère', desc: 'Travailler pendant 3 semaines différentes', val: stat.nbSemaines, cible: 3 },
    { id: 'perfect', icone: '💎', nom: 'Perfectionniste', desc: 'Décrocher les 3 étoiles sur 10 exercices', val: stat.triples, cible: 10 },
    { id: 'maitre', icone: '🏆', nom: 'Maîtrise', desc: 'Atteindre le palier Expert·e dans une compétence', val: stat.expertes, cible: 1 },
  ].map(b => ({ ...b, ok: b.val >= b.cible, val: Math.min(b.val, b.cible) }));

  return { detail, d, comps, total, niveau: niveau(total), stat, badges: BADGES, semaines: sem, aucun: connus.length === 0 };
}

// ── Prochains objectifs (3 au plus) ──
export function objectifs(items, A) {
  const { d, comps } = A, res = [], deja = new Set();
  const ajouter = (item, type, texte) => { if (res.length < 3 && !deja.has(item.cle)) { deja.add(item.cle); res.push({ item, type, texte }); } };
  // 1. à terminer : commencé mais jamais réussi (le plus récent d'abord)
  items.filter(i => d(i.cle).vu && !d(i.cle).reussi).sort((a, b) => d(b.cle).derniere.localeCompare(d(a.cle).derniere))
    .slice(0, 1).forEach(i => ajouter(i, 'terminer', 'Tu l’as commencé : va jusqu’au bout !'));
  // 2. à améliorer : réussi, mais pas encore 3 étoiles (celui à une étoile de mieux d'abord)
  items.filter(i => d(i.cle).reussi && d(i.cle).etoiles < 3).sort((a, b) => d(b.cle).etoiles - d(a.cle).etoiles || d(b.cle).derniere.localeCompare(d(a.cle).derniere))
    .slice(0, 1).forEach(i => ajouter(i, 'ameliorer', d(i.cle).etoiles === 2 ? 'Encore une étoile : réussis-le du premier coup.' : 'Refais-le sans regarder la correction.'));
  // 3. à découvrir : premier exercice jamais ouvert de la compétence la moins avancée (ordre conseillé)
  const dispo = comps.filter(c => !c.bientot && c.code !== 'DÉFI' && c.n > 0).sort((a, b) => a.palier.frac - b.palier.frac);
  for (const c of dispo) {
    const nouveau = items.find(i => i.comp === c.code && !d(i.cle).vu);
    if (nouveau) { ajouter(nouveau, 'decouvrir', `Une nouvelle étape en ${c.court.toLowerCase()}.`); break; }
  }
  // 4. sinon un défi pas encore réussi
  items.filter(i => i.comp === 'DÉFI' && !d(i.cle).reussi).slice(0, 1).forEach(i => ajouter(i, 'defi', 'Un défi de simulation à relever.'));
  return res.slice(0, 3);
}

// ── Annonce immédiate d'une réussite (petite fenêtre « bravo ») ──
const ecouteurs = new Set();
export const ecouterReussite = f => { ecouteurs.add(f); return () => ecouteurs.delete(f); };
export const annoncerReussite = info => ecouteurs.forEach(f => f(info));
