import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { eventEquipService } from '../../services'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaCheck } from 'react-icons/fa'

const emptyForm = { nama_alat: '', spesifikasi: '', harga_sewa: 0, durasi_hari: 1, status: 'aktif', gambar: null }

export default function ManageEventEquipment() {
  const [equipment, setEquipment] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const load = () => {
    setLoading(true)
    eventEquipService.getAll()
      .then(res => {
        const data = res.data.data || []
        setEquipment(data)
        setFiltered(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (search) {
      const q = search.toLowerCase()
      setFiltered(equipment.filter(e =>
        e.nama_alat?.toLowerCase().includes(q) ||
        e.spesifikasi?.toLowerCase().includes(q)
      ))
    } else {
      setFiltered(equipment)
    }
    setCurrentPage(1)
  }, [search, equipment])

  const openCreate = () => { 
    setForm(emptyForm)
    setEditId(null)
    setModal(true)
  }

  const openEdit = (eq) => {
    setForm({
      nama_alat: eq.nama_alat,
      spesifikasi: eq.spesifikasi || '',
      harga_sewa: eq.harga_sewa || 0,
      durasi_hari: eq.durasi_hari || 1,
      status: eq.status,
      gambar: null
    })
    setEditId(eq.id_equipment)
    setModal(true)
  }



  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { gambar, ...dataToSave } = form
      if (editId) {
        await eventEquipService.update(editId, dataToSave)
        // Upload gambar if selected
        if (gambar) {
          const formData = new FormData()
          formData.append('gambar', gambar)
          await eventEquipService.uploadGambar(editId, formData)
        }
        toast.success('Alat berhasil diperbarui')
      } else {
        await eventEquipService.create(dataToSave)
        toast.success('Alat berhasil ditambahkan')
      }
      setModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus alat ini?')) return
    try {
      await eventEquipService.delete(id)
      toast.success('Alat dihapus')
      load()
    } catch {
      toast.error('Gagal menghapus alat')
    }
  }

  return (
    <AdminLayout title="Kelola Alat Event">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex-1 relative max-w-sm w-full">
          <FaSearch className="absolute left-3 top-3 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Cari alat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full pl-9"
          />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <FaPlus /> Tambah Alat
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Nama Alat</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Spesifikasi</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-300">Harga Sewa</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-300">Durasi (Hari)</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      Alat tidak ditemukan.
                    </td>
                  </tr>
                ) : (() => {
                  const totalPages = Math.ceil(filtered.length / itemsPerPage)
                  const startIdx = (currentPage - 1) * itemsPerPage
                  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)
                  return paginatedData.map((eq) => (
                    <tr key={eq.id_equipment} className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{eq.nama_alat}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{eq.spesifikasi || '-'}</td>
                      <td className="px-4 py-3 text-right text-primary-400 font-medium">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(eq.harga_sewa || 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{eq.durasi_hari || 1} hari</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          eq.status === 'aktif'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1 flex-wrap">
                          <button
                            onClick={() => openEdit(eq)}
                            className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                            title="Edit alat"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(eq.id_equipment)}
                            className="btn-danger text-xs py-1 px-2 flex items-center gap-1"
                            title="Hapus alat"
                          >
                            <FaTrash /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > itemsPerPage && (() => {
            const totalPages = Math.ceil(filtered.length / itemsPerPage)
            return (
              <div className="flex items-center justify-between mt-6 px-4">
                <span className="text-sm text-gray-400">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-
                  {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">
                  {editId ? 'Edit Alat Event' : 'Tambah Alat Event'}
                </h2>
                <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>
            </div>
            <form id="eq-form" onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Nama Alat *
                  </label>
                  <input
                    type="text"
                    placeholder="Microphone, Speaker, Lampu, dll"
                    value={form.nama_alat}
                    onChange={e => setForm({ ...form, nama_alat: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Harga Sewa (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={form.harga_sewa}
                    onChange={e => setForm({ ...form, harga_sewa: e.target.value })}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={form.durasi_hari}
                    onChange={e => setForm({ ...form, durasi_hari: e.target.value })}
                    className="input-field"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Spesifikasi
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: 10 unit, 500W, Wireless, dll"
                  value={form.spesifikasi}
                  onChange={e => setForm({ ...form, spesifikasi: e.target.value })}
                  className="input-field resize-none"
                />
              </div>
              {editId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Upload Gambar Alat (opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={e => setForm({...form, gambar: e.target.files?.[0] || null})}
                    className="input-field"
                  />
                  {form.gambar && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                      <FaCheck /> {form.gambar.name}
                    </div>
                  )}
                </div>
              )}
            </form>
            <div className="flex gap-3 p-6 border-t border-dark-700 bg-dark-800 sticky bottom-0">
              <button type="button" onClick={() => setModal(false)} className="flex-1 btn-secondary">
                Batal
              </button>
              <button form="eq-form" type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
