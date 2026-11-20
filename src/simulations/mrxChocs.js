// ====================================================
//  SIM 186 — SCÈNE DES CHOCS (qualitative) : des entités A et B s'agitent dans une boîte plane. Quand une entité A rencontre une entité B, c'est un
//  « choc ». Un choc est EFFICACE si deux conditions sont réunies : énergie relative suffisante (au moins E*) ET orientation favorable (tirée au hasard,
//  une fois sur deux). Les réactifs ne sont pas consommés pendant l'observation : les concentrations restent constantes.
//  Modèle volontairement simple (disques durs en deux dimensions, chocs élastiques) : les nombres sont des ordres de grandeur QUALITATIFS du modèle,
//  pas des valeurs réelles. La température est une grandeur relative du modèle (basse, moyenne, élevée).
// ====================================================
export const BOITE = { L: 150, H: 90, R: 4.2 };            // unités arbitraires du modèle
export const NB_A = 10;                                    // nombre d'entités A (fixe)
export const NIV_CONC = [{ id: 'faible', nom: 'faible', nB: 4 }, { id: 'moyenne', nom: 'moyenne', nB: 10 }, { id: 'elevee', nom: 'élevée', nB: 20 }];
export const NIV_TEMP = [{ id: 'basse', nom: 'basse', kT: 1 }, { id: 'moyenne', nom: 'moyenne', kT: 1.5 }, { id: 'elevee', nom: 'élevée', kT: 2.2 }];
export const SEUIL = 3;                                    // énergie d'activation du modèle, en unités de kT de la température basse
export const P_ORIENTATION = 0.5;
const VIT = 18;                                            // vitesse typique à kT = 1 (unités du modèle par seconde)

export function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// graines choisies (indice [concentration][température]) pour que la boîte affichée soit représentative des moyennes du modèle
export const GRAINES = [[18, 11, 40], [49, 45, 59], [48, 15, 31]];

export function creerBoite({ nB = 10, kT = 1.5, graine = 1 } = {}) {
  const r = mulberry(graine), P = [], sigma = VIT * Math.sqrt(kT);
  const place = type => {
    for (let essai = 0; essai < 500; essai++) {
      const x = BOITE.R + r() * (BOITE.L - 2 * BOITE.R), y = BOITE.R + r() * (BOITE.H - 2 * BOITE.R);
      if (P.every(p => Math.hypot(p.x - x, p.y - y) > 2.4 * BOITE.R)) { P.push({ type, x, y, vx: gauss(r) * sigma, vy: gauss(r) * sigma }); return; }
    }
    P.push({ type, x: BOITE.R + r() * (BOITE.L - 2 * BOITE.R), y: BOITE.R + r() * (BOITE.H - 2 * BOITE.R), vx: gauss(r) * sigma, vy: gauss(r) * sigma });
  };
  for (let i = 0; i < NB_A; i++) place('A');
  for (let i = 0; i < nB; i++) place('B');
  return { P, r, kT, t: 0, chocs: 0, efficaces: 0, evenements: [], contact: new Set() };
}

// Un pas de temps dt (≤ 0,02 s) : mouvement, rebonds sur les parois, chocs entre disques. Renvoie les événements A–B du pas.
export function pas(b, dt) {
  const { L, H, R } = BOITE, ev = [];
  b.t += dt;
  for (const p of b.P) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx); } if (p.x > L - R) { p.x = L - R; p.vx = -Math.abs(p.vx); }
    if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy); } if (p.y > H - R) { p.y = H - R; p.vy = -Math.abs(p.vy); }
  }
  const n = b.P.length, actifs = new Set();
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const p = b.P[i], q = b.P[j], dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
    if (d2 >= 4 * R * R) continue;
    const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d, vrel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
    const cle = i * 1000 + j; actifs.add(cle);
    const rec = (2 * R - d) / 2; p.x -= nx * rec; p.y -= ny * rec; q.x += nx * rec; q.y += ny * rec;   // séparer les disques
    if (vrel > 0) {   // ils se rapprochent : choc élastique de deux masses égales
      if (p.type !== q.type && !b.contact.has(cle)) {
        // énergie cinétique relative (masse réduite 1/2) : ½ µ v_rel² avec µ = m/2 ; en unités où kT vaut (VIT² · kT) pour une composante
        const E = 0.25 * ((p.vx - q.vx) ** 2 + (p.vy - q.vy) ** 2) / (VIT * VIT);   // en unités de kT_basse
        const orient = b.r() < P_ORIENTATION, eff = E >= SEUIL && orient;
        b.chocs++; if (eff) b.efficaces++;
        ev.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, eff, E, orient });
      }
      p.vx -= vrel * nx; p.vy -= vrel * ny; q.vx += vrel * nx; q.vy += vrel * ny;
    }
  }
  b.contact = actifs;
  return ev;
}

// Simulation hors écran, pour les tests et pour accélérer : duree en secondes du modèle
export function simuler(params, duree, graine = 1, dt = 0.01) {
  const b = creerBoite({ ...params, graine });
  for (let t = 0; t < duree; t += dt) pas(b, dt);
  return { chocs: b.chocs, efficaces: b.efficaces, duree: b.t };
}
