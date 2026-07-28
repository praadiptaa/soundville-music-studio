import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import toast from 'react-hot-toast'
import { FaUser, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa'

const schema = yup.object({
  nama:              yup.string().min(3,'Minimal 3 karakter').required('Nama wajib diisi'),
  email:             yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  no_hp:             yup.string().min(10,'Nomor HP tidak valid'),
  password:          yup.string().min(6,'Password minimal 6 karakter').required('Password wajib diisi'),
  konfirmasi_password: yup.string()
    .oneOf([yup.ref('password')], 'Password tidak cocok')
    .required('Konfirmasi password wajib diisi'),
})

export default function Register() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const { data } = await authService.register({
        nama: values.nama, email: values.email, password: values.password, no_hp: values.no_hp,
      })
      login(data.data.user, data.data.token)
      toast.success('Registrasi berhasil! Selamat datang di Soundville.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name:'nama',    type:'text',  icon:<FaUser />,     placeholder:'Nama lengkap', label:'Nama Lengkap' },
    { name:'email',   type:'email', icon:<FaEnvelope />, placeholder:'email@example.com', label:'Email' },
    { name:'no_hp',   type:'tel',   icon:<FaPhone />,    placeholder:'08xxxxxxxxxx', label:'No. HP' },
    { name:'password',type:'password',icon:<FaLock />,   placeholder:'••••••••', label:'Password' },
    { name:'konfirmasi_password',type:'password',icon:<FaLock />,placeholder:'••••••••',label:'Konfirmasi Password' },
  ]

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Soundville Logo" className="h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-white">Buat Akun Baru</h1>
          <p className="text-gray-400 text-sm mt-1">Bergabung dengan Soundville Music Studio</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500 text-sm">{f.icon}</span>
                  <input {...register(f.name)} type={f.type} placeholder={f.placeholder}
                    className="input-field pl-9" />
                </div>
                {errors[f.name] && <p className="text-red-400 text-xs mt-1">{errors[f.name].message}</p>}
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
