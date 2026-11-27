import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { puces, nbf, tire } from "./Travail";
import * as M from "./lentilleMinceModele";
import { Schema, COUL } from "./lentilleMinceSchema";
import { CouchePhotons, useHorloge, dureePas, T_BOUCLE, T_RAYON, ETAPES_PAS } from "./lentilleMinceAnim";
import { StyleAnim } from "./exploAnim";

const SIM_ID = 115;
declarerDefis(SIM_ID, [['focale', 'Trouver f′ au banc'], ['position', 'Prévoir la position de l’image'], ['focvar', 'Mise au point avec une focale variable']]);

// ====================================================
//  SIM 115 — LENTILLE MINCE : IMAGE, CONJUGAISON ET GRANDISSEMENT (1G, « Ondes et signaux », La lumière : images et couleurs)
//  Banc d'optique : un objet-plan AB, une lentille mince convergente (f′ réglable), un écran. Image réelle ou virtuelle, droite ou renversée.
//  Hypothèses : lentille mince, rayons proches de l'axe (approximation de Gauss), lumière monochromatique, objet-plan perpendiculaire à l'axe,
//  netteté jugée à ± 0,6 cm près (modèle géométrique, diffraction ignorée). Le schéma n'a pas la même échelle sur l'axe et en hauteur.
// ====================================================

const KX = 8, X0 = 250, YA = 165, KY = 14, LARG = 700, HAUT = 330;      // px par cm sur l'axe, centre optique, axe, px par cm en hauteur
const px = x => X0 + KX * x, py = y => YA - KY * y;
const PUBLIC_D = [20, 24, 30], PUBLIC_F = [6, 7, 8, 9, 10, 12, 14, 15];
const P0 = { d: 30, f: 10, s: 8 };
const cm = (x, n = 1) => nbf(x, n);
const bloqueSi = (ok, msg) => ok ? null : msg;
const fleche = (x, y, ang, c, t = 7) => <polygon points={`0,0 ${-2 * t},${-t * 0.8} ${-2 * t},${t * 0.8}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`}/>;

// ---------- le banc d'optique (scène principale) ----------
const X_MIN = -32, X_MAX = 50, TEAL = '#0f766e', NEG = '#b91c1c', POS = '#15803d';
// Banc d'optique. Deux aides facultatives, désactivées par défaut :
//   signes : repère algébrique (axe orienté dans le sens de la lumière : avant la lentille −, après +), avec les cotes OA, f′ et, si valeursImage, OA′ ;
//   mesure : { a, b } deux repères verticaux déplaçables (souris, doigt ou flèches du clavier) qui affichent la distance qui les sépare.
function Banc({ d, f, s, rayons = false, foyers = false, regle = false, etiquettes = false, ecran = true, identifiant = 'a',
  signes = false, coteF = true, valeursImage = false, mesure = null, onMesure = null, lum = null, imageForcee = false, poignees = null }) {
  const mg = poignees ? 34 : 0;      // marge à gauche : l'objet très éloigné (OA = −32 cm) reste saisissable
  const im = M.image(d, f), R = M.rayons(d, f);
  const svgRef = useRef(null);
  const fl = typeof window !== 'undefined' && window.innerWidth < 600 ? 2 : 1;      // textes de lecture (règle, étiquettes, scène) : la scène est réduite à ~37 % sur téléphone, il faut les doubler pour dépasser 9 px
  const fk = typeof window !== 'undefined' && window.innerWidth < 600 ? 1.45 : 1;      // textes des aides plus grands sur téléphone (la scène y est réduite à ~40 %)
  const arrondi = x => Math.round(Math.max(X_MIN, Math.min(X_MAX, x)) * 10) / 10;
  const xDepuisEvt = e => { const r = svgRef.current.getBoundingClientRect(); return arrondi(((e.clientX - r.left) * (LARG + mg) / r.width - mg - X0) / KX); };
  const saisir = () => e => { e.currentTarget.setPointerCapture?.(e.pointerId); };
  const deplacer = k => e => { if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return; onMesure?.({ [k]: xDepuisEvt(e) }); };
  const clavier = (k, x) => e => {
    const pas = e.shiftKey ? 0.1 : 0.5;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onMesure?.({ [k]: arrondi(x + pas) }); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onMesure?.({ [k]: arrondi(x - pas) }); }
  };
  const aff = isFinite(im.OAp) && px(im.OAp) > 10 && px(im.OAp) < LARG - 10;
  const dist = im.nature === 'reelle' ? Math.abs(s - im.OAp) : null;
  const flou = dist == null ? 0 : Math.min(9, dist * 0.9);
  const hClamp = h => Math.max(-125, Math.min(125, h));
  const xFin = ecran ? s : (LARG - X0) / KX;
  const trace = (r, c, cle) => {
    if (!r) return null;
    const [B, L] = r.avant, yl = L[1], u = r.dir, pente = u[1] / u[0], yFin = yl + pente * xFin;
    const mil = [(B[0] + L[0]) / 2, (B[1] + L[1]) / 2], ang = Math.atan2(-(L[1] - B[1]) * KY, (L[0] - B[0]) * KX) * 180 / Math.PI;
    return (<g key={cle}>
      <polyline points={`${px(B[0])},${py(B[1])} ${px(0)},${py(yl)} ${px(xFin)},${py(yFin)}`} fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round"/>
      {fleche(px(mil[0]), py(mil[1]), ang, c, 6)}
      {im.nature === 'virtuelle' && <line x1={px(0)} y1={py(yl)} x2={px(im.OAp)} y2={py(im.hImg)} stroke={c} strokeWidth="1.8" strokeDasharray="5 4"/>}
    </g>);
  };
  const hImgPx = hClamp(im.hImg * KY);
  // animation : chemins en pixels des rayons réels (B → lentille → écran) et prolongements en pointillés de l'image virtuelle
  const chemins = lum ? [[R.r1, COUL.r1], [R.r2, COUL.r2], [R.r3, COUL.r3]].filter(([r]) => r).map(([r, c]) => {
    const [B, L] = r.avant, yFin = L[1] + (r.dir[1] / r.dir[0]) * xFin;
    return { c, pts: [[px(B[0]), py(B[1])], [px(0), py(L[1])], [px(xFin), py(yFin)]] };
  }) : [];
  const prolong = lum && im.nature === 'virtuelle' && isFinite(im.OAp) ? chemins.map(ch => ({ x1: ch.pts[1][0], y1: ch.pts[1][1], x2: px(im.OAp), y2: py(im.hImg), c: ch.c })) : [];
  return (
    <svg ref={svgRef} viewBox={`${-mg} 0 ${LARG + mg} ${HAUT}`} width="100%" role="img" aria-label={`Banc d’optique : objet à ${cm(d)} cm d’une lentille convergente de ${!coteF ? 'distance focale inconnue' : `distance focale ${cm(f)} cm`}, écran à ${cm(s)} cm`}
      style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10 }}>
      <defs>
        <clipPath id={`lm-clip-${identifiant}`}><rect x={-mg} y="0" width={LARG + mg} height={HAUT}/></clipPath>
        <filter id={`lm-flou-${identifiant}`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={flou}/></filter>
        <filter id={`lm-lueur-${identifiant}`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      <g clipPath={`url(#lm-clip-${identifiant})`}>
        {signes && <g>
          <rect x="0" y="0" width={px(0)} height={HAUT} fill="#fef2f2" opacity="0.75"/><rect x={px(0)} y="0" width={LARG - px(0)} height={HAUT} fill="#f0fdf4" opacity="0.75"/>
          <text x={px(0) - 10} y="18" textAnchor="end" fontSize={16 * fk} fontWeight="800" fill={NEG}>avant la lentille : −</text>
          <text x={px(0) + 10} y="18" fontSize={16 * fk} fontWeight="800" fill={POS}>après : +</text>
          <g stroke="#334155" fill="#334155"><line x1="14" y1="40" x2="74" y2="40" strokeWidth="2"/>{fleche(76, 40, 0, '#334155', 6)}</g>
          <text x="84" y="45" fontSize={13.5 * fl} fontWeight="700" fill="#334155">sens de la lumière</text>
        </g>}
        <line x1="8" y1={YA} x2={LARG - 8} y2={YA} stroke="#0f172a" strokeWidth="1.5" strokeDasharray="10 5"/>
        {regle && <g>
          <line x1={px(-30)} y1="292" x2={px(50)} y2="292" stroke="#0f172a" strokeWidth="2.5"/>
          {Array.from({ length: 81 }, (_, k) => k - 30).map(k => <g key={k}><line x1={px(k)} y1="292" x2={px(k)} y2={k % 5 === 0 ? 304 : 298} stroke="#0f172a" strokeWidth="1.3"/>
            {k % (fl > 1 ? 10 : 5) === 0 && px(k) > 30 && px(k) < LARG - 30 && <text x={px(k)} y="320" textAnchor="middle" fontSize={12.5 * fl} fill="#0f172a">{k < 0 ? `−${-k}` : k}</text>}</g>)}
          <text x={LARG - 8} y={poignees ? 264 : 282} textAnchor="end" fontSize={12.5 * fl} fill="#334155" fontWeight="700">{poignees && fl > 1 ? 'position (cm)' : 'position (cm), 0 au centre optique O'}</text></g>}
        {rayons && [[R.r1, COUL.r1, 'r1'], [R.r2, COUL.r2, 'r2'], [R.r3, COUL.r3, 'r3']].map(([r, c, k]) => trace(r, c, k))}
        {/* lentille mince */}
        <line x1={px(0)} y1={YA - 125} x2={px(0)} y2={YA + 125} stroke={COUL.lent} strokeWidth="4.5"/>
        <polygon points={`${px(0)},${YA - 132} ${px(0) - 8},${YA - 114} ${px(0) + 8},${YA - 114}`} fill={COUL.lent}/><polygon points={`${px(0)},${YA + 132} ${px(0) - 8},${YA + 114} ${px(0) + 8},${YA + 114}`} fill={COUL.lent}/>
        <circle cx={px(0)} cy={YA} r="4" fill="#0f172a"/><text x={px(0) - 8} y={YA + 18} textAnchor="end" fontSize={13.5 * fl} fontWeight="800" fill="#0f172a">O</text>
        {foyers && isFinite(f) && <g fontSize={14 * fl} fontWeight="800" fill={COUL.foyer}>
          <circle cx={px(f)} cy={YA} r="5.5" fill={COUL.foyer} stroke="#fff" strokeWidth="1.5"/><text x={px(f)} y={YA + 22} textAnchor="middle">F′</text>
          <circle cx={px(-f)} cy={YA} r="5.5" fill="#fff" stroke={COUL.foyer} strokeWidth="2.5"/><text x={px(-f)} y={YA + 22} textAnchor="middle">F</text></g>}
        {/* objet AB */}
        {lum && <ellipse className="lm-halo" cx={px(-d)} cy={(py(M.H_OBJ) + YA) / 2} rx="15" ry={(YA - py(M.H_OBJ)) / 2 + 12} fill="#fde68a" opacity="0.5" filter={`url(#lm-lueur-${identifiant})`}/>}
        <line x1={px(-d)} y1={YA} x2={px(-d)} y2={py(M.H_OBJ) + 6} stroke={COUL.obj} strokeWidth="4"/>{fleche(px(-d), py(M.H_OBJ), -90, COUL.obj, 8)}
        {etiquettes && <g fontSize={13.5 * fl} fontWeight="800" fill={COUL.obj}><text x={px(-d) + (px(-d) < 30 ? 8 : -6)} y={py(M.H_OBJ) - 6} textAnchor={px(-d) < 30 ? 'start' : 'end'}>B</text><text x={px(-d) + (px(-d) < 30 ? 8 : -6)} y={YA + 18} textAnchor={px(-d) < 30 ? 'start' : 'end'}>A</text></g>}
        {!signes && <text x={Math.max(px(-d), 30 + 24 * fl)} y={YA + 44 + 16 * (fl - 1)} textAnchor="middle" fontSize={12.5 * fl} fontWeight="700" fill={COUL.obj}>objet AB</text>}
        {/* image calculée par les rayons */}
        {(rayons || imageForcee) && aff && <g>
          <line x1={px(im.OAp)} y1={YA} x2={px(im.OAp)} y2={YA - hImgPx} stroke={COUL.img} strokeWidth="3.5" strokeDasharray={im.nature === 'virtuelle' ? '6 4' : undefined}/>
          {fleche(px(im.OAp), YA - hImgPx, hImgPx > 0 ? -90 : 90, COUL.img, 8)}
          {etiquettes && <g fontSize={13.5 * fl} fontWeight="800" fill={COUL.img}><text x={px(im.OAp) + 8} y={YA - hImgPx + (hImgPx > 0 ? -4 : 14)}>B′</text><text x={px(im.OAp) + 8} y={YA + (hImgPx > 0 ? 18 : -6)}>A′</text></g>}
          <text x={px(im.OAp)} y={YA - hImgPx + (hImgPx > 0 ? -22 - 24 * (fl - 1) : 32 + 24 * (fl - 1))} textAnchor="middle" fontSize={12.5 * fl} fontWeight="700" fill={COUL.img}>{im.nature === 'virtuelle' ? 'image virtuelle' : 'image réelle'}</text></g>}
        {/* écran */}
        {ecran && <g>
          <rect x={px(s) - 4} y={YA - 125} width="8" height="250" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2"/>
          <text x={px(s)} y={YA - 132} textAnchor="middle" fontSize={12.5 * fl} fontWeight="700" fill="#0f172a">écran</text>
          {im.nature === 'reelle' && <g className={lum && dist <= M.TOL_NETTE ? 'lm-nette' : undefined} filter={`url(#lm-flou-${identifiant})`} opacity={Math.max(0.35, 1 - (dist || 0) * 0.05)}>
            <line x1={px(s) + 8} y1={YA} x2={px(s) + 8} y2={YA - hImgPx} stroke={COUL.img} strokeWidth="4"/>{fleche(px(s) + 8, YA - hImgPx, hImgPx > 0 ? -90 : 90, COUL.img, 8)}</g>}
          {im.nature !== 'reelle' && <ellipse cx={px(s) + 8} cy={YA} rx="22" ry="34" fill="#fde68a" opacity="0.55" filter={`url(#lm-lueur-${identifiant})`}/>}
        </g>}
        {signes && (() => {
          const cote = (x, y, nom, col, k) => {
            const v = x < 0 ? `−${cm(-x)}` : `+${cm(x)}`;
            return (<g key={k} fontSize={15 * fk} fontWeight="800" fill={col} stroke="none">
              <line x1={px(0)} y1={y} x2={px(x)} y2={y} stroke={col} strokeWidth="2.2"/>{fleche(px(x), y, x < 0 ? 180 : 0, col, 6)}
              <circle cx={px(0)} cy={y} r="2.6"/>
              <text x={(px(0) + px(x)) / 2} y={y - 6} textAnchor="middle" stroke="#fff" strokeWidth="4" paintOrder="stroke">{nom} = {v}{NB}cm</text></g>);
          };
          return (<g>
            {cote(-d, YA + 46, 'OA', NEG, 'oa')}
            {coteF && cote(f, YA + 46 + 20 * fk, 'f′', POS, 'f')}
            {valeursImage && isFinite(im.OAp) && Math.abs(im.OAp) <= 45 && cote(im.OAp, YA + 46 + 40 * fk, 'OA′', im.OAp < 0 ? NEG : POS, 'oap')}
          </g>);
        })()}
        {mesure && (() => {
          const xa = Math.min(mesure.a, mesure.b), xb = Math.max(mesure.a, mesure.b), dist = Math.abs(mesure.b - mesure.a);
          const rep = (k, x, n) => (
            <g key={k}>
              <line x1={px(x)} y1="40" x2={px(x)} y2="300" stroke={TEAL} strokeWidth="2" strokeDasharray="7 4"/>
              <g tabIndex={onMesure ? 0 : -1} role="slider" aria-label={`Repère ${n} (position sur l’axe, en cm)`} aria-valuemin={X_MIN} aria-valuemax={X_MAX} aria-valuenow={x}
                aria-valuetext={`${cm(x)} cm`} onKeyDown={clavier(k, x)} onPointerDown={saisir()} onPointerMove={deplacer(k)}
                style={{ cursor: 'ew-resize', touchAction: 'none', outline: 'none' }}>
                <rect x={px(x) - 20} y="36" width="40" height="40" fill="transparent"/>
                <path d={`M${px(x) - 11},40 h22 v13 l-11,10 l-11,-10 z`} fill={TEAL} stroke="#fff" strokeWidth="1.5"/>
                <text x={px(x)} y="52" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">{n}</text>
              </g>
              <text x={px(x) + (n === '1' ? -4 : 4)} y="84" textAnchor={n === '1' ? 'end' : 'start'} fontSize={15 * fk} fontWeight="800" fill={TEAL} stroke="#fff" strokeWidth="4" paintOrder="stroke">{cm(x)}</text>
            </g>);
          return (<g>
            <line x1={px(xa)} y1="112" x2={px(xb)} y2="112" stroke={TEAL} strokeWidth="2.4"/>{fleche(px(xb), 112, 0, TEAL, 6)}{fleche(px(xa), 112, 180, TEAL, 6)}
            <text x={(px(xa) + px(xb)) / 2} y="104" textAnchor="middle" fontSize={16 * fk} fontWeight="800" fill={TEAL} stroke="#fff" strokeWidth="5" paintOrder="stroke">distance = {cm(dist)}{NB}cm</text>
            {rep('a', mesure.a, '1')}{rep('b', mesure.b, '2')}
          </g>);
        })()}
        <CouchePhotons chemins={chemins} lum={lum && { ...lum, k: fl > 1 ? 2 : 1 }} prolongements={prolong}/>
        {poignees && (() => {
          const bord = x => Math.max(X_MIN, Math.min(X_MAX, x));
          const YR = 292, g = fl > 1 ? 1.9 : 1;      // poignées posées sur la règle, comme des curseurs ; plus grandes sur téléphone (cible tactile)
          const poignee = (cle, x, titre, valeur, vmin, vmax, texte, onPos, coul, corps) => (
            <g key={cle} className="xa-poignee" tabIndex={0} role="slider" aria-label={titre} aria-valuemin={vmin} aria-valuemax={vmax} aria-valuenow={valeur} aria-valuetext={texte}
              onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); poignees.onToucher?.(); }}
              onPointerMove={e => { if (e.currentTarget.hasPointerCapture?.(e.pointerId)) onPos(xDepuisEvt(e)); }}
              onKeyDown={e => {
                const k = e.shiftKey ? 0.1 : 0.5;
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); poignees.onToucher?.(); onPos(bord(x + k)); }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); poignees.onToucher?.(); onPos(bord(x - k)); }
              }}>
              <rect x={px(x) - 45 * g} y={YR - 28 * g} width={90 * g} height={56 * g} fill="transparent"/>
              <rect x={px(x) - 34 * g} y={corps[0]} width={68 * g} height={corps[1] - corps[0]} fill="transparent"/>
              {!poignees.touche && <circle className="xa-pulse" cx={px(x)} cy={YR} r={22 * g} fill="none" stroke={ORANGE_GUIDE} strokeWidth={3 * g}/>}
              <circle className="xa-anneau" cx={px(x)} cy={YR} r={14 * g} fill="#fff" stroke={coul} strokeWidth={3 * g}/>
              <path d={`M${px(x) - 8 * g} ${YR}H${px(x) + 8 * g}M${px(x) - 8 * g} ${YR}l${4 * g} ${-4 * g}M${px(x) - 8 * g} ${YR}l${4 * g} ${4 * g}M${px(x) + 8 * g} ${YR}l${-4 * g} ${-4 * g}M${px(x) + 8 * g} ${YR}l${-4 * g} ${4 * g}`} stroke={coul} strokeWidth={2 * g} fill="none" strokeLinecap="round"/>
            </g>);
          return (<g>
            {poignee('ecran', s, 'Écran (position sur l’axe, en cm)', s, M.S_MIN, M.S_MAX, `${cm(s)} cm`, x => poignees.onEcran(Math.max(M.S_MIN, Math.min(M.S_MAX, x))), '#475569', [YA - 125, YA + 125])}
            {poignee('objet', -d, 'Objet AB (position OA sur l’axe, en cm)', -d, -M.D_MAX, -M.D_MIN, `OA = −${cm(d)} cm`, x => poignees.onObjet(Math.max(M.D_MIN, Math.min(M.D_MAX, -x))), COUL.obj, [YA - 60, YA + 14])}
          </g>);
        })()}
      </g>
    </svg>);
}


// ---------- exploration animée : lumière qui circule, tracé rayon par rayon, objet et écran qui se saisissent ----------
function BancExplore({ propsBanc, setP }) {
  const [vue, setVue] = useState('boucle'), [touche, setTouche] = useState(false);
  const { d, f } = propsBanc, im = M.image(d, f), R = M.rayons(d, f);
  const nR = [R.r1, R.r2, R.r3].filter(Boolean).length;
  const T = vue === 'pas' ? dureePas(nR) : T_BOUCLE;
  const L = useHorloge(T, vue === 'boucle');
  const changerVue = v => { setVue(v); L.demarrer(); };
  const pas = vue === 'pas';
  const etapes = ETAPES_PAS(im.nature, nR), courante = Math.min(Math.floor(L.t / T_RAYON), nR);
  return (
    <div>
      <StyleAnim/>
      <Banc {...propsBanc} rayons={pas ? false : propsBanc.rayons} lum={{ t: L.t, mode: vue }} imageForcee={pas && L.t >= nR * T_RAYON}
        poignees={{ touche, onToucher: () => setTouche(true), onObjet: x => setP(p => ({ ...p, d: x })), onEcran: x => setP(p => ({ ...p, s: x })) }}/>
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '8px 0 2px', lineHeight: 1.45 }}>Saisissez l’<strong>objet</strong> ou l’<strong>écran</strong> (les ronds ↔ sur la règle) pour les déplacer : la lumière suit.</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['boucle', 'Lumière en boucle'], ['pas', 'Rayon par rayon']].map(([v, l]) => <button key={v} type="button" onClick={() => changerVue(v)} aria-pressed={vue === v} style={{ ...stylePetitBouton(vue === v, '#0369a1'), minHeight: 40 }}>{l}</button>)}
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => (L.joue ? L.setJoue(false) : L.fin ? L.demarrer() : L.setJoue(true))} style={{ ...styleBouton(true, L.joue ? '#475569' : '#0369a1'), minHeight: 40 }}>{L.joue ? '⏸ Pause' : L.fin ? '↻ Rejouer' : '▶ Lecture'}</button>
        {[[1, '×1'], [0.5, '×½'], [0.25, '×¼']].map(([v, l]) => <button key={v} type="button" onClick={() => L.setVit(v)} aria-pressed={L.vit === v} aria-label={`Vitesse ${l}`} style={{ ...stylePetitBouton(L.vit === v, '#0369a1'), minHeight: 40, minWidth: 44 }}>{l}</button>)}
      </div>
      {pas && (
        <label style={{ display: 'block', marginTop: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Instant : {cm(L.t, 1)}{NB}s</span>
          <input type="range" min={0} max={T} step={0.05} value={Math.min(L.t, T)} aria-label="Instant du tracé" onChange={ev => { L.setJoue(false); L.setT(Number(ev.target.value)); }} style={{ width: '100%', minHeight: 32 }}/>
        </label>)}
      {pas && (
        <ol aria-label="Étapes du tracé" style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 4 }}>
          {etapes.map(([n, texte], k) => (
            <li key={n} style={{ fontSize: 13.5, lineHeight: 1.45, padding: '4px 8px', borderRadius: 8, background: k === courante ? '#fff7ed' : 'transparent', border: `1.5px solid ${k === courante ? ORANGE_GUIDE : 'transparent'}`,
              fontWeight: k === courante ? 700 : 400, color: k <= courante ? KIT.txt : KIT.txt2 }}>
              <span style={{ fontWeight: 800 }}>{'①②③④'[n - 1]}</span> {texte}{k === courante ? ' ◄' : ''}
            </li>))}
        </ol>)}
    </div>);
}

const FConj = (
  <Formule><mfrac><mn>1</mn><mi>OA′</mi></mfrac><mo>−</mo><mfrac><mn>1</mn><mi>OA</mi></mfrac><mo>=</mo><mfrac><mn>1</mn><mi>f′</mi></mfrac></Formule>);
const FGrand = (
  <Formule><mi>γ</mi><mo>=</mo><mfrac><mi>A′B′</mi><mi>AB</mi></mfrac><mo>=</mo><mfrac><mi>OA′</mi><mi>OA</mi></mfrac></Formule>);

const FICHES = {
  nature: <>
    <Schema d={10} f={3} k={11} x0={125} hObj={3} rayons={[2]} ecran foyers={false} label="Une lentille convergente forme sur un écran une image réelle plus petite que l’objet et renversée : la flèche de l’image pointe vers le bas alors que celle de l’objet pointe vers le haut"
      extra={<g fontSize="11" fontWeight="700"><text x="14" y="22" fill={COUL.obj}>objet ↑</text><text x="150" y="126" fill={COUL.img}>image ↓ sur l’écran</text></g>}/>
    {puces(<><strong>Image réelle</strong> : les rayons se coupent vraiment ; on peut la <strong>recueillir sur un écran</strong>.</>,
      <><strong>Renversée</strong> : la flèche de l’image pointe à l’opposé de celle de l’objet ; <strong>droite</strong> : elle pointe dans le même sens.</>,
      <><strong>Idée fausse</strong> : « l’image est toujours là où l’on voit l’objet ». <strong>Vrai</strong> : l’image se forme à un endroit précis, que l’on trouve avec l’écran.</>)}
  </>,
  rayons: <>
    <Schema d={9} f={4} k={11.5} x0={135} hObj={3.2} ecran={false} label="Trois rayons issus de B : le rayon parallèle à l’axe passe par F prime, le rayon qui passe par O n’est pas dévié, le rayon qui passe par F ressort parallèle à l’axe ; les trois se coupent en B prime, sommet de l’image"
      extra={<g fontSize="10.5" fontWeight="700"><text x="168" y="16" fill={COUL.r1}>① parallèle → F′</text><text x="168" y="30" fill={COUL.r2}>② par O → tout droit</text><text x="168" y="44" fill={COUL.r3}>③ par F → parallèle</text></g>}/>
    {puces(<>Trois rayons issus de B, <strong>faciles à tracer</strong> : ① parallèle à l’axe ⇒ ressort par <strong>F′</strong> ; ② par <strong>O</strong> ⇒ <strong>non dévié</strong> ; ③ par <strong>F</strong> ⇒ ressort <strong>parallèle</strong> à l’axe.</>,
      <>Les rayons se coupent en <strong>B′</strong> : le point A′ est le pied de la perpendiculaire à l’axe issue de B′.</>,
      <><strong>Moyen mnémotechnique</strong> : « parallèle → foyer, centre → tout droit, foyer → parallèle ».</>)}
  </>,
  conj: <>
    <Schema d={8} f={4} k={12} x0={125} hObj={3} rayons={[2]} cotes foyers label="Axe optique orienté dans le sens de la lumière : OA est négatif car l’objet est avant la lentille, OA prime est positif quand l’image est réelle, après la lentille"/>
    {FConj}
    {puces(<>Grandeurs <strong>algébriques</strong> sur l’axe orienté dans le sens de la lumière : objet réel ⇒ <strong>OA &lt; 0</strong> ; image réelle ⇒ <strong>OA′ &gt; 0</strong>.</>,
      <>Pour calculer OA′ : <strong>1/OA′ = 1/f′ + 1/OA</strong>, puis on <strong>inverse</strong>.</>,
      <><strong>Exemple</strong> : OA = −24 cm et f′ = 8,0 cm donnent 1/OA′ = 1/8,0 − 1/24 = 1/12, donc OA′ = +12 cm (image réelle).</>,
      <><strong>Piège</strong> : oublier le signe de OA (OA = +24 donnerait une valeur fausse) ou oublier d’inverser.</>)}
  </>,
  grand: <>
    <Schema d={12} f={4} k={9} x0={165} hObj={4} rayons={[2]} hauteurs foyers={false} label="Grandissement : l’image est renversée et deux fois plus petite que l’objet, donc gamma est négatif et vaut moins un demi"/>
    {FGrand}
    {puces(<><strong>γ &lt; 0</strong> : image <strong>renversée</strong> ; <strong>γ &gt; 0</strong> : image <strong>droite</strong>. <strong>|γ| &gt; 1</strong> : agrandie ; <strong>|γ| &lt; 1</strong> : réduite.</>,
      <><strong>Exemple</strong> : OA = −12 cm et OA′ = +6,0 cm donnent γ = 6,0 ÷ (−12) = −0,50 : image réduite de moitié, renversée ; si AB = 4,0 cm, alors A′B′ = −2,0 cm (le signe dit « renversée »).</>,
      <>Le grandissement se lit aussi avec le théorème de Thalès sur le rayon passant par O.</>)}
  </>,
  virtuelle: <>
    <Schema d={3} f={5} k={14} x0={160} hObj={1.2} rayons={[1, 2]} foyers label="Loupe : l’objet est entre la lentille et le foyer, les rayons ressortent en divergeant ; leurs prolongements en pointillés se coupent en B prime, image virtuelle, droite et agrandie, du même côté que l’objet"
      extra={<text x="20" y="22" fontSize="11" fontWeight="700" fill={COUL.img}>image virtuelle (pointillés)</text>}/>
    {puces(<>Objet <strong>entre O et F</strong> (d &lt; f′) : après la lentille les rayons <strong>divergent</strong> ; ce sont leurs <strong>prolongements</strong> qui se coupent : image <strong>virtuelle</strong>.</>,
      <>Une image virtuelle est <strong>droite</strong>, <strong>agrandie</strong> (γ &gt; 1), du <strong>même côté</strong> que l’objet (OA′ &lt; 0) et <strong>ne peut pas être recueillie</strong> sur un écran : on la voit en regardant dans la lentille (<strong>loupe</strong>).</>,
      <><strong>Exemple</strong> : objet à 4,0 cm d’une loupe de focale 10 cm, image virtuelle à 6,7 cm du même côté, γ ≈ +1,7.</>)}
  </>,
  bilan: <>
    <svg viewBox="0 0 300 112" role="img" aria-label="Axe optique avec les points 2F, F, O, F prime et 2F prime : trois zones pour l’objet, numérotées 1, 2 et 3 (au-delà de 2F, entre 2F et F, entre F et O) ; les images correspondantes sont entre F prime et 2F prime (zone 1), au-delà de 2F prime (zone 2), et virtuelle du côté de l’objet (zone 3)" style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block', margin: '6px auto' }}>
      <line x1="8" y1="52" x2="292" y2="52" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="6 3"/>
      <line x1="150" y1="22" x2="150" y2="82" stroke={COUL.lent} strokeWidth="3"/>
      <line x1="10" y1="52" x2="30" y2="52" stroke="#1d4ed8" strokeWidth="9" strokeLinecap="round"/><line x1="34" y1="52" x2="88" y2="52" stroke="#b45309" strokeWidth="9" strokeLinecap="round"/><line x1="94" y1="52" x2="146" y2="52" stroke="#b91c1c" strokeWidth="9" strokeLinecap="round"/>
      <line x1="214" y1="52" x2="266" y2="52" stroke="#1d4ed8" strokeWidth="9" strokeLinecap="round"/><line x1="272" y1="52" x2="292" y2="52" stroke="#b45309" strokeWidth="9" strokeLinecap="round"/>
      {[[30, '2F'], [90, 'F'], [150, 'O'], [210, 'F′'], [270, '2F′']].map(([x, t]) => <g key={t}><circle cx={x} cy="52" r="3.2" fill={t === 'O' ? '#0f172a' : COUL.foyer}/><text x={x} y="72" textAnchor="middle" fontSize="11" fontWeight="700" fill={t === 'O' ? '#0f172a' : COUL.foyer}>{t}</text></g>)}
      <g fontSize="12" fontWeight="800" textAnchor="middle"><text x="20" y="38" fill="#1d4ed8">①</text><text x="62" y="38" fill="#b45309">②</text><text x="120" y="38" fill="#b91c1c">③</text><text x="240" y="38" fill="#1d4ed8">①′</text><text x="282" y="38" fill="#b45309">②′</text></g>
      <text x="150" y="98" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#334155">objet ①②③ (à gauche) → image ①′②′ (à droite)</text>
      <text x="150" y="110" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#b91c1c">③ : image virtuelle, du côté de l’objet</text>
    </svg>
    {puces(<><strong>Plus l’objet s’approche du foyer, plus l’image s’éloigne et grandit</strong> ; en F, l’image part à l’infini.</>,
      <>① Objet <strong>au-delà de 2F</strong> : image réelle, <strong>réduite</strong>, renversée, entre F′ et 2F′ (appareil photo). ② Entre <strong>2F et F</strong> : image réelle, <strong>agrandie</strong>, renversée, au-delà de 2F′ (projecteur).</>,
      <>③ Objet <strong>entre F et O</strong> : image <strong>virtuelle</strong>, droite, agrandie (loupe).</>,
      <><strong>Mise au point</strong> : on garde l’image nette sur l’écran en changeant la <strong>distance focale</strong> (smartphone) ou la <strong>position</strong> de l’objet ou de l’écran.</>)}
  </>,
};

// ====================================================
//  COMPOSANT
// ====================================================
export function SimulationLentilleMince() {
  const [mode, setMode] = useState(() => modeOuverture('lentille-mince-guide-v1'));
  useSignalerMode(mode);
  const [suiviFocale, noterFocale] = useCompteurDefi(), [suiviPosition, noterPosition] = useCompteurDefi(), [suiviFocvar, noterFocvar] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('lentille-mince-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('focale');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [P, setP] = useState(P0);
  const [opt, setOpt] = useState({ rayons: true, foyers: true, etiquettes: true });
  const [aides, setAides] = useState({ signes: false, mesure: false }), [mes, setMes] = useState({ a: 5, b: 15 });      // aides facultatives, éteintes par défaut
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const PE = enDefi && defi ? defi.p : P;                       // paramètres affichés (en défi, ceux du tirage)
  const im = M.image(PE.d, PE.f);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const ETAPES = [
    { id: 'ecran', titre: 'Une image sur l’écran', focus: ['scene'], depart: () => setP({ d: 30, f: 10, s: 8 }),
      texte: <>Un objet lumineux (la flèche <strong>AB</strong>) est placé devant une <strong>lentille convergente</strong>. De l’autre côté, un <strong>écran</strong> permet de recueillir l’image. Déplacez l’écran jusqu’à ce que l’image soit <strong>nette</strong>.</>,
      tache: { type: 'action', ok: enGuide && M.nette(30, 10, P.s), consigne: 'Déplacez l’écran jusqu’à obtenir une image nette.' } },
    { id: 'nature', titre: 'Une image réelle', focus: ['scene'], depart: () => setP({ d: 30, f: 10, s: 15 }),
      retenirTitre: 'À RETENIR : IMAGE RÉELLE, DROITE OU RENVERSÉE', retenir: FICHES.nature,
      texte: <>L’écran est à la bonne place : l’image est nette. Regardez la flèche de l’image : dans quel sens pointe-t-elle, par rapport à celle de l’objet ?</>,
      tache: { type: 'qcm', q: 'L’image que l’on recueille sur l’écran est…', options: ['une image réelle, renversée par rapport à l’objet', 'une image virtuelle, renversée', 'une image réelle, droite', 'une image virtuelle, droite'], bonne: 0,
        indice: 'On peut recueillir une image réelle sur un écran. Regardez si la flèche verte pointe vers le haut (comme l’objet) ou vers le bas.',
        expl: 'On peut la recueillir sur un écran : c’est une image réelle. Sa flèche pointe vers le bas alors que celle de l’objet pointe vers le haut : elle est renversée.' } },
    { id: 'rayons', titre: 'Où se forme l’image ? Trois rayons', focus: ['scene'], depart: () => setP({ d: 30, f: 10, s: 15 }),
      retenirTitre: 'À RETENIR : LES TROIS RAYONS PARTICULIERS', retenir: FICHES.rayons,
      texte: <>Pour prévoir où se forme l’image, on trace trois rayons issus du sommet <strong>B</strong> de l’objet. <strong>F</strong> et <strong>F′</strong> sont les foyers de la lentille : sa distance focale est <em>f′</em> = OF′ = 10,0{NB}cm. Les trois rayons se coupent au sommet <strong>B′</strong> de l’image.</>,
      tache: { type: 'qcm', q: 'Un rayon issu de B arrive sur la lentille parallèlement à l’axe optique. Après la lentille, il…', options: ['passe par le foyer image F′', 'passe par le foyer objet F', 'n’est pas dévié', 'ressort parallèle à l’axe optique'], bonne: 0,
        indice: 'Dans le schéma, le rayon bleu arrive parallèlement à l’axe. Regardez par quel point marqué il ressort.', expl: 'Un rayon parallèle à l’axe ressort en passant par le foyer image F′ (rayon ①).' } },
    { id: 'lire', titre: 'Lire la position de l’image', focus: ['scene', 'mesures'], depart: () => setP({ d: 30, f: 10, s: 15 }),
      texte: <>L’axe est gradué à partir du centre optique <strong>O</strong>, dans le sens de la lumière : l’objet est avant la lentille, donc à une position <strong>négative</strong> (OA = −30,0{NB}cm). Gardez l’écran là où l’image est nette et lisez la position de l’image, <strong>OA′</strong>, sur la règle.</>,
      tache: { type: 'num', q: 'Position OA′ de l’image sur l’axe (écran réglé sur l’image nette)', unite: 'cm', vrai: 15, tol: 0.05, affiche: v => cm(v), carnet: 'Position de l’image OA′ lue au banc',
        bloque: bloqueSi(M.nette(30, 10, P.s), 'Placez d’abord l’écran de façon que l’image soit nette.'), calcul: () => ['L’écran est sur l’image : OA′ est la graduation de la règle au niveau de l’écran, soit 15 cm.'],
        pieges: [[-15, 'L’image est après la lentille (du côté de l’écran) : OA′ est positif.']], expl: 'OA′ = +15 cm : l’image est à 15 cm derrière la lentille.', indice: 'Lisez la graduation de la règle au niveau de l’écran (à 0,5 cm près).' } },
    { id: 'conj', titre: 'La relation de conjugaison', focus: ['mesures'], depart: null,
      retenirTitre: 'À RETENIR : RELATION DE CONJUGAISON', retenir: FICHES.conj,
      texte: <>La position de l’image se calcule avec la <strong>relation de conjugaison</strong>. Ici OA = −30,0{NB}cm et <em>f′</em> = 10,0{NB}cm. Calculez OA′ avec la relation, sans regarder la règle.</>,
      tache: { type: 'num', q: 'Position OA′ calculée avec la relation de conjugaison', unite: 'cm', vrai: 15, tol: 0.02, affiche: v => cm(v), carnet: 'OA′ calculée avec la relation',
        calcul: () => ['1/OA′ = 1/f′ + 1/OA = 1/10,0 + 1/(−30,0) = 0,100 − 0,0333 = 0,0667 cm⁻¹.', 'OA′ = 1 ÷ 0,0667 = 15,0 cm : c’est bien la position lue au banc.'],
        pieges: [[7.5, 'Vous avez pris OA = +30 au lieu de −30 : l’objet est avant la lentille, OA est négatif.'], [0.0667, 'Vous avez calculé 1/OA′ : il reste à inverser.'], [-15, 'OA′ est positif ici : image réelle, après la lentille.']],
        expl: 'OA′ = 15,0 cm, valeur identique à celle lue sur la règle : la relation de conjugaison est vérifiée.', indice: '1/OA′ = 1/f′ + 1/OA avec OA = −30,0 cm. Calculez 1/OA′ puis inversez.' } },
    { id: 'prevoir', titre: 'Prévoir pour un objet plus proche', focus: ['mesures'], depart: () => setP({ d: 20, f: 10, s: 8 }),
      texte: <>On rapproche l’objet : OA = −20,0{NB}cm, la lentille est la même (<em>f′</em> = 10,0{NB}cm). Calculez à quelle position OA′ l’image va se former.</>,
      tache: { type: 'num', q: 'Position OA′ pour OA = −20,0 cm et f′ = 10,0 cm', unite: 'cm', vrai: 20, tol: 0.02, affiche: v => cm(v), carnet: 'OA′ prévue pour OA = −20 cm',
        calcul: () => ['1/OA′ = 1/10,0 + 1/(−20,0) = 0,100 − 0,050 = 0,050 cm⁻¹.', 'OA′ = 1 ÷ 0,050 = 20 cm.'],
        pieges: [[6.67, 'Vous avez pris OA = +20 au lieu de −20.'], [0.05, 'Vous avez calculé 1/OA′ : il reste à inverser.']],
        expl: 'OA′ = 20 cm : l’image se forme à 20 cm de la lentille, à la même distance que l’objet.', indice: '1/OA′ = 1/f′ + 1/OA avec OA = −20,0 cm.' } },
    { id: 'tester', titre: 'Tester la prévision au banc', focus: ['scene'], depart: () => setP({ d: 25, f: 10, s: 10 }),
      texte: <>Testons ! Rapprochez l’objet jusqu’à OA = −20,0{NB}cm (curseur « Position de l’objet OA »), puis placez l’écran à la position OA′ prévue à l’étape précédente, <strong>20{NB}cm</strong>. L’image doit être nette.</>,
      tache: { type: 'action', ok: enGuide && Math.abs(P.d - 20) <= 0.3 && M.nette(P.d, P.f, P.s), consigne: 'Objet à OA = −20 cm, écran à 20 cm : image nette ?' } },
    { id: 'grand', titre: 'Le grandissement', focus: ['scene', 'mesures'], depart: () => setP({ d: 15, f: 10, s: 30 }),
      retenirTitre: 'À RETENIR : LE GRANDISSEMENT', retenir: FICHES.grand,
      texte: <>On rapproche encore l’objet : OA = −15,0{NB}cm et <em>f′</em> = 10,0{NB}cm. L’écran est sur l’image nette : lisez OA′ sur la règle. Le <strong>grandissement</strong> compare la taille de l’image à celle de l’objet, avec le signe : γ = A′B′ ÷ AB = OA′ ÷ OA.</>,
      tache: { type: 'num', q: 'Grandissement γ pour OA = −15,0 cm (écran sur l’image nette)', unite: '', vrai: -2, tol: 0.05, affiche: v => nbf(v, 1), carnet: 'Grandissement γ',
        calcul: () => ['Sur la règle : OA′ = +30 cm.', 'γ = OA′ ÷ OA = 30 ÷ (−15,0) = −2,0.'],
        pieges: [[2, 'Le signe : l’image est renversée, donc γ est négatif.'], [-0.5, 'Vous avez inversé le rapport : γ = OA′ ÷ OA.'], [0.5, 'Vous avez inversé le rapport et oublié le signe.']],
        expl: 'γ = −2,0 : l’image est deux fois plus grande que l’objet et renversée.', indice: 'γ = OA′ ÷ OA ; lisez OA′ sur la règle (graduation de l’écran).' } },
    { id: 'taille', titre: 'La taille de l’image', focus: ['mesures'], depart: null,
      texte: <>Vous avez trouvé γ = −2,0. L’objet mesure AB = 2,0{NB}cm. Calculez la taille A′B′ de l’image (avec son signe).</>,
      tache: { type: 'num', q: 'Taille algébrique A′B′ de l’image', unite: 'cm', vrai: -4, tol: 0.05, affiche: v => cm(v), carnet: 'Taille A′B′ de l’image',
        calcul: () => ['A′B′ = γ × AB = −2,0 × 2,0 = −4,0 cm.', 'Le signe négatif : image renversée ; sa hauteur est 4,0 cm.'],
        pieges: [[4, 'Le signe : γ est négatif, donc A′B′ aussi (image renversée).'], [-1, 'Vous avez divisé par γ au lieu de multiplier : A′B′ = γ × AB.']],
        expl: 'A′B′ = −4,0 cm : l’image mesure 4,0 cm et elle est renversée.', indice: 'A′B′ = γ × AB, avec AB = 2,0 cm.' } },
    { id: 'virtuelle', titre: 'Et si l’objet est très près ?', focus: ['scene'], depart: () => setP({ d: 5, f: 10, s: 20 }),
      texte: <>Rapprochez l’objet de la lentille : OA = −5,0{NB}cm (entre O et F). Cherchez l’image avec l’écran : déplacez-le sur toute la règle. Les rayons ne se coupent plus après la lentille ; en pointillés, leurs prolongements se coupent en B′.</>,
      tache: { type: 'qcm', q: 'Peut-on recueillir cette image sur un écran ?', options: ['Non : l’image est virtuelle, droite et agrandie', 'Oui, en reculant l’écran', 'Oui, mais elle est renversée', 'Non : il n’y a aucune image'], bonne: 0,
        indice: 'Sur l’écran, aucune position ne donne une image nette : regardez où les rayons (ou leurs prolongements) se coupent.',
        expl: 'Les rayons divergent après la lentille : l’image est virtuelle (intersection des prolongements). Elle est droite et agrandie, et on la voit en regardant dans la lentille : c’est une loupe.' } },
    { id: 'virt-calc', titre: 'Le signe de OA′', focus: ['mesures'], depart: null,
      retenirTitre: 'À RETENIR : IMAGE VIRTUELLE ET LOUPE', retenir: FICHES.virtuelle,
      texte: <>Calculons la position de cette image avec la relation de conjugaison : OA = −5,0{NB}cm et <em>f′</em> = 10,0{NB}cm. Le signe du résultat renseigne sur la nature de l’image.</>,
      tache: { type: 'num', q: 'Position OA′ de l’image pour OA = −5,0 cm et f′ = 10,0 cm', unite: 'cm', vrai: -10, tol: 0.02, affiche: v => cm(v), carnet: 'OA′ pour OA = −5 cm (image virtuelle)',
        calcul: () => ['1/OA′ = 1/10,0 + 1/(−5,0) = 0,100 − 0,200 = −0,100 cm⁻¹.', 'OA′ = 1 ÷ (−0,100) = −10 cm : négatif, donc du côté de l’objet : image virtuelle.'],
        pieges: [[10, 'Le signe : 1/OA′ est négatif, donc OA′ aussi. OA′ < 0 signifie image virtuelle.'], [-0.1, 'Vous avez calculé 1/OA′ : il reste à inverser.'], [3.33, 'Vous avez pris OA = +5 au lieu de −5.']],
        expl: 'OA′ = −10 cm : l’image est virtuelle, située à 10 cm devant la lentille, du côté de l’objet.', indice: '1/OA′ = 1/f′ + 1/OA = 1/10,0 − 1/5,0.' } },
    { id: 'focvar', titre: 'Mettre au point avec une focale variable', focus: ['scene'], depart: () => setP({ d: 30, f: 6, s: 20 }),
      texte: <>Dans un smartphone, l’écran (le capteur) est fixe : on obtient une image nette en changeant la <strong>distance focale</strong> de la lentille. Ici l’objet est à OA = −30,0{NB}cm et l’écran à 20{NB}cm. Réglez <em>f′</em> pour que l’image soit nette.</>,
      tache: { type: 'action', ok: enGuide && M.nette(30, P.f, 20), consigne: 'Réglez la distance focale f′ pour obtenir une image nette sur l’écran fixe.' } },
    { id: 'focvar2', titre: 'Si l’objet se rapproche…', focus: [], depart: null,
      texte: <>L’écran reste fixé à 20{NB}cm. L’objet se rapproche de la lentille (|OA| diminue) et l’on veut garder une image nette. Aide : 1/<em>f′</em> = 1/OA′ + 1/|OA| avec OA′ fixe.</>,
      tache: { type: 'qcm', q: 'Pour garder l’image nette, la distance focale f′ doit…', options: ['diminuer (lentille plus convergente)', 'augmenter (lentille moins convergente)', 'ne pas changer', 'devenir négative'], bonne: 0,
        indice: 'Avec OA′ fixe, quand |OA| diminue, 1/|OA| augmente : que devient 1/f′ = 1/OA′ + 1/|OA| ?', expl: 'Quand l’objet se rapproche, 1/|OA| augmente, donc 1/f′ augmente : f′ diminue. C’est ce que fait la mise au point d’un smartphone pour un objet proche.' } },
    { id: 'bravo', titre: 'Bravo ! Le bilan', focus: [], depart: null,
      retenirTitre: 'À RETENIR : LE BILAN', retenir: FICHES.bilan,
      texte: <>Vous savez construire l’image d’un objet par une lentille mince, calculer sa position et sa taille avec la relation de conjugaison et le grandissement, distinguer image réelle et virtuelle, et faire la mise au point. Essayez maintenant l’exploration, puis les défis.</>, tache: null },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1);
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[etape].id;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const tirages = {
    focale: () => { const c = []; PUBLIC_D.forEach(d => PUBLIC_F.forEach(f => { if (d > f) { const o = d * f / (d - f); if (o >= 6 && o <= 45) c.push([d, f]); } })); const [d, f] = tire(c); return { type: 'focale', p: { d, f, s: 5 }, reps: {}, verifie: false }; },
    position: () => { const c = []; [12, 15, 18, 20, 24, 30].forEach(d => [6, 8, 10, 12, 15].forEach(f => { if (d > f) { const o = d * f / (d - f); if (o >= 6 && o <= 45) c.push([d, f]); } })); const [d, f] = tire(c); return { type: 'position', p: { d, f, s: 5 }, reps: {}, verifie: false }; },
    focvar: () => { const c = []; PUBLIC_D.forEach(d => PUBLIC_F.forEach(f => { if (d > f) { const s = Math.round(d * f / (d - f) * 10) / 10; if (s >= 6 && s <= 45) c.push([d, f, s]); } })); const [d, f, s] = tire(c); return { type: 'focvar', p: { d, f: M.F_MIN, s }, cible: f, reps: {}, verifie: false }; },
  };
  const nouveauDefi = t => setDefi(tirages[t]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = patch => setDefi(x => ({ ...x, p: { ...x.p, ...patch }, verifie: false }));
  const verifierDefi = () => {
    let ok, vrai;
    if (defi.type === 'focvar') { ok = M.nette(defi.p.d, defi.p.f, defi.p.s); vrai = defi.cible; }
    else {
      const x = lireNombre(defi.reps.r);
      if (defi.type === 'focale') { vrai = defi.p.f; ok = isFinite(x) && proche(x, vrai, 0.08); }
      else { vrai = M.image(defi.p.d, defi.p.f).OAp; ok = isFinite(x) && proche(x, vrai, 0.06); }
    }
    setDefi(x => ({ ...x, verifie: true, ok, vrai }));
    ({ focale: noterFocale, position: noterPosition, focvar: noterFocvar })[defi.type](ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('lm-verif')?.click()}
        onChange={e => setDefi(x => ({ ...x, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['focale', 'Trouver f′'], ['position', 'Prévoir OA′'], ['focvar', 'Mise au point']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'focale' ? 'Défi : quelle est la distance focale de cette lentille ?' : defi.type === 'position' ? 'Défi : où se forme l’image ?' : 'Défi : réglez la distance focale pour la mise au point'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'focale' && <>Une lentille convergente de distance focale <em>f′</em> <strong>inconnue</strong> forme l’image d’un objet placé à OA = −{cm(defi.p.d)}{NB}cm. Déplacez l’écran pour obtenir une image nette, lisez OA′, puis calculez <em>f′</em> avec la relation de conjugaison. Donnez <em>f′</em> avec 2 chiffres significatifs.</>}
        {defi.type === 'position' && <>Une lentille convergente a une distance focale <em>f′</em> = {cm(defi.p.f)}{NB}cm. Un objet est placé à OA = −{cm(defi.p.d)}{NB}cm. Calculez la position OA′ de l’image avec 2 chiffres significatifs.</>}
        {defi.type === 'focvar' && <>L’objet est à OA = −{cm(defi.p.d)}{NB}cm et l’écran, fixe, à {cm(defi.p.s)}{NB}cm de la lentille. Réglez la distance focale <em>f′</em> de la lentille pour que l’image sur l’écran soit nette, puis cliquez sur « Vérifier ».</>}
      </div>
      {defi.type === 'focale' && champ('cm', 'Distance focale f′')}
      {defi.type === 'position' && champ('cm', 'Position OA′')}
      {defi.type === 'focale' && <IndiceDefi cache={false}>La relation 1/OA′ − 1/OA = 1/f′ donne 1/f′ = 1/OA′ + 1/|OA| (OA est négatif). Lisez OA′ sur la règle, quand l’image est nette, puis inversez 1/f′.</IndiceDefi>}
      {defi.type === 'position' && <IndiceDefi cache={false}>1/OA′ = 1/f′ + 1/OA avec OA négatif (objet avant la lentille). Calculez 1/OA′, puis inversez.</IndiceDefi>}
      {defi.type === 'focvar' && <IndiceDefi cache={false}>Augmentez <em>f′</em> pas à pas en regardant la netteté de l’image sur l’écran. Pour vérifier : 1/<em>f′</em> = 1/OA′ + 1/|OA| avec OA′ = position de l’écran.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="lm-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok ? `✓ Correct. Valeur de la simulation : ${defi.type === 'position' ? 'OA′' : 'f′'} = ${cm(defi.vrai, 1)}${NB}cm.`
          : defi.type === 'focale' ? '✗ Vérifiez : placez l’écran sur l’image nette, lisez OA′ ; 1/f′ = 1/OA′ + 1/|OA| avec OA = −d ; pensez à inverser.'
            : defi.type === 'position' ? '✗ Vérifiez : 1/OA′ = 1/f′ + 1/OA avec OA négatif ; pensez à inverser.' : '✗ L’image n’est pas encore nette sur l’écran : modifiez f′ (1/f′ = 1/OA′ + 1/|OA|).')}
      </div>}
    </div>);

  // ════════════════ HYPOTHÈSES, MESURES, RÉGLAGES ════════════════
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Lentille mince convergente idéale</strong> : toute la déviation se fait dans un plan (le trait vertical) ; on néglige l’épaisseur du verre et les <strong>aberrations</strong> (sphérique, chromatique). Lumière monochromatique.</li>
      <li><strong>Approximation de Gauss</strong> : rayons proches de l’axe et peu inclinés. La relation de conjugaison n’est qu’un modèle : en TP, l’image n’est jamais parfaitement nette.</li>
      <li><strong>Objet-plan</strong> perpendiculaire à l’axe, de hauteur AB = 2,0 cm ; l’image est un objet-plan de hauteur A′B′ = |γ| × AB.</li>
      <li><strong>Netteté</strong> : l’image est jugée nette quand l’écran est à moins de 0,6 cm de OA′ (modèle géométrique ; la diffraction est ignorée) : la mesure de OA′ n’est donc précise qu’à ± 0,6 cm.</li>
      <li><strong>Dessin</strong> : les échelles sur l’axe et en hauteur sont différentes, ce qui ne change pas les positions des points ; une image très grande est tronquée.</li>
      <li><strong>Distance focale variable</strong> : modèle idéal d’une lentille à focale réglable (smartphone, lentille liquide) pour f′ entre 5 cm et 20 cm.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const signe = v => (v < 0 ? `−${cm(Math.abs(v))}` : cm(v));
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Position de l’objet OA" valeur={`${signe(-PE.d)}${NB}cm`} couleur={COUL.obj}/>
      <LigneMesure nom="Distance focale f′" valeur={`${cm(PE.f)}${NB}cm`} couleur={COUL.foyer}/>
      {enExplore && <LigneMesure nom="Position de l’écran" valeur={`${cm(PE.s)}${NB}cm`}/>}
      {enExplore && <LigneMesure nom="Position de l’image OA′ (relation)" valeur={isFinite(im.OAp) ? `${signe(im.OAp)}${NB}cm` : 'à l’infini'} couleur={COUL.img}/>}
      {enExplore && <LigneMesure nom="Grandissement γ = OA′ / OA" valeur={isFinite(im.gamma) ? nbf(im.gamma, 2) : '—'} couleur="#b45309"/>}
      {enExplore && <LigneMesure nom="Taille de l’image A′B′" valeur={isFinite(im.hImg) ? `${signe(im.hImg)}${NB}cm` : '—'} couleur="#b45309"/>}
      {enExplore && <LigneMesure nom="Nature de l’image" valeur={im.nature === 'infini' ? 'à l’infini' : `${im.nature === 'reelle' ? 'réelle' : 'virtuelle'}, ${im.droite ? 'droite' : 'renversée'}`}/>}
      {enExplore && <LigneMesure nom="Image sur l’écran" valeur={M.nette(PE.d, PE.f, PE.s) ? 'nette' : im.nature === 'reelle' ? 'floue' : 'aucune'} couleur={M.nette(PE.d, PE.f, PE.s) ? '#15803d' : '#b45309'}/>}
    </div>);
  const curseurEcran = <Curseur nom="Position de l’écran" valeur={P.s} onChange={v => setP(p => ({ ...p, s: v }))} min={M.S_MIN} max={M.S_MAX} pas={0.5} unite="cm" decimales={1} couleur="#475569"/>;
  const curseurObjet = <Curseur nom="Position de l’objet OA" valeur={-P.d} onChange={v => setP(p => ({ ...p, d: -v }))} min={-M.D_MAX} max={-M.D_MIN} pas={0.5} unite="cm" decimales={1} couleur="#0f172a"/>;
  const curseurF = <Curseur nom="Distance focale f′" valeur={P.f} onChange={v => setP(p => ({ ...p, f: v }))} min={M.F_MIN} max={M.F_MAX} pas={0.5} unite="cm" decimales={1} couleur="#0369a1"/>;
  const reglagesGuide = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {idE === 'focvar' || idE === 'focvar2' ? curseurF : (<>
        {curseurEcran}
        {depuis('tester') && curseurObjet}
      </>)}
    </div>);
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curseurObjet}{curseurF}{curseurEcran}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        {[['rayons', 'rayons'], ['foyers', 'foyers F, F′'], ['etiquettes', 'noms des points']].map(([k, l]) => <button key={k} onClick={() => setOpt(o => ({ ...o, [k]: !o[k] }))} aria-pressed={opt[k]} style={stylePetitBouton(opt[k], '#334155')}>{opt[k] ? '☑' : '☐'} {l}</button>)}</div>
    </div>);
  const reglagesDefi = defi && (defi.type === 'focale' ? (
    <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Position de l’écran" valeur={defi.p.s} onChange={v => majDefi({ s: v })} min={M.S_MIN} max={M.S_MAX} pas={0.5} unite="cm" decimales={1} couleur="#475569"/></div>
  ) : defi.type === 'focvar' ? (
    <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Distance focale f′" valeur={defi.p.f} onChange={v => majDefi({ f: v })} min={M.F_MIN} max={M.F_MAX} pas={0.5} unite="cm" decimales={1} couleur="#0369a1"/></div>
  ) : null);

  // ════════════════ SCÈNE ════════════════
  const scene = enGuide ? { rayons: depuis('rayons'), foyers: depuis('rayons'), regle: depuis('lire'), etiquettes: depuis('rayons'), ecran: true }
    : enDefi ? { rayons: defi?.type === 'position' && !!defi?.ok, foyers: defi?.type === 'position', regle: true, etiquettes: false, ecran: defi?.type !== 'position' || !!defi?.ok }
      : { rayons: opt.rayons, foyers: opt.foyers, regle: true, etiquettes: opt.etiquettes, ecran: true };
  const sEff = enDefi && defi?.type === 'position' && defi.ok ? Math.max(M.S_MIN, Math.min(M.S_MAX, im.OAp)) : PE.s;
  const aidesVisibles = enExplore || enDefi || (enGuide && depuis('lire'));
  const propsBanc = { d: PE.d, f: PE.f, s: sEff, ...scene, identifiant: 'p', signes: aides.signes && aidesVisibles, coteF: !(enDefi && defi?.type === 'focale'), valeursImage: enExplore,
    mesure: aides.mesure && aidesVisibles ? mes : null, onMesure: patch => setMes(m => ({ ...m, ...patch })) };
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore ? <BancExplore propsBanc={propsBanc} setP={setP}/> : <Banc {...propsBanc}/>}
      {aidesVisibles && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 12.5, color: KIT.txt2 }}>Aides :</span>
          {[['signes', 'repère des signes (+ / −)'], ['mesure', 'deux repères de mesure']].map(([k, l]) => <button key={k} onClick={() => setAides(a => ({ ...a, [k]: !a[k] }))} aria-pressed={aides[k]} style={stylePetitBouton(aides[k], TEAL)}>{aides[k] ? '☑' : '☐'} {l}</button>)}
        </div>)}
      {aidesVisibles && aides.mesure && (
        <div style={{ marginTop: 8 }}>
          <Curseur nom="Repère 1" valeur={mes.a} onChange={v => setMes(m => ({ ...m, a: v }))} min={X_MIN} max={X_MAX} pas={0.5} unite="cm" decimales={1} couleur={TEAL}/>
          <Curseur nom="Repère 2" valeur={mes.b} onChange={v => setMes(m => ({ ...m, b: v }))} min={X_MIN} max={X_MAX} pas={0.5} unite="cm" decimales={1} couleur={TEAL}/>
          <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Réglez les repères avec les curseurs, ou faites-les glisser sur le schéma. Distance entre les repères : <strong>{cm(Math.abs(mes.b - mes.a))}{NB}cm</strong>.</div>
        </div>)}
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Placez l’objet très loin (OA = −32 cm), puis rapprochez-le jusqu’au foyer. Que deviennent la position et la taille de l’image ?</li>
        <li>Placez l’objet à OA = −2 f′ (par exemple −20 cm pour f′ = 10 cm) : que valent OA′ et γ ?</li>
        <li>Placez l’objet exactement en F (OA = −f′) : où est l’image ? Pourquoi l’écran ne montre-t-il rien de net ?</li>
        <li>Placez l’objet entre O et F : essayez de recueillir l’image sur l’écran. Que dit le signe de OA′ ?</li>
        <li>Gardez l’objet et l’écran fixes et changez f′ : combien de valeurs de f′ donnent une image nette ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>relation de conjugaison : 1/OA′ − 1/OA = 1/f′ (OA &lt; 0 pour un objet réel)</li>
        <li>grandissement : γ = A′B′/AB = OA′/OA ; γ &lt; 0 : renversée ; |γ| &gt; 1 : agrandie</li>
        <li>OA′ &gt; 0 : image réelle (sur écran) ; OA′ &lt; 0 : image virtuelle (loupe)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lm-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .lm-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .lm-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .lm-l1.cote .lm-carte { order: 2; } .lm-l1.cote .lm-main { order: 1; } }
        @media (max-width: 900px) { .lm-l1.cote, .lm-pri { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) {
          .lm-halo { animation: lm-h 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes lm-h { 0%, 100% { opacity: .35; transform: scale(1); } 50% { opacity: .75; transform: scale(1.2); } }
          .lm-nette { animation: lm-n 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom; }
          @keyframes lm-n { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.05); } }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Lentille mince : image, conjugaison et grandissement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Où se forme l’image d’un objet, quelle est sa taille, est-elle <strong>réelle</strong> ou <strong>virtuelle</strong> ? Construisez-la avec trois rayons, calculez-la avec la <strong>relation de conjugaison</strong> et réalisez une <strong>mise au point</strong>.</div>
      <div className={`lm-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="lm-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="lm-carte">{panneauHypo}</div> : null}
        <div className="lm-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'focale' ? suiviFocale : defi.type === 'position' ? suiviPosition : suiviFocvar}/></div>}
          <div className={`lm-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {enGuide ? reglagesGuide : enDefi ? reglagesDefi : reglagesExplore}
              {(enExplore || (enGuide && depuis('lire'))) && mesures}
            </div>
          </div>
        </div>
      </div>
      {(enExplore || (enGuide && etape >= ETAPES.length - 1)) && <div className="lm-l2">{panneauHypo}</div>}
      {enExplore && <div className="lm-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
