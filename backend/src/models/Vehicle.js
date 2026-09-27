import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    vehicleType: {
      type: String,
      enum: {
        values: ['CAR', 'MOTORCYCLE', 'SUV', 'MICROBUS', 'PICKUP', 'VAN'],
        message: '{VALUE} is not a supported vehicle type'
      },
      required: [true, 'Vehicle type is required'],
      uppercase: true,
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    color: {
      type: String,
      required: [true, 'Vehicle color is required'],
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      uppercase: true,
      trim: true
    },
    nickname: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      default: ''
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

// Compound unique index: User cannot register duplicate registration numbers
vehicleSchema.index({ userId: 1, registrationNumber: 1 }, { unique: true });

// Clean JSON representation
vehicleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
