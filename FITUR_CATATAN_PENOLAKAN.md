# FITUR: Catatan Penolakan Booking & Event

## Ringkasan
Fitur ini memungkinkan admin untuk menambahkan catatan/alasan saat menolak booking atau request event, sehingga customer dapat mengetahui mengapa verifikasi mereka ditolak.

## Perubahan Database

### 1. Tabel `bookings` - Tambah kolom `catatan_admin`
- File: `server/config/database.sql`
- Kolom baru: `catatan_admin TEXT DEFAULT NULL`
- Penyimpanan alasan admin menolak booking

### 2. Tabel `events` - Tambah kolom `catatan_admin`
- File: `server/config/database.sql`
- Kolom baru: `catatan_admin TEXT DEFAULT NULL`
- Penyimpanan alasan admin menolak request event

## Scripts Migrasi

### Setup catatan_admin untuk bookings
```bash
cd server
node scripts/migrate-add-catatan-admin.js
```

### Setup catatan_admin untuk events
```bash
cd server
node scripts/migrate-add-event-catatan-admin.js
```

## Backend - Perubahan Kode

### 1. Booking Model (`server/models/booking.model.js`)
- **Update method `updateStatus()`**
  - Parameter baru: `catatan_admin` (opsional)
  - Menyimpan catatan saat status booking diubah menjadi 'rejected'

### 2. Booking Controller (`server/controllers/booking.controller.js`)
- **Update method `updateBookingStatus()`**
  - Validasi: jika status = 'rejected', maka `catatan_admin` wajib diisi
  - Respons error jika catatan kosong: "Catatan penolakan wajib diisi."
  - Mengirimkan catatan ke model saat update

### 3. Event Model (`server/models/event.model.js`)
- **Update method `updateStatus()`**
  - Parameter baru: `catatan_admin` (opsional)
  - Menyimpan catatan saat status event diubah menjadi 'rejected'

### 4. Event Controller (`server/controllers/event.controller.js`)
- **Update method `updateEventStatus()`**
  - Validasi: jika status = 'rejected', maka `catatan_admin` wajib diisi
  - Respons error jika catatan kosong: "Catatan penolakan wajib diisi."

## Frontend - Perubahan Kode

### 1. Services (`client/src/services/index.js`)
- **bookingService.updateStatus()**
  - Parameter baru: `catatan_admin`
  - Format: `updateStatus(id, status_booking, catatan_admin)`

- **eventService.updateStatus()**
  - Parameter baru: `catatan_admin`
  - Format: `updateStatus(id, status_event, catatan_admin)`

### 2. Admin - Kelola Booking (`client/src/pages/admin/ManageBookings.jsx`)
- **Fitur baru: Modal Reject**
  - Muncul saat admin klik tombol "Tolak"
  - Input textarea untuk catatan penolakan
  - Validasi: catatan wajib diisi
  - Toast notification saat booking ditolak

### 3. Admin - Kelola Event (`client/src/pages/admin/ManageEvents.jsx`)
- **Fitur baru: Modal Reject**
  - Muncul saat admin klik tombol "Tolak"
  - Input textarea untuk catatan penolakan
  - Validasi: catatan wajib diisi
  - Tampilan catatan di admin untuk referensi

### 4. Customer - Riwayat Booking (`client/src/pages/customer/BookingHistory.jsx`)
- **Tampilan Catatan Penolakan**
  - Alert box merah dengan icon info
  - Menampilkan "Alasan Penolakan" jika booking rejected
  - Hanya muncul jika `catatan_admin` ada

### 5. Customer - Status Event (`client/src/pages/customer/EventStatus.jsx`)
- **Tampilan Catatan Penolakan**
  - Alert box merah dengan icon info
  - Menampilkan "Alasan Penolakan" jika event rejected
  - Hanya muncul jika `catatan_admin` ada

## API Changes

### Booking Update Status
```
PUT /api/bookings/:id
{
  "status_booking": "rejected",
  "catatan_admin": "Jadwal tidak sesuai dengan ketersediaan studio"
}
```

### Event Update Status
```
PUT /api/events/:id
{
  "status_event": "rejected",
  "catatan_admin": "Terlalu banyak permintaan layanan untuk tanggal ini"
}
```

## Fitur Pengguna

### Admin - Menolak Booking
1. Buka halaman "Kelola Booking"
2. Klik tombol "Tolak" pada booking yang ingin ditolak
3. Modal muncul meminta alasan penolakan
4. Isi catatan penolakan (wajib)
5. Klik "Tolak Booking"
6. Booking ditolak dan catatan tersimpan

### Admin - Menolak Event
1. Buka halaman "Kelola Event"
2. Klik tombol "Tolak" pada event yang ingin ditolak
3. Modal muncul meminta alasan penolakan
4. Isi catatan penolakan (wajib)
5. Klik "Tolak Event"
6. Event ditolak dan catatan tersimpan

### Customer - Melihat Alasan Penolakan
1. Booking/Event yang ditolak akan menampilkan alert merah
2. Alert menunjukkan "Alasan Penolakan" dengan catatan dari admin
3. Customer dapat memahami mengapa booking/event mereka ditolak
4. Customer dapat melakukan rebooking atau request ulang dengan perbaikan

## Testing Checklist

- [x] Migration script berjalan tanpa error
- [x] Admin dapat menolak booking dengan catatan
- [x] Admin dapat menolak event dengan catatan
- [x] Catatan penolakan wajib diisi
- [x] Customer melihat catatan di halaman riwayat
- [x] Customer melihat catatan di halaman status event
- [x] Tampilan alert penolakan responsif
- [x] Data tersimpan di database dengan benar
