import crypto from 'crypto';

/**
 * Generates an uppercase, human-readable booking identifier.
 * Format: SP-YYYYMMDD-XXXXXX (e.g., SP-20260928-8A3F2C)
 */
export const generateBookingNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `SP-${year}${month}${day}-${randomHex}`;
};

export default generateBookingNumber;
