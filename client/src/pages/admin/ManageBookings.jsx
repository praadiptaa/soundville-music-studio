import React, { useState, useEffect, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { bookingService, operatorShiftService } from '../../services'
import { sendOperatorWaReminder } from '../../utils/whatsappHelper'
import toast from 'react-hot-toast'
import { FaSearch, FaMoneyBill, FaWhatsapp } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STATUS_FILTERS = ['all','pending','confirmed','verified','rejected','cancelled']

// Modal untuk mark booking as lunas dengan metode pembayaran
function MarkLunasModal({ booking, onConfirm, onCancel, isLoading }) {
  const [metode, setMetode] = useState('qris')

  const handleSubmit = () => {
    console.log('[DEBUG] MarkLunasModal - handleSubmit', { booking: booking.id_booking, metode })
    onConfirm(booking.id_booking, metode)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tandai Booking Sebagai Lunas</h2>
        <p className="text-gray-400 mb-6">
          <strong>{booking.nama_customer}</strong> • <strong>{booking.nama_studio}</strong>
        </p>
        
        <label className="block mb-3 text-sm font-medium text-gray-300">
          Metode Pembayaran *
        </label>
        <div className="space-y-2 mb-4">
          {[
            { value: 'qris', label: 'QRIS' },
            { value: 'cash', label: 'Cash' }
          ].map(m => (
            <label key={m.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              metode === m.value ? 'border-primary-400 bg-primary-400/10' : 'border-dark-600 hover:border-dark-500'
            }`}>
              <input type="radio" name="metode" value={m.value}
                checked={metode === m.value}
                onChange={e => { console.log('[DEBUG] Metode changed to:', e.target.value); setMetode(e.target.value) }}
                className="accent-primary-400" />
              <span className="text-sm text-gray-300">{m.label}</span>
            </label>
          ))}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Tandai Lunas'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageBookings() {
  const [searchParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState(searchParams.get('filter') || 'all')
  const [search,   setSearch]   = useState('')
  const [lunasModal, setLunasModal] = useState({ show: false, booking: null })
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const load = () => {
    setLoading(true)
    bookingService.getAll()
      .then(({ data }) => { setBookings(data.data); setFiltered(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = bookings
    if (filter !== 'all') data = data.filter(b => b.status_booking === filter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(b =>
        b.nama_customer?.toLowerCase().includes(q) ||
        b.nama_studio?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
    setCurrentPage(1) // Reset ke halaman 1 saat filter berubah
  }, [filter, search, bookings])

  const handleLunasConfirm = async (id, metode) => {
    console.log('[DEBUG] handleLunasConfirm called', { id, metode })
    setIsProcessing(true)
    try {
      console.log('[DEBUG] Calling bookingService.updatePaymentStatus', { id, metode })
      const response = await bookingService.updatePaymentStatus(id, 'verified', metode)
      console.log('[DEBUG] Response:', response)
      toast.success('Booking ditandai sebagai lunas')
      setLunasModal({ show: false, booking: null })
      load()
    } catch (err) {
      console.error('[ERROR] handleLunasConfirm error:', err)
      toast.error(err.response?.data?.message || 'Gagal menandai booking sebagai lunas')
    } finally {
      setIsProcessing(false)
    }
  }



  return (
    <AdminLayout title="Kelola Booking">
      {/* Filter & Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <FaSearch className="absolute left-3 top-3 text-gray-500 text-sm" />
          <input type="text" placeholder="Cari customer / studio..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === s ? 'bg-primary-400 text-dark-900 font-semibold' : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}>
              {s === 'all' ? 'Semua' : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 bg-dark-800/80">
                  <th className="text-center px-3 py-3.5 text-gray-400 font-medium whitespace-nowrap w-10">#</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Customer</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Studio</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Tanggal</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Jam</th>
                  <th className="text-center px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Sisa Bayar</th>
                  <th className="text-center px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Status Bayar</th>
                  <th className="text-center px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Status Booking</th>
                  <th className="text-center px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Metode</th>
                  <th className="text-center px-4 py-3.5 text-gray-400 font-medium whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">Tidak ada data booking.</td></tr>
                ) : (() => {
                  const totalPages = Math.ceil(filtered.length / itemsPerPage)
                  const startIdx = (currentPage - 1) * itemsPerPage
                  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)
                  
                  return paginatedData.map((b, index) => {
                    const sisa = (() => {
                      if (b.metode && b.metode.trim()) return 0;
                      if (b.status_payment === 'verified') {
                        return b.tipe_pembayaran === 'lunas' ? 0 : Math.max(0, b.total_harga - 20000);
                      }
                      return b.total_harga;
                    })();

                    return (
                      <React.Fragment key={b.id_booking}>
                        <tr className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors align-middle">
                          <td className="px-3 py-3.5 text-center text-gray-500 font-mono text-xs">{startIdx + index + 1}</td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-white text-sm">{b.nama_customer}</p>
                            <p className="text-gray-500 text-xs font-mono">{b.email}</p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-200 font-medium">{b.nama_studio}</td>
                          <td className="px-4 py-3.5 text-gray-300 font-mono text-xs whitespace-nowrap">{b.tanggal?.split('T')[0] || b.tanggal}</td>
                          <td className="px-4 py-3.5 text-gray-300 font-mono text-xs whitespace-nowrap">{b.jam_mulai?.substring(0,5)} – {b.jam_selesai?.substring(0,5)}</td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {sisa === 0 ? (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 font-semibold border border-green-500/20">
                                Rp 0 (Lunas)
                              </span>
                            ) : (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                                {formatRupiah(sisa)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {b.status_payment ? <StatusBadge status={b.status_payment} /> : <span className="text-gray-600 text-xs">–</span>}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <StatusBadge status={b.status_booking} />
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            {b.metode && b.metode.trim() ? (
                              <span className="px-2.5 py-1 bg-dark-700 text-gray-200 text-xs font-mono font-semibold rounded-md border border-dark-600 uppercase">
                                {b.metode}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">–</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center justify-center gap-1.5 min-w-[120px]">
                              {(() => {
                                if (b.status_booking !== 'confirmed' || b.status_payment !== 'verified') {
                                  return <span className="text-gray-500 text-xs italic">Menunggu Otorisasi</span>;
                                }
                                if (b.metode && b.metode.trim()) {
                                  return <span className="text-green-400 text-xs font-semibold">✓ Lunas</span>;
                                }
                                return (
                                  <button 
                                    onClick={() => setLunasModal({ show: true, booking: b })}
                                    className="w-full max-w-[110px] justify-center text-xs py-1 px-2.5 font-semibold text-white bg-green-600 hover:bg-green-500 rounded-lg shadow transition-colors flex items-center gap-1">
                                    <FaMoneyBill /> Lunas
                                  </button>
                                );
                              })()}
                              <button
                                onClick={() => {
                                  operatorShiftService.getWaReminder({
                                    tanggal: b.tanggal,
                                    jam_mulai: b.jam_mulai,
                                    nama_studio: b.nama_studio,
                                    nama_customer: b.nama_customer
                                  }).then(res => {
                                    if (res.data?.success && res.data.data) {
                                      const op = res.data.data;
                                      sendOperatorWaReminder({
                                        phone: op.no_hp,
                                        operatorName: op.nama_operator,
                                        customerName: b.nama_customer,
                                        studioName: b.nama_studio,
                                        date: b.tanggal,
                                        startTime: b.jam_mulai?.substring(0, 5),
                                        endTime: b.jam_selesai?.substring(0, 5),
                                        paymentStatus: b.status_payment,
                                        paymentType: b.tipe_pembayaran || (b.metode ? 'lunas' : 'dp')
                                      });
                                    }
                                  }).catch(() => toast.error('Gagal mengambil info operator piket.'));
                                }}
                                title="Kirim pesan WA ke Operator yang piket saat booking ini"
                                className="w-full max-w-[110px] justify-center px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 shadow transition-colors"
                              >
                                <FaWhatsapp /> Ingatkan WA
                              </button>
                            </div>
                          </td>
                        </tr>
                        {((b.status_booking === 'rejected' && b.catatan_admin) || (b.status_booking === 'cancelled' && b.catatan_cancel)) && (
                          <tr className="bg-dark-800/50">
                            <td colSpan={10} className="px-4 py-3 text-xs space-y-1">
                              {b.status_booking === 'rejected' && b.catatan_admin && (
                                <div>
                                  <span className="text-red-400 font-semibold">📌 Alasan Penolakan: </span>
                                  <span className="text-gray-300">{b.catatan_admin}</span>
                                </div>
                              )}
                              {b.status_booking === 'cancelled' && b.catatan_cancel && (
                                <div>
                                  <span className="text-yellow-400 font-semibold">📌 Alasan Pembatalan: </span>
                                  <span className="text-gray-300">{b.catatan_cancel}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (() => {
            const totalPages = Math.ceil(filtered.length / itemsPerPage)
            return (
              <div className="flex items-center justify-between mt-6 px-4">
                <span className="text-sm text-gray-400">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
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

      {/* Lunas Modal */}
      {lunasModal.show && lunasModal.booking && (
        <MarkLunasModal
          booking={lunasModal.booking}
          onConfirm={handleLunasConfirm}
          onCancel={() => setLunasModal({ show: false, booking: null })}
          isLoading={isProcessing}
        />
      )}
    </AdminLayout>
  )
}
