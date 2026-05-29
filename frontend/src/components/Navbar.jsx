import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getUser } from '../utils/auth'

export default function Navbar({ title }) {
  const navigate = useNavigate()
  const user = getUser()
  const [openNotif, setOpenNotif] = useState(false)
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    function loadAlerts() {
      Promise.allSettled([api.get('/notifications'), api.get('/dashboard/summary')])
        .then((results) => {
          const notifications = results[0].status === 'fulfilled' ? results[0].value.data.filter((item) => ['stock', 'transfer'].includes(item.type)) : []
          const stockAlerts = results[1].status === 'fulfilled' ? (results[1].value.data.low_stock_alerts || []) : []
          setAlerts([
            ...notifications,
            ...stockAlerts.map((item) => ({
              id: `stock-${item.product_name}-${item.warehouse}`,
              type: 'stock',
              title: 'Stok Sedikit',
              message: `${item.product_name} di ${item.warehouse} tersisa ${item.quantity} / min ${item.min_stock}`,
              severity: Number(item.quantity || 0) <= 0 ? 'critical' : 'warning',
              is_read: false
            }))
          ])
        })
        .catch(() => setAlerts([]))
    }
    loadAlerts()
    const timer = setInterval(loadAlerts, 5000)
    return () => clearInterval(timer)
  }, [])

  const unreadCount = alerts.filter((item) => !item.is_read).length

  function openNotifications() {
    setOpenNotif((value) => !value)
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-5 backdrop-blur-xl transition-all duration-200 md:px-10 lg:left-20">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="hidden text-2xl font-extrabold tracking-tight text-navy lg:block">{title}</h1>
          <h1 className="text-xl font-extrabold text-navy lg:hidden">SmartStock Pro</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="icon-button relative" aria-label="Notifikasi" onClick={openNotifications}>
            <Bell size={21} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {openNotif && (
            <div className="absolute right-0 top-12 z-50 w-[340px] rounded-[1.5rem] bg-white p-4 shadow-modal">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-extrabold text-navy">Notifikasi</h3>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-danger">{alerts.length} item</span>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {alerts.length === 0 && <p className="rounded-2xl bg-blue-soft p-4 text-sm text-slate">Tidak ada notifikasi baru.</p>}
                {alerts.slice(0, 6).map((item) => (
                  <button key={item.id} className={`w-full rounded-2xl p-3 text-left transition ${item.severity === 'critical' ? 'bg-red-50/80 hover:bg-red-50' : 'bg-orange-50/80 hover:bg-orange-50'}`} onClick={item.type === 'transfer' ? () => { setOpenNotif(false); navigate('/transfers') } : () => { setOpenNotif(false); navigate('/products') }}>
                    <p className="font-bold text-navy">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate">{item.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="hidden border-l border-line pl-5 text-right md:block">
          <p className="text-sm font-bold text-navy">{user.name || 'User Demo'}</p>
          <p className="text-xs text-slate">{user.role || 'Viewer'}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-blue-active text-sm font-bold text-navy shadow-card">
          {(user.name || 'U').slice(0, 1)}
        </div>
      </div>
    </header>
  )
}
