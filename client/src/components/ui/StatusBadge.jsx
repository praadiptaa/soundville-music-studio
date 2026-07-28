/**
 * Component Badge Status Transaksi/Order
 * 
 * @description
 * Badge UI kecil yang menampilkan status (pending, confirmed, rejected, dll) dengan class warna
 * dan label Bahasa Indonesia yang sesuai.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.status - Status sistem (misal: 'pending', 'confirmed', 'rejected')
 * @returns {React.ReactElement} StatusBadge element
 */
export default function StatusBadge({ status }) {
  const map = {
    pending:    'badge-pending',
    confirmed:  'badge-confirmed',
    rejected:   'badge-rejected',
    cancelled:  'badge-cancelled',
    verified:   'badge-verified',
    approved:   'badge-confirmed',
    completed:  'badge-verified',
  }
  const labels = {
    pending:   'Menunggu',
    confirmed: 'Dikonfirmasi',
    rejected:  'Ditolak',
    cancelled: 'Dibatalkan',
    verified:  'Terverifikasi',
    approved:  'Disetujui',
    completed: 'Selesai',
  }
  return (
    <span className={map[status] || 'badge-pending'}>
      {labels[status] || status}
    </span>
  )
}
