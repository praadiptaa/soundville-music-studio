import { useState, useEffect } from 'react'
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
                <tr className="border-b border-dark-700">
                  {['#','Customer','Studio','Tanggal','Jam','Sisa Bayar','Status Bayar','Status Booking','Metode','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">Tidak ada data booking.</td></tr>
                ) : (() => {
                  // Hitung pagination
                  const totalPages = Math.ceil(filtered.length / itemsPerPage)
                  const startIdx = (currentPage - 1) * itemsPerPage
                  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)
                  
                  return paginatedData.map((b, index) => (
                    <>
                      <tr key={b.id_booking} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="px-4 py-3 text-gray-500">{startIdx + index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{b.nama_customer}</p>
                          <p className="text-gray-500 text-xs">{b.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{b.nama_studio}</td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{b.tanggal?.split('T')[0] || b.tanggal}</td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{b.jam_mulai?.substring(0,5)}–{b.jam_selesai?.substring(0,5)}</td>
                        <td className="px-4 py-3 text-primary-400 font-medium whitespace-nowrap">
                          {(() => {
                            if (b.metode && b.metode.trim()) return formatRupiah(0);
                            if (b.status_payment === 'verified') {
                              return b.tipe_pembayaran === 'lunas' ? formatRupiah(0) : formatRupiah(b.total_harga - 20000);
                            }
                            return formatRupiah(b.total_harga);
                          })()}
                        </td>
                        <td className="px-4 py-3">{b.status_payment ? <StatusBadge status={b.status_payment} /> : <span className="text-gray-600 text-xs">–</span>}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.status_booking} /></td>
                        <td className="px-4 py-3 text-gray-300 capitalize">{b.metode || '–'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            {(() => {
                              if (b.status_booking !== 'confirmed' || b.status_payment !== 'verified') {
                                return <span className="text-gray-500 text-xs">-</span>;
                              }
                              if (b.metode && b.metode.trim()) {
                                return <span className="text-green-400 text-xs font-medium">✓ Sudah lunas</span>;
                              }
                              return (
                                <button 
                                  onClick={() => {
                                    setLunasModal({ show: true, booking: b });
                                  }}
                                  className="btn-primary text-xs py-1 px-2 flex items-center gap-1 bg-green-600 hover:bg-green-700 whitespace-nowrap">
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
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center gap-1 mt-1 transition-colors"
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
                    </>
                  ))
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
