/**
 * Component Peta Google Maps Embed (GoogleMap)
 * 
 * @description
 * Menyediakan iframe terintegrasi dengan Google Maps untuk menampilkan lokasi studio musik
 * beserta navigasi rute (directions) dan link pencarian maps.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} [props.lat=-7.9553895] - Titik koordinat Latitude
 * @param {number} [props.lng=112.6242538] - Titik koordinat Longitude
 * @param {number} [props.zoom=17] - Tingkat perbesaran peta
 * @param {string} [props.title="Soundville Music Studio"] - Nama/Judul lokasi
 * @param {string} [props.address] - Alamat lengkap studio
 * @returns {React.ReactElement} GoogleMap element
 */
export default function GoogleMap({ 
  lat = -7.9553895, 
  lng = 112.6242538, 
  zoom = 17,
  title = "Soundville Music Studio",
  address = "Jl. Bougenvile No.21A, Jatimulyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141"
}) {
  const mapEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.912467159632!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd6291ad791cdc3%3A0x8d8ffec273b07284!2sSoundVille%20Studio!5e0!3m2!1sid!2sid!4v1234567890`;
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const mapsUrl = `https://www.google.com/maps/search/${title}/@${lat},${lng},${zoom}z`;

  return (
    <div className="w-full space-y-4">
      {/* Map Embed */}
      <div className="card p-0 overflow-hidden h-96 hover:shadow-xl hover:shadow-primary-400/20 transition-all">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen=""
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
          title={title}
        />
      </div>

      {/* Directions Button */}
      <div className="flex gap-4">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 text-center py-3 inline-flex items-center justify-center gap-2 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          Lihat Alamat
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 text-center py-3 inline-flex items-center justify-center gap-2 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          Google Maps
        </a>
      </div>
    </div>
  );
}
