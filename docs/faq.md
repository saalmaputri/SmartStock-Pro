# FAQ

1. Bagaimana cara login? Gunakan akun demo sesuai role.
2. Apakah data tersimpan permanen? Data demo tersimpan di SQLite lokal.
3. Apakah bisa import produk? Bisa melalui CSV di halaman Reports.
4. Apakah bisa export laporan? Bisa export PDF laporan stok.
5. Apa fungsi audit log? Mencatat aktivitas penting user.
6. Apa fungsi error log? Mencatat severity critical, warning, dan info.
7. Apakah stok otomatis dihitung? Ya, transaksi dan transfer mengubah stock balance.
8. Apakah bisa migrasi PostgreSQL? Bisa karena memakai SQLAlchemy ORM.
9. Apakah Viewer bisa mengubah data? Tidak, Viewer hanya memiliki akses baca.
10. Apakah monitoring real-time? MVP memakai dummy data yang berubah setiap request.
