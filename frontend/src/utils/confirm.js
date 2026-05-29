export function confirmAction(message = 'Apakah Anda yakin ingin melanjutkan aksi ini?', options = {}) {
  return new Promise((resolve) => {
    const existing = document.getElementById('smartstock-confirm-modal')
    if (existing) existing.remove()

    const overlay = document.createElement('div')
    overlay.id = 'smartstock-confirm-modal'
    overlay.className = 'fixed inset-0 z-[100] grid place-items-center bg-navy/45 px-4 backdrop-blur-sm'

    const card = document.createElement('section')
    card.className = 'w-full max-w-md rounded-[2rem] border border-line bg-white p-6 shadow-modal'

    const title = document.createElement('h2')
    title.className = 'text-center text-xl font-extrabold text-navy'
    title.textContent = options.title || confirmationTitle(options.confirmText, message)

    const text = document.createElement('p')
    text.className = 'mt-3 text-center text-sm leading-6 text-slate'
    text.textContent = message

    const footer = document.createElement('div')
    footer.className = 'mt-7 flex justify-center gap-3'

    const cancelButton = document.createElement('button')
    cancelButton.type = 'button'
    cancelButton.className = 'btn-secondary'
    cancelButton.textContent = options.cancelText || 'Batal'

    const confirmButton = document.createElement('button')
    confirmButton.type = 'button'
    confirmButton.className = options.danger ? 'rounded-full bg-danger px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700' : 'btn-primary'
    confirmButton.textContent = options.confirmText || 'Ya, Lanjutkan'

    function close(value) {
      overlay.remove()
      resolve(value)
    }

    cancelButton.addEventListener('click', () => close(false))
    confirmButton.addEventListener('click', () => close(true))
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(false)
    })
    document.addEventListener('keydown', function onKeyDown(event) {
      if (event.key === 'Escape') {
        document.removeEventListener('keydown', onKeyDown)
        close(false)
      }
    })

    footer.append(cancelButton, confirmButton)
    card.append(title, text, footer)
    overlay.append(card)
    document.body.append(overlay)
    confirmButton.focus()
  })
}

function confirmationTitle(confirmText, message) {
  const actionText = (confirmText || '').trim()
  if (actionText) return `Konfirmasi ${actionText}`

  const normalized = (message || '').toLowerCase()
  if (normalized.includes('hapus')) return 'Konfirmasi Hapus'
  if (normalized.includes('upload')) return 'Konfirmasi Upload'
  if (normalized.includes('import')) return 'Konfirmasi Import'
  if (normalized.includes('export')) return 'Konfirmasi Export'
  if (normalized.includes('simpan')) return 'Konfirmasi Simpan'
  if (normalized.includes('tambah')) return 'Konfirmasi Tambah'
  if (normalized.includes('transfer')) return 'Konfirmasi Transfer'
  if (normalized.includes('keluar') || normalized.includes('logout')) return 'Konfirmasi Logout'

  return 'Konfirmasi Lanjutkan'
}
