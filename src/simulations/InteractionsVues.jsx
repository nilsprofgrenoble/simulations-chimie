import { additif, effetA, ROUGE, moyenneRouge, nf, SCEN, modele } from "./interactionsModele";

// Schémas de la mini-simulation « Pourquoi un plan d'expériences ? » : barres, droites d'interaction, rouge à lèvres, cartes « À retenir ».
// Tous les textes font au moins 13 dans un viewBox de 380 de large (lisibles à 390 px).
const svgStyle = { width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto 6px' };
const halo = { stroke: '#f8fafc', strokeWidth: 3.5, paintOrder: 'stroke' };
const C = { base: '#94a3b8', A: '#b45309', B: '#0f766e', AB: '#0369a1', rouge: '#dc2626', txt: '#0f172a', gris: '#334155' };

// Quatre barres : sans A ni B, A seul, B seul, A et B ensemble. prevu : trait rouge « si les effets s'additionnaient » sur la 4e barre.
export function BarresVue({ s, prevu = false, cacherAB = false }) {
  const pv = additif(s), vmax = Math.max(s.base, s.A, s.B, s.AB, pv) * 1.12, k = 150 / vmax, y0 = 208;
  const vals = [s.base, s.A, s.B, s.AB], cols = [C.base, C.A, C.B, C.AB];
  return (
    <svg viewBox="0 0 380 262" role="img" style={svgStyle}
      aria-label={`Réponse (${s.unite}) : ${s.etiq.map((e, i) => `${e.join(' ')} ${i === 3 && cacherAB ? 'à mesurer' : nf(vals[i], s.dec)}`).join(' ; ')}${prevu ? ` ; prévu si les effets s’additionnent : ${nf(pv, s.dec)}` : ''}`}>
      <text x="8" y="18" fontSize="13.5" fill={C.gris}>réponse ({s.unite})</text>
      <line x1="10" y1={y0} x2="372" y2={y0} stroke={C.gris} strokeWidth="2"/>
      {vals.map((v, i) => {
        const x = 20 + i * 90, h = v * k, cache = i === 3 && cacherAB, dedans = i === 3 && prevu && h >= 28;
        return (
          <g key={i}>
            {cache
              ? <><rect x={x} y={y0 - 70} width="64" height="70" fill="none" stroke={C.AB} strokeWidth="2" strokeDasharray="5 4" rx="3"/><text x={x + 32} y={y0 - 30} textAnchor="middle" fontSize="22" fontWeight="800" fill={C.AB}>?</text></>
              : <><rect x={x} y={y0 - h} width="64" height={Math.max(h, 1.5)} fill={cols[i]} fillOpacity="0.88" stroke={cols[i]} strokeWidth="2" rx="2"/>
                <text x={x + 32} y={dedans ? y0 - h + 18 : y0 - h - 6} textAnchor="middle" fontSize="15" fontWeight="800" fill={dedans ? '#fff' : C.txt}>{nf(v, s.dec)}</text></>}
            <text x={x + 32} y={y0 + 18} textAnchor="middle" fontSize="13.5" fill={C.gris}>{s.etiq[i][0]}</text>
            <text x={x + 32} y={y0 + 35} textAnchor="middle" fontSize="13.5" fill={C.gris}>{s.etiq[i][1]}</text>
          </g>);
      })}
      {prevu && <g>
        <line x1="288" y1={y0 - pv * k} x2="364" y2={y0 - pv * k} stroke={C.rouge} strokeWidth="3" strokeDasharray="6 4"/>
        <text x="326" y={y0 - pv * k - 7} textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.rouge} {...halo}>prévu {nf(pv, s.dec)}</text>
      </g>}
    </svg>);
}

// Droites d'interaction : réponse selon la présence de A, une droite par présence de B. prevu : droite « sans interaction » en pointillés.
export function LignesVue({ s, prevu = false }) {
  const pv = additif(s), vmax = Math.max(s.base, s.A, s.B, s.AB, pv) * 1.12, k = 150 / vmax, yb = 206;
  const X = [96, 280], Y = v => yb - v * k;
  return (
    <svg viewBox="0 0 380 270" role="img" style={svgStyle}
      aria-label={`Réponse selon la présence de ${s.cA}, une droite sans ${s.cB} (de ${nf(s.base, s.dec)} à ${nf(s.A, s.dec)}) et une droite avec ${s.cB} (de ${nf(s.B, s.dec)} à ${nf(s.AB, s.dec)})${prevu ? ` ; droite parallèle prévue sans interaction : de ${nf(s.B, s.dec)} à ${nf(s.B + effetA(s), s.dec)}` : ''}`}>
      <text x="8" y="18" fontSize="13.5" fill={C.gris}>réponse ({s.unite})</text>
      <line x1="50" y1={yb} x2="340" y2={yb} stroke={C.gris} strokeWidth="2"/><line x1="50" y1="26" x2="50" y2={yb} stroke={C.gris} strokeWidth="2"/>
      {prevu && <line x1={X[0]} y1={Y(s.B)} x2={X[1]} y2={Y(s.B + effetA(s))} stroke={C.rouge} strokeWidth="3" strokeDasharray="6 4"/>}
      <line x1={X[0]} y1={Y(s.base)} x2={X[1]} y2={Y(s.A)} stroke={C.AB} strokeWidth="3.5"/>
      <line x1={X[0]} y1={Y(s.B)} x2={X[1]} y2={Y(s.AB)} stroke={C.A} strokeWidth="3.5"/>
      {[[0, s.base, C.AB, 1], [1, s.A, C.AB, 1], [0, s.B, C.A, 1], [1, s.AB, C.A, 1]].map(([i, v, c], q) => (
        <g key={q}><circle cx={X[i]} cy={Y(v)} r="6" fill={c} stroke="#fff" strokeWidth="1.5"/>
          <text x={X[i] + (i ? 12 : -12)} y={Y(v) + 5} textAnchor={i ? 'start' : 'end'} fontSize="14" fontWeight="800" fill={C.txt} {...halo}>{nf(v, s.dec)}</text></g>))}
      {prevu && <text x={X[1] - 6} y={Y(s.B + effetA(s)) + (s.AB < s.B + effetA(s) ? -8 : 20)} textAnchor="end" fontSize="13.5" fontWeight="800" fill={C.rouge} {...halo}>prévu {nf(s.B + effetA(s), s.dec)}</text>}
      <text x={X[0]} y={yb + 20} textAnchor="middle" fontSize="13.5" fill={C.gris}>sans {s.cA}</text>
      <text x={X[1]} y={yb + 20} textAnchor="middle" fontSize="13.5" fill={C.gris}>avec {s.cA}</text>
      <rect x="40" y="244" width="22" height="4" fill={C.AB}/><text x="68" y="250" fontSize="13.5" fontWeight="700" fill={C.AB}>sans {s.cB}</text>
      <rect x="170" y="244" width="22" height="4" fill={C.A}/><text x="198" y="250" fontSize="13.5" fontWeight="700" fill={C.A}>avec {s.cB}</text>
      {prevu && <><rect x="290" y="244" width="22" height="4" fill={C.rouge}/><text x="316" y="250" fontSize="13.5" fontWeight="700" fill={C.rouge}>prévu</text></>}
    </svg>);
}

// Rouge à lèvres : deux corps purs et leur mélange à parts égales, comparé à la moyenne des deux purs
export function MelangeVue({ montrerMoyenne = true, cacherMelange = false }) {
  const r = ROUGE, moy = moyenneRouge(r), k = 150 / 9, y0 = 208;
  const bar = (x, v, c, l1, l2, cache) => (
    <g>
      {cache ? <><rect x={x} y={y0 - 70} width="64" height="70" fill="none" stroke={c} strokeWidth="2" strokeDasharray="5 4" rx="3"/><text x={x + 32} y={y0 - 30} textAnchor="middle" fontSize="22" fontWeight="800" fill={c}>?</text></>
        : <><rect x={x} y={y0 - v * k} width="64" height={v * k} fill={c} fillOpacity="0.88" stroke={c} strokeWidth="2" rx="2"/>
          <text x={x + 32} y={y0 - v * k - 6} textAnchor="middle" fontSize="15" fontWeight="800" fill={C.txt}>{v}</text></>}
      <text x={x + 32} y={y0 + 18} textAnchor="middle" fontSize="13.5" fill={C.gris}>{l1}</text>
      <text x={x + 32} y={y0 + 35} textAnchor="middle" fontSize="13.5" fill={C.gris}>{l2}</text>
    </g>);
  return (
    <svg viewBox="0 0 380 262" role="img" style={svgStyle}
      aria-label={`Note du jury sur 10 : candelilla seule ${r.A}, huile de ricin seule ${r.B}, mélange à parts égales ${cacherMelange ? 'à mesurer' : r.AB}${montrerMoyenne ? ` ; moyenne des deux corps purs : ${nf(moy)}` : ''}`}>
      <text x="8" y="18" fontSize="13.5" fill={C.gris}>note du jury (/ 10)</text>
      <line x1="10" y1={y0} x2="372" y2={y0} stroke={C.gris} strokeWidth="2"/>
      {bar(40, r.A, C.A, 'candelilla', 'seule')}
      {bar(158, r.B, C.B, 'huile de ricin', 'seule')}
      {bar(276, r.AB, C.AB, 'mélange', '50 / 50', cacherMelange)}
      {montrerMoyenne && <g>
        <line x1="20" y1={y0 - moy * k} x2="362" y2={y0 - moy * k} stroke={C.rouge} strokeWidth="2.5" strokeDasharray="6 4"/>
        <text x="190" y={y0 - moy * k - 6} textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.rouge} {...halo}>moyenne des deux purs : {nf(moy)}</text>
      </g>}
    </svg>);
}

// ───────────────────────── Cartes « À retenir » ─────────────────────────
export function CarteAdditif() {
  const s = { base: 0.8, a: 1.3, b: 1.5, mes: 1.6 }, k = 26, y0 = 196;
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Si les effets s'additionnaient, l'équipe marquerait 3,6 buts par match ; on mesure 1,6 : l'interaction vaut moins 2,0" style={svgStyle}>
      <text x="8" y="22" fontSize="14.5" fontWeight="800" fill={C.rouge}>1 + 1 ≠ 2 : c’est l’interaction</text>
      <line x1="10" y1={y0} x2="372" y2={y0} stroke={C.gris} strokeWidth="2"/>
      <rect x="30" y={y0 - s.base * k} width="64" height={s.base * k} fill={C.base} fillOpacity="0.88"/>
      <rect x="30" y={y0 - (s.base + s.a) * k} width="64" height={s.a * k} fill={C.A} fillOpacity="0.88"/>
      <rect x="30" y={y0 - (s.base + s.a + s.b) * k} width="64" height={s.b * k} fill={C.B} fillOpacity="0.88"/>
      <text x="100" y={y0 - 4} fontSize="13.5" fill={C.gris}>départ 0,8</text>
      <text x="100" y={y0 - (s.base + s.a / 2) * k + 5} fontSize="13.5" fontWeight="700" fill={C.A}>+ A : 1,3</text>
      <text x="100" y={y0 - (s.base + s.a + s.b / 2) * k + 5} fontSize="13.5" fontWeight="700" fill={C.B}>+ B : 1,5</text>
      <text x="62" y="54" textAnchor="middle" fontSize="14" fontWeight="800" fill={C.txt}>prévu : 3,6</text>
      <rect x="250" y={y0 - s.mes * k} width="70" height={s.mes * k} fill={C.AB} fillOpacity="0.88" stroke={C.AB} strokeWidth="2"/>
      <text x="285" y={y0 - s.mes * k - 7} textAnchor="middle" fontSize="14" fontWeight="800" fill={C.txt}>mesuré : 1,6</text>
      <line x1="30" y1={y0 - 3.6 * k} x2="320" y2={y0 - 3.6 * k} stroke={C.rouge} strokeWidth="2.5" strokeDasharray="6 4"/>
      <text x="285" y={y0 - 3.6 * k + 18} textAnchor="middle" fontSize="14" fontWeight="800" fill={C.rouge}>écart −2,0</text>
      <text x="62" y={y0 + 18} textAnchor="middle" fontSize="13.5" fill={C.gris}>effets ajoutés</text>
      <text x="285" y={y0 + 18} textAnchor="middle" fontSize="13.5" fill={C.gris}>A et B ensemble</text>
      <text x="8" y="238" fontSize="13.5" fontWeight="700" fill={C.txt}>interaction = mesuré − prévu = 1,6 − 3,6</text>
    </svg>);
}

export function CarteSigne() {
  const panneau = (x0, titre, l1, l2, a, b) => (
    <g>
      <line x1={x0 + 8} y1="150" x2={x0 + 112} y2="150" stroke={C.gris} strokeWidth="1.5"/>
      <line x1={x0 + 8} y1={a[0]} x2={x0 + 104} y2={a[1]} stroke={C.AB} strokeWidth="3.5"/>
      <line x1={x0 + 8} y1={b[0]} x2={x0 + 104} y2={b[1]} stroke={C.A} strokeWidth="3.5"/>
      <text x={x0 + 60} y="174" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.txt}>{titre}</text>
      <text x={x0 + 60} y="192" textAnchor="middle" fontSize="13.5" fill={C.gris}>{l1}</text>
      <text x={x0 + 60} y="210" textAnchor="middle" fontSize="13.5" fill={C.gris}>{l2}</text>
    </g>);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Lire une interaction sur les droites : droites qui se rapprochent, antagonisme ; droites parallèles, aucune interaction ; droites qui s'écartent, synergie" style={svgStyle}>
      <text x="8" y="22" fontSize="14.5" fontWeight="800" fill={C.rouge}>Lire l’interaction sur les droites</text>
      <text x="8" y="44" fontSize="13.5" fill={C.AB} fontWeight="700">bleu : sans B</text><text x="130" y="44" fontSize="13.5" fill={C.A} fontWeight="700">orange : avec B</text>
      {panneau(4, 'antagonisme', 'se rapprochent', 'écart < 0', [140, 70], [70, 76])}
      {panneau(130, 'aucune', 'parallèles', 'écart = 0', [140, 110], [100, 70])}
      {panneau(256, 'synergie', 's’écartent', 'écart > 0', [140, 128], [124, 56])}
      <text x="8" y="238" fontSize="13.5" fill={C.gris}>écart = mesuré − prévu si les effets s’additionnaient</text>
    </svg>);
}

export function CarteUnSeul() {
  const grille = (x0, ab) => {
    const P = { b: [x0, 150], a: [x0 + 90, 150], c: [x0, 70], d: [x0 + 90, 70] };
    return (<g>
      <rect x={x0} y="70" width="90" height="80" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
      {[['b', C.base], ['a', C.A], ['c', C.B]].map(([q, c]) => <circle key={q} cx={P[q][0]} cy={P[q][1]} r="11" fill={c} stroke="#fff" strokeWidth="2"/>)}
      {ab ? <circle cx={P.d[0]} cy={P.d[1]} r="11" fill={C.AB} stroke="#fff" strokeWidth="2"/>
        : <><circle cx={P.d[0]} cy={P.d[1]} r="11" fill="#fff" stroke={C.rouge} strokeWidth="2.5" strokeDasharray="4 3"/><text x={P.d[0]} y={P.d[1] + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill={C.rouge}>?</text></>}
      <text x={x0 + 45} y="172" textAnchor="middle" fontSize="13.5" fill={C.gris}>A →</text>
      <text x={x0 - 14} y="115" textAnchor="middle" fontSize="13.5" fill={C.gris}>B</text>
    </g>);
  };
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Un facteur à la fois : trois essais, la combinaison de A et B n'est jamais testée ; plan factoriel : quatre essais, la combinaison est testée" style={svgStyle}>
      <text x="8" y="22" fontSize="14.5" fontWeight="800" fill={C.rouge}>Un facteur à la fois : on rate l’interaction</text>
      <text x="92" y="52" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.txt}>un à la fois</text>
      <text x="282" y="52" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.txt}>plan factoriel</text>
      {grille(48, false)}{grille(238, true)}
      <text x="92" y="200" textAnchor="middle" fontSize="13.5" fill={C.gris}>3 essais</text>
      <text x="92" y="218" textAnchor="middle" fontSize="13.5" fill={C.rouge} fontWeight="700">A + B jamais testés</text>
      <text x="282" y="200" textAnchor="middle" fontSize="13.5" fill={C.gris}>4 essais</text>
      <text x="282" y="218" textAnchor="middle" fontSize="13.5" fill="#15803d" fontWeight="700">toutes les combinaisons</text>
    </svg>);
}

export function CartePlanExp() {
  const carre = (x0, y0) => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => <circle key={i} cx={x0 + a * 50} cy={y0 - b * 40} r="7" fill={C.AB}/>);
  const P = (a, b, c) => [200 + 44 * a + 22 * c, 130 - 36 * b - 16 * c];
  const pts = []; [0, 1].forEach(a => [0, 1].forEach(b => [0, 1].forEach(c => pts.push([a, b, c]))));
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Un plan factoriel teste toutes les combinaisons de niveaux : 2 facteurs donnent 4 essais, 3 facteurs 8 essais, k facteurs 2 puissance k essais" style={svgStyle}>
      <text x="8" y="22" fontSize="14.5" fontWeight="800" fill={C.rouge}>Un plan d’expériences : toutes les combinaisons</text>
      {carre(36, 120)}
      <text x="61" y="156" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.txt}>2 facteurs</text>
      <text x="61" y="174" textAnchor="middle" fontSize="13.5" fill={C.gris}>2² = 4 essais</text>
      {pts.map((u, i) => pts.map((v, j) => (i < j && u.filter((x, q) => x !== v[q]).length === 1 ? <line key={`${i}-${j}`} x1={P(...u)[0]} y1={P(...u)[1]} x2={P(...v)[0]} y2={P(...v)[1]} stroke="#94a3b8" strokeWidth="1.5"/> : null)))}
      {pts.map((u, i) => <circle key={i} cx={P(...u)[0]} cy={P(...u)[1]} r="7" fill={C.AB}/>)}
      <text x="222" y="156" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.txt}>3 facteurs</text>
      <text x="222" y="174" textAnchor="middle" fontSize="13.5" fill={C.gris}>2³ = 8 essais</text>
      <text x="338" y="84" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.txt}>k facteurs</text>
      <text x="338" y="104" textAnchor="middle" fontSize="13.5" fill={C.gris}>2ᵏ essais</text>
      <text x="8" y="214" fontSize="13.5" fill={C.txt} fontWeight="700">On en déduit les effets et les interactions.</text>
      <text x="8" y="236" fontSize="13.5" fill={C.gris}>Trop d’essais ? plan fractionnaire (niveau expert).</text>
    </svg>);
}


export function CarteModele() {
  const s = SCEN.vedettes, c = modele(s), sg = v => (v < 0 ? '−' : '+');
  const co = v => nf(Math.abs(v), 2);
  const pt = (x, y, v, col, lx) => <g><circle cx={x} cy={y} r="7" fill={col} stroke="#fff" strokeWidth="1.5"/><text x={lx} y={y + 5} textAnchor={lx < x ? 'end' : 'start'} fontSize="14" fontWeight="800" fill={C.txt}>{nf(v)}</text></g>;
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label={`Le modèle du plan 2² : Buts = ${nf(c.a0, 2)} ${sg(c.aA)} ${co(c.aA)} xA ${sg(c.aB)} ${co(c.aB)} xB ${sg(c.aAB)} ${co(c.aAB)} xA xB ; le coefficient d'interaction vaut l'interaction divisée par 4`} style={svgStyle}>
      <text x="8" y="22" fontSize="14.5" fontWeight="800" fill={C.rouge}>Un plan 2² = une équation</text>
      <rect x="60" y="62" width="90" height="80" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>
      {pt(60, 142, s.base, C.base, 50)}{pt(150, 142, s.A, C.A, 160)}{pt(60, 62, s.B, C.B, 50)}{pt(150, 62, s.AB, C.AB, 160)}
      <text x="105" y="168" textAnchor="middle" fontSize="13.5" fill={C.gris}>xA : −1 → +1</text>
      <text x="105" y="52" textAnchor="middle" fontSize="13.5" fill={C.gris}>xB : −1 en bas, +1 en haut</text>
      <text x="196" y="86" fontSize="13.5" fill={C.txt}>a₀ = moyenne des 4</text>
      <text x="196" y="106" fontSize="13.5" fill={C.A} fontWeight="700">aA, aB : effets</text>
      <text x="196" y="126" fontSize="13.5" fill={C.AB} fontWeight="700">aAB = interaction ÷ 4</text>
      <text x="196" y="146" fontSize="13.5" fill={C.gris}>= {nf(s.AB - additif(s), 1)} ÷ 4 = {nf(c.aAB, 2)}</text>
      <text x="8" y="196" fontSize="13.5" fontWeight="800" fill={C.txt}>Buts = a₀ + aA·xA + aB·xB + aAB·xA·xB</text>
      <text x="8" y="218" fontSize="13.5" fontWeight="700" fill="#0369a1">Buts = {nf(c.a0, 2)} {sg(c.aA)} {co(c.aA)}·xA {sg(c.aB)} {co(c.aB)}·xB {sg(c.aAB)} {co(c.aAB)}·xA·xB</text>
      <text x="8" y="240" fontSize="13.5" fill={C.gris}>−1 : sans le joueur ; +1 : avec le joueur</text>
    </svg>);
}
