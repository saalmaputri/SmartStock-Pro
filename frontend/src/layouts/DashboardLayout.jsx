import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const titles = {
  '/': 'Dashboard',
  '/products': 'Manajemen Produk',
  '/categories': 'Kategori',
  '/warehouses': 'Manajemen Gudang',
  '/suppliers': 'Supplier',
  '/transactions': 'Transaksi Stok',
  '/transfers': 'Transfer Stok',
  '/reports': 'Halaman Laporan',
  '/audit-logs': 'Log Audit',
  '/monitoring': 'Pemantauan Sumber Daya',
  '/error-logs': 'Log Kesalahan',
  '/warehouse-map': 'Peta Gudang',
  '/settings': 'Pengaturan',
  '/faq': 'FAQ',
  '/change-log': 'Change Log'
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= 1024
  })
  const location = useLocation()
  const title = useMemo(() => titles[location.pathname] || 'SmartStock Pro', [location.pathname])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className={`transition-all duration-200 ${open ? 'lg:pl-60' : 'lg:pl-0'}`}>
        <Navbar title={title} sidebarOpen={open} onMenuClick={() => setOpen((current) => !current)} />
        <main className="mx-auto w-full max-w-[1400px] px-5 pb-8 pt-24 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
