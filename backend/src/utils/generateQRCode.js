/**
 * Generates a formatted QR code payload string for a parking reservation.
 *
 * @param {string|object} bookingNumberOrObj - Booking number string or options object
 * @param {string} [slotNumber] - Parking slot identifier (e.g. "A-101")
 * @param {Date|string} [startTime] - Reservation start timestamp
 * @param {Date|string} [endTime] - Reservation end timestamp
 * @returns {string} Formatted QR string payload
 */
export const generateQRCode = (
  bookingNumberOrObj,
  slotNumber,
  startTime,
  endTime
) => {
  let bNum = '';
  let slot = 'UNASSIGNED';
  let start = '';
  let end = '';

  if (typeof bookingNumberOrObj === 'object' && bookingNumberOrObj !== null) {
    bNum = bookingNumberOrObj.bookingNumber || '';
    slot = bookingNumberOrObj.slotNumber || bookingNumberOrObj.slot || 'UNASSIGNED';
    start = bookingNumberOrObj.startTime || '';
    end = bookingNumberOrObj.endTime || '';
  } else {
    bNum = bookingNumberOrObj || '';
    slot = slotNumber || 'UNASSIGNED';
    start = startTime || '';
    end = endTime || '';
  }

  const startIso = start instanceof Date ? start.toISOString() : String(start);
  const endIso = end instanceof Date ? end.toISOString() : String(end);
  const timeSegment = `${startIso}/${endIso}`;

  return `SP|${bNum}|${slot}|${timeSegment}`;
};

export default generateQRCode;
