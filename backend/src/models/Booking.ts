import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  user_id: Types.ObjectId;
  booking_type: 'flight' | 'train' | 'bus' | 'hotel' | 'homestay' | 'activity' | 'package';
  status: 'confirmed' | 'cancelled' | 'completed';
  booking_reference: string;
  provider_booking_id: string;
  journey_details: Record<string, any>;
  passengers: Array<{
    name: string;
    age: number;
    gender: string;
    seat_number?: string;
    berth_preference?: string;
    id_type?: string;
    id_number?: string;
  }>;
  amount_paid: number;
  payment_id: string;
  created_at: Date;
}

const BookingSchema = new Schema<IBooking>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  booking_type: { type: String, enum: ['flight', 'train', 'bus', 'hotel', 'homestay', 'activity', 'package'], required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
  booking_reference: { type: String, required: true },
  provider_booking_id: { type: String, required: true },
  journey_details: { type: Schema.Types.Map, of: Schema.Types.Mixed, required: true },
  passengers: [{
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    seat_number: { type: String },
    berth_preference: { type: String },
    id_type: { type: String },
    id_number: { type: String }
  }],
  amount_paid: { type: Number, required: true },
  payment_id: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Booking = model<IBooking>('Booking', BookingSchema);
