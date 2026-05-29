import { NavLink, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, Boxes, ClipboardList, History, LayoutDashboard, LogOut, Package, Tags, Truck, Warehouse } from 'lucide-react'
import { clearAuth, getUser } from '../utils/auth'
import { confirmAction } from '../utils/confirm'

const menus = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer'] },
  { to: '/products', label: 'Produk', icon: Package, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer'] },
  { to: '/categories', label: 'Kategori', icon: Tags, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/warehouses', label: 'Gudang', icon: Warehouse, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/suppliers', label: 'Supplier', icon: Truck, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/transactions', label: 'Transaksi Stok', icon: ClipboardList, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang'] },
  { to: '/transfers', label: 'Transfer Stok', icon: Boxes, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang'] },
  { to: '/warehouse-map', label: 'Peta Gudang', icon: Warehouse, roles: ['Admin', 'Manajer Gudang', 'Staf Gudang', 'Viewer'] }
]

const utilities = [
  { to: '/audit-logs', label: 'Log Audit', icon: History, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/monitoring', label: 'Sumber Daya', icon: Activity, roles: ['Admin', 'Manajer Gudang'] },
  { to: '/error-logs', label: 'Log Kesalahan', icon: AlertTriangle, roles: ['Admin'] }
]

function SidebarLink({ item }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={({ isActive }) => `relative flex items-center gap-3 rounded-full px-4 py-3 text-[15px] font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-white text-navy ring-1 ring-navy/10 before:absolute before:left-2 before:top-1/2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-navy [&_span]:text-navy [&_svg]:text-navy'
          : 'text-slate hover:bg-white hover:text-navy hover:[&_span]:text-navy hover:[&_svg]:text-navy'
      }`}
    >
      <Icon className="shrink-0" size={22} />
      <span className="whitespace-nowrap opacity-100 transition-opacity duration-150 lg:opacity-0 lg:group-hover/sidebar:opacity-100">{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
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
      <aside className="group/sidebar fixed inset-y-0 left-0 z-50 flex w-20 flex-col overflow-hidden border-r border-line bg-background shadow-[10px_0_30px_rgba(0,43,91,0.04)] transition-all duration-200 hover:w-60">
        <div className="shrink-0 flex h-24 items-start px-5 pt-6">
          <div className="min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-sm font-extrabold text-white lg:group-hover/sidebar:hidden">SS</div>
            <h1 className="hidden whitespace-nowrap text-2xl font-extrabold tracking-tight text-navy lg:group-hover/sidebar:block">SmartStock Pro</h1>
            <h1 className="whitespace-nowrap text-2xl font-extrabold tracking-tight text-navy lg:hidden">SmartStock Pro</h1>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {visibleMenus.map((item) => <SidebarLink key={item.to} item={item} />)}
          {visibleUtilities.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="px-4 pb-3 text-[11px] font-bold uppercase tracking-wide text-slate opacity-100 transition-opacity duration-150 lg:opacity-0 lg:group-hover/sidebar:opacity-100">Utilitas</p>
              <div className="space-y-3">
                {visibleUtilities.map((item) => <SidebarLink key={item.to} item={item} />)}
              </div>
            </div>
          )}
        </nav>
        <div className="shrink-0 border-t border-line bg-background px-5 py-4">
          <button
            className="group flex w-full items-center justify-between rounded-full bg-blue-soft px-4 py-3 text-sm font-semibold text-slate transition-all duration-200 hover:bg-red-50 hover:text-danger active:scale-[0.98]"
            onClick={logout}
            title="Keluar"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate shadow-[0_8px_20px_rgba(0,43,91,0.05)] transition group-hover:text-danger">
                <LogOut size={17} />
              </span>
              <span className="whitespace-nowrap opacity-100 transition-opacity duration-150 lg:opacity-0 lg:group-hover/sidebar:opacity-100">Keluar</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
