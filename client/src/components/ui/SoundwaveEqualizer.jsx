/**
 * Component Soundwave Equalizer Animasi
 * 
 * @description
 * Menampilkan animasi visualizer bar/equalizer gelombang suara dinamis menggunakan CSS animation.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} [props.active=true] - Status keaktifan animasi
 * @returns {React.ReactElement|null} SoundwaveEqualizer element atau null jika tidak aktif
 */
export default function SoundwaveEqualizer({ active = true }) {
  if (!active) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full"
          style={{
            height: '20px',
            animation: `soundwave 0.8s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
