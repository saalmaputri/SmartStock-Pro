export default function Badge({ children, tone = 'info' }) {
  const tones = {
    success: 'border-green-200 bg-green-50 text-success',
    warning: 'border-orange-200 bg-orange-50 text-warning',
    danger: 'border-red-200 bg-red-50 text-danger',
    info: 'border-line bg-blue-soft text-navy'
  }
  return <span className={`badge ${tones[tone] || tones.info}`}>{children}</span>
}
