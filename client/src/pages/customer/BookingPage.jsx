import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import CalendarSchedule from '../../components/booking/CalendarSchedule'
import BookingForm from '../../components/booking/BookingForm'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { studioService } from '../../services'
import { FaArrowLeft } from 'react-icons/fa'

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

export default function BookingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [studio,       setStudio]       = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    studioService.getById(id)
      .then(({ data }) => setStudio(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleSuccess = (booking) => {
    navigate(`/payment/${booking.id_booking}`)
  }

  if (loading) return <div className="min-h-screen bg-dark-900"><Navbar /><LoadingSpinner text="Memuat..." /></div>

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link to="/studios" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm">
          <FaArrowLeft /> Kembali ke Daftar Studio
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Booking Studio</h1>

        {studio && (
          <div className="flex items-center gap-3 mb-8 p-4 bg-dark-800 rounded-xl border border-dark-700">
            <div className="w-12 h-12 bg-primary-400/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">{studio.nama_studio}</p>
              <p className="text-primary-400 text-sm">{formatRupiah(studio.harga_per_jam)} / jam</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">1. Pilih Tanggal</h2>
            <CalendarSchedule
              studioId={id}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">2. Pilih Jam & Konfirmasi</h2>
            <BookingForm
              studio={studio}
              selectedDate={selectedDate}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
