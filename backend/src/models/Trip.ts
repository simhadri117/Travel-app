import { Schema, model, Document, Types } from 'mongoose';

export interface ITrip extends Document {
  user_id: Types.ObjectId;
  members: Types.ObjectId[];
  name: string;
  destination: string;
  start_date: Date;
  end_date: Date;
  booking_ids: Types.ObjectId[];
  itinerary_id?: Types.ObjectId;
  journal_entries: Array<{
    id: string;
    date: Date;
    title: string;
    content: string;
    photo_urls: string[];
    voice_note_url?: string;
  }>;
  expense_logs: Array<{
    id: string;
    category: string;
    amount: number;
    date: Date;
    note?: string;
  }>;
  packing_list: Array<{
    id: string;
    item: string;
    category: string;
    checked: boolean;
    custom: boolean;
  }>;
  cover_photo_url?: string;
  share_token: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

const TripSchema = new Schema<ITrip>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  name: { type: String, required: true },
  destination: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  booking_ids: [{ type: Schema.Types.ObjectId, ref: 'Booking', default: [] }],
  itinerary_id: { type: Schema.Types.ObjectId, ref: 'Itinerary' },
  journal_entries: [{
    id: { type: String, required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    photo_urls: { type: [String], default: [] },
    voice_note_url: { type: String }
  }],
  expense_logs: [{
    id: { type: String, required: true },
    category: { type: String, enum: ['transport', 'accommodation', 'food', 'activities', 'misc'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String }
  }],
  packing_list: [{
    id: { type: String, required: true },
    item: { type: String, required: true },
    category: { type: String, default: 'General' },
    checked: { type: Boolean, default: false },
    custom: { type: Boolean, default: false }
  }],
  cover_photo_url: { type: String, default: '' },
  share_token: { type: String, required: true, unique: true },
  is_public: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Trip = model<ITrip>('Trip', TripSchema);
