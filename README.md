# 🎵 Soundville Music Studio — Sistem Informasi Manajemen Studio

Sistem Informasi Manajemen Studio Musik dan Layanan Event berbasis Web untuk **CV. Soundville Music Studio**.

---

## 📁 Struktur Proyek

```
soundville/
├── server/                      # Backend Node.js + Express
│   ├── config/
│   │   ├── database.js          # Koneksi MySQL (pool)
│   │   └── database.sql         # Skema & seed database
│   ├── controllers/             # Logic bisnis (MVC)
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   ├── event.controller.js
│   │   ├── eventService.controller.js
│   │   ├── payment.controller.js
│   │   ├── report.controller.js
│   │   ├── studio.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verifikasi & role guard
│   │   └── upload.middleware.js # Multer file upload
│   ├── models/                  # Query database
│   │   ├── booking.model.js
│   │   ├── event.model.js
│   │   ├── eventOrder.model.js
│   │   ├── eventService.model.js
│   │   ├── payment.model.js
│   │   ├── studio.model.js
│   │   └── user.model.js
│   ├── routes/                  # Endpoint API
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── event.routes.js
│   │   ├── eventService.routes.js
│   │   ├── payment.routes.js
│   │   ├── report.routes.js
│   │   ├── studio.routes.js
│   │   └── user.routes.js
│   ├── uploads/                 # Bukti transfer (auto-created)
│   ├── .env                     # Konfigurasi environment
│   ├── index.js                 # Entry point server
│   └── package.json
│
└── client/                      # Frontend React + Vite + Tailwind
    ├── src/
    │   ├── components/
    │   │   ├── booking/
    │   │   │   ├── BookingForm.jsx       # Form booking dengan cek jadwal
    │   │   │   └── CalendarSchedule.jsx  # Kalender bulanan interaktif
    │   │   ├── layout/
    │   │   │   ├── AdminLayout.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   └── Sidebar.jsx
    │   │   ├── studio/
    │   │   │   └── StudioCard.jsx
    │   │   └── ui/
    │   │       ├── LoadingSpinner.jsx
    │   │       └── StatusBadge.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx           # Auth state global
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx    # Statistik & grafik
    │   │   │   ├── ManageBookings.jsx
    │   │   │   ├── ManageEvents.jsx
    │   │   │   ├── ManagePayments.jsx
    │   │   │   ├── ManageStudios.jsx
    │   │   │   ├── ManageUsers.jsx
    │   │   │   └── Reports.jsx
    │   │   ├── customer/
    │   │   │   ├── BookingHistory.jsx
    │   │   │   ├── BookingPage.jsx
    │   │   │   ├── CustomerDashboard.jsx
    │   │   │   ├── EventRequest.jsx
    │   │   │   ├── EventStatus.jsx
    │   │   │   └── PaymentPage.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── StudioList.jsx
    │   │   └── StudioSchedule.jsx
    │   ├── services/
    │   │   ├── api.js            # Axios instance + interceptors
    │   │   └── index.js          # Service functions semua endpoint
    │   ├── App.jsx               # Routing & route guards
    │   ├── main.jsx
    │   └── index.css             # Tailwind + custom classes
    └── package.json
```

---

## 🚀 Cara Menjalankan

### 1. Setup Database

```sql
-- Jalankan file SQL ini di MySQL/phpMyAdmin
source server/config/database.sql
```

### 2. Setup Backend

```bash
cd server
npm install
# Edit .env sesuai konfigurasi MySQL kamu
npm run dev
```

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

---

## 🔑 Akun Default

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@soundville.com     | admin123  |

---

## 🌐 API Endpoints

| Method | Endpoint                      | Akses     | Deskripsi                        |
|--------|-------------------------------|-----------|----------------------------------|
| POST   | /api/auth/register            | Public    | Registrasi customer baru         |
| POST   | /api/auth/login               | Public    | Login & dapatkan JWT token       |
| GET    | /api/auth/me                  | Auth      | Data user yang sedang login      |
| GET    | /api/studios                  | Public    | Daftar semua studio              |
| POST   | /api/studios                  | Admin     | Tambah studio baru               |
| PUT    | /api/studios/:id              | Admin     | Update studio                    |
| DELETE | /api/studios/:id              | Admin     | Hapus studio                     |
| GET    | /api/bookings/schedule        | Public    | Jadwal harian studio             |
| GET    | /api/bookings/schedule/month  | Public    | Jadwal bulanan studio (kalender) |
| POST   | /api/bookings                 | Customer  | Buat booking baru                |
| GET    | /api/bookings                 | Admin     | Semua booking                    |
| GET    | /api/bookings/my              | Customer  | Booking milik sendiri            |
| PUT    | /api/bookings/:id             | Admin     | Update status booking            |
| POST   | /api/payments                 | Customer  | Upload bukti transfer            |
| GET    | /api/payments                 | Admin     | Semua pembayaran                 |
| PUT    | /api/payments/verify/:id      | Admin     | Verifikasi / tolak pembayaran    |
| POST   | /api/events                   | Customer  | Request event baru               |
| GET    | /api/events                   | Admin     | Semua event request              |
| GET    | /api/events/my                | Customer  | Event milik sendiri              |
| PUT    | /api/events/:id               | Admin     | Update status event              |
| GET    | /api/event-services           | Public    | Daftar layanan event             |
| POST   | /api/event-services           | Admin     | Tambah layanan event             |
| GET    | /api/users                    | Admin     | Semua user                       |
| GET    | /api/reports/dashboard        | Admin     | Statistik dashboard              |
| GET    | /api/reports/transactions     | Admin     | Laporan transaksi                |

---

## ✅ Fitur Utama

- ⚡ **Anti-Bentrok Jadwal** — Sistem otomatis mencegah booking bertabrakan menggunakan query SQL overlap detection
- 📅 **Kalender Interaktif** — Tampilan kalender bulanan dengan highlight tanggal yang sudah dipesan
- 💳 **Upload Bukti Transfer** — Customer upload foto/PDF, admin verifikasi
- 📊 **Dashboard Admin** — Statistik booking, revenue, event, dan studio terpopuler
- 🔒 **JWT Authentication** — Role-based access control (Admin / Customer)
- 🎨 **Dark Mode UI** — Tampilan modern dengan Tailwind CSS

---

## 🛠 Tech Stack

| Layer     | Teknologi                          |
|-----------|------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS       |
| Routing   | React Router v6                    |
| HTTP      | Axios                              |
| Forms     | React Hook Form + Yup              |
| Backend   | Node.js, Express.js                |
| Database  | MySQL (mysql2)                     |
| Auth      | JWT (jsonwebtoken), bcryptjs       |
| Upload    | Multer                             |
