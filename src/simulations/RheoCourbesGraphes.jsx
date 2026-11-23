// Graphiques et schémas de la simulation « Courbes d'écoulement et de viscosité » (BTS MDC).
// Tout est dessiné en SVG natif : axes linéaires ou logarithmiques, courbes, points mesurés, repères.
// Règle de lisibilité : textes ≥ 15 dans un viewBox de 480 (≥ 11 px rendus sur téléphone), ≥ 13 dans un viewBox de 300.

import { useId } from "react";
import { KIT } from "../commun";
import { TV, Fl, ROUGE, BLEU, VERT, ORANGE, NOIR, GRIS } from "./Travail";
import { rampe, PRODUITS } from "./rheoCourbesModele";

const NB = " ";
const milliers = (x) => {
  const s = String(Math.round(x));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
};
const decimal = (x) => String(+x.toPrecision(3)).replace(".", ",");
const etiquette = (x) => (x >= 1000 ? milliers(x) : x >= 1 ? String(+x.toPrecision(3)) : decimal(x));

function ticksLin(a, b) {
  const brut = (b - a) / 4;
  const p = Math.pow(10, Math.floor(Math.log10(brut)));
  const f = brut / p;
  const pas = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const t = [];
  for (let v = Math.ceil(a / pas - 1e-9) * pas; v <= b + 1e-9; v += pas) t.push(+v.toPrecision(8));
  return t;
}
function ticksLog(a, b) {
  const t = [];
  for (let k = Math.ceil(Math.log10(a) - 1e-9); k <= Math.floor(Math.log10(b) + 1e-9); k++) t.push(Math.pow(10, k));
  return t;
}
const nice = (m) => { const p = Math.pow(10, Math.floor(Math.log10(m))); const f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };

/**
 * Graphique générique. series : [{ pts: [[x, y], …], c, tirets, marq, ep }] ; reperes : [{ x, y, c }].
 * Les bornes absentes sont calculées d'après les données.
 */
export function Graphe({ aria, series, xLog = false, yLog = false, x0, x1, y0, y1, xTitre, yTitre, reperes = [], maxWidth = 480, vh = 290 }) {
  const idClip = useId().replace(/:/g, "");
  const L = 74, R = 14, T = 12, B = 50, W = 480 - L - R, H = vh - T - B;
  const tous = series.flatMap((s) => s.pts);
  const xs = tous.map((p) => p[0]).filter((v) => v > 0 || !xLog);
  const ys = tous.map((p) => p[1]).filter((v) => isFinite(v) && (v > 0 || !yLog));
  const ax0 = x0 ?? (xLog ? Math.pow(10, Math.floor(Math.log10(Math.min(...xs)))) : 0);
  const ax1 = x1 ?? (xLog ? Math.pow(10, Math.ceil(Math.log10(Math.max(...xs)))) : nice(Math.max(...xs)));
  const ay0 = y0 ?? (yLog ? Math.pow(10, Math.floor(Math.log10(Math.min(...ys)))) : 0);
  const ay1 = y1 ?? (yLog ? Math.pow(10, Math.ceil(Math.log10(Math.max(...ys)))) : nice(Math.max(...ys) * 1.05));
  const fx = (v) => L + ((xLog ? Math.log10(v) - Math.log10(ax0) : v - ax0) / (xLog ? Math.log10(ax1) - Math.log10(ax0) : ax1 - ax0)) * W;
  const fy = (v) => T + H - ((yLog ? Math.log10(Math.max(v, ay0)) - Math.log10(ay0) : v - ay0) / (yLog ? Math.log10(ay1) - Math.log10(ay0) : ay1 - ay0)) * H;
  const tx = xLog ? ticksLog(ax0, ax1) : ticksLin(ax0, ax1);
  const ty = yLog ? ticksLog(ay0, ay1) : ticksLin(ay0, ay1);
  return (
    <svg viewBox={`0 0 480 ${vh}`} role="img" aria-label={aria} style={{ width: "100%", maxWidth, display: "block", margin: "0 auto", background: "#fff", borderRadius: 10 }}>
      <rect x={L} y={T} width={W} height={H} fill="#fff" stroke={KIT.bord} />
      {tx.map((v, i) => (
        <g key={"x" + i}>
          <line x1={fx(v)} y1={T} x2={fx(v)} y2={T + H} stroke="#e2e8f0" />
          <text x={fx(v)} y={T + H + 19} fontSize="16" textAnchor={fx(v) > L + W - 14 ? "end" : "middle"} fill={KIT.txt2}>{etiquette(v)}</text>
        </g>
      ))}
      {ty.map((v, i) => (
        <g key={"y" + i}>
          <line x1={L} y1={fy(v)} x2={L + W} y2={fy(v)} stroke="#e2e8f0" />
          <text x={L - 6} y={fy(v) + 5} fontSize="16" textAnchor="end" fill={KIT.txt2}>{etiquette(v)}</text>
        </g>
      ))}
      <text x={L + W / 2} y={vh - 4} fontSize="16" fontWeight="700" textAnchor="middle" fill={NOIR}>{xTitre}</text>
      <text transform={`translate(15 ${T + H / 2}) rotate(-90)`} fontSize="16" fontWeight="700" textAnchor="middle" fill={NOIR}>{yTitre}</text>
      <clipPath id={idClip}><rect x={L} y={T} width={W} height={H} /></clipPath>
      <g clipPath={`url(#${idClip})`}>
        {series.map((s, k) => {
          const pts = s.pts.filter((p) => (!xLog || p[0] > 0) && (!yLog || p[1] > 0));
          return (
            <g key={k}>
              {!s.pointsSeuls && <polyline points={pts.map((p) => `${fx(p[0]).toFixed(1)},${fy(p[1]).toFixed(1)}`).join(" ")} fill="none" stroke={s.c}
                strokeWidth={s.ep || 2.6} strokeDasharray={s.tirets ? "7 5" : undefined} strokeLinejoin="round" />}
              {s.marq && pts.map((p, i) => <circle key={i} cx={fx(p[0])} cy={fy(p[1])} r={s.pointsSeuls ? 5 : 4} fill={s.tirets ? "#fff" : s.c} stroke={s.c} strokeWidth="2" />)}
            </g>
          );
        })}
      </g>
      {reperes.map((r, i) => (
        <g key={"r" + i}>
          <line x1={fx(r.x)} y1={T} x2={fx(r.x)} y2={T + H} stroke={GRIS} strokeDasharray="4 4" />
          <circle cx={fx(r.x)} cy={fy(r.y)} r="6" fill={r.c} stroke="#fff" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

export function Legende({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", marginTop: 4, fontSize: 14, color: KIT.txt }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <svg width="28" height="10" aria-hidden="true"><line x1="1" y1="5" x2="27" y2="5" stroke={it.c} strokeWidth="3" strokeDasharray={it.tirets ? "6 4" : undefined} /></svg>
          {it.nom}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schémas (parcours guidé et cartes « À retenir »)
// ---------------------------------------------------------------------------

export const Svg = ({ aria, vb = "0 0 300 220", maxWidth = 320, children }) => (
  <svg viewBox={vb} role="img" aria-label={aria} style={{ width: "100%", maxWidth, display: "block", margin: "6px auto", background: "#fff", borderRadius: 10 }}>{children}</svg>
);

// Cisaillement entre deux plans : plan du haut entraîné, plan du bas fixe, profil de vitesse linéaire.
export function FCisaillement({ maxWidth = 320 }) {
  return (
    <Svg aria="Fluide cisaillé entre un plan fixe et un plan mobile : force tangentielle, vitesse, épaisseur e et profil de vitesse linéaire" vb="0 0 300 220" maxWidth={maxWidth}>
      <rect x="70" y="40" width="200" height="14" fill="#94a3b8" stroke="#475569" />
      <rect x="70" y="176" width="200" height="14" fill="#cbd5e1" stroke="#475569" />
      <rect x="70" y="54" width="200" height="122" fill="#fde68a" opacity="0.45" />
      {[0, 1, 2, 3].map((i) => {
        const y = 78 + i * 28, v = 150 - i * 36;
        return <Fl key={i} x1={70} y1={y} x2={70 + v * 0.6 + 20} y2={y} c={BLEU} w={2.4} />;
      })}
      <line x1="70" y1="176" x2="178" y2="54" stroke={NOIR} strokeDasharray="4 3" strokeWidth="1.5" />
      <Fl x1={150} y1={30} x2={240} y2={30} c={ROUGE} w={3.5} />
      <TV x={244} y={36} c={ROUGE} s={20} halo>F</TV>
      <TV x={20} y={62} c={VERT} s={20} halo>v</TV>
      <line x1="46" y1="54" x2="46" y2="176" stroke={NOIR} strokeWidth="1.6" />
      <polyline points="42,60 46,54 50,60" fill="none" stroke={NOIR} strokeWidth="1.6" />
      <polyline points="42,170 46,176 50,170" fill="none" stroke={NOIR} strokeWidth="1.6" />
      <text x="26" y="120" fontSize="16" fontWeight="700" fill={NOIR}>e</text>
      <text x="186" y="170" fontSize="14" fontWeight="700" fill={NOIR}>aire S</text>
      <text x="80" y="212" fontSize="14" fill={GRIS}>plan fixe</text>
    </Svg>
  );
}

// Rhéomètre rotatif, géométrie cône-plan : le moteur impose la rotation N du cône, le capteur mesure le couple C.
// `rot` (0 à 1) épaissit la flèche de rotation quand on augmente la vitesse.
export function FViscosimetre({ maxWidth = 320, rot = 0.3 }) {
  const ep = 2 + rot * 4;
  return (
    <Svg aria="Rhéomètre rotatif à géométrie cône-plan : la tête contient le moteur, qui impose la vitesse de rotation N du cône, et le capteur, qui mesure le couple C ; l'échantillon forme une couche mince entre le cône mobile et la plaque fixe" vb="0 0 300 236" maxWidth={maxWidth}>
      {/* tête de mesure */}
      <rect x="96" y="10" width="108" height="46" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="1.6" />
      <text x="150" y="29" fontSize="14" fontWeight="700" textAnchor="middle" fill={NOIR}>moteur</text>
      <text x="150" y="47" fontSize="14" fontWeight="700" textAnchor="middle" fill={NOIR}>capteur</text>
      <text x="212" y="30" fontSize="14" fontWeight="800" fill={ORANGE}>impose N</text>
      <text x="212" y="48" fontSize="14" fontWeight="800" fill={BLEU}>mesure C</text>
      {/* axe et cône */}
      <rect x="144" y="56" width="12" height="48" fill="#94a3b8" stroke="#475569" />
      <rect x="86" y="140" width="128" height="18" fill="#fde68a" />
      <polygon points="86,140 150,158 214,140 214,104 86,104" fill="#64748b" stroke="#334155" strokeWidth="1.6" strokeLinejoin="round" />
      <text x="150" y="128" fontSize="14" fontWeight="700" textAnchor="middle" fill="#fff">cône mobile</text>
      {/* plaque fixe */}
      <rect x="66" y="158" width="168" height="16" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1.6" />
      <text x="150" y="192" fontSize="14" textAnchor="middle" fill={NOIR}>plaque fixe</text>
      {/* rotation : arc + pointe pleine alignée sur la tangente de l'arc */}
      <path d="M118 84 Q150 62 178 80" fill="none" stroke={ORANGE} strokeWidth={ep} strokeLinecap="round" />
      {(() => {
        const tx = 28 / Math.hypot(28, 18), ty = 18 / Math.hypot(28, 18), k = Math.max(1, ep / 3.2);
        const bx = 178 + (ep / 2 + 2) * tx, by = 80 + (ep / 2 + 2) * ty; // pointe, juste après la fin de l'arc
        const cx = bx - 13 * k * tx, cy = by - 13 * k * ty, nx = -ty, ny = tx, w = 6.5 * k;
        return <polygon points={`${bx.toFixed(1)},${by.toFixed(1)} ${(cx + w * nx).toFixed(1)},${(cy + w * ny).toFixed(1)} ${(cx - w * nx).toFixed(1)},${(cy - w * ny).toFixed(1)}`} fill={ORANGE} />;
      })()}
      <text x="106" y="80" fontSize="15" fontWeight="800" fill={ORANGE}>N</text>
      {/* légende échantillon */}
      <rect x="40" y="206" width="14" height="14" fill="#fde68a" stroke="#475569" />
      <text x="62" y="218" fontSize="14" fill={NOIR}>échantillon : couche mince cisaillée</text>
    </Svg>
  );
}

// Mini-courbe d'écoulement τ(γ̇) dans un cadre (x, y, w, h) du viewBox ; type = forme du comportement.
function MiniEcoulement({ x, y, w, h, f, c = BLEU, reference = false, tirets = false, autres = [] }) {
  const N = 30;
  const pts = (g) => Array.from({ length: N + 1 }, (_, i) => { const u = i / N; return `${(x + u * w).toFixed(1)},${(y + h - g(u) * h).toFixed(1)}`; }).join(" ");
  return (
    <g>
      <polyline points={`${x},${y} ${x},${y + h} ${x + w},${y + h}`} fill="none" stroke={NOIR} strokeWidth="1.6" />
      {reference && <polyline points={pts((u) => 0.9 * u)} fill="none" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 3" />}
      {autres.map((a, i) => <polyline key={i} points={pts(a.f)} fill="none" stroke={a.c} strokeWidth="2.6" strokeDasharray={a.tirets ? "5 4" : undefined} />)}
      {f && <polyline points={pts(f)} fill="none" stroke={c} strokeWidth="2.8" strokeDasharray={tirets ? "5 4" : undefined} />}
    </g>
  );
}

// Carte : newtonien, pseudoplastique, rhéoépaississant (trois lignes : mini-courbe + nom + effet sur η).
export function FTroisComportements() {
  const ligne = (y, f, c, nom, effet) => (
    <g>
      <MiniEcoulement x={14} y={y} w={84} h={54} f={f} c={c} reference={nom !== "Newtonien"} />
      <text x="112" y={y + 20} fontSize="15" fontWeight="800" fill={c}>{nom}</text>
      <text x="112" y={y + 42} fontSize="13.5" fill={NOIR}>{effet}</text>
    </g>
  );
  return (
    <Svg aria="Trois courbes d'écoulement : droite pour un fluide newtonien, courbe qui s'incurve vers le bas pour un pseudoplastique, vers le haut pour un rhéoépaississant" vb="0 0 300 232" maxWidth={320}>
      <text x="14" y="16" fontSize="13.5" fill={KIT.txt2}>τ en fonction de γ̇ (tirets : droite de référence)</text>
      {ligne(26, (u) => 0.9 * u, "#1d4ed8", "Newtonien", "η constante")}
      {ligne(96, (u) => Math.pow(u, 0.5) * 0.95, "#ea580c", "Pseudoplastique", "η diminue quand γ̇ augmente")}
      {ligne(166, (u) => Math.pow(u, 1.8) * 0.95, "#15803d", "Rhéoépaississant", "η augmente quand γ̇ augmente")}
    </Svg>
  );
}

// Carte : seuil d'écoulement. Plastique idéal (droite décalée), plastique non idéal (courbe décalée), newtonien (référence).
export function FSeuil() {
  return (
    <Svg aria="Courbes d'écoulement avec seuil : droite ne passant pas par l'origine pour un plastique idéal, courbe incurvée pour un plastique non idéal ; ordonnée à l'origine notée τ0" vb="0 0 300 218" maxWidth={320}>
      <MiniEcoulement x={46} y={20} w={150} h={150}
        autres={[
          { f: (u) => 0.3 + 0.6 * u, c: "#7c3aed" },
          { f: (u) => 0.3 + 0.6 * Math.pow(u, 0.5), c: "#dc2626" },
          { f: (u) => 0.9 * u, c: GRIS, tirets: true },
        ]} />
      <line x1="40" y1="125" x2="52" y2="125" stroke={NOIR} strokeWidth="1.6" />
      <text x="6" y="130" fontSize="15" fontWeight="800" fill={NOIR}>τ₀</text>
      <text x="46" y="192" fontSize="13.5" fill={NOIR}>γ̇ →</text>
      <text x="14" y="16" fontSize="13.5" fill={KIT.txt2}>τ ↑</text>
      <text x="204" y="56" fontSize="14" fontWeight="800" fill="#dc2626">plastique</text>
      <text x="204" y="73" fontSize="14" fontWeight="800" fill="#dc2626">non idéal</text>
      <text x="204" y="100" fontSize="14" fontWeight="800" fill="#7c3aed">plastique</text>
      <text x="204" y="117" fontSize="14" fontWeight="800" fill="#7c3aed">idéal</text>
      <text x="204" y="150" fontSize="14" fontWeight="800" fill={GRIS}>newtonien</text>
      <text x="14" y="212" fontSize="13.5" fill={NOIR}>sous τ₀ : le produit ne s’écoule pas</text>
    </Svg>
  );
}

// Carte : lire un seuil d'écoulement aux très bas gradients (échelle logarithmique en γ̇).
export function FSeuilBas() {
  const gx = (k) => 50 + ((k + 3) / 4) * 210; // k = log10(γ̇) de -3 à 1
  const gy = (t) => 170 - (t / 60) * 140;
  const B = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10].map((g) => [gx(Math.log10(g)), gy(13.5 + 15.4 * Math.pow(g, 0.47))]);
  const A = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10].map((g) => { const t = 18.4 * Math.pow(g, 0.47); return [gx(Math.log10(g)), gy(t / (1 + t / g / 400))]; });
  const pts = (l) => l.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  return (
    <Svg aria="Courbe d'écoulement aux très bas gradients, en échelle logarithmique : la contrainte du fluide à seuil tend vers un palier non nul, celle du fluide sans seuil tend vers zéro" vb="0 0 300 222" maxWidth={320}>
      <polyline points="50,20 50,170 262,170" fill="none" stroke={NOIR} strokeWidth="1.6" />
      <polyline points={pts(B)} fill="none" stroke="#dc2626" strokeWidth="3" />
      <polyline points={pts(A)} fill="none" stroke="#0369a1" strokeWidth="3" />
      <line x1="50" y1={gy(13.5)} x2="262" y2={gy(13.5)} stroke={GRIS} strokeWidth="1.3" strokeDasharray="5 4" />
      <text x="8" y={gy(13.5) + 5} fontSize="15" fontWeight="800" fill={NOIR}>τ₀</text>
      <text x="14" y="16" fontSize="13.5" fill={KIT.txt2}>τ ↑</text>
      <text x="150" y="192" fontSize="13.5" fill={NOIR}>γ̇ (échelle log) →</text>
      <text x="58" y="38" fontSize="14" fontWeight="800" fill="#dc2626">avec seuil : palier τ₀</text>
      <text x="58" y="58" fontSize="14" fontWeight="800" fill="#0369a1">sans seuil : τ → 0</text>
      <text x="14" y="208" fontSize="13.5" fill={NOIR}>le seuil se lit là où τ cesse de baisser</text>
    </Svg>
  );
}

// Carte : thixotropie. La boucle aller-retour est calculée par le modèle (même forme que sur les peintures).
export function FBoucle() {
  const r = rampe({ ...PRODUITS.shampooing, thixo: 0.5 }, [1, 2, 4, 10, 20, 40, 80, 150, 220, 300]);
  const gx = (g) => 46 + (g / 300) * 220;
  const gy = (t) => 170 - (t / 130) * 140;
  const pa = r.gammas.map((g, i) => `${gx(g).toFixed(1)},${gy(r.aller[i]).toFixed(1)}`).join(" ");
  const pr = r.gammas.map((g, i) => `${gx(g).toFixed(1)},${gy(r.retour[i]).toFixed(1)}`).join(" ");
  return (
    <Svg aria="Courbe d'écoulement avec boucle : la courbe retour passe sous la courbe aller, signe d'un produit thixotrope" vb="0 0 300 220" maxWidth={320}>
      <polyline points="46,20 46,170 270,170" fill="none" stroke={NOIR} strokeWidth="1.6" />
      <polyline points={pa} fill="none" stroke="#1d4ed8" strokeWidth="3" />
      <polyline points={pr} fill="none" stroke="#ea580c" strokeWidth="3" strokeDasharray="6 4" />
      <text x="14" y="16" fontSize="13.5" fill={KIT.txt2}>τ ↑</text>
      <text x="236" y="192" fontSize="13.5" fill={NOIR}>γ̇ →</text>
      <text x="58" y="44" fontSize="14.5" fontWeight="800" fill="#1d4ed8">aller : on monte γ̇</text>
      <text x="58" y="64" fontSize="14.5" fontWeight="800" fill="#ea580c">retour : on redescend</text>
      <text x="58" y="200" fontSize="13.5" fill={NOIR}>retour sous aller : structure détruite</text>
      <text x="58" y="215" fontSize="13.5" fill={NOIR}>pas encore reconstruite</text>
    </Svg>
  );
}
