export default function StockAlert({ items = [], onSelect }) {
  const alerts = items

  return (
    <section className="card p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Alert Stok</h2>
          <p className="text-sm text-slate">Produk yang perlu segera dipantau.</p>
        </div>
        <div className="text-danger">!</div>
      </div>
      <div className="space-y-5">
        {!alerts.length && (
          <div className="rounded-[1.5rem] bg-blue-soft p-4 text-sm font-medium text-slate">
            Semua produk berada di atas batas stok minimum.
          </div>
        )}
        {alerts.slice(0, 5).map((item) => (
          <button key={`${item.product_name}-${item.warehouse}`} type="button" onClick={() => onSelect?.(item)} className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] bg-red-50/60 p-4 text-left transition hover:bg-red-50">
            <div>
              <p className="font-bold text-navy">{item.product_name}</p>
              <p className="text-sm text-slate">{item.warehouse}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-danger">Sisa {item.quantity}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
