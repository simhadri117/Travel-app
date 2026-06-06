import mongoose from 'mongoose';

const DestinationImageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  placeId: { type: String },
  source: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const DestinationImage = mongoose.model('DestinationImage', DestinationImageSchema);
