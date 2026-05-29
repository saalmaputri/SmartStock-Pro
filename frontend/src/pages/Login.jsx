import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import api from '../api/axios'
import { getToken, normalizeRole, setAuth } from '../utils/auth'
import { errorMessage } from '../utils/format'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@smartstock.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (getToken()) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    if (!email || !password) {
      setError('Email dan password wajib diisi')
      return
    }
    if (!email.includes('@')) {
      setError('Format email tidak valid')
      return
    }
    setLoading(true)
    setError('')
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await api.post('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      let profile = { name: 'User Demo', role: 'Viewer', email }
      try {
        const me = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        })
        profile = me.data
      } catch {
        profile.role = email.includes('admin') ? 'Admin' : email.includes('manager') ? 'Manajer Gudang' : email.includes('staff') ? 'Staf Gudang' : 'Viewer'
      }

      setAuth({
        token: data.access_token,
        name: profile.name,
        email: profile.email || email,
        role: normalizeRole(profile.role)
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login gagal'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex min-h-[42vh] items-center overflow-hidden px-6 py-12 md:px-14 lg:min-h-screen">
        <img
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=85"
          alt="Gudang inventaris SmartStock Pro"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/70 to-navy/35" />
        <div className="relative z-10 w-full max-w-2xl text-white">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Boxes size={34} />
          </div>
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">SmartStock Pro</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/85">
            Sistem manajemen inventaris berbasis web untuk stok produk, transaksi barang, transfer gudang, dan laporan inventaris.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center border-l border-line bg-white px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-line bg-background p-8 shadow-modal">
          <h2 className="text-center text-2xl font-extrabold text-navy">Login</h2>
          <div className="mt-7 space-y-4">
            <label className="grid gap-2">
              <span className="label">Email</span>
              <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="label">Password</span>
              <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-danger">{error}</div>}
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</button>
          </div>
        </form>
      </section>
    </main>
  )
}
