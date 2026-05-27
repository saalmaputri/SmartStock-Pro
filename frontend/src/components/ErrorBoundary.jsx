import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-6">
          <section className="card max-w-xl p-6">
            <h1 className="text-2xl font-extrabold text-navy">Frontend gagal dimuat</h1>
            <p className="mt-2 text-sm text-slate">Ada error runtime. Detail ini ditampilkan agar halaman tidak kosong putih.</p>
            <pre className="mt-4 overflow-auto rounded-xl bg-red-50 p-4 text-sm text-danger">{this.state.error.message}</pre>
            <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Muat Ulang</button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
