export default function LoadingState({ label = 'Memuat data...' }) {
  return (
    <div className="card-static flex items-center justify-center gap-3 p-8 text-slate">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-active border-t-navy" />
      {label}
    </div>
  )
}
