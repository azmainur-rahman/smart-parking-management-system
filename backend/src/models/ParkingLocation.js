import mongoose from 'mongoose';

const parkingLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      unique: true,
      trim: true
    },
    address: {
      addressLine: {
        type: String,
        required: [true, 'Address line is required'],
        trim: true
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        default: 'Dhaka',
        trim: true
      },
      area: {
        type: String,
        required: [true, 'Area is required'],
        trim: true
      },
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    facilities: {
      type: [String],
      default: []
    },
    managerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

parkingLocationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const ParkingLocation = mongoose.model('ParkingLocation', parkingLocationSchema);

export default ParkingLocation;
