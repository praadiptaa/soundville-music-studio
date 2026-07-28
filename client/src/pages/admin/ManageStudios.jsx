import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { studioService } from '../../services'
import toast from 'react-hot-toast'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaCheck } from 'react-icons/fa'

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const emptyForm = { nama_studio:'', harga_per_jam:'', deskripsi:'', fasilitas:'', status:'aktif', gambar: null }

export default function ManageStudios() {
  const [studios, setStudios] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(emptyForm)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)

  const load = () => {
    setLoading(true)
    studioService.getAll().then(({ data }) => { setStudios(data.data); setFiltered(data.data) }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (search) {
      const q = search.toLowerCase()
      setFiltered(studios.filter(s =>
        s.nama_studio?.toLowerCase().includes(q) ||
        s.deskripsi?.toLowerCase().includes(q)
      ))
    } else {
      setFiltered(studios)
    }
  }, [search, studios])

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true) }
  const openEdit   = (s) => {
    setForm({ nama_studio: s.nama_studio, harga_per_jam: s.harga_per_jam, deskripsi: s.deskripsi || '', fasilitas: s.fasilitas || '', status: s.status, gambar: null })
    setEditId(s.id_studio)
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { gambar, ...dataToSave } = form
      if (editId) {
        await studioService.update(editId, dataToSave)
        // Upload gambar if selected
        if (gambar) {
          const formData = new FormData()
          formData.append('gambar', gambar)
          await studioService.uploadGambar(editId, formData)
        }
        toast.success('Studio berhasil diperbarui')
      } else {
        const res = await studioService.create(dataToSave)
        toast.success('Studio berhasil ditambahkan')
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
    if (!confirm('Yakin hapus studio ini?')) return
    try {
      await studioService.delete(id)
      toast.success('Studio dihapus')
      load()
    } catch {
      toast.error('Gagal menghapus studio')
    }
  }



  return (
    <AdminLayout title="Kelola Studio">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex-1 relative max-w-sm w-full">
          <FaSearch className="absolute left-3 top-3 text-gray-500 text-sm" />
          <input type="text" placeholder="Cari studio..."
            value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full pl-9" />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <FaPlus /> Tambah Studio
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full card text-center py-10 text-gray-500">Studio tidak ditemukan.</div>
          ) : filtered.map(s => (
            <div key={s.id_studio} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{s.nama_studio}</p>
                  <p className="text-primary-400 font-medium">{formatRupiah(s.harga_per_jam)}/jam</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'aktif' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {s.status}
                </span>
              </div>
              {s.deskripsi && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{s.deskripsi}</p>}
              {s.fasilitas && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {s.fasilitas.split(',').slice(0,3).map((f,i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-dark-700 rounded text-xs text-gray-400">{f.trim()}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-3 border-t border-dark-700">
                <button onClick={() => openEdit(s)} className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1">
                  <FaEdit /> Edit
                </button>
                <button onClick={() => handleDelete(s.id_studio)} className="flex-1 btn-danger text-xs py-1.5 flex items-center justify-center gap-1">
                  <FaTrash /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">{editId ? 'Edit Studio' : 'Tambah Studio'}</h2>
                <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FaTimes /></button>
              </div>
            </div>
            <form id="studio-form" onSubmit={handleSave} className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Studio</label>
                  <input type="text" placeholder="Studio A" value={form.nama_studio}
                    onChange={e => setForm({...form, nama_studio: e.target.value})}
                    className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Harga per Jam (Rp)</label>
                  <input type="number" placeholder="150000" value={form.harga_per_jam}
                    onChange={e => setForm({...form, harga_per_jam: e.target.value})}
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
                  placeholder="Deskripsi studio..." className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Fasilitas (pisah koma)</label>
                <input type="text" value={form.fasilitas} onChange={e => setForm({...form, fasilitas: e.target.value})}
                  placeholder="Drum Kit, Guitar Amp, Bass Amp" className="input-field" />
              </div>
              {editId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Upload Gambar Studio (opsional)</label>
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
              <button type="button" onClick={() => setModal(false)} className="flex-1 btn-secondary">Batal</button>
              <button form="studio-form" type="submit" disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
