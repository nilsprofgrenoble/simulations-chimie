// Tests de mise en page des schémas du prisme (sim 201) : aucune étiquette ne touche un trait, un arc ou une autre étiquette ; tout reste dans le cadre ;
// textes assez grands ; échelle identique en horizontal et en vertical ; rayons fléchés. node src/simulations/prisme2gtDispo.test.mjs
import * as D from './prisme2gtDispo.js';
import * as M from './prisme2gtModele.js';
let ko = 0, nscenes = 0;
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } };
function controler(nom, cfg) {
  const d = D.dispo(cfg); nscenes++;
  const T = d.textes.map(t => ({ ...t }));
  for (const t of T) {
    vrai(`${nom} : « ${t.texte} » bien placée`, t.ok !== false);
    vrai(`${nom} : « ${t.texte} » dans le cadre`, t.boite.x >= 0 && t.boite.y >= 0 && t.boite.x + t.boite.w <= d.W && t.boite.y + t.boite.h <= d.H);
    vrai(`${nom} : « ${t.texte} » assez grande (${t.taille})`, t.taille >= (d.W >= 400 ? 18 : 13));
    const pad = { x: t.boite.x - 1, y: t.boite.y - 1, w: t.boite.w + 2, h: t.boite.h + 2 };
    for (const [p, q] of d.obstacles) if (D.boiteTouche(pad, p, q)) { vrai(`${nom} : « ${t.texte} » touche un trait`, false); break; }
  }
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) vrai(`${nom} : « ${T[i].texte} » chevauche « ${T[j].texte} »`, !D.boitesSeChevauchent(T[i].boite, T[j].boite));
  if (d.regle) vrai(`${nom} : la règle de 1 cm mesure k px`, Math.abs(d.regle.x2 - d.regle.x1 - d.k) < 1e-9);
  // échelle isotrope : le côté du prisme mesure 4 cm dans les deux directions
  const [L, R, T3] = d.polys[0].points;
  vrai(`${nom} : prisme équilatéral de 4 cm à l’échelle (isotrope)`, Math.abs(Math.hypot(R[0] - L[0], R[1] - L[1]) - 4 * d.k) < 1e-6 && Math.abs(Math.hypot(T3[0] - L[0], T3[1] - L[1]) - 4 * d.k) < 1e-6);
  return d;
}
for (const [c, f] of Object.entries(D.SCENES)) { const d = controler(`scène ${c}`, f()); vrai(`scène ${c} : au moins une flèche`, d.fleches.length > 0); }
for (const [c, f] of Object.entries(D.CARTES)) controler(`carte ${c}`, f());
// exploration : sources, angles, verres
const sources = [{ source: 'blanc' }, { source: 'laser', nm: 400 }, { source: 'laser', nm: 800 }, ...M.LAMPES.map(l => ({ source: 'lampe', lampe: l.id }))];
for (const s of sources) for (const i1 of [50, 60, 70, 80]) for (const f of [1, 0.3, 0]) controler(`exploration ${JSON.stringify(s)} ${i1}° f=${f}`, D.cfgExploration({ ...s, i1, f }));
for (let k = 0; k < 40; k++) controler('exploration laser aléatoire', D.cfgExploration({ source: 'laser', nm: Math.round(400 + Math.random() * 400), i1: Math.round(50 + Math.random() * 30), f: [1, 0.3, 0][k % 3] }));
// contenu des schémas retouchés
{
  const noms = (cle, f = D.SCENES) => D.dispo(f[cle]()).textes.map(t => t.texte);
  vrai('scène sortie : normale, verre, air nommés', ['normale', 'verre', 'air'].every(m => noms('sortie').includes(m)));
  vrai('scène deviations : un « D » par arc (rouge et violet)', noms('deviations').filter(t => t === 'D').length === 2);
  vrai('scène deviations : règle d’échelle présente', !!D.dispo(D.SCENES.deviations()).regle);
  vrai('scène deux : pointillé nommé « sans prisme »', noms('deux').includes('sans prisme'));
  vrai('carte indice : mention « écart exagéré »', noms('indice', D.CARTES).includes('écart exagéré'));
  vrai('carte deuxFaces : deux normales dessinées', D.dispo(D.CARTES.deuxFaces()).lignes.filter(l => l.normale).length === 2);
  // verre sans dispersion : un seul faisceau blanc et une tache blanche, pas de rayon rouge ni violet
  const sd = D.dispo(D.cfgExploration({ source: 'blanc', i1: 60, f: 0 }));
  vrai('verre sans dispersion : tache blanche sur l’écran', sd.taches.length === 1 && sd.taches[0].couleur === '#ffffff');
  vrai('verre sans dispersion : aucun trait de couleur de rayon', !sd.lignes.some(l => /^hsl/.test(l.couleur)));
  // lampe à vapeur : un seul faisceau (gris), bande-spectre agrandie, étiquettes avec l’unité nm (espace insécable)
  for (const l of M.LAMPES) {
    const d = D.dispo(D.cfgExploration({ source: 'lampe', lampe: l.id, i1: 60 }));
    vrai(`lampe ${l.id} : un seul faisceau gris (pas un rayon par raie)`, d.lignes.filter(x => x.couleur === '#475569' && !x.tirets && !x.ecran).length === 3);
    const lab = d.textes.filter(t => /nm$/.test(t.texte));
    vrai(`lampe ${l.id} : bande-spectre et ${l.raies.length} raie(s) étiquetée(s) en nm avec espace insécable`, !!d.spectre && d.spectre.raies.length === l.raies.length && lab.length >= 1 && lab.every(t => /\d\u00a0nm$/.test(t.texte)));
  }
  // espaces insécables : tout texte de schéma qui contient ° ou nm a une espace insécable devant
  for (const [c, f] of [...Object.entries(D.SCENES), ...Object.entries(D.CARTES)]) for (const t of D.dispo(f()).textes) vrai(`${c} : « ${t.texte} » espace insécable avant l’unité`, !/\d [°]|\d nm|\d cm/.test(t.texte) && !/\d[°]/.test(t.texte));
}
console.log(ko ? `${ko} échec(s)` : `Tout est correct (${nscenes} schémas contrôlés)`);
process.exit(ko ? 1 : 0);
