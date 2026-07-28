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
 * Buat link WhatsApp API (wa.me) dengan pesan pengingat booking studio
 */
export const createOperatorWaReminderUrl = ({
  phone,
  operatorName = 'Operator',
  customerName = 'Customer',
  studioName = 'Studio Soundville',
  date = '',
  startTime = '',
  endTime = ''
}) => {
  const formattedPhone = formatPhoneNumber(phone)
  const message = `Halo ${operatorName}, pesan dari Admin Soundville Studio 🎵:\n\nAda booking studio baru dari *${customerName}* untuk *${studioName}* pada tanggal *${date}* (Jam *${startTime} - ${endTime}*).\n\nMohon untuk segera standby di studio ya. Terima kasih! 🙏`
  
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
