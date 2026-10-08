import { useState, useEffect, useRef, useMemo } from "react";
import { fmt, KIT, Section, Curseur, LigneMesure } from "../commun";
import { AnimationSechage as AnimationLatex } from "./peintureFilm";

// ====================================================
// SIM 14 — SÉCHAGE D'UNE PEINTURE (BTS MDC) v2
// ====================================================

export const RHO_HUILE = 0.93;

export const MP_DEFAUT = [
  { nom:'Eau',                    role:'Solvant', es:null, densite:1.00,  densiteApp:null, ph_g:null, ph_mL:null, masse:100 },
  { nom:'TiO₂',                  role:'Pigment', es:null, densite:null,  densiteApp:4.10, ph_g:19,   ph_mL:null, masse:60  },
  { nom:'CaCO₃ léger',           role:'Charge',  es:null, densite:null,  densiteApp:2.75, ph_g:18,   ph_mL:null, masse:60  },
  { nom:'Orgal PST 50A (liant)', role:'Liant',   es:50,   densite:1.00,  densiteApp:null, ph_g:null, ph_mL:null, masse:100, densiteSec:1.03, tmff:20 },
  { nom:'Foamex (antimousse)',   role:'Additif', es:20,   densite:1.00,  densiteApp:null, ph_g:null, ph_mL:null, masse:1.5 },
  { nom:'Coadis BR3 (dispersant)',role:'Additif',es:40,   densite:1.22,  densiteApp:null, ph_g:null, ph_mL:null, masse:0.6 },
  { nom:'DPnB (coalescence)',    role:'Additif', es:0,    densite:0.91,  densiteApp:null, ph_g:null, ph_mL:null, masse:5.0, coalescent:true },
  { nom:'Thixol 53L (épaississant)',role:'Additif',es:30, densite:1.06,  densiteApp:null, ph_g:null, ph_mL:null, masse:1.5 },
  { nom:'Coapur 3025 (épaississant)',role:'Additif',es:25,densite:1.04,  densiteApp:null, ph_g:null, ph_mL:null, masse:3.0 },
];

export const ROLES = ['Solvant','Liant','Pigment','Charge','Additif'];
export const ROLE_COLORS = {
  Solvant:'#93c5fd', Liant:'#1e3a5f', Pigment:'#dc2626',
  Charge:'#9ca3af', Additif:'#f59e0b'
};
export const ROLE_COLORS_LIGHT = {
  Solvant:'#dbeafe', Liant:'#1e40af', Pigment:'#fca5a5',
  Charge:'#e5e7eb', Additif:'#fde68a'
};

// ─────────────────────────────────────────────
// CALCULS
// ─────────────────────────────────────────────
export function calculerProprietes(mps) {
  let masseTotale=0, masseSecTotale=0;
  let volPigments=0, volLiantSec=0, volHuile=0;

  mps.forEach(mp => {
    const m = mp.masse || 0;
    masseTotale += m;

    if (mp.role === 'Solvant') return;

    if (mp.role === 'Pigment' || mp.role === 'Charge') {
      masseSecTotale += m;
      if (mp.densiteApp) volPigments += m / mp.densiteApp;
      // PH en g/100g → masse huile → volume huile
      const ph = mp.ph_g || (mp.ph_mL ? mp.ph_mL * RHO_HUILE : null);
      if (ph) volHuile += (m * ph / 100) / RHO_HUILE;
    }

    if (mp.role === 'Liant') {
      const es = (mp.es || 0) / 100;
      const mSec = m * es;
      masseSecTotale += mSec;
      const rhoSec = mp.densiteSec || 1.03;
      volLiantSec += mSec / rhoSec;
    }

    if (mp.role === 'Additif') {
      const es = (mp.es || 0) / 100;
      masseSecTotale += m * es;
    }
  });

  const ES   = masseTotale > 0 ? (masseSecTotale / masseTotale) * 100 : 0;
  const CPV  = (volPigments + volLiantSec) > 0 ? volPigments / (volPigments + volLiantSec) * 100 : 0;
  const CPVC = (volPigments + volHuile) > 0 ? volPigments / (volPigments + volHuile) * 100 : 0;
  const lambda = CPVC > 0 ? CPV / CPVC : 0;
  const aspect = lambda < 0.5 ? 'brillant' : lambda > 0.8 ? 'mat' : 'satiné';

  return {
    ES: ES.toFixed(1), CPV: CPV.toFixed(1), CPVC: CPVC.toFixed(1),
    lambda: lambda.toFixed(3), aspect,
    volPigments: volPigments.toFixed(2),
    volLiantSec: volLiantSec.toFixed(2),
    volHuile: volHuile.toFixed(2),
    masseTotale: masseTotale.toFixed(1),
  };
}

// ─────────────────────────────────────────────
// GÉNÉRATION PARTICULES (une seule fois au chargement)
// ─────────────────────────────────────────────
export function genererParticules(mps, showAdditifs, svgW, svgH) {
  const parts = [];
  let id = 0;
  mps.forEach(mp => {
    if (mp.role === 'Solvant') return;
    if (mp.role === 'Additif' && !showAdditifs) return;
    const m = mp.masse || 0;
    if (m <= 0) return;

    let nb, rayon;
    if (mp.role === 'Pigment')      { nb = Math.max(3, Math.round(m/8));  rayon = 7; }
    else if (mp.role === 'Charge')  { nb = Math.max(3, Math.round(m/12)); rayon = 5; }
    else if (mp.role === 'Liant')   { nb = Math.max(2, Math.round(m/35)); rayon = 0; } // spaghetti
    else                            { nb = Math.max(1, Math.round(m/2));  rayon = 3; }

    for (let i = 0; i < nb; i++) {
      // Position initiale aléatoire dans le rectangle solvant
      const x = rayon + Math.random() * (svgW - 2*rayon);
      const y = rayon + Math.random() * (svgH - 2*rayon - 10);
      parts.push({
        id: id++, role: mp.role, nom: mp.nom,
        rayon, x, y,
        color: ROLE_COLORS[mp.role],
        // Pour le spaghetti (liant) : points de la courbe
        spagPoints: mp.role === 'Liant' ? genSpaghetti(x, y, svgW) : null,
      });
    }
  });
  return parts;
}

export function genSpaghetti(cx, cy, svgW) {
  // Génère une courbe sinusoïdale "repliée" autour du centre
  const pts = [];
  const longueur = 40 + Math.random() * 20;
  const nbPts = 12;
  for (let i = 0; i < nbPts; i++) {
    const t = i / (nbPts-1);
    const angle = t * Math.PI * 4 + Math.random() * 0.5; // 2 tours + bruit
    const r = t * longueur/2;
    pts.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle) * 0.5, // aplati verticalement
    });
  }
  return pts;
}

// ─────────────────────────────────────────────
// COMPOSANT ANIMATION
// ─────────────────────────────────────────────
export function AnimationSechage({ mps, showAdditifs, progress }) {
  const SVG_W = 600;
  const SVG_H = 180;       // hauteur max solvant
  const SUPPORT_H = 20;
  const TOTAL_H = SVG_H + SUPPORT_H;

  // Génération des particules une seule fois par changement de formule
  const particules = useMemo(
    () => genererParticules(mps, showAdditifs, SVG_W, SVG_H),
    [JSON.stringify(mps.map(m=>({r:m.role,m:m.masse,n:m.nom}))), showAdditifs]
  );

  const props = calculerProprietes(mps);
  const lambda = parseFloat(props.lambda);

  // Hauteur du rectangle solvant (diminue avec progress)
  const solvantH = SVG_H * (1 - progress * 0.9);
  // Hauteur du film sec (croît avec progress)
  const filmH = progress * SVG_H * 0.4;

  // Couleur eau : bleu foncé → bleu très pâle
  const blueIntensity = Math.round(147 + progress * (220-147));
  const blueAlpha = Math.max(0.08, 0.5 - progress * 0.42);
  const solvantFill = `rgba(96,165,250,${blueAlpha})`;

  // Position Y d'une particule : elle suit le niveau du solvant
  function getPY(p) {
    // Position relative dans [0,1] dans la hauteur initiale
    const relY = p.y / SVG_H;
    // Elle descend avec le niveau : nouvellement dans [0, solvantH]
    return relY * solvantH;
  }

  // Spaghetti : interpolation entre replié (t=0) et déplié (t=1)
  function spagPath(pts, t) {
    if (!pts || pts.length < 2) return '';
    const cx = pts.reduce((s,p)=>s+p.x,0)/pts.length;
    const cy = pts.reduce((s,p)=>s+p.y,0)/pts.length;
    // t=0 : position originale ; t=1 : ligne droite horizontale
    const interp = pts.map((p,i) => {
      const targetX = cx - 20 + (i/(pts.length-1))*40;
      const targetY = cy;
      return {
        x: p.x + t*(targetX - p.x),
        y: p.y + t*(targetY - p.y),
      };
    });
    return interp.map((p,i)=>
      `${i===0?'M':'L'}${p.x.toFixed(1)},${getPY({y:p.y})?.toFixed(1)??p.y.toFixed(1)}`
    ).join(' ');
  }

  // Surface finale du film
  function surfacePath() {
    if (progress < 0.7) return null;
    const t = (progress - 0.7) / 0.3; // 0→1 entre 70% et 100%
    const amp = lambda < 0.5 ? 0.5 : lambda > 0.8 ? 7 : 3;
    const freq = lambda < 0.5 ? 1 : lambda > 0.8 ? 3 : 2;
    const yBase = SVG_H - filmH;
    const pts = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = (i/N)*SVG_W;
      const dy = Math.sin(i*freq + 0.5) * amp * t;
      pts.push(`${i===0?'M':'L'}${x.toFixed(1)},${(yBase+dy).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  // Porosité (bulles blanches dans le film si lambda > 0.8)
  const pores = useMemo(() => {
    if (lambda <= 0.8) return [];
    const nb = Math.round(6 + lambda * 4);
    return Array(nb).fill(0).map((_,i) => ({
      x: 20 + Math.random() * (SVG_W-40),
      y: 0.3 + Math.random() * 0.5,
      rx: 4 + Math.random()*6,
      ry: 2 + Math.random()*3,
    }));
  }, [Math.round(lambda*10)]);

  // Coalescence du liant : progress 0.5→1 → déploiement 0→1
  const spagT = progress < 0.5 ? 0 : Math.min(1, (progress-0.5)/0.5);

  const surf = surfacePath();

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${SVG_W} ${TOTAL_H}`}
        style={{borderRadius:12, border:'1.5px solid #bae6fd', background:'#f8fafc'}}>

        {/* Support */}
        <defs>
          <linearGradient id="supportGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b7280"/>
            <stop offset="100%" stopColor="#374151"/>
          </linearGradient>
          <linearGradient id="filmGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lambda>0.8?'#fef3c7':lambda>0.5?'#d1fae5':'#a7f3d0'}/>
            <stop offset="100%" stopColor={lambda>0.8?'#fde68a':lambda>0.5?'#6ee7b7':'#34d399'}/>
          </linearGradient>
        </defs>

        <rect x={0} y={SVG_H} width={SVG_W} height={SUPPORT_H} fill="url(#supportGrad)" rx={2}/>
        <text x={SVG_W/2} y={SVG_H+14} textAnchor="middle"
          fontSize={10} fill="#9ca3af" fontStyle="italic">Support</text>

        {/* Film sec (croît par le bas) */}
        {progress > 0.05 && (
          <rect x={0} y={SVG_H-filmH} width={SVG_W} height={filmH}
            fill="url(#filmGrad)" opacity={Math.min(1, progress*1.5)}/>
        )}

        {/* Porosité dans le film */}
        {progress > 0.8 && pores.map((p,i) => (
          <ellipse key={i}
            cx={p.x} cy={SVG_H - filmH*p.y}
            rx={p.rx * Math.min(1,(progress-0.8)/0.2)}
            ry={p.ry * Math.min(1,(progress-0.8)/0.2)}
            fill="white" stroke="#d1d5db" strokeWidth={0.5} opacity={0.85}/>
        ))}

        {/* Surface du film */}
        {surf && (
          <path d={`${surf} L${SVG_W},${SVG_H} L0,${SVG_H} Z`}
            fill="url(#filmGrad)"
            stroke={lambda>0.8?'#d97706':lambda>0.5?'#059669':'#10b981'}
            strokeWidth={1.5} opacity={0.9}/>
        )}

        {/* Rectangle solvant (eau) */}
        {progress < 0.99 && (
          <rect x={0} y={SVG_H-solvantH} width={SVG_W} height={solvantH}
            fill={solvantFill} stroke="rgba(96,165,250,0.4)" strokeWidth={1}/>
        )}

        {/* Évaporation : petites gouttes qui montent */}
        {progress > 0.02 && progress < 0.92 && (
          Array(5).fill(0).map((_,i) => {
            const xd = SVG_W * (0.1 + i*0.2);
            const yd = SVG_H - solvantH - 8 - (i%2)*6;
            return (
              <g key={i} opacity={0.6}>
                <circle cx={xd} cy={yd} r={2.5} fill="#93c5fd"/>
                <circle cx={xd+5} cy={yd-8} r={1.5} fill="#bfdbfe"/>
              </g>
            );
          })
        )}

        {/* Particules pigments et charges */}
        {particules.filter(p=>p.role==='Pigment'||p.role==='Charge').map(p => {
          const py = getPY(p);
          if (py < 0 || py > SVG_H) return null;
          const isCharge = p.role === 'Charge';
          return (
            <circle key={p.id} cx={p.x} cy={py} r={p.rayon}
              fill={p.color} fillOpacity={isCharge ? 0.55 : 0.9}
              stroke={isCharge ? '#6b7280' : '#991b1b'} strokeWidth={0.8}/>
          );
        })}

        {/* Liant — spaghetti qui se déploie */}
        {particules.filter(p=>p.role==='Liant').map(p => {
          const pts = p.spagPoints;
          if (!pts) return null;
          // Position Y de référence du centre du spaghetti
          const cyRef = getPY({y: pts.reduce((s,pt)=>s+pt.y,0)/pts.length});
          if (cyRef < 0 || cyRef > SVG_H) return null;

          const cx = pts.reduce((s,pt)=>s+pt.x,0)/pts.length;

          // Interpoler pts vers ligne droite
          const interpPts = pts.map((pt,i) => {
            const relY = pt.y / SVG_H;
            const newY = relY * solvantH;
            const targetX = cx - 18 + (i/(pts.length-1))*36;
            const targetY = cyRef;
            return {
              x: pt.x + spagT*(targetX - pt.x),
              y: newY  + spagT*(targetY - newY),
            };
          });

          const d = interpPts.map((pt,i)=>`${i===0?'M':'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
          // Épaisseur augmente légèrement avec déploiement (résine étalée)
          const strokeW = 2.5 + spagT * 3;
          return (
            <g key={p.id}>
              <path d={d} fill="none"
                stroke={ROLE_COLORS.Liant} strokeWidth={strokeW}
                strokeLinecap="round" strokeLinejoin="round"
                opacity={0.85}/>
            </g>
          );
        })}

        {/* Additifs */}
        {particules.filter(p=>p.role==='Additif').map(p => {
          const py = getPY(p);
          if (py < 0 || py > SVG_H) return null;
          return (
            <polygon key={p.id}
              points={`${p.x},${py-p.rayon} ${p.x+p.rayon},${py} ${p.x},${py+p.rayon} ${p.x-p.rayon},${py}`}
              fill={p.color} stroke="#d97706" strokeWidth={0.6} opacity={0.85}/>
          );
        })}

        {/* Label porosité */}
        {progress > 0.9 && lambda > 0.8 && (
          <>
            <line x1={100} y1={SVG_H-filmH*0.5} x2={100} y2={SVG_H-filmH-12}
              stroke="#6b7280" strokeWidth={0.8} strokeDasharray="3 2"/>
            <text x={100} y={SVG_H-filmH-16} textAnchor="middle"
              fontSize={10} fill="#6b7280" fontStyle="italic">Porosité</text>
          </>
        )}

        {/* Étiquette état */}
        <rect x={0} y={0} width={SVG_W} height={18} fill="rgba(248,250,252,0.85)"/>
        <text x={10} y={13} fontSize={10} fill="#475569" fontWeight="600">
          {progress === 0 ? 'État initial — peinture humide' :
           progress < 0.25 ? "Début de l'évaporation de l'eau..." :
           progress < 0.5  ? 'Évaporation en cours — concentration croissante...' :
           progress < 0.75 ? 'Coalescence de la résine — déploiement des chaînes polymères...' :
           progress < 0.95 ? 'Formation du film sec...' :
           `Film sec — aspect ${props.aspect} (λ = ${props.lambda})`}
        </text>

        {/* Indicateur niveau solvant */}
        {progress < 0.95 && (
          <>
            <line x1={SVG_W-8} y1={SVG_H-solvantH} x2={SVG_W-2} y2={SVG_H-solvantH}
              stroke="#3b82f6" strokeWidth={1.5}/>
            <text x={SVG_W-10} y={SVG_H-solvantH-3}
              textAnchor="end" fontSize={9} fill="#3b82f6">
              Eau ({Math.round((1-progress)*100)}%)
            </text>
          </>
        )}
      </svg>

      {/* Légende */}
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8,fontSize:11,
        color:'var(--color-text-secondary)'}}>
        {[
          {label:'Eau (solvant)', bg:'rgba(96,165,250,0.35)', border:'#93c5fd', shape:'rect'},
          {label:'Résine (liant)', bg:ROLE_COLORS.Liant, border:ROLE_COLORS.Liant, shape:'line'},
          {label:'Pigments (TiO₂...)', bg:ROLE_COLORS.Pigment, border:'#991b1b', shape:'circle'},
          {label:'Charges (CaCO₃...)', bg:ROLE_COLORS.Charge, border:'#6b7280', shape:'circle'},
        ].map(({label,bg,border,shape})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:5}}>
            {shape==='rect' && <div style={{width:18,height:10,background:bg,border:`1px solid ${border}`,borderRadius:2}}/>}
            {shape==='circle' && <div style={{width:12,height:12,borderRadius:'50%',background:bg,border:`1px solid ${border}`}}/>}
            {shape==='line' && <div style={{width:20,height:3,background:bg,borderRadius:2}}/>}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────
// Animation séchage v6 — particules repoussées sous le segment local

export function placerSansChevauchement(nb, r, SVG_W, marge=2) {
  const places = [];
  let essais = 0;
  while (places.length < nb && essais < nb*80) {
    essais++;
    const x = r+marge+Math.random()*(SVG_W-2*r-2*marge);
    const yRel = Math.random();
    let ok = true;
    for (const p of places) {
      const dy=(yRel-p.yRel)*160, dx=x-p.x;
      if (Math.sqrt(dx*dx+dy*dy)<r+p.r+marge){ok=false;break;}
    }
    if (ok) places.push({x,yRel,r});
  }
  return places;
}

export function genFils(nb, SVG_W) {
  const fils = [];
  for (let i=0; i<nb; i++) {
    const cx = 60+(i/nb)*(SVG_W-120)+(Math.random()-0.5)*60;
    const cyRel = 0.15+Math.random()*0.65;
    const nbPts=24, segLen=10;
    const repos=[];
    let px=cx, pyRel=cyRel, angle=Math.random()*Math.PI*2;
    for (let j=0;j<nbPts;j++) {
      repos.push({x:px,yRel:pyRel});
      angle+=(Math.random()-0.5)*3.5+Math.PI*0.3;
      px+=Math.cos(angle)*segLen; pyRel+=Math.sin(angle)*segLen/160;
      px+=(cx-px)*0.18; pyRel+=(cyRel-pyRel)*0.18;
      px=Math.max(8,Math.min(SVG_W-8,px));
      pyRel=Math.max(0.02,Math.min(0.96,pyRel));
    }
    const totalLen=nbPts*segLen;
    const xStart=Math.max(10,cx-totalLen*0.5), xEnd=Math.min(SVG_W-10,cx+totalLen*0.5);
    const ampV=0.04+Math.random()*0.04, freqV=2+Math.random()*2, phaseV=Math.random()*Math.PI*2;
    const cible=repos.map((_,j)=>({
      x:xStart+j/(nbPts-1)*(xEnd-xStart),
      yRel:cyRel+Math.sin(j/(nbPts-1)*Math.PI*freqV+phaseV)*ampV,
    }));
    const vitesses=repos.map(()=>({vx:(Math.random()-0.5)*0.3,vyRel:(Math.random()-0.5)*0.001}));
    fils.push({id:i,repos,cible,vitesses,cx,cyRel});
  }
  return fils;
}

export function genParticules(SVG_W, nbPig, nbCh, lambdaClamp) {
  const rPig = 6;
  const rCh  = 8;
  const pigments=placerSansChevauchement(nbPig,rPig,SVG_W).map((p,i)=>({...p,id:'pig'+i,fill:'#dc2626',stroke:'#991b1b',r:rPig}));
  const charges =placerSansChevauchement(nbCh, rCh, SVG_W,1).map((p,i)=>({...p,id:'ch'+i, fill:'white',stroke:'#9ca3af',r:rCh}));
  return {pigments,charges};
}

// Animation du séchage d'une peinture à l'eau (liant en émulsion = latex), en trois temps :
//  1. l'eau s'évapore ; les particules (latex, pigments, charges) sont dispersées et agitées (mouvement brownien) ;
//  2. elles se concentrent et viennent au contact (empilement compact), l'eau restant entre elles ;
//  3. au-dessus de la TMFF, les particules de latex se déforment et fusionnent (coalescence, interdiffusion des chaînes à travers
//     leurs frontières) : le liant devient continu et enrobe les pigments. Si λ > 1 (CPV > CPVC), il n'y a pas assez de liant
//     pour remplir les vides entre les grains : il reste de l'air, le film est poreux.
// La rugosité de la surface croît avec λ (les grains affleurent), d'où la lumière diffusée d'un film mat.
const CPVC_ANIM = 0.45;   // valeur typique, pour fixer la proportion de grains dessinés
function rngAnim(g) { let a = g >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function AnimationSechageTest({ lambda, progress, hasPigments=true, hasCharges=true, hasLiant=true, hasCoalescence=false, showRayons=false }) {
  const SVG_W = 600, SVG_H = 160, SUPPORT_H = 20, TOTAL_H = SVG_H + SUPPORT_H + 10;
  const yBase = SVG_H, R = 7, PAS = 14, RANGS = 3, FILM_FINAL = 38;
  const lam = Math.max(0, Math.min(1.6, isFinite(lambda) ? lambda : 0));

  // Hauteur de la couche humide : de toute la hauteur au film sec
  const hFilm = Math.max(FILM_FINAL, SVG_H * (1 - progress * 0.9));
  const yTop = yBase - hFilm;
  const alphaEau = Math.max(0, (1 - progress) * 0.5);
  // Les trois temps
  const tContact = lisse(0.45, 0.62, progress);       // l'eau qui s'évapore concentre les particules, jusqu'au contact
  const tDeform = lisse(0.6, 0.78, progress);         // déformation des particules de latex
  const tCoal = lisse(0.78, 0.97, progress);          // coalescence : frontières qui disparaissent

  // Les places des grains dans le film sec : empilement compact (3 rangées décalées)
  const grains = useMemo(() => {
    const r = rngAnim(17), places = [];
    for (let k = 0; k < RANGS; k++) for (let x = R + 2 + (k % 2) * PAS / 2; x < SVG_W - R - 2; x += PAS) places.push({ x, y: yBase - R - 1 - k * 12 });
    for (let i = places.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [places[i], places[j]] = [places[j], places[i]]; }
    // Proportion de grains (pigments + charges) d'après λ ; liant : ce qu'il faut pour remplir les vides, ou moins si λ > 1
    const cpv = Math.max(0.06, Math.min(0.8, lam * CPVC_ANIM));
    const nPulv = (hasPigments || hasCharges) ? Math.round(places.length * cpv) : 0;
    const besoin = places.length - nPulv;
    const rapport = lam <= 1 ? 1 : ((1 - cpv) / cpv) / ((1 - CPVC_ANIM) / CPVC_ANIM);   // liant présent / liant nécessaire
    const nLatex = hasLiant ? Math.round(besoin * Math.min(1, rapport)) : 0;
    const partPig = hasPigments && hasCharges ? 0.4 : hasPigments ? 1 : 0;
    return places.map((p, i) => {
      const type = i < nPulv ? (i < Math.round(nPulv * partPig) ? 'pig' : 'ch') : i < nPulv + nLatex ? 'latex' : 'vide';
      return { ...p, type, x0: 10 + r() * (SVG_W - 20), y0rel: 0.05 + r() * 0.9, ph: r() * 6.28 };
    });
  }, [lam, hasPigments, hasCharges, hasLiant]); // eslint-disable-line react-hooks/exhaustive-deps

  // Agitation brownienne pendant la dispersion
  const [tic, setTic] = useState(0);
  useEffect(() => {
    if (progress >= 0.6) return;
    const id = setInterval(() => setTic(t => t + 1), 90);
    return () => clearInterval(id);
  }, [progress >= 0.6]); // eslint-disable-line react-hooks/exhaustive-deps

  // La surface : rugosité croissante avec λ (les grains affleurent)
  const amp = lam * progress * 5;
  const segPts = useMemo(() => {
    const N = 120, res = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * SVG_W, t = i / N;
      const dy = Math.sin(t * Math.PI * 7.4 + 0.7) * amp * 0.35 + Math.sin(t * Math.PI * 14.6 + 1.3) * amp * 0.30 + Math.sin(t * Math.PI * 22.2 + 2.1) * amp * 0.20 + Math.sin(t * Math.PI * 31.8 + 0.4) * amp * 0.15;
      res.push([x, Math.min(yTop + dy, yBase - 10)]);
    }
    return res;
  }, [progress, lambda]); // eslint-disable-line react-hooks/exhaustive-deps
  const segPath = segPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const fillPath = [`M 0,${yBase}`, `L 0,${segPts[0][1].toFixed(2)}`, ...segPts.map(([x, y]) => `L ${x.toFixed(2)},${y.toFixed(2)}`), `L ${SVG_W},${yBase}`, 'Z'].join(' ');

  // Position courante d'un grain : dispersé dans la couche humide, puis à sa place dans l'empilement
  const position = g => {
    const jit = (1 - tContact) * 3;
    const xd = g.x0 + Math.sin(tic * 0.7 + g.ph) * jit, yd = yTop + R + 1 + g.y0rel * Math.max(0, hFilm - 2 * R - 3) + Math.cos(tic * 0.9 + g.ph) * jit;
    return [xd + (g.x - xd) * tContact, yd + (g.y - yd) * tContact];
  };
  const latex = grains.filter(g => g.type === 'latex'), poudres = grains.filter(g => g.type === 'pig' || g.type === 'ch'), vides = grains.filter(g => g.type === 'vide');
  const poreux = lam > 1 && hasLiant;

  const rayonsData = useMemo(() => {
    if (!showRayons || segPts.length === 0) return [];
    const r = rngAnim(5);
    return [0.1, 0.25, 0.42, 0.63, 0.82].map(xRel => {
      const x = xRel * SVG_W, idx = xRel * (segPts.length - 1), i0 = Math.floor(idx), i1 = Math.min(segPts.length - 1, i0 + 1);
      const ySurf = segPts[i0][1] * (1 - (idx - i0)) + segPts[i1][1] * (idx - i0);
      const dispersion = lam * 70 * (Math.PI / 180);
      return { x, ySurf, angleReflechi: -Math.PI / 4 + (r() - 0.5) * dispersion * 2 };
    });
  }, [showRayons, segPts]); // eslint-disable-line react-hooks/exhaustive-deps

  const etapeTxt = progress <= 0 ? '' : progress < 0.6 ? '1. L’eau s’évapore : les particules se rapprochent (agitation brownienne)'
    : progress < 0.78 ? '2. Les particules se touchent et se déforment, l’eau restant entre elles'
      : progress < 0.97 ? '3. Coalescence : les particules de latex fusionnent' : '';
  return (
    <svg width="100%" viewBox={`0 0 ${SVG_W} ${TOTAL_H}`} style={{ borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#f8fafc', maxWidth: 760, display: 'block', margin: '0 auto' }}>
      <rect x={0} y={SVG_H} width={SVG_W} height={SUPPORT_H} rx={2} fill="#4b5563"/>
      <text x={SVG_W / 2} y={SVG_H + 14} textAnchor="middle" fontSize={10} fill="#9ca3af" fontStyle="italic">Support</text>
      {/* l'eau */}
      {alphaEau > 0.01 && <path d={fillPath} fill={`rgba(59,130,246,${alphaEau.toFixed(3)})`}/>}
      {/* les particules de latex : rondes, puis déformées, puis fondues dans un liant continu */}
      {latex.map((g, i) => { const [x, y] = position(g); return (
        <ellipse key={'l' + i} cx={x} cy={y} rx={R * (1 + 0.16 * tDeform)} ry={R * (1 - 0.12 * tDeform)} fill="#fed7aa"
          stroke="#ea580c" strokeWidth={1} strokeOpacity={1 - tCoal}/>); })}
      {tCoal > 0 && hasLiant && <path d={fillPath} fill="#fed7aa" opacity={tCoal}/>}
      {/* les vides d'air, quand le liant ne suffit pas (λ > 1) */}
      {poreux && tCoal > 0 && vides.map((g, i) => <circle key={'v' + i} cx={g.x} cy={g.y} r={R - 1} fill="white" stroke="#94a3b8" strokeDasharray="2 2" opacity={tCoal}/>)}
      {/* l'agent de coalescence, qui quitte le film en dernier */}
      {hasCoalescence && [0.12, 0.28, 0.44, 0.6, 0.76, 0.88].map((xRel, i) => {
        const x = xRel * SVG_W, yDepart = yTop + (0.4 + (i % 3) * 0.2) * hFilm;
        const py = yDepart - lisse(0.72, 0.95, progress) * (yDepart - yTop + 45);
        const op = py < yTop ? Math.max(0, 1 - (yTop - py) / 40) : 1;   // sorti du film, il s'évapore
        if (op <= 0) return null;
        return <polygon key={'c' + i} points={`${x},${py - 5} ${x + 5},${py} ${x},${py + 5} ${x - 5},${py}`} fill="#fbbf24" stroke="#d97706" strokeWidth={0.8} opacity={op}/>;
      })}
      {/* pigments et charges */}
      {poudres.map((g, i) => { const [x, y] = position(g); return g.type === 'pig'
        ? <circle key={'p' + i} cx={x} cy={y} r={R - 1} fill="#dc2626" fillOpacity={0.92} stroke="#991b1b" strokeWidth={0.8}/>
        : <circle key={'c' + i} cx={x} cy={y} r={R} fill="white" fillOpacity={0.9} stroke="#9ca3af" strokeWidth={0.8}/>; })}
      {/* la surface */}
      {alphaEau > 0.01 && <>
        <path d={segPath} fill="none" stroke="#1d4ed8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        <line x1={0} y1={segPts[0][1]} x2={0} y2={yBase} stroke="#1d4ed8" strokeWidth={1.5}/>
        <line x1={SVG_W} y1={segPts[segPts.length - 1][1]} x2={SVG_W} y2={yBase} stroke="#1d4ed8" strokeWidth={1.5}/>
      </>}
      {alphaEau <= 0.01 && <path d={segPath} fill="none" stroke="#9a3412" strokeWidth={1.5}/>}
      {/* rayons lumineux : réflexion nette sur un film lisse, diffuse sur un film rugueux */}
      {showRayons && rayonsData.map((r, i) => {
        const L = 55, xInc = r.x - L * Math.cos(Math.PI / 4), yInc = r.ySurf - L * Math.sin(Math.PI / 4);
        const xRef = r.x + L * Math.cos(-r.angleReflechi), yRef = r.ySurf - L * Math.sin(Math.abs(r.angleReflechi));
        const xMid = r.x - (L / 2) * Math.cos(Math.PI / 4), yMid = r.ySurf - (L / 2) * Math.sin(Math.PI / 4), a = Math.PI / 4, s = 7;
        return (
          <g key={'r' + i}>
            <line x1={xInc} y1={yInc} x2={r.x} y2={r.ySurf} stroke="#f59e0b" strokeWidth={2}/>
            <polygon points={`${xMid + s * Math.cos(a)},${yMid + s * Math.sin(a)} ${xMid + s * Math.cos(a + 2.4)},${yMid + s * Math.sin(a + 2.4)} ${xMid + s * Math.cos(a - 2.4)},${yMid + s * Math.sin(a - 2.4)}`} fill="#f59e0b"/>
            <defs><marker id={`fl-ref-${i}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><polygon points="0,0 6,3 0,6" fill="#ef4444"/></marker></defs>
            <line x1={r.x} y1={r.ySurf} x2={xRef} y2={yRef} stroke="#ef4444" strokeWidth={2} markerEnd={`url(#fl-ref-${i})`}/>
          </g>
        );
      })}
      {/* textes */}
      {etapeTxt && <text x={10} y={14} fontSize={11} fontWeight="600" fill="#334155">{etapeTxt}</text>}
      {alphaEau > 0.05 && <text x={SVG_W - 6} y={Math.max(24, yTop - 5)} textAnchor="end" fontSize={9} fill="#3b82f6">{Math.round((1 - progress) * 100)}% eau</text>}
      {progress >= 0.97 && (
        <text x={10} y={14} fontSize={11} fontWeight="600" fill={lambda < 0.5 ? '#2a9d8f' : lambda > 0.8 ? '#e63946' : '#e9a824'}>
          {lambda < 0.5 ? 'Film brillant — surface lisse' : lambda > 1 ? 'Film mat et poreux — le liant ne remplit pas tous les vides (λ > 1)'
            : lambda > 0.8 ? 'Film mat — les grains affleurent : surface rugueuse' : 'Film satiné — légères irrégularités'}
        </text>
      )}
    </svg>
  );
}

export function PeintureExploration({ plotlyReady }) {
  const [mps, setMps] = useState(MP_DEFAUT.map(m=>({...m})));
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [carteOuverte, setCarteOuverte] = useState(null); // index MP
  const [etatAdditif, setEtatAdditif] = useState({}); // {i: 'liquide'|'solide'}
  const [showFormules, setShowFormules] = useState(false);
  const playRef=useRef(null), startRef=useRef(null), startPRef=useRef(0);
  const [showRayons, setShowRayons] = useState(false);
  const [ouverts, setOuverts] = useState({ anim: true, film: false });
  // Formation du film (TMFF) : température d'application, efficacité supposée du coalescent, animation du latex
  const [T, setT] = useState(20), [efficacite, setEfficacite] = useState(3);
  const [progFilm, setProgFilm] = useState(0), [animFilm, setAnimFilm] = useState(false);
  useEffect(() => {
    if (!animFilm) return;
    const t0 = performance.now(); let id;
    const pas = now => { const x = Math.min(1, (now - t0) / 6000); setProgFilm(x); if (x < 1) id = requestAnimationFrame(pas); else setAnimFilm(false); };
    id = requestAnimationFrame(pas); return () => cancelAnimationFrame(id);
  }, [animFilm]);

  const props = calculerProprietes(mps);
  const lambda = parseFloat(props.lambda);
  // ── Formation du film : TMFF de la peinture et COV ──
  const liants = mps.filter(m => m.role === 'Liant' && (m.masse || 0) > 0);
  const mPolySec = liants.reduce((a, m) => a + (m.masse || 0) * (m.es || 0) / 100, 0);
  const tmffResine = liants.length ? liants.reduce((a, m) => a + (m.tmff ?? NaN) * (m.masse || 0) * (m.es || 0) / 100, 0) / (mPolySec || 1) : NaN;
  const coalescents = mps.filter(m => m.role === 'Additif' && m.coalescent && (m.masse || 0) > 0);
  const mCoal = coalescents.reduce((a, m) => a + (m.masse || 0), 0);
  const pctCoal = mPolySec > 0 ? mCoal / mPolySec * 100 : 0;
  const tmffPeinture = tmffResine - efficacite * pctCoal;
  const densiteDe = m => ((m.role === 'Pigment' || m.role === 'Charge') ? m.densiteApp : (m.densite || m.densiteApp));
  const densiteManquante = mps.filter(m => (m.masse || 0) > 0 && !densiteDe(m)).map(m => m.nom);
  const volPeinture = mps.reduce((a, m) => a + (densiteDe(m) ? (m.masse || 0) / densiteDe(m) : 0), 0);
  const COV = !densiteManquante.length && volPeinture > 0 ? mCoal / (volPeinture / 1000) : NaN;
  const aspectColor = lambda<0.5?'#2a9d8f':lambda>0.8?'#e63946':'#e9a824';
  const aspectBg    = lambda<0.5?'#e8f8f5':lambda>0.8?'#fff0f0':'#fffbe6';

  useEffect(()=>{
    if (!playing){cancelAnimationFrame(playRef.current);return;}
    startRef.current=performance.now();
    startPRef.current=progress>=1?0:progress;
    if (progress>=1) setProgress(0);
    function step(now){
      const newP=Math.min(1,startPRef.current+(now-startRef.current)/12000);
      setProgress(newP);
      if (newP<1) playRef.current=requestAnimationFrame(step);
      else setPlaying(false);
    }
    playRef.current=requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(playRef.current);
  },[playing]);

  function reset(){setPlaying(false);setProgress(0);}

  function updateMP(i,field,val){
  setMps(prev=>{
    const n=prev.map(m=>({...m}));
    let parsed = parseFloat(val);
    if (field==='masse') parsed = Math.max(0, parsed||0);
    n[i][field]=val===''||isNaN(parsed)?null:parsed;
    return n;
  });
  reset();
}
  function updateStr(i,field,val){
    setMps(prev=>{const n=prev.map(m=>({...m}));n[i][field]=val;return n;});
    reset();
  }
  function ajouterMP(){
    setMps(prev=>[...prev,{nom:'Nouvelle MP',role:'Pigment',es:null,densite:null,densiteApp:null,ph_g:null,ph_mL:null,masse:0}]);
    reset();
  }
  function supprimerMP(i){
    setMps(prev=>prev.filter((_,j)=>j!==i));
    if (carteOuverte===i) setCarteOuverte(null);
    reset();
  }

  const inp={fontSize:12,padding:'3px 6px',border:'1.5px solid #b39ddb',borderRadius:4,
    background:'#fffde7',color:'var(--color-text-primary)'};

  // ── Carte d'identité selon le rôle ──
  function CarteIdentite({i, mp}) {
    const etat = etatAdditif[i] || 'liquide';
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,
        background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',
        alignItems:'center',justifyContent:'center'}}
        onClick={()=>setCarteOuverte(null)}>
        <div style={{background:'white',borderRadius:14,
          padding:'20px 24px',maxWidth:340,width:'90%',boxShadow:'0 8px 40px rgba(0,0,0,0.25)',
          border:`2px solid ${ROLE_COLORS[mp.role]||'#ddd'}`}}
          onClick={e=>e.stopPropagation()}>
          {/* En-tête */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <div style={{width:12,height:12,borderRadius:'50%',background:ROLE_COLORS[mp.role]}}/>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{mp.nom}</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{mp.role}</div>
            </div>
            <button onClick={()=>setCarteOuverte(null)}
              style={{marginLeft:'auto',background:'none',border:'none',fontSize:18,
                cursor:'pointer',color:'var(--color-text-secondary)'}}>✕</button>
          </div>

          {/* Champs selon rôle */}
          <div style={{display:'flex',flexDirection:'column',gap:10}}>

            {/* SOLVANT */}
            {mp.role==='Solvant' && (
              <div>
                <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                  Densité (g/mL)
                </label>
                <input type="number" value={mp.densite??''} onChange={e=>updateMP(i,'densite',e.target.value)}
                  style={{...inp,width:120}} placeholder="ex: 1.00"/>
              </div>
            )}

            {/* PIGMENT ou CHARGE */}
            {(mp.role==='Pigment'||mp.role==='Charge') && (<>
              <div>
                <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                  Densité vraie (g/mL)
                </label>
                <input type="number" value={mp.densiteApp??''} onChange={e=>updateMP(i,'densiteApp',e.target.value)}
                  style={{...inp,width:120}} placeholder="ex: 4.1"/>
              </div>
              <div>
                <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:6}}>
                  Unité de la prise d'huile :
                </label>
                <div style={{display:'flex',gap:12,marginBottom:8}}>
                  {[['g','g / 100 g'],['mL','mL / 100 g']].map(([val,label])=>(
                    <label key={val} style={{display:'flex',alignItems:'center',gap:5,
                      fontSize:12,cursor:'pointer'}}>
                      <input type="radio"
                        checked={(mp.ph_g!==null&&mp.ph_g!==undefined&&val==='g')||((!mp.ph_g&&mp.ph_g!==0)&&val==='mL')}
                        onChange={()=>{
                          if (val==='g') {
                            // Convertir ph_mL → ph_g si nécessaire
                            if (mp.ph_mL) updateMP(i,'ph_g', (mp.ph_mL*0.93).toFixed(2));
                            updateMP(i,'ph_mL', '');
                          } else {
                            // Convertir ph_g → ph_mL si nécessaire
                            if (mp.ph_g) updateMP(i,'ph_mL', (mp.ph_g/0.93).toFixed(2));
                            updateMP(i,'ph_g', '');
                          }
                        }}/>
                      {label}
                    </label>
                  ))}
                </div>
                {(mp.ph_g!==null&&mp.ph_g!==undefined) ? (
                  <div>
                    <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                      Prise d'huile (g / 100 g)
                    </label>
                    <input type="number" value={mp.ph_g??''} onChange={e=>updateMP(i,'ph_g',e.target.value)}
                      style={{...inp,width:120}} placeholder="ex: 19"/>
                    <div style={{fontSize:10,color:'#64748b',marginTop:3}}>
                      ≈ {mp.ph_g ? (mp.ph_g/0.93).toFixed(1) : '—'} mL/100g (ρ huile = 0,93 g/mL)
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                      Prise d'huile (mL / 100 g)
                    </label>
                    <input type="number" value={mp.ph_mL??''} onChange={e=>updateMP(i,'ph_mL',e.target.value)}
                      style={{...inp,width:120}} placeholder="ex: 36"/>
                    <div style={{fontSize:10,color:'#64748b',marginTop:3}}>
                      ≈ {mp.ph_mL ? (mp.ph_mL*0.93).toFixed(1) : '—'} g/100g (ρ huile = 0,93 g/mL)
                    </div>
                  </div>
                )}
              </div>
            </>)}

            {/* LIANT */}
            {mp.role==='Liant' && (<>
              <div>
                <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                  Extrait sec ES (%)
                </label>
                <input type="number" value={mp.es??''} onChange={e=>updateMP(i,'es',e.target.value)}
                  style={{...inp,width:120}} placeholder="ex: 50"/>
              </div>
              <div>
                <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                  Densité sèche (g/mL) <span style={{color:'#aaa',fontSize:10}}>(défaut : 1,03)</span>
                </label>
                <input type="number" value={mp.densiteSec??''} onChange={e=>updateMP(i,'densiteSec',e.target.value)}
                  style={{...inp,width:120}} placeholder="1.03"/>
              </div>
              <div>
                <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                  TMFF de la résine (°C) <span style={{color:'#aaa',fontSize:10}}>(fiche technique)</span>
                </label>
                <input type="number" value={mp.tmff??''} onChange={e=>updateMP(i,'tmff',e.target.value)}
                  style={{...inp,width:120}} placeholder="ex: 20"/>
              </div>
            </>)}

            {/* ADDITIF */}
            {mp.role==='Additif' && (<>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,cursor:'pointer'}}>
                <input type="checkbox" checked={!!mp.coalescent}
                  onChange={e=>setMps(prev=>prev.map((m,j)=>j===i?{...m,coalescent:e.target.checked,es:e.target.checked?0:m.es}:m))}/>
                Agent de coalescence (volatil : extrait sec nul, compté dans les COV)
              </label>
              <div style={{display:'flex',gap:8,marginBottom:4}}>
                {['liquide','solide'].map(e=>(
                  <button key={e} onClick={()=>setEtatAdditif(prev=>({...prev,[i]:e}))}
                    style={{padding:'4px 14px',borderRadius:6,border:'none',cursor:'pointer',
                      fontSize:12,fontWeight:500,
                      background:etat===e?ROLE_COLORS.Additif:'var(--color-background-secondary)',
                      color:etat===e?'white':'var(--color-text-secondary)'}}>
                    {e.charAt(0).toUpperCase()+e.slice(1)}
                  </button>
                ))}
              </div>
              {etat==='liquide' && (<>
                <div>
                  <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                    Extrait sec ES (%) — 100% si liquide pur
                  </label>
                  <input type="number" value={mp.es??''} onChange={e=>updateMP(i,'es',e.target.value)}
                    style={{...inp,width:120}} placeholder="ex: 40"/>
                </div>
                <div>
                  <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                    Densité du liquide (g/mL)
                  </label>
                  <input type="number" value={mp.densite??''} onChange={e=>updateMP(i,'densite',e.target.value)}
                    style={{...inp,width:120}} placeholder="ex: 1.22"/>
                </div>
              </>)}
              {etat==='solide' && (
                <div>
                  <label style={{fontSize:12,color:'var(--color-text-secondary)',display:'block',marginBottom:3}}>
                    Densité vraie du solide (g/mL)
                  </label>
                  <input type="number" value={mp.densiteApp??''} onChange={e=>updateMP(i,'densiteApp',e.target.value)}
                    style={{...inp,width:120}} placeholder="ex: 1.5"/>
                </div>
              )}
            </>)}
          </div>

          {/* Résumé valeurs */}
          <div style={{marginTop:14,padding:'8px 10px',background:'var(--color-background-secondary)',
            borderRadius:8,fontSize:11,color:'var(--color-text-secondary)',lineHeight:1.8}}>
            {mp.densiteApp && <div>Densité vraie : <strong>{mp.densiteApp}</strong> g/mL</div>}
            {mp.densite    && <div>Densité : <strong>{mp.densite}</strong> g/mL</div>}
            {mp.es         && <div>ES : <strong>{mp.es}</strong> %</div>}
            {mp.ph_g       && <div>PH : <strong>{mp.ph_g}</strong> g/100g</div>}
            {mp.ph_mL      && <div>PH : <strong>{mp.ph_mL}</strong> mL/100g</div>}
            {mp.densiteSec && <div>Densité sèche : <strong>{mp.densiteSec}</strong> g/mL</div>}
          </div>
        </div>
      </div>
    );
  }

  // ── Popup formules ──
  function PopupFormules() {
    return (
      <div style={{fontSize:12,lineHeight:2,color:'var(--color-text-primary)'}}>

            {/* ES */}
            <div style={{fontWeight:600,color:'#0369a1',marginBottom:6}}>Extrait sec (ES)</div>
            <div style={{background:'#f0f9ff',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span>ES =</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #0369a1',paddingBottom:2,fontSize:11}}>
                    m<sub>pulv</sub> + m<sub>liant</sub>×ES<sub>liant</sub> + Σm<sub>add</sub>×ES<sub>add</sub>
                  </span>
                  <span style={{paddingTop:2,fontSize:11}}>m<sub>totale</sub></span>
                </span>
                <span>× 100</span>
              </div>
            </div>

            {/* CPV */}
            <div style={{fontWeight:600,color:'#7e22ce',marginBottom:6}}>CPV — Concentration Pigmentaire Volumique</div>
            <div style={{background:'#faf5ff',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}>
                <span>CPV =</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #7e22ce',paddingBottom:2,fontSize:11}}>
                    V<sub>pulv</sub>
                  </span>
                  <span style={{paddingTop:2,fontSize:11}}>V<sub>pulv</sub> + V<sub>liant sec</sub></span>
                </span>
                <span>× 100</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>avec</span>
                <span>V<sub>pulv</sub> = Σ</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #7e22ce',paddingBottom:2,fontSize:11}}>m<sub>i</sub></span>
                  <span style={{paddingTop:2,fontSize:11}}>ρ<sub>i</sub></span>
                </span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>et</span>
                <span>V<sub>liant sec</sub> =</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #7e22ce',paddingBottom:2,fontSize:11}}>
                    m<sub>liant</sub> × ES<sub>liant</sub>
                  </span>
                  <span style={{paddingTop:2,fontSize:11}}>ρ<sub>liant sec</sub></span>
                </span>
              </div>
            </div>

            {/* CPVC */}
            <div style={{fontWeight:600,color:'#a855f7',marginBottom:6}}>CPVC — CPV Critique</div>
            <div style={{background:'#faf5ff',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}>
                <span>CPVC =</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #a855f7',paddingBottom:2,fontSize:11}}>
                    V<sub>pulv</sub>
                  </span>
                  <span style={{paddingTop:2,fontSize:11}}>V<sub>pulv</sub> + V<sub>huile lin</sub></span>
                </span>
                <span>× 100</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>avec</span>
                <span>V<sub>huile lin</sub> =</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #a855f7',paddingBottom:2,fontSize:11}}>
                    Σ (m<sub>i</sub> × PH<sub>i</sub> / 100)
                  </span>
                  <span style={{paddingTop:2,fontSize:11}}>ρ<sub>huile lin</sub></span>
                </span>
              </div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>
                ρ<sub>huile lin</sub> = 0,93 g/mL
              </div>
            </div>

            {/* Lambda */}
            <div style={{fontWeight:600,color:'#6b21a8',marginBottom:6}}>Lambda (λ)</div>
            <div style={{background:'#faf5ff',borderRadius:8,padding:'10px 14px',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:6}}>
                <span>λ =</span>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                  <span style={{borderBottom:'1.5px solid #6b21a8',paddingBottom:2,fontSize:11}}>CPV</span>
                  <span style={{paddingTop:2,fontSize:11}}>CPVC</span>
                </span>
              </div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',lineHeight:1.8}}>
                λ &lt; 0,5 → film <strong>brillant</strong><br/>
                0,5 ≤ λ ≤ 0,8 → film <strong>satiné</strong><br/>
                λ &gt; 0,8 → film <strong>mat</strong>
              </div>
            </div>

            {/* Valeurs actuelles */}
            <div style={{fontSize:11,color:'var(--color-text-secondary)',
              background:'var(--color-background-secondary)',borderRadius:6,padding:'8px 10px'}}>
              Valeurs actuelles : V<sub>pulv</sub> = {props.volPigments} mL,{' '}
              V<sub>liant sec</sub> = {props.volLiantSec} mL,{' '}
              V<sub>huile</sub> = {props.volHuile} mL
            </div>
          </div>
    );
  }

  return (
    <div>

      {/* Popups */}
      {carteOuverte!==null && mps[carteOuverte] && CarteIdentite({ i: carteOuverte, mp: mps[carteOuverte] })}
      {showFormules && PopupFormules()}

      {/* ── LIGNE 1 : Tableau | Résultats ── */}
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.7fr) minmax(260px,1fr)',gap:16,marginBottom:14}}>

        {/* Colonne gauche : tableau */}
        <div>
          <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:'var(--color-text-secondary)'}}>
            Formulation
          </div>
          <table style={{borderCollapse:'collapse',fontSize:12,width:'100%'}}>
            <thead>
              <tr style={{background:'var(--color-background-secondary)'}}>
                {[['Matière première',''],['Rôle',''],['Masse (g)',''],
                  ['ES (%)','Extrait sec : liant et additifs (0 pour un solvant ou un agent de coalescence, 100 pour une poudre)'],
                  ['ρ (g/mL)','Solvant et additif : densité du liquide ; pigment et charge : masse volumique vraie ; liant : densité sèche'],
                  ['Prise d\'huile (g/100 g)','Pigments et charges'],['','']].map(([h,t])=>(
                  <th key={h||'x'} title={t} style={{padding:'5px 7px',borderBottom:'1.5px solid var(--color-border-tertiary)',
                    textAlign:'left',fontWeight:600,fontSize:11,color:'var(--color-text-secondary)',cursor:t?'help':'default'}}>{h}{t?' ⓘ':''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mps.map((mp,i)=>(
                <tr key={i} style={{borderLeft:`3px solid ${ROLE_COLORS[mp.role]||'#ddd'}`,
                  background:i%2?'var(--color-background-secondary)':'transparent'}}>
                  <td style={{padding:'3px 7px',minWidth:110}}>
                    <input value={mp.nom} onChange={e=>updateStr(i,'nom',e.target.value)}
                      style={{...inp,width:110,fontSize:11}}/>
                  </td>
                  <td style={{padding:'3px 5px'}}>
                    <select value={mp.role} onChange={e=>updateStr(i,'role',e.target.value)}
                      style={{...inp,fontSize:11,width:72}}>
                      {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{padding:'3px 5px'}}>
                    <input type="number" value={mp.masse??''} min={0}
                      onChange={e=>updateMP(i,'masse',e.target.value)}
                      style={{...inp,width:60,fontSize:11}}/>
                  </td>
                  {/* Propriétés modifiables directement dans le tableau (le détail reste dans la fiche 🔍) */}
                  <td style={{padding:'3px 5px'}}>
                    {(mp.role==='Liant'||mp.role==='Additif')
                      ? <input type="number" value={mp.es??''} aria-label={`Extrait sec de ${mp.nom}`} disabled={!!mp.coalescent}
                          onChange={e=>updateMP(i,'es',e.target.value)} style={{...inp,width:52,fontSize:11,opacity:mp.coalescent?0.6:1}}/>
                      : <span style={{fontSize:11,color:'#94a3b8'}}>{mp.role==='Solvant'?'0':'100'}</span>}
                  </td>
                  <td style={{padding:'3px 5px'}}>
                    {(()=>{ const ch = mp.role==='Pigment'||mp.role==='Charge' ? 'densiteApp' : mp.role==='Liant' ? 'densiteSec' : (mp.role==='Additif' && etatAdditif[i]==='solide') ? 'densiteApp' : 'densite';
                      return <input type="number" step="0.01" value={mp[ch]??''} aria-label={`Densité de ${mp.nom}`} title={ch==='densiteSec'?'densité sèche':ch==='densiteApp'?'masse volumique vraie':'densité du liquide'}
                        onChange={e=>updateMP(i,ch,e.target.value)} style={{...inp,width:52,fontSize:11}}/>; })()}
                  </td>
                  <td style={{padding:'3px 5px'}}>
                    {(mp.role==='Pigment'||mp.role==='Charge')
                      ? <input type="number" value={mp.ph_g ?? (mp.ph_mL ? +(mp.ph_mL*RHO_HUILE).toFixed(1) : '')} aria-label={`Prise d'huile de ${mp.nom}`}
                          onChange={e=>{ updateMP(i,'ph_g',e.target.value); updateMP(i,'ph_mL',''); }} style={{...inp,width:52,fontSize:11}}/>
                      : <span style={{fontSize:11,color:'#94a3b8'}}>—</span>}
                  </td>
                  <td style={{padding:'3px 5px',whiteSpace:'nowrap'}}>
                    <button onClick={()=>setCarteOuverte(i)}
                      title="Carte d'identité"
                      style={{background:'none',border:'none',cursor:'pointer',fontSize:14,padding:'0 3px'}}>🔍</button>
                    <button onClick={()=>supprimerMP(i)}
                      style={{background:'none',border:'none',cursor:'pointer',fontSize:12,
                        color:'#dc2626',padding:'0 3px'}}>✕</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} style={{padding:'4px 7px'}}>
                  <button onClick={ajouterMP}
                    style={{fontSize:11,padding:'3px 10px',borderRadius:5,cursor:'pointer',
                      border:'1px solid #6a4c93',background:'#f3eeff',color:'#4a2c73'}}>
                    + Ajouter
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Colonne droite : résultats */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{fontWeight:600,fontSize:13,color:'var(--color-text-secondary)',
            display:'flex',alignItems:'center',gap:6}}>
            Résultats
            <button onClick={()=>setShowFormules(true)}
              title="Afficher les formules"
              style={{background:'none',border:'none',cursor:'pointer',fontSize:15,
                color:'#a855f7',padding:0}}>❓</button>
          </div>

          {/* ES */}
          <div style={{background:'#f0f9ff',border:'1.5px solid #38bdf8',borderRadius:10,padding:'10px 14px'}}>
            <div style={{fontSize:11,color:'#0369a1',fontWeight:500}}>Extrait sec (ES)</div>
            <div style={{fontSize:26,fontWeight:700,color:'#0369a1'}}>{props.ES} %</div>
            <div style={{fontSize:10,color:'#64748b',marginTop:2}}>
              {parseFloat(props.ES)>=50?'✓ monocouche possible':'✗ monocouche impossible'}
            </div>
          </div>

          {/* CPV / CPVC / λ */}
          <div style={{background:'#faf5ff',border:'1.5px solid #a855f7',borderRadius:10,padding:'10px 14px'}}>
            <div style={{fontSize:11,color:'#7e22ce',fontWeight:500,marginBottom:6}}>CPV — CPVC — λ</div>
            <div style={{display:'flex',gap:12}}>
              {[['CPV',props.CPV+'%','#7e22ce'],['CPVC',props.CPVC+'%','#a855f7'],['λ',props.lambda,'#6b21a8']].map(([l,v,c])=>(
                <div key={l}>
                  <div style={{fontSize:10,color:c}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Masse totale */}
          <div style={{fontSize:11,color:'var(--color-text-secondary)',textAlign:'right'}}>
            Masse totale : <strong>{props.masseTotale} g</strong>
          </div>
        </div>
      </div>

      {/* ── LIGNE 2 : Aspect du film ── */}
      <div style={{background:aspectBg,border:`1.5px solid ${aspectColor}`,
        borderRadius:12,padding:'12px 16px',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{fontSize:32}}>{props.aspect==='brillant'?'✨':props.aspect==='mat'?'🪨':'🔆'}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:15,color:aspectColor}}>
              Film {props.aspect.toUpperCase()} — λ = {props.lambda}
            </div>
            <div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:1}}>
              {props.aspect==='brillant'&&'λ < 0,5 — Résine en excès, surface lisse et réfléchissante.'}
              {props.aspect==='mat'&&(lambda>1
                ? 'λ > 1 — CPV > CPVC : le liant ne suffit plus à enrober les pigments ; surface rugueuse et film poreux.'
                : 'λ > 0,8 — Les pigments affleurent à la surface : surface rugueuse qui diffuse la lumière. (Le film ne devient poreux qu’au-delà de λ = 1.)')}
              {props.aspect==='satiné'&&'0,5 ≤ λ ≤ 0,8 — Résine partiellement suffisante, aspect intermédiaire.'}
            </div>
          </div>
          
        </div>
      </div>

      {/* ── LIGNE 3 : Animation ── */}
      <div style={{marginBottom:10, background:KIT.fond, border:`1px solid ${KIT.bord}`, borderRadius:10, padding:'10px 12px'}}>
        <Section titre="Animation du séchage et aspect du film" ouvert={ouverts.anim} onBascule={() => setOuverts(o => ({ ...o, anim: !o.anim }))}>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',
          marginBottom:10,padding:'8px 12px',
          background:'var(--color-background-secondary)',borderRadius:8}}>
          <button onClick={()=>setPlaying(v=>!v)}
            style={{padding:'6px 16px',borderRadius:8,border:'none',cursor:'pointer',
              fontSize:12,fontWeight:600,
              background:playing?'#e9a824':'#2a9d8f',color:'white'}}>
            {playing?'⏸ Pause':progress===0?'▶ Démarrer':progress>=1?'▶ Rejouer':'▶ Continuer'}
          </button>
          <button onClick={reset}
            style={{padding:'6px 10px',borderRadius:8,cursor:'pointer',fontSize:12,
              border:'1px solid var(--color-border-secondary)',
              background:'var(--color-background-primary)',color:'var(--color-text-secondary)'}}>
            ↺
          </button>
          <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:150}}>
            <span style={{fontSize:11,color:'var(--color-text-secondary)',whiteSpace:'nowrap'}}>Séchage :</span>
            <input type="range" min={0} max={100} value={Math.round(progress*100)}
              onChange={e=>{setPlaying(false);setProgress(Number(e.target.value)/100);}}
              style={{flex:1}}/>
            <span style={{fontSize:11,fontWeight:600,minWidth:28}}>{Math.round(progress*100)}%</span>
          </div>
        </div>

          {Math.round(progress*100) === 100 && (
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,
              cursor:'pointer',color:'var(--color-text-secondary)'}}>
              <input type="checkbox" checked={showRayons}
                onChange={e=>setShowRayons(e.target.checked)}/>
              ☀️ Tracer les rayons lumineux
            </label>
          )}
          {Math.round(progress*100) < 100 && showRayons && setShowRayons(false)}

        <AnimationSechageTest lambda={lambda} progress={progress}
          hasPigments={mps.some(m=>(m.role==='Pigment')&&(m.masse||0)>0)}
          hasCharges={mps.some(m=>(m.role==='Charge')&&(m.masse||0)>0)}
          hasLiant={mps.some(m=>m.role==='Liant'&&(m.masse||0)>0)}
          hasCoalescence={mps.some(m=>m.role==='Additif'&&(m.masse||0)>0&&(m.coalescent||m.nom.toLowerCase().includes('coalesc')))}
          showRayons={showRayons && Math.round(progress*100)===100}/>

        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8,fontSize:11,
          color:'var(--color-text-secondary)'}}>
          {[
            {label:'Solvant (eau)',bg:'rgba(59,130,246,0.35)',border:'#3b82f6',shape:'rect'},
            {label:'Pigments',bg:'#dc2626',border:'#991b1b',shape:'circle'},
            {label:'Charges',bg:'#e5e7eb',border:'#9ca3af',shape:'circle'},
            {label:'Particules de liant (latex)',bg:'#fed7aa',border:'#ea580c',shape:'circle'},
            {label:'Vide d\'air (si λ > 1)',bg:'white',border:'#94a3b8',shape:'circle'},
            {label:'Agent de coalescence',bg:'#fbbf24',border:'#d97706',shape:'losange'},
          ].map(({label,bg,border,shape})=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:4}}>
              {shape==='rect'&&<div style={{width:16,height:9,background:bg,border:`1px solid ${border}`,borderRadius:2}}/>}
              {shape==='circle'&&<div style={{width:11,height:11,borderRadius:'50%',background:bg,border:`1px solid ${border}`}}/>}
              {shape==='line'&&<div style={{width:20,height:3,background:bg,borderRadius:2}}/>}
              {shape==='losange'&&(
                <svg width={14} height={14} style={{flexShrink:0}}>
                  <polygon points="7,1 13,7 7,13 1,7" fill="#fbbf24" stroke="#d97706" strokeWidth={0.8}/>
                </svg>
              )}
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:6,fontSize:10,color:'var(--color-text-secondary)',fontStyle:'italic'}}>
          Modifiez la formule ci-dessus pour changer λ et l'aspect du film. L'animation suppose que la température est au-dessus de la TMFF :
          sinon, les particules de latex ne fusionnent pas (voir la section « Formation du film »). Les tailles et les nombres de grains sont schématiques.
        </div>
        </Section>
      </div>

      {/* ── LIGNE 4 : Formation du film (TMFF) ── */}
      <div style={{marginBottom:10, background:KIT.fond, border:`1px solid ${KIT.bord}`, borderRadius:10, padding:'10px 12px'}}>
        <Section titre="Formation du film : TMFF, agent de coalescence et COV" ouvert={ouverts.film} onBascule={() => setOuverts(o => ({ ...o, film: !o.film }))}>
          <div style={{fontSize:13,color:KIT.txt,lineHeight:1.5,marginBottom:8}}>
            Un liant en émulsion (latex) est formé de particules de polymère dispersées dans l'eau. Une fois l'eau évaporée, elles ne forment un film continu que si
            la température dépasse la <strong>température minimale de formation de film</strong> (TMFF) : elles se déforment alors et fusionnent (coalescence).
            L'agent de coalescence abaisse temporairement la TMFF, puis s'évapore : c'est un COV.
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <button onClick={() => { setProgFilm(0); setAnimFilm(true); }} style={{padding:'6px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:'#2563eb',color:'white'}}>▶ Lancer le séchage</button>
          </div>
          {isFinite(tmffPeinture)
            ? <AnimationLatex progres={progFilm} T={T} tmff={tmffPeinture} lambda={lambda}/>
            : <div style={{fontSize:13,color:'#b45309'}}>Renseignez la TMFF de la résine dans sa fiche 🔍.</div>}
          <Curseur nom="Température d'application T" valeur={T} onChange={setT} min={0} max={35} pas={1} unite="°C" couleur="#0f766e"/>
          <LigneMesure nom="TMFF de la résine (fiche 🔍 du liant)" valeur={isFinite(tmffResine) ? `${fmt(tmffResine, 0)} °C` : '—'}/>
          <LigneMesure nom="Agent de coalescence / polymère sec" valeur={`${fmt(pctCoal, 1)} %`}/>
          <LigneMesure nom="TMFF estimée de la peinture" valeur={!isFinite(tmffPeinture) ? '—' : tmffPeinture < 0 ? 'inférieure à 0 °C' : `${fmt(tmffPeinture, 0)} °C`} couleur={T >= tmffPeinture ? '#15803d' : '#b91c1c'}/>
          <LigneMesure nom="COV (agents de coalescence, par litre de peinture)" valeur={isFinite(COV) ? `${fmt(COV, 0)} g/L` : `non calculable (densité manquante : ${densiteManquante.join(', ')})`} couleur={COV < 30 ? '#15803d' : '#b45309'}/>
          <div style={{fontSize:13,fontWeight:700,marginTop:6,color:T >= tmffPeinture ? '#15803d' : '#b91c1c'}}>
            {!isFinite(tmffPeinture) ? '' : T >= tmffPeinture ? '✅ À cette température, le film se forme.' : '❌ À cette température, les particules ne fusionnent pas : film fissuré ou poudreux.'}</div>
          <Curseur nom="Hypothèse : abaissement de la TMFF par % de coalescent" valeur={efficacite} onChange={setEfficacite} min={0.5} max={5} pas={0.5} unite="°C" decimales={1} couleur="#7c3aed"/>
          <div style={{fontSize:12,color:KIT.txt2,lineHeight:1.5}}>
            Hypothèses : l'abaissement de la TMFF est supposé proportionnel à la teneur en coalescent (en % du polymère sec) ; l'efficacité réelle dépend du couple
            résine-coalescent et se mesure au banc TMFF (ISO 2115). Seuls les additifs cochés « agent de coalescence » dans leur fiche 🔍 sont comptés dans les COV.
            Avec plusieurs liants, on prend la moyenne de leurs TMFF pondérée par leur masse sèche.
          </div>
        </Section>
      </div>

    </div>
  );
}

