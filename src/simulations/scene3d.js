// Outils communs aux vues 3D (three.js) : vecteurs, cylindres de liaison, étiquettes, rotation à la souris ou au doigt.
import * as THREE from "three";
import { COUL_RANG } from "./ChiraliteSchema";

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
