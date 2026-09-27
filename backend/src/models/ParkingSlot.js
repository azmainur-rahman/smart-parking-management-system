import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: [true, 'Parking Location ID is required'],
      index: true
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor ID is required'],
      index: true
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit ID is required'],
      index: true
    },
    slotNumber: {
      type: String,
      required: [true, 'Slot number is required'],
      uppercase: true,
      trim: true
    },
    vehicleTypes: {
      type: [String],
      enum: {
        values: ['CAR', 'MOTORCYCLE', 'SUV', 'MICROBUS', 'PICKUP', 'VAN'],
        message: '{VALUE} is not a valid vehicle type'
      },
      default: ['CAR']
    },
    position: {
      x: {
        type: Number,
        default: 0
      },
      y: {
        type: Number,
        default: 0
      }
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'DISABLED', 'MAINTENANCE'],
      default: 'AVAILABLE'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee uniqueness of slot number per unit & location
parkingSlotSchema.index(
  { locationId: 1, floorId: 1, unitId: 1, slotNumber: 1 },
  { unique: true }
);

parkingSlotSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

export default ParkingSlot;
