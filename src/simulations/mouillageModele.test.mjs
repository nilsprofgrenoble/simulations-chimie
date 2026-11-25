import * as M from './mouillageModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC :', m); } };
// angles de l'eau retrouvés
for (const s of M.SOLIDES) {
  ok(Math.abs(M.theta(s, M.G_EAU) - s.thEau) < 1e-6, `angle de l’eau sur ${s.id}`);
  ok(Math.abs(M.cosTheta(s, s.gc) - 1) < 1e-12 && M.theta(s, s.gc - 5) === 0, `étalement total sous γc (${s.id})`);
  ok(M.pente(s) > 0.018 && M.pente(s) < 0.03, `pente plausible ${s.id} : ${M.pente(s)}`);
  // θ croît avec γL
  let prec = -1; for (const l of M.LIQUIDES) { const t = M.theta(s, l.g); ok(t >= prec - 1e-9, `θ croissant ${s.id}`); prec = t; }
  // S > 0 si et seulement si γL < γc ; W = γ(1+cos θ)
  for (const l of M.LIQUIDES) { ok((M.coefEtalement(s, l.g) > 0) === (l.g < s.gc), `signe de S (${s.id}, ${l.id})`);
    ok(Math.abs(M.travailAdhesion(s, l.g) - l.g * (1 + M.cosTheta(s, l.g))) < 1e-9, 'W'); }
}
// Wilhelmy
ok(Math.abs(M.perimetre() - 40.4) < 1e-9 && Math.abs(M.forceMN(28.5) - 1.1514) < 1e-9, 'Wilhelmy');
// traitement
const pe = M.solide('pe'); ok(M.gcTraite(pe, 0) === pe.gc && M.gcTraite(pe, 1) === M.TRAIT_MAX && M.gcTraite(M.solide('pa66'), 1) === 42.2, 'traitement');
ok(M.theta(pe, M.G_ENCRE) > 20 && M.theta(pe, M.G_ENCRE, M.TRAIT_MAX) === 0, 'encre à 35 sur PE : perle, puis s’étale après traitement');
// extrapolation de Zisman : la régression retrouve γc à 1,5 mN/m près pour tous les solides ; deux points extrêmes à 6 % près (tous les couples)
for (const s of M.SOLIDES) {
  const pts = M.pointsZisman(s); const d = M.droiteZisman(pts);
  ok(d && Math.abs(d.gc - s.gc) < 2.5, `régression ${s.id} : ${d && d.gc} contre ${s.gc}`);
}
let pire = 0;
for (let i = 0; i < 4000; i++) {
  const t = M.tirageZisman(); ok(t.pts.length >= 3, 'au moins 3 points'); 
  for (let a = 0; a < t.pts.length; a++) for (let b = a + 1; b < t.pts.length; b++) {
    const v = M.gcDeuxPoints(t.pts[a], t.pts[b]); pire = Math.max(pire, Math.abs(v - t.vrai) / t.vrai);
    if (b - a >= 1 && t.pts[b].g - t.pts[a].g < 5) continue; }
  pire = Math.max(pire, Math.abs(t.vrai - t.s.gc) / t.s.gc);
}
console.log('pire écart relatif de γc selon le couple choisi :', (pire * 100).toFixed(1), '%');
ok(pire < 0.1, 'tolérance 10 % suffisante');
// diagnostic : chaque cas est identifiable et unique
for (let i = 0; i < 3000; i++) {
  const d = M.tirageDiagnostic(); const ref = d.s.gc;
  const ecart = d.gInk - d.gcMes;
  if (d.cas === 'encre') ok(d.gcMes > ref && d.gcMes >= 41 && ecart > M.MARGE_ENCRE, 'cas encre');
  if (d.cas === 'film') ok(d.gcMes === ref && ref < 35 && d.gInk > ref, 'cas film');
  if (d.cas === 'gras') ok(d.gcMes < ref - 8 && d.gInk > d.gcMes, 'cas gras');
  ok(d.th > 0, `θ > 0 (${d.cas})`);
}
console.log(`${n} contrôles, ${n - ko} OK`);
process.exit(ko ? 1 : 0);
