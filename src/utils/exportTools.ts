import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings } from '../types';
import { StorageManager } from './storage';

export function exportToExcel(data: any[], fileName: string = 'Laporan_CMS_Pro', settings?: AppSettings) {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diexport.');
    return;
  }

  const activeSettings = settings || StorageManager.getSettings();
  const churchName = (activeSettings?.nama_gereja || 'SYSTEM MANAGEMENT CHURCH').trim();
  const address = activeSettings?.alamat || '';
  const email = activeSettings?.email || '';
  const telepon = activeSettings?.telepon || '';

  // Prepare Kop Header rows for Excel sheet
  const headerRows = [
    [churchName.toUpperCase()],
    [`Alamat: ${address}`],
    [`Kontak: Email (${email}) | Telp (${telepon})`],
    [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
    [] // Empty row separator
  ];

  let fullDataRows: any[][] = [...headerRows];

  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const keys = Object.keys(data[0]);
    fullDataRows.push(keys);
    data.forEach((item) => {
      fullDataRows.push(keys.map((k) => (item[k] !== undefined && item[k] !== null ? item[k] : '')));
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(fullDataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
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
  const activeSettings = settings || StorageManager.getSettings();
  const churchName = (activeSettings?.nama_gereja || 'SYSTEM MANAGEMENT CHURCH').trim();
  const address = activeSettings?.alamat || 'Gereja Management System';
  const email = activeSettings?.email || '-';
  const telepon = activeSettings?.telepon || '-';

  // Header Kop Surat
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(churchName.toUpperCase(), 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(address, 14, 21);
  doc.text(`Email: ${email} | Telp: ${telepon}`, 14, 26);

  doc.setLineWidth(0.5);
  doc.line(14, 29, 196, 29);

  // Document Title
  doc.setFontSize(13);
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
