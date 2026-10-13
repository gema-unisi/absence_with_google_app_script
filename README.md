# Smart Presensi GPS & Selfie

Aplikasi presensi pegawai berbasis Google Apps Script yang memanfaatkan lokasi (GPS/geofencing), foto selfie, dan Google Sheets sebagai database utama. Aplikasi ini dibuat untuk kebutuhan absensi karyawan dengan fitur login pegawai/admin, validasi jarak kantor, pencatatan kehadiran, dan notifikasi WhatsApp.

## Fitur Utama

- Login pegawai dan admin menggunakan NIP + PIN
- Validasi lokasi berdasarkan koordinat kantor dan radius yang dapat diatur
- Absensi masuk dan pulang dengan pengecekan jam kerja
- Pengambilan foto selfie saat presensi
- Penyimpanan data ke Google Sheets
- Dashboard statistik admin
- Rekap dan filter log absensi per tanggal, bulan, atau NIP
- Notifikasi WhatsApp otomatis melalui Fonnte (opsional)
- Penyimpanan foto ke Google Drive

## Teknologi yang Digunakan

- Google Apps Script
- Google Sheets
- Google Drive
- HTML + JavaScript
- Tailwind CSS
- Leaflet (peta interaktif)
- Fonnte API (opsional untuk WhatsApp)

## Struktur Aplikasi

- `Code.gs` : backend Google Apps Script, logika presensi, autentikasi, pengolahan data
- `Index.html` : frontend aplikasi presensi yang di-render di browser
- `SETTINGS`, `USERS`, `ATTENDANCE_LOG` : sheet otomatis yang dibuat saat aplikasi dijalankan

## Alur Kerja Sistem

1. User membuka aplikasi web yang dipublish dari Google Apps Script.
2. User login dengan NIP dan PIN.
3. Sistem mengecek lokasi perangkat terhadap kantor.
4. User mengambil selfie dan mengirimkan data presensi.
5. Aplikasi menghitung jarak, validasi waktu, dan menyimpan log ke spreadsheet.
6. Admin dapat melihat statistik dan riwayat absensi.

## Persyaratan

- Akun Google
- Google Sheets
- Browser modern (Chrome/Edge)
- Akses lokasi perangkat aktif
- Kamera perangkat aktif saat absensi

## Setup Awal

### 1. Buat file Google Sheet baru
Buat spreadsheet baru di Google Drive.

### 2. Buka Apps Script
- Pilih menu `Extensions` > `Apps Script`
- Paste kode dari file `Code.gs`
- Paste template HTML dari file `Index.html` ke file `Index.html` di Apps Script

### 3. Jalankan aplikasi
- Tekan tombol `Deploy` > `New deployment`
- Pilih jenis `Web app`
- Atur `Execute as: Me`
- Atur `Who has access: Anyone`
- Salin URL deployment untuk diakses

### 4. Akses aplikasi
Buka URL web app yang sudah dibuat, kemudian login menggunakan akun default berikut:

- Pegawai: NIP `1001`, PIN `1234`
- Admin: NIP `9999`, PIN `1234`

## Sheet Otomatis yang Dibuat

Saat aplikasi pertama kali dijalankan, script akan otomatis membuat sheet berikut:

### `SETTINGS`
Berisi data lokasi kantor dan jam presensi:

- Office Lat
- Office Lng
- Radius (Meter)
- Masuk Mulai
- Masuk Selesai
- Pulang Mulai
- Pulang Selesai

### `USERS`
Berisi data pengguna:

- NIP
- Nama
- Role
- No WA
- PIN

### `ATTENDANCE_LOG`
Berisi riwayat absensi:

- Timestamp
- NIP
- Nama
- Tipe
- Status
- Jarak (m)
- Latitude
- Longitude
- Foto URL
- Durasi Kerja (Jam)
- Transport (Rp)

## Pengaturan Lokasi & Jam Kerja

Admin dapat mengubah:

- Latitude kantor
- Longitude kantor
- Radius maksimal absensi
- Jam masuk
- Jam pulang

Pengaturan ini disimpan di sheet `SETTINGS` dan dibaca otomatis oleh sistem.

## Notifikasi WhatsApp (Opsional)

Untuk mengaktifkan notifikasi WhatsApp, simpan token Fonnte di Google Apps Script dengan nama property:

- `FONNTE_TOKEN`

Caranya:

- Buka `Apps Script` > `Project Settings`
- Masuk ke bagian `Script Properties`
- Tambahkan property `FONNTE_TOKEN` dengan token dari Fonnte

## Catatan Penting

- Aplikasi memerlukan izin lokasi browser agar absensi bisa diverifikasi.
- Kamera harus diizinkan agar foto selfie dapat diambil.
- Penggunaan `Google Drive` dan `Google Sheets` tergantung izin akses akun Google yang dipakai.
- Untuk lingkungan produksi, sebaiknya ganti PIN default dan user demo sesuai kebutuhan.

## Keamanan

- Gunakan PIN yang unik untuk setiap pegawai.
- Batasi akses ke file Google Sheets dan Apps Script.
- Hindari membagikan URL deployment secara publik tanpa kebutuhan.
- Pastikan token Fonnte disimpan dengan aman.

## Lisensi

Proyek ini dibuat untuk kebutuhan internal dan dapat dimodifikasi sesuai kebutuhan organisasi.

## Penutup

Aplikasi ini dirancang untuk mempermudah proses absensi pegawai dengan pendekatan modern, cepat, dan responsif menggunakan ekosistem Google. Anda dapat mengembangkan fitur lebih lanjut seperti laporan bulanan, rekap otomatis, atau integrasi ke sistem HRD lainnya.
