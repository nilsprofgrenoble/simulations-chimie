import assert from 'node:assert/strict';
import * as M from './filtreModele.js';
const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);
// fréquence de coupure du TP : 220 Ω, 1 µF → 723 Hz ; 1 kΩ, 1 µF → 159 Hz
close(M.fcRC(220, 1), 723.4, 0.1); close(M.fcRC(1000, 1), 159.15, 0.01);
// à fc : A = 1/√2 pour les deux natures
for (const n of ['bas', 'haut']) close(M.gain(n, 723, 723), M.SEUIL);
close(M.gainDB(M.gain('bas', 723.4, 723.4)), -3.0103, 1e-3);
// passe-bas : mesures du TP (220 Ω, 1 µF) : 1,00 ; 0,98 ; 0,63 ; 0,11 ; 0,01 à 10 Hz, 100 Hz, 1 kHz, 10 kHz, 100 kHz (valeurs théoriques)
const fc = M.fcRC(220, 1);
const att = M.FREQS_TP.map(f => M.gain('bas', f, fc));
close(att[0], 1, 0.001); close(att[1], 0.99, 0.01); close(att[2], 0.58, 0.01); close(att[3], 0.072, 0.002); close(att[4], 0.0072, 0.0005);
// passe-haut : A croît avec f, tend vers 1
const h = M.FREQS_TP.map(f => M.gain('haut', f, fc));
for (let i = 1; i < h.length; i++) assert.ok(h[i] > h[i - 1]); assert.ok(h[0] < 0.02 && h[4] > 0.999);
// A est toujours ≤ 1 (filtre passif) et monotone
for (const n of ['bas', 'haut']) for (let f = 10; f <= 1e5; f *= 1.3) { const A = M.gain(n, f, 500); assert.ok(A > 0 && A <= 1); }
// complémentarité : A_bas² + A_haut² = 1
for (const f of [10, 300, 723, 5000]) close(M.gain('bas', f, 723) ** 2 + M.gain('haut', f, 723) ** 2, 1);
// réciproque
for (const n of ['bas', 'haut']) for (const a of [0.1, 0.5, 0.707, 0.9]) close(M.gain(n, M.freqPourGain(n, a, 800), 800), a, 1e-9);
assert.equal(M.freqPourGain('bas', 1.2, 800), null);
// déphasage
close(M.dephasage('bas', 723, 723), -Math.PI / 4); close(M.dephasage('haut', 723, 723), Math.PI / 4);
// axe logarithmique
close(M.posLog(10, 0, 100), 0); close(M.posLog(1e5, 0, 100), 100); close(M.posLog(1000, 0, 100), 50); close(M.freqDepuisPos(50, 0, 100), 1000, 1e-6);
assert.equal(M.arrondiF(723.37), 720); assert.equal(M.arrondiF(1234), 1200);
// base de temps : période entre 2 et 5 divisions
for (let f = 10; f <= 1e5; f *= 1.07) { const n = 1 / f / M.baseTemps(f); assert.ok(n >= 1.9 && n <= 5.1, `période ${n} div à ${f} Hz`); }
assert.equal(M.baseTemps(1000), 2e-4); assert.equal(M.tdivTxt(2e-4), `200${M.NB}µs/div`); assert.equal(M.tdivTxt(5e-3), `5${M.NB}ms/div`);
// textes
assert.equal(M.fTxt(723), `723${M.NB}Hz`); assert.equal(M.fTxt(1000), `1${M.NB}kHz`); assert.equal(M.fTxt(1500), `1,5${M.NB}kHz`); assert.equal(M.fTxt(1e5), `100${M.NB}kHz`); assert.equal(M.fTxt(15.9), `16${M.NB}Hz`);
assert.equal(M.RTxt(220), `220${M.NB}Ω`); assert.equal(M.RTxt(1000), `1${M.NB}kΩ`); assert.equal(M.RTxt(2200), `2,2${M.NB}kΩ`); assert.equal(M.CTxt(1), `1${M.NB}µF`); assert.equal(M.CTxt(0.22), `0,22${M.NB}µF`); assert.equal(M.CTxt(0.1), `0,1${M.NB}µF`);
// défis : 400 tirages
for (let i = 0; i < 400; i++) {
  const b = M.tirageDefiBoite(); assert.ok(b.fc >= 150 && b.fc <= 8000);
  // un élève qui lit fc avec A = 0,70 à ±0,02 doit réussir (tolérance 12 %)
  for (const dA of [-0.02, 0.02]) { const A = M.SEUIL + dA, f = M.freqPourGain(b.nature, A, b.fc); assert.ok(M.diagBoite(b, b.nature, f).ok, `lecture A=${A} fc=${b.fc} f=${f}`); }
  assert.ok(M.diagBoite(b, b.nature, b.fc).ok); assert.ok(!M.diagBoite(b, b.nature === 'bas' ? 'haut' : 'bas', b.fc).ok);
  assert.ok(!M.diagBoite(b, b.nature, b.fc * 1.4).ok); assert.ok(!M.diagBoite(b, b.nature, b.fc / 1.4).ok);
  const p = M.tirageDefiPrevoir(); assert.ok(p.A >= 0.25 && p.A <= 0.95);
  // lecture de A à ±0,02 : accepté
  for (const dA of [-0.02, 0.02]) assert.ok(M.diagPrevoir(p, (p.A + dA) * p.ue).ok, `prévoir A=${p.A} ue=${p.ue}`);
  assert.ok(M.diagPrevoir(p, p.vrai).ok); assert.ok(!M.diagPrevoir(p, p.ue * 1.3).ok);
}
// messages
const b0 = { nature: 'bas', fc: 723, R: 220, C: 1 };
assert.match(M.diagBoite(b0, 'bas', M.freqPourGain('bas', 0.5, 723)).msg, /0,5/);
assert.match(M.diagBoite(b0, 'bas', 200).msg, /trop petite/); assert.match(M.diagBoite(b0, 'bas', 2500).msg, /trop grande/);
assert.match(M.diagBoite(b0, 'haut', 723).msg, /nature/); assert.match(M.diagBoite(b0, 'bas', NaN).msg, /nombre/); assert.match(M.diagBoite(b0, null, 5).msg, /nature/);
console.log('filtreModele OK');
