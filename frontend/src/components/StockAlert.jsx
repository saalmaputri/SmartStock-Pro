export default function StockAlert({ items = [], onSelect }) {
  const alerts = items

  return (
    <section className="card p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Stok Menipis</h2>
          <p className="text-sm text-slate">Produk menipis berdasarkan gudang.</p>
        </div>
        <div className="text-danger">!</div>
      </div>
      <div className="space-y-5">
        {!alerts.length && (
          <div className="rounded-lg bg-blue-soft p-4 text-sm font-medium text-slate">
            Tidak ada produk dengan status stok sedikit.
          </div>
        )}
        {alerts.slice(0, 5).map((item) => (
          <button key={`${item.product_name}-${item.warehouse}`} type="button" onClick={() => onSelect?.(item)} className="flex w-full items-center justify-between gap-4 rounded-lg bg-orange-50/70 p-4 text-left transition hover:bg-orange-50">
            <div>
              <p className="font-bold text-navy">{item.product_name}</p>
              <p className="text-sm font-semibold text-slate">{item.warehouse || 'Gudang'}</p>
              <p className="mt-1 text-xs text-slate">Minimum {item.min_stock}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-warning">Sisa {item.quantity}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
