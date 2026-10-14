# Smart Presensi GPS & Selfie

Aplikasi presensi pegawai berbasis web menggunakan Google Apps Script yang memanfaatkan teknologi GPS, geofencing, foto selfie, dan Google Sheets sebagai database utama. Aplikasi ini dirancang untuk membantu proses pencatatan kehadiran pegawai secara digital dengan validasi lokasi, pengaturan jam kerja, serta pengelolaan data presensi melalui dashboard admin.

Proyek ini dikembangkan berdasarkan kode awal `Code.gs` dan `Index.html` yang diperoleh dari Dr. EDDISSYAH PUTRA PANE, M. Kom., MTA, kemudian dapat dipelajari, disesuaikan, dan dikembangkan lebih lanjut sesuai kebutuhan.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Proyek](#struktur-proyek)
- [Alur Kerja Sistem](#alur-kerja-sistem)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi dan Konfigurasi](#instalasi-dan-konfigurasi)
- [Akun Demo](#akun-demo)
- [Struktur Google Sheets](#struktur-google-sheets)
- [Pengaturan Lokasi dan Jam Kerja](#pengaturan-lokasi-dan-jam-kerja)
- [Integrasi WhatsApp](#integrasi-whatsapp)
- [Keamanan Aplikasi](#keamanan-aplikasi)
- [Pemecahan Masalah](#pemecahan-masalah)
- [Kredit dan Atribusi](#kredit-dan-atribusi)
- [Lisensi](#lisensi)
- [Pengembangan Selanjutnya](#pengembangan-selanjutnya)

## Fitur Utama

### 1. Autentikasi Pengguna
- Login pegawai dan admin menggunakan NIP dan PIN.
- Pembagian hak akses berdasarkan peran pengguna.
- Pengelolaan data pengguna melalui Google Sheets.

### 2. Validasi Lokasi GPS
- Mengambil koordinat lokasi perangkat pengguna.
- Menghitung jarak antara lokasi pengguna dan titik koordinat kantor.
- Membatasi presensi berdasarkan radius kantor yang telah ditentukan.
- Menggunakan konsep geofencing untuk memastikan presensi dilakukan di area yang diizinkan.

### 3. Presensi Masuk dan Pulang
- Pencatatan waktu kehadiran pegawai.
- Validasi waktu presensi berdasarkan jadwal kerja.
- Penyimpanan status presensi dan informasi lokasi.
- Pencatatan durasi kerja apabila didukung oleh implementasi aplikasi.

### 4. Foto Selfie
- Menggunakan kamera perangkat untuk mengambil foto saat presensi.
- Menyimpan foto presensi ke Google Drive apabila fitur tersebut dikonfigurasi.
- Menyimpan tautan foto bersama catatan presensi.

### 5. Dashboard Admin
- Menampilkan statistik kehadiran.
- Melihat riwayat presensi pegawai.
- Melakukan pencarian dan penyaringan data berdasarkan tanggal, bulan, atau NIP sesuai fitur yang tersedia.

### 6. Penyimpanan Data
- Google Sheets sebagai database utama.
- Google Drive sebagai penyimpanan foto presensi.
- Pencatatan waktu, identitas pegawai, tipe presensi, status, lokasi, dan informasi pendukung lainnya.

### 7. Notifikasi WhatsApp (Opsional)
- Integrasi dengan layanan Fonnte API.
- Pengiriman notifikasi presensi melalui WhatsApp apabila token API telah dikonfigurasi.

> Catatan: Ketersediaan dan perilaku setiap fitur bergantung pada implementasi kode `Code.gs` dan `Index.html` yang digunakan.

## Teknologi yang Digunakan

| Teknologi | Fungsi |
| --- | --- |
| Google Apps Script | Backend dan logika aplikasi |
| Google Sheets | Penyimpanan data pengguna, pengaturan, dan presensi |
| Google Drive | Penyimpanan foto selfie |
| HTML | Struktur antarmuka aplikasi |
| CSS | Pengaturan tampilan aplikasi |
| JavaScript | Interaksi dan validasi pada sisi browser |
| Tailwind CSS | Membantu pembuatan antarmuka responsif apabila digunakan |
| Leaflet | Menampilkan peta interaktif apabila digunakan |
| Fonnte API | Integrasi notifikasi WhatsApp secara opsional |

## Struktur Proyek

Struktur berkas utama proyek:

```text
smart-presensi-gps-selfie/
├── Code.gs
├── Index.html
├── README.md
└── (Google Sheets / Google Drive yang digunakan oleh aplikasi)
```

### Keterangan
- `Code.gs`: berisi fungsi backend Google Apps Script, autentikasi, pengolahan data, validasi presensi, dan komunikasi dengan Google Sheets serta Google Drive.
- `Index.html`: berisi antarmuka aplikasi, formulir login, presensi, pengambilan selfie, dan dashboard sesuai implementasi yang tersedia.
- `README.md`: dokumentasi proyek, panduan instalasi, konfigurasi, dan informasi pengembangan.

Google Sheets dapat berisi beberapa lembar kerja yang dibuat atau digunakan oleh aplikasi, seperti `SETTINGS`, `USERS`, dan `ATTENDANCE_LOG`.

## Alur Kerja Sistem

1. Pengguna membuka aplikasi melalui URL Web App Google Apps Script.
2. Pengguna masuk menggunakan NIP dan PIN.
3. Sistem memverifikasi identitas serta peran pengguna.
4. Pengguna memberikan izin akses lokasi dan kamera.
5. Sistem memperoleh koordinat GPS dan memeriksa jaraknya dari lokasi kantor.
6. Pengguna mengambil foto selfie untuk keperluan presensi.
7. Sistem memvalidasi ketentuan presensi, termasuk lokasi dan waktu kerja.
8. Data presensi disimpan ke Google Sheets dan foto dapat disimpan ke Google Drive.
9. Admin dapat mengakses dashboard untuk memantau statistik dan riwayat presensi.

## Persyaratan Sistem

Sebelum menjalankan aplikasi, pastikan tersedia:

- Akun Google.
- Google Sheets untuk menyimpan data.
- Google Apps Script untuk menjalankan aplikasi web.
- Browser modern, seperti Google Chrome atau Microsoft Edge.
- Perangkat dengan GPS atau layanan lokasi yang tersedia.
- Kamera yang dapat diakses oleh browser.
- Koneksi internet.
- Akun Fonnte dan token API jika notifikasi WhatsApp akan digunakan.

## Instalasi dan Konfigurasi

### 1. Membuat Google Spreadsheet
1. Buka Google Sheets.
2. Buat spreadsheet baru.
3. Beri nama, misalnya `Database Smart Presensi`.
4. Simpan spreadsheet tersebut di Google Drive.

### 2. Membuka Google Apps Script
1. Buka spreadsheet yang telah dibuat.
2. Pilih menu `Extensions` → `Apps Script`.
3. Pada editor Apps Script, buka atau buat file `Code.gs`.
4. Masukkan kode backend aplikasi.
5. Buat file HTML melalui tombol tambah berkas, pilih `HTML`, lalu beri nama `Index`.
6. Masukkan kode antarmuka aplikasi ke dalam `Index.html`.
7. Simpan semua perubahan.

> Pastikan nama file HTML sesuai dengan nama yang dipanggil oleh fungsi `HtmlService` di dalam `Code.gs`.

### 3. Menghubungkan Spreadsheet
- Pastikan kode backend mengakses spreadsheet yang benar.
- Jika menggunakan skrip yang terikat langsung pada spreadsheet, aplikasi dapat memakai spreadsheet aktif jika implementasinya mendukung cara tersebut.
- Jika menggunakan spreadsheet berdasarkan ID, pastikan ID spreadsheet telah dikonfigurasi dengan benar pada kode backend.

### 4. Menjalankan Inisialisasi
1. Jika aplikasi menyediakan fungsi inisialisasi database, jalankan fungsi tersebut dari editor Apps Script.
2. Beri izin yang diperlukan untuk mengakses Google Sheets dan Google Drive.
3. Periksa hasil eksekusi melalui menu `Executions` jika terjadi kesalahan.
4. Pastikan lembar kerja, struktur kolom, dan data awal terbentuk sesuai implementasi kode.

### 5. Melakukan Deployment
1. Klik `Deploy` → `New deployment`.
2. Pilih jenis deployment `Web app`.
3. Tentukan identitas eksekusi sesuai kebutuhan aplikasi.
4. Atur siapa yang memiliki akses berdasarkan kebijakan organisasi.
5. Klik `Deploy`.
6. Selesaikan otorisasi yang diminta.
7. Salin URL Web App yang diberikan.
8. Buka URL tersebut melalui browser untuk pengujian.

> Penting: Pengaturan akses `Anyone` memungkinkan akses yang lebih luas. Jangan menggunakannya tanpa mempertimbangkan autentikasi, pembatasan akses, dan keamanan data pegawai. Gunakan pengaturan akses paling terbatas yang sesuai kebutuhan.

### 6. Melakukan Pengujian
Sebelum digunakan secara operasional, lakukan pengujian untuk memastikan:

- Login pegawai dan admin berfungsi.
- Data pengguna terbaca dengan benar.
- Izin lokasi dan kamera dapat diberikan.
- Validasi jarak kantor berjalan sesuai pengaturan.
- Jam masuk dan pulang diperiksa dengan benar.
- Data presensi tersimpan di Google Sheets.
- Foto tersimpan di Google Drive jika fitur aktif.
- Dashboard admin dapat menampilkan data yang sesuai.
- Notifikasi WhatsApp berjalan jika telah dikonfigurasi.

## Akun Demo

Jika kode awal masih menggunakan akun demo berikut, kredensial awalnya adalah:

| Peran | NIP | PIN |
| --- | --- | --- |
| Pegawai | 1001 | 1234 |
| Admin | 9999 | 1234 |

> Perhatian: Akun di atas hanya merupakan informasi akun demo yang tercantum pada dokumentasi awal. Pastikan akun tersebut benar-benar tersedia di database sebelum digunakan.

Ganti PIN demo dengan PIN unik sebelum aplikasi digunakan untuk kebutuhan sebenarnya. Jangan menggunakan kredensial demo sebagai kredensial operasional.

## Struktur Google Sheets

Aplikasi dirancang untuk menggunakan lembar kerja berikut apabila struktur tersebut diterapkan dalam kode backend.

### 1. SETTINGS
Menyimpan pengaturan lokasi kantor dan jam presensi.

| Kolom / Pengaturan | Keterangan |
| --- | --- |
| Office Lat | Latitude kantor |
| Office Lng | Longitude kantor |
| Radius (Meter) | Radius maksimal presensi |
| Masuk Mulai | Awal periode presensi masuk |
| Masuk Selesai | Akhir periode presensi masuk |
| Pulang Mulai | Awal periode presensi pulang |
| Pulang Selesai | Akhir periode presensi pulang |
| WA Token | Token Fonnte untuk notifikasi WhatsApp |

### 2. USERS
Menyimpan data pegawai dan admin.

| Kolom | Keterangan |
| --- | --- |
| NIP | Nomor induk pegawai |
| Nama | Nama lengkap pegawai |
| Role | Peran, misalnya Pegawai atau Admin |
| No WA | Nomor WhatsApp tujuan notifikasi |
| PIN | PIN login pengguna |

### 3. ATTENDANCE_LOG
Menyimpan riwayat presensi.

| Kolom | Keterangan |
| --- | --- |
| Timestamp | Waktu data presensi disimpan |
| NIP | NIP pegawai |
| Nama | Nama pegawai |
| Tipe | Jenis presensi, misalnya masuk atau pulang |
| Status | Hasil validasi, misalnya BERHASIL atau DITOLAK |
| Jarak (m) | Jarak ke kantor dalam meter |
| Latitude | Koordinat latitude lokasi presensi |
| Longitude | Koordinat longitude lokasi presensi |
| Foto URL | Tautan foto presensi |
| Durasi Kerja (Jam) | Durasi kerja jika dihitung |
| Transport (Rp) | Informasi transport jika diterapkan |

> Nama kolom dan format data perlu disesuaikan dengan kode backend. Jangan mengasumsikan semua kolom atau perhitungan sudah aktif hanya berdasarkan dokumentasi.

## Pengaturan Lokasi dan Jam Kerja

Pengaturan berikut dapat digunakan apabila telah didukung oleh implementasi aplikasi:

- Latitude kantor.
- Longitude kantor.
- Radius maksimal presensi dalam meter.
- Jam mulai dan berakhir presensi masuk.
- Jam mulai dan berakhir presensi pulang.

Gunakan koordinat kantor yang akurat dan uji radius dari beberapa titik di sekitar area kantor.

Perlu diperhatikan bahwa GPS browser dapat memiliki tingkat akurasi yang berbeda. Validasi koordinat juga tidak menjamin sepenuhnya bahwa pengguna benar-benar berada di lokasi yang dilaporkan perangkatnya.

## Integrasi WhatsApp

Notifikasi WhatsApp dapat diaktifkan menggunakan Fonnte API apabila fungsi integrasinya tersedia pada kode backend.

### Konfigurasi Token
1. Dapatkan token API dari layanan Fonnte melalui akun resmi Anda.
2. Buka proyek Google Apps Script.
3. Masuk ke `Project Settings`.
4. Cari bagian `Script Properties`.
5. Tambahkan properti berikut:

| Property | Value |
| --- | --- |
| `FONNTE_TOKEN` | Token API Fonnte milik Anda |

6. Simpan pengaturan.
7. Pastikan `Code.gs` membaca properti `FONNTE_TOKEN` dan menangani respons API dengan benar.
8. Lakukan pengujian menggunakan nomor yang telah memberikan persetujuan untuk menerima notifikasi.

> Jangan menuliskan token API langsung ke dalam `Index.html`, repository publik, atau dokumentasi yang dibagikan.

## Keamanan Aplikasi

Karena aplikasi menangani identitas pegawai, lokasi, foto wajah, dan riwayat kehadiran, aspek keamanan perlu diperhatikan sejak awal.

- Ganti PIN demo sebelum aplikasi digunakan secara nyata.
- Batasi akses terhadap spreadsheet dan folder Google Drive.
- Simpan token API di `Script Properties`, bukan pada kode frontend.
- Lakukan validasi autentikasi dan otorisasi pada backend.
- Jangan hanya mengandalkan validasi JavaScript di browser untuk menentukan apakah presensi sah.
- Validasi ulang lokasi, waktu, identitas pengguna, dan jenis presensi pada server.
- Pertimbangkan penggunaan hash PIN atau mekanisme autentikasi yang lebih aman.
- Hindari membagikan URL, token, foto, dan data pegawai tanpa izin.
- Terapkan kebijakan retensi serta penghapusan data yang sesuai.
- Dapatkan persetujuan dan berikan informasi yang memadai mengenai pemrosesan lokasi serta foto pegawai.
- Evaluasi risiko akses publik sebelum memilih pengaturan deployment.

> Foto selfie dan koordinat lokasi merupakan data yang perlu dilindungi. Pastikan akses, penyimpanan, dan penggunaannya sesuai dengan kebijakan organisasi serta ketentuan perlindungan data pribadi yang berlaku.

## Pemecahan Masalah

### Lokasi tidak terdeteksi
- Pastikan izin lokasi diberikan pada browser.
- Aktifkan layanan lokasi perangkat.
- Pastikan aplikasi dibuka melalui URL HTTPS yang didukung browser.
- Coba gunakan perangkat atau browser lain.
- Periksa apakah browser mengembalikan koordinat dan tingkat akurasi yang memadai.

### Kamera tidak dapat digunakan
- Pastikan izin kamera telah diberikan.
- Tutup aplikasi lain yang sedang menggunakan kamera.
- Periksa pengaturan izin situs di browser.
- Pastikan perangkat memiliki kamera yang berfungsi.

### Data presensi tidak tersimpan
- Periksa apakah spreadsheet yang digunakan sudah benar.
- Periksa izin akses Google Sheets.
- Pastikan nama sheet dan urutan kolom sesuai dengan kode backend.
- Periksa pesan kesalahan melalui menu `Executions` di Apps Script.
- Pastikan fungsi backend menerima dan memproses data yang dikirim dari frontend.

### Foto tidak tersimpan
- Periksa izin akses Google Drive.
- Pastikan fungsi unggah foto berjalan dengan benar.
- Periksa ukuran dan format foto.
- Pastikan folder tujuan dapat diakses oleh akun yang menjalankan skrip.
- Periksa apakah URL foto yang tersimpan sesuai hasil unggahan.

### Notifikasi WhatsApp tidak terkirim
- Pastikan `FONNTE_TOKEN` telah dikonfigurasi dengan benar.
- Periksa nomor tujuan dan format nomor telepon.
- Periksa respons API dan log eksekusi.
- Pastikan akun serta layanan Fonnte dapat digunakan.

## Kredit dan Atribusi

Dokumentasi dan proyek ini mencatat sumber kode awal sebagai berikut:

- Sumber kode awal: Dr. EDDISSYAH PUTRA PANE, M. Kom., MTA
- Berkas kode awal: `Code.gs`, `Index.html`
- Tujuan proyek: pembelajaran, pengembangan, dan penerapan sistem presensi pegawai berbasis web.

Pengembangan lanjutan, modifikasi, konfigurasi, dan kontribusi tambahan dapat dicantumkan secara terpisah sesuai pekerjaan yang benar-benar dilakukan.

Pencantuman nama ini merupakan bentuk atribusi terhadap sumber kode awal yang diinformasikan oleh penerima kode. Pencantuman tersebut tidak dengan sendirinya menyatakan bahwa seluruh versi hasil pengembangan dibuat, diperiksa, atau disahkan oleh beliau.

## Lisensi

Lisensi proyek mengikuti ketentuan yang ditetapkan oleh pemilik atau pemberi kode awal.

Sebelum memublikasikan, mendistribusikan, atau menggunakan kode untuk keperluan komersial, pastikan izin penggunaan dan distribusinya telah jelas. Dokumentasi ini tidak menetapkan lisensi baru atas kode sumber.

## Pengembangan Selanjutnya

Beberapa fitur yang dapat dipertimbangkan untuk pengembangan berikutnya:

- Rekapitulasi kehadiran harian, mingguan, dan bulanan.
- Ekspor laporan ke PDF atau Excel.
- Pengelolaan data pegawai melalui dashboard admin.
- Riwayat perubahan pengaturan.
- Pengelolaan cuti dan izin.
- Laporan keterlambatan dan ketidakhadiran.
- Peningkatan keamanan autentikasi.
- Validasi presensi ganda dan urutan masuk-pulang.
- Peningkatan pencatatan aktivitas admin.
- Integrasi dengan sistem HRD atau penggajian.

Fitur-fitur tersebut merupakan usulan pengembangan dan belum tentu tersedia pada versi kode saat ini.

---
