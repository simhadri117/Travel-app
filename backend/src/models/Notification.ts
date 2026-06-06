import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user_id: Types.ObjectId;
  title: string;
  body: string;
  type: 'booking_confirmation' | 'check_in_reminder' | 'train_departure' | 'trip_start' | 'new_follower' | 'like' | 'comment' | 'itinerary_ready' | 'price_drop';
  read: boolean;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, required: true },
  read: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Notification = model<INotification>('Notification', NotificationSchema);
