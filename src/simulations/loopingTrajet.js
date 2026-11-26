// Trajet animé du looping (exploration de la simulation 262).
// Le wagon est lâché sans vitesse en haut d'une pente à 45° (altitude H), entre dans un looping de rayon R, puis repart sur un plat.
// On intègre le mouvement le long de la piste : v' = −g dz/ds − (f/m)·signe(v). La piste exerce une force normale N = m (v²/R + g cosθ) dans le looping :
// si N devient négatif, le wagon décolle de la piste et suit une trajectoire parabolique (vol libre) jusqu'à toucher de nouveau la piste.
export const G = 9.8;
export const FPS = 120;
const SUB = 16;                         // sous-pas d'intégration par image
const DT = 1 / (FPS * SUB);
const S2 = Math.SQRT2;
export const longueurPente = H => H * S2;
export const sortie = R => 1.5 * R + 3;  // longueur du plat de sortie (m)
export const plat = R => R + 0.5;        // longueur du plat d'entrée, avant le looping (m)

export function pos(s, H, R) {
  const Ls = longueurPente(H), Lf = plat(R), Lb = 2 * Math.PI * R;
  if (s < Ls) return { x: -Lf - H + s / S2, z: H - s / S2, ang: -Math.PI / 4, zone: 'pente', dz: -1 / S2 };
  if (s < Ls + Lf) return { x: -Lf + (s - Ls), z: 0, ang: 0, zone: 'plat', dz: 0 };
  if (s < Ls + Lf + Lb) { const th = (s - Ls - Lf) / R; return { x: R * Math.sin(th), z: R * (1 - Math.cos(th)), ang: th, zone: 'loop', th, dz: Math.sin(th) }; }
  return { x: s - Ls - Lf - Lb, z: 0, ang: 0, zone: 'sortie', dz: 0 };
}

export function trajet({ m, H, R, f }) {
  const Ls = longueurPente(H), Lb = 2 * Math.PI * R, sFin = Ls + plat(R) + Lb + sortie(R), E0 = m * G * H, k = f / m;
  const frames = [];
  const res = { E0, issue: 'passe', vTop: NaN, thetaDecroche: NaN, tFin: 0, hauteurMax: 0 };
  let s = 0, v = 0, t = 0, vol = null, topVu = false;
  const push = () => {
    let x, z, ang, ph, N = NaN, vx, vz;
    if (vol) { x = vol.x; z = vol.z; vx = vol.vx; vz = vol.vz; ang = Math.atan2(vz, vx); ph = 'vol'; }
    else { const p = pos(s, H, R); x = p.x; z = p.z; ang = p.ang; ph = p.zone; vx = v * Math.cos(ang); vz = v * Math.sin(ang); if (p.zone === 'loop') N = m * (v * v / R + G * Math.cos(p.th)); }
    const vv = vol ? Math.hypot(vol.vx, vol.vz) : v, Ec = 0.5 * m * vv * vv, Epp = m * G * z;
    frames.push({ t, x, z, ang, v: vv, vx, vz, Ec, Epp, Em: Ec + Epp, ph, N, s });
  };
  push();
  for (let i = 0; i < 25 * FPS; i++) {
    for (let j = 0; j < SUB; j++) {
      if (vol) {                                              // vol libre dans le looping
        vol.vz -= G * DT; vol.x += vol.vx * DT; vol.z += vol.vz * DT; t += DT;
        if (Math.hypot(vol.x, vol.z - R) >= R) { res.issue = 'decroche'; break; }
        continue;
      }
      const p = pos(s, H, R);
      let a = -G * p.dz;
      if (Math.abs(v) < 1e-9) { if (Math.abs(a) <= k) { res.issue = 'bloque'; break; } a -= Math.sign(a) * k; } else a -= Math.sign(v) * k;
      v += a * DT; s += v * DT; t += DT;
      if (s >= sFin) { res.issue = 'passe'; s = sFin; break; }
      if (s <= 0 && v < 0) { res.issue = 'recule'; s = 0; v = 0; break; }
      const q = pos(s, H, R);
      if (q.zone === 'loop') {
        if (!topVu && q.th >= Math.PI) { topVu = true; res.vTop = v; }
        if (v > 0 && v * v / R + G * Math.cos(q.th) < 0) { res.thetaDecroche = q.th; vol = { x: q.x, z: q.z, vx: v * Math.cos(q.th), vz: v * Math.sin(q.th) }; }
      }
    }
    push();
    if (res.issue !== 'passe' || s >= sFin) { if (res.issue !== 'passe' || s >= sFin) break; }
  }
  if (res.issue === 'passe' && s < sFin) res.issue = 'passe';
  res.hauteurMax = Math.max(...frames.map(q => q.z));
  res.frames = frames; res.tFin = frames[frames.length - 1].t;
  return res;
}
export const imageA = (tr, t) => tr.frames[Math.max(0, Math.min(tr.frames.length - 1, Math.round(t * FPS)))];
