import { useEffect, useMemo, useState } from 'react'
import { Download, Edit2, Filter, Plus, Search, Trash2, TrendingUp, X } from 'lucide-react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import { confirmAction } from '../utils/confirm'
import { downloadBlob } from '../utils/download'
import { formatNumber } from '../utils/format'

const dummyProducts = [
  { id: 1, sku: 'ELEC-SW-001', name: 'Smartwatch Zen V2', description: 'Wearables', category_name: 'Elektronik', quantity: 85, min_stock: 20, unit: 'Unit', purchase_price: 1800000, selling_price: 2499000 },
  { id: 2, sku: 'ELEC-HP-042', name: 'Headphone Noise Cancel', description: 'Audio Gear', category_name: 'Elektronik', quantity: 8, min_stock: 15, unit: 'Unit', purchase_price: 3300000, selling_price: 4150000 },
  { id: 3, sku: 'FASH-SN-099', name: 'Sneaker CloudWalk', description: 'Footwear', category_name: 'Fashion', quantity: 0, min_stock: 5, unit: 'Unit', purchase_price: 1200000, selling_price: 1850000 }
]

const emptyForm = {
  sku: '',
  name: '',
  category_id: '',
  supplier_id: '',
  description: '',
  unit: 'Unit',
  purchase_price: 0,
  selling_price: 0,
  min_stock: 5,
  image_url: ''
}

function ProductModal({ form, setForm, onClose, onSubmit, editing }) {
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
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/40 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-modal">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-navy">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button type="button" className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ['name', 'Nama Produk'],
            ['supplier_id', 'ID Supplier'],
            ['description', 'Deskripsi'],
            ['unit', 'Unit'],
            ['purchase_price', 'Harga Beli'],
            ['selling_price', 'Harga Jual'],
            ['min_stock', 'Stok Minimum']
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
            <span className="label">SKU</span>
            <input className="field cursor-not-allowed opacity-80" value={form.sku || 'Otomatis oleh sistem'} disabled />
          </label>
          <label className="grid gap-2">
            <span className="label">ID Kategori</span>
            <input className="field cursor-not-allowed opacity-80" value={form.category_id || 'Otomatis oleh sistem'} disabled />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="label">Gambar Produk</span>
            <input className="field py-2" type="file" accept="image/*" onChange={selectImage} />
            {preview && <img src={toImageUrl(preview)} alt="Preview produk" className="h-24 w-24 rounded-full object-cover" />}
          </label>
        </div>
        <div className="mt-7 flex justify-end gap-3">
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

function statusFor(product) {
  if (Number(product.quantity || 0) <= 0) return { label: 'Habis', className: 'bg-red-100 text-danger' }
  if (Number(product.quantity || 0) <= Number(product.min_stock || 5)) return { label: 'Stok Rendah', className: 'bg-orange-100 text-warning' }
  return { label: 'Tersedia', className: 'bg-blue-soft text-navy' }
}

export default function Products() {
  const [products, setProducts] = useState(dummyProducts)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/products')
      setProducts(data.map((item) => ({
        ...item,
        quantity: item.quantity ?? 0,
        unit: item.unit || 'Unit',
        category_name: item.category_name || item.category?.name || 'Umum'
      })))
    } catch {
      setProducts(dummyProducts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () => products.filter((item) => `${item.name} ${item.sku} ${item.category_name}`.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  )
  const lowStock = products.filter((item) => Number(item.quantity || 0) <= Number(item.min_stock || 5) && Number(item.quantity || 0) > 0).length
  const outOfStock = products.filter((item) => Number(item.quantity || 0) <= 0).length
  const totalInventoryValue = products.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.purchase_price || item.price || 0), 0)
  const categoryCount = new Set(products.map((item) => item.category_name || item.category_id || 'Umum')).size

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
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
      category_id: editing ? (form.category_id || null) : null,
      supplier_id: form.supplier_id || null,
      min_stock: Number(form.min_stock || 0),
      purchase_price: Number(form.purchase_price || 0),
      selling_price: Number(form.selling_price || 0)
    }
    try {
      if (editing) await api.put(`/products/${editing.id}`, payload)
      else await api.post('/products', payload)
      await load()
    } catch {
      setProducts((current) => editing
        ? current.map((item) => item.id === editing.id ? { ...item, ...payload } : item)
        : [{ id: Date.now(), ...payload, quantity: 0, category_name: 'Umum' }, ...current])
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
      setProducts((current) => current.filter((item) => item.id !== product.id))
    }
  }

  async function exportPdf() {
    if (!await confirmAction('Export daftar produk ke PDF?', { confirmText: 'Export PDF' })) return
    const response = await api.get('/products/pdf', { responseType: 'blob' })
    downloadBlob(response.data, 'manajemen-produk.pdf')
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Manajemen Produk"
        description="Kelola inventaris Anda dengan presisi dan efisiensi tinggi."
        action={<button className="btn-primary px-8 py-4 text-base" onClick={openCreate}><Plus size={22} /> Tambah Produk</button>}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="card-static p-8 xl:col-span-8">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate">Total Nilai Stok</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-navy md:text-4xl">Rp {formatNumber(totalInventoryValue)}</h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-soft text-navy">
              <TrendingUp size={25} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-full bg-background px-6 py-4">
              <p className="text-sm font-medium text-slate">Produk Aktif</p>
              <p className="text-xl font-extrabold text-navy">{formatNumber(products.length)}</p>
            </div>
            <div className="rounded-full bg-background px-6 py-4">
              <p className="text-sm font-medium text-slate">Kategori</p>
              <p className="text-xl font-extrabold text-navy">{formatNumber(categoryCount)}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-navy p-8 text-white shadow-card xl:col-span-4">
          <div className="relative z-10">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Butuh Perhatian</p>
            <h3 className="mb-6 text-2xl font-extrabold leading-tight">Stok Rendah & Habis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-full bg-white/10 px-4 py-3">
                <span className="font-bold">Stok Rendah</span>
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

      <section className="card-static overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
          <h4 className="text-2xl font-extrabold text-navy">Daftar Inventaris</h4>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={20} />
              <input className="field h-12 w-full pl-12 sm:w-80" placeholder="Cari produk atau SKU..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <button className="icon-button text-slate"><Filter size={20} /></button>
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
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Harga</th>
                <th className="px-8 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50 bg-white">
              {loading && <tr><td colSpan="7" className="px-8 py-12 text-center text-slate">Memuat produk...</td></tr>}
              {!loading && filtered.map((product) => {
                const status = statusFor(product)
                const image = toImageUrl(product.image_url)
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
                          <p className="mt-1 text-sm font-medium text-slate">{product.description || 'Inventory item'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-base text-slate">{product.category_name || 'Umum'}</td>
                    <td className="px-8 py-7 font-mono text-sm font-bold text-navy">{product.sku}</td>
                    <td className="px-8 py-7 text-base font-semibold text-navy">{formatNumber(product.quantity)}<br /><span className="font-normal text-slate">{product.unit || 'Unit'}</span></td>
                    <td className="px-8 py-7"><span className={`rounded-full px-5 py-2 text-sm font-bold ${status.className}`}>{status.label}</span></td>
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

      {modal && <ProductModal form={form} setForm={setForm} onClose={() => setModal(false)} onSubmit={submit} editing={editing} />}
    </div>
  )
}
