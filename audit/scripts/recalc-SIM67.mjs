import { typeOrbite, vOrb, gAlt } from '../../src/simulations/issModele.js';
for (const h of [300,400,600,900,1200]) {
  const vo=vOrb(h); let lo=null, hi=null;
  for (let v=vo-0.5; v<=vo+0.5; v+=0.001){ if(typeOrbite(h,v).type==='circulaire'){ if(lo==null) lo=v; hi=v; } }
  console.log('h',h,'vOrb',vo.toFixed(3),'fenêtre circulaire',lo.toFixed(3),'→',hi.toFixed(3),'largeur',(hi-lo).toFixed(3),'km/s');
}
for (const m of [60,65,70,75,80,90]) for (const h of [200,400,800,1200,1500]) { const g=gAlt(h), v=m*g; const e=Math.abs(m*Math.round(g*10)/10 - v)/v; if (e>0.005) console.log('m',m,'h',h,'g',g.toFixed(3),'erreur lecture g à 0,1 :',(e*100).toFixed(2)+' %'); }
