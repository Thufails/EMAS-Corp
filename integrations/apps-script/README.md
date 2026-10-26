# Integrasi Google Apps Script

Folder ini menyimpan salinan source backend Apps Script untuk website EMAS Corp. Apps Script menghubungkan formulir lamaran, formulir kontak, dan pengelolaan lowongan dengan Google Sheets dan Google Drive.

## Isi folder

- `Code.gs` — handler request, penyimpanan data, upload berkas, CRUD lowongan, dan pencatatan log.
- `appsscript.json` — manifest runtime, zona waktu, scope OAuth, dan konfigurasi akses Web App.

File dalam folder ini adalah salinan source untuk dokumentasi dan sinkronisasi. Perubahan di GitHub tidak otomatis mengubah project Apps Script online. Setelah mengubah kode, salin file ke editor Apps Script, simpan, lalu buat versi deployment baru.

## Sebelum memasang

1. Buat atau pilih satu Google Spreadsheet dan siapkan tab `Lamaran`, `Log Lamaran`, `Kontak`, `Log Kontak`, `Lowongan`, dan `Log Lowongan`.
2. Buat atau pilih folder utama Google Drive untuk dokumen lamaran.
3. Buat folder Drive terpisah untuk flyer lowongan, misalnya `Gambar Flyer`.
4. Di bagian konfigurasi `Code.gs`, ganti `PASTE_SPREADSHEET_ID_HERE`, `PASTE_DRIVE_FOLDER_ID_HERE`, dan `PASTE_FLYER_FOLDER_ID_HERE` dengan ID milik admin/pengelola. Folder flyer harus folder khusus seperti `Gambar Flyer`.
5. Di manifest Apps Script, aktifkan tampilan `appsscript.json`, lalu sesuaikan isinya dengan file manifest di folder ini. Persetujuan scope Drive dan Spreadsheet harus diberikan oleh akun pemilik deployment.

## Struktur tab Spreadsheet

### Lamaran

Gunakan header baris pertama dengan urutan:

`Waktu | Posisi | Nama | Email | Jenis Kelamin | Telepon | Tempat/Tanggal Lahir | Golongan Darah | Alamat | Link CV | Link KTP | Link KK | Link Portofolio`

Setiap pengiriman lamaran menyimpan satu baris. Link berkas mengarah ke file individual di subfolder pelamar pada Drive.

### Log Lamaran

Header: `Waktu | Status | Tahap / Pesan`.

### Kontak

Header: `Waktu | Nama | WhatsApp | Email | Pesan`.

### Log Kontak

Header: `Waktu | Status | Tahap / Pesan`.

### Lowongan

Header: `ID | Posisi | Kualifikasi | Gambar | Status`.

Status `TRUE` menampilkan lowongan pada halaman career; `FALSE` menyembunyikannya. Kolom kualifikasi mendukung beberapa baris.

### Log Lowongan

Header: `Waktu | Status | Tahap / Pesan`.

### Folder flyer lowongan

Unggahan flyer dari dashboard admin disimpan sebagai file JPG, PNG, atau WEBP maksimal 5 MB di folder Drive khusus yang ditetapkan lewat `FLYER_FOLDER_ID`. URL gambar yang dihasilkan Apps Script tetap ditulis di kolom `Gambar` pada tab `Lowongan`; tidak perlu menambah kolom spreadsheet. Form admin tetap mendukung URL/path yang sudah ada atau unggah file baru. Jika keduanya diisi, file baru yang diunggah menggantikan URL/path lama pada lowongan tersebut.

Apps Script dapat membuat tab dan header tertentu secara otomatis jika belum ditemukan. Menyiapkan tab lebih dulu memudahkan pengecekan struktur.

## Deploy Web App

1. Buka Google Spreadsheet, pilih **Ekstensi → Apps Script**.
2. Salin seluruh isi `Code.gs` ke project Apps Script.
3. Pastikan ID spreadsheet, folder lamaran, dan `FLYER_FOLDER_ID` sudah sesuai. Ganti placeholder `PASTE_FLYER_FOLDER_ID_HERE` dengan ID folder `Gambar Flyer`, yaitu bagian setelah `/folders/` pada URL Drive. Jangan menaruh ID produksi, token, password, atau kredensial akun di repo publik.
4. Pastikan manifest memuat scope Drive dan Spreadsheet. Simpan project dan setujui permintaan izin dari akun pemilik.
5. Pilih **Terapkan → Kelola deployment**, edit Web App yang digunakan, pilih **Versi baru**, lalu terapkan.
6. Gunakan URL deployment yang berakhiran `/exec` pada frontend. Jika deployment yang sama diedit, URL `/exec` tetap.
7. Uji formulir kontak, lamaran, dan CRUD lowongan. Periksa hasil di tab data, log, dan folder Drive.

## Alur yang ditangani

- `doPost(e)` membedakan request lamaran, kontak, dan lowongan.
- Lamaran divalidasi; CV/KTP/KK/portofolio disimpan dalam subfolder bernama `Nama - Posisi - Timestamp`, lalu link file dicatat di tab `Lamaran`.
- Kontak disimpan di tab `Kontak`.
- Lowongan dapat dibaca, ditambah, diedit, dihapus, atau diaktifkan/dinonaktifkan dari admin. Flyer bisa memakai URL/path lama atau diunggah ke folder `Gambar Flyer`; Apps Script membatasi unggahan ke JPG/PNG/WEBP maksimal 5 MB dan menyimpan tautannya di kolom `Gambar`.
- Flyer yang diunggah diberi izin `Anyone with the link – Viewer` supaya halaman karier publik dapat menampilkannya. Foldernya tetap dapat dibatasi; yang dibagikan adalah file flyer individual. Kebijakan Google Workspace dapat memblokir pembagian publik.
- Hasil tiap alur dicatat pada tab log yang sesuai.

## Akses dan keamanan

Manifest ini menggunakan `ANYONE_ANONYMOUS` agar formulir publik dan halaman career dapat memanggil Web App. Artinya endpoint dapat dipanggil siapa pun yang mengetahui URL. Login yang hanya diperiksa di JavaScript browser tidak melindungi aksi CRUD di server. Sebelum aplikasi digunakan untuk data produksi, batasi operasi admin di sisi server dengan autentikasi/otorisasi yang sesuai dan hindari menyimpan data rahasia di repository publik. Endpoint anonim saat ini juga dapat menerima unggahan flyer dan membuat file berizin tautan publik. Batas tipe/ukuran file mengurangi input yang tidak sesuai, tetapi tidak mencegah orang lain memanggil endpoint; amankan operasi admin di server sebelum penggunaan produksi.

ID spreadsheet dan kedua folder Drive pada `Code.gs` template sengaja berupa placeholder. Jangan menggantinya dengan ID produksi pada salinan repository publik.
