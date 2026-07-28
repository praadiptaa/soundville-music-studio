/**
 * Utility functions untuk export laporan finansial ke Excel dan PDF
 */

import { jsPDF } from 'jspdf'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

/**
 * Export laporan ke Excel menggunakan SheetJS (xlsx)
 */
export const exportToExcel = async (transactions, startDate, endDate, stats) => {
  try {
    const XLSX = await import('xlsx')
    
    // Sheet 1: Ringkasan
    const summaryData = [
      ['LAPORAN KEUANGAN SOUNDVILLE MUSIC STUDIO'],
      [],
      ['Periode Laporan', `${startDate || 'Semua'} - ${endDate || 'Semua'}`],
      ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
      [],
      ['RINGKASAN KEUANGAN'],
      ['Total Transaksi', stats.totalTransactions || 0],
      ['Total Pendapatan', stats.totalRevenue || 0],
      ['Pembayaran Terverifikasi', stats.confirmedBookings || 0],
    ]

    // Sheet 2: Detail Transaksi dengan spasi lebih
    const detailData = [
      ['#', 'Tipe', 'Customer', 'Referensi', 'Tanggal', 'Jam Mulai', 'Jam Selesai', 'Total (Rp)', 'Metode', 'Status Order', 'Status Bayar'],
      ...transactions.map((t, index) => [
        index + 1,
        t.transaction_type || 'booking',
        t.customer || t.nama_customer || '-',
        t.reference_name || t.nama_studio || '-',
        t.tanggal?.split('T')[0] || '-',
        t.jam_mulai?.substring(0, 5) || '-',
        t.jam_selesai?.substring(0, 5) || '-',
        t.total_harga || 0,
        t.metode || '-',
        t.status_booking || '-',
        t.status_payment || '-',
      ])
    ]

    // Buat workbook
    const wb = XLSX.utils.book_new()

    // Sheet 1: Ringkasan
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [
      { wch: 30 },
      { wch: 35 },
    ]
    ws1['A1'] = { v: 'LAPORAN KEUANGAN SOUNDVILLE MUSIC STUDIO', s: { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: 'FFC107' } } } }
    ws1['A6'] = { v: 'RINGKASAN KEUANGAN', s: { font: { bold: true, sz: 12 } } }
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan')

    // Sheet 2: Detail Transaksi
    const ws2 = XLSX.utils.aoa_to_sheet(detailData)
    
    // Set column widths - lebih lebar untuk data yang jelas terbaca
    ws2['!cols'] = [
      { wch: 5 },    // #
      { wch: 12 },   // Tipe
      { wch: 25 },   // Customer
      { wch: 25 },   // Referensi
      { wch: 15 },   // Tanggal
      { wch: 12 },   // Jam Mulai
      { wch: 12 },   // Jam Selesai
      { wch: 18 },   // Total (Rp)
      { wch: 15 },   // Metode
      { wch: 18 },   // Status Order
      { wch: 15 },   // Status Bayar
    ]
    
    // Format header row - lebih jelas
    for (let i = 0; i < 11; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
      if (ws2[cellRef]) {
        ws2[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          fill: { fgColor: { rgb: '1A1A23' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: { 
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        }
      }
    }
    
    // Format data rows dengan border dan alignment
    for (let i = 1; i < detailData.length; i++) {
      for (let j = 0; j < 11; j++) {
        const cellRef = XLSX.utils.encode_cell({ r: i, c: j })
        if (ws2[cellRef]) {
          // Format Total column (column H, index 7)
          if (j === 7) {
            ws2[cellRef].t = 'n'
            ws2[cellRef].s = { 
              num_fmt: '#,##0',
              border: { 
                top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                right: { style: 'thin', color: { rgb: 'CCCCCC' } }
              },
              alignment: { horizontal: 'right', vertical: 'center' }
            }
          } else {
            ws2[cellRef].s = {
              border: { 
                top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                right: { style: 'thin', color: { rgb: 'CCCCCC' } }
              },
              alignment: { horizontal: j === 0 ? 'center' : 'left', vertical: 'center' }
            }
          }
        }
      }
    }
    
    // Freeze pane - biar header selalu terlihat
    ws2['!freeze'] = { xSplit: 0, ySplit: 1 }
    
    // Set default row height
    ws2['!rows'] = [{ hpx: 25 }, ...Array(detailData.length - 1).fill({ hpx: 20 })]
    
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail Transaksi')

    const fileName = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  } catch (err) {
    console.error('Error exporting to Excel:', err)
    throw err
  }
}

/**
 * Export laporan ke PDF menggunakan jsPDF dengan landscape mode
 */
export const exportToPDF = async (transactions, startDate, endDate, stats) => {
  try {
    const { jsPDF: jsPDFLib } = await import('jspdf')
    const doc = new jsPDFLib('l', 'mm', 'a4') // landscape untuk space lebih luas
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 15

    const headerBg = [26, 26, 35]
    const headerText = [255, 193, 7]

    // Helper function untuk tambah header di setiap halaman baru
    const addPageHeader = (pageNum) => {
      if (pageNum > 1) {
        doc.setFontSize(9)
        doc.setTextColor(150, 150, 150)
        doc.text(`Halaman ${pageNum}`, pageWidth - 15, 10, { align: 'right' })
      }
    }

    let pageNum = 1
    addPageHeader(pageNum)

    // Logo
    try {
      const logoImg = new Image()
      logoImg.src = '/logo.png'
      await new Promise((resolve) => {
        logoImg.onload = () => {
          const logoWidth = 20
          const logoHeight = 20
          doc.addImage(logoImg, 'PNG', (pageWidth - logoWidth) / 2, 8, logoWidth, logoHeight)
          resolve()
        }
        logoImg.onerror = () => resolve()
      })
    } catch (err) {
      console.warn('Logo gagal:', err)
    }

    yPosition = 32

    // Judul
    doc.setFontSize(16)
    doc.setTextColor(26, 26, 35)
    doc.setFont(undefined, 'bold')
    doc.text('LAPORAN KEUANGAN', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 6

    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.setFont(undefined, 'normal')
    doc.text('Soundville Music Studio', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 8

    // Info periode
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 50)
    doc.text(`Periode: ${startDate || 'Semua'} - ${endDate || 'Semua'}`, 15, yPosition)
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 15, yPosition + 5)
    yPosition += 12

    // Ringkasan
    doc.setFillColor(...headerBg)
    doc.setTextColor(...headerText)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.rect(15, yPosition - 4, pageWidth - 30, 7, 'F')
    doc.text('RINGKASAN KEUANGAN', 18, yPosition + 1)
    yPosition += 10

    doc.setTextColor(50, 50, 50)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    
    const summaryItems = [
      { label: 'Total Transaksi', value: String(stats.totalTransactions || 0) },
      { label: 'Total Pendapatan', value: formatRupiah(stats.totalRevenue || 0) },
      { label: 'Pembayaran Terverifikasi', value: String(stats.confirmedBookings || 0) },
    ]

    summaryItems.forEach((item, index) => {
      doc.text(`${item.label}:`, 18, yPosition + index * 5)
      doc.setFont(undefined, 'bold')
      doc.text(item.value, pageWidth - 18, yPosition + index * 5, { align: 'right' })
      doc.setFont(undefined, 'normal')
    })

    yPosition += 20

    // Tabel Header
    doc.setFillColor(...headerBg)
    doc.setTextColor(...headerText)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(9)
    doc.rect(15, yPosition - 4, pageWidth - 30, 7, 'F')
    doc.text('DETAIL TRANSAKSI', 18, yPosition + 1)
    yPosition += 10

    // Column definitions - lebar yang pas untuk semua data terbaca
    const columns = ['#', 'Tipe', 'Customer', 'Referensi', 'Tgl', 'Jam Mulai', 'Jam Selesai', 'Total (Rp)', 'Metode', 'Status', 'Bayar']
    const colWidths = [6, 10, 18, 18, 12, 12, 12, 18, 11, 12, 11]
    const colAligns = ['center', 'center', 'left', 'left', 'center', 'center', 'center', 'right', 'center', 'center', 'center']
    
    // Validasi total width
    const totalWidth = colWidths.reduce((a, b) => a + b, 0)
    const availableWidth = pageWidth - 30
    const widthScale = availableWidth / totalWidth
    const scaledColWidths = colWidths.map(w => w * widthScale)
    
    // Header row
    doc.setFillColor(...headerBg)
    doc.rect(15, yPosition - 4, pageWidth - 30, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(8)
    
    let xPos = 15
    columns.forEach((col, i) => {
      const align = colAligns[i]
      let drawX = xPos
      if (align === 'center') {
        drawX = xPos + scaledColWidths[i] / 2
      } else if (align === 'right') {
        drawX = xPos + scaledColWidths[i] - 1
      } else {
        drawX = xPos + 1
      }

      doc.text(col, drawX, yPosition, { 
        align: align, 
        maxWidth: scaledColWidths[i] - 1 
      })
      xPos += scaledColWidths[i]
    })

    yPosition += 7

    // Data rows
    doc.setTextColor(50, 50, 50)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)

    let rowNum = 0
    let colorToggle = false

    transactions.forEach((t, index) => {
      // Check if need new page
      if (yPosition > pageHeight - 15) {
        doc.addPage()
        pageNum++
        yPosition = 15
        addPageHeader(pageNum)
        
        // Repeat header on new page
        doc.setFillColor(...headerBg)
        doc.rect(15, yPosition - 4, pageWidth - 30, 6, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont(undefined, 'bold')
        doc.setFontSize(8)
        
        xPos = 15
        columns.forEach((col, i) => {
          const align = colAligns[i]
          let drawX = xPos
          if (align === 'center') {
            drawX = xPos + scaledColWidths[i] / 2
          } else if (align === 'right') {
            drawX = xPos + scaledColWidths[i] - 1
          } else {
            drawX = xPos + 1
          }

          doc.text(col, drawX, yPosition, { 
            align: align, 
            maxWidth: scaledColWidths[i] - 1 
          })
          xPos += scaledColWidths[i]
        })
        yPosition += 7
        
        doc.setTextColor(50, 50, 50)
        doc.setFont(undefined, 'normal')
        doc.setFontSize(8)
        colorToggle = false
      }

      // Alternating row colors
      if (colorToggle) {
        doc.setFillColor(245, 245, 245)
        doc.rect(15, yPosition - 4, pageWidth - 30, 6, 'F')
      }

      // Row data - truncate dengan bijak
      const rowData = [
        String(index + 1),
        (t.transaction_type || 'booking').substring(0, 10),
        (t.customer || t.nama_customer || '-').substring(0, 18),
        (t.reference_name || t.nama_studio || '-').substring(0, 16),
        t.tanggal?.split('T')[0] || '-',
        t.jam_mulai?.substring(0, 5) || '-',
        t.jam_selesai?.substring(0, 5) || '-',
        formatRupiah(t.total_harga || 0),
        (t.metode || '-').substring(0, 10),
        (t.status_booking || '-').substring(0, 10),
        (t.status_payment || '-').substring(0, 10),
      ]

      xPos = 15
      rowData.forEach((data, i) => {
        const align = colAligns[i]
        let drawX = xPos
        if (align === 'center') {
          drawX = xPos + scaledColWidths[i] / 2
        } else if (align === 'right') {
          drawX = xPos + scaledColWidths[i] - 1
        } else {
          drawX = xPos + 1
        }

        doc.text(data, drawX, yPosition, { 
          align: align,
          maxWidth: scaledColWidths[i] - 1
        })
        xPos += scaledColWidths[i]
      })

      yPosition += 6.5
      rowNum++
      colorToggle = !colorToggle
    })

    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Digenerate: ${new Date().toLocaleString('id-ID')}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )

    const fileName = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  } catch (err) {
    console.error('Error exporting to PDF:', err)
    throw err
  }
}
