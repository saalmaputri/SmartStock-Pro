import { useEffect, useState } from 'react'
import { Activity, Gauge, MemoryStick, Server } from 'lucide-react'
import api from '../api/axios'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'

export default function Monitoring() {
  const [data, setData] = useState({ cpu: 42, memory: 68, response_time_ms: 95, uptime_status: 'Online' })

  useEffect(() => {
    function load() {
      api.get('/monitoring/resources')
        .then(({ data }) => setData(data))
        .catch(() => api.get('/monitoring').then(({ data }) => setData({ ...data, uptime_status: 'Online' })).catch(() => null))
    }
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  const metrics = [
    { label: 'CPU Usage', value: `${data.cpu}%`, icon: Gauge },
    { label: 'Memory Usage', value: `${data.memory}%`, icon: MemoryStick },
    { label: 'Response Time', value: `${data.response_time_ms} ms`, icon: Activity },
    { label: 'Uptime Status', value: data.uptime_status || 'Online', icon: Server }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Pemantauan Sumber Daya" description="Monitoring sederhana untuk CPU, memory, response time, dan status uptime." />
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => <StatCard key={item.label} title={item.label} value={item.value} icon={item.icon} />)}
      </section>
      <section className="card p-6">
        <h2 className="section-title">Pemantauan Sumber Daya</h2>
        {Number(data.response_time_ms || 0) > 200 && <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-warning">Response time melebihi threshold 200 ms.</div>}
        <div className="mt-6 grid gap-4">
          {metrics.slice(0, 3).map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex justify-between text-sm font-semibold text-navy"><span>{item.label}</span><span>{item.value}</span></div>
              <div className="h-2 rounded-full bg-blue-soft"><div className="h-2 rounded-full bg-navy" style={{ width: item.value.includes('%') ? item.value : '55%' }} /></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
