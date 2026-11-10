import assert from 'node:assert';
import * as M from './mecaModele.js';
const ok=(c,m)=>{assert(c,m);};
ok(M.energie(0)===0&&M.energie(.25)===100&&M.energie(.5)===60&&M.energie(.75)===70&&M.energie(1)===-65,'jalons');
ok(M.EA1===100&&M.EA2===10&&M.DELTA_E===-65,'barrières');
ok(M.PRODUITS[1].cip!==M.PRODUITS[-1].cip,'faces opposées => énantiomères');
console.log('face avant',M.PRODUITS[1].cip,'face arrière',M.PRODUITS[-1].cip);
for(const f of[1,-1]){const g=M.geom3D(1,f).atomes;const d=M.V3.len(M.V3.sub(g.Br.p,g.C2.p));ok(Math.abs(d-1.95)<0.05,'C-Br '+d);
 for(const k of['C1','C3','H2','Br']){const dd=M.V3.len(M.V3.sub(g[k].p,g.C2.p));console.log(f,k,dd.toFixed(2));}}
for(let u=0;u<=1.0001;u+=0.01){const g=M.geom3D(u,1);for(const [k,a] of Object.entries(g.atomes))ok(a.p.every(Number.isFinite),'NaN '+k+u);
 const a=M.atomes2D(u);for(const v of Object.values(a))ok(v.every(Number.isFinite),'NaN2D');M.doublets2D(u).forEach(d=>ok(Number.isFinite(d.ang)));M.fleches2D(u);}
const a=M.atomes2D(1);ok(Math.hypot(a.Br[0]-a.C2[0],a.Br[1]-a.C2[1])-62<1e-6,'2D C-Br');
console.log('ok');

// VSEPR : plan 120° pour AX3, tétraèdre 109,5° pour AX4
{
  const { geometrieVSEPR } = await import('./mecaModele.js');
  const chk = (u, c, type, moy) => { const g = geometrieVSEPR(u, 1)[c]; if (g.type !== type || Math.abs(g.moy - moy) > 1.5) throw new Error(`VSEPR ${c} u=${u} : ${g.type} ${g.moy}`); };
  chk(0, 'C2', 'AX3', 120); chk(0, 'C3', 'AX3', 120); chk(0.5, 'C2', 'AX3', 120); chk(0.5, 'C3', 'AX4', 109.5);
  chk(1, 'C2', 'AX4', 109.5); chk(1, 'C3', 'AX4', 109.5);
  console.log('VSEPR ok');
}

{
  const { polarimetre, POLARI } = await import('./mecaModele.js');
  const r = polarimetre(50), a = polarimetre(100), b = polarimetre(75), c = polarimetre(0);
  const pur = POLARI.specifique * POLARI.l * POLARI.c;
  if (Math.abs(r.alpha) > 1e-9 || r.ee !== 0 || r.majoritaire !== null) throw new Error('polarimètre : racémique');
  if (Math.abs(a.alpha + pur) > 1e-9 || a.ee !== 100 || c.alpha < 0) throw new Error('polarimètre : énantiomères purs');
  if (Math.abs(b.ee - 50) > 1e-9 || Math.abs(b.alpha + pur / 2) > 1e-9) throw new Error('polarimètre : 75/25');
  console.log('polarimètre ok');
}
