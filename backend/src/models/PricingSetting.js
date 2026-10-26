import mongoose from 'mongoose';

const pricingSettingSchema = new mongoose.Schema(
  {
    rates: {
      hourly: {
        car: { type: Number, default: 50 },
        motorcycle: { type: Number, default: 30 },
        suv: { type: Number, default: 80 },
        microbus: { type: Number, default: 90 },
        pickup: { type: Number, default: 70 },
        van: { type: Number, default: 70 }
      },
      daily: {
        car: { type: Number, default: 500 },
        motorcycle: { type: Number, default: 300 },
        suv: { type: Number, default: 800 },
        microbus: { type: Number, default: 900 },
        pickup: { type: Number, default: 700 },
        van: { type: Number, default: 700 }
      }
    },
    serviceCharge: {
      type: Number,
      default: 10
    },
    freeCancellationHours: {
      type: Number,
      default: 2
    }
  },
  {
    timestamps: true
  }
);

const PricingSetting = mongoose.model('PricingSetting', pricingSettingSchema);

export default PricingSetting;
