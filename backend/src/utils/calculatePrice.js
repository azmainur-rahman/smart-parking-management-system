/**
 * Server-side Price Calculation Engine
 * Pricing is strictly determined on the server to prevent client-side tampering.
 */

const RATES = {
  HOURLY: {
    CAR: 50,
    MOTORCYCLE: 30,
    SUV: 80,
    MICROBUS: 90,
    PICKUP: 70,
    VAN: 70
  },
  DAILY: {
    CAR: 500,
    MOTORCYCLE: 300,
    SUV: 800,
    MICROBUS: 900,
    PICKUP: 700,
    VAN: 700
  }
};

const DEFAULT_SERVICE_CHARGE = 10;

export const calculatePrice = ({ vehicleType = 'CAR', durationType = 'HOURLY', duration = 1 }) => {
  const normalizedType = vehicleType.toUpperCase();
  const normalizedDurationType = durationType.toUpperCase();
  const parsedDuration = Math.max(1, Number(duration) || 1);

  const rateTable = RATES[normalizedDurationType] || RATES.HOURLY;
  const unitRate = rateTable[normalizedType] || rateTable.CAR;

  const basePrice = unitRate * parsedDuration;
  const serviceCharge = DEFAULT_SERVICE_CHARGE;
  const discount = 0;
  const total = basePrice + serviceCharge - discount;

  return {
    unitRate,
    basePrice,
    serviceCharge,
    discount,
    total
  };
};

export default calculatePrice;
