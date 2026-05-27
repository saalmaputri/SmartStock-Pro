import { useEffect, useState } from 'react'
import { Bell, Clock, Database, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { confirmAction } from '../utils/confirm'
import { getUser } from '../utils/auth'

const defaultSettings = {
  notificationEnabled: true,
  criticalStockAlert: true,
  responseThreshold: 200,
  sessionTimeoutMinutes: 60
}

export default function Settings() {
  const user = getUser()
  const [settings, setSettings] = useState(defaultSettings)
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    const saved = localStorage.getItem('smartstock_settings')
    if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) })
  }, [])

  function updateValue(key, value) {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  async function saveSettings(event) {
    event.preventDefault()
    if (!await confirmAction('Simpan pengaturan aplikasi ini?', { confirmText: 'Simpan' })) return
    localStorage.setItem('smartstock_settings', JSON.stringify(settings))
    localStorage.setItem('smartstock_session_timeout_minutes', String(settings.sessionTimeoutMinutes))
    alert('Pengaturan berhasil disimpan.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola preferensi notifikasi, session timeout, dan informasi koneksi aplikasi."
      />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Role Login" value={user.role || 'Viewer'} icon={ShieldCheck} />
        <StatCard title="API Backend" value="FastAPI" icon={Database} />
        <StatCard title="Timeout" value={`${settings.sessionTimeoutMinutes} menit`} icon={Clock} />
      </section>

      <form onSubmit={saveSettings} className="card grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div>
            <h2 className="section-title">Preferensi Sistem</h2>
            <p className="mt-1 text-sm text-slate">Pengaturan ini disimpan di localStorage untuk kebutuhan demo lokal SmartStock Pro.</p>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
            <span>
              <span className="block font-bold text-navy">Notifikasi In-App</span>
              <span className="text-sm text-slate">Aktifkan notifikasi stok minimum di navbar.</span>
            </span>
            <input
              type="checkbox"
              checked={settings.notificationEnabled}
              onChange={(event) => updateValue('notificationEnabled', event.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
            <span>
              <span className="block font-bold text-navy">Alert Stok Kritis</span>
              <span className="text-sm text-slate">Tampilkan alert jika stok berada di bawah minimum threshold.</span>
            </span>
            <input
              type="checkbox"
              checked={settings.criticalStockAlert}
              onChange={(event) => updateValue('criticalStockAlert', event.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="label">Threshold Response Time (ms)</span>
              <input
                className="field"
                type="number"
                min="50"
                value={settings.responseThreshold}
                onChange={(event) => updateValue('responseThreshold', Number(event.target.value))}
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Session Timeout (menit)</span>
              <input
                className="field"
                type="number"
                min="5"
                value={settings.sessionTimeoutMinutes}
                onChange={(event) => updateValue('sessionTimeoutMinutes', Number(event.target.value))}
              />
            </label>
          </div>
        </div>

        <aside className="rounded-[1.5rem] bg-blue-soft p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy">
            <Bell size={22} />
          </div>
          <h3 className="text-lg font-extrabold text-navy">Informasi Koneksi</h3>
          <div className="mt-4 space-y-3 text-sm">
            <p><span className="font-bold text-navy">User:</span> {user.name || 'User Demo'}</p>
            <p><span className="font-bold text-navy">Email:</span> {user.email || '-'}</p>
            <p><span className="font-bold text-navy">API:</span> {apiUrl}</p>
          </div>
          <button className="btn-primary mt-6 w-full" type="submit">Simpan Pengaturan</button>
        </aside>
      </form>
    </div>
  )
}
