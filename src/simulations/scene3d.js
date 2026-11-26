// Outils communs aux vues 3D (three.js) : vecteurs, cylindres de liaison, étiquettes, rotation à la souris ou au doigt.
import * as THREE from "three";
import { COUL_RANG } from "./ChiraliteSchema";
import { atomesBase } from "./baseAtomes";

export const vec = p => new THREE.Vector3(p[0], p[1], p[2]);
export const COUL_EL = { H: 0xf8fafc, C: 0x475569, O: 0xdc2626, N: 0x2563eb, Cl: 0x16a34a, Br: 0x9a3412, F: 0x65a30d, S: 0xca8a04, I: 0x7e22ce };
export const RAYON_EL = { H: 0.26, C: 0.4, O: 0.36, N: 0.36, F: 0.3, Cl: 0.46, S: 0.46, Br: 0.52, I: 0.56 };

export function placerCylindre(m, a, b, ep) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  m.position.copy(a).addScaledVector(d, 0.5);
  m.scale.set(ep, Math.max(L, 1e-4), ep);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}

// Étiquette (sprite) : pastille de priorité (si rang) + texte ; couleur : couleur du cadre et du texte (par défaut celle du rang)
export function etiquette(texte, rang, couleur) {
  const cv = document.createElement('canvas'); const ctx = cv.getContext('2d');
  const police = '800 54px Nunito, system-ui, sans-serif';
  ctx.font = police;
  const col = couleur || (rang ? COUL_RANG[rang] : '#0f172a');
  const tw = Math.ceil(ctx.measureText(texte).width), pastille = rang ? 74 : 0, W = tw + 44 + pastille, H = 92;
  cv.width = W; cv.height = H;
  ctx.font = police;
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = rang || couleur ? col : '#94a3b8'; ctx.lineWidth = 5;
  ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(3, 3, W - 6, H - 6, 22); else ctx.rect(3, 3, W - 6, H - 6); ctx.fill(); ctx.stroke();
  let x = 22;
  if (rang) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 26, H / 2, 27, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(rang), x + 26, H / 2 + 3);
    x += 62;
  }
  ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(texte, x, H / 2 + 3);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(0.0105 * W, 0.0105 * H, 1);
  return sp;
}

// Libère les géométries, matériaux et textures d'un objet
export function liberer(o) {
  o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { m.map?.dispose(); m.dispose(); }); });
}

// Charge dessinée sur un atome : halo translucide (bleu pour −, rouge pour +) et signe affiché par-dessus
export function ajouterCharge(contenu, p, signe, r = 0.8) {
  if (!signe) return;
  const coul = signe === '+' ? 0xef4444 : 0x3b82f6;
  const halo = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color: coul, transparent: true, opacity: 0.22, depthWrite: false }));
  halo.position.copy(vec(p)); contenu.add(halo);
  const sp = etiquette(signe, 0, signe === '+' ? '#dc2626' : '#1d4ed8');
  sp.material.depthTest = false; sp.renderOrder = 10;
  sp.position.copy(vec(p)).add(new THREE.Vector3(0.75, r * 0.6, 0.6)); sp.scale.multiplyScalar(0.7);
  contenu.add(sp);
}

// Base ou nucléophile dessiné atome par atome (HO⁻, H₂O, tBuO⁻) avec sa charge ; voir baseAtomes.js
export function ajouterBase(contenu, re, O, a, p, lie, angleFinal, nomLie = null, couleurNom = '#1d4ed8') {
  const m = atomesBase(re, O, a, p, lie, angleFinal);
  const sphere = (q, r, coul) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color: coul, roughness: 0.45 })); s.position.copy(vec(q)); contenu.add(s); };
  const lien = (q1, q2) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })); placerCylindre(l, vec(q1), vec(q2), 0.07); contenu.add(l); };
  sphere(O, 0.42, COUL_EL.O);
  m.atomes.forEach(at => { sphere(at.p, at.el === 'tBu' ? 0.7 : 0.3, at.el === 'tBu' ? 0x94a3b8 : COUL_EL.H); lien(O, at.p); });
  const lbl = m.atomes.find(x => x.el === 'tBu'); if (lbl) { const e = etiquette('tBu', 0, '#475569'); e.position.copy(vec(lbl.p)).add(new THREE.Vector3(0, 1.0, 0)); contenu.add(e); }
  ajouterCharge(contenu, O, m.charge, 0.78);
  const et = etiquette(nomLie && lie > 0.5 ? nomLie : m.nom, 0, couleurNom); et.position.copy(vec(O)).add(new THREE.Vector3(0, 1.3, 0)); contenu.add(et);
  return m;
}
