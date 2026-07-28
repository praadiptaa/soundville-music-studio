/**
 * WhatsApp Reminder Utility for Soundville Studio Operators
 */

/**
 * Format nomor HP Indonesia ke format internasional (misal 0812... -> 62812...)
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }
  return cleaned
}

/**
 * Buat link WhatsApp API (wa.me) dengan pesan pengingat booking studio lengkap
 */
export const createOperatorWaReminderUrl = ({
  phone,
  operatorName = 'Operator',
  customerName = 'Customer',
  studioName = 'Studio Soundville',
  date = '',
  startTime = '',
  endTime = '',
  paymentStatus = '',
  paymentType = ''
}) => {
  const formattedPhone = formatPhoneNumber(phone)

  // Penentuan teks status pembayaran (DP vs Lunas)
  let statusText = '💳 DP (Uang Muka)'
  if (
    paymentType === 'lunas' ||
    paymentType === 'full_payment' ||
    paymentStatus === 'verified' ||
    paymentStatus === 'lunas'
  ) {
    statusText = '✅ LUNAS (Full Payment)'
  } else if (paymentType === 'dp') {
    statusText = '💳 DP (Uang Muka)'
  } else if (paymentStatus) {
    statusText = paymentStatus.toUpperCase()
  }

  const message = `Halo *${operatorName}*, pengingat jadwal dari Admin Soundville Studio 🎵:

📌 *INFORMASI BOOKING STUDIO*
👤 *Customer*: ${customerName}
🎸 *Pilihan Studio*: ${studioName}
📅 *Tanggal*: ${date}
⏰ *Jam Standby*: ${startTime} - ${endTime} WIB
💰 *Status Pembayaran*: ${statusText}

Mohon untuk segera hadir dan standby di studio Soundville tepat waktu ya. Terima kasih! 🙏`

  const encodedText = encodeURIComponent(message)
  return formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`
}

/**
 * Langsung buka WhatsApp di tab baru untuk mengirim reminder ke operator
 */
export const sendOperatorWaReminder = (params) => {
  const url = createOperatorWaReminderUrl(params)
  window.open(url, '_blank', 'noopener,noreferrer')
}
