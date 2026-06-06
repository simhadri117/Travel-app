import mongoose from 'mongoose';

const AttractionImageSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // cleaned search query representation
  imageUrl: { type: String, required: true },
  placeId: { type: String },
  source: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const AttractionImage = mongoose.model('AttractionImage', AttractionImageSchema);
