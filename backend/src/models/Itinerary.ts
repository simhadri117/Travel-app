import { Schema, model, Document, Types } from 'mongoose';

export interface IItinerary extends Document {
  user_id: Types.ObjectId;
  destination: string;
  filters: Record<string, any>;
  generated_content: Record<string, any>;
  status: 'draft' | 'saved';
  trip_id?: Types.ObjectId;
  created_at: Date;
}

const ItinerarySchema = new Schema<IItinerary>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  destination: { type: String, required: true },
  filters: { type: Schema.Types.Map, of: Schema.Types.Mixed, required: true },
  generated_content: { type: Schema.Types.Map, of: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['draft', 'saved'], default: 'draft' },
  trip_id: { type: Schema.Types.ObjectId, ref: 'Trip' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Itinerary = model<IItinerary>('Itinerary', ItinerarySchema);
