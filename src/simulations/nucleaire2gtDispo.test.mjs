// Tests de mise en page des schémas de la simulation 203 : textes assez grands, dans le cadre, sans chevauchement avec un autre texte, un trait, un noyau ou un amas d'atomes ;
// nombres exacts de protons et de neutrons dessinés ; espaces insécables ; neutrons et noyaux à la même échelle dans une rangée (sauf neutrons agrandis annoncés).
// Usage : node src/simulations/nucleaire2gtDispo.test.mjs
import * as D from './nucleaire2gtDispo.js';
import * as M from './nucleaire2gtModele.js';
let ko = 0, n = 0, nsc = 0;
const vrai = (nom, c) => { n++; if (!c) { ko++; console.log(`✗ ${nom}`); } };
function controler(nom, d) {
  nsc++;
  vrai(`${nom} : au moins un élément`, d.items.length > 0);
  for (const t of d.textes) {
    const lib = t.libre;
    vrai(`${nom} : « ${t.s} » dans le cadre (${t.boite.x.toFixed(0)},${t.boite.y.toFixed(0)},${t.boite.w.toFixed(0)}×${t.boite.h.toFixed(0)} / ${d.W}×${d.H})`, t.boite.x >= 0 && t.boite.y >= 0 && t.boite.x + t.boite.w <= d.W && t.boite.y + t.boite.h <= d.H);
    const mini = d.W >= 400 ? 18 : 13;
    vrai(`${nom} : « ${t.s} » assez grand (${t.taille} < ${mini})`, t.taille >= mini);
    if (lib) continue;
    const pad = { x: t.boite.x - 1, y: t.boite.y - 1, w: t.boite.w + 2, h: t.boite.h + 2 };
    for (const [p, q] of d.obstacles) if (D.boiteTouche(pad, p, q)) { vrai(`${nom} : « ${t.s} » touche un trait`, false); break; }
    for (const [cx, cy, R] of d.disques) if (D.boiteTouheDisque(pad, cx, cy, R)) { vrai(`${nom} : « ${t.s} » touche un noyau ou un disque`, false); break; }
    for (const b of d.boites) if (D.boitesSeChevauchent(pad, b)) { vrai(`${nom} : « ${t.s} » touche un amas d’atomes`, false); break; }
  }
  for (let i = 0; i < d.textes.length; i++) for (let j = i + 1; j < d.textes.length; j++) vrai(`${nom} : « ${d.textes[i].s} » chevauche « ${d.textes[j].s} »`, !D.boitesSeChevauchent(d.textes[i].boite, D.gonfler(d.textes[j].boite, d.textes[i].sym || d.textes[j].sym ? 0 : 5, 0)) && !D.boitesSeChevauchent(D.gonfler(d.textes[i].boite, d.textes[i].sym || d.textes[j].sym ? 0 : 5, 0), d.textes[j].boite));
  // noyaux dessinés : nombres exacts de protons et de neutrons, noyaux qui ne se recouvrent pas
  for (const k of d.noyaux) { const { pts } = M.nucleonsC(k.Z, k.A); vrai(`${nom} : noyau ${k.Z}-${k.A} : ${k.Z} protons et ${k.A - k.Z} neutrons`, pts.filter(p => p.proton).length === k.Z && pts.filter(p => !p.proton).length === k.A - k.Z && pts.length === k.A); vrai(`${nom} : noyau ${k.Z}-${k.A} dans le cadre`, k.cx - k.R >= 0 && k.cx + k.R <= d.W && k.cy - k.R >= 0 && k.cy + k.R <= d.H); }
  for (let i = 0; i < d.noyaux.length; i++) for (let j = i + 1; j < d.noyaux.length; j++) { const a = d.noyaux[i], b = d.noyaux[j]; vrai(`${nom} : noyaux ${i} et ${j} se recouvrent`, Math.hypot(a.cx - b.cx, a.cy - b.cy) >= a.R + b.R - 1e-6); }
  // espaces insécables : jamais « 1 kg » avec une espace ordinaire
  for (const t of d.textes) vrai(`${nom} : « ${t.s} » espace insécable avant l’unité`, !/\d (kg|g|nm|mm|cm|%|°)/.test(t.s));
  // hauteur raisonnable : le schéma plafonné à 480 de large ne dépasse pas 420 de haut
  if (d.W >= 400) vrai(`${nom} : hauteur ${d.H} ≤ 420`, d.H <= 420);
  return d;
}
const tous = D.toutes();
for (const [nom, d] of Object.entries(tous)) controler(nom, d);
// exploration : chaque réaction nucléaire du modèle
for (const r of Object.values(M.REACTIONS)) controler(`réaction ${r.id}`, D.dessinReaction(r));
// exploration : isotopes de chaque élément
for (const Z of M.Z_LISTE) controler(`isotopes Z=${Z}`, D.rangeeIsotopes(Z));
// contenu de quelques scènes
{
  const cnt = (d, f) => d.items.filter(f).length;
  const dens = (nom, d) => d.noyaux.map(k => `${k.Z}-${k.A}`);
  vrai('scène fusion : deutérium, tritium, hélium 4 et un neutron', dens('f', tous['scène fusion']).join() === '1-2,1-3,2-4,0-1');
  vrai('scène fission : neutron, uranium 235, strontium 94, xénon 140 et deux neutrons', dens('f', tous['scène fission']).join() === '0-1,92-235,38-94,54-140,0-1,0-1');
  vrai('scène quatre : C 14, N 14, O 16, O 17', dens('q', tous['scène quatre']).join() === '6-14,7-14,8-16,8-17');
  vrai('scène isoH : hydrogène 1, 2, 3', dens('h', tous['scène isoH']).join() === '1-1,1-2,1-3');
  vrai('carte isotopes : carbone 12, 13, 14', dens('i', tous['carte isotopes']).join() === '6-12,6-13,6-14');
  vrai('scène fusionFission : fusion puis fission', dens('d', tous['scène fusionFission']).join() === '1-2,1-3,2-4,0-1,0-1,92-235,38-94,54-140,0-1,0-1');
  // les quatre noyaux de la fission respectent les écritures du modèle
  const fi = M.REACTIONS.fissionSr; vrai('fission dessinée = fissionSr du modèle', fi.gauche.map(M.cle).join() === '92-235,0-1' && M.bilan(fi).ok);
  vrai('chaîne énergétique : 4 cadres et 3 flèches', cnt(tous['scène chaine'], x => x.t === 'rect') === 4 && cnt(tous['scène chaine'], x => x.t === 'fleche') === 3);
  vrai('chaîne masquée : « énergie : ? » présent et « thermique » absent (la réponse n’est pas affichée)', tous['scène chaine'].textes.some(t => t.s === 'énergie : ?') && !tous['scène chaine'].textes.some(t => /thermique|chaleur/.test(t.s)));
  vrai('carte chaîne : la forme d’énergie est donnée', tous['carte chaine'].textes.some(t => /thermique/.test(t.s)));
  // aucune scène du parcours ne donne le nom de la nature d'une situation à classer, sauf les étapes d'exposé (tableau et bilan)
  vrai('scène energie : l’énergie libérée n’est pas donnée (« ? »)', tous['scène energie'].textes.filter(t => /énergie libérée : \?/.test(t.s)).length === 2);
  vrai('scène fusionFission : aucun symbole d’élément (pas de réponse avant l’étape de l’écriture)', !tous['scène fusionFission'].textes.some(t => ['H', 'He', 'U', 'Sr', 'Xe'].includes(t.s)) && tous['scène fusion'].textes.some(t => t.s === 'He'));
  // échelle commune : dans la scène « quatre » tous les noyaux ont le même rayon de nucléon
  const rq = new Set(tous['scène quatre'].noyaux.map(k => k.r)); vrai('scène quatre : même échelle', rq.size === 1);
  // tableau des natures : conforme au modèle (3 lignes × 3 colonnes de coches)
  const tn = tous['scène bilan']; const coches = tn.items.filter(x => x.t === 'coche').map(x => x.ok);
  vrai('tableau des natures = modèle', JSON.stringify(coches) === JSON.stringify(['physique', 'chimique', 'nucleaire'].flatMap(id => ['molecules', 'atomes', 'noyaux'].map(k => M.CONSERVE[id][k]))));
}
console.log(ko ? `${ko} échec(s)` : `Tout est correct (${nsc} schémas, ${n} contrôles)`);
process.exit(ko ? 1 : 0);
