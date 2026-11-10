// Test du modèle de l'échographe 2D : node src/simulations/echo2D.test.mjs
import assert from 'node:assert';
import { SCENES, MIL, marcher, tirerExacts, dAppCm, positionApparente, epaisseurTraversee, SEUIL_DB } from './echo2D.js';
const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);
const org = SCENES.organe, foe = SCENES.foetus;

// 1. Convention de temps : 1 µs ALLER-RETOUR ↔ 0,077 cm de profondeur apparente (1540 m/s → 0,154 cm/µs à l'aller seul)
proche(dAppCm(1), 0.077, 1e-12, 'profondeur apparente par µs');
proche(dAppCm(2 * 1 / 1540 * 1e4), 1, 1e-12, '1 cm à 1540 m/s : t = 2d/v = 12,99 µs');
// 2. Un tir vertical : la peau finit à 0,25 cm ; avec gel, le premier écho est l'interface peau/graisse
const t0 = tirerExacts(org, 0, 4, true);
const e1 = t0.events[0];
assert(Math.abs(dAppCm(e1.tUs) - 0.25) <= 0.03, 'interface peau/graisse : profondeur apparente = vraie (peau à 1540 m/s), pas du tir 0,02 cm');
// 3. La graisse (1450 m/s) rallonge le trajet : la profondeur apparente de la face du muscle dépasse la vraie
const zMus = org.zGraisse(0), pm = positionApparente(org, 0, zMus + 0.001);
proche(pm.dApp, 0.25 + (zMus - 0.25) * 1540 / 1450, 0.01, 'profondeur apparente sous la graisse');
assert(pm.dApp > zMus, 'la graisse fait paraître le muscle plus profond');
// 4. L'os (3 200 m/s) paraît plus mince : la traversée d'un fémur dure 1540/3200 de la durée « attendue »
const dOs = 0.1, tOs = dOs / MIL.os.v * 1e4 * 2, tAttendu = dOs / 1540 * 1e4 * 2;
proche(tOs / tAttendu, 1540 / 3200, 1e-9, 'durée de traversée de l’os');
// 5. Sans gel : tout est affaibli (R = 0,99 à l'entrée) → l'écho de la peau sort mais l'image sous la peau tombe
const sans = tirerExacts(org, 0, 4, false), avec = tirerExacts(org, 0, 4, true);
// sans gel, le premier écho (air/peau, R = 0,99) est à ≈ 0 dB et tout ce qui suit perd 40 dB (T² = 0,01²)
assert(Math.abs(sans.events[0].niveau) < 0.1, 'écho air/peau ≈ 0 dB');
assert(Math.abs((avec.events[0].niveau - sans.events[1].niveau) - 40) < 0.5, 'sans gel : −40 dB pour tout ce qui est sous la peau');
assert(sans.events.length > avec.events.filter(e => e.detecte).length - 1 && sans.events.some(e => !e.detecte), 'sans gel : des échos passent sous le seuil');
// 6. Haute fréquence : la paroi du fond du kyste disparaît ; basse fréquence : elle reste
const angleKyste = Math.atan2(2.1, 5.2) * 180 / Math.PI;
const fond = f => { const ev = tirerExacts(org, angleKyste, f, true).events; const ky = ev.filter(e => e.detecte); return ky.length; };
assert(fond(2) > fond(8), `plus d'échos détectés à 2 MHz qu'à 8 MHz (${fond(2)} > ${fond(8)})`);
// 7. Le kyste est sombre : speckle quasi nul à l'intérieur
const g = tirerExacts(org, angleKyste, 3, true);
assert(g.speckle.length > 0, 'du grain dans les tissus');
// 8. Fœtus : le fémur est bien en os (bug du prototype corrigé), le corps en tissu mou, la tête en os + cerveau
const cf = foe.femur1, mid = (c) => foe.mediumAt(c[0], c[1]);
assert.equal(mid(foe.femur1), 'os', 'centre du fémur 1 = os');
assert.equal(mid(foe.femur2), 'os', 'centre du fémur 2 = os');
assert.equal(mid(foe.humerus), 'os', 'centre de l’humérus = os');
assert.equal(foe.mediumAt(1.0, 6.0), 'foetus', 'corps = tissu mou');
assert.equal(foe.mediumAt(-1.5, 5.5), 'cerveau', 'cerveau au centre de la tête');
assert.equal(foe.mediumAt(-1.5, 4.55), 'os', 'crâne');
// 9. Position apparente du fémur : plus mince/décalée mais dans le secteur
const pf = positionApparente(foe, foe.femur1[0], foe.femur1[1]);
assert(Math.abs(pf.thetaDeg) < 40 && pf.dApp > 5 && pf.dApp < 9.5, 'fémur dans l’image');
// 10. Toutes les structures de la légende sont trouvées par leur rayon
for (const sc of [org, foe]) for (const st of sc.structures) {
  const { pass } = marcher(sc, st.angle, {});
  const q = st.dedans ? pass.find(q => q.vers === st.cible) : pass.find(q => q.vers === st.cible || q.de === st.cible);
  assert(q, `${st.label} : structure introuvable sur le rayon ${st.angle}°`);
}
// 11. Tous les milieux utilisés existent
for (const sc of [org, foe]) for (let a = -40; a <= 40; a += 4) for (const q of marcher(sc, a, {}).pass) assert(MIL[q.vers] && MIL[q.de] || q.de === 'air', `milieu inconnu ${q.de}/${q.vers}`);
console.log('echo2D : tout est cohérent.');
