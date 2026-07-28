/**
 * Component Spinner Indikator Loading
 * 
 * @description
 * Indikator loading melingkar (spin) yang responsif dengan parameter ukuran dan teks opsional.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.size='md'] - Ukuran spinner ('sm', 'md', 'lg')
 * @param {string} [props.text=''] - Teks status di bawah spinner
 * @returns {React.ReactElement} LoadingSpinner element
 */
export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' }
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className={`animate-spin rounded-full border-t-2 border-primary-400 border-r-2 border-transparent ${sizes[size]}`} />
      {text && <p className="text-gray-400 text-sm">{text}</p>}
    </div>
  )
}
