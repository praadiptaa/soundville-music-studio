import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import CalendarSchedule from '../components/booking/CalendarSchedule'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { studioService, bookingService } from '../services'
import { FaClock, FaArrowLeft, FaArrowRight, FaCheck, FaTimes } from 'react-icons/fa'

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

// Generate all operational hours (09:00 - 23:00)
const generateHours = () => {
  const hours = []
  for (let h = 9; h < 23; h++) {
    const start = `${String(h).padStart(2, '0')}:00`
    const end = `${String(h + 1).padStart(2, '0')}:00`
    hours.push({ jam_mulai: start, jam_selesai: end })
  }
  return hours
}

export default function StudioSchedule() {
  const { id } = useParams()
  const [studio,       setStudio]       = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [daySchedule,  setDaySchedule]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [dayLoading,   setDayLoading]   = useState(false)

  useEffect(() => {
    studioService.getById(id)
      .then(({ data }) => setStudio(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!selectedDate) return
    setDayLoading(true)
    // Normalize tanggal ke format YYYY-MM-DD (ambil bagian tanggal aja, tanpa konversi timezone)
    const normalizedDate = selectedDate.split('T')[0]
    console.log(`[DEBUG] StudioSchedule useEffect - selectedDate: "${selectedDate}", normalizedDate: "${normalizedDate}"`)
    bookingService.getSchedule(id, normalizedDate)
      .then(({ data }) => {
        console.log(`[DEBUG] StudioSchedule getSchedule - Received ${data.data.length} booked slots`);
        data.data.forEach(b => console.log(`  - ${b.tanggal} ${b.jam_mulai}~${b.jam_selesai}`));
        setDaySchedule(data.data)
      })
      .catch((err) => {
        console.error('[ERROR] StudioSchedule getSchedule failed:', err);
      })
      .finally(() => setDayLoading(false))
  }, [selectedDate, id])

  // Helper function to check if slot is booked
  const isSlotBooked = (jam_mulai, jam_selesai) => {
    return daySchedule.some(b => 
      b.jam_mulai?.substring(0, 5) === jam_mulai && 
      b.jam_selesai?.substring(0, 5) === jam_selesai
    )
  }

  // Get all hours for the day with status
  const getAllHoursWithStatus = () => {
    return generateHours().map(hour => ({
      ...hour,
      isBooked: isSlotBooked(hour.jam_mulai, hour.jam_selesai),
      bookingCount: daySchedule.filter(b =>
        b.jam_mulai?.substring(0, 5) === hour.jam_mulai &&
        b.jam_selesai?.substring(0, 5) === hour.jam_selesai
      ).length
    }))
  }

  if (loading) return <div className="min-h-screen bg-dark-900"><Navbar /><LoadingSpinner text="Memuat data studio..." /></div>
  if (!studio) return <div className="min-h-screen bg-dark-900"><Navbar /><div className="p-10 text-center text-gray-400">Studio tidak ditemukan.</div></div>

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back */}
        <Link to="/studios" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
          <FaArrowLeft /> Kembali ke Daftar Studio
        </Link>

        {/* Studio info */}
        <div className="card mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">{studio.nama_studio}</h1>
            <p className="text-primary-400 font-semibold text-xl mb-3">{formatRupiah(studio.harga_per_jam)}<span className="text-gray-500 font-normal text-sm"> / jam</span></p>
            <p className="text-gray-400 text-sm mb-3">{studio.deskripsi}</p>
            {studio.fasilitas && (
              <div className="flex flex-wrap gap-1">
                {studio.fasilitas.split(',').map((f, i) => (
                  <span key={i} className="px-2 py-0.5 bg-dark-700 rounded text-xs text-gray-400 border border-dark-600">{f.trim()}</span>
                ))}
              </div>
            )}
          </div>
          <div className="md:self-start">
            <Link to={`/booking/${studio.id_studio}`} className="btn-primary flex items-center gap-2">
              Booking Sekarang <FaArrowRight />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Kalender */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Kalender Jadwal</h2>
            <CalendarSchedule studioId={id} onDateSelect={setSelectedDate} selectedDate={selectedDate} />
          </div>

          {/* Detail jadwal hari dipilih */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              {selectedDate ? `Jadwal Tanggal ${selectedDate}` : 'Pilih Tanggal'}
            </h2>
            {!selectedDate ? (
              <div className="card text-center py-12 text-gray-500">
                <FaClock className="text-4xl mx-auto mb-3 opacity-50" />
                <p>Pilih tanggal untuk melihat detail jadwal</p>
              </div>
            ) : dayLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="space-y-3">
                {/* Display all hours with availability status */}
                {getAllHoursWithStatus().map((hour, idx) => (
                  <div 
                    key={idx} 
                    className={`card flex items-center gap-3 py-3 px-4 transition-all border ${
                      hour.isBooked 
                        ? 'border-orange-500/30 bg-orange-500/5' 
                        : 'border-green-500/30 bg-green-500/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      hour.isBooked 
                        ? 'bg-orange-500/10' 
                        : 'bg-green-500/10'
                    }`}>
                      {hour.isBooked ? (
                        <FaTimes className="text-orange-400" />
                      ) : (
                        <FaCheck className="text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">
                        {hour.jam_mulai} – {hour.jam_selesai}
                      </p>
                      <p className={`text-gray-500 text-xs ${hour.isBooked ? 'text-orange-400' : 'text-green-400'}`}>
                        {hour.isBooked 
                          ? `${hour.bookingCount} customer terpesan` 
                          : 'Tersedia'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
