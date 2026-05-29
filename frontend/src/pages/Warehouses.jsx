import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, MapPin, Package, Search, Warehouse, X } from 'lucide-react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { formatNumber } from '../utils/format'

function stockStatus(quantity, minStock) {
  if (Number(quantity || 0) <= 0) return { label: 'Habis', className: 'bg-red-50 text-danger' }
  if (Number(quantity || 0) <= Number(minStock || 15)) return { label: 'Sedikit', className: 'bg-orange-50 text-warning' }
  return { label: 'Tersedia', className: 'bg-blue-soft text-navy' }
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [warehouseRes, productRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/products')
      ])
      setWarehouses(Array.isArray(warehouseRes.data) ? warehouseRes.data : warehouseRes.data.items || [])
      setProducts(Array.isArray(productRes.data) ? productRes.data : productRes.data.items || [])
    } catch {
      setWarehouses([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const warehouseSummaries = useMemo(() => warehouses.map((warehouse) => {
    const stocks = products
      .map((product) => {
        const stock = (product.warehouse_stocks || []).find((item) => String(item.warehouse_id) === String(warehouse.id))
        return {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          unit: product.unit || 'Unit',
          min_stock: product.min_stock || 15,
          quantity: Number(stock?.quantity || 0)
        }
      })
      .filter((item) => item.quantity > 0)

    return {
      ...warehouse,
      total_stock: stocks.reduce((sum, item) => sum + item.quantity, 0),
      total_products: stocks.length,
      low_stock: stocks.filter((item) => item.quantity <= item.min_stock).length,
      stocks
    }
  }), [warehouses, products])

  const filtered = useMemo(() => warehouseSummaries.filter((warehouse) => (
    `${warehouse.name} ${warehouse.city} ${warehouse.code} ${warehouse.address}`.toLowerCase().includes(query.toLowerCase())
  )), [warehouseSummaries, query])

  async function exportPdf() {
    if (!await confirmAction('Export laporan stok setiap gudang ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/warehouses/stock/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'stok-per-gudang.pdf')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manajemen Gudang"
        description="Pantau stok produk yang tersedia di setiap gudang PT Maju Bersama Digital."
        action={<button className="btn-primary" onClick={exportPdf}><Download size={18} /> Export PDF</button>}
      />

      <section className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={20} />
        <input className="field h-14 w-full pl-12" placeholder="Cari gudang, kota, atau kode..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((warehouse) => (
          <article key={warehouse.id} className="card-static p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate">{warehouse.code || warehouse.city}</p>
                <h2 className="mt-1 text-xl font-extrabold text-navy">{warehouse.name}</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-soft text-navy">
                <Warehouse size={23} />
              </div>
            </div>

            <p className="mt-4 flex gap-2 text-sm leading-6 text-slate">
              <MapPin className="mt-0.5 shrink-0" size={16} />
              <span>{warehouse.address || warehouse.city || '-'}</span>
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-background p-4">
                <p className="text-xs font-bold text-slate">Produk</p>
                <p className="mt-1 text-lg font-extrabold text-navy">{formatNumber(warehouse.total_products)}</p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-xs font-bold text-slate">Stok</p>
                <p className="mt-1 text-lg font-extrabold text-navy">{formatNumber(warehouse.total_stock)}</p>
              </div>
              <div className="rounded-lg bg-background p-4">
                <p className="text-xs font-bold text-slate">Sedikit</p>
                <p className="mt-1 text-lg font-extrabold text-warning">{formatNumber(warehouse.low_stock)}</p>
              </div>
            </div>

            <button className="btn-secondary mt-5 w-full" onClick={() => setSelectedWarehouse(warehouse)}>
              <Eye size={18} /> Lihat Produk
            </button>
          </article>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="card-static p-8 text-center text-slate md:col-span-2 xl:col-span-3">Gudang tidak ditemukan.</div>
        )}
        {loading && (
          <div className="card-static p-8 text-center text-slate md:col-span-2 xl:col-span-3">Memuat data gudang...</div>
        )}
      </section>

      {selectedWarehouse && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-navy/40 px-4 py-6">
          <section className="max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-modal">
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate">{selectedWarehouse.city}</p>
                <h2 className="text-xl font-extrabold text-navy">Produk di {selectedWarehouse.name}</h2>
                <p className="mt-1 text-sm text-slate">{selectedWarehouse.address}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedWarehouse(null)} aria-label="Tutup detail gudang"><X size={20} /></button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="sticky top-0 bg-background text-xs font-bold uppercase tracking-wide text-slate">
                  <tr>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4 text-right">Jumlah</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {selectedWarehouse.stocks.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate">Belum ada stok produk di gudang ini.</td>
                    </tr>
                  )}
                  {selectedWarehouse.stocks.map((item) => {
                    const status = stockStatus(item.quantity, item.min_stock)
                    return (
                      <tr key={item.product_id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-soft text-navy"><Package size={18} /></span>
                            <span className="font-bold text-navy">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate">{item.sku || '-'}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-navy">{formatNumber(item.quantity)} <span className="text-xs font-semibold text-slate">{item.unit}</span></td>
                        <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
