import PDFDocument from "pdfkit";

const navy = "#0B1845";
const gold = "#D7A51B";
const companyName = "Alfredo kavula Fashion Plus Unip Lda";
const statuses = { paid: "PAYE", pending: "EN ATTENTE", unpaid: "NON PAYE", failed: "ECHEC", refunded: "REMBOURSE", partially_paid: "PARTIELLEMENT PAYE", cancelled: "ANNULE", approved: "APPROUVE", requested: "DEMANDE" };

export function createTextPdf({ title, lines, status }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true, info: { Title: title, Author: companyName } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    let y;
    function header() {
      doc.rect(0, 0, 595.28, 108).fill(navy);
      doc.rect(0, 108, 595.28, 5).fill(gold);
      doc.fillColor(gold).font("Helvetica-Bold").fontSize(20).text(companyName, 42, 28, { width: 511 });
      doc.fillColor("white").font("Helvetica").fontSize(11).text(title, 42, 65, { width: 510 });
      y = 134;
      if (status) {
        const label = statuses[status] || String(status).toUpperCase();
        doc.roundedRect(42, y, 511, 30, 4).fill(status === "paid" ? "#E7F4EC" : "#FFF3D5");
        doc.fillColor(navy).font("Helvetica-Bold").fontSize(10).text("STATUT : " + label, 54, y + 10, { width: 485 });
        y += 46;
      }
    }
    header();
    let row = 0;
    for (const raw of lines) {
      const line = String(raw || "").replace(/\u202f|\u00a0/g, " ");
      if (!line) { y += 12; continue; }
      const section = ["Articles", "Paiements"].includes(line);
      const total = /^(Total|Valeur EUR|Montant retire)/.test(line);
      doc.font(section || total ? "Helvetica-Bold" : "Helvetica").fontSize(section ? 12 : 10);
      const height = doc.heightOfString(line, { width: 485, lineGap: 3 }) + 20;
      if (y + height > 760) { doc.addPage(); header(); }
      if (section || total) doc.roundedRect(42, y, 511, height, 3).fill(section ? navy : "#F8EECF");
      else if (row++ % 2 === 0) doc.rect(42, y, 511, height).fill("#F4F5F8");
      doc.font(section || total ? "Helvetica-Bold" : "Helvetica").fontSize(section ? 12 : 10);
      doc.fillColor(section ? "white" : navy).text(line, 54, y + 10, { width: 485, lineGap: 3 });
      y += height + 3;
    }
    const range = doc.bufferedPageRange();
    for (let page = 0; page < range.count; page++) {
      doc.switchToPage(page);
      doc.moveTo(42, 781).lineTo(553, 781).strokeColor(gold).lineWidth(1).stroke();
      doc.fillColor("#626A7A").font("Helvetica").fontSize(8).text("AK Fashion Plus | support@akfashionplus.com", 42, 792, { lineBreak: false });
      doc.text((page + 1) + " / " + range.count, 508, 792, { lineBreak: false });
    }
    doc.end();
  });
}

export async function sendPdf(res, filename, payload) {
  const buffer = await createTextPdf(payload);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="' + filename.replace(/[^a-zA-Z0-9._-]/g, "-") + '"');
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Length", buffer.length);
  return res.end(buffer);
}
