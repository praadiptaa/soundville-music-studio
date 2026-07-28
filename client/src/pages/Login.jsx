import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import toast from 'react-hot-toast'
import { FaEnvelope, FaLock } from 'react-icons/fa'

const schema = yup.object({
  email:    yup.string().email('Format email tidak valid').required('Email wajib diisi'),
  password: yup.string().min(6, 'Password minimal 6 karakter').required('Password wajib diisi'),
})

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) })

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    return null
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      const { data } = await authService.login(values)
      login(data.data.user, data.data.token)
      toast.success(`Selamat datang, ${data.data.user.nama}!`)
      navigate(data.data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Soundville Logo" className="h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-white">Masuk ke Soundville</h1>
          <p className="text-gray-400 text-sm mt-1">Selamat datang kembali!</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3.5 text-gray-500 text-sm" />
                <input {...register('email')} type="email" placeholder="email@example.com"
                  className="input-field pl-9" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3.5 text-gray-500 text-sm" />
                <input {...register('password')} type="password" placeholder="••••••••"
                  className="input-field pl-9" />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
