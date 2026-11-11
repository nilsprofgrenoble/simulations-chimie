// Scène moléculaire des épaississants associatifs (SVG).
// Principe : UNE image lisible. Les objets sont gros, mélangés dans la même boîte, et la liaison se VOIT :
//   - HEUR (Coapur) : des chaînes à gants aux deux bouts ; un gant tient une « balle » (particule) ;
//   - HASE (Thixol) : des chaînes à crochets ; deux crochets s’accrochent comme deux maillons ;
//   - ASE : chaîne sans groupe hydrophobe, qui se déploie (charges –) quand on neutralise.
// Quand le cisaillement casse une liaison, le gant s’éloigne de la particule ou les crochets se séparent.
// Codes couleurs du séchage de peinture : pigments et charges en rouge, liant (latex) en bleu.
// Dessin schématique : tailles, nombres et positions sont indicatifs.

import { useEffect, useMemo, useState } from "react";
import { KIT, stylePetitBouton } from "../commun";
import { mulberry32, fractionIonisee, fractionsLiaisons, facteurPHHASE } from "./epaisseursAssociatifsModele";

const W = 600, H = 340;
const COUL = {
  charge: "#dc2626", chargeBord: "#7f1d1d",
  liant: "#4aa3d8", liantBord: "#2b6ea3",
  chaine: "#475569",
  gant: "#b45309", gantBord: "#7c2d12",
  crochet: "#7c3aed",
  moins: "#0f766e",
};

// ---------------------------------------------------------------- géométrie

const S = 1.25; // agrandissement des icônes (gants, crochets) pour rester lisibles sur téléphone
const rad = (d) => d * Math.PI / 180;
const unit = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }; };
const angleDeg = (u) => Math.atan2(u.y, u.x) * 180 / Math.PI;

// Courbe lisse (Catmull-Rom) passant par tous les points.
function courbe(pts) {
  if (pts.length < 2) return "";
  const p = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

// Insère des points intermédiaires décalés pour que la chaîne ondule ; l’ondulation diminue si la chaîne est tendue.
function onduler(pts, amp = 9, pas = 55) {
  const out = [pts[0]];
  let signe = 1;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.floor(len / pas);
    const nx = -(b.y - a.y) / (len || 1), ny = (b.x - a.x) / (len || 1);
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      out.push({ x: a.x + (b.x - a.x) * t + nx * amp * signe, y: a.y + (b.y - a.y) * t + ny * amp * signe });
      signe = -signe;
    }
    out.push(b);
  }
  return out;
}

function echantillonner(pts, pas = 14) {
  const res = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / pas));
    for (let k = 0; k <= n; k++) res.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
  }
  return res;
}

// Place des disques sans chevauchement, loin des obstacles (points avec rayon de dégagement).
function placer(n, rayons, obstacles, graine, zone = { x0: 20, x1: W - 20, y0: 20, y1: H - 20 }, deja = []) {
  // « Meilleur candidat » : pour chaque disque, on tire plusieurs positions libres et on garde la plus éloignée
  // des disques déjà posés (et des bords) : le décor se répartit ainsi sur toute la scène, sans amas.
  const rng = mulberry32(graine);
  const out = [];
  for (let k = 0; k < n; k++) {
    const r = rayons[k % rayons.length];
    let meilleur = null, dMeilleur = -1;
    for (let essai = 0, valides = 0; essai < 4000 && valides < 40; essai++) {
      const x = zone.x0 + r + rng() * (zone.x1 - zone.x0 - 2 * r);
      const y = zone.y0 + r + rng() * (zone.y1 - zone.y0 - 2 * r);
      if (obstacles.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r)) continue;
      const autres = [...deja, ...out];
      if (autres.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 8)) continue;
      valides++;
      const d = autres.length ? Math.min(...autres.map((o) => Math.hypot(o.x - x, o.y - y) - o.r - r)) : 1e3;
      if (d > dMeilleur) { dMeilleur = d; meilleur = { x, y, r }; }
    }
    if (meilleur) out.push(meilleur);
  }
  return out;
}

const obstacleChaine = (pts, r = 12) => echantillonner(pts, 12).map((p) => ({ ...p, r }));

// ---------------------------------------------------------------- icônes (repère local : le point d’attache est l’origine, l’icône regarde vers +x)

function Gant({ x, y, a, ouvert = false }) {
  // Gant de baseball vu de dessus : paume ronde, trois doigts allongés qui entourent la balle, pouce replié.
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${S})`}>
      {[-40, 0, 40].map((k) => (
        <ellipse key={k} cx={12 + 14 * Math.cos(rad(k))} cy={14 * Math.sin(rad(k))} rx="9" ry="4.2" transform={`rotate(${k} ${12 + 14 * Math.cos(rad(k))} ${14 * Math.sin(rad(k))})`}
          fill={COUL.gant} stroke={COUL.gantBord} strokeWidth="1" />
      ))}
      <ellipse cx="9" cy="-12" rx="7" ry="4" transform="rotate(-60 9 -12)" fill={COUL.gant} stroke={COUL.gantBord} strokeWidth="1" />
      <circle cx="12" cy="0" r="10" fill={COUL.gant} stroke={COUL.gantBord} strokeWidth="1.2" />
      <path d="M8,-5 Q14,0 8,5" stroke="#fed7aa" strokeWidth="1.6" fill="none" opacity={ouvert ? 0.9 : 0.6} />
    </g>
  );
}

function Crochet({ x, y, a }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${S})`}>
      <path d="M0,0 L5,0" stroke={COUL.crochet} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M19.8,-6.9 A9,9 0 1 0 19.8,6.9" stroke={COUL.crochet} strokeWidth="4.2" strokeLinecap="round" fill="none" />
    </g>
  );
}

const Particule = ({ p }) => (
  <g>
    <circle cx={p.x} cy={p.y} r={p.r} fill={COUL.charge} stroke={COUL.chargeBord} strokeWidth="1.5" />
    {p.nom && <text x={p.x} y={p.y + 4.5} fontSize="12" fontWeight="700" textAnchor="middle" fill="#fff" stroke={COUL.chargeBord} strokeWidth="0.5" paintOrder="stroke">{p.nom}</text>}
  </g>
);

// ---------------------------------------------------------------- HEUR : gants et particules

const PART_HEUR = [
  { x: 90, y: 90, r: 21, nom: "TiO₂" },
  { x: 310, y: 70, r: 20, nom: "CaCO₃" },
  { x: 200, y: 255, r: 23, nom: "TiO₂" },
  { x: 500, y: 185, r: 21, nom: "Talc" },
];
// Chaînes à gants aux deux bouts : chaque extrémité tient une particule.
const CHAINES_HEUR = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]];
const ORDRE_ASSOC = [0, 5, 2, 7, 4, 9, 1, 6, 3, 8]; // ordre de rupture : réparti dans l’image
const REPOS = 45 * S; // distance du point d’attache au bord de la particule, quand le gant tient

// Dose forte : des chaînes en plus. Les particules sont déjà « saturées » (tous leurs sites sont pris) : les gants en trop
// ne trouvent plus de particule et s’attrapent entre eux. Trois paires de chaînes dans les zones libres de l’image.
// axe « h » : gants face à face horizontalement ; axe « v » : verticalement.
const PAIRES_AUTO = [
  { axe: "h", A: [{ x: 290, y: 300 }, { x: 405, y: 300 }], B: [{ x: 465, y: 300 }, { x: 555, y: 300 }] },
  { axe: "h", A: [{ x: 365, y: 32 }, { x: 425, y: 32 }], B: [{ x: 485, y: 32 }, { x: 545, y: 32 }] },
  { axe: "v", A: [{ x: 45, y: 125 }, { x: 45, y: 180 }], B: [{ x: 45, y: 240 }, { x: 45, y: 295 }] },
];
const ORDRE_AUTO = [0, 2, 1];

function sceneHEUR({ fAssoc, fAuto, doseForte = false }) {
  const gants = [];
  const chaines = [];
  CHAINES_HEUR.forEach(([i, j], k) => {
    const A = PART_HEUR[i], B = PART_HEUR[j];
    const u = unit(A, B);
    const ia = k * 2, ib = k * 2 + 1;
    const nbIntact = Math.round(CHAINES_HEUR.length * 2 * fAssoc);
    const tenuA = ORDRE_ASSOC.indexOf(ia) < nbIntact, tenuB = ORDRE_ASSOC.indexOf(ib) < nbIntact;
    const libre = Math.hypot(B.x - A.x, B.y - A.y) - A.r - B.r - 2 * REPOS; // longueur de chaîne disponible
    const recul = Math.max(8, Math.min(26, libre / 2 - 4)); // un gant qui lâche recule, sans croiser l’autre bout
    const da = A.r + REPOS + (tenuA ? 0 : recul), db = B.r + REPOS + (tenuB ? 0 : recul);
    const pa = { x: A.x + u.x * da, y: A.y + u.y * da };
    const pb = { x: B.x - u.x * db, y: B.y - u.y * db };
    gants.push({ ...pa, a: angleDeg(u) + 180, tient: tenuA, part: A, type: "assoc" });
    gants.push({ ...pb, a: angleDeg(u), tient: tenuB, part: B, type: "assoc" });
    chaines.push([pa, pb]);
  });
  let nbAuto = 0;
  if (doseForte) {
    const nbPaires = Math.round(PAIRES_AUTO.length * fAuto);
    PAIRES_AUTO.forEach((pr, k) => {
      const ok = ORDRE_AUTO.indexOf(k) < nbPaires;
      if (ok) nbAuto++;
      const d = ok ? 0 : 22;
      const h = pr.axe === "h";
      const A = pr.A.map((p) => ({ ...p })), B = pr.B.map((p) => ({ ...p }));
      if (h) { A[1].x -= d; B[0].x += d; } else { A[1].y -= d; B[0].y += d; }
      gants.push({ ...A[0], a: h ? 180 : -90, tient: false, type: "libre" }, { ...A[1], a: h ? 0 : 90, tient: ok, type: "auto" },
        { ...B[0], a: h ? 180 : -90, tient: ok, type: "auto" }, { ...B[1], a: h ? 0 : 90, tient: false, type: "libre" });
      chaines.push(A, B);
    });
  }
  const compte = {
    assoc: [gants.filter((g) => g.type === "assoc" && g.tient).length, gants.filter((g) => g.type === "assoc").length],
    auto: [nbAuto, doseForte ? PAIRES_AUTO.length : 0],
  };
  return { gants, chaines, compte };
}

// ---------------------------------------------------------------- HASE : chaînes à crochets

const X_AB = [120, 300, 480], X_BC = [210, 390, 560];
// Paires de crochets (axe vertical), dans l’ordre de rupture (réparti dans l’image).
const PAIRES_HASE = [
  { x: 120, haut: "A", bas: "B", ym: 115 }, { x: 390, haut: "B", bas: "C", ym: 225 },
  { x: 300, haut: "A", bas: "B", ym: 115 }, { x: 560, haut: "B", bas: "C", ym: 225 },
  { x: 480, haut: "A", bas: "B", ym: 115 }, { x: 210, haut: "B", bas: "C", ym: 225 },
];
const Y_RANG = { A: 60, B: 170, C: 280 };

function sceneHASE({ fCrochet }) {
  const nIntact = Math.round(PAIRES_HASE.length * fCrochet);
  const attaches = { A: [], B: [], C: [] };
  const crochets = [];
  PAIRES_HASE.forEach((p, k) => {
    const h = (k < nIntact ? 18.5 : 40) * S;
    const pa = { x: p.x, y: p.ym - h }, pb = { x: p.x, y: p.ym + h };
    attaches[p.haut].push(pa); attaches[p.bas].push(pb);
    crochets.push({ ...pa, a: 90, tient: k < nIntact }, { ...pb, a: -90, tient: k < nIntact });
  });
  const chaines = ["A", "B", "C"].map((c) => {
    const pts = attaches[c].sort((u, v) => u.x - v.x);
    const base = [{ x: 18, y: Y_RANG[c] }, ...pts, { x: W - 15, y: Y_RANG[c] }];
    return onduler(base, 8, 70);
  });
  return { crochets, chaines, compte: { crochet: [nIntact, PAIRES_HASE.length] } };
}

// Quand le pH baisse, chaque chaîne se replie sur place : celle du haut vers la gauche, celle du milieu vers le centre, celle du bas vers la droite.
const debutChaine = (k, longueur) => (k === 0 ? 40 : k === 1 ? (W - longueur) / 2 : W - 40 - longueur);

// HASE en milieu acide (non neutralisé) : comme un ASE, la chaîne est repliée en pelote ; les groupes hydrophobes sont enfouis, pas de crochets.
const SEUIL_PELOTE = 0.5;
function sceneHASEPelote({ f }) {
  const longueur = 90 + 430 * f, amp = 11;
  return ["A", "B", "C"].map((c, k) => {
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push({ x: debutChaine(k, longueur) + (i / 20) * longueur, y: Y_RANG[c] + amp * Math.sin(i * 1.3 + k * 1.7) * (0.55 + 0.45 * f) });
    return pts;
  });
}

// ---------------------------------------------------------------- ASE : chaîne sans groupe hydrophobe, qui gonfle

const Y_ASE = [70, 170, 270];
function sceneASE({ ion }) {
  const longueur = 90 + 430 * ion, amp = 11;
  const chaines = Y_ASE.map((y, c) => {
    const pts = [];
    const n = 20;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({ x: debutChaine(c, longueur) + t * longueur, y: y + amp * Math.sin(i * 1.3 + c * 1.7) * (0.55 + 0.45 * ion) });
    }
    return pts;
  });
  const moins = [];
  chaines.forEach((pts) => {
    const nb = Math.round(9 * ion);
    for (let k = 0; k < nb; k++) {
      const i = Math.round(1 + (k + 0.5) * (pts.length - 2) / Math.max(1, nb));
      const p = pts[Math.min(i, pts.length - 1)];
      moins.push({ x: p.x, y: p.y + (k % 2 ? 15 : -15) });
    }
  });
  return { chaines, moins };
}

// ---------------------------------------------------------------- agitation thermique (mouvement brownien schématique)

const reduireMouvement = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Horloge à 30 images par seconde, limitée au composant qui l’appelle.
function useHorloge(actif) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!actif) return undefined;
    let raf = 0, dernier = 0;
    const boucle = (ts) => {
      if (ts - dernier > 33) { dernier = ts; setT(ts / 1000); }
      raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [actif]);
  return t;
}

// Décalage pseudo-aléatoire lisse (somme de sinusoïdes de fréquences non commensurables), propre à chaque particule.
const agiter = (i, t, amp) => ({
  dx: amp * (Math.sin(t * (2.1 + 0.37 * i) + i * 1.7) + 0.6 * Math.sin(t * (5.3 + 0.21 * i) + i * 0.9)) / 1.6,
  dy: amp * (Math.sin(t * (1.9 + 0.29 * i) + i * 2.3) + 0.6 * Math.sin(t * (4.7 + 0.33 * i) + i * 3.1)) / 1.6,
});

// Errance lente d’une molécule d’eau dans l’espace libre autour d’elle (amplitude amp en px).
const errer = (i, t, amp) => ({
  dx: amp * (Math.sin(t * (0.35 + 0.05 * (i % 7)) + i * 1.7) + 0.5 * Math.sin(t * (0.8 + 0.04 * (i % 5)) + i * 0.9)) / 1.5,
  dy: amp * (Math.sin(t * (0.3 + 0.04 * (i % 6)) + i * 2.3) + 0.5 * Math.sin(t * (0.7 + 0.05 * (i % 4)) + i * 3.1)) / 1.5,
});

// Particules de liant (et charges libres) : agitation thermique autour de leur position (identique à tout gradient).
function DecorAnime({ decor, famille, actif }) {
  const t = useHorloge(actif);
  const amp = 5;                                                             // l’agitation thermique ne dépend pas du gradient
  const liant = decor.liant.map((g, i) => {
    if (!actif) return { ...g, x: g.x, y: g.y };
    const { dx, dy } = agiter(i, t, amp);
    return { ...g, x: g.x + dx, y: g.y + dy };
  });
  const charges = decor.charges.map((c, i) => {
    if (!actif) return { c, dx: 0, dy: 0 };
    const { dx, dy } = agiter(i + 7, t, amp * 0.4);
    return { c, dx, dy };
  });
  return (
    <>
      {liant.map((g, i) => <circle key={"l" + i} cx={g.x} cy={g.y} r={g.r} fill={COUL.liant} stroke={COUL.liantBord} strokeWidth="1.2" opacity="0.9" />)}
      {famille !== "heur" && charges.map(({ c, dx, dy }, i) => <g key={"c" + i} transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)})`}><Particule p={c} /></g>)}
    </>
  );
}

// Billes d’eau (hors échelle) : une bille par case d’une grille irrégulière, positions fixes.
const BASE_EAU = (() => {
  const r = mulberry32(2024), out = [], nx = 24, ny = 13;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) out.push({ x: (i + 0.15 + 0.7 * r()) * W / nx, y: (j + 0.15 + 0.7 * r()) * H / ny });
  return out;
})();

function EauAnimee({ billes, actif }) {
  const t = useHorloge(actif);
  return (
    <>
      {billes.map((b, i) => {
        // L’eau libre se promène lentement dans l’espace libre autour d’elle ; l’eau liée reste accrochée à sa chaîne.
        const { dx, dy } = actif ? errer(i, t, b.amp) : { dx: 0, dy: 0 };
        return <circle key={i} cx={b.x + dx} cy={b.y + dy} r="2.6"
          fill={b.liee ? "#f59e0b" : "#ffffff"} stroke={b.liee ? "#b45309" : "#94a3b8"} strokeWidth="1" />;
      })}
    </>
  );
}

// ---------------------------------------------------------------- composant

export function SceneMoleculaire({ famille, gamma = 0.1, lambda = 1, doseForte = false, pH = 8.5, avecEau = true }) {
  const [agitation, setAgitation] = useState(() => !reduireMouvement());
  const [eauDemandee, setEau] = useState(false);
  const eau = avecEau && eauDemandee;      // la vue « eau » n’est proposée qu’en exploration (parcours guidé : un seul objet à la fois)
  const ion = fractionIonisee(pH);
  const fr = fractionsLiaisons(famille, { gamma, lambda, doseForte, pH });

  // Décor (liant et charges) : positions fixes, calculées une fois par famille à l’écart de toutes les positions possibles.
  const decor = useMemo(() => {
    let obst = [];
    let charges = [];
    if (famille === "hase") {
      for (const f of [1, 0]) {
        const s = sceneHASE({ fCrochet: f });
        s.chaines.forEach((c) => { obst = obst.concat(obstacleChaine(c, 14)); });
        s.crochets.forEach((c) => obst.push({ x: c.x, y: c.y, r: 42 }));
      }
      sceneHASEPelote({ f: SEUIL_PELOTE }).forEach((c) => { obst = obst.concat(obstacleChaine(c, 18)); });
      charges = placer(4, [21, 18, 20, 19], obst, 11, { x0: 20, x1: W - 20, y0: 12, y1: H - 12 });
    } else if (famille === "heur") {
      for (const f of [1, 0]) {
        const s = sceneHEUR({ fAssoc: f, fAuto: f, doseForte: true });
        s.chaines.forEach((c) => { obst = obst.concat(obstacleChaine(c, 14)); });
        s.gants.forEach((g) => obst.push({ x: g.x, y: g.y, r: 44 }));
      }
      PART_HEUR.forEach((p) => obst.push({ x: p.x, y: p.y, r: p.r + 6 }));
      charges = PART_HEUR;
    } else {
      const s = sceneASE({ ion: 1 });
      s.chaines.forEach((c) => { obst = obst.concat(obstacleChaine(c, 22)); });
      charges = placer(4, [22, 20, 21, 19], obst, 5, { x0: 20, x1: W - 20, y0: 12, y1: H - 12 });
    }
    const liant = placer(famille === "heur" ? 12 : 11, [9, 10, 8, 9], [...obst, ...charges.map((c) => ({ ...c, r: c.r + 4 }))], 77);
    return { charges, liant };
  }, [famille]);

  let dessin = null;
  let compte = null;
  let lignes = [];
  let rayonEau = 0;
  // Zone d’eau liée (volume hydrodynamique) : bande ambrée autour de chaque chaîne, visible seulement avec la vue « eau ».
  const halo = (chaines, r) => eau ? chaines.map((c, i) => (
    <path key={"h" + i} d={courbe(c)} fill="none" stroke="#f59e0b" strokeOpacity="0.22" strokeWidth={2 * r} strokeLinecap="round" strokeLinejoin="round" />
  )) : null;
  const fPH = facteurPHHASE(pH);
  if (famille === "hase" && fPH < SEUIL_PELOTE) {
    const chaines = sceneHASEPelote({ f: fPH });
    lignes = chaines; rayonEau = 4 + 22 * fPH;
    dessin = (
      <g>
        {halo(chaines, rayonEau)}
        {chaines.map((c, i) => <path key={i} d={courbe(c)} fill="none" stroke={COUL.chaine} strokeWidth="3.5" strokeLinecap="round" />)}
      </g>
    );
    compte = <>pH trop bas : le polymère n’est pas neutralisé, la chaîne est repliée en pelote et ses groupes hydrophobes sont enfouis : <b>aucun crochet</b>, pas de réseau.</>;
  } else if (famille === "hase") {
    const s = sceneHASE({ fCrochet: fr.crochet });
    lignes = s.chaines; rayonEau = 4 + 14 * fr.crochet;
    dessin = (
      <g>
        {halo(s.chaines, rayonEau)}
        {s.chaines.map((c, i) => <path key={i} d={courbe(c)} fill="none" stroke={COUL.chaine} strokeWidth="3.5" strokeLinecap="round" />)}
        {s.crochets.map((c, i) => <Crochet key={i} x={c.x} y={c.y} a={c.a} />)}
      </g>
    );
    compte = <>Crochets accrochés : <b>{s.compte.crochet[0]}</b> paires sur {s.compte.crochet[1]}</>;
  } else if (famille === "heur") {
    const s = sceneHEUR({ fAssoc: fr.assoc, fAuto: fr.auto, doseForte });
    lignes = s.chaines.map((c) => onduler(c, 7, 55)); rayonEau = 4 + 14 * fr.assoc;
    dessin = (
      <g>
        {halo(lignes, rayonEau)}
        {s.gants.filter((g) => g.type === "assoc" && g.tient).map((g, i) => (
          <line key={"b" + i} x1={g.x + 29 * S * Math.cos(rad(g.a))} y1={g.y + 29 * S * Math.sin(rad(g.a))}
            x2={g.part.x} y2={g.part.y} stroke="#0f172a" strokeWidth="2.5" strokeDasharray="5 4" />
        ))}
        {s.chaines.map((c, i) => <path key={i} d={courbe(onduler(c, 7, 55))} fill="none" stroke={COUL.chaine} strokeWidth="3.5" strokeLinecap="round" />)}
      </g>
    );
    compte = <>Gants accrochés à une particule : <b>{s.compte.assoc[0]}</b> sur {s.compte.assoc[1]}
      {doseForte && <> · gants accrochés entre eux : <b>{s.compte.auto[0]}</b> paire{s.compte.auto[0] > 1 ? "s" : ""} sur {s.compte.auto[1]}</>}</>;
    dessin = <>{dessin}{s.gants.map((g, i) => <Gant key={"g" + i} x={g.x} y={g.y} a={g.a} ouvert={!g.tient} />)}</>;
  } else {
    const s = sceneASE({ ion });
    lignes = s.chaines; rayonEau = 4 + 22 * ion;
    dessin = (
      <g>
        {halo(s.chaines, rayonEau)}
        {s.chaines.map((c, i) => <path key={i} d={courbe(c)} fill="none" stroke={COUL.chaine} strokeWidth="3.5" strokeLinecap="round" />)}
        {s.moins.map((m, i) => (
          <g key={i}><circle cx={m.x} cy={m.y} r="6.5" fill={COUL.moins} /><rect x={m.x - 3.5} y={m.y - 0.9} width="7" height="1.8" fill="#fff" /></g>
        ))}
      </g>
    );
    compte = <>Groupes –COOH ionisés (–COO⁻) : <b>{Math.round(ion * 100)} %</b></>;
  }

  // Billes d’eau : positions de base réparties (grille irrégulière), classées « liées » (dans la zone autour d’une chaîne) ou « libres ».
  let eauLibrePct = 100;
  let billes = [];
  if (eau) {
    const pts = lignes.flatMap((c) => echantillonner(c, 10));
    billes = BASE_EAU.map((b) => {
      const d = pts.length ? Math.min(...pts.map((p) => Math.hypot(p.x - b.x, p.y - b.y))) : 1e3;
      const liee = d < rayonEau;
      return { ...b, liee, amp: liee ? 1.5 : Math.max(2, Math.min(12, d - rayonEau - 3)) };    // amplitude limitée à l’espace libre accessible
    });
    eauLibrePct = 100 * billes.filter((b) => !b.liee).length / billes.length;
  }

  return (
    <figure style={{ margin: "10px 0 0", width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scène moléculaire : chaînes d’épaississant, particules de charge et particules de liant (latex) dans la peinture"
        style={{ width: "100%", display: "block", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8 }}>
        {eau && <EauAnimee billes={billes} actif={agitation} />}
        <DecorAnime decor={decor} famille={famille} actif={agitation} />
        {dessin}
        {famille === "heur" && decor.charges.map((p, i) => <Particule key={"c" + i} p={p} />)}
      </svg>
      <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6 }}>{compte}</div>
      {famille === "heur" && doseForte && (
        <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 4, padding: "6px 8px", borderRadius: 8, background: "#f5f3ff", border: "1px solid #c4b5fd" }}>
          Dose forte : il y a plus de chaînes que de particules. Les particules (rouges) sont saturées, tous leurs sites sont pris :
          les gants en trop ne trouvent plus de particule et <b>s’attrapent entre eux</b> (trois paires en bas, en haut à droite et à gauche).
          Ces liaisons gant-gant sont lâches : elles cèdent au cisaillement et se reforment lentement, d’où la thixotropie.
        </div>
      )}
      {eau && (
        <div style={{ fontSize: 14, color: KIT.txt, marginTop: 4 }}>
          Eau libre (blanche, bord gris) : <b>{Math.round(eauLibrePct)} %</b> · eau liée aux chaînes (ambre) : <b>{Math.round(100 - eauLibrePct)} %</b>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>
            Idée qualitative : plus les chaînes immobilisent d’eau (volume hydrodynamique), moins il en reste de libre pour s’écouler, et plus la viscosité est élevée.
            Billes hors échelle : une molécule d’eau est environ 300 fois plus petite qu’une particule de latex.
          </div>
        </div>
      )}
      {avecEau && <button type="button" aria-pressed={eau} onClick={() => setEau(!eau)} style={{ ...stylePetitBouton(eau, "#b45309"), marginTop: 6, marginRight: 8 }}>
        {eau ? "💧 Cacher l’eau" : "💧 Voir l’eau et le volume hydrodynamique"}
      </button>}
      <button type="button" aria-pressed={agitation} onClick={() => setAgitation(!agitation)} style={{ ...stylePetitBouton(agitation, "#0369a1"), marginTop: 6 }}>
        {agitation ? "⏸ Arrêter l’agitation thermique" : "▶ Agitation thermique (mouvement brownien)"}
      </button>
    </figure>
  );
}

// ---------------------------------------------------------------- profil de vitesse (image fixe du gradient de vitesse)

// Cisaillement entre deux plaques : plaque du bas fixe, plaque du haut mobile ; la vitesse de chaque couche (flèche) augmente avec la hauteur.
// La longueur des flèches grandit avec γ̇ (échelle comprimée, logarithmique), seule la tendance est exacte.
export function ProfilVitesse({ gamma }) {
  const Lmax = 40 + 380 * Math.min(1, Math.log10(1 + gamma) / 3.3);
  const ys = [0, 1, 2, 3, 4, 5].map((k) => 138 - 20 * k);
  return (
    <figure style={{ margin: "8px 0 0" }}>
      <svg viewBox="0 0 600 180" role="img" aria-label="Profil de vitesse : les couches du liquide glissent les unes sur les autres, la vitesse augmente avec la hauteur"
        style={{ width: "100%", display: "block", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8 }}>
        <rect x="70" y="146" width="500" height="10" fill="#cbd5e1" stroke="#64748b" />
        <text x="76" y="174" fontSize="12" fill="#475569">plaque fixe : v = 0</text>
        <rect x="70" y="22" width="500" height="10" fill="#cbd5e1" stroke="#64748b" />
        <text x="76" y="16" fontSize="12" fill="#475569">plaque mobile : v maximale</text>
        {ys.slice(1).map((y, i) => {
          const k = i + 1, L = Lmax * k / 5, x0 = 80;
          return (
            <g key={k}>
              <line x1={x0} y1={y} x2={x0 + L - 8} y2={y} stroke="#0369a1" strokeWidth="3" />
              <polygon points={`${x0 + L},${y} ${x0 + L - 12},${y - 6} ${x0 + L - 12},${y + 6}`} fill="#0369a1" />
            </g>
          );
        })}
        <line x1="40" y1="146" x2="40" y2="40" stroke="#475569" strokeWidth="1.5" />
        <polygon points="40,30 35,44 45,44" fill="#475569" />
        <text x="22" y="110" fontSize="12" fill="#475569" transform="rotate(-90 22 110)">hauteur</text>
      </svg>
      <figcaption style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.45 }}>
        Les couches de liquide glissent les unes sur les autres : plus on monte, plus elles vont vite. Le gradient de vitesse γ̇ = (variation de vitesse) / (distance entre couches), en s⁻¹ :
        plus γ̇ est grand, plus la vitesse change vite d’une couche à l’autre (flèches plus longues, échelle comprimée).
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------- légende (mêmes icônes que la scène)

export function LegendeScene({ famille }) {
  const item = (icone, texte) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 14, marginTop: 4 }}>
      <svg width="40" height="26" viewBox="-4 -13 40 26" aria-hidden="true">{icone}</svg>{texte}
    </span>
  );
  return (
    <div style={{ fontSize: 13, color: KIT.txt, marginTop: 4, lineHeight: 1.5 }}>
      {item(<circle cx="14" cy="0" r="10" fill={COUL.charge} stroke={COUL.chargeBord} strokeWidth="1.5" />, "pigment ou charge (rouge)")}
      {item(<circle cx="14" cy="0" r="7" fill={COUL.liant} stroke={COUL.liantBord} strokeWidth="1.2" />, "liant : particule de latex dans l’eau (bleu)")}
      {item(<path d="M0,0 C8,-8 16,8 32,0" stroke={COUL.chaine} strokeWidth="3.5" fill="none" strokeLinecap="round" />, "chaîne d’épaississant")}
      {famille === "heur" && item(<Gant x={0} y={0} a={0} />, "gant : tient une particule (liaison associative, forte)")}
      {famille === "hase" && item(<Crochet x={0} y={0} a={0} />, "crochet : s’accroche à un autre crochet (liaison auto-associante, lâche)")}
      {famille === "ase" && item(<g><circle cx="14" cy="0" r="6.5" fill={COUL.moins} /><rect x="10.5" y="-0.9" width="7" height="1.8" fill="#fff" /></g>, "charge – après neutralisation : les chaînes se repoussent")}
    </div>
  );
}

// Icônes agrandies pour le panneau « gants et crochets ».
export const IconeGant = () => <svg width="90" height="52" viewBox="-6 -26 62 52" aria-hidden="true"><Gant x={0} y={0} a={0} /></svg>;
export const IconeCrochet = () => <svg width="90" height="52" viewBox="-6 -26 62 52" aria-hidden="true"><g transform="scale(1.4) translate(0 0)"><Crochet x={0} y={0} a={0} /></g></svg>;
export const IconeParticule = () => <svg width="90" height="52" viewBox="-6 -26 62 52" aria-hidden="true"><Particule p={{ x: 22, y: 0, r: 22, nom: "TiO₂" }} /></svg>;
