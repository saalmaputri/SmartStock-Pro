import { NavLink, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, Boxes, ClipboardList, History, LayoutDashboard, LogOut, Package, Tags, Truck, Warehouse, X } from 'lucide-react'
import { clearAuth, getUser } from '../utils/auth'
import { confirmAction } from '../utils/confirm'

const menus = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer'] },
  { to: '/products', label: 'Manajemen Produk', icon: Package, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer'] },
  { to: '/categories', label: 'Kategori', icon: Tags, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/warehouses', label: 'Manajemen Gudang', icon: Warehouse, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/suppliers', label: 'Supplier', icon: Truck, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/transactions', label: 'Transaksi Stok', icon: ClipboardList, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang'] },
  { to: '/transfers', label: 'Transfer Stok', icon: Boxes, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang'] },
  { to: '/warehouse-map', label: 'Peta Gudang', icon: Warehouse, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer'] }
]

const utilities = [
  { to: '/audit-logs', label: 'Log Audit', icon: History, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/monitoring', label: 'Pemantauan Sumber Daya', icon: Activity, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/error-logs', label: 'Log Kesalahan', icon: AlertTriangle, roles: ['Admin'] }
]

function SidebarLink({ item }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `relative flex items-center gap-3 rounded-full px-4 py-3 text-[15px] font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-blue-soft text-navy'
          : 'text-slate hover:bg-white hover:text-navy'
      }`}
    >
      <Icon size={22} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()
  const user = getUser()
  const role = user.role || 'Viewer'
  const visibleMenus = menus.filter((item) => item.roles.includes(role))
  const visibleUtilities = utilities.filter((item) => item.roles.includes(role))

  async function logout() {
    if (!await confirmAction('Keluar dari SmartStock Pro sekarang?', { confirmText: 'Logout' })) return
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-navy/30 transition lg:hidden ${open ? 'block' : 'hidden'}`} onClick={onClose} />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col overflow-hidden border-r border-line bg-background transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="shrink-0 flex h-24 items-start justify-between px-6 pt-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy">SmartStock Pro</h1>
            <p className="mt-1 text-xs font-medium text-slate">Management Console</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Tutup menu">
            <X size={22} />
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {visibleMenus.map((item) => <SidebarLink key={item.to} item={item} />)}
          {visibleUtilities.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="px-4 pb-3 text-[11px] font-bold uppercase tracking-wide text-slate">Utilitas</p>
              <div className="space-y-3">
                {visibleUtilities.map((item) => <SidebarLink key={item.to} item={item} />)}
              </div>
            </div>
          )}
        </nav>
        <div className="shrink-0 border-t border-line bg-background px-5 py-4">
          <div className="mb-3 rounded-[1.75rem] bg-white px-4 py-4 shadow-[0_18px_40px_rgba(0,43,91,0.05)]">
            <p className="truncate text-sm font-bold text-navy">{user.name || 'User Demo'}</p>
            <p className="truncate text-xs text-slate">{role}</p>
          </div>
          <button
            className="group flex w-full items-center justify-between rounded-full bg-blue-soft px-4 py-3 text-sm font-semibold text-slate transition-all duration-200 hover:bg-red-50 hover:text-danger active:scale-[0.98]"
            onClick={logout}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate shadow-[0_8px_20px_rgba(0,43,91,0.05)] transition group-hover:text-danger">
                <LogOut size={17} />
              </span>
              Keluar
            </span>
            <span className="text-[11px] font-medium text-slate/70 group-hover:text-danger/70">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
