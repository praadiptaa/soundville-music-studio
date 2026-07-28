import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import { eventService, eventPaymentService } from '../../services'
import toast from 'react-hot-toast'
import { FaUpload, FaCheckCircle, FaInfoCircle, FaQrcode } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// Helper function to calculate equipment total price
const calculateEquipmentTotal = (event) => {
  if (!event.rentals || event.rentals.length === 0) return 0
  return event.rentals.reduce((sum, rental) => sum + parseFloat(rental.total_harga || 0), 0)
}

// Helper function to calculate total price
const calculateTotalPrice = (event) => {
  let total = 0
  // Add package price (adjusted or regular)
  if (event.id_package) {
    total += parseFloat(event.paket_biaya_adjusted || event.paket_harga || 0)
  }
  // Add services price
  total += parseFloat(event.total_biaya || 0)
  // Add equipment price
  total += calculateEquipmentTotal(event)
  return total
}

export default function EventPaymentPage() {
  const { id } = useParams() // id_event
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tipePembayaran, setTipePembayaran] = useState('dp') // 'dp' or 'full_payment'
  const [metodePelunasan, setMetodePelunasan] = useState('qris') // 'qris' or 'cash' for repayment
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const isPelunasanPhase = payment && payment.status_payment === 'verified' && payment.tipe_pembayaran === 'dp' && !payment.metode

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await eventService.getById(id)
        if (!data.data) throw new Error('Event data tidak valid')
        setEvent(data.data)
      } catch (err) {
        const statusCode = err.response?.status
        const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan'
        
        // Handle different error scenarios
        if (statusCode === 403) {
          toast.error('Anda tidak memiliki akses ke event ini')
          navigate('/events')
        } else if (statusCode === 404) {
          toast.error('Event tidak ditemukan')
          navigate('/events')
        } else if (statusCode === 401) {
          toast.error('Session kadaluarsa, silakan login kembali')
          navigate('/login')
        } else {
          toast.error(errorMsg)
        }
        setLoading(false)
        return
      }

      // Fetch payment
      try {
        const { data } = await eventPaymentService.getByEventId(id)
        if (data.data) {
          const pay = data.data
          setPayment(pay)
          // Jika ini DP verified dan belum lunas, otomatis set tipePembayaran ke full_payment (untuk pelunasan)
          if (pay.status_payment === 'verified' && pay.tipe_pembayaran === 'dp' && !pay.metode) {
            setTipePembayaran('full_payment')
          }
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching event payment:', err)
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [id, navigate])

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Upload bukti transfer')

    const formData = new FormData()
    formData.append('id_event', id)
    formData.append('tipe_pembayaran', tipePembayaran)
    formData.append('bukti_transfer', file)

    setSubmitting(true)
    try {
      await eventPaymentService.upload(formData)
      setDone(true)
      toast.success('Bukti pembayaran event berhasil dikirim!')
    } catch (err) {
      const statusCode = err.response?.status
      const errorMsg = err.response?.data?.message || 'Gagal upload bukti'
      
      // Handle specific errors
      if (statusCode === 403) {
        toast.error('Anda tidak memiliki akses ke event ini')
        navigate('/events')
      } else if (statusCode === 404) {
        toast.error('Event tidak ditemukan')
        navigate('/events')
      } else if (statusCode === 401) {
        toast.error('Session kadaluarsa, silakan login kembali')
        navigate('/login')
      } else if (statusCode === 400) {
        toast.error(errorMsg)
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-dark-900"><Navbar /><LoadingSpinner /></div>

  if (done) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-5xl text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Pembayaran Event Dikirim!</h2>
          <p className="text-gray-400 mb-8">Bukti transfer event kamu sudah diterima. Admin akan memverifikasi dalam 1x24 jam.</p>
          <button onClick={() => navigate('/events')} className="btn-primary px-8 py-3">
            Lihat Status Event
          </button>
        </div>
      </div>
    )
  }

  const grandTotal = event ? calculateTotalPrice(event) : 0
  const totalDP = grandTotal * 0.5
  const remainingPayment = payment ? grandTotal - parseFloat(payment.jumlah_bayar || 0) : totalDP

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">
          {isPelunasanPhase ? 'Pelunasan Event' : 'Pembayaran Event'}
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {isPelunasanPhase 
            ? 'Silakan selesaikan sisa pembayaran untuk event request Anda' 
            : 'Silakan lakukan pembayaran event request Anda'}
        </p>

        {/* Payment Status & Rejection Note */}
        {payment && (
          <div className="card mb-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="font-semibold text-white">Status Pembayaran</p>
              <StatusBadge status={payment.status_payment} />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-dark-700 text-sm">
              <span className="text-gray-400">Tipe Pembayaran</span>
              <span className="text-white font-medium capitalize">
                {payment.tipe_pembayaran === 'full_payment' ? 'Pelunasan Langsung' : 'DP (50%)'}
              </span>
            </div>
            
            {/* Rejection note */}
            {payment.status_payment === 'rejected' && payment.catatan_admin && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex gap-2 items-start">
                  <FaInfoCircle className="text-red-500 text-sm flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1">Alasan Penolakan</p>
                    <p className="text-sm text-red-300">{payment.catatan_admin}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending note */}
            {payment.status_payment === 'pending' && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300">ℹ️ Pembayaran sedang diverifikasi oleh admin. Mohon tunggu.</p>
              </div>
            )}

            {/* Verified note */}
            {payment.status_payment === 'verified' && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">✓ Pembayaran DP kamu telah diverifikasi. Event kamu telah disetujui.</p>
              </div>
            )}
          </div>
        )}

        {/* Event Summary card */}
        {event && (
          <div className="card mb-6">
            <div className="flex items-start gap-3 mb-4">
              <FaInfoCircle className="text-primary-400 mt-1" />
              <div className="flex-1">
                <p className="text-white font-semibold">{event.nama_event}</p>
                <p className="text-gray-400 text-sm">Lokasi: {event.lokasi_event || '-'}</p>
                <div className="mt-2"><StatusBadge status={event.status_event} /></div>
              </div>
            </div>

            <div className="pt-4 border-t border-dark-700 space-y-3">
              {/* Event Duration */}
              <div className="bg-dark-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">📅 Durasi Event</p>
                <p className="text-sm text-white">
                  {event.tanggal_event?.split('T')[0] || event.tanggal_event}
                  {event.tanggal_selesai && ` hingga ${event.tanggal_selesai?.split('T')[0] || event.tanggal_selesai}`}
                </p>
                {event.jumlah_hari && <p className="text-xs text-gray-400 mt-1">({event.jumlah_hari} hari)</p>}
              </div>

              {/* Package Info if exists */}
              {event.id_package && (
                <div className="bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20">
                  <p className="text-xs text-gray-500 mb-2">📦 Paket Event</p>
                  <p className="text-sm text-white font-medium">{event.nama_paket || 'Paket Terpilih'}</p>
                </div>
              )}

              {/* Price Breakdown */}
              {event.id_package && (event.paket_biaya_adjusted || event.paket_harga) && (
                <div className="flex justify-between items-center text-sm">
                  <p className="text-gray-400">📦 Harga Paket</p>
                  <p className="font-semibold text-white">{formatRupiah(event.paket_biaya_adjusted || event.paket_harga || 0)}</p>
                </div>
              )}
              {event.total_biaya > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <p className="text-gray-400">🎵 Layanan Tambahan</p>
                  <p className="font-semibold text-white">{formatRupiah(event.total_biaya || 0)}</p>
                </div>
              )}
              {event.rentals && event.rentals.length > 0 && (
                <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 text-sm">
                  <p className="text-xs text-gray-500 mb-2">🔧 Alat Tambahan</p>
                  <div className="space-y-1">
                    {event.rentals.map(rental => (
                      <div key={rental.id_rental} className="flex items-center justify-between text-xs">
                        <p className="text-white">{rental.nama_alat}</p>
                        <p className="text-orange-300 font-semibold">{formatRupiah(rental.total_harga)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-t border-dark-700">
                <p className="text-sm text-gray-300 font-medium">Total Event</p>
                <p className="text-xl font-bold text-primary-400">{formatRupiah(grandTotal)}</p>
              </div>
              {payment && payment.tipe_pembayaran === 'dp' && (
                <div className="flex justify-between items-center text-sm py-2 border-t border-dashed border-dark-700">
                  <span className="text-gray-400">Telah Dibayar (DP 50%)</span>
                  <span className="text-green-400 font-semibold">{formatRupiah(payment.jumlah_bayar)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Form - Show only if payment belum ada, atau rejected, atau dalam fase pelunasan */}
        {event && (!payment || payment.status_payment === 'rejected' || isPelunasanPhase) && (
          <form onSubmit={handleSubmit} className="card space-y-6">
            
            {/* Pilihan Tipe Pembayaran (hanya di awal) */}
            {!isPelunasanPhase && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Pilihan Pembayaran</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTipePembayaran('dp')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tipePembayaran === 'dp'
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">DP (Uang Muka 50%)</p>
                    <p className="text-xs text-gray-400">Bayar {formatRupiah(totalDP)} sekarang, sisanya bayar nanti.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipePembayaran('full_payment')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tipePembayaran === 'full_payment'
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">Pelunasan Langsung</p>
                    <p className="text-xs text-gray-400">Bayar Penuh {formatRupiah(grandTotal)} sekarang.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Pilihan Metode Pelunasan (hanya saat fase pelunasan) */}
            {isPelunasanPhase && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Pilihan Metode Pelunasan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMetodePelunasan('qris')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      metodePelunasan === 'qris'
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">Pelunasan via QRIS (Transfer)</p>
                    <p className="text-xs text-gray-400">Bayar sisa {formatRupiah(remainingPayment)} secara online.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodePelunasan('cash')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      metodePelunasan === 'cash'
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">Pelunasan via Cash (Tunai)</p>
                    <p className="text-xs text-gray-400">Bayar sisa {formatRupiah(remainingPayment)} langsung di studio.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Tampilan Pembayaran QRIS */}
            {(!isPelunasanPhase || metodePelunasan === 'qris') && (
              <div className="p-4 bg-primary-400/10 border border-primary-400/30 rounded-xl">
                <p className="text-sm text-gray-400 mb-3">
                  {isPelunasanPhase 
                    ? 'Lakukan Pelunasan Sisa Pembayaran Event' 
                    : tipePembayaran === 'dp' ? 'Lakukan Pembayaran DP Event' : 'Lakukan Pelunasan Pembayaran Event'}
                </p>
                <div className="text-3xl font-bold text-primary-400 mb-4">
                  {formatRupiah(isPelunasanPhase ? remainingPayment : (tipePembayaran === 'dp' ? totalDP : grandTotal))}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-300 font-medium">Scan QR Code QRIS kami di bawah ini:</p>
                  <div className="flex justify-center">
                    <div className="w-full max-w-lg aspect-square bg-white rounded-lg p-4 flex items-center justify-center">
                      <img
                        src="/qris.jpeg"
                        alt="QRIS QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Gunakan aplikasi e-wallet atau mobile banking untuk scan QR Code</p>
                </div>
              </div>
            )}

            {/* Tampilan Pembayaran Cash di Studio */}
            {isPelunasanPhase && metodePelunasan === 'cash' && (
              <div className="p-5 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-4">
                <p className="text-sm text-orange-300">
                  ℹ️ Anda memilih untuk melunasi sisa pembayaran sebesar <strong>{formatRupiah(remainingPayment)}</strong> secara tunai langsung di kasir studio.
                </p>
                <p className="text-xs text-gray-400">
                  Silakan tunjukkan detail bukti event Anda kepada admin Soundville Music Studio saat Anda datang ke studio untuk latihan/event.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/events')}
                  className="btn-primary w-full py-3 text-center"
                >
                  Kembali ke Status Event
                </button>
              </div>
            )}

            {/* Upload form and Submit button (hanya jika online QRIS) */}
            {(!isPelunasanPhase || metodePelunasan === 'qris') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {isPelunasanPhase ? 'Bukti Transfer Pelunasan' : 'Bukti Transfer'}
                  </label>
                  <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                    preview ? 'border-primary-400' : 'border-dark-600 hover:border-dark-500'
                  }`}>
                    {preview ? (
                      <img src={preview} alt="preview" className="h-36 object-contain rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <FaUpload className="text-2xl text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">
                          {isPelunasanPhase ? 'Klik untuk upload bukti pelunasan' : 'Klik untuk upload'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">JPG, PNG, PDF (max 5MB)</p>
                      </div>
                    )}
                    <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <FaUpload />
                  {submitting ? 'Mengirim...' : isPelunasanPhase ? 'Kirim Bukti Pelunasan' : 'Kirim Bukti Pembayaran'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}