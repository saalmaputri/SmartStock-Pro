import { X } from 'lucide-react'

export default function Modal({ title, children, onClose, footer }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/40 px-4">
      <section className="w-full max-w-2xl rounded-[2rem] border-0 bg-white p-8 shadow-modal">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </section>
    </div>
  )
}
