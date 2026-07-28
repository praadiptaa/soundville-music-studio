import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { reportService } from '../../services'
import { exportToExcel, exportToPDF } from '../../utils/exportReport'
import toast from 'react-hot-toast'
import { FaDownload, FaFilter, FaFileExcel, FaFilePdf } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

export default function Reports() {
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [exporting,    setExporting]    = useState(false)
  const [startDate,    setStartDate]    = useState('')
  const [endDate,      setEndDate]      = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const load = (params = {}) => {
    setLoading(true)
    setCurrentPage(1)
    reportService.getTransactions(params)
      .then(({ data }) => setTransactions(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFilter = () => {
    load({ start_date: startDate, end_date: endDate })
  }

  const totalPendapatan = transactions
    .filter(t => t.status_payment === 'verified')
    .reduce((acc, t) => acc + parseFloat(t.total_harga || 0), 0)

  const stats = {
    totalTransactions: transactions.length,
    totalRevenue: totalPendapatan,
    confirmedBookings: transactions.filter(t => t.status_payment === 'verified').length,
  }

  const handleExportExcel = async () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    setExporting(true)
    try {
      await exportToExcel(transactions, startDate || 'Semua', endDate || 'Semua', stats)
      toast.success('Laporan berhasil diekspor ke Excel')
    } catch (err) {
      toast.error('Gagal mengekspor ke Excel')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }
    
    setExporting(true)
    try {
      await exportToPDF(transactions, startDate || 'Semua', endDate || 'Semua', stats)
      toast.success('Laporan berhasil diekspor ke PDF')
    } catch (err) {
      toast.error('Gagal mengekspor ke PDF')
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <AdminLayout title="Laporan Transaksi">
      {/* Filter & Export */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Dari Tanggal</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
          </div>
          <button onClick={handleFilter} className="btn-primary flex items-center gap-2 h-11">
            <FaFilter /> Filter
          </button>
          <button onClick={() => { setStartDate(''); setEndDate(''); load() }} className="btn-secondary h-11">
            Reset
          </button>
          
          {/* Export Buttons */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={exporting || transactions.length === 0}
              className="btn-primary flex items-center gap-2 h-11 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting || transactions.length === 0}
              className="btn-primary flex items-center gap-2 h-11 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
            >
              <FaFilePdf /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
          <p className="text-gray-400 text-sm">Total Transaksi</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{formatRupiah(totalPendapatan)}</p>
          <p className="text-gray-400 text-sm">Total Pendapatan</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-400">
            {transactions.filter(t => t.status_payment === 'verified').length}
          </p>
          <p className="text-gray-400 text-sm">Pembayaran Terverifikasi</p>
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  {['#','Tipe','Customer','Referensi','Tanggal','Jam','Total','Metode','Status Order','Status Bayar'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                ) : (() => {
                  const totalPages = Math.ceil(transactions.length / itemsPerPage)
                  const startIdx = (currentPage - 1) * itemsPerPage
                  const paginatedData = transactions.slice(startIdx, startIdx + itemsPerPage)
                  return paginatedData.map((t, index) => (
                <tr key={`${t.reference_code || t.id_booking || 'trx'}-${startIdx + index}`} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                  <td className="px-4 py-3 text-gray-500">{startIdx + index + 1}</td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{t.transaction_type || 'booking'}</td>
                  <td className="px-4 py-3 text-white">{t.customer}</td>
                  <td className="px-4 py-3 text-gray-300">{t.reference_name || t.nama_studio || t.reference_code || '–'}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{t.tanggal?.split('T')[0] || t.tanggal}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {t.jam_mulai && t.jam_selesai ? `${t.jam_mulai?.substring(0,5)}–${t.jam_selesai?.substring(0,5)}` : '–'}
                  </td>
                  <td className="px-4 py-3 text-primary-400 font-medium whitespace-nowrap">{formatRupiah(t.total_harga)}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{t.metode || '–'}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status_booking} /></td>
                  <td className="px-4 py-3">{t.status_payment ? <StatusBadge status={t.status_payment} /> : <span className="text-gray-600">–</span>}</td>
                </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {transactions.length > 0 && (() => {
            const totalPages = Math.ceil(transactions.length / itemsPerPage)
            return (
              <div className="flex items-center justify-between mt-6 px-4">
                <span className="text-sm text-gray-400">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, transactions.length)}-{Math.min(currentPage * itemsPerPage, transactions.length)} dari {transactions.length} data
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Sebelumnya
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-primary-400 text-dark-900'
                            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </AdminLayout>
  )
}
