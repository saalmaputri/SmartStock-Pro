import { useEffect, useState } from 'react'
import { Bell, Menu, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getUser } from '../utils/auth'

export default function Navbar({ title, onMenuClick, sidebarOpen }) {
  const navigate = useNavigate()
  const user = getUser()
  const [openNotif, setOpenNotif] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [readKey, setReadKey] = useState('')

  useEffect(() => {
    function loadAlerts() {
      api.get('/dashboard/summary')
        .then(({ data }) => {
          const nextAlerts = data.low_stock_alerts || []
          setAlerts(nextAlerts)
        })
        .catch(() => setAlerts([
          { product_name: 'Headphone Noise Cancel', warehouse: 'Gudang Jakarta', quantity: 8, min_stock: 15 },
          { product_name: 'Sneaker CloudWalk', warehouse: 'Gudang Bandung', quantity: 0, min_stock: 5 }
        ]))
    }
    loadAlerts()
    const timer = setInterval(loadAlerts, 5000)
    return () => clearInterval(timer)
  }, [])

  const currentKey = alerts.map((item) => `${item.product_name}-${item.warehouse}-${item.quantity}`).join('|')
  const unreadCount = currentKey === readKey ? 0 : alerts.length

  function openNotifications() {
    setOpenNotif((value) => !value)
    setReadKey(currentKey)
  }

  function goToProducts() {
    setOpenNotif(false)
    navigate('/products')
  }

  return (
    <header className={`fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-5 backdrop-blur-xl transition-all duration-200 md:px-10 ${sidebarOpen ? 'lg:left-60' : 'lg:left-0'}`}>
      <div className="flex items-center gap-3">
        <button className="icon-button" onClick={onMenuClick} type="button" aria-label="Buka menu">
          <Menu size={24} />
        </button>
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
                <h3 className="font-extrabold text-navy">Alert Stok</h3>
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-danger">{alerts.length} item</span>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto">
                {alerts.length === 0 && <p className="rounded-2xl bg-blue-soft p-4 text-sm text-slate">Tidak ada alert stok minimum.</p>}
                {alerts.slice(0, 6).map((item) => (
                  <button key={`${item.product_name}-${item.warehouse}`} className="w-full rounded-2xl bg-red-50/70 p-3 text-left transition hover:bg-red-50" onClick={goToProducts}>
                    <p className="font-bold text-navy">{item.product_name}</p>
                    <p className="text-xs text-slate">{item.warehouse}</p>
                    <p className="mt-1 text-xs font-bold text-danger">Sisa {item.quantity} / Min {item.min_stock}</p>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary flex-1 py-2 text-xs" onClick={() => setReadKey(currentKey)}>Tandai Dibaca</button>
                <button className="btn-primary flex-1 py-2 text-xs" onClick={goToProducts}>Lihat Produk</button>
              </div>
            </div>
          )}
        </div>
        <button className="icon-button hidden sm:inline-flex" aria-label="Pengaturan" onClick={() => navigate('/settings')} type="button">
          <Settings size={21} />
        </button>
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
