// Rapport PDF du dosage par étalonnage (sim 11) : paramètres, statistiques, graphiques (SVG convertis en images), test de Fisher.
// Utilise jsPDF chargé dans index.html (window.jspdf). Les polices standard de jsPDF ne connaissent pas les accents : on les retire.

const nettoyer = s => String(s)
  .replace(/[₀-₉]/g, c => String(c.charCodeAt(0) - 0x2080)).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => String('⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)))
  .replace(/⁺/g, '+').replace(/⁻/g, '-').replace(/→/g, '->').replace(/✓|✅/g, 'OK').replace(/✗|❌/g, 'NON')
  .replace(/[—–]/g, '-').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/±/g, '+/-').replace(/×/g, 'x').replace(/−/g, '-')
  .replace(/[’‘]/g, "'").replace(/µ/g, 'u').replace(/°/g, ' deg').replace(/[\u202f\u00a0]/g, ' ')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '');

async function svgEnImage(svg) {
  const vb = svg.viewBox.baseVal, k = 3;
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', vb.width); clone.setAttribute('height', vb.height);
  clone.setAttribute('font-family', 'Helvetica, Arial, sans-serif');
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = src; });
  const c = document.createElement('canvas'); c.width = vb.width * k; c.height = vb.height * k;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
  return { url: c.toDataURL('image/png'), w: vb.width, h: vb.height };
}

// r = { meta: [[nom, valeur]], stats: [[nom, valeur]], resultat: texte | null, graphes: [{ titre, svg }],
//       fisher: { lignes: [[source, SCE, ddl, variance, F, Fcrit]], conclusion, ok } | null }
export async function exporterRapportPDF(r) {
  if (!window.jspdf) throw new Error('bibliothèque PDF non chargée');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 15, CW = W - 2 * M;
  const TEAL = [15, 118, 110], VIOLET = [109, 40, 217], SOMBRE = [30, 30, 40], GRIS = [110, 110, 120];
  let y = 0;
  const txt = (s, x, yy, o) => pdf.text(nettoyer(s), x, yy, o || {});
  const gras = (t = 10) => { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(t); };
  const normal = (t = 10) => { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(t); };
  const couleur = c => pdf.setTextColor(...c);
  const pied = () => { normal(7); couleur(GRIS); txt('Paillasse virtuelle - paillasse-virtuelle.fr - Dosage par etalonnage', M, 290); txt(new Date().toLocaleDateString('fr-FR'), W - M, 290, { align: 'right' }); };
  const place = h => { if (y + h > 280) { pied(); pdf.addPage(); y = M; } };
  const titre = (s, c) => { place(14); pdf.setFillColor(...c); pdf.rect(M, y - 1, 3, 6, 'F'); gras(11); couleur(c); txt(s, M + 6, y + 4); y += 10; };
  const tableau = (lignes, cols, c) => lignes.forEach((l, i) => {
    place(7); if (i % 2 === 0) { pdf.setFillColor(246, 246, 250); pdf.rect(M, y - 4, CW, 6, 'F'); }
    let x = M + 2; l.forEach((v, j) => { (j === 0 ? gras : normal)(9); couleur(j === 0 ? c : SOMBRE); txt(v, x, y); x += cols[j]; }); y += 6;
  });

  pdf.setFillColor(...TEAL); pdf.rect(0, 0, W, 24, 'F');
  gras(16); couleur([255, 255, 255]); txt('Dosage par etalonnage externe', M, 12);
  normal(9); txt('Rapport genere par Paillasse virtuelle', M, 19);
  txt(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), W - M, 12, { align: 'right' });
  y = 34;

  titre('Donnees', TEAL); tableau(r.meta, [60, CW - 60], TEAL); y += 4;
  titre('Regression lineaire', VIOLET); tableau(r.stats, [80, CW - 80], VIOLET);
  if (r.resultat) { y += 3; place(10); pdf.setDrawColor(...TEAL); pdf.rect(M, y - 5, CW, 9, 'S'); gras(10); couleur(TEAL); txt(r.resultat, M + 3, y + 1); y += 10; }
  y += 4;
  for (const g of r.graphes) {
    if (!g.svg) continue;
    const im = await svgEnImage(g.svg), h = im.h / im.w * CW;
    place(h + 16); titre(g.titre, TEAL); pdf.addImage(im.url, 'PNG', M, y, CW, h); y += h + 6;
  }
  if (r.fisher) {
    titre('Test de Fisher-Snedecor (linearite, risque 5 %)', VIOLET);
    tableau([['Source', 'SCE', 'ddl', 'Variance', 'F', 'F critique'], ...r.fisher.lignes], [50, 30, 14, 30, 24, 24], VIOLET);
    y += 3; place(10); const c = r.fisher.ok ? [21, 128, 61] : [185, 28, 28];
    pdf.setDrawColor(...c); pdf.rect(M, y - 5, CW, 9, 'S'); gras(9.5); couleur(c); txt(r.fisher.conclusion, M + 3, y + 1); y += 10;
  }
  pied();
  pdf.save(`etalonnage_${new Date().toISOString().slice(0, 10)}.pdf`);
}
