import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { bookingService } from '../../services'
import { FaClock, FaRupeeSign, FaInfoCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'

const schema = yup.object({
  jam_mulai:  yup.string().required('Jam mulai wajib diisi'),
  jam_selesai:yup.string()
    .required('Jam selesai wajib diisi')
    .test('after-start', 'Jam selesai harus lebih dari jam mulai', function(val) {
      return val > this.parent.jam_mulai
    }),
  catatan: yup.string(),
})

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const TIME_SLOTS = [
  '07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00',
  '19:00','20:00','21:00','22:00',
]

/**
 * Component Form Pemesanan/Booking Studio
 * 
 * @description
 * Menyediakan form interaktif untuk memilih jam booking studio, menghitung total harga
 * berdasarkan durasi jam, memvalidasi bentrok jadwal, dan mengirimkan order.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.studio - Data studio terpilh (id_studio, harga_per_jam, dll)
 * @param {string} props.selectedDate - Tanggal booking yang dipilih (format YYYY-MM-DD)
 * @param {Function} props.onSuccess - Callback function setelah booking berhasil dibuat
 * @returns {React.ReactElement} BookingForm element
 */
export default function BookingForm({ studio, selectedDate, onSuccess }) {
  const [bookedSlots, setBookedSlots]   = useState([])
  const [totalHarga,  setTotalHarga]    = useState(0)
  const [loading,     setLoading]       = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const jamMulai   = watch('jam_mulai')
  const jamSelesai = watch('jam_selesai')

  // Ambil jadwal hari ini untuk tahu slot yang sudah terpakai
  useEffect(() => {
    if (!studio || !selectedDate) return
    setCheckLoading(true)
    bookingService.getSchedule(studio.id_studio, selectedDate)
      .then(({ data }) => setBookedSlots(data.data))
      .catch(() => {})
      .finally(() => setCheckLoading(false))
  }, [studio, selectedDate])

  // Hitung total harga realtime
  useEffect(() => {
    if (jamMulai && jamSelesai && jamSelesai > jamMulai) {
      const start = parseFloat(jamMulai.split(':')[0]) + parseFloat(jamMulai.split(':')[1]) / 60
      const end   = parseFloat(jamSelesai.split(':')[0]) + parseFloat(jamSelesai.split(':')[1]) / 60
      const durasi = end - start
      setTotalHarga(durasi * studio.harga_per_jam)
    } else {
      setTotalHarga(0)
    }
  }, [jamMulai, jamSelesai, studio])

  const isSlotBooked = (slot) => {
    return bookedSlots.some(b => {
      const bStart = b.jam_mulai.substring(0, 5)
      const bEnd   = b.jam_selesai.substring(0, 5)
      return slot >= bStart && slot < bEnd
    })
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const { data } = await bookingService.create({
        id_studio:   studio.id_studio,
        tanggal:     selectedDate,
        jam_mulai:   values.jam_mulai,
        jam_selesai: values.jam_selesai,
        catatan:     values.catatan,
      })
      toast.success('Booking berhasil! Silakan upload bukti pembayaran.')
      onSuccess?.(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedDate) {
    return (
      <div className="card text-center py-12">
        <FaInfoCircle className="text-4xl text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Pilih tanggal pada kalender untuk melanjutkan booking.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
      <div>
        <h3 className="font-semibold text-white text-lg mb-1">Form Booking</h3>
        <p className="text-sm text-gray-400">Tanggal: <span className="text-primary-400 font-medium">{selectedDate}</span></p>
      </div>

      {/* Jam Mulai */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Jam Mulai</label>
        <select {...register('jam_mulai')} className="input-field">
          <option value="">-- Pilih Jam --</option>
          {TIME_SLOTS.map(slot => (
            <option key={slot} value={slot} disabled={isSlotBooked(slot)}>
              {slot} {isSlotBooked(slot) ? '(Terpesan)' : ''}
            </option>
          ))}
        </select>
        {errors.jam_mulai && <p className="text-red-400 text-xs mt-1">{errors.jam_mulai.message}</p>}
      </div>

      {/* Jam Selesai */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Jam Selesai</label>
        <select {...register('jam_selesai')} className="input-field">
          <option value="">-- Pilih Jam --</option>
          {TIME_SLOTS.filter(s => !jamMulai || s > jamMulai).map(slot => (
            <option key={slot} value={slot} disabled={isSlotBooked(slot)}>
              {slot} {isSlotBooked(slot) ? '(Terpesan)' : ''}
            </option>
          ))}
        </select>
        {errors.jam_selesai && <p className="text-red-400 text-xs mt-1">{errors.jam_selesai.message}</p>}
      </div>

      {/* Jadwal terpakai hari ini */}
      {bookedSlots.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <p className="text-orange-400 text-xs font-medium mb-2">Slot Terpesan Hari Ini:</p>
          <div className="space-y-1">
            {bookedSlots.map(b => (
              <div key={b.id_booking} className="text-xs text-orange-300 flex gap-2">
                <FaClock className="mt-0.5 flex-shrink-0" />
                {b.jam_mulai?.substring(0,5)} – {b.jam_selesai?.substring(0,5)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catatan */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Catatan (Opsional)</label>
        <textarea {...register('catatan')} rows={2} placeholder="Kebutuhan khusus, dll..."
          className="input-field resize-none" />
      </div>

      {/* Total */}
      {totalHarga > 0 && (
        <div className="bg-primary-400/10 border border-primary-400/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Total Pembayaran:</span>
            <span className="text-primary-400 font-bold text-xl">{formatRupiah(totalHarga)}</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {jamMulai} – {jamSelesai} ({(() => {
                const start = parseFloat(jamMulai.split(':')[0]) + parseFloat(jamMulai.split(':')[1]) / 60
                const end   = parseFloat(jamSelesai.split(':')[0]) + parseFloat(jamSelesai.split(':')[1]) / 60
                const dur   = end - start
                return dur % 1 === 0 ? dur : dur.toFixed(1)
              })()} jam)
          </p>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? 'Memproses...' : 'Konfirmasi Booking'}
      </button>
    </form>
  )
}
