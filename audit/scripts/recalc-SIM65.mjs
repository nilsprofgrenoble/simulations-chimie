import { foyer } from '../../src/simulations/optiqueModele.js';
const H = 100; // à vérifier
const ns=[1.4,1.5,1.6,1.8,1.9], Rs=[100,130,160]; let tot=0, conflit=0, qual=0;
for (const nA of ns) for (const RA of Rs) for (const nB of ns) for (const RB of Rs) {
  const fa=RA/(nA-1), fb=RB/(nB-1); if (Math.max(fa,fb)/Math.min(fa,fb)<=1.15) continue; tot++;
  const aPlus = nA>=nB && RA<=RB, bPlus = nB>=nA && RB<=RA; if(!(aPlus||bPlus)) conflit++;
}
console.log('paires valides',tot,'dont conflit n/R (non déductible qualitativement)',conflit, (100*conflit/tot).toFixed(0)+' %');
