import { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import StudioCard from '../components/studio/StudioCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { studioService } from '../services'
import { FaSearch } from 'react-icons/fa'

export default function StudioList() {
  const [studios, setStudios]   = useState([])
  const [filtered, setFiltered] = useState([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    studioService.getAll('aktif')
      .then(({ data }) => { setStudios(data.data); setFiltered(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(studios.filter(s =>
      s.nama_studio.toLowerCase().includes(q) ||
      (s.deskripsi || '').toLowerCase().includes(q) ||
      (s.fasilitas  || '').toLowerCase().includes(q)
    ))
  }, [search, studios])

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Daftar Studio</h1>
          <p className="text-gray-400">Pilih studio yang sesuai dengan kebutuhanmu</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <FaSearch className="absolute left-3 top-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Cari studio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {loading ? (
          <LoadingSpinner text="Memuat studio..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Studio tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(studio => <StudioCard key={studio.id_studio} studio={studio} />)}
          </div>
        )}
      </div>
    </div>
  )
}
