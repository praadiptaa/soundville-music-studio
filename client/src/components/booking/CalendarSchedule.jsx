import { useState, useEffect, useCallback } from 'react'
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from 'date-fns'
import { id } from 'date-fns/locale'
import { bookingService } from '../../services'
import { FaChevronLeft, FaChevronRight, FaCircle } from 'react-icons/fa'

// Helper function untuk format date string tanpa timezone issue
const formatDateString = (year, month, day) => {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// Helper untuk get today tanpa timezone issue
const getTodayString = () => {
  const now = new Date()
  return formatDateString(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/**
 * Component Kalender Jadwal Booking Studio
 * 
 * @description
 * Menampilkan kalender bulanan interaktif yang menampilkan status ketersediaan slot studio,
 * menandai hari-hari yang telah ter-booking, dan memungkinkan pemilihan tanggal sewa.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.studioId - ID Studio musik yang dipilih
 * @param {Function} props.onDateSelect - Callback saat tanggal kalender diklik/dipilih
 * @param {string} props.selectedDate - Tanggal yang sedang aktif terpilih (format YYYY-MM-DD)
 * @returns {React.ReactElement} CalendarSchedule element
 */
export default function CalendarSchedule({ studioId, onDateSelect, selectedDate }) {
  const [currentMonth, setCurrentMonth]     = useState(new Date())
  const [bookedDates, setBookedDates]       = useState([])  // ['2024-03-15', ...]
  const [loading, setLoading]               = useState(false)

  const fetchMonthSchedule = useCallback(async () => {
    if (!studioId) return
    setLoading(true)
    try {
      const year  = currentMonth.getFullYear()
      const month = currentMonth.getMonth() + 1
      const { data } = await bookingService.getScheduleMonth(studioId, year, month)
      // Normalize semua tanggal ke format YYYY-MM-DD (pisahkan timezone jika ada)
      const dates = [...new Set(
        data.data.map(b => {
          const dateStr = b.tanggal
          // Jika ada 'T' (ISO format), ambil bagian tanggal saja
          if (typeof dateStr === 'string' && dateStr.includes('T')) {
            return dateStr.split('T')[0]
          }
          // Jika sudah format YYYY-MM-DD, kembalikan as-is
          return dateStr
        })
      )]
      console.log(`[DEBUG] CalendarSchedule fetchMonthSchedule - Month ${month}/${year}: received ${data.data.length} bookings, unique dates: ${dates.length}`);
      console.log(`  Booked dates: ${dates.join(', ')}`);
      data.data.forEach(b => console.log(`  - ${b.tanggal} ${b.jam_mulai}~${b.jam_selesai}`));
      setBookedDates(dates)
    } catch (err) {
      console.error('[ERROR] CalendarSchedule - fetchMonthSchedule failed:', err)
      setBookedDates([])
    } finally {
      setLoading(false)
    }
  }, [studioId, currentMonth])

  useEffect(() => { fetchMonthSchedule() }, [fetchMonthSchedule])

  const daysInMonth   = getDaysInMonth(currentMonth)
  const firstDayOfMonth = getDay(startOfMonth(currentMonth)) // 0=Sun
  const today           = getTodayString()

  const renderDays = () => {
    const cells = []
    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} />)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      // Format date using helper function to avoid timezone issues
      const dateStr = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day)
      
      const isBooked   = bookedDates.includes(dateStr)
      const isPast     = dateStr < today
      const isSelected = dateStr === selectedDate
      const isToday    = dateStr === today

      cells.push(
        <button
          key={day}
          disabled={isPast}
          onClick={() => !isPast && onDateSelect && onDateSelect(dateStr)}
          className={`
            relative h-10 w-full rounded-lg text-sm font-medium transition-all
            ${isSelected  ? 'bg-primary-400 text-dark-900 font-bold ring-2 ring-primary-300' : ''}
            ${isToday && !isSelected ? 'ring-1 ring-primary-400 text-primary-300' : ''}
            ${isBooked && !isSelected ? 'bg-orange-500/20 text-orange-400' : ''}
            ${isPast ? 'text-gray-700 cursor-not-allowed' : ''}
            ${!isPast && !isSelected && !isBooked ? 'text-gray-300 hover:bg-dark-700' : ''}
          `}
        >
          {day}
          {isBooked && !isSelected && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
          )}
        </button>
      )
    }
    return cells
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors">
          <FaChevronLeft />
        </button>
        <h3 className="font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors">
          <FaChevronRight />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
          <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-dark-700 flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary-400 inline-block" /> Dipilih</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30 inline-block" /> Ada Booking</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded ring-1 ring-primary-400 inline-block" /> Hari Ini</span>
      </div>
    </div>
  )
}
