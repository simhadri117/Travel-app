import { Schema, model, Document, Types } from 'mongoose';

export interface IHomestay extends Document {
  name: string;
  description: string;
  address: string;
  city: string;
  price_per_night: number;
  photos: string[];
  amenities: string[];
  host_id: Types.ObjectId;
  status: 'pending' | 'approved';
  created_at: Date;
  updated_at: Date;
}

const HomestaySchema = new Schema<IHomestay>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, required: true },
  price_per_night: { type: Number, required: true },
  photos: { type: [String], default: [] },
  amenities: { type: [String], default: [] },
  host_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved'], default: 'approved' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Homestay = model<IHomestay>('Homestay', HomestaySchema);
