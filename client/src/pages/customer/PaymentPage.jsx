import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import StatusBadge from '../../components/ui/StatusBadge'
import { bookingService, paymentService } from '../../services'
import toast from 'react-hot-toast'
import { FaUpload, FaCheckCircle, FaReceipt, FaInfoCircle } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const PAYMENT_METHODS = [
  { value: 'qris', label: 'QRIS' },
]

export default function PaymentPage() {
  const { id } = useParams()       // id_booking
  const navigate = useNavigate()
  const [booking, setBooking]   = useState(null)
  const [payment, setPayment]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [metode,  setMetode]    = useState('qris')
  const [tipePembayaran, setTipePembayaran] = useState('dp') // 'dp' or 'lunas'
  const [metodePelunasan, setMetodePelunasan] = useState('qris') // 'qris' or 'cash' for repayment
  const [file,    setFile]      = useState(null)
  const [preview, setPreview]   = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done,    setDone]      = useState(false)

  const isPelunasanPhase = payment && payment.status_payment === 'verified' && payment.tipe_pembayaran === 'dp' && !payment.metode

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch booking (wajib berhasil)
        const bookingRes = await bookingService.getById(id)
        setBooking(bookingRes.data.data)
      } catch (err) {
        const statusCode = err.response?.status
        const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan'
        if (statusCode === 403) {
          toast.error('Anda tidak memiliki akses ke booking ini')
          navigate('/bookings')
        } else if (statusCode === 404) {
          toast.error('Booking tidak ditemukan')
          navigate('/bookings')
        } else if (statusCode === 401) {
          toast.error('Session kadaluarsa, silakan login kembali')
          navigate('/login')
        } else {
          toast.error(errorMsg)
        }
        setLoading(false)
        return
      }

      // Fetch payment (boleh gagal jika belum ada, 404 = normal)
      try {
        const paymentRes = await paymentService.getByBookingId(id)
        if (paymentRes.data.data) {
          const pay = paymentRes.data.data
          setPayment(pay)
          // Jika ini DP verified dan belum lunas, otomatis set tipePembayaran ke lunas (untuk pelunasan)
          if (pay.status_payment === 'verified' && pay.tipe_pembayaran === 'dp' && !pay.metode) {
            setTipePembayaran('lunas')
          }
        }
      } catch (err) {
        // 404 = payment belum ada, itu normal - jangan redirect
        if (err.response?.status !== 404) {
          console.error('Error fetching payment:', err)
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
    formData.append('id_booking', id)
    formData.append('tipe_pembayaran', tipePembayaran)
    // Jangan kirim metode - metode di-set saat admin mark as "Lunas"
    formData.append('bukti_transfer', file)

    setSubmitting(true)
    try {
      await paymentService.upload(formData)
      setDone(true)
      toast.success('Bukti pembayaran berhasil dikirim!')
    } catch (err) {
      const statusCode = err.response?.status
      const errorMsg = err.response?.data?.message || 'Gagal upload bukti'
      
      // Handle specific errors
      if (statusCode === 403) {
        toast.error('Anda tidak memiliki akses ke booking ini')
        navigate('/bookings')
      } else if (statusCode === 404) {
        toast.error('Booking tidak ditemukan')
        navigate('/bookings')
      } else if (statusCode === 401) {
        toast.error('Session kadaluarsa, silakan login kembali')
        navigate('/login')
      } else if (statusCode === 400) {
        toast.error(errorMsg) // e.g., pembayaran sudah dikirim
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
          <h2 className="text-2xl font-bold text-white mb-3">Pembayaran Dikirim!</h2>
          <p className="text-gray-400 mb-8">Bukti transfer kamu sudah diterima. Admin akan memverifikasi dalam 1×24 jam.</p>
          <button onClick={() => navigate('/bookings')} className="btn-primary px-8 py-3">
            Lihat Riwayat Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Upload Bukti Pembayaran</h1>

        {/* Booking Summary */}
        {booking && (
          <div className="card mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-400/10 rounded-lg flex items-center justify-center">
                <FaReceipt className="text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Ringkasan Booking #{booking.id_booking}</p>
                <p className="text-gray-400 text-sm">{booking.nama_studio}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Tanggal', booking.tanggal?.split('T')[0] || booking.tanggal],
                ['Jam',     `${booking.jam_mulai?.substring(0,5)} – ${booking.jam_selesai?.substring(0,5)}`],
                ['Status',  booking.status_booking],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-gray-500">{k}:</span>
                  <span className="text-white ml-2">{v}</span>
                </div>
              ))}
              <div className="col-span-2 pt-3 border-t border-dark-700 flex items-center justify-between">
                <span className="text-gray-400">Total Pembayaran</span>
                <span className="text-primary-400 font-bold text-xl">{formatRupiah(booking.total_harga)}</span>
              </div>
            </div>
          </div>
        )}

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
                {payment.tipe_pembayaran === 'lunas' ? 'Pelunasan Langsung' : 'DP (Uang Muka)'}
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
                <p className="text-sm text-green-300">✓ Pembayaran kamu telah diverifikasi. Booking telah dikonfirmasi.</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Form - Show only if payment belum ada, atau rejected, atau dalam fase pelunasan */}
        {(!payment || payment.status_payment === 'rejected' || isPelunasanPhase) && (
          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Metode Pembayaran - QRIS Only for initial, not shown in pelunasan choice */}
            {!isPelunasanPhase && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Metode Pembayaran</label>
                <div className="p-3 rounded-lg border border-primary-400 bg-primary-400/10">
                  <p className="text-sm text-gray-300 font-medium">QRIS</p>
                </div>
              </div>
            )}

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
                    <p className="font-semibold text-white mb-1">DP (Uang Muka)</p>
                    <p className="text-xs text-gray-400">Bayar Rp 20.000 sekarang, sisanya bayar di studio.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipePembayaran('lunas')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      tipePembayaran === 'lunas'
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-600 bg-dark-800 hover:border-dark-500'
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">Pelunasan Langsung</p>
                    <p className="text-xs text-gray-400">Bayar {booking ? formatRupiah(booking.total_harga) : 'Penuh'} sekarang.</p>
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
                    <p className="text-xs text-gray-400">Bayar sisa Rp {booking ? (booking.total_harga - 20000).toLocaleString('id-ID') : '0'} secara online.</p>
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
                    <p className="text-xs text-gray-400">Bayar sisa Rp {booking ? (booking.total_harga - 20000).toLocaleString('id-ID') : '0'} langsung di studio.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Tampilan Pembayaran QRIS */}
            {(!isPelunasanPhase || metodePelunasan === 'qris') && (
              <div className="p-4 bg-primary-400/10 border border-primary-400/30 rounded-xl">
                <p className="text-sm text-gray-400 mb-3">
                  {isPelunasanPhase ? 'Lakukan Pelunasan Sisa Pembayaran' : tipePembayaran === 'dp' ? 'Lakukan Pembayaran DP' : 'Lakukan Pelunasan Pembayaran'}
                </p>
                <div className="text-3xl font-bold text-primary-400 mb-4">
                  {isPelunasanPhase ? (booking ? formatRupiah(booking.total_harga - 20000) : 'Rp 0') : tipePembayaran === 'dp' ? 'Rp 20.000' : booking ? formatRupiah(booking.total_harga) : 'Rp 0'}
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
                  ℹ️ Anda memilih untuk melunasi sisa pembayaran sebesar <strong>{booking ? formatRupiah(booking.total_harga - 20000) : 'Rp 0'}</strong> secara tunai langsung di kasir studio.
                </p>
                <p className="text-xs text-gray-400">
                  Silakan tunjukkan detail bukti booking Anda kepada admin kasir Soundville Music Studio saat Anda datang ke studio untuk latihan.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="btn-primary w-full py-3"
                >
                  Kembali ke Riwayat Booking
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
