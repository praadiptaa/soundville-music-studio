import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { operatorShiftService } from '../../services'
import { sendOperatorWaReminder } from '../../utils/whatsappHelper'
import toast from 'react-hot-toast'
import {
  FaCalendarAlt, FaClock, FaUserPlus, FaWhatsapp, FaTrash,
  FaCheckCircle, FaTimesCircle, FaUserCheck, FaUserTimes, FaSyncAlt
} from 'react-icons/fa'

export default function ManageShifts() {
  const [shifts, setShifts] = useState([])
  const [operators, setOperators] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    id_user: '',
    tanggal: '',
    jam_mulai: '08:00',
    jam_selesai: '16:00',
    catatan: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await operatorShiftService.getAll()
      if (res.data?.success) {
        setShifts(res.data.data.shifts || [])
        setOperators(res.data.data.operators || [])
        setStats(res.data.data.stats || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat data shift operator')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateShift = async (e) => {
    e.preventDefault()
    if (!formData.id_user || !formData.tanggal || !formData.jam_mulai || !formData.jam_selesai) {
      toast.error('Semua field wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await operatorShiftService.create(formData)
      if (res.data?.success) {
        toast.success('Jadwal shift berhasil ditambahkan!')
        setShowAddModal(false)
        setFormData({
          id_user: '',
          tanggal: '',
          jam_mulai: '08:00',
          jam_selesai: '16:00',
          catatan: '',
        })
        loadData()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat jadwal shift')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id_shift, newStatus) => {
    try {
      const res = await operatorShiftService.updateStatus(id_shift, { status_shift: newStatus })
      if (res.data?.success) {
        toast.success(`Status shift diubah menjadi "${newStatus}"`)
        loadData()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status shift')
    }
  }

  const handleDeleteShift = async (id_shift) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal shift ini?')) return
    try {
      const res = await operatorShiftService.delete(id_shift)
      if (res.data?.success) {
        toast.success('Shift berhasil dihapus')
        loadData()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus shift')
    }
  }

  const handleSendWa = (shift) => {
    sendOperatorWaReminder({
      phone: shift.no_hp,
      operatorName: shift.nama_operator,
      customerName: 'Customer Soundville',
      studioName: 'Studio Soundville',
      date: shift.tanggal,
      startTime: shift.jam_mulai?.substring(0, 5),
      endTime: shift.jam_selesai?.substring(0, 5)
    })
  }

  return (
    <AdminLayout title="Kelola Shift & Absensi Operator">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaCalendarAlt className="text-primary-400" /> Jadwal Standby Operator
          </h2>
          <p className="text-gray-400 text-sm">Atur shift piket mingguan, pencatatan absensi, dan reminder WhatsApp operator.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FaUserPlus /> Tambah Shift Operator
        </button>
      </div>

      {/* Ringkasan Absensi Operator */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {stats.length === 0 ? (
          <div className="card col-span-3 text-center text-gray-400 py-4">
            Belum ada user dengan role <span className="text-primary-400 font-semibold">Operator</span> terdaftar. Anda dapat mengubah role pengguna di menu <span className="text-white font-medium">Pengguna</span>.
          </div>
        ) : (
          stats.map(op => (
            <div key={op.id_user} className="card relative overflow-hidden border-dark-600">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white text-base">{op.nama_operator}</h3>
                <span className="text-xs bg-dark-700 text-primary-400 px-2 py-0.5 rounded font-mono">
                  {op.no_hp || 'No WA (-)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                <div className="bg-dark-900/60 p-2 rounded-lg border border-dark-700">
                  <p className="text-gray-400 mb-0.5">Total Shift</p>
                  <p className="text-base font-bold text-white">{op.total_shift || 0}</p>
                </div>
                <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                  <p className="text-green-400 mb-0.5">Hadir</p>
                  <p className="text-base font-bold text-green-400">{op.total_hadir || 0}</p>
                </div>
                <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <p className="text-red-400 mb-0.5">Absen/Off</p>
                  <p className="text-base font-bold text-red-400">{op.total_absen || 0}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table List Shift */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Tanggal</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Operator Piket</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Jam Standby</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status Kehadiran</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Catatan</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Aksi / Reminder WA</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Belum ada jadwal shift operator. Klik tombol "+ Tambah Shift Operator" di atas.
                  </td>
                </tr>
              ) : (
                shifts.map((s, idx) => (
                  <tr key={s.id_shift} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {s.tanggal}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-primary-400">{s.nama_operator}</p>
                      <p className="text-xs text-gray-500">{s.no_hp || s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap font-mono">
                      {s.jam_mulai?.substring(0, 5)} - {s.jam_selesai?.substring(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${
                        s.status_shift === 'present'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : s.status_shift === 'absent'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : s.status_shift === 'replaced'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {s.status_shift === 'present' && <FaCheckCircle />}
                        {s.status_shift === 'absent' && <FaTimesCircle />}
                        {s.status_shift === 'replaced' && <FaSyncAlt />}
                        {s.status_shift === 'scheduled' && <FaClock />}
                        {s.status_shift === 'present' ? 'Hadir' : s.status_shift === 'absent' ? 'Absen / Off' : s.status_shift === 'replaced' ? 'Digantikan' : 'Terjadwal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs italic">
                      {s.catatan || '–'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Status change actions */}
                        {s.status_shift !== 'present' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id_shift, 'present')}
                            title="Tandai Hadir"
                            className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg transition-colors"
                          >
                            <FaUserCheck />
                          </button>
                        )}
                        {s.status_shift !== 'absent' && (
                          <button
                            onClick={() => handleUpdateStatus(s.id_shift, 'absent')}
                            title="Tandai Absen/Tidak Standby"
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                          >
                            <FaUserTimes />
                          </button>
                        )}
                        
                        {/* WA Reminder Button */}
                        <button
                          onClick={() => handleSendWa(s)}
                          title="Kirim Pengingat WA ke Operator"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow transition-colors"
                        >
                          <FaWhatsapp className="text-sm" /> Ingatkan WA
                        </button>

                        {/* Delete Shift */}
                        <button
                          onClick={() => handleDeleteShift(s.id_shift)}
                          title="Hapus Shift"
                          className="p-1.5 bg-dark-700 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Shift */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-white font-bold text-lg mb-4">Tambah Shift Operator Baru</h3>
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pilih Operator *</label>
                {operators.length === 0 ? (
                  <p className="text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                    Belum ada pengguna dengan role Operator. Ubah role user menjadi Operator terlebih dahulu di menu <strong>Pengguna</strong>.
                  </p>
                ) : (
                  <select
                    value={formData.id_user}
                    onChange={e => setFormData({ ...formData, id_user: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">-- Pilih Operator --</option>
                    {operators.map(op => (
                      <option key={op.id_user} value={op.id_user}>
                        {op.nama} ({op.no_hp || op.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Tanggal Shift *</label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    value={formData.jam_mulai}
                    onChange={e => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Jam Selesai *</label>
                  <input
                    type="time"
                    value={formData.jam_selesai}
                    onChange={e => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Catatan Shift (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Piket pagi & persiapkan kabel drum"
                  value={formData.catatan}
                  onChange={e => setFormData({ ...formData, catatan: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || operators.length === 0}
                  className="btn-primary"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
