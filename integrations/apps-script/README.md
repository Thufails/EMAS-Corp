# Setup Apps Script EMAS Corp (dua spreadsheet)

Backend website disiapkan terpisah:

- `lamaran/Code.gs`: form lamaran, upload dokumen ke Drive, daftar lowongan, serta CRUD lowongan admin. Hubungkan ke spreadsheet yang berisi tab `Lamaran`, `Log Lamaran`, `Lowongan`, dan `Log Lowongan`; isi `SPREADSHEET_ID`, `DRIVE_FOLDER_ID`, dan `FLYER_FOLDER_ID` di source ini.
- `kontak/Code.gs`: form pesan publik. Hubungkan ke spreadsheet yang berisi tab `Kontak` dan `Log Kontak`; isi `CONTACT_SPREADSHEET_ID`.

Untuk masing-masing spreadsheet: buka **Ekstensi → Apps Script**, tempel source dari folder terkait, isi ID spreadsheet/folder Drive, simpan, lalu deploy sebagai Web App. Deploy dengan akun yang punya akses edit ke spreadsheet dan folder Drive. Setelah memperoleh URL `/exec` masing-masing, masukkan satu kali ke `js/config.js`:

- `RECRUITMENT_SCRIPT_URL` = URL Web App Apps Script Lamaran.
- `CONTACT_SCRIPT_URL` = URL Web App Apps Script Kontak.

`js/config.js` dimuat oleh halaman yang menggunakan backend. URL endpoint tampil di browser; jangan taruh kata sandi, token privat, atau kredensial di sana. Source ini belum dideploy otomatis.