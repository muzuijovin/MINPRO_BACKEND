# MINPRO Backend — Event Ticketing Platform

Backend REST API untuk platform tiket event (seperti loket.com / eventbrite). Ada dua role:

- **Customer**: mencari event, membeli tiket, upload bukti transfer, melihat riwayat transaksi, memberi review, menerima notifikasi status pembayaran.
- **Event Organizer (EO)**: membuat event & voucher, mengelola rekening, menerima / menolak pembayaran, melihat statistik penjualan, menerima notifikasi bukti bayar baru.

Semua harga dalam Rupiah (IDR).

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Menjalankan di Lokal](#menjalankan-di-lokal)
- [Environment Variables](#environment-variables)
- [Script & Perintah Prisma](#script--perintah-prisma)
- [Daftar Endpoint](#daftar-endpoint)
- [Alur Transaksi](#alur-transaksi)
- [Scheduler Auto-expire & Auto-cancel](#scheduler-auto-expire--auto-cancel)
- [Cara Kerja Notifikasi](#cara-kerja-notifikasi)
- [Testing dengan Postman](#testing-dengan-postman)
- [Format Response & Error](#format-response--error)
- [Deploy ke Vercel](#deploy-ke-vercel)

## Tech Stack

| Bagian | Library |
| --- | --- |
| Runtime & framework | Node.js, Express 5, TypeScript |
| Database & ORM | PostgreSQL (Supabase), Prisma 7 |
| Validasi | Zod 4 |
| Auth | JWT di cookie `token` (httpOnly), bcrypt |
| Upload gambar | Multer (memory) + Cloudinary |
| Email | Nodemailer |
| Scheduler | node-cron |

## Struktur Folder

```
prisma/
  schema.prisma          # skema database
  migrations/            # riwayat migration
  seed.ts                # data awal (kategori)
postman/
  transactions.postman_collection.json   # collection testing semua fitur
  panduan-testing-postman.pdf            # panduan langkah testing
src/
  server.ts              # setup express & daftar route
  application/app.ts     # entry point Vercel
  config/                # cors & prisma client
  errors/                # AppError
  features/<fitur>/      # route -> controller -> service per fitur
  jobs/                  # node-cron (auto-expire transaksi)
  lib/                   # bcrypt, jwt, cloudinary, nodemailer
  middleware/            # authenticate, authorize, upload, error handler
  validatiors/           # schema Zod per fitur
  validators/            # helper validate() + schema auth
```

Setiap fitur mengikuti pola yang sama:

- **route** — URL, middleware login & role.
- **controller** — validasi request dengan Zod, ambil user dari token, kirim response.
- **service** — logika bisnis & query Prisma.

## Menjalankan di Lokal

**Prasyarat:** Node.js 20+, npm, dan akses ke database PostgreSQL.

```bash
# 1. install dependency
npm install

# 2. buat file .env (lihat tabel Environment Variables di bawah)

# 3. generate Prisma Client
npx prisma generate

# 4. (opsional) isi data kategori
npx prisma db seed

# 5. jalankan server
npm run dev
```

Server berjalan di `http://localhost:<PORT><API_PREFIX>`, contoh `http://localhost:8000/api/v1`.

> **Database dipakai bersama tim.** Jangan menjalankan `prisma migrate reset` karena akan menghapus semua data. Kalau `migrate dev` menampilkan *drift detected*, pull dulu folder `prisma/migrations` terbaru dari teman.

## Environment Variables

Buat file `.env` di root project:

| Variable | Contoh | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | `development` | `app.listen` & node-cron hanya jalan saat `development` |
| `PORT` | `8000` | Port server lokal |
| `API_PREFIX` | `/api/v1` | Prefix semua route |
| `DATABASE_URL` | `postgresql://...` | Koneksi PostgreSQL (Supabase pooler) |
| `DIRECT_URL` | `postgresql://...` | Koneksi langsung untuk migration |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Origin FE yang diizinkan CORS |
| `JWT_SECRET_KEY` | string acak | Kunci tanda tangan JWT |
| `CRON_SECRET` | string acak panjang | Pengaman endpoint `POST /transactions/jobs/expire` |
| `CLOUDINARY_CLOUD_NAME` | | Akun Cloudinary untuk upload gambar |
| `CLOUDINARY_API_KEY` | | |
| `CLOUDINARY_API_SECRET` | | |
| `NODEMAILER_EMAIL` | `nama@gmail.com` | Email pengirim |
| `NODEMAILER_APP_PASSWORD` | | App password Gmail |

## Script & Perintah Prisma

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Jalankan server dengan nodemon (auto-restart) |
| `npm run build` | Compile TypeScript |
| `npx tsc --noEmit` | Cek error TypeScript tanpa build |
| `npx prisma generate` | Generate Prisma Client setelah `schema.prisma` berubah |
| `npx prisma migrate dev --name <nama>` | Buat & jalankan migration baru |
| `npx prisma studio` | Lihat / ubah isi database lewat browser |
| `npx prisma db seed` | Isi data kategori awal |

## Daftar Endpoint

Semua URL diawali `API_PREFIX` (contoh `/api/v1`). Login memakai cookie `token` yang di-set oleh `POST /auth/login` dan berlaku 15 menit.

Keterangan akses: **publik** = tanpa login, **login** = role apa saja yang sudah login.

### Auth

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| POST | `/auth/register/customer` | publik | Daftar sebagai customer |
| POST | `/auth/register/eo` | publik | Daftar sebagai EO |
| POST | `/auth/login` | publik | Login, set cookie `token` |
| GET | `/auth/me` | login | Data user yang sedang login |
| POST | `/auth/logout` | publik | Hapus cookie `token` |

### Kategori

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | `/categories` | publik | Daftar kategori. `?parentId=root` = kategori induk, `?search=`, pagination |
| GET | `/categories/tree` | publik | Kategori induk beserta sub-kategori |

### Event

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| POST | `/events` | EO | Buat event (form-data + file `coverImage`) |
| GET | `/events` | publik | Daftar event. Filter: `search`, `category`, `location`, `typePrice`, `format`, `organizerId`, `time` (`upcoming`/`past`/`all`), `sortBy`, `order`, pagination |
| GET | `/events/locations` | publik | Daftar lokasi unik untuk dropdown filter |
| GET | `/events/:slug` | publik | Detail event + voucher yang berlaku + rata-rata rating |
| PUT | `/events/:id` | EO pemilik | Update sebagian data event |
| DELETE | `/events/:id` | EO pemilik | Hapus event (soft delete) |

### Voucher

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| POST | `/vouchers` | EO pemilik event | Buat voucher untuk 1 event (kode unik per event, diskon 1–100%) |
| GET | `/vouchers` | publik | Daftar voucher. `?eventId=`, `?search=`, pagination |
| GET | `/vouchers/:id` | publik | Detail voucher |
| PUT | `/vouchers/:id` | EO pemilik event | Update voucher |
| DELETE | `/vouchers/:id` | EO pemilik event | Hapus voucher (soft delete) |

### Rekening Bank EO

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| POST | `/bank-accounts` | EO | Tambah rekening (langsung aktif) |
| GET | `/bank-accounts/me` | EO | Semua rekening milik EO |
| GET | `/bank-accounts/events/:eventId` | login | Rekening aktif milik EO pemilik event (dipilih customer saat checkout) |
| PATCH | `/bank-accounts/:id` | EO pemilik | Ubah / nonaktifkan rekening |

### Transaksi

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| POST | `/transactions` | customer | Checkout tiket |
| GET | `/transactions` | customer | Riwayat transaksi sendiri. `status`, `search`, `eventId`, `sortBy`, `order`, pagination |
| GET | `/transactions/organizer` | EO | Transaksi dari semua event milik EO (kelola & daftar peserta) |
| GET | `/transactions/:id` | customer pemilik / EO pemilik event | Detail transaksi |
| PATCH | `/transactions/:id/payment-proof` | customer pemilik | Upload bukti transfer (form-data `paymentProof`) |
| PATCH | `/transactions/:id/confirm` | EO pemilik event | `{"decision": "ACCEPTED"}` atau `"REJECTED"` |
| POST | `/transactions/jobs/expire` | header `x-cron-secret` | Jalankan auto-expire & auto-cancel |
| GET | `/payment-proofs/transactions/:transactionId` | customer / EO terkait | Riwayat bukti bayar 1 transaksi |

Body checkout:

```json
{
  "eventId": "uuid-event",
  "bankAccountId": "uuid-rekening",
  "quantity": 2,
  "eventVoucherId": "uuid-voucher (opsional)",
  "userCouponId": "uuid-coupon (opsional)",
  "pointUsed": 0
}
```

### Statistik EO

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | `/organizer/statistics` | EO | Ringkasan penjualan & data grafik. `groupBy` (`year`/`month`/`day`), `year`, `month`, `eventId` |

Hanya transaksi `PAID` yang dihitung sebagai penjualan. Tanggal dikelompokkan dalam WIB. Periode tanpa penjualan tetap muncul dengan nilai 0.

### Review

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| POST | `/reviews` | customer | Review event: `eventId`, `rating` (1–5), `comment` |
| GET | `/reviews` | publik | Daftar review `?eventId=` atau `?organizerId=`, dengan `averageRating` di `meta` |

Customer hanya bisa review event yang **sudah selesai** dan pernah ia hadiri (punya transaksi `PAID`), maksimal 1 review per event.

### Notifikasi

| Method | URL | Akses | Fungsi |
| --- | --- | --- | --- |
| GET | `/notifications` | login | Notifikasi milik sendiri, terbaru di atas. `?isRead=false`, pagination, `unreadCount` di `meta` |
| GET | `/notifications/unread-count` | login | Jumlah notifikasi belum dibaca (angka di ikon lonceng) |
| PATCH | `/notifications/:id/read` | pemilik notifikasi | Tandai 1 notifikasi sudah dibaca |
| PATCH | `/notifications/read-all` | login | Tandai semua notifikasi sudah dibaca |

Tidak ada endpoint untuk membuat notifikasi. Notifikasi dibuat otomatis oleh server, lihat bagian [Cara Kerja Notifikasi](#cara-kerja-notifikasi).

## Alur Transaksi

```
Checkout (POST /transactions)
  │  kursi, kuota voucher/coupon & poin langsung dipotong
  │
  ├─ total Rp0 (event gratis / diskon penuh) ──────────────► PAID (tiket langsung terbit)
  ▼
WAITING_FOR_PAYMENT ── tidak upload bukti dalam 10 menit ──► EXPIRED    ┐
  │ upload bukti                                                       │
  ▼                                                                    │ kursi, voucher,
WAITING_FOR_CONFIRMATION ── EO tidak merespons 3 hari ─────► CANCELLED  ├ coupon & poin
  │                                                                    │ dikembalikan
  ├─ EO REJECTED ──────────────────────────────────────────► REJECTED   ┘
  └─ EO ACCEPTED ──────────────────────────────────────────► PAID (tiket terbit)
```

**Perhitungan harga** (semuanya di server, tidak diterima dari FE):

1. `subtotal = harga tiket × quantity`. Harga tiket disimpan saat checkout, jadi perubahan harga event tidak mengubah transaksi lama.
2. Dikurangi diskon voucher dan diskon coupon (persentase dari `subtotal`).
3. Dikurangi poin (1 poin = Rp1, tidak boleh melebihi sisa tagihan). Poin dipotong dari lot yang paling cepat kedaluwarsa.
4. Hasilnya `finalAmount`.

**Race condition sudah ditangani.** Semua langkah checkout dibungkus satu `prisma.$transaction`. Kuota kursi, voucher, coupon dan poin hanya dipotong kalau masih cukup. Kalau sisa kursi 1 dan dua customer checkout bersamaan, hanya yang lebih dulu sampai ke database yang berhasil, dan yang lain mendapat `400 Seats are no longer available`. Perubahan status (upload bukti, accept, reject, expire) juga hanya jalan kalau statusnya masih sesuai, jadi tidak bisa diproses dua kali.

## Scheduler Auto-expire & Auto-cancel

Logikanya ada di `TransactionsServices.expireOverdueTransactions()`:

- `WAITING_FOR_PAYMENT` yang lewat `paymentDeadline` (10 menit) → `EXPIRED`
- `WAITING_FOR_CONFIRMATION` yang lewat `confirmationDeadline` (3 hari) → `CANCELLED`

Keduanya mengembalikan kursi, kuota voucher/coupon dan poin.

| Lingkungan | Cara jalan |
| --- | --- |
| Lokal (`npm run dev`) | node-cron di `src/jobs/transactions.job.ts` menjalankannya tiap menit secara otomatis |
| Production (Vercel) | Vercel serverless tidak bisa menjalankan node-cron. Buat job di [cron-job.org](https://cron-job.org) yang memanggil `POST <domain>/api/v1/transactions/jobs/expire` tiap menit dengan header `x-cron-secret: <CRON_SECRET>` |

## Cara Kerja Notifikasi

Notifikasi di aplikasi (ikon lonceng) disimpan di tabel `notifications`. Notifikasi dibuat otomatis oleh service transaksi lewat `NotificationsServices.createNotifications()`, di dalam `prisma.$transaction` yang sama dengan perubahan status. Jadi kalau perubahan status gagal, notifikasinya juga tidak tersimpan.

| Kejadian | Type | Penerima |
| --- | --- | --- |
| Customer upload bukti bayar | `PAYMENT_PROOF_UPLOADED` | EO pemilik event |
| EO accept | `PAYMENT_ACCEPTED` | Customer |
| EO reject | `PAYMENT_REJECTED` | Customer |
| Tidak upload bukti dalam 10 menit (cron) | `TRANSACTION_EXPIRED` | Customer |
| EO tidak merespons 3 hari (cron) | `TRANSACTION_CANCELLED` | Customer & EO |

Setiap notifikasi menyimpan `transactionId`, jadi FE bisa langsung membuka detail transaksi saat notifikasi diklik.

Karena backend berjalan di Vercel (serverless), WebSocket tidak bisa dipakai. FE cukup memanggil `GET /notifications/unread-count` secara berkala, misalnya tiap 30 detik, atau saat halaman dibuka.

## Testing dengan Postman

Semua fitur bisa dites dengan collection di folder [`postman/`](postman/):

1. Import `postman/transactions.postman_collection.json` ke Postman.
2. Isi variable `cronSecret` (sama dengan `CRON_SECRET` di `.env`). Variable lain sudah terisi atau terisi otomatis.
3. Ikuti langkah di [`postman/panduan-testing-postman.pdf`](postman/panduan-testing-postman.pdf).

Collection berisi 162 request dalam 18 folder (register, login, kategori, event, voucher, rekening, checkout, bukti bayar, accept, reject, cron, riwayat, detail, transaksi EO, statistik, review, notifikasi, hapus event). Setiap request punya test otomatis, jadi cukup cek tab **Test Results** semuanya hijau.

> **Catatan:** register EO belum otomatis membuat profil organizer. Sebelum testing, buat dulu baris di tabel `OrganizerProfiles` lewat `npx prisma studio` (langkahnya ada di PDF bagian A3).

## Format Response & Error

Response sukses:

```json
{
  "success": true,
  "message": "get transactions successfully",
  "data": [],
  "meta": { "page": 1, "totalPage": 1, "limit": 10, "totalTransactions": 0 }
}
```

`meta` hanya ada di endpoint yang memakai pagination.

Response error:

```json
{
  "success": false,
  "message": "Seats are no longer available",
  "data": {}
}
```

| Status | Arti |
| --- | --- |
| `400` | Request valid tapi ditolak aturan bisnis (kursi habis, event sudah mulai, status transaksi tidak sesuai) |
| `401` | Belum login, token kedaluwarsa, atau role tidak sesuai |
| `403` | Sudah login tapi bukan pemilik data |
| `404` | Data tidak ditemukan |
| `409` | Data bentrok (kode voucher sudah ada, sudah pernah review, poin sedang dipakai checkout lain) |
| `413` | File lebih dari 5 MB |
| `422` | Data request tidak lolos validasi Zod |

## Deploy ke Vercel

- Entry point: `src/application/app.ts` (diatur di `vercel.json`).
- Isi semua environment variable di dashboard Vercel → **Settings → Environment Variables**, termasuk `CRON_SECRET`.
- Setelah deploy, buat job cron-job.org seperti di bagian [Scheduler](#scheduler-auto-expire--auto-cancel).
