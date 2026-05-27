import { useEffect, useState } from 'react'
import { AlertTriangle, Boxes, Download, Package, Warehouse } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../api/axios'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'
import StockAlert from '../components/StockAlert'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { formatNumber } from '../utils/format'

const dummy = {
  total_products: 1240,
  total_stock: 45000,
  low_stock_count: 12,
  total_warehouses: 4,
  inventory_value: 125000000,
  movement_chart: [
    { label: 'Sen', in: 240, out: 90 },
    { label: 'Sel', in: 180, out: 120 },
    { label: 'Rab', in: 310, out: 150 },
    { label: 'Kam', in: 280, out: 170 },
    { label: 'Jum', in: 420, out: 210 }
  ],
  low_stock_alerts: [],
  latest: [
    { id: 'TRX-88219', product: 'Kit Katup Hidrolik', movement: '+240', warehouse: 'Gudang A1', time: '12 Okt, 14:22' },
    { id: 'TRX-88218', product: 'Kabel Tembaga', movement: '-50', warehouse: 'Gudang C2', time: '12 Okt, 11:05' }
  ]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(dummy)

  useEffect(() => {
    function productAlerts(products = []) {
      return products
        .filter((item) => Number(item.quantity || 0) <= Number(item.min_stock || 0))
        .map((item) => ({
          id: item.id,
          product_name: item.name,
          warehouse: item.warehouse_name || item.category_name || 'Manajemen Produk',
          quantity: Number(item.quantity || 0),
          min_stock: Number(item.min_stock || 0)
        }))
        .slice(0, 8)
    }

    function load() {
      Promise.allSettled([api.get('/dashboard/summary'), api.get('/products')])
        .then((results) => {
          const dashboardData = results[0].status === 'fulfilled' ? results[0].value.data : {}
          const products = results[1].status === 'fulfilled' && Array.isArray(results[1].value.data) ? results[1].value.data : []
          const alerts = productAlerts(products)
          setSummary({
            ...dummy,
            ...dashboardData,
            low_stock_count: alerts.length || dashboardData.low_stock_count || 0,
            low_stock_alerts: alerts.length ? alerts : (dashboardData.low_stock_alerts || [])
          })
        })
        .catch(() => setSummary(dummy))
    }
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  const chart = summary.movement_chart?.map((item) => ({
    label: item.label || item.type,
    in: item.in ?? (item.type === 'in' ? item.quantity : 0),
    out: item.out ?? (item.type === 'out' ? item.quantity : 0)
  }))

  async function exportDashboardPdf() {
    if (!await confirmAction('Export dashboard dan grafik inventaris ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/dashboard/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'dashboard-inventaris.pdf')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Berikut adalah ringkasan inventaris Anda hari ini.</p>
        </div>
        <button className="btn-primary" onClick={exportDashboardPdf}><Download size={18} /> Export PDF</button>
      </div>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Produk" value={formatNumber(summary.total_products)} icon={Package} badge="+2.4%" />
        <StatCard title="Total Stok" value={formatNumber(summary.total_stock)} icon={Boxes} badge="Aktif" />
        <StatCard title="Stok Menipis" value={formatNumber(summary.low_stock_count)} icon={AlertTriangle} tone="red" badge="Kelola" onClick={() => navigate('/products')} />
        <StatCard title="Total Gudang" value={formatNumber(summary.total_warehouses)} icon={Warehouse} badge={`${summary.total_warehouses} Lokasi`} />
        <StatCard title="Nilai Inventaris" value={`Rp${formatNumber(summary.inventory_value)}`} icon={Boxes} tone="green" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card p-7">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="section-title">Pergerakan Inventaris</h2>
              <p className="text-sm text-slate">Tren barang masuk dan keluar.</p>
            </div>
            <span className="rounded-xl bg-blue-soft px-4 py-2 text-sm font-medium text-navy">Bulanan</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="in" fill="#051125" radius={[8, 8, 0, 0]} name="Masuk" />
                <Bar dataKey="out" fill="#ba1a1a" radius={[8, 8, 0, 0]} name="Keluar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <StockAlert items={summary.low_stock_alerts} onSelect={() => navigate('/products')} />
      </section>
      <section>
        <h2 className="mb-4 section-title">Aktivitas Terbaru</h2>
        <DataTable
          rows={summary.latest}
          columns={[
            { key: 'id', label: 'ID Transaksi' },
            { key: 'product', label: 'Produk' },
            { key: 'movement', label: 'Pergerakan', render: (row) => <span className={`rounded-full px-3 py-1 font-bold ${String(row.movement).startsWith('-') ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>{row.movement}</span> },
            { key: 'warehouse', label: 'Gudang' },
            { key: 'time', label: 'Waktu' }
          ]}
        />
      </section>
    </div>
  )
}
