import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { eventPkgService, eventEquipService } from '../../services'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaTools } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const emptyForm = { nama_paket: '', harga: '', deskripsi: '', fasilitas: '', durasi_hari: 1, status: 'aktif' }

export default function ManageEventPackages() {
  const [packages, setPackages] = useState([])
  const [filtered, setFiltered] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [equipModal, setEquipModal] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [pkgEquipment, setPkgEquipment] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const load = () => {
    setLoading(true)
    Promise.all([
      eventPkgService.getAll(),
      eventEquipService.getAll()
    ]).then(([pkgRes, equipRes]) => {
      setPackages(pkgRes.data.data)
      setFiltered(pkgRes.data.data)
      setEquipment(equipRes.data.data || [])
    })
    .catch(() => {})
    .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (search) {
      const q = search.toLowerCase()
      setFiltered(packages.filter(p =>
        p.nama_paket?.toLowerCase().includes(q) ||
        p.deskripsi?.toLowerCase().includes(q)
      ))
    } else {
      setFiltered(packages)
    }
    setCurrentPage(1)
  }, [search, packages])

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true) }
  const openEdit = (p) => {
    setForm({ 
      nama_paket: p.nama_paket, 
      harga: p.harga, 
      deskripsi: p.deskripsi || '', 
      fasilitas: p.fasilitas || '', 
      durasi_hari: p.durasi_hari || 1,
      status: p.status 
    })
    setEditId(p.id_package)
    setModal(true)
  }

  const openEquipmentModal = async (pkg) => {
    setSelectedPkg(pkg)
    try {
      const res = await eventEquipService.getByPackage(pkg.id_package)
      setPkgEquipment(res.data.data || [])
    } catch {
      setPkgEquipment([])
    }
    setEquipModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await eventPkgService.update(editId, form)
        toast.success('Paket berhasil diperbarui')
      } else {
        await eventPkgService.create(form)
        toast.success('Paket berhasil ditambahkan')
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
    if (!confirm('Yakin hapus paket ini?')) return
    try {
      await eventPkgService.delete(id)
      toast.success('Paket dihapus')
      load()
    } catch {
      toast.error('Gagal menghapus paket')
    }
  }

  const handleAddEquipment = async (id_equipment) => {
    try {
      await eventEquipService.addToPackage(selectedPkg.id_package, id_equipment)
      toast.success('Alat ditambahkan')
      // Reload equipment untuk package
      const res = await eventEquipService.getByPackage(selectedPkg.id_package)
      setPkgEquipment(res.data.data || [])
    } catch {
      toast.error('Gagal menambahkan alat')
    }
  }

  const handleRemoveEquipment = async (id_equipment) => {
    try {
      await eventEquipService.removeFromPackage(selectedPkg.id_package, id_equipment)
      toast.success('Alat dihapus')
      // Reload equipment untuk package
      const res = await eventEquipService.getByPackage(selectedPkg.id_package)
      setPkgEquipment(res.data.data || [])
    } catch {
      toast.error('Gagal menghapus alat')
    }
  }

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editId) return
    
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('gambar', file)
      await eventPkgService.uploadGambar(editId, formData)
      toast.success('Gambar berhasil diunggah')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload gambar')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <AdminLayout title="Kelola Paket Event">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex-1 relative max-w-sm w-full">
          <FaSearch className="absolute left-3 top-3 text-gray-500 text-sm" />
          <input type="text" placeholder="Cari paket..."
            value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-9" />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <FaPlus /> Tambah Paket
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full card text-center py-10 text-gray-500">Paket tidak ditemukan.</div>
            ) : (() => {
              const totalPages = Math.ceil(filtered.length / itemsPerPage)
              const startIdx = (currentPage - 1) * itemsPerPage
              const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)
              return paginatedData.map((p) => (
                <div key={p.id_package} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">{p.nama_paket}</p>
                      <p className="text-primary-400 font-bold text-lg">{formatRupiah(p.harga)} / hari</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${p.status === 'aktif' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.status}
                    </span>
                  </div>
                  {p.deskripsi && <p className="text-gray-400 text-sm mb-3">{p.deskripsi}</p>}
                  {p.fasilitas && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.fasilitas.split(',').slice(0,3).map((f, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-dark-700 rounded text-xs text-gray-400">{f.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-3 border-t border-dark-700">
                    <button onClick={() => openEdit(p)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                      <FaEdit /> Edit
                    </button>
                    <button onClick={() => openEquipmentModal(p)} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors">
                      <FaTools /> Alat
                    </button>
                    <button onClick={() => handleDelete(p.id_package)} className="flex-1 btn-danger text-xs py-1.5 flex items-center justify-center gap-1">
                      <FaTrash /> Hapus
                    </button>
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Pagination */}
          {filtered.length > itemsPerPage && (() => {
            const totalPages = Math.ceil(filtered.length / itemsPerPage)
            return (
              <div className="flex items-center justify-between mt-6 px-4">
                <span className="text-sm text-gray-400">
                  Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-{Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
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
                <h2 className="font-semibold text-white text-lg">{editId ? 'Edit Paket Event' : 'Tambah Paket Event'}</h2>
                <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
              </div>
            </div>
            <form id="pkg-form" onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Paket *</label>
                  <input type="text" placeholder="Paket Premium" value={form.nama_paket}
                    onChange={e => setForm({...form, nama_paket: e.target.value})}
                    className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Harga (Rp) *</label>
                  <input type="number" placeholder="10000000" value={form.harga}
                    onChange={e => setForm({...form, harga: e.target.value})}
                    className="input-field" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
                <textarea rows={2} value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})}
                  placeholder="Deskripsi paket..." className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Fasilitas (pisah koma)</label>
                <input type="text" value={form.fasilitas} onChange={e => setForm({...form, fasilitas: e.target.value})}
                  placeholder="Sound System, Lighting, MC" className="input-field" />
              </div>
              {editId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Upload Gambar Paket (opsional)</label>
                  <input type="file" accept="image/*" onChange={handleUploadImage} disabled={uploadingImage}
                    className="input-field" />
                  <p className="text-xs text-gray-500 mt-1">{uploadingImage ? 'Uploading...' : 'JPG, PNG, WebP max 5MB'}</p>
                </div>
              )}
            </form>
            <div className="flex gap-3 p-6 border-t border-dark-700 bg-dark-800 sticky bottom-0">
              <button type="button" onClick={() => setModal(false)} className="flex-1 btn-secondary">Batal</button>
              <button form="pkg-form" type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {equipModal && selectedPkg && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-lg">Kelola Alat - {selectedPkg.nama_paket}</h2>
              <button onClick={() => setEquipModal(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
            </div>

            <div className="space-y-6">
              {/* Alat yang Sudah Dipilih */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Alat yang Dipilih ({pkgEquipment.length})</h3>
                {pkgEquipment.length === 0 ? (
                  <p className="text-gray-400 text-sm">Belum ada alat yang dipilih.</p>
                ) : (
                  <div className="space-y-2">
                    {pkgEquipment.map(eq => (
                      <div key={eq.id_equipment} className="flex items-start justify-between p-3 bg-dark-700 rounded-lg">
                        <div>
                          <p className="font-medium text-white text-sm">{eq.nama_alat}</p>
                          {eq.spesifikasi && <p className="text-gray-400 text-xs mt-1">{eq.spesifikasi}</p>}
                        </div>
                        <button
                          onClick={() => handleRemoveEquipment(eq.id_equipment)}
                          className="px-3 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alat yang Tersedia */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Alat Tersedia</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {equipment.filter(eq => !pkgEquipment.some(pe => pe.id_equipment === eq.id_equipment)).length === 0 ? (
                    <p className="text-gray-400 text-sm">Semua alat sudah dipilih.</p>
                  ) : (
                    equipment.filter(eq => !pkgEquipment.some(pe => pe.id_equipment === eq.id_equipment)).map(eq => (
                      <div key={eq.id_equipment} className="flex items-start justify-between p-3 border border-dark-600 rounded-lg hover:border-dark-500 transition-colors">
                        <div>
                          <p className="font-medium text-white text-sm">{eq.nama_alat}</p>
                          {eq.spesifikasi && <p className="text-gray-400 text-xs mt-1">{eq.spesifikasi}</p>}
                        </div>
                        <button
                          onClick={() => handleAddEquipment(eq.id_equipment)}
                          className="px-3 py-1 text-xs bg-primary-400/20 text-primary-400 hover:bg-primary-400/40 rounded transition-colors whitespace-nowrap"
                        >
                          Tambah
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-dark-700 mt-6">
              <button
                type="button"
                onClick={() => setEquipModal(false)}
                className="flex-1 btn-primary"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
