/**
 * Server-side Price Calculation Engine
 * Pricing is dynamically retrieved from database settings and strictly determined on the server.
 */

import PricingSetting from '../models/PricingSetting.js';

const DEFAULT_RATES = {
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

export const calculatePrice = async ({ vehicleType = 'CAR', durationType = 'HOURLY', duration = 1 }) => {
  const normalizedType = (vehicleType || 'CAR').toUpperCase();
  const normalizedDurationType = (durationType || 'HOURLY').toUpperCase();
  const parsedDuration = Math.max(1, Number(duration) || 1);

  let hourlyRates = { ...DEFAULT_RATES.HOURLY };
  let dailyRates = { ...DEFAULT_RATES.DAILY };
  let serviceCharge = DEFAULT_SERVICE_CHARGE;

  try {
    const setting = await PricingSetting.findOne().lean();
    if (setting) {
      if (setting.serviceCharge !== undefined && setting.serviceCharge !== null) {
        serviceCharge = Number(setting.serviceCharge);
      }
      if (setting.rates) {
        if (setting.rates.hourly) {
          Object.keys(setting.rates.hourly).forEach((k) => {
            const val = Number(setting.rates.hourly[k]);
            if (!isNaN(val)) hourlyRates[k.toUpperCase()] = val;
          });
        }
        if (setting.rates.daily) {
          Object.keys(setting.rates.daily).forEach((k) => {
            const val = Number(setting.rates.daily[k]);
            if (!isNaN(val)) dailyRates[k.toUpperCase()] = val;
          });
        }
      }
    }
  } catch (err) {
    console.warn('[calculatePrice] Error retrieving PricingSetting from DB, using defaults:', err.message);
  }

  const rateTable = normalizedDurationType === 'DAILY' ? dailyRates : hourlyRates;
  const unitRate = rateTable[normalizedType] ?? rateTable.CAR ?? 50;

  const basePrice = unitRate * parsedDuration;
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
