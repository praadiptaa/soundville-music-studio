import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { eventService, eventPaymentService } from '../../services'
import toast from 'react-hot-toast'
import {
  FaSearch, FaEye, FaTimes, FaCheck, FaUser, FaPhone, FaEnvelope,
  FaCalendarAlt, FaMapMarkerAlt, FaBoxOpen, FaTools, FaStar, FaInfoCircle,
  FaMoneyBillWave, FaImage, FaExternalLinkAlt,
} from 'react-icons/fa'

const STATUS_FILTERS = ['all','pending','approved','rejected','completed','cancelled']

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return path.startsWith('/') ? path : `/${path}`
}

// ─── Modal Reject ────────────────────────────────────────────────────────────
function RejectEventModal({ event, onConfirm, onCancel, isLoading }) {
  const [catatan, setCatatan] = useState('')

  const handleSubmit = () => {
    if (!catatan.trim()) { toast.error('Catatan penolakan harus diisi'); return }
    onConfirm(event.id_event, catatan)
    setCatatan('')
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6 border border-dark-700">
        <h2 className="text-xl font-bold text-white mb-1">Tolak Event</h2>
        <p className="text-gray-400 text-sm mb-4">
          <strong className="text-white">{event.nama_customer}</strong> · <strong className="text-white">{event.nama_event}</strong>
        </p>
        <label className="block mb-2 text-sm font-medium text-gray-300">Alasan Penolakan *</label>
        <textarea
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
          placeholder="Jelaskan alasan penolakan request event..."
          className="w-full bg-dark-700 border border-dark-600 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 mb-4 resize-none"
          rows="4"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isLoading}
            className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-colors disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
            {isLoading ? 'Memproses...' : 'Tolak Event'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal pratinjau bukti transfer
function ImagePreviewModal({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-white font-medium">Bukti Transfer</p>
          <div className="flex gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm"
            >
              <FaExternalLinkAlt /> Buka di tab baru
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm px-3 py-1 bg-dark-700 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-auto rounded-xl">
          <img
            src={src}
            alt="Bukti Transfer"
            className="w-full object-contain rounded-xl"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div
            className="hidden items-center justify-center h-40 bg-dark-700 rounded-xl text-gray-400 text-sm"
          >
            Gagal memuat gambar. <a href={src} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary-400 underline">Coba buka langsung</a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Detail Event ───────────────────────────────────────────────────────
function EventDetailModal({ eventId, onClose, onAction, isProcessing }) {
  const [detail,  setDetail]  = useState(null)
  const [payment, setPayment] = useState(null)   // data DP
  const [loading, setLoading] = useState(true)
  const [previewImg, setPreviewImg] = useState(null)
  const [showReject, setShowReject] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await eventService.getById(eventId)
        setDetail(data.data)
      } catch {
        toast.error('Gagal memuat detail event')
        setLoading(false)
        return
      }

      // Fetch pembayaran DP – 404 = belum ada, itu normal
      try {
        const { data: pd } = await eventPaymentService.getByEventId(eventId)
        setPayment(pd.data)
      } catch { /* belum ada pembayaran */ }

      setLoading(false)
    }
    fetchAll()
  }, [eventId])


  // Hitung total biaya
  const totalServices  = detail?.orders?.reduce((s, o) => s + parseFloat(o.total_harga || 0), 0) || 0
  const totalEquipment = detail?.rentals?.reduce((s, r) => s + parseFloat(r.harga_satuan || 0), 0) || 0
  const totalPaket     = parseFloat(detail?.paket_biaya_adjusted || detail?.paket_harga || 0)
  const grandTotal     = totalServices + totalEquipment + totalPaket

  const handleApprove = async () => {
    await onAction(eventId, 'approved')
    onClose()
  }

  const handleComplete = async () => {
    await onAction(eventId, 'completed')
    onClose()
  }

  const handleRejectSubmit = async (id, catatan) => {
    await onAction(id, 'rejected', catatan)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div
          className="bg-dark-800 rounded-2xl w-full max-w-2xl my-8 border border-dark-700 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-dark-700">
            <div>
              <h2 className="text-xl font-bold text-white">{loading ? '...' : detail?.nama_event}</h2>
              {!loading && detail && (
                <div className="flex items-center gap-3 mt-1">
                  <StatusBadge status={detail.status_event} />
                  <span className="text-gray-500 text-xs">ID #{detail.id_event}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <FaTimes className="text-lg" />
            </button>
          </div>

          {loading ? (
            <div className="py-16"><LoadingSpinner text="Memuat detail event..." /></div>
          ) : !detail ? (
            <div className="py-16 text-center text-gray-400">Detail tidak ditemukan.</div>
          ) : (
            <div className="p-6 space-y-6">

              {/* Info Customer */}
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Informasi Customer</h3>
                <div className="bg-dark-700/50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-primary-400 flex-shrink-0" />
                    <span className="text-white font-medium">{detail.nama_customer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-primary-400 flex-shrink-0" />
                    <span className="text-gray-300 truncate">{detail.email}</span>
                  </div>
                  {detail.no_hp && (
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-primary-400 flex-shrink-0" />
                      <span className="text-gray-300">{detail.no_hp}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Info Event */}
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Detail Event</h3>
                <div className="bg-dark-700/50 rounded-xl p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-primary-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-xs">Tanggal Event</p>
                        <p className="text-white">
                          {detail.tanggal_event?.split('T')[0] || detail.tanggal_event}
                          {detail.tanggal_selesai && ` – ${detail.tanggal_selesai?.split('T')[0] || detail.tanggal_selesai}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-primary-400 flex-shrink-0" />
                      <div>
                        <p className="text-gray-400 text-xs">Lokasi</p>
                        <p className="text-white">{detail.lokasi_event || '–'}</p>
                      </div>
                    </div>
                  </div>
                  {detail.deskripsi && (
                    <div className="flex gap-2 pt-2 border-t border-dark-600">
                      <FaInfoCircle className="text-primary-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Deskripsi</p>
                        <p className="text-gray-300">{detail.deskripsi}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Paket Event */}
              {detail.nama_paket && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Paket Event</h3>
                  <div className="bg-dark-700/50 rounded-xl p-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-yellow-400" />
                      <div>
                        <p className="text-white font-medium">{detail.nama_paket}</p>
                        {detail.jumlah_hari && <p className="text-gray-400 text-xs">{detail.jumlah_hari} hari</p>}
                        {(detail.tanggal_mulai_paket || detail.tanggal_selesai_paket) && (
                          <p className="text-gray-400 text-xs">
                            {detail.tanggal_mulai_paket?.split('T')[0]} – {detail.tanggal_selesai_paket?.split('T')[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-primary-400 font-semibold">{formatRupiah(totalPaket)}</span>
                  </div>
                </section>
              )}

              {/* Services / Layanan */}
              {detail.orders?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Layanan ({detail.orders.length})
                  </h3>
                  <div className="bg-dark-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-600">
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Layanan</th>
                          <th className="text-center px-4 py-2 text-gray-400 font-medium">Qty</th>
                          <th className="text-right px-4 py-2 text-gray-400 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.orders.map((o, i) => (
                          <tr key={i} className="border-b border-dark-600/50 last:border-0">
                            <td className="px-4 py-2">
                              <p className="text-white">{o.nama_service}</p>
                              <p className="text-gray-500 text-xs">{formatRupiah(o.harga_satuan)} / unit</p>
                            </td>
                            <td className="px-4 py-2 text-center text-gray-300">{o.qty}</td>
                            <td className="px-4 py-2 text-right text-primary-400 font-medium">{formatRupiah(o.total_harga)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Equipment */}
              {detail.rentals?.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Alat/Equipment ({detail.rentals.length})
                  </h3>
                  <div className="bg-dark-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dark-600">
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Alat</th>
                          <th className="text-right px-4 py-2 text-gray-400 font-medium">Harga Sewa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.rentals.map((r, i) => (
                          <tr key={i} className="border-b border-dark-600/50 last:border-0">
                            <td className="px-4 py-2">
                              <p className="text-white">{r.nama_alat}</p>
                              {r.spesifikasi && <p className="text-gray-500 text-xs">{r.spesifikasi}</p>}
                            </td>
                            <td className="px-4 py-2 text-right text-primary-400 font-medium">{formatRupiah(r.harga_satuan)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Tidak ada layanan/equipment */}
              {!detail.orders?.length && !detail.rentals?.length && !detail.nama_paket && (
                <div className="text-center py-4 text-gray-500 text-sm bg-dark-700/30 rounded-xl">
                  Tidak ada layanan, equipment, atau paket yang dipilih.
                </div>
              )}

              {/* Total Estimasi */}
              {grandTotal > 0 && (
                <div className="bg-primary-400/10 border border-primary-400/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 font-medium">Total Estimasi Biaya</span>
                    <span className="text-primary-400 font-bold text-xl">{formatRupiah(grandTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400 border-t border-primary-400/20 pt-2 mt-1">
                    <span>Down Payment 50%</span>
                    <span className="text-primary-300 font-semibold">{formatRupiah(grandTotal / 2)}</span>
                  </div>
                </div>
              )}

              {/* ─── Pembayaran DP ─────────────────────────────────────────── */}
              <section>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-400" /> Pembayaran Down Payment (DP)
                </h3>
                {!payment ? (
                  <div className="bg-dark-700/40 rounded-xl p-4 text-center text-gray-500 text-sm">
                    {['approved', 'confirmed'].includes(detail?.status_event)
                      ? '⏳ Customer belum mengirim bukti pembayaran DP.'
                      : 'Pembayaran DP hanya tersedia setelah event disetujui.'}
                  </div>
                ) : (
                  <div className="bg-dark-700/50 rounded-xl p-4 space-y-3">
                    {/* Status & Tipe */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-medium uppercase">
                          {payment.tipe_pembayaran === 'dp' ? 'Down Payment (DP)' : 'Full Payment'}
                        </span>
                        <StatusBadge status={payment.status_payment} />
                      </div>
                      <span className="text-gray-400 text-xs">
                        {payment.tanggal_payment
                          ? new Date(payment.tanggal_payment).toLocaleString('id-ID')
                          : ''}
                      </span>
                    </div>

                    {/* Nominal */}
                    {payment.jumlah_bayar && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Nominal Dibayar</span>
                        <span className="text-green-400 font-bold text-lg">{formatRupiah(payment.jumlah_bayar)}</span>
                      </div>
                    )}

                    {/* Bukti Transfer */}
                    {payment.bukti_transfer && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Bukti Transfer</p>
                        <div className="rounded-lg overflow-hidden border border-dark-600 bg-dark-800">
                          <img
                            src={getImageUrl(payment.bukti_transfer)}
                            alt="Bukti Transfer DP"
                            className="w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewImg(getImageUrl(payment.bukti_transfer))}
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setPreviewImg(getImageUrl(payment.bukti_transfer))}
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                          >
                            <FaImage /> Lihat Penuh
                          </button>
                          <a
                            href={getImageUrl(payment.bukti_transfer)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                          >
                            <FaExternalLinkAlt /> Buka di Tab Baru
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Catatan admin jika ditolak */}
                    {payment.status_payment === 'rejected' && payment.catatan_admin && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-400 mb-1">Alasan Penolakan Pembayaran</p>
                        <p className="text-sm text-red-300">{payment.catatan_admin}</p>
                      </div>
                    )}

                    {/* Tombol verifikasi payment jika masih pending */}
                    {payment.status_payment === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-dark-600">
                        <span className="text-xs text-gray-400 self-center">Verifikasi pembayaran ini di halaman</span>
                        <a
                          href={`/admin/payments`}
                          className="text-xs text-primary-400 hover:text-primary-300 underline self-center"
                        >
                          Kelola Pembayaran →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Catatan Admin / Cancel */}
              {detail.catatan_admin && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-400 mb-1">📌 Catatan Admin (Event)</p>
                  <p className="text-sm text-red-300">{detail.catatan_admin}</p>
                </div>
              )}
              {detail.catatan_cancel && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-yellow-400 mb-1">📌 Alasan Pembatalan</p>
                  <p className="text-sm text-yellow-300">{detail.catatan_cancel}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-dark-700">
                {detail.status_event === 'pending' && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <FaCheck /> Setujui Event
                    </button>
                    <button
                      onClick={() => setShowReject(true)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <FaTimes /> Tolak Event
                    </button>
                  </>
                )}
                {detail.status_event === 'approved' && (
                  <button
                    onClick={handleComplete}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-dark-600 text-white rounded-lg font-medium hover:bg-dark-500 transition-colors disabled:opacity-50"
                  >
                    Tandai Selesai
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-dark-700 text-gray-300 rounded-lg font-medium hover:bg-dark-600 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Reject Modal */}
      {showReject && detail && (
        <RejectEventModal
          event={detail}
          onConfirm={handleRejectSubmit}
          onCancel={() => setShowReject(false)}
          isLoading={isProcessing}
        />
      )}

      {/* Nested Image Preview Modal */}
      {previewImg && (
        <ImagePreviewModal src={previewImg} onClose={() => setPreviewImg(null)} />
      )}
    </>
  )
}

// Modal untuk mark event as lunas dengan metode pembayaran
function MarkLunasModal({ event, onConfirm, onCancel, isLoading }) {
  const [metode, setMetode] = useState('qris')

  const handleSubmit = () => {
    onConfirm(event.id_event, metode)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Tandai Event Sebagai Lunas</h2>
        <p className="text-gray-400 mb-6">
          <strong>{event.nama_customer}</strong> • <strong>{event.nama_event}</strong>
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
                onChange={e => setMetode(e.target.value)}
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManageEvents() {
  const [events,   setEvents]   = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [detailModal,  setDetailModal]  = useState(null)   // id_event yang dibuka
  const [rejectModal,  setRejectModal]  = useState({ show: false, event: null })
  const [lunasModal,   setLunasModal]   = useState({ show: false, event: null })
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage,  setCurrentPage]  = useState(1)
  const itemsPerPage = 10

  const handleLunasConfirm = async (id, metode) => {
    setIsProcessing(true)
    try {
      await eventPaymentService.updatePaymentStatus(id, 'verified', metode)
      toast.success('Event ditandai sebagai lunas')
      setLunasModal({ show: false, event: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menandai event sebagai lunas')
    } finally {
      setIsProcessing(false)
    }
  }

  const load = () => {
    setLoading(true)
    eventService.getAll()
      .then(({ data }) => { setEvents(data.data); setFiltered(data.data) })
      .catch(() => toast.error('Gagal memuat data event'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = events
    if (filter !== 'all') data = data.filter(e => e.status_event === filter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e =>
        e.nama_event?.toLowerCase().includes(q) ||
        e.nama_customer?.toLowerCase().includes(q)
      )
    }
    setFiltered(data)
    setCurrentPage(1)
  }, [filter, search, events])

  // Aksi status (dipakai dari tabel langsung atau dari modal detail)
  const handleAction = async (id, status, catatan = null) => {
    setIsProcessing(true)
    try {
      await eventService.updateStatus(id, status, catatan)
      const msgs = { approved: 'Event disetujui!', rejected: 'Event ditolak.', completed: 'Event ditandai selesai.' }
      toast.success(msgs[status] || 'Status diperbarui')
      setRejectModal({ show: false, event: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStatusFromTable = (id, status) => {
    if (status === 'rejected') {
      const event = events.find(e => e.id_event === id)
      setRejectModal({ show: true, event })
    } else {
      handleAction(id, status)
    }
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIdx   = (currentPage - 1) * itemsPerPage
  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)

  return (
    <AdminLayout title="Kelola Event">
      {/* Search & Filter */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-3 text-gray-500 text-sm" />
            <input type="text" placeholder="Cari event atau customer..."
              value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === s ? 'bg-primary-400 text-dark-900' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                }`}
              >
                {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  {['#','Event','Customer','Tanggal','Lokasi','Status','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada event ditemukan.</td></tr>
                ) : paginatedData.map((e, index) => (
                  <tr key={e.id_event} className="border-b border-dark-700/50 hover:bg-dark-700/20 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{startIdx + index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{e.nama_event}</p>
                      {e.nama_paket && <p className="text-gray-500 text-xs mt-0.5">📦 {e.nama_paket}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{e.nama_customer}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{e.tanggal_event?.split('T')[0] || e.tanggal_event}</td>
                    <td className="px-4 py-3 text-gray-300">{e.lokasi_event || '–'}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status_event} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Tombol Detail */}
                        <button
                          onClick={() => setDetailModal(e.id_event)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-dark-600 text-gray-300 hover:bg-primary-400 hover:text-dark-900 rounded-lg text-xs font-medium transition-colors"
                        >
                          <FaEye className="text-xs" /> Detail
                        </button>

                        {/* Aksi cepat */}
                        {e.status_event === 'pending' && (
                          <>
                            <button onClick={() => handleStatusFromTable(e.id_event, 'approved')}
                              disabled={isProcessing}
                              className="btn-success text-xs py-1 px-2 disabled:opacity-50">
                              Setujui
                            </button>
                            <button onClick={() => handleStatusFromTable(e.id_event, 'rejected')}
                              disabled={isProcessing}
                              className="btn-danger text-xs py-1 px-2 disabled:opacity-50">
                              Tolak
                            </button>
                          </>
                        )}
                        {e.status_event === 'approved' && (
                          <button onClick={() => handleStatusFromTable(e.id_event, 'completed')}
                            disabled={isProcessing}
                            className="btn-secondary text-xs py-1 px-2 disabled:opacity-50">
                            Selesai
                          </button>
                        )}
                        {e.status_event === 'confirmed' && e.status_payment === 'verified' && (
                          <>
                            {e.tipe_pembayaran === 'dp' && !e.metode ? (
                              <button
                                onClick={() => setLunasModal({ show: true, event: e })}
                                className="btn-primary text-xs py-1 px-2 flex items-center gap-1 bg-green-600 hover:bg-green-700 whitespace-nowrap"
                              >
                                <FaMoneyBillWave /> Lunas
                              </button>
                            ) : (
                              <span className="text-green-400 text-xs font-medium">✓ Sudah lunas</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
              <span className="text-sm text-gray-400">
                Menampilkan {Math.min(startIdx + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
              </span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  ← Sebelumnya
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page ? 'bg-primary-400 text-dark-900' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }`}>
                      {page}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Detail Event */}
      {detailModal && (
        <EventDetailModal
          eventId={detailModal}
          onClose={() => { setDetailModal(null); load() }}
          onAction={handleAction}
          isProcessing={isProcessing}
        />
      )}

      {/* Modal Reject (dari tombol di tabel) */}
      {rejectModal.show && rejectModal.event && (
        <RejectEventModal
          event={rejectModal.event}
          onConfirm={(id, catatan) => handleAction(id, 'rejected', catatan)}
          onCancel={() => setRejectModal({ show: false, event: null })}
          isLoading={isProcessing}
        />
      )}

      {/* Modal Lunas */}
      {lunasModal.show && lunasModal.event && (
        <MarkLunasModal
          event={lunasModal.event}
          onConfirm={handleLunasConfirm}
          onCancel={() => setLunasModal({ show: false, event: null })}
          isLoading={isProcessing}
        />
      )}
    </AdminLayout>
  )
}
