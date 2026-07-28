import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { eventService, eventPkgService, eventEquipService } from '../../services'
import { getImageUrl } from '../../utils/imageUrl'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { FaStar, FaCheckCircle, FaBox, FaTools } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export default function EventRequest() {
  const navigate = useNavigate()
  const [packages,     setPackages]     = useState([])
  const [allEquipment, setAllEquipment] = useState([])
  const [pkgEquipment, setPkgEquipment] = useState([])
  const [selectedPkg,  setSelectedPkg]  = useState(null)  // id_package
  const [selectedEquip, setSelectedEquip] = useState(new Set())  // Set<id_equipment>
  const [loading,      setLoading]      = useState(false)
  const [submitted,    setSubmitted]    = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const getTodayString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = getTodayString()
  const tanggalEvent = watch('tanggal_event')

  useEffect(() => {
    eventPkgService.getAll().then(res => setPackages(res.data.data))
    eventEquipService.getAll().then(res => setAllEquipment(res.data.data || []))
  }, [])

  // Load package-specific equipment when package is selected
  useEffect(() => {
    if (selectedPkg) {
      eventEquipService.getByPackage(selectedPkg).then(res => {
        setPkgEquipment(res.data.data || [])
      }).catch(() => setPkgEquipment([]))
    } else {
      setPkgEquipment([])
    }
  }, [selectedPkg])

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      await eventService.create({ 
        ...values, 
        id_package: selectedPkg || null,
        tanggal_mulai_paket: selectedPkg ? values.tanggal_event : null,
        tanggal_selesai_paket: selectedPkg ? (values.tanggal_selesai || values.tanggal_event) : null,
        selected_equipment: Array.from(selectedEquip)
      })
      setSubmitted(true)
      toast.success('Request event berhasil dikirim!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim request')
    } finally {
      setLoading(false)
    }
  }

  const toggleEquipment = (id_equipment) => {
    const newSet = new Set(selectedEquip)
    if (newSet.has(id_equipment)) {
      newSet.delete(id_equipment)
    } else {
      newSet.add(id_equipment)
    }
    setSelectedEquip(newSet)
  }

  // Get equipment to display - if package selected, show package equipment; otherwise show all
  const displayEquipment = selectedPkg ? pkgEquipment : allEquipment

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-5xl text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Request Terkirim!</h2>
          <p className="text-gray-400 mb-8">Tim Soundville akan menghubungi kamu untuk konfirmasi event.</p>
          <button onClick={() => navigate('/events')} className="btn-primary px-8 py-3">
            Lihat Status Event
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Request Event</h1>
        <p className="text-gray-400 mb-8">Ajukan permintaan event musik atau private event kamu.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Detail Event */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <FaStar className="text-yellow-400" /> Detail Event
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Event *</label>
                <input {...register('nama_event', { required: 'Wajib diisi' })}
                  placeholder="Live Music Birthday Party" className="input-field" />
                {errors.nama_event && <p className="text-red-400 text-xs mt-1">{errors.nama_event.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tanggal Mulai *</label>
                <input {...register('tanggal_event', { required: 'Wajib diisi' })}
                  type="date" min={today} className="input-field" />
                {errors.tanggal_event && <p className="text-red-400 text-xs mt-1">{errors.tanggal_event.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tanggal Selesai</label>
                <input {...register('tanggal_selesai')}
                  type="date" min={tanggalEvent || today} className="input-field" />
                {errors.tanggal_selesai && <p className="text-red-400 text-xs mt-1">{errors.tanggal_selesai.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Lokasi Event</label>
              <input {...register('lokasi_event')} placeholder="Nama venue / alamat" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi Event</label>
              <textarea {...register('deskripsi')} rows={3}
                placeholder="Ceritakan kebutuhan event kamu..."
                className="input-field resize-none" />
            </div>
          </div>

          {/* Pilih Paket Event */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FaBox className="text-cyan-400" /> Pilih Paket Event (Opsional)
            </h2>
            {packages.length === 0 ? (
              <p className="text-gray-400 text-sm">Tidak ada paket yang tersedia.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {packages.map(pkg => (
                  <button
                    key={pkg.id_package}
                    type="button"
                    onClick={() => setSelectedPkg(pkg.id_package)}
                    className={`p-4 rounded-lg border-2 transition-all text-left overflow-hidden ${
                      selectedPkg === pkg.id_package
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    {pkg.gambar && (
                      <img 
                        src={getImageUrl(pkg.gambar)} 
                        alt={pkg.nama_paket}
                        className="w-full h-32 object-cover rounded mb-3 bg-dark-600"
                      />
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-white text-sm">{pkg.nama_paket}</p>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedPkg === pkg.id_package
                          ? 'border-primary-400 bg-primary-400'
                          : 'border-gray-500'
                      }`}>
                        {selectedPkg === pkg.id_package && <div className="w-2 h-2 bg-dark-900 rounded-full" />}
                      </div>
                    </div>
                    <p className="text-primary-400 font-bold text-sm mb-2">{formatRupiah(pkg.harga)} / hari</p>
                    {pkg.deskripsi && <p className="text-gray-400 text-xs mb-2">{pkg.deskripsi}</p>}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {pkg.status === 'aktif' && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Aktif</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedPkg && (
              <button
                type="button"
                onClick={() => setSelectedPkg(null)}
                className="mt-4 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                ✕ Batal pilih paket
              </button>
            )}
          </div>

          {/* Pilih Alat Tambahan */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FaTools className="text-orange-400" /> Alat Tambahan {selectedPkg ? '(Paket)' : '(Semua)'}
            </h2>
            {displayEquipment.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {selectedPkg ? 'Paket ini tidak memiliki alat tambahan.' : 'Tidak ada alat yang tersedia.'}
              </p>
            ) : (
              <div className="space-y-3">
                {displayEquipment.map(eq => (
                  <div key={eq.id_equipment} className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedEquip.has(eq.id_equipment)
                      ? 'border-orange-400 bg-orange-400/10'
                      : 'border-dark-600 hover:border-dark-500'
                  }`}
                  onClick={() => toggleEquipment(eq.id_equipment)}>
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-1 flex items-center justify-center ${
                      selectedEquip.has(eq.id_equipment)
                        ? 'border-orange-400 bg-orange-400'
                        : 'border-gray-500'
                    }`}>
                      {selectedEquip.has(eq.id_equipment) && <div className="w-2 h-2 bg-dark-900 rounded-full" />}
                    </div>
                    {eq.gambar && (
                      <img 
                        src={getImageUrl(eq.gambar)} 
                        alt={eq.nama_alat}
                        className="w-16 h-16 rounded object-cover flex-shrink-0 bg-dark-600"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white text-sm">{eq.nama_alat}</p>
                        {eq.harga_sewa && <p className="text-orange-400 font-semibold text-sm">{formatRupiah(eq.harga_sewa)}</p>}
                      </div>
                      {eq.spesifikasi && <p className="text-gray-400 text-xs mt-1">{eq.spesifikasi}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedEquip.size > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-700">
                <p className="text-sm text-gray-400">
                  Alat terpilih: <span className="text-orange-400 font-semibold">{selectedEquip.size}</span>
                </p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Mengirim...' : 'Kirim Request Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
