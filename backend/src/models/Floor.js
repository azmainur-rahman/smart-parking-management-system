import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema(
  {
    parkingLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: [true, 'Parking Location ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Floor name is required'],
      trim: true
    },
    floorNumber: {
      type: Number,
      required: [true, 'Floor number is required']
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee uniqueness of floor number per location
floorSchema.index({ parkingLocationId: 1, floorNumber: 1 }, { unique: true });

floorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Floor = mongoose.model('Floor', floorSchema);

export default Floor;
