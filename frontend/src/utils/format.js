export function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID')
}

export function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

export function errorMessage(error, fallback = 'Terjadi kesalahan') {
  return error?.response?.data?.detail || error?.message || fallback
}

export function stockStatus(quantity = 0, minStock = 5) {
  if (quantity <= 0) return { label: 'Stok Habis', className: 'bg-red-50 text-danger border-red-200' }
  if (quantity <= minStock) return { label: 'Sedikit', className: 'bg-orange-50 text-warning border-orange-200' }
  return { label: 'Tersedia', className: 'bg-green-50 text-success border-green-200' }
}
