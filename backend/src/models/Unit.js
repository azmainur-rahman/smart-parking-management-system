import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema(
  {
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Unit name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Unit code is required'],
      uppercase: true,
      trim: true
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

// Compound index to guarantee uniqueness of unit code per floor
unitSchema.index({ floorId: 1, code: 1 }, { unique: true });

unitSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;
