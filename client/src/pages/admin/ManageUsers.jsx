import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { userService } from '../../services'
import toast from 'react-hot-toast'
import { FaTrash, FaSearch, FaUser, FaUserShield, FaEdit, FaTimes } from 'react-icons/fa'

// Modal untuk edit user
function EditUserModal({ user, onConfirm, onCancel, isLoading }) {
  const [form, setForm] = useState({
    nama: user?.nama || '',
    email: user?.email || '',
    no_hp: user?.no_hp || '',
    role: user?.role || 'customer',
  })

  const handleSubmit = () => {
    if (!form.nama.trim()) {
      toast.error('Nama harus diisi')
      return
    }
    if (!form.email.trim()) {
      toast.error('Email harus diisi')
      return
    }
    onConfirm(user.id_user, form)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-4">Edit Data Pengguna</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama</label>
            <input 
              type="text" 
              value={form.nama}
              onChange={e => setForm({...form, nama: e.target.value})}
              className="input-field" 
              placeholder="Nama lengkap"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input 
              type="email" 
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="input-field" 
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">No. HP</label>
            <input 
              type="text" 
              value={form.no_hp}
              onChange={e => setForm({...form, no_hp: e.target.value})}
              className="input-field" 
              placeholder="08xx-xxxx-xxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <select 
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
              className="input-field"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-400 text-dark-900 rounded-lg font-medium hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ManageUsers() {
  const [users,   setUsers]   = useState([])
  const [filtered,setFiltered]= useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [editModal, setEditModal] = useState({ show: false, user: null })
  const [isSaving, setIsSaving] = useState(false)

  const load = () => {
    setLoading(true)
    userService.getAll()
      .then(({ data }) => { setUsers(data.data); setFiltered(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    const filtered_data = users.filter(u =>
      u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
    setFiltered(filtered_data)
    setCurrentPage(1)
  }, [search, users])

  const handleEdit = (user) => {
    setEditModal({ show: true, user })
  }

  const handleEditConfirm = async (id, formData) => {
    setIsSaving(true)
    try {
      await userService.update(id, formData)
      toast.success('Data pengguna berhasil diperbarui')
      setEditModal({ show: false, user: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus user ini?')) return
    try {
      await userService.delete(id)
      toast.success('User dihapus')
      load()
    } catch { toast.error('Gagal menghapus user') }
  }

  return (
    <AdminLayout title="Kelola Pengguna">
      <div className="relative mb-6 max-w-sm">
        <FaSearch className="absolute left-3 top-3 text-gray-500 text-sm" />
        <input type="text" placeholder="Cari pengguna..."
          value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  {['#','Nama','Email','No. HP','Role','Terdaftar','Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada user ditemukan.</td></tr>
                ) : (() => {
                  const totalPages = Math.ceil(filtered.length / itemsPerPage)
                  const startIdx = (currentPage - 1) * itemsPerPage
                  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage)
                  return paginatedData.map((u, index) => (
                <tr key={u.id_user} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                  <td className="px-4 py-3 text-gray-500">{startIdx + index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-400/20 rounded-full flex items-center justify-center text-xs font-bold text-primary-300">
                        {u.nama.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-white">{u.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3 text-gray-400">{u.no_hp || '–'}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === 'admin' ? 'bg-primary-400/20 text-primary-300' : 'bg-dark-700 text-gray-400'
                    }`}>
                      {u.role === 'admin' ? <FaUserShield /> : <FaUser />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button 
                      onClick={() => handleEdit(u)}
                      className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
                      <FaEdit /> Edit
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u.id_user)}
                        className="btn-danger text-xs py-1 px-2 flex items-center gap-1">
                        <FaTrash /> Hapus
                      </button>
                    )}
                  </td>
                </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (() => {
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
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg font-medium hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* Edit Modal */}
      {editModal.show && editModal.user && (
        <EditUserModal
          user={editModal.user}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditModal({ show: false, user: null })}
          isLoading={isSaving}
        />
      )}
    </AdminLayout>
  )
}
