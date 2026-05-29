import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Edit2, Filter, Plus, Search, Trash2, TrendingUp, X } from 'lucide-react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { formatNumber } from '../utils/format'

const emptyForm = {
  sku: '',
  name: '',
  category_id: '',
  supplier_id: '',
  description: '',
  unit: 'Unit',
  purchase_price: 0,
  selling_price: 0,
  min_stock: 15,
  initial_stocks: {},
  image_url: ''
}

function ProductModal({ form, setForm, onClose, onSubmit, editing, categories, warehouses }) {
  const [preview, setPreview] = useState(form.image_url || '')

  async function selectImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!await confirmAction('Upload gambar produk ini?', { confirmText: 'Upload' })) {
      event.target.value = ''
      return
    }
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    const data = new FormData()
    data.append('file', file)
    try {
      const response = await api.post('/products/upload-image', data)
      setForm({ ...form, image_url: response.data.image_url })
    } catch {
      setForm({ ...form, image_url: localPreview })
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/40 px-4 py-6">
      <form onSubmit={onSubmit} className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-modal md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-navy">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button type="button" className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['name', 'Nama Produk'],
            ['description', 'Deskripsi'],
            ['purchase_price', 'Harga Beli'],
            ['selling_price', 'Harga Jual']
          ].map(([name, label]) => (
            <label key={name} className="grid gap-2">
              <span className="label">{label}</span>
              <input
                className="field"
                type={['min_stock', 'purchase_price', 'selling_price'].includes(name) ? 'number' : 'text'}
                value={form[name] ?? ''}
                onChange={(event) => setForm({ ...form, [name]: event.target.value })}
              />
            </label>
          ))}
          <label className="grid gap-2">
            <span className="label">Kategori</span>
            <select
              className="field"
              required
              value={form.category_id || ''}
              onChange={(event) => setForm({ ...form, category_id: event.target.value })}
            >
              <option value="">Pilih kategori</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          {!editing && (
            <section className="grid gap-3 rounded-lg bg-background p-4 md:col-span-2">
              <div>
                <p className="label">Stok Pembukaan Per Gudang</p>
                <p className="mt-1 text-xs text-slate">Isi jumlah stok awal produk ini di masing-masing gudang PT Maju Bersama Digital.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {warehouses.map((warehouse) => (
                  <label key={warehouse.id} className="grid gap-2">
                    <span className="text-xs font-bold text-navy">{warehouse.name} - {warehouse.city}</span>
                    <input
                      className="field bg-white"
                      type="number"
                      min="0"
                      value={form.initial_stocks?.[warehouse.id] ?? 0}
                      onChange={(event) => setForm({
                        ...form,
                        initial_stocks: {
                          ...(form.initial_stocks || {}),
                          [warehouse.id]: event.target.value
                        }
                      })}
                    />
                  </label>
                ))}
              </div>
            </section>
          )}
          <label className="grid gap-2 md:col-span-2">
            <span className="label">Gambar Produk</span>
            <div className="flex flex-col gap-4 rounded-lg bg-background p-4 sm:flex-row sm:items-center">
              {preview ? (
                <img src={toImageUrl(preview)} alt="Preview produk" className="h-24 w-24 shrink-0 rounded-full bg-blue-soft object-cover" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-blue-soft text-sm font-bold text-navy">Foto</div>
              )}
              <input className="field min-w-0 flex-1 py-2" type="file" accept="image/*" onChange={selectImage} />
            </div>
          </label>
        </div>
        <div className="sticky bottom-0 mt-7 flex justify-end gap-3 bg-white pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary">Simpan</button>
        </div>
      </form>
    </div>
  )
}

function toImageUrl(path) {
  if (!path) return ''
  return path.startsWith('/uploads') ? `http://localhost:8000${path}` : path
}

function displaySku(product) {
  return product.sku || `SKU-${String(product.id || 0).padStart(3, '0')}`
}

function statusFromStock(status) {
  if (status === 'empty') return { label: 'Habis', className: 'bg-red-100 text-danger' }
  if (status === 'low') return { label: 'Sedikit', className: 'bg-orange-100 text-warning' }
  return { label: 'Tersedia', className: 'bg-blue-soft text-navy' }
}

function filteredWarehouseStocks(product, statusFilter, warehouseFilter) {
  const stocks = product.warehouse_stocks || []
  return stocks.filter((stock) => {
    if (warehouseFilter && String(stock.warehouse_id) !== String(warehouseFilter)) return false
    if (!statusFilter) return true
    return stock.status === statusFilter
  })
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [productRes, categoryRes, warehouseRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/warehouses')
      ])
      const data = productRes.data
      setProducts(data.map((item) => ({
        ...item,
        quantity: item.quantity ?? 0,
        unit: item.unit || 'Unit',
        category_name: item.category_name || item.category?.name || 'Umum'
      })))
      setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : categoryRes.data.items || [])
      setWarehouses(Array.isArray(warehouseRes.data) ? warehouseRes.data : warehouseRes.data.items || [])
    } catch {
      setProducts([])
      setCategories([])
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const highlight = searchParams.get('highlight')
    const status = searchParams.get('status')
    const warehouse = searchParams.get('warehouse')
    if (highlight) setQuery(highlight)
    if (status) setStockStatusFilter(status)
    if (warehouse) setWarehouseFilter(warehouse)
    if (highlight || status || warehouse) {
      window.setTimeout(() => document.getElementById('inventory-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [searchParams])

  const filtered = useMemo(
    () => products.filter((item) => {
      const matchesQuery = `${item.name} ${displaySku(item)} ${item.category_name}`.toLowerCase().includes(query.toLowerCase())
      const visibleStocks = filteredWarehouseStocks(item, stockStatusFilter, warehouseFilter)
      const matchesWarehouse = !warehouseFilter || (item.warehouse_stocks || []).some((stock) => String(stock.warehouse_id) === String(warehouseFilter))
      const matchesStatus = !stockStatusFilter || visibleStocks.length > 0
      return matchesQuery && matchesWarehouse && matchesStatus
    }),
    [products, query, warehouseFilter, stockStatusFilter]
  )
  const lowStock = products.filter((item) => Number(item.quantity || 0) <= Number(item.min_stock || 15) && Number(item.quantity || 0) > 0).length
  const outOfStock = products.filter((item) => Number(item.quantity || 0) <= 0).length
  const totalInventoryValue = products.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || item.price || 0), 0)
  const categoryCount = new Set(products.map((item) => item.category_name || item.category_id || 'Umum')).size
  const warehouseTotals = useMemo(() => {
    const totals = new Map(warehouses.map((warehouse) => [warehouse.id, { id: warehouse.id, name: warehouse.name, city: warehouse.city, quantity: 0, productCount: 0 }]))
    products.forEach((product) => {
      ;(product.warehouse_stocks || []).forEach((stock) => {
        const current = totals.get(stock.warehouse_id) || { id: stock.warehouse_id, name: stock.warehouse_name, city: '', quantity: 0, productCount: 0 }
        current.quantity += Number(stock.quantity || 0)
        current.productCount += 1
        totals.set(stock.warehouse_id, current)
      })
    })
    return Array.from(totals.values())
  }, [products, warehouses])
  const selectedWarehouseStocks = useMemo(() => {
    if (!selectedWarehouse) return []
    return products
      .map((product) => {
        const stock = (product.warehouse_stocks || []).find((item) => String(item.warehouse_id) === String(selectedWarehouse.id))
        return {
          id: product.id,
          name: product.name,
          sku: displaySku(product),
          quantity: Number(stock?.quantity || 0),
          status: stock?.status || 'empty',
          unit: product.unit || 'Unit'
        }
      })
      .sort((a, b) => b.quantity - a.quantity)
  }, [products, selectedWarehouse])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      initial_stocks: Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, 0]))
    })
    setModal(true)
  }

  function openEdit(product) {
    setEditing(product)
    setForm({ ...emptyForm, ...product })
    setModal(true)
  }

  async function submit(event) {
    event.preventDefault()
    const action = editing ? 'Simpan perubahan data produk ini?' : 'Tambah produk baru ini?'
    if (!await confirmAction(action)) return
    const payload = {
      ...form,
      sku: editing ? form.sku : '',
      category_id: form.category_id ? Number(form.category_id) : null,
      supplier_id: null,
      unit: form.unit || 'Unit',
      initial_stocks: editing ? {} : Object.fromEntries(Object.entries(form.initial_stocks || {}).map(([warehouseId, quantity]) => [warehouseId, Number(quantity || 0)])),
      min_stock: Number(form.min_stock || 15),
      purchase_price: Number(form.purchase_price || 0),
      selling_price: Number(form.selling_price || 0)
    }
    try {
      if (editing) await api.put(`/products/${editing.id}`, payload)
      else await api.post('/products', payload)
      await load()
    } catch {
      await load()
    } finally {
      setModal(false)
    }
  }

  async function remove(product) {
    if (!await confirmAction(`Hapus produk "${product.name}"? Data yang dihapus tidak bisa dikembalikan.`, { danger: true, confirmText: 'Hapus' })) return
    try {
      await api.delete(`/products/${product.id}`)
      await load()
    } catch {
      await load()
    }
  }

  async function exportPdf() {
    if (!await confirmAction('Export daftar produk ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/products/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'manajemen-produk.pdf')
  }

  function resetFilters() {
    setQuery('')
    setWarehouseFilter('')
    setStockStatusFilter('')
    setSearchParams({})
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Manajemen Produk"
        description="Kelola inventaris Anda dengan presisi dan efisiensi tinggi."
        action={<button className="btn-primary px-5 py-3 text-sm" onClick={openCreate}><Plus size={18} /> Tambah Produk</button>}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="card-static p-8 xl:col-span-8">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate">Total Nilai Stok</p>
              <h3 className="text-2xl font-extrabold tracking-tight text-navy md:text-3xl">Rp {formatNumber(totalInventoryValue)}</h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-soft text-navy">
              <TrendingUp size={25} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-full bg-background px-6 py-4">
              <p className="text-sm font-medium text-slate">Produk Aktif</p>
              <p className="text-lg font-extrabold text-navy">{formatNumber(products.length)}</p>
            </div>
            <div className="rounded-full bg-background px-6 py-4">
              <p className="text-sm font-medium text-slate">Kategori</p>
              <p className="text-lg font-extrabold text-navy">{formatNumber(categoryCount)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-navy p-8 text-white shadow-card xl:col-span-4">
          <div className="relative z-10">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Butuh Perhatian</p>
            <h3 className="mb-6 text-2xl font-extrabold leading-tight">Stok Sedikit & Habis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-full bg-white/10 px-4 py-3">
                <span className="font-bold">Stok Sedikit</span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-warning">{lowStock} Produk</span>
              </div>
              <div className="flex items-center justify-between rounded-full bg-white/10 px-4 py-3">
                <span className="font-bold">Stok Habis</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-danger">{outOfStock} Produk</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-blue-active/20 blur-3xl" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {warehouseTotals.map((warehouse) => (
          <div key={warehouse.id} className="rounded-xl bg-white p-5 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-slate">{warehouse.city || 'Gudang'}</p>
            <h3 className="mt-1 text-base font-extrabold text-navy">{warehouse.name}</h3>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold tabular-nums text-navy">{formatNumber(warehouse.quantity)}</p>
                <p className="text-xs font-semibold text-slate">{formatNumber(warehouse.productCount)} produk</p>
              </div>
              <button className="btn-secondary px-4 py-2 text-xs" onClick={() => setSelectedWarehouse(warehouse)}>Detail</button>
            </div>
          </div>
        ))}
      </section>

      <section id="inventory-list" className="card-static overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
          <h4 className="text-2xl font-extrabold text-navy">Daftar Inventaris</h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={20} />
              <input className="field h-12 w-full pl-12 sm:w-80" placeholder="Cari produk atau SKU..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="field h-12 w-full sm:w-52" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)} aria-label="Filter gudang">
              <option value="">Semua Gudang</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.city}</option>)}
            </select>
            <select className="field h-12 w-full sm:w-44" value={stockStatusFilter} onChange={(event) => setStockStatusFilter(event.target.value)} aria-label="Filter status barang">
              <option value="">Semua Status</option>
              <option value="safe">Tersedia</option>
              <option value="low">Sedikit</option>
              <option value="empty">Habis</option>
            </select>
            <button className="icon-button text-slate" onClick={resetFilters} aria-label="Reset filter"><Filter size={20} /></button>
            <button className="icon-button text-slate" onClick={exportPdf} aria-label="Export PDF produk"><Download size={20} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="bg-background text-xs font-bold uppercase tracking-wider text-slate">
                <th className="px-8 py-6">Produk</th>
                <th className="px-8 py-6">Kategori</th>
                <th className="px-8 py-6">SKU</th>
                <th className="px-8 py-6">Stok</th>
                <th className="px-8 py-6">Status Gudang</th>
                <th className="px-8 py-6 text-right">Harga</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50 bg-white">
              {loading && <tr><td colSpan="7" className="px-8 py-12 text-center text-slate">Memuat produk...</td></tr>}
              {!loading && filtered.map((product) => {
                const image = toImageUrl(product.image_url)
                const visibleStocks = filteredWarehouseStocks(product, stockStatusFilter, warehouseFilter)
                const stockBadges = (stockStatusFilter || warehouseFilter) ? visibleStocks : (product.warehouse_stocks || []).slice(0, 5)
                return (
                  <tr key={product.id} className="group transition hover:bg-background/70">
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-5">
                        {image ? (
                          <img src={image} alt={product.name} className="h-16 w-16 rounded-full bg-blue-soft object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-soft text-xl font-extrabold text-navy">{product.name.slice(0, 1)}</div>
                        )}
                        <div>
                          <p className="text-base font-extrabold leading-tight text-navy">{product.name}</p>
                          <p className="mt-1 font-mono text-xs font-bold text-navy">{displaySku(product)}</p>
                          <p className="mt-1 text-sm font-medium text-slate">{product.description || 'Inventory item'}</p>
                          {stockBadges.length > 0 && (
                            <div className="mt-3">
                              {(stockStatusFilter || warehouseFilter) && (
                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate">
                                  {stockStatusFilter === 'low' ? 'Stok sedikit di gudang' : stockStatusFilter === 'empty' ? 'Stok habis di gudang' : stockStatusFilter === 'safe' ? 'Stok tersedia di gudang' : 'Stok gudang'}
                                </p>
                              )}
                              <div className="flex max-w-xl flex-wrap gap-2">
                                {stockBadges.map((stock) => (
                                  <span key={stock.warehouse_id} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${stock.status === 'empty' ? 'bg-red-50 text-danger' : stock.status === 'low' ? 'bg-orange-50 text-warning' : 'bg-blue-soft text-navy'}`}>
                                    {stock.warehouse_name}: {formatNumber(stock.quantity)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-base text-slate">{product.category_name || 'Umum'}</td>
                    <td className="px-8 py-7 font-mono text-sm font-bold text-navy">{displaySku(product)}</td>
                    <td className="px-8 py-7 text-base font-semibold text-navy">{formatNumber(product.quantity)}<br /><span className="font-normal text-slate">{product.unit || 'Unit'}</span></td>
                    <td className="px-8 py-7">
                      <div className="flex max-w-[220px] flex-wrap gap-2">
                        {stockBadges.length > 0 ? stockBadges.map((stock) => {
                          const status = statusFromStock(stock.status)
                          return (
                            <span key={stock.warehouse_id} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status.className}`}>
                              {(stock.warehouse_name || 'Gudang').replace('Gudang ', '')}: {status.label}
                            </span>
                          )
                        }) : <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-danger">Belum Ada Stok</span>}
                      </div>
                    </td>
                    <td className="px-8 py-7 text-right text-base font-extrabold text-navy">Rp<br />{formatNumber(product.selling_price ?? product.price)}</td>
                    <td className="px-8 py-7">
                      <div className="flex justify-end gap-2 opacity-80 transition group-hover:opacity-100">
                        <button className="icon-button bg-blue-soft" onClick={() => openEdit(product)}><Edit2 size={18} /></button>
                        <button className="icon-button bg-red-50 text-danger" onClick={() => remove(product)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!loading && !filtered.length && <tr><td colSpan="7" className="px-8 py-12 text-center text-slate">Produk tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <ProductModal form={form} setForm={setForm} onClose={() => setModal(false)} onSubmit={submit} editing={editing} categories={categories} warehouses={warehouses} />}
      {selectedWarehouse && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-navy/40 px-4 py-6">
          <section className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-modal">
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate">{selectedWarehouse.city}</p>
                <h2 className="text-xl font-extrabold text-navy">Detail Stok {selectedWarehouse.name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedWarehouse(null)} aria-label="Tutup detail gudang"><X size={20} /></button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-background text-xs font-bold uppercase tracking-wide text-slate">
                  <tr>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4 text-right">Stok</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {selectedWarehouseStocks.map((item) => {
                    const statusClass = item.status === 'empty' ? 'bg-red-50 text-danger' : item.status === 'low' ? 'bg-orange-50 text-warning' : 'bg-blue-soft text-navy'
                    const statusLabel = item.status === 'empty' ? 'Habis' : item.status === 'low' ? 'Sedikit' : 'Tersedia'
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 font-bold text-navy">{item.name}</td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate">{item.sku}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-navy">{formatNumber(item.quantity)} <span className="text-xs font-semibold text-slate">{item.unit}</span></td>
                        <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>{statusLabel}</span></td>
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
