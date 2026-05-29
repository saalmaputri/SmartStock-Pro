import { useMemo } from 'react'
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
  '/warehouse-map': 'Peta Gudang',
  '/audit-logs': 'Log Audit',
  '/monitoring': 'Pemantauan Sumber Daya',
  '/error-logs': 'Log Kesalahan'
}

export default function DashboardLayout() {
  const location = useLocation()
  const title = useMemo(() => titles[location.pathname] || 'SmartStock Pro', [location.pathname])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="transition-all duration-200 lg:pl-20">
        <Navbar title={title} />
        <main className="mx-auto w-full max-w-[1400px] px-5 pb-8 pt-24 md:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
