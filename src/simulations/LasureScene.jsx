// Scènes SVG de la simulation « Lasure alkyde : séchage oxydant et peau en pot » (BTS MDC, formulation).
// Modèle pur : lasureModele.js. Aucune bibliothèque externe. Toute image est une FONCTION de l'état du modèle
// (positions tirées une fois pour toutes avec un générateur à graine) : aucune animation n'est « plaquée »,
// chaque particule visible correspond à une quantité calculée (solvant restant, anti-peau restant, avancement X…).

import { KIT, fmt } from "../commun";

// ---------------------------------------------------------------------------
// Temps : un seul curseur en échelle logarithmique, de 1 minute à 3 mois
// ---------------------------------------------------------------------------

export const T_MIN = 1 / 60;   // h
export const T_MAX = 2160;     // h (90 j = 3 mois)
export const tDepuisU = (u) => T_MIN * Math.pow(T_MAX / T_MIN, Math.min(1, Math.max(0, u)));
export const uDepuisT = (t) => Math.log(Math.max(t, T_MIN) / T_MIN) / Math.log(T_MAX / T_MIN);

export const REPERES = [
  { t: 1, lib: "1 h" }, { t: 12, lib: "12 h" }, { t: 24, lib: "1 j" },
  { t: 168, lib: "1 sem." }, { t: 336, lib: "14 j" }, { t: 2160, lib: "3 mois" },
];

export function formatTemps(t) {
  if (t < 1) return `${Math.max(1, Math.round(t * 60))} min`;
  if (t < 10) return `${fmt(t, 1)} h`;
  if (t < 24) return `${Math.round(t)} h`;
  if (t < 240) return `${fmt(t / 24, 1)} j`;
  if (t < 2100) return `${Math.round(t / 24)} j`;
  return "3 mois (90 j)";
}

// ---------------------------------------------------------------------------
// Générateur pseudo-aléatoire à graine : mêmes positions à chaque affichage
// ---------------------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NB_CHAINES = 12;
const alea = mulberry32(20261112);
const CHAINES = Array.from({ length: NB_CHAINES }, (_, i) => ({ y: (i + 0.6) / (NB_CHAINES + 0.2), ph: alea() * 6.28, f: 2 + alea() * 1.6, a: 2 + alea() * 1.6 }));
const LIAISONS = Array.from({ length: 70 }, () => ({ i: Math.floor(alea() * (NB_CHAINES - 1)), x: 0.04 + alea() * 0.92, r: alea() }))
  .sort((a, b) => a.r - b.r);
const SOLVANT = Array.from({ length: 44 }, () => ({ x: 0.03 + alea() * 0.94, y: 0.04 + alea() * 0.92, r: alea(), rot: alea() * 40 - 20 }));
const SICCATIF = Array.from({ length: 12 }, () => ({ x: 0.06 + alea() * 0.88, y: 0.1 + alea() * 0.8 }));
const ANTIPEAU = Array.from({ length: 28 }, () => ({ x: 0.04 + alea() * 0.92, y: 0.06 + alea() * 0.88, rot: alea() * 360 }));
const OXYGENE = Array.from({ length: 12 }, () => ({ x: 0.04 + alea() * 0.92, y: alea(), rot: alea() * 360 }));

const melange = (c1, c2, u) => {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * u)).join(",")})`;
};

// Croissant (☾) dessiné en chemin : pas de dépendance à une police
const CROISSANT = "M0 -5 A5 5 0 1 0 0 5 A7 7 0 0 1 0 -5 Z";

// ---------------------------------------------------------------------------
// Scène 1 : coupe du film sur le support
// ---------------------------------------------------------------------------

export function SceneFilm({ etat, si, ap, wft, couches }) {
  const W = 560, H = 330, x0 = 36, x1 = 410, ySupport = 288;
  const echelle = wft <= 100 ? 2.4 : 1;                      // px par µm (50 µm : zoom pour garder des particules lisibles)
  const hFilm = etat.epaisseur * echelle;
  const yTop = ySupport - hFilm;
  const largeur = x1 - x0;
  const sec = 1 - etat.solvant;                              // fraction d'évaporation du solvant
  const couleurFilm = melange("#fde68a", "#e9b872", Math.min(1, etat.X * 0.7 + sec * 0.3));
  const nSicc = Math.round(si * 4);
  const nInhibes = Math.round((1 - etat.phi) * nSicc);
  const nAP = Math.round(ap * 26);
  const nAPrestants = Math.round(nAP * (ap > 0 ? etat.antiPeau / ap : 0));
  const nLibres = Math.max(0, nAPrestants - nInhibes);
  const pos = (px, py) => [x0 + px * largeur, ySupport - py * hFilm];
  const graduations = wft <= 100 ? [0, 10, 20, 30, 40, 50] : [0, 50, 100, 150, 200];
  const aria = `Coupe du film à ${fmt(etat.t, 1)} h : épaisseur ${fmt(etat.epaisseur, 0)} micromètres, solvant restant ${fmt(etat.solvant * 100, 0)} pour cent, réticulation ${fmt(etat.X * 100, 0)} pour cent.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ width: "100%", height: "auto", display: "block", background: "#f8fafc", borderRadius: 14, border: `1px solid ${KIT.bord}` }}>
      {/* Air */}
      <text x={x0} y={22} fontSize="12" fill={KIT.txt2} fontWeight="700">air</text>
      {/* Film */}
      <rect x={x0} y={yTop} width={largeur} height={hFilm} fill={couleurFilm} stroke="#b45309" strokeWidth="1" opacity="0.95" />
      {/* Support (bois) */}
      <rect x={x0} y={ySupport} width={largeur} height={30} fill="#c8975a" />
      {[6, 14, 22].map((d) => <path key={d} d={`M${x0} ${ySupport + d} q 60 -4 120 0 t 120 0 t 134 0`} stroke="#a16f36" strokeWidth="1" fill="none" opacity="0.7" />)}
      <text x={x0 + 8} y={ySupport + 22} fontSize="11" fill="#fff7ed" fontWeight="700">bois</text>

      {/* Chaînes de résine (acides gras insaturés, C=C) */}
      {CHAINES.map((c, i) => {
        const y = ySupport - c.y * hFilm;
        const d = Array.from({ length: 26 }, (_, k) => {
          const u = k / 25;
          return `${k === 0 ? "M" : "L"}${(x0 + u * largeur).toFixed(1)} ${(y + Math.sin(c.ph + u * c.f * 6.28) * c.a).toFixed(1)}`;
        }).join(" ");
        return <path key={i} d={d} fill="none" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" opacity="0.85" />;
      })}

      {/* Liaisons de réticulation : leur nombre visible est proportionnel à l'avancement X */}
      {couches.liaisons && LIAISONS.map((l, k) => {
        if (l.r >= etat.X) return null;
        const xa = x0 + l.x * largeur, y1 = ySupport - CHAINES[l.i].y * hFilm, y2 = ySupport - CHAINES[l.i + 1].y * hFilm;
        return (
          <g key={k}>
            <line x1={xa} y1={y1} x2={xa} y2={y2} stroke="#ea580c" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx={xa} cy={(y1 + y2) / 2} r="2.4" fill="#ea580c" />
          </g>
        );
      })}

      {/* Solvant : white spirit */}
      {SOLVANT.map((m, k) => {
        if (m.r >= etat.solvant) return null;
        const [px, py] = pos(m.x, m.y);
        return <ellipse key={k} cx={px} cy={py} rx="6" ry="2.8" fill="#64748b" opacity="0.8" transform={`rotate(${m.rot} ${px} ${py})`} />;
      })}

      {/* Siccatif (métaux : Co, Zr, Ca…) : inhibé = entouré d'un croissant d'anti-peau */}
      {couches.siccatif && SICCATIF.slice(0, nSicc).map((m, k) => {
        const [px, py] = pos(m.x, m.y);
        const inhibe = k < nInhibes;
        return (
          <g key={k}>
            {!inhibe && <circle cx={px} cy={py} r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2.5 2.5" />}
            <circle cx={px} cy={py} r="5.5" fill={inhibe ? "#93c5fd" : "#2563eb"} stroke={inhibe ? "#16a34a" : "#1e3a8a"} strokeWidth={inhibe ? 2 : 1} />
            {inhibe && <path d={CROISSANT} transform={`translate(${px + 8} ${py}) scale(1.05)`} fill="#16a34a" />}
          </g>
        );
      })}

      {/* Anti-peau libre (molécules de DEHA) */}
      {couches.antipeau && ANTIPEAU.slice(0, nLibres).map((m, k) => {
        const [px, py] = pos(m.x, m.y);
        return <path key={k} d={CROISSANT} transform={`translate(${px} ${py}) rotate(${m.rot}) scale(1.05)`} fill="#16a34a" opacity="0.9" />;
      })}

      {/* Dioxygène de l'air */}
      {couches.o2 && OXYGENE.map((m, k) => {
        const px = x0 + m.x * largeur, py = 34 + m.y * Math.max(10, yTop - 52);
        return (
          <g key={k} transform={`translate(${px} ${py}) rotate(${m.rot})`}>
            <circle cx="-3.6" cy="0" r="3.6" fill="#dc2626" /><circle cx="3.6" cy="0" r="3.6" fill="#dc2626" />
          </g>
        );
      })}
      {couches.o2 && <text x={x1 - 6} y={22} fontSize="12" textAnchor="end" fill="#dc2626" fontWeight="700">O₂ de l’air</text>}

      {/* Règle d'épaisseur */}
      {graduations.map((g) => {
        const y = ySupport - g * echelle;
        return (
          <g key={g}>
            <line x1={x1 + 18} y1={y} x2={x1 + 28} y2={y} stroke={KIT.txt2} strokeWidth="1" />
            <text x={x1 + 32} y={y + 4} fontSize="11" fill={KIT.txt2}>{g}</text>
          </g>
        );
      })}
      <line x1={x1 + 18} y1={ySupport} x2={x1 + 18} y2={ySupport - graduations[graduations.length - 1] * echelle} stroke={KIT.txt2} strokeWidth="1" />
      <text x={x1 + 18} y={ySupport - graduations[graduations.length - 1] * echelle - 8} fontSize="11" fill={KIT.txt2}>µm</text>
      {/* Épaisseur actuelle du film */}
      <line x1={x1 + 6} y1={yTop} x2={x1 + 16} y2={yTop} stroke="#b45309" strokeWidth="2" />
      <text x={x1 + 70} y={Math.max(30, yTop + 4)} fontSize="13" fontWeight="700" fill="#b45309">{fmt(etat.epaisseur, 0)} µm</text>
    </svg>
  );
}

export function LegendeFilm({ couches }) {
  const item = (icone, texte, k) => (
    <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: KIT.txt2, marginRight: 12, whiteSpace: "nowrap" }}>{icone}{texte}</span>
  );
  const svg = (enfants) => <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">{enfants}</svg>;
  return (
    <div style={{ marginTop: 6, lineHeight: 1.9 }}>
      {item(svg(<path d="M1 7 Q 6 1 11 7 T 21 7" fill="none" stroke="#7c2d12" strokeWidth="2" />), "chaîne de résine alkyde")}
      {item(svg(<ellipse cx="11" cy="7" rx="6" ry="2.8" fill="#64748b" />), "white spirit")}
      {couches.liaisons && item(svg(<><line x1="11" y1="1" x2="11" y2="13" stroke="#ea580c" strokeWidth="2.4" /><circle cx="11" cy="7" r="2.4" fill="#ea580c" /></>), "liaison de réticulation")}
      {couches.o2 && item(svg(<><circle cx="7" cy="7" r="3.6" fill="#dc2626" /><circle cx="14" cy="7" r="3.6" fill="#dc2626" /></>), "dioxygène")}
      {couches.siccatif && item(svg(<circle cx="11" cy="7" r="5" fill="#2563eb" stroke="#f59e0b" strokeDasharray="2 2" />), "siccatif actif")}
      {couches.antipeau && item(svg(<path d={CROISSANT} transform="translate(11 7)" fill="#16a34a" />), "anti-peau (DEHA)")}
      {couches.antipeau && item(svg(<><circle cx="8" cy="7" r="4.4" fill="#93c5fd" stroke="#16a34a" strokeWidth="1.6" /><path d={CROISSANT} transform="translate(16 7) scale(0.9)" fill="#16a34a" /></>), "siccatif inhibé")}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scène 2 : coupe du pot fermé
// ---------------------------------------------------------------------------

export function ScenePot({ etatPot, ap, jours }) {
  const W = 560, H = 360, xp = 44, wp = 210, yLiq = 118, mmPx = 7;   // 30 mm de liquide = 210 px
  const profil = etatPot.profil, n = profil.length, dzMm = etatPot.dzMm;
  const hLiq = 30 * mmPx;
  const bandes = Array.from({ length: 60 }, (_, b) => {
    const i = Math.min(n - 1, Math.floor((b / 60) * n));
    const u = ap > 0 ? Math.min(1, profil[i] / ap) : 0;
    return { y: yLiq + (b / 60) * hLiq, h: hLiq / 60 + 0.5, couleur: melange("#fde68a", "#4ade80", u) };
  });
  const peauPx = etatPot.peauMm > 0 ? Math.max(2.5, etatPot.peauMm * mmPx) : 0;
  // Profil d'anti-peau (axe horizontal : % de la valeur initiale ; axe vertical : profondeur, alignée sur le pot)
  const xg0 = 330, xg1 = 520;
  const courbe = ap > 0 ? Array.from({ length: 60 }, (_, k) => {
    const i = Math.min(n - 1, Math.floor((k / 59) * (n - 1)));
    return `${k === 0 ? "M" : "L"}${(xg0 + Math.min(1, profil[i] / ap) * (xg1 - xg0)).toFixed(1)} ${(yLiq + (i * dzMm) * mmPx).toFixed(1)}`;
  }).join(" ") : "";
  const aria = `Coupe du pot fermé à ${fmt(jours, 1)} jours : anti-peau en surface à ${fmt(ap > 0 ? etatPot.cSurface / ap * 100 : 0, 0)} pour cent de sa valeur initiale, ${etatPot.peauMm > 0 ? `peau de ${fmt(etatPot.peauMm, 1)} millimètre` : "pas de peau"}.`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} style={{ width: "100%", height: "auto", display: "block", background: "#f8fafc", borderRadius: 14, border: `1px solid ${KIT.bord}` }}>
      {/* Couvercle et parois */}
      <rect x={xp - 6} y={yLiq - 74} width={wp + 12} height={10} rx="3" fill="#475569" />
      <path d={`M${xp} ${yLiq - 64} V ${yLiq + hLiq + 10} H ${xp + wp} V ${yLiq - 64}`} fill="none" stroke="#475569" strokeWidth="4" />
      {/* Ciel du pot */}
      <rect x={xp} y={yLiq - 64} width={wp} height={64} fill="#eff6ff" />
      {Array.from({ length: 9 }, (_, k) => (
        <g key={k} transform={`translate(${xp + 18 + (k % 5) * 40 + (k > 4 ? 18 : 0)} ${yLiq - 48 + Math.floor(k / 5) * 26}) rotate(${(k * 53) % 180})`}>
          <circle cx="-3.6" cy="0" r="3.6" fill="#dc2626" /><circle cx="3.6" cy="0" r="3.6" fill="#dc2626" />
        </g>
      ))}
      <text x={xp + wp / 2} y={yLiq - 70 - 8} fontSize="12" textAnchor="middle" fill={KIT.txt2} fontWeight="700">ciel du pot : O₂</text>
      {/* Liquide, coloré par l'anti-peau restant */}
      {bandes.map((b, k) => <rect key={k} x={xp} y={b.y} width={wp} height={b.h} fill={b.couleur} />)}
      {/* Peau */}
      {peauPx > 0 && <rect x={xp} y={yLiq} width={wp} height={peauPx} fill="#7c2d12" />}
      {peauPx > 0 && <text x={xp + wp + 10} y={yLiq + Math.max(peauPx, 10)} fontSize="13" fontWeight="700" fill="#7c2d12">peau</text>}
      {/* Graduation de profondeur */}
      {[0, 10, 20, 30].map((mm) => (
        <g key={mm}>
          <line x1={xp + wp + 4} y1={yLiq + mm * mmPx} x2={xp + wp + 12} y2={yLiq + mm * mmPx} stroke={KIT.txt2} />
          <text x={xp + wp + 16} y={yLiq + mm * mmPx + 4} fontSize="11" fill={KIT.txt2}>{mm}</text>
        </g>
      ))}
      <text x={xp + wp + 16} y={yLiq + hLiq + 22} fontSize="11" fill={KIT.txt2}>profondeur (mm)</text>
      {/* Profil d'anti-peau */}
      <rect x={xg0} y={yLiq} width={xg1 - xg0} height={hLiq} fill="white" stroke={KIT.bord} />
      <text x={(xg0 + xg1) / 2} y={yLiq - 10} fontSize="12" textAnchor="middle" fill={KIT.txt2} fontWeight="700">anti-peau restant (% de l’initial)</text>
      {[0, 50, 100].map((p) => (
        <g key={p}>
          <line x1={xg0 + (p / 100) * (xg1 - xg0)} y1={yLiq} x2={xg0 + (p / 100) * (xg1 - xg0)} y2={yLiq + hLiq} stroke={KIT.bord} strokeDasharray="3 3" />
          <text x={xg0 + (p / 100) * (xg1 - xg0)} y={yLiq + hLiq + 14} fontSize="11" textAnchor="middle" fill={KIT.txt2}>{p}</text>
        </g>
      ))}
      {ap > 0 && <path d={courbe} fill="none" stroke="#16a34a" strokeWidth="3" />}
      {ap === 0 && <text x={(xg0 + xg1) / 2} y={yLiq + hLiq / 2} fontSize="13" textAnchor="middle" fill={KIT.txt2}>pas d’anti-peau</text>}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Graphique à axe des temps logarithmique
// ---------------------------------------------------------------------------

const TICKS = [[T_MIN, "1 min"], [1, "1 h"], [24, "1 j"], [168, "1 sem."], [720, "1 mois"], [2160, "3 mois"]];

export function GrapheLog({ series, yMax, yLabel, tCurseur, reperes = [], seuil = null, hauteur = 210, titre }) {
  const W = 560, H = hauteur, m = { g: 50, d: 26, h: 14, b: 34 };
  const X = (t) => m.g + (Math.log(t / T_MIN) / Math.log(T_MAX / T_MIN)) * (W - m.g - m.d);
  const Y = (v) => H - m.b - (Math.min(v, yMax) / yMax) * (H - m.b - m.h);
  const trace = (pts) => pts.map(([t, v], k) => `${k === 0 ? "M" : "L"}${X(t).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titre || yLabel} style={{ width: "100%", height: "auto", display: "block", background: "white", borderRadius: 14, border: `1px solid ${KIT.bord}` }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={m.g} y1={Y(f * yMax)} x2={W - m.d} y2={Y(f * yMax)} stroke={KIT.bord} strokeDasharray="3 3" />
          <text x={m.g - 6} y={Y(f * yMax) + 4} fontSize="11" textAnchor="end" fill={KIT.txt2}>{fmt(f * yMax, yMax <= 2 ? 1 : 0)}</text>
        </g>
      ))}
      {TICKS.map(([t, lib]) => (
        <g key={lib}>
          <line x1={X(t)} y1={m.h} x2={X(t)} y2={H - m.b} stroke={KIT.bord} />
          <text x={X(t)} y={H - m.b + 15} fontSize="11" textAnchor="middle" fill={KIT.txt2}>{lib}</text>
        </g>
      ))}
      <text x={12} y={H / 2} fontSize="12" fill={KIT.txt2} fontWeight="700" transform={`rotate(-90 12 ${H / 2})`} textAnchor="middle">{yLabel}</text>
      {seuil != null && (
        <g>
          <line x1={m.g} y1={Y(seuil.valeur)} x2={W - m.d} y2={Y(seuil.valeur)} stroke={seuil.couleur || "#b91c1c"} strokeDasharray="6 4" strokeWidth="1.5" />
          <text x={W - m.d - 4} y={Y(seuil.valeur) - 5} fontSize="11" textAnchor="end" fill={seuil.couleur || "#b91c1c"} fontWeight="700">{seuil.lib}</text>
        </g>
      )}
      {series.map((s, k) => <path key={k} d={trace(s.pts)} fill="none" stroke={s.couleur} strokeWidth="2.6" strokeDasharray={s.pointille ? "6 4" : undefined} />)}
      {reperes.map((r, k) => (
        <g key={k}>
          <circle cx={X(r.t)} cy={Y(r.v)} r="5" fill="white" stroke={r.couleur || "#0f172a"} strokeWidth="2.2" />
          {r.lib && <text x={X(r.t) + 8} y={Y(r.v) - 7} fontSize="11" fill={r.couleur || KIT.txt2} fontWeight="700">{r.lib}</text>}
        </g>
      ))}
      {tCurseur != null && <line x1={X(tCurseur)} y1={m.h} x2={X(tCurseur)} y2={H - m.b} stroke="#f5a31a" strokeWidth="2.2" />}
      {/* Légende des courbes */}
      {series.filter((s) => s.nom).map((s, k) => (
        <g key={k} transform={`translate(${m.g + 8 + k * 170} ${m.h + 6})`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke={s.couleur} strokeWidth="2.6" strokeDasharray={s.pointille ? "5 3" : undefined} />
          <text x="23" y="4" fontSize="11.5" fill={KIT.txt}>{s.nom}</text>
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Scène 3 : carte du compromis « séchage rapide / pot sans peau »
// ---------------------------------------------------------------------------

export function CarteCompromis({ points, formulesTP, courant, cible }) {
  const W = 560, H = 330, m = { g: 56, d: 16, h: 22, b: 40 };
  const xMax = 50, jMin = 5, jMax = 90;
  const X = (p) => m.g + (Math.min(p, xMax) / xMax) * (W - m.g - m.d);
  // Axe vertical logarithmique, avec une bande « pas de peau avant 3 mois » au-dessus de 90 j
  const yBande = m.h + 22;
  const Y = (j) => (j === Infinity || j >= jMax) ? yBande - 12
    : H - m.b - (Math.log(Math.max(j, jMin) / jMin) / Math.log(jMax / jMin)) * (H - m.b - yBande - 6);
  const grad = [[5, "5 j"], [10, "10 j"], [20, "20 j"], [45, "45 j"]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Carte du compromis : dureté à 12 heures en abscisse, jours avant la peau en ordonnée" style={{ width: "100%", height: "auto", display: "block", background: "white", borderRadius: 14, border: `1px solid ${KIT.bord}` }}>
      {cible && <rect x={X(cible.p)} y={m.h} width={W - m.d - X(cible.p)} height={Y(cible.j) - m.h} fill="#bbf7d0" opacity="0.55" />}
      {cible && <text x={W - m.d - 6} y={m.h + 14} fontSize="12" textAnchor="end" fill="#15803d" fontWeight="700">zone du cahier des charges</text>}
      {[0, 10, 20, 30, 40, 50].map((p) => (
        <g key={p}>
          <line x1={X(p)} y1={m.h} x2={X(p)} y2={H - m.b} stroke={KIT.bord} strokeDasharray="3 3" />
          <text x={X(p)} y={H - m.b + 16} fontSize="11" textAnchor="middle" fill={KIT.txt2}>{p}</text>
        </g>
      ))}
      {grad.map(([j, lib]) => (
        <g key={lib}>
          <line x1={m.g} y1={Y(j)} x2={W - m.d} y2={Y(j)} stroke={KIT.bord} strokeDasharray="3 3" />
          <text x={m.g - 6} y={Y(j) + 4} fontSize="11" textAnchor="end" fill={KIT.txt2}>{lib}</text>
        </g>
      ))}
      <text x={m.g - 6} y={Y(Infinity) + 4} fontSize="11" textAnchor="end" fill="#15803d" fontWeight="700">&gt; 3 mois</text>
      <line x1={m.g} y1={yBande} x2={W - m.d} y2={yBande} stroke="#15803d" strokeDasharray="2 3" />
      <text x={(m.g + W - m.d) / 2} y={H - 6} fontSize="12" textAnchor="middle" fill={KIT.txt2} fontWeight="700">dureté Persoz à 12 h (s) : plus c’est à droite, plus ça sèche vite</text>
      <text x={14} y={(H - m.b + yBande) / 2} fontSize="12" fill={KIT.txt2} fontWeight="700" textAnchor="middle" transform={`rotate(-90 14 ${(H - m.b + yBande) / 2})`}>jours avant la peau</text>
      {points.map((q, k) => <circle key={k} cx={X(q.p)} cy={Y(q.j)} r="3" fill="#94a3b8" opacity="0.7" />)}
      {formulesTP.map((f) => (
        <g key={f.nom}>
          <circle cx={X(f.p)} cy={Y(f.j)} r="6" fill="#7c3aed" stroke="white" strokeWidth="1.5" />
          <text x={X(f.p) + 9} y={Y(f.j) + 4} fontSize="11.5" fill="#6d28d9" fontWeight="700">{f.nom}</text>
        </g>
      ))}
      {courant && <circle cx={X(courant.p)} cy={Y(courant.j)} r="9" fill="none" stroke="#f5a31a" strokeWidth="3.2" />}
    </svg>
  );
}
