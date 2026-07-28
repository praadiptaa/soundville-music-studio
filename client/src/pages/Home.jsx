import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import SoundwaveEqualizer from '../components/ui/SoundwaveEqualizer'
import ScrollAnimation from '../components/ui/ScrollAnimation'
import GoogleMap from '../components/ui/GoogleMap'
import { FaCalendarAlt, FaBolt, FaStar, FaArrowRight, FaMapMarkerAlt, FaInstagram, FaTiktok, FaImage } from 'react-icons/fa'

const features = [
  { icon: <FaCalendarAlt className="text-2xl text-primary-400" />, title: 'Booking Mudah', desc: 'Pesan studio favoritmu kapan saja dan di mana saja secara online.' },
  { icon: <FaBolt className="text-2xl text-primary-400" />,        title: 'Jadwal Real-Time', desc: 'Cek ketersediaan jadwal studio secara langsung tanpa perlu telepon.' },
  { icon: <FaStar className="text-2xl text-primary-400" />,        title: 'Layanan Event', desc: 'Kami juga melayani event live music, private event, dan lainnya.' },
]

/**
 * Halaman Beranda Utama (Home Page)
 * 
 * @description
 * Halaman depan publik dari Soundville Music Studio. Menampilkan hero section dengan visualizer equalizer,
 * informasi fitur studio, galeri foto studio, detail layanan event, peta lokasi Google Maps,
 * tautan ke media sosial, serta tombol pendaftaran/login.
 * 
 * @component
 * @returns {React.ReactElement} Home Page element
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: 'url(/studio-hero.jpg)',
            backgroundAttachment: 'fixed'
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-dark-900 to-dark-900" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent-600/5 rounded-full blur-3xl -translate-y-1/4 -translate-x-1/4 animate-pulse" style={{animationDelay: '0.5s'}} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          {/* Logo Display */}
          <img 
            src="/logo.png" 
            alt="Soundville Logo" 
            className="h-40 mx-auto mb-12 object-contain animate-float drop-shadow-2xl" 
          />
          
          {/* Soundwave Animation */}
          <div className="flex justify-center mb-8">
            <SoundwaveEqualizer active={true} />
          </div>
          
          <div className="inline-flex items-center gap-2 bg-primary-400/10 border border-primary-400/30 rounded-full px-4 py-2 mb-8 animate-pulse backdrop-blur-md">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-glow" />
            <span className="text-primary-300 text-sm font-medium">Studio Musik Profesional</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Wujudkan Musik <span className="bg-gradient-to-r from-primary-400 to-accent-600 bg-clip-text text-transparent animate-pulse-glow">Terbaikmu</span><br/>
            <span className="text-primary-400">Bersama Soundville</span>
          </h1>
          
          <p className="text-gray-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-in-left" style={{animationDelay: '0.3s'}}>
            Studio rekaman dan latihan berstandar profesional. Booking mudah, jadwal fleksibel,
            dan layanan event lengkap untuk kebutuhan musikmu.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center animate-slide-in-right" style={{animationDelay: '0.6s'}}>
            <Link to="/studios" className="btn-primary text-base px-8 py-3 flex items-center gap-2 group">
              Lihat Studio 
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="btn-secondary text-base px-8 py-3 hover:translate-y-[-2px]">
              Daftar Gratis
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 mt-20 pt-10 border-t border-primary-400/20">
            {[['3+','Studio Tersedia'],['500+','Booking Selesai'],['100+','Customer Puas']].map(([num,label], idx) => (
              <ScrollAnimation key={label} animation="scale-in">
                <div className="text-center group cursor-pointer">
                  <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-400 to-accent-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                    {num}
                  </p>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-primary-300 transition-colors">{label}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Mengapa Soundville?</h2>
          <p className="text-gray-300 text-lg">Pengalaman studio terbaik dengan teknologi terkini dan layanan premium</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, idx) => (
            <ScrollAnimation key={f.title} animation="scale-in" style={{animationDelay: `${idx * 0.2}s`}}>
              <div className="card group hover:scale-105 cursor-pointer">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400/20 to-accent-600/20 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:from-primary-400/40 group-hover:to-accent-600/40 transition-all">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{f.icon}</span>
                </div>
                <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-primary-300 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="studio" className="max-w-7xl mx-auto px-6 py-20 border-t border-primary-400/20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Galeri Studio</h2>
          <p className="text-gray-300 text-lg">Lihat penampakan interior dan fasilitas studio kami</p>
          <p className="text-gray-400 text-sm mt-2">Untuk melihat paket harga dan booking, silakan login terlebih dahulu</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Gallery Item 1 */}
          <ScrollAnimation animation="scale-in">
            <div className="group relative overflow-hidden rounded-lg cursor-pointer h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-accent-600/40 z-10 group-hover:opacity-0 transition-opacity duration-300" />
              <img 
                src="/drum-set.jpg" 
                alt="Studio Drum Set" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                <div className="text-center">
                  <FaImage className="text-4xl text-primary-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">Set Drum</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Gallery Item 2 */}
          <ScrollAnimation animation="scale-in" style={{animationDelay: '0.1s'}}>
            <div className="group relative overflow-hidden rounded-lg cursor-pointer h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-accent-600/40 z-10 group-hover:opacity-0 transition-opacity duration-300" />
              <img 
                src="/guitar-set.jpg" 
                alt="Studio Guitar Set" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                <div className="text-center">
                  <FaImage className="text-4xl text-primary-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">Set Gitar</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Gallery Item 3 */}
          <ScrollAnimation animation="scale-in" style={{animationDelay: '0.2s'}}>
            <div className="group relative overflow-hidden rounded-lg cursor-pointer h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 to-accent-600/40 z-10 group-hover:opacity-0 transition-opacity duration-300" />
              <img 
                src="/amps.jpg" 
                alt="Studio Amplifier & Sound System" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                <div className="text-center">
                  <FaImage className="text-4xl text-primary-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">Amplifier & Sound System</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <ScrollAnimation animation="scale-in">
          <div className="card bg-gradient-to-r from-primary-900/50 via-dark-800 to-accent-900/30 border border-primary-400/30 text-center py-16 relative overflow-hidden group hover:border-primary-400/60">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400/10 to-accent-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap Booking Studio?</h2>
              <p className="text-gray-300 mb-10 text-lg">Daftar sekarang dan nikmati kemudahan booking studio musik berkualitas tinggi.</p>
              <Link to="/register" className="btn-primary text-base px-12 py-4 inline-flex items-center gap-2 group">
                Mulai Sekarang 
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* Event Section */}
      <section id="event" className="max-w-7xl mx-auto px-6 py-20 border-t border-primary-400/20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <ScrollAnimation animation="slide-in-left">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Layanan Event</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Selain studio booking, kami juga menyediakan layanan event musik untuk acara skala kecil hingga menengah. Mulai dari gigs intim, live akustik, open mic night, hingga private gathering dengan kualitas profesional dan harga yang terjangkau.
                </p>
              </div>

              {/* Event Services */}
              <div className="space-y-4">
                {[
                  { title: 'Gigs & Performances', desc: 'Pertunjukan musik live dengan sound system profesional untuk venue kecil maupun medium' },
                  { title: 'Live Akustik', desc: 'Event akustik intim dengan setup peralatan yang sesuai untuk menciptakan suasana hangat' },
                  { title: 'Open Mic Night', desc: 'Penyelenggaraan open mic night dengan host dan MC berpengalaman' },
                  { title: 'Private Gathering', desc: 'Event private Anda dengan paket musik live yang dapat disesuaikan' }
                ].map((service, idx) => (
                  <div key={service.title} className="flex items-start gap-3 group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary-400/20 flex items-center justify-center text-primary-400 group-hover:bg-primary-400/40 flex-shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold group-hover:text-primary-300 transition-colors">{service.title}</p>
                      <p className="text-gray-400 text-sm">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/event-request" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2 group hover:scale-105">
                Request Event Sekarang
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollAnimation>

          {/* Visual */}
          <ScrollAnimation animation="slide-in-right">
            <div className="relative">
              <div className="card bg-gradient-to-br from-primary-900/50 to-accent-900/30 border border-primary-400/30 p-12 text-center group hover:border-primary-400/60 relative overflow-hidden">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{
                    backgroundImage: 'url(/studio-hero.jpg)'
                  }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/70 via-dark-800/70 to-accent-900/70" />
                {/* Content */}
                <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3">Event Musik Skala Kecil</h3>
                <p className="text-gray-300 mb-6 text-sm">
                  Kami spesialis dalam menyelenggarakan event musik skala kecil hingga menengah dengan detail dan kualitas profesional. Perfect untuk gigs, gathering, atau acara komunitas musik Anda.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                    Sound System & Lighting Profesional
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                    Tim MC & Host Berpengalaman
                  </div>
                  <div className="flex items-center justify-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
                    Paket Harga Terjangkau & Fleksibel
                  </div>
                </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-7xl mx-auto px-6 py-20 border-t border-primary-400/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Hubungi Kami</h2>
          <p className="text-gray-300 text-lg">Temukan lokasi kami dan ikuti media sosial untuk update terbaru</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Contact Info */}
          <ScrollAnimation animation="slide-in-left">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Soundville Music Studio</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Kami berlokasi di Malang, Jawa Timur dengan akses mudah dari berbagai area. Studio kami dilengkapi dengan peralatan profesional dan suasana yang mendukung kreativitas musik Anda.
                </p>
              </div>

              <div className="card bg-primary-400/10 border border-primary-400/30 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-primary-400 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Alamat</p>
                    <p className="text-gray-400 text-sm">Jl. Bougenvile No.21A, Jatimulyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.75-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Telepon</p>
                    <p className="text-gray-400 text-sm"><a href="tel:+62851658308971" className="hover:text-primary-300">0851-6583-0897</a></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  <div>
                    <p className="font-semibold text-white">Jam Operasional</p>
                    <p className="text-gray-400 text-sm">Buka – Tutup pukul 23:00</p>
                  </div>
                </div>
              </div>

              <a href="https://www.google.com/maps/place/SoundVille+Studio/@-7.9553895,112.6242538,17z" target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center py-3 inline-flex items-center justify-center gap-2 group hover:scale-105">
                <FaMapMarkerAlt />
                Lihat di Google Maps
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </ScrollAnimation>

          {/* Map */}
          <ScrollAnimation animation="slide-in-right">
            <GoogleMap
              lat={-7.9553895}
              lng={112.6242538}
              zoom={17}
              title="Soundville Music Studio"
            />
          </ScrollAnimation>
        </div>

        {/* Social Media */}
        <div className="border-t border-primary-400/20 pt-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-3">Ikuti Soundville</h3>
            <p className="text-gray-300">Dapatkan update terbaru, tips musik, dan penawaran eksklusif</p>
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
              <h4 className="font-semibold text-white mb-2 text-lg">Instagram</h4>
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
              <h4 className="font-semibold text-white mb-2 text-lg">TikTok</h4>
              <p className="text-gray-400 text-sm mb-4">@soundville.studio4</p>
              <span className="inline-block bg-gray-700/20 text-gray-300 px-4 py-2 rounded-full text-sm group-hover:bg-gray-700/30 transition-colors">
                Follow Kami
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 Soundville Music Studio. All rights reserved.</p>
      </footer>
    </div>
  )
}
