import { JEUX, moyennes } from "./planFactorielModele";

// Schémas des cartes « À retenir » du plan factoriel (un schéma par carte ; texte ≥ 13 dans un viewBox de 380 de large)
const svgStyle = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto 6px' };
const nf = (v, d = 0) => Number(v).toFixed(d).replace(/^-(0(\.0*)?)$/, '$1').replace('.', ',').replace('-', '−');

// 1. Un plan 2³ : 8 essais aux sommets d'un cube, niveaux codés −1 / +1
export function CarteCube() {
  const P = (a, b, c) => [112 + 64 * a + 34 * c, 128 - 50 * b - 24 * c];
  const S = [-1, 1], pts = [];
  S.forEach(a => S.forEach(b => S.forEach(c => pts.push([a, b, c]))));
  const ar = [];
  pts.forEach((u, i) => pts.forEach((v, j) => { if (i < j && u.filter((x, k) => x !== v[k]).length === 1) ar.push([P(...u), P(...v)]); }));
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Plan factoriel 2³ : huit essais placés aux sommets d'un cube, chaque facteur prend le niveau −1 ou +1" style={svgStyle}>
      {ar.map(([a, b], k) => <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#64748b" strokeWidth="2"/>)}
      {pts.map((u, i) => { const p = P(...u); return <g key={i}><circle cx={p[0]} cy={p[1]} r="13" fill="#fff" stroke="#0f172a" strokeWidth="2"/><text x={p[0]} y={p[1] + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{i + 1}</text></g>; })}
      <text x="238" y="52" fontSize="14.5" fontWeight="800" fill="#0f172a">3 facteurs</text>
      <text x="238" y="72" fontSize="14.5" fontWeight="800" fill="#0f172a">× 2 niveaux</text>
      <line x1="238" y1="84" x2="372" y2="84" stroke="#334155"/>
      <text x="238" y="106" fontSize="14.5" fontWeight="800" fill="#b91c1c">2³ = 8 essais</text>
      <text x="238" y="136" fontSize="13.5" fill="#334155">niveau bas : −1</text>
      <text x="238" y="156" fontSize="13.5" fill="#334155">niveau haut : +1</text>
      <text x="14" y="228" fontSize="13.5" fill="#334155">k facteurs à 2 niveaux : 2ᵏ essais</text>
    </svg>);
}

// 2. Coefficient d'un facteur = (Moy⁺ − Moy⁻) / 2  (valeurs réelles : note du jury, facteur recette)
export function CarteEffet() {
  const J = JEUX.flan, m = moyennes(J.X, J.reponses[0].y, [0]), k = 100 / 7, base = 186;
  const barre = (x, v, c, t) => (<g>
    <rect x={x} y={base - v * k} width="64" height={v * k} fill={c} fillOpacity="0.85" stroke={c} strokeWidth="2"/>
    <text x={x + 32} y={base - v * k - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{nf(v, 2)}</text>
    <text x={x + 32} y={base + 18} textAnchor="middle" fontSize="13" fill="#334155">{t}</text></g>);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label={`Moyenne de la note quand la recette est au niveau bas : ${nf(m.moins, 2)} ; au niveau haut : ${nf(m.plus, 2)} ; le coefficient est la demi-différence de ces deux moyennes`} style={svgStyle}>
      <text x="14" y="24" fontSize="14.5" fontWeight="800" fill="#b91c1c">a = (Moy⁺ − Moy⁻) / 2</text>
      <line x1="14" y1={base} x2="226" y2={base} stroke="#334155" strokeWidth="2"/>
      {barre(30, m.moins, '#0369a1', 'Moy⁻ (−1)')}
      {barre(130, m.plus, '#b45309', 'Moy⁺ (+1)')}
      <text x="240" y="90" fontSize="13.5" fill="#334155">a &lt; 0 : le niveau</text>
      <text x="240" y="108" fontSize="13.5" fill="#334155">haut fait baisser</text>
      <text x="240" y="126" fontSize="13.5" fill="#334155">la réponse</text>
      <text x="14" y="238" fontSize="13.5" fill="#334155">chaque moyenne porte sur 4 essais sur 8</text>
    </svg>);
}

// 3. Interaction : droites parallèles (pas d'interaction) ou non parallèles (interaction)
export function CarteInter() {
  const un = (ox, a1, a2, b1, b2, titre, sous) => (<g>
    <line x1={ox} y1="170" x2={ox + 150} y2="170" stroke="#334155" strokeWidth="2"/><line x1={ox} y1="50" x2={ox} y2="170" stroke="#334155" strokeWidth="2"/>
    <line x1={ox + 20} y1={a1} x2={ox + 130} y2={a2} stroke="#0369a1" strokeWidth="3"/><line x1={ox + 20} y1={b1} x2={ox + 130} y2={b2} stroke="#b45309" strokeWidth="3"/>
    <text x={ox + 75} y="36" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{titre}</text>
    <text x={ox + 75} y="196" textAnchor="middle" fontSize="13.5" fill="#334155">{sous}</text></g>);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="À gauche, deux droites parallèles : pas d'interaction ; à droite, deux droites qui se croisent ou ne sont pas parallèles : il y a une interaction" style={svgStyle}>
      {un(14, 140, 100, 110, 70, 'parallèles', 'pas d’interaction')}
      {un(206, 140, 70, 80, 90, 'non parallèles', 'interaction')}
      <text x="14" y="228" fontSize="13.5" fill="#334155">une droite par niveau de l’autre facteur</text>
    </svg>);
}

// 4. Plan fractionnaire 2⁵⁻¹ : la moitié des 32 essais, effets confondus (alias)
export function CarteFraction() {
  const cases = Array.from({ length: 32 }, (_, i) => { const b = [0, 1, 2, 3, 4].map(k => ((i >> k) & 1) ? 1 : -1); return { i, fait: b[0] * b[1] * b[2] * b[3] * b[4] === 1 }; });
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Plan fractionnaire : seulement 16 des 32 essais d'un plan complet à cinq facteurs sont réalisés, choisis par la relation E égale ABCD ; les effets sont alors confondus par paires d'alias" style={svgStyle}>
      {cases.map(({ i, fait }) => <rect key={i} x={14 + (i % 8) * 24} y={14 + Math.floor(i / 8) * 24} width="21" height="21" rx="3" fill={fait ? '#0369a1' : '#fff'} stroke="#334155" strokeWidth="1.8"/>)}
      <text x="216" y="32" fontSize="14.5" fontWeight="800" fill="#0f172a">2⁵ = 32 essais</text>
      <text x="216" y="52" fontSize="14.5" fontWeight="800" fill="#0369a1">2⁵⁻¹ = 16 réalisés</text>
      <text x="216" y="82" fontSize="13.5" fill="#334155">choix : E = ABCD</text>
      <text x="216" y="110" fontSize="13.5" fill="#b91c1c" fontWeight="700">alias (confondus) :</text>
      <text x="216" y="130" fontSize="13.5" fill="#334155">A avec BCDE</text>
      <text x="216" y="148" fontSize="13.5" fill="#334155">AB avec CDE</text>
      <text x="14" y="140" fontSize="13.5" fill="#334155">■ essai réalisé  □ non réalisé</text>
      <text x="14" y="176" fontSize="14" fontWeight="800" fill="#0f172a">résolution V :</text>
      <text x="14" y="196" fontSize="13.5" fill="#334155">effets principaux et interactions</text>
      <text x="14" y="214" fontSize="13.5" fill="#334155">d’ordre 2 jamais confondus entre eux</text>
    </svg>);
}

// 5. Le modèle prévoit en additionnant des contributions (essai de coordonnées codées +1 ; +1 ; −1 pour la note du flan)
export function CarteModele() {
  const a0 = 4.31, c = [['aR·xR', -1.94], ['aT·xT', 0.19], ['aC·xC', 0.19]], k = 22, base = 176;
  let cur = a0; const bars = [{ t: 'a₀', y0: 0, y1: a0, v: a0, c: '#475569' }];
  c.forEach(([t, v]) => { bars.push({ t, y0: cur, y1: cur + v, v, c: v >= 0 ? '#15803d' : '#b45309' }); cur += v; });
  bars.push({ t: 'Ŷ', y0: 0, y1: cur, v: cur, c: '#0369a1' });
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Prévoir la note pour un essai : on part de la constante a zéro, puis on ajoute la contribution de chaque facteur, coefficient multiplié par son niveau codé" style={svgStyle}>
      <line x1="14" y1={base} x2="366" y2={base} stroke="#334155" strokeWidth="2"/>
      {bars.map((b, i) => { const x = 14 + i * 72, top = base - Math.max(b.y0, b.y1) * k, h = Math.abs(b.y1 - b.y0) * k;
        return (<g key={i}><rect x={x} y={top} width="46" height={Math.max(h, 2)} fill={b.c} fillOpacity="0.85" stroke={b.c} strokeWidth="2"/>
          <text x={x + 23} y={top - 6} textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#0f172a">{nf(b.v, 2)}</text>
          <text x={x + 23} y={base + 20} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{b.t}</text></g>); })}
      <text x="14" y="26" fontSize="14" fontWeight="800" fill="#0f172a">Ŷ = a₀ + aR·xR + aT·xT + aC·xC</text>
      <text x="14" y="228" fontSize="13.5" fill="#334155">R recette, T température, C refroidissement</text>
      <text x="14" y="246" fontSize="13.5" fill="#334155">ici (xR ; xT ; xC) = (+1 ; +1 ; −1)</text>
    </svg>);
}

// 6. Degrés de liberté : ddl = nombre d'essais − nombre de coefficients
export function CarteDdl() {
  const carres = (y, n, nbBleus, c1, c2) => Array.from({ length: n }, (_, i) => <rect key={i} x={14 + i * 22.4} y={y} width="19" height="19" rx="3" fill={i < nbBleus ? c1 : (c2 || '#fff')} stroke="#334155" strokeWidth="1.6"/>);
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Seize essais ; un modèle à seize coefficients utilise tous les essais et ne laisse aucun degré de liberté ; un modèle à cinq coefficients en laisse onze pour tester le modèle" style={svgStyle}>
      <text x="14" y="22" fontSize="14" fontWeight="800" fill="#0f172a">16 essais</text>{carres(30, 16, 0, '#fff')}
      <text x="14" y="92" fontSize="13.5" fill="#0f172a">modèle complet : 16 coefficients</text>{carres(100, 16, 16, '#0369a1')}
      <text x="14" y="148" fontSize="14" fontWeight="800" fill="#b91c1c">ddl = 16 − 16 = 0 : aucun test possible</text>
      <text x="14" y="182" fontSize="13.5" fill="#0f172a">modèle réduit : 5 coefficients</text>{carres(190, 16, 5, '#0369a1', '#16a34a')}
      <text x="14" y="234" fontSize="14" fontWeight="800" fill="#15803d">ddl = 16 − 5 = 11 : on peut tester</text>
    </svg>);
}

// 7. Diagramme de Pareto des coefficients avec seuil (plan 2⁴ vinaigrette)
export function CartePareto() {
  const L = [['N', 1.79], ['X', 0.95], ['U·N', -0.83], ['U', 0.54], ['S', 0.06], ['X·U', 0.04]], K = 120 / 1.79, X0 = 120, seuil = 0.076;
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Diagramme de Pareto : les coefficients sont rangés par valeur absolue décroissante ; seuls ceux qui dépassent le seuil en pointillés sont conservés dans le modèle" style={svgStyle}>
      <line x1={X0} y1="30" x2={X0} y2="214" stroke="#334155" strokeWidth="2"/>
      {[-1, 1].map(s => <line key={s} x1={X0 + s * seuil * K} y1="30" x2={X0 + s * seuil * K} y2="214" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="5 4"/>)}
      {L.map(([t, v], i) => { const ok = Math.abs(v) > seuil, yy = 38 + i * 29, w = Math.abs(v) * K;
        return (<g key={t}><text x="8" y={yy + 16} fontSize="14" fontWeight="800" fill="#0f172a">{t}</text>
          <rect x={v >= 0 ? X0 : X0 - w} y={yy} width={Math.max(w, 2)} height="21" fill={ok ? (v >= 0 ? '#0369a1' : '#b45309') : '#94a3b8'} rx="2"/>
          <text x={v >= 0 ? X0 + w + 6 : X0 + 8} y={yy + 16} fontSize="13.5" fontWeight="700" fill="#0f172a">{nf(v, 2)}</text></g>); })}
      <text x={X0 + seuil * K + 4} y="26" fontSize="13" fill="#dc2626" fontWeight="700">seuil</text>
      <text x="250" y="108" fontSize="13.5" fill="#0369a1" fontWeight="800">gardés : plus</text><text x="250" y="126" fontSize="13.5" fill="#0369a1" fontWeight="800">grands que le seuil</text>
      <text x="250" y="170" fontSize="13.5" fill="#64748b" fontWeight="800">écartés : dans</text><text x="250" y="188" fontSize="13.5" fill="#64748b" fontWeight="800">le « bruit »</text>
      <text x="14" y="238" fontSize="13.5" fill="#334155">classer les effets, ne garder que les grands</text>
    </svg>);
}

// 8. Un effet est significatif si son intervalle de confiance n'inclut pas 0 (plan 2⁵⁻¹, Student à 10 ddl)
export function CarteSignif() {
  const L = [['D·E', -2.0], ['E', 1.63], ['C·E', -1.38], ['D', 0.63], ['C', 0.5], ['B·D', -0.25], ['A', -0.13]], ic = 0.363, K = 52, X0 = 200;
  return (
    <svg viewBox="0 0 380 250" role="img" aria-label="Chaque coefficient est tracé avec son intervalle de confiance à 95 pour cent : si l'intervalle contient zéro, l'effet n'est pas significatif" style={svgStyle}>
      <line x1={X0} y1="30" x2={X0} y2="214" stroke="#334155" strokeWidth="2"/>
      {L.map(([t, v], i) => { const yy = 40 + i * 25, ok = Math.abs(v) > ic;
        return (<g key={t}><text x="8" y={yy + 5} fontSize="14" fontWeight="800" fill="#0f172a">{t}</text>
          <line x1={X0 + (v - ic) * K} y1={yy} x2={X0 + (v + ic) * K} y2={yy} stroke={ok ? '#15803d' : '#b91c1c'} strokeWidth="3.5"/>
          <circle cx={X0 + v * K} cy={yy} r="5.5" fill="#0f172a"/>
          <text x="348" y={yy + 5} textAnchor="end" fontSize="13" fontWeight="800" fill={ok ? '#15803d' : '#b91c1c'}>{ok ? 'oui' : 'non'}</text></g>); })}
      <text x="14" y="26" fontSize="13.5" fill="#334155">coefficient ± IC à 95 %</text>
      <text x="300" y="26" fontSize="13.5" fontWeight="800" fill="#334155">significatif ?</text>
      <text x="14" y="236" fontSize="13.5" fill="#334155">l’intervalle contient 0 ⇒ effet non significatif</text>
    </svg>);
}
