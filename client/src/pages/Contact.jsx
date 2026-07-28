import Navbar from '../components/layout/Navbar'
import GoogleMap from '../components/ui/GoogleMap'
import ScrollAnimation from '../components/ui/ScrollAnimation'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaStar, FaInstagram, FaTiktok } from 'react-icons/fa'

const contactInfo = [
  {
    icon: <FaMapMarkerAlt className="text-2xl" />,
    title: 'Lokasi',
    content: 'Jl. Bougenvile No.21A, Kota Malang',
    color: 'from-primary-400 to-primary-600'
  },
  {
    icon: <FaPhone className="text-2xl" />,
    title: 'Telepon',
    content: '0851-6583-0897',
    color: 'from-accent-400 to-accent-600'
  },
  {
    icon: <FaEnvelope className="text-2xl" />,
    title: 'Provinsi',
    content: 'Jawa Timur',
    color: 'from-yellow-400 to-yellow-600'
  },
  {
    icon: <FaClock className="text-2xl" />,
    title: 'Jam Operasional',
    content: 'Buka – Tutup pukul 23:00',
    color: 'from-blue-400 to-blue-600'
  },
]

/**
 * Halaman Kontak & Lokasi Studio (Contact Page)
 * 
 * @description
 * Halaman publik untuk menampilkan informasi kontak studio musik, peta interaktif Google Maps,
 * detail alamat lengkap, tautan media sosial, serta rating ulasan studio.
 * 
 * @component
 * @returns {React.ReactElement} Contact Page element
 */
export default function Contact() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-dark-900 to-dark-900" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-6 text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Kunjungi <span className="bg-gradient-to-r from-primary-400 to-accent-600 bg-clip-text text-transparent">Soundville</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Lokasi strategis kami siap menyambut Anda untuk pengalaman studio musik terbaik
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, idx) => (
            <ScrollAnimation key={info.title} animation="scale-in" style={{animationDelay: `${idx * 0.15}s`}}>
              <div className="card text-center group hover:scale-105 cursor-pointer">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${info.color} p-4 text-dark-900 group-hover:shadow-lg group-hover:shadow-primary-400/30 transition-all`}>
                  {info.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{info.title}</h3>
                <p className="text-gray-400 text-sm group-hover:text-primary-300 transition-colors">{info.content}</p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-12 items-center">
          {/* Info */}
          <ScrollAnimation animation="slide-in-left" className="md:col-span-1">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Temukan Kami</h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Soundville Music Studio berlokasi di Malang, Jawa Timur. Kami menyediakan fasilitas premium dengan suasana yang nyaman untuk mendukung proses kreatif Anda.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {[
                  'Lokasi Strategis di Pusat Kota',
                  'Parkir Luas & Aman',
                  'Fasilitas Lengkap',
                  'Akses 24 Jam (Booking)',
                ].map((feature, idx) => (
                  <div key={feature} className="flex items-center gap-3 text-gray-300 group hover:text-primary-300 transition-colors cursor-pointer" style={{animationDelay: `${idx * 0.1}s`}}>
                    <div className="w-8 h-8 rounded-full bg-primary-400/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-400/40">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-4">
                <a
                  href="https://www.google.com/maps/search/Soundville+Music+Studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-8 py-3 inline-flex items-center gap-2 hover:scale-105 group"
                >
                  <FaMapMarkerAlt />
                  Buka di Google Maps
                </a>
              </div>
            </div>
          </ScrollAnimation>

          {/* Map */}
          <ScrollAnimation animation="scale-in" className="md:col-span-2">
            <GoogleMap
              lat={-7.9553895}
              lng={112.6242538}
              zoom={17}
              title="Soundville Music Studio"
            />
          </ScrollAnimation>
        </div>
      </section>

      {/* Studio Rating */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-primary-400/20">
        <ScrollAnimation animation="scale-in">
          <div className="card text-center p-12">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className="text-2xl text-primary-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p className="text-4xl font-bold text-white mb-2">4.9 / 5.0</p>
            <p className="text-gray-400 text-lg mb-2">Berdasarkan 487 ulasan dari pelanggan</p>
            <p className="text-gray-500">"Studio terbaik dengan layanan yang luar biasa!" - Customer</p>
          </div>
        </ScrollAnimation>
      </section>

      {/* Social Media */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-primary-400/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ikuti Soundville</h2>
          <p className="text-gray-300 text-lg">Dapatkan update terbaru, tips musik, dan penawaran eksklusif</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/soundvillemusic/"
            target="_blank"
            rel="noopener noreferrer"
            className="card group hover:scale-105 cursor-pointer text-center p-8 transition-all"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-all">
              <FaInstagram className="text-4xl" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-xl">Instagram</h3>
            <p className="text-gray-400 text-sm mb-4">@soundvillemusic</p>
            <span className="inline-block bg-pink-500/20 text-pink-300 px-4 py-2 rounded-full text-sm group-hover:bg-pink-500/30 transition-colors">
              Follow Kami
            </span>
          </a>

          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@soundville.studio4"
            target="_blank"
            rel="noopener noreferrer"
            className="card group hover:scale-105 cursor-pointer text-center p-8 transition-all"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-black to-gray-800 flex items-center justify-center text-white group-hover:shadow-lg group-hover:shadow-white/50 transition-all">
              <FaTiktok className="text-4xl" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-xl">TikTok</h3>
            <p className="text-gray-400 text-sm mb-4">@soundville.studio4</p>
            <span className="inline-block bg-gray-700/20 text-gray-300 px-4 py-2 rounded-full text-sm group-hover:bg-gray-700/30 transition-colors">
              Follow Kami
            </span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-10 border-t border-dark-700 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Soundville Music Studio. All rights reserved.</p>
      </footer>
    </div>
  )
}
