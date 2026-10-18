/**
 * Pure client-side PDF document generator for Setu Skill Passport.
 * Generates valid standard PDF-1.4 binary documents without external npm dependencies.
 */

export interface SkillPassportPdfData {
  name: string;
  occupation: string;
  city: string;
  experienceYears: number;
  languages: string[];
  jobsCompleted: number;
  avgDailyPay: number;
  clientRating: number;
  verifiedCompetencies: string[];
  userDeclaredSkills: string[];
  verificationId: string;
  issuedDate: string;
}

function escapePdfString(text: string): string {
  // Replace characters not in WinAnsi/Standard ASCII or escape brackets
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?');
}

/**
 * Generates an authentic PDF-1.4 file as a Blob.
 */
export function generateSkillPassportPdf(data: SkillPassportPdfData): Blob {
  // A4 dimensions in points: 595.28 x 841.89
  const width = 595;
  const height = 842;

  // Build stream content with PDF operators
  const streamLines: string[] = [];

  // Helper functions for drawing
  const setColor = (r: number, g: number, b: number) => {
    streamLines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
  };
  const setStrokeColor = (r: number, g: number, b: number) => {
    streamLines.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
  };
  const drawRect = (x: number, y: number, w: number, h: number, fill = true, stroke = false) => {
    streamLines.push(`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re`);
    if (fill && stroke) streamLines.push('b');
    else if (fill) streamLines.push('f');
    else if (stroke) streamLines.push('s');
  };
  const drawText = (
    text: string,
    x: number,
    y: number,
    font = 'F1',
    size = 12,
    r = 7,
    g = 59,
    b = 58
  ) => {
    setColor(r, g, b);
    streamLines.push('BT');
    streamLines.push(`/${font} ${size} Tf`);
    streamLines.push(`1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm`);
    streamLines.push(`(${escapePdfString(text)}) Tj`);
    streamLines.push('ET');
  };

  // Background light warm cream
  setColor(253, 248, 240);
  drawRect(0, 0, width, height, true, false);

  // Outer border container card
  setColor(255, 255, 255);
  setStrokeColor(244, 235, 221);
  streamLines.push('2.5 w');
  drawRect(36, 40, width - 72, height - 80, true, true);

  // Decorative top warm cocoa header banner
  setColor(124, 45, 22);
  drawRect(36, height - 120, width - 72, 80, true, false);

  // Saffron gold accent line
  setColor(229, 149, 62);
  drawRect(36, height - 124, width - 72, 4, true, false);

  // Header Title & Logo
  drawText('SETU LIVELIHOOD NETWORK', 56, height - 72, 'F2', 18, 255, 255, 255);
  drawText('Digital Skill & Livelihood Passport', 56, height - 94, 'F1', 11, 241, 185, 107);
  drawText('GOVT. ALIGNED VERIFIED CREDENTIAL', 340, height - 80, 'F2', 9, 229, 168, 35);

  // Worker Profile Card Banner
  setColor(253, 248, 240);
  setStrokeColor(244, 235, 221);
  streamLines.push('1 w');
  drawRect(56, height - 235, width - 112, 95, true, true);

  // Worker Name & Occupation
  drawText(data.name.toUpperCase(), 76, height - 165, 'F2', 20, 124, 45, 22);
  drawText(`${data.occupation} - ${data.city}`, 76, height - 188, 'F2', 13, 179, 74, 38);
  drawText(
    `Experience: ${data.experienceYears} Years   |   Languages: ${data.languages.join(', ')}`,
    76,
    height - 212,
    'F1',
    10,
    74,
    66,
    61
  );

  // Verification Badge Pill
  setColor(254, 243, 230);
  drawRect(400, height - 175, 120, 26, true, false);
  drawText('[VERIFIED WORKER]', 412, height - 167, 'F2', 9, 179, 74, 38);

  // 3 Metric Stat Boxes
  const statBoxY = height - 305;
  const boxW = 145;
  const gap = 16;
  const startX = 56;

  // Box 1: Jobs Completed
  setColor(255, 255, 255);
  setStrokeColor(244, 235, 221);
  drawRect(startX, statBoxY, boxW, 55, true, true);
  drawText(`${data.jobsCompleted}+`, startX + 16, statBoxY + 30, 'F2', 18, 124, 45, 22);
  drawText('Completed Engagements', startX + 16, statBoxY + 14, 'F1', 8, 125, 112, 104);

  // Box 2: Average Daily Pay
  const box2X = startX + boxW + gap;
  setColor(255, 255, 255);
  setStrokeColor(244, 235, 221);
  drawRect(box2X, statBoxY, boxW, 55, true, true);
  drawText(`Rs. ${data.avgDailyPay}/day`, box2X + 16, statBoxY + 30, 'F2', 16, 124, 45, 22);
  drawText('Average Verified Pay', box2X + 16, statBoxY + 14, 'F1', 8, 125, 112, 104);

  // Box 3: Client Rating
  const box3X = box2X + boxW + gap;
  setColor(255, 255, 255);
  setStrokeColor(244, 235, 221);
  drawRect(box3X, statBoxY, boxW, 55, true, true);
  drawText(`${data.clientRating.toFixed(1)} / 5.0`, box3X + 16, statBoxY + 30, 'F2', 16, 124, 45, 22);
  drawText('Worker Trust Rating', box3X + 16, statBoxY + 14, 'F1', 8, 125, 112, 104);

  // Section 1: Verified Competencies
  const compY = height - 335;
  drawText('1. VERIFIED COMPETENCIES (Assessed & Authenticated)', 56, compY, 'F2', 11, 124, 45, 22);

  let currentY = compY - 24;
  data.verifiedCompetencies.forEach((comp) => {
    setColor(253, 248, 240);
    setStrokeColor(244, 235, 221);
    streamLines.push('0.5 w');
    drawRect(56, currentY - 6, width - 112, 22, true, true);
    drawText(`*  ${comp}`, 68, currentY, 'F2', 9.5, 35, 31, 32);
    drawText('AUTHENTICATED', 430, currentY, 'F1', 8, 179, 74, 38);
    currentY -= 28;
  });

  // Section 2: User-Declared Skills
  currentY -= 10;
  drawText('2. DECLARED APPLIED SKILLS & SPECIALIZATIONS', 56, currentY, 'F2', 11, 124, 45, 22);
  currentY -= 20;

  // Skill chips row
  let chipX = 56;
  data.userDeclaredSkills.forEach((skill) => {
    const chipWidth = Math.max(70, skill.length * 7 + 16);
    if (chipX + chipWidth > width - 56) {
      chipX = 56;
      currentY -= 24;
    }
    setColor(255, 255, 255);
    setStrokeColor(244, 235, 221);
    streamLines.push('0.5 w');
    drawRect(chipX, currentY - 5, chipWidth, 18, true, true);
    drawText(skill, chipX + 8, currentY, 'F1', 8.5, 35, 31, 32);
    chipX += chipWidth + 8;
  });

  // Verification Summary Box
  currentY -= 40;
  setColor(253, 248, 240);
  setStrokeColor(244, 235, 221);
  drawRect(56, currentY - 35, width - 112, 45, true, true);
  drawText('LIVELIHOOD NETWORK INTEGRITY STATEMENT', 68, currentY - 5, 'F2', 9, 179, 74, 38);
  drawText(
    'This credential certifies that the worker profile has undergone digital verification, identity validation,',
    68,
    currentY - 18,
    'F1',
    8,
    74,
    66,
    61
  );
  drawText(
    'and verified peer ratings through the Setu Inclusive Worker Empowerment platform.',
    68,
    currentY - 29,
    'F1',
    8,
    74,
    66,
    61
  );

  // Footer / Verification ID and Date
  const footerY = 60;
  setColor(244, 235, 221);
  streamLines.push('0.5 w');
  drawRect(56, footerY + 20, width - 112, 0.5, true, false);

  drawText(`Verification ID: ${data.verificationId}`, 56, footerY, 'F2', 8.5, 124, 45, 22);
  drawText(`Issued: ${data.issuedDate}`, 270, footerY, 'F1', 8.5, 125, 112, 104);
  drawText('setu-livelihood.in/verify', 420, footerY, 'F2', 8.5, 179, 74, 38);

  const streamContent = streamLines.join('\n');
  const streamLength = streamContent.length;

  // Build PDF structure
  const objects: string[] = [
    // 1 0 obj: Catalog
    '<< /Type /Catalog /Pages 2 0 R >>',
    // 2 0 obj: Pages
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    // 3 0 obj: Page
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`,
    // 4 0 obj: Contents stream
    `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`,
    // 5 0 obj: Helvetica
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    // 6 0 obj: Helvetica-Bold
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];

  let offset = 0;
  const pdfHeader = '%PDF-1.4\n';
  offset += pdfHeader.length;

  const offsets: number[] = [0]; // 0 is dummy for 0000000000 65535 f
  let body = '';

  objects.forEach((obj, idx) => {
    offsets.push(offset);
    const objStr = `${idx + 1} 0 obj\n${obj}\nendobj\n`;
    body += objStr;
    offset += objStr.length;
  });

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdfString = pdfHeader + body + xref + trailer;

  return new Blob([fullPdfString], { type: 'application/pdf' });
}

/**
 * Triggers download of the generated PDF file.
 */
export function downloadSkillPassportFile(data: SkillPassportPdfData): void {
  const blob = generateSkillPassportPdf(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = data.name.trim().replace(/\s+/g, '_') || 'Worker';
  link.download = `Setu_Skill_Passport_${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
