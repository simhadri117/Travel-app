import { Schema, model, Document, Types } from 'mongoose';

export interface IPost extends Document {
  user_id: Types.ObjectId;
  media_urls: string[];
  media_types: string[]; // 'image' | 'video'
  caption: string;
  destination_tag?: string;
  trip_id?: Types.ObjectId;
  hashtags: string[];
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  likes_count: number;
  likes: Types.ObjectId[];
  comments_count: number;
  views_count: number;
  visibility: 'everyone' | 'followers' | 'private';
  created_at: Date;
}

const PostSchema = new Schema<IPost>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  media_urls: { type: [String], required: true },
  media_types: { type: [String], required: true },
  caption: { type: String, default: '' },
  destination_tag: { type: String },
  trip_id: { type: Schema.Types.ObjectId, ref: 'Trip' },
  hashtags: { type: [String], default: [] },
  location_coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  likes_count: { type: Number, default: 0 },
  likes: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  comments_count: { type: Number, default: 0 },
  views_count: { type: Number, default: 0 },
  visibility: { type: String, enum: ['everyone', 'followers', 'private'], default: 'everyone' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

export const Post = model<IPost>('Post', PostSchema);
