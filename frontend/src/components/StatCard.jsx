export default function StatCard({ title, value, icon: Icon, tone = 'blue', badge, onClick }) {
  const tones = {
    blue: 'bg-blue-soft text-navy',
    green: 'bg-green-50 text-success',
    red: 'bg-red-50 text-danger',
    orange: 'bg-orange-50 text-warning'
  }

  const Component = onClick ? 'button' : 'section'

  return (
    <Component type={onClick ? 'button' : undefined} onClick={onClick} className={`card p-6 text-left ${onClick ? 'transition hover:-translate-y-0.5 hover:shadow-modal focus:outline-none focus:ring-2 focus:ring-navy/15' : ''}`}>
      <div className="mb-5 flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] ${tones[tone] || tones.blue}`}>
          {Icon && <Icon size={24} strokeWidth={2.2} />}
        </div>
        {badge && <span className="rounded-full bg-blue-soft px-3 py-1 text-xs font-bold text-navy">{badge}</span>}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate">{title}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-navy">{value}</p>
    </Component>
  )
}
