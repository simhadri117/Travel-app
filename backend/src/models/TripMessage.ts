import { Schema, model, Document, Types } from 'mongoose';

export interface ITripMessage extends Document {
  trip_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  message: string;
  media_url?: string;
  created_at: Date;
}

const TripMessageSchema = new Schema<ITripMessage>({
  trip_id: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  media_url: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const TripMessage = model<ITripMessage>('TripMessage', TripMessageSchema);
