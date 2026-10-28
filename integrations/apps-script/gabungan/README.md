# Apps Script Gabungan EMAS Corp

Satu Web App ini menangani tiga alur:

- `GET ?type=job`: membaca tab `Lowongan` di spreadsheet rekrutmen.
- `POST` dengan `type=job`: operasi lowongan admin.
- `POST` dengan field kontak (`nama`, `wa`, `email`, `pesan`): menyimpan ke spreadsheet Kontak.
- `POST` payload lamaran: menyimpan lamaran ke spreadsheet rekrutmen dan dokumennya ke Google Drive.

## Konfigurasi sebelum dipasang

Di `Code.gs`, isi `SPREADSHEET_ID` untuk spreadsheet Lamaran/Lowongan, `CONTACT_SPREADSHEET_ID` untuk spreadsheet Kontak, `DRIVE_FOLDER_ID` untuk folder berkas pelamar, dan `FLYER_FOLDER_ID` untuk folder flyer.

Salin source ini ke Apps Script project yang dipakai. Aktifkan tampilan manifest `appsscript.json`, salin manifest dari folder ini, simpan, lalu deploy Web App dengan eksekusi sebagai akun pemilik dan akses siapa saja. Akun deployment harus memiliki akses ke kedua spreadsheet dan kedua folder Drive.

Setelah deploy, satu URL `/exec` dipakai untuk semua. Isi URL yang sama pada `RECRUITMENT_SCRIPT_URL` dan `CONTACT_SCRIPT_URL` di `js/config.js`. Jika memperbarui project yang sama, gunakan **Manage deployments → Edit → New version** agar deployment tetap mengarah ke kode terbaru.

Perhatian: karena Web App terbuka untuk publik, endpoint operasi admin lowongan harus diberi otorisasi sisi server sebelum digunakan untuk produksi. Login yang hanya ada di JavaScript browser tidak cukup untuk melindungi CRUD lowongan.