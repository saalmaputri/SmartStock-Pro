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
      <section className="flex items-center px-6 py-12 md:px-14">
        <div className="max-w-2xl">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-active text-navy">
            <Boxes size={34} />
          </div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate">Mini Project BNSP Web Developer</p>
          <h1 className="text-4xl font-extrabold text-navy md:text-5xl">SmartStock Pro</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate">
            Sistem manajemen inventaris berbasis web untuk dashboard stok, transaksi, transfer gudang, laporan, audit log, dan monitoring operasional.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center border-l border-line bg-white px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-line bg-background p-8 shadow-modal">
          <h2 className="text-2xl font-extrabold text-navy">Masuk</h2>
          <p className="mt-1 text-sm text-slate">Gunakan akun demo untuk presentasi asesor.</p>
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
          <div className="mt-6 rounded-xl bg-blue-soft p-4 text-sm text-slate">
            Demo: `admin@smartstock.com/admin123`, `manager@smartstock.com/manager123`, `staff@smartstock.com/staff123`, `viewer@smartstock.com/viewer123`.
          </div>
        </form>
      </section>
    </main>
  )
}
