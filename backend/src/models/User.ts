import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  phone?: string;
  email?: string;
  name?: string;
  profile_photo_url?: string;
  bio?: string;
  home_city?: string;
  travel_preferences: string[];
  followers_count: number;
  following_count: number;
  posts_count: number;
  trips_count: number;
  badges: string[];
  role: 'traveler' | 'influencer' | 'guide' | 'agency' | 'admin';
  points: number;
  referral_code: string;
  referred_by?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, sparse: true },
  name: { type: String },
  profile_photo_url: { type: String, default: '' },
  bio: { type: String, default: '' },
  home_city: { type: String, default: '' },
  travel_preferences: { type: [String], default: [] },
  followers_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  posts_count: { type: Number, default: 0 },
  trips_count: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  role: { type: String, enum: ['traveler', 'influencer', 'guide', 'agency', 'admin'], default: 'traveler' },
  points: { type: Number, default: 0 },
  referral_code: { type: String, default: () => Math.random().toString(36).substring(2, 10).toUpperCase() },
  referred_by: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const User = model<IUser>('User', UserSchema);
