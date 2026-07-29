import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings } from '../types';

export function exportToExcel(data: any[], fileName: string = 'Laporan_CMS_Pro') {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diexport.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  settings?: AppSettings,
  fileName: string = 'Dokumen_CMS_Pro'
) {
  const doc = new jsPDF();
  const churchName = settings?.nama_gereja || 'Gereja Kemenangan Faith Center Pro';
  const address = settings?.alamat || 'Jl. Pemuda No. 77, Jakarta Pusat';
  
  // Header Kop Surat
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(churchName.toUpperCase(), 14, 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(address, 14, 21);
  doc.text(`Email: ${settings?.email || 'info@gkfc-cms.org'} | Telp: ${settings?.telepon || '+62 21 555-9876'}`, 14, 26);
  
  doc.setLineWidth(0.5);
  doc.line(14, 29, 196, 29);
  
  // Document Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 44);

  // Table
  autoTable(doc, {
    startY: 48,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
