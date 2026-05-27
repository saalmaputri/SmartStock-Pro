# Rollback Plan

Rollback MVP lokal dilakukan dengan cara sederhana:

1. Matikan backend dan frontend.
2. Simpan salinan file `backend/smartstock.db` bila perlu investigasi.
3. Hapus `backend/smartstock.db` untuk kembali ke data awal seed.
4. Jalankan ulang backend agar database dan akun demo dibuat ulang.
5. Jika frontend bermasalah, jalankan `npm install` ulang lalu `npm run dev`.
